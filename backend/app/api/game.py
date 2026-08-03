"""Anonymous game API for the versioned immersive story runtime."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.game_service import GameService
from app.models import ChoiceRequest, ChoiceResponse, GameStartRequest, GameStartResponse, GameState


router = APIRouter()


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
