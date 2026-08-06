"""Anonymous game API for the versioned immersive story runtime."""
from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.db_models import Story, StoryVersion
from app.game_service import GameService
from app.models import ChoiceRequest, ChoiceResponse, GameStartRequest, GameStartResponse, GameState


router = APIRouter()


@router.get("/stories")
async def list_published_stories(
    session: AsyncSession = Depends(get_db_session),
) -> list[dict[str, Any]]:
    """Return all published stories with chapter locations and GPS coordinates."""
    result = await session.execute(
        select(Story).where(Story.status == "published", Story.active_version_id.isnot(None))
    )
    stories = result.scalars().all()
    output: list[dict[str, Any]] = []
    for story in stories:
        version = await session.get(StoryVersion, story.active_version_id)
        if not version or version.status != "published":
            continue
        content = version.content_json or {}
        chapters_info: list[dict[str, Any]] = []
        for ch in content.get("chapters", []):
            gps = ch.get("gps")
            chapters_info.append({
                "id": ch.get("id", ""),
                "title": ch.get("title", ""),
                "location": ch.get("location", ""),
                "gps": {"lat": gps["lat"], "lng": gps["lng"]} if gps else None,
            })
        output.append({
            "slug": story.slug,
            "title": story.title,
            "description": story.description or "",
            "chapters": chapters_info,
        })
    return output


@router.post("/start", response_model=GameStartResponse, response_model_exclude_none=True, status_code=201)
async def start_game(
    request: GameStartRequest,
    session: AsyncSession = Depends(get_db_session),
) -> GameStartResponse:
    return await GameService(session).start_game(request.script_id)


@router.post("/choice", response_model=ChoiceResponse, response_model_exclude_none=True)
async def make_choice(
    request: ChoiceRequest,
    session: AsyncSession = Depends(get_db_session),
) -> ChoiceResponse:
    return await GameService(session).make_choice(request)


@router.get("/state/{session_id}", response_model=GameState, response_model_exclude_none=True)
async def get_state(
    session_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> GameState:
    return await GameService(session).get_state(str(session_id))
