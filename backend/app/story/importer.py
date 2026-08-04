"""Story JSON validation, import, publication, and development bootstrap."""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal
from app.db_models import Story, StoryVersion
from app.story.contract import StoryDocument
from app.story.validator import StoryValidationResult, validate_story_data


SCRIPTS_DIR = Path(__file__).parent / "scripts"


class StoryImportValidationError(ValueError):
    def __init__(self, result: StoryValidationResult) -> None:
        super().__init__("story validation failed")
        self.result = result


@dataclass(frozen=True)
class StoryImportResult:
    story_id: str
    story_version_id: str
    version_number: int
    published: bool
    created: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "story_id": self.story_id,
            "story_version_id": self.story_version_id,
            "version_number": self.version_number,
            "published": self.published,
            "created": self.created,
        }


def load_story_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as source:
        return json.load(source)


def canonical_content_hash(document: StoryDocument) -> str:
    payload = json.dumps(
        document.model_dump(mode="json"), ensure_ascii=False, sort_keys=True, separators=(",", ":")
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def import_story_data(
    session: AsyncSession,
    data: dict[str, Any],
    *,
    publish: bool,
    allow_placeholder_media: bool,
) -> StoryImportResult:
    validation = validate_story_data(data, allow_placeholder_media=allow_placeholder_media)
    if not validation.valid:
        raise StoryImportValidationError(validation)

    document = StoryDocument.model_validate(data)
    content_hash = canonical_content_hash(document)
    now = datetime.now(timezone.utc)

    async with session.begin():
        story = await session.scalar(select(Story).where(Story.slug == document.story_id))
        if story is None:
            story = Story(
                slug=document.story_id,
                title=document.title,
                description=document.description,
                status="draft",
            )
            session.add(story)
            await session.flush()

        existing = await session.scalar(
            select(StoryVersion).where(
                StoryVersion.story_id == story.id,
                StoryVersion.content_hash == content_hash,
            )
        )
        if existing is not None:
            if publish:
                existing.status = "published"
                existing.published_at = existing.published_at or now
                story.title = document.title
                story.description = document.description
                story.status = "published"
                story.active_version_id = existing.id
            return StoryImportResult(
                story_id=story.id,
                story_version_id=existing.id,
                version_number=existing.version_number,
                published=existing.status == "published",
                created=False,
            )

        latest_number = await session.scalar(
            select(func.max(StoryVersion.version_number)).where(StoryVersion.story_id == story.id)
        )
        version = StoryVersion(
            story_id=story.id,
            version_number=(latest_number or 0) + 1,
            schema_version=document.schema_version,
            status="published" if publish else "draft",
            content_json=document.model_dump(mode="json"),
            content_hash=content_hash,
            published_at=now if publish else None,
        )
        session.add(version)
        await session.flush()

        story.title = document.title
        story.description = document.description
        if publish:
            story.status = "published"
            story.active_version_id = version.id

        return StoryImportResult(
            story_id=story.id,
            story_version_id=version.id,
            version_number=version.version_number,
            published=publish,
            created=True,
        )


async def import_story_file(
    session: AsyncSession,
    path: Path,
    *,
    publish: bool,
    allow_placeholder_media: bool,
) -> StoryImportResult:
    return await import_story_data(
        session,
        load_story_json(path),
        publish=publish,
        allow_placeholder_media=allow_placeholder_media,
    )


async def bootstrap_demo_story() -> StoryImportResult:
    async with SessionLocal() as session:
        return await import_story_file(
            session,
            SCRIPTS_DIR / "macau_mystery_demo.json",
            publish=True,
            allow_placeholder_media=True,
        )
