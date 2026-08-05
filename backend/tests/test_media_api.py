"""Admin media upload API and S3-compatible storage service coverage."""
from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from app.auth_service import create_auth_session, create_user
from app.config import get_settings
from app.db import create_database_engine, get_db_session
from app.db_models import Base
from app.object_storage import MediaValidationError, ObjectStorageService


class FakeS3Client:
    def __init__(self) -> None:
        self.objects: dict[str, dict] = {}
        self.bucket_exists = True
        self.created_bucket: dict | None = None
        self.bucket_policy: dict | None = None
        self.bucket_cors: dict | None = None

    def generate_presigned_url(self, operation, *, Params, ExpiresIn, HttpMethod):
        assert operation == "put_object"
        assert HttpMethod == "PUT"
        assert ExpiresIn == 900
        return f"http://localhost:9000/{Params['Bucket']}/{Params['Key']}?signed=yes"

    def head_object(self, *, Bucket, Key):
        del Bucket
        if Key not in self.objects:
            from botocore.exceptions import ClientError

            raise ClientError({"Error": {"Code": "404", "Message": "Not Found"}}, "HeadObject")
        return self.objects[Key]

    def head_bucket(self, *, Bucket):
        if not self.bucket_exists:
            from botocore.exceptions import ClientError

            raise ClientError({"Error": {"Code": "404", "Message": "Not Found"}}, "HeadBucket")
        return {}

    def create_bucket(self, **kwargs):
        self.created_bucket = kwargs
        self.bucket_exists = True

    def put_bucket_policy(self, *, Bucket, Policy):
        self.bucket_policy = {"bucket": Bucket, "policy": json.loads(Policy)}

    def put_bucket_cors(self, *, Bucket, CORSConfiguration):
        self.bucket_cors = {"bucket": Bucket, "configuration": CORSConfiguration}


@dataclass
class MediaHarness:
    client: TestClient
    engine: AsyncEngine
    admin_token: str
    user_token: str
    storage: FakeS3Client


@pytest.fixture
def media_api(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    database_url = f"sqlite+aiosqlite:///{(tmp_path / 'media_api.db').as_posix()}"
    engine = create_database_engine(database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    fake_s3 = FakeS3Client()

    async def prepare_database() -> tuple[str, str]:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with session_factory.begin() as session:
            admin = await create_user(
                session, username="media_admin", password="password1", nickname="Media Admin", role="admin"
            )
            user = await create_user(
                session, username="media_user", password="password1", nickname="Media User", role="user"
            )
            return await create_auth_session(session, admin), await create_auth_session(session, user)

    admin_token, user_token = asyncio.run(prepare_database())
    monkeypatch.setenv("BOOTSTRAP_DEMO_STORY", "false")
    monkeypatch.setenv("BOOTSTRAP_DEMO_USERS", "false")
    monkeypatch.setenv("OBJECT_STORAGE_ENABLED", "true")
    monkeypatch.setenv("S3_ENDPOINT_URL", "http://storage-internal:9000")
    monkeypatch.setenv("S3_PRESIGN_ENDPOINT_URL", "http://localhost:9000")
    monkeypatch.setenv("S3_ACCESS_KEY_ID", "access")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setenv("S3_BUCKET", "macau-media")
    monkeypatch.setenv("S3_REGION", "us-east-1")
    monkeypatch.setenv("S3_ADDRESSING_STYLE", "path")
    monkeypatch.setenv("MEDIA_PUBLIC_BASE_URL", "https://media.example.test")
    get_settings.cache_clear()
    monkeypatch.setattr("app.object_storage.boto3.client", lambda *args, **kwargs: fake_s3)

    from app.main import create_app

    application = create_app()

    async def override_get_db_session():
        async with session_factory() as session:
            yield session

    application.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(application) as client:
        yield MediaHarness(client, engine, admin_token, user_token, fake_s3)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_admin_can_create_upload_but_anonymous_and_user_cannot(media_api: MediaHarness) -> None:
    payload = {
        "kind": "video",
        "filename": "opening.mp4",
        "content_type": "video/mp4",
        "size_bytes": 2048,
    }
    anonymous = media_api.client.post("/api/v1/admin/media/uploads", json=payload)
    forbidden = media_api.client.post(
        "/api/v1/admin/media/uploads", json=payload, headers=auth(media_api.user_token)
    )
    created = media_api.client.post(
        "/api/v1/admin/media/uploads", json=payload, headers=auth(media_api.admin_token)
    )

    assert anonymous.status_code == 401
    assert forbidden.status_code == 403
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["object_key"].startswith("videos/")
    assert body["object_key"].endswith(".mp4")
    assert body["method"] == "PUT"
    assert body["headers"] == {"Content-Type": "video/mp4"}
    assert body["upload_url"].startswith("http://localhost:9000/macau-media/")
    assert body["public_url"].startswith("https://media.example.test/videos/")


def test_disabled_storage_returns_503_for_admin(
    media_api: MediaHarness, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("OBJECT_STORAGE_ENABLED", "false")
    get_settings.cache_clear()
    response = media_api.client.post(
        "/api/v1/admin/media/uploads",
        json={
            "kind": "video",
            "filename": "opening.mp4",
            "content_type": "video/mp4",
            "size_bytes": 2048,
        },
        headers=auth(media_api.admin_token),
    )
    assert response.status_code == 503
    monkeypatch.setenv("OBJECT_STORAGE_ENABLED", "true")
    get_settings.cache_clear()


@pytest.mark.parametrize(
    "payload",
    [
        {"kind": "video", "filename": "opening.webm", "content_type": "video/webm", "size_bytes": 10},
        {"kind": "video", "filename": "opening.mp4", "content_type": "text/plain", "size_bytes": 10},
        {
            "kind": "poster",
            "filename": "poster.png",
            "content_type": "image/png",
            "size_bytes": 10485761,
        },
    ],
)
def test_upload_request_rejects_invalid_media(media_api: MediaHarness, payload: dict) -> None:
    response = media_api.client.post(
        "/api/v1/admin/media/uploads", json=payload, headers=auth(media_api.admin_token)
    )
    assert response.status_code == 422


def test_complete_upload_validates_object_metadata(media_api: MediaHarness) -> None:
    created = media_api.client.post(
        "/api/v1/admin/media/uploads",
        json={
            "kind": "poster",
            "filename": "poster.webp",
            "content_type": "image/webp",
            "size_bytes": 512,
        },
        headers=auth(media_api.admin_token),
    ).json()
    object_key = created["object_key"]

    missing = media_api.client.post(
        "/api/v1/admin/media/uploads/complete",
        json={"object_key": object_key, "kind": "poster", "expected_size_bytes": 512},
        headers=auth(media_api.admin_token),
    )
    assert missing.status_code == 404

    media_api.storage.objects[object_key] = {
        "ContentLength": 511,
        "ContentType": "image/webp",
        "ETag": '"etag-value"',
    }
    mismatch = media_api.client.post(
        "/api/v1/admin/media/uploads/complete",
        json={"object_key": object_key, "kind": "poster", "expected_size_bytes": 512},
        headers=auth(media_api.admin_token),
    )
    assert mismatch.status_code == 409

    media_api.storage.objects[object_key]["ContentLength"] = 512
    completed = media_api.client.post(
        "/api/v1/admin/media/uploads/complete",
        json={"object_key": object_key, "kind": "poster", "expected_size_bytes": 512},
        headers=auth(media_api.admin_token),
    )
    assert completed.status_code == 200, completed.text
    assert completed.json() == {
        "object_key": object_key,
        "public_url": created["public_url"],
        "content_type": "image/webp",
        "size_bytes": 512,
        "etag": "etag-value",
        "status": "ready",
    }


def test_storage_service_rejects_kind_key_mismatch(media_api: MediaHarness) -> None:
    service = ObjectStorageService()
    with pytest.raises(MediaValidationError):
        service.complete_upload(
            object_key="videos/not-a-poster.webp", kind="poster", expected_size_bytes=10
        )


def test_local_storage_initialization_is_idempotent(media_api: MediaHarness) -> None:
    media_api.storage.bucket_exists = False
    service = ObjectStorageService()
    service.initialize_bucket(retries=1, delay_seconds=0)

    assert media_api.storage.created_bucket == {"Bucket": "macau-media"}
    assert media_api.storage.bucket_policy["bucket"] == "macau-media"
    statement = media_api.storage.bucket_policy["policy"]["Statement"][0]
    assert statement["Action"] == ["s3:GetObject"]
    assert statement["Resource"] == ["arn:aws:s3:::macau-media/*"]
    cors_rule = media_api.storage.bucket_cors["configuration"]["CORSRules"][0]
    assert cors_rule["AllowedMethods"] == ["GET", "HEAD", "PUT"]
    assert "http://localhost:3000" in cors_rule["AllowedOrigins"]
