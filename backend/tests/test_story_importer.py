"""Versioned JSON import behavior."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db import create_database_engine
from app.db_models import Base, Story, StoryVersion
from app.story.importer import import_story_data


DEMO_PATH = Path(__file__).resolve().parents[1] / "app" / "story" / "scripts" / "macau_mystery_demo.json"


def demo_data() -> dict:
    return json.loads(DEMO_PATH.read_text(encoding="utf-8"))


@pytest.mark.asyncio
async def test_import_creates_immutable_versions_and_deduplicates_content(tmp_path: Path) -> None:
    engine = create_database_engine(f"sqlite+aiosqlite:///{(tmp_path / 'stories.db').as_posix()}")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    try:
        async with session_factory() as session:
            first = await import_story_data(
                session, demo_data(), publish=True, allow_placeholder_media=True
            )
        assert first.created and first.published and first.version_number == 1

        async with session_factory() as session:
            duplicate = await import_story_data(
                session, demo_data(), publish=True, allow_placeholder_media=True
            )
        assert not duplicate.created
        assert duplicate.story_version_id == first.story_version_id

        revised = demo_data()
        revised["description"] = "更新后的技术演示剧情。"
        async with session_factory() as session:
            second = await import_story_data(
                session, revised, publish=True, allow_placeholder_media=True
            )
            story = await session.scalar(select(Story).where(Story.slug == "macau_mystery_demo"))
            versions = list(
                (await session.scalars(select(StoryVersion).order_by(StoryVersion.version_number))).all()
            )
        assert second.created and second.version_number == 2
        assert story is not None and story.active_version_id == second.story_version_id
        assert [version.version_number for version in versions] == [1, 2]
        assert versions[0].content_json["description"] != versions[1].content_json["description"]
    finally:
        await engine.dispose()
