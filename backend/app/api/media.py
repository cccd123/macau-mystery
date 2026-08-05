"""Admin-only media upload orchestration for S3-compatible storage."""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_service import require_admin
from app.db import get_db_session
from app.object_storage import (
    MediaValidationError,
    ObjectStorageDisabled,
    ObjectStorageError,
    ObjectStorageService,
    StoredObjectMismatch,
    StoredObjectNotFound,
)


router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
MediaKind = Literal["video", "poster"]


class UploadRequest(BaseModel):
    kind: MediaKind
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=100)
    size_bytes: int = Field(gt=0)


class UploadResponse(BaseModel):
    object_key: str
    method: Literal["PUT"] = "PUT"
    upload_url: str
    headers: dict[str, str]
    public_url: str
    expires_at: datetime


class CompleteUploadRequest(BaseModel):
    object_key: str = Field(min_length=3, max_length=512)
    kind: MediaKind
    expected_size_bytes: int = Field(gt=0)


class CompleteUploadResponse(BaseModel):
    object_key: str
    public_url: str
    content_type: str
    size_bytes: int
    etag: str
    status: Literal["ready"] = "ready"


async def _admin_storage(db: AsyncSession, authorization: str | None) -> ObjectStorageService:
    await require_admin(db, authorization)
    await db.commit()
    try:
        return ObjectStorageService()
    except (ObjectStorageDisabled, ObjectStorageError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/uploads", response_model=UploadResponse, status_code=201)
async def create_upload(
    request: UploadRequest,
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> UploadResponse:
    storage = await _admin_storage(db, authorization)
    try:
        target = storage.create_upload(
            kind=request.kind,
            filename=request.filename,
            content_type=request.content_type,
            size_bytes=request.size_bytes,
        )
    except MediaValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ObjectStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return UploadResponse(
        object_key=target.object_key,
        upload_url=target.upload_url,
        headers={"Content-Type": target.content_type},
        public_url=target.public_url,
        expires_at=target.expires_at,
    )


@router.post("/uploads/complete", response_model=CompleteUploadResponse)
async def complete_upload(
    request: CompleteUploadRequest,
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> CompleteUploadResponse:
    storage = await _admin_storage(db, authorization)
    try:
        stored = await asyncio.to_thread(
            storage.complete_upload,
            object_key=request.object_key,
            kind=request.kind,
            expected_size_bytes=request.expected_size_bytes,
        )
    except MediaValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except StoredObjectNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except StoredObjectMismatch as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ObjectStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return CompleteUploadResponse(
        object_key=stored.object_key,
        public_url=stored.public_url,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        etag=stored.etag,
    )
