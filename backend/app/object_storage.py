"""S3-compatible object storage used by local MinIO and public Cloudflare R2."""
from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.config import Settings, get_settings


MEDIA_RULES = {
    "video": {
        "prefix": "videos",
        "content_types": {".mp4": "video/mp4"},
        "max_size_setting": "media_max_video_bytes",
    },
    "poster": {
        "prefix": "posters",
        "content_types": {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        },
        "max_size_setting": "media_max_poster_bytes",
    },
}


class ObjectStorageError(RuntimeError):
    """Base error for storage failures that are safe to map at the API boundary."""


class ObjectStorageDisabled(ObjectStorageError):
    pass


class MediaValidationError(ObjectStorageError):
    pass


class StoredObjectNotFound(ObjectStorageError):
    pass


class StoredObjectMismatch(ObjectStorageError):
    pass


@dataclass(frozen=True)
class UploadTarget:
    object_key: str
    upload_url: str
    public_url: str
    content_type: str
    expires_at: datetime


@dataclass(frozen=True)
class StoredObject:
    object_key: str
    public_url: str
    content_type: str
    size_bytes: int
    etag: str


class ObjectStorageService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        if not self.settings.object_storage_enabled:
            raise ObjectStorageDisabled("Object storage is disabled")
        required = {
            "S3_ENDPOINT_URL": self.settings.s3_endpoint_url,
            "S3_PRESIGN_ENDPOINT_URL": self.settings.s3_presign_endpoint_url,
            "S3_ACCESS_KEY_ID": self.settings.s3_access_key_id,
            "S3_SECRET_ACCESS_KEY": self.settings.s3_secret_access_key,
            "S3_BUCKET": self.settings.s3_bucket,
            "MEDIA_PUBLIC_BASE_URL": self.settings.media_public_base_url,
        }
        missing = [name for name, value in required.items() if not value]
        if missing:
            raise ObjectStorageError(f"Missing object storage settings: {', '.join(missing)}")
        if self.settings.s3_addressing_style not in {"path", "virtual", "auto"}:
            raise ObjectStorageError("S3_ADDRESSING_STYLE must be path, virtual, or auto")

        self._client = self._new_client(self.settings.s3_endpoint_url)
        self._presign_client = self._new_client(self.settings.s3_presign_endpoint_url)

    def _new_client(self, endpoint_url: str):
        return boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=self.settings.s3_access_key_id,
            aws_secret_access_key=self.settings.s3_secret_access_key,
            region_name=self.settings.s3_region,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": self.settings.s3_addressing_style},
            ),
        )

    def create_upload(self, *, kind: str, filename: str, content_type: str, size_bytes: int) -> UploadTarget:
        extension = self._validate_media(kind, filename, content_type, size_bytes)
        rule = MEDIA_RULES[kind]
        object_key = f"{rule['prefix']}/{uuid.uuid4()}{extension}"
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=self.settings.media_upload_ttl_seconds
        )
        try:
            upload_url = self._presign_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.settings.s3_bucket,
                    "Key": object_key,
                    "ContentType": content_type,
                },
                ExpiresIn=self.settings.media_upload_ttl_seconds,
                HttpMethod="PUT",
            )
        except (BotoCoreError, ClientError) as exc:
            raise ObjectStorageError("Unable to create upload URL") from exc
        return UploadTarget(
            object_key=object_key,
            upload_url=upload_url,
            public_url=self.public_url(object_key),
            content_type=content_type,
            expires_at=expires_at,
        )

    def complete_upload(self, *, object_key: str, kind: str, expected_size_bytes: int) -> StoredObject:
        rule = MEDIA_RULES.get(kind)
        if rule is None:
            raise MediaValidationError("Unsupported media kind")
        if not object_key.startswith(f"{rule['prefix']}/"):
            raise MediaValidationError("Object key does not match media kind")
        extension = Path(object_key).suffix.lower()
        expected_content_type = rule["content_types"].get(extension)
        if expected_content_type is None:
            raise MediaValidationError("Object key has an unsupported extension")
        maximum = getattr(self.settings, rule["max_size_setting"])
        if expected_size_bytes < 1 or expected_size_bytes > maximum:
            raise MediaValidationError("Expected object size is outside the allowed range")

        try:
            metadata = self._client.head_object(Bucket=self.settings.s3_bucket, Key=object_key)
        except ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code in {"404", "NoSuchKey", "NotFound"}:
                raise StoredObjectNotFound("Uploaded object was not found") from exc
            raise ObjectStorageError("Unable to inspect uploaded object") from exc
        except BotoCoreError as exc:
            raise ObjectStorageError("Unable to inspect uploaded object") from exc

        actual_size = int(metadata.get("ContentLength", -1))
        actual_content_type = str(metadata.get("ContentType", "")).lower()
        if actual_size != expected_size_bytes or actual_content_type != expected_content_type:
            raise StoredObjectMismatch("Uploaded object metadata does not match the request")
        return StoredObject(
            object_key=object_key,
            public_url=self.public_url(object_key),
            content_type=actual_content_type,
            size_bytes=actual_size,
            etag=str(metadata.get("ETag", "")).strip('"'),
        )

    def public_url(self, object_key: str) -> str:
        encoded_key = quote(object_key, safe="/")
        return f"{self.settings.media_public_base_url}/{encoded_key}"

    def check(self) -> bool:
        try:
            self._client.head_bucket(Bucket=self.settings.s3_bucket)
            return True
        except (BotoCoreError, ClientError):
            return False

    def initialize_bucket(self, *, retries: int = 30, delay_seconds: float = 1.0) -> None:
        last_error: Exception | None = None
        for _attempt in range(retries):
            try:
                self._ensure_bucket_and_policy()
                return
            except (BotoCoreError, ClientError) as exc:
                last_error = exc
                time.sleep(delay_seconds)
        raise ObjectStorageError("Object storage did not become ready") from last_error

    def _ensure_bucket_and_policy(self) -> None:
        try:
            self._client.head_bucket(Bucket=self.settings.s3_bucket)
        except ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code not in {"404", "NoSuchBucket", "NotFound"}:
                raise
            create_args = {"Bucket": self.settings.s3_bucket}
            if self.settings.s3_region != "us-east-1":
                create_args["CreateBucketConfiguration"] = {
                    "LocationConstraint": self.settings.s3_region
                }
            self._client.create_bucket(**create_args)

        public_read_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadMedia",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{self.settings.s3_bucket}/*"],
                }
            ],
        }
        self._client.put_bucket_policy(
            Bucket=self.settings.s3_bucket,
            Policy=json.dumps(public_read_policy, separators=(",", ":")),
        )
        self._client.put_bucket_cors(
            Bucket=self.settings.s3_bucket,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedHeaders": ["*"],
                        "AllowedMethods": ["GET", "HEAD", "PUT"],
                        "AllowedOrigins": list(self.settings.media_cors_origins),
                        "ExposeHeaders": [
                            "ETag",
                            "Content-Length",
                            "Content-Range",
                            "Accept-Ranges",
                        ],
                        "MaxAgeSeconds": 3600,
                    }
                ]
            },
        )

    def _validate_media(self, kind: str, filename: str, content_type: str, size_bytes: int) -> str:
        rule = MEDIA_RULES.get(kind)
        if rule is None:
            raise MediaValidationError("Unsupported media kind")
        extension = Path(filename).suffix.lower()
        expected_content_type = rule["content_types"].get(extension)
        if expected_content_type is None:
            raise MediaValidationError("Unsupported file extension")
        if content_type.lower() != expected_content_type:
            raise MediaValidationError("Content type does not match file extension")
        maximum = getattr(self.settings, rule["max_size_setting"])
        if size_bytes < 1 or size_bytes > maximum:
            raise MediaValidationError(f"File size must be between 1 and {maximum} bytes")
        return extension


async def object_storage_health() -> str:
    settings = get_settings()
    if not settings.object_storage_enabled:
        return "disabled"
    try:
        service = ObjectStorageService(settings)
        return "ok" if await asyncio.to_thread(service.check) else "unavailable"
    except ObjectStorageError:
        return "unavailable"
