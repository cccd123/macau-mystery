from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GameContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class GameStartRequest(GameContractModel):
    script_id: str = Field(min_length=2, max_length=64, pattern=r"^[a-z][a-z0-9_]*$")


class GameMediaResponse(GameContractModel):
    video_url: str
    poster_url: str
    mime_type: str
    duration_ms: Optional[int] = None


class GamePreloadResponse(GameContractModel):
    scene_id: str
    media: GameMediaResponse


class GameChoiceResponse(GameContractModel):
    id: str
    text: str
    preload: GamePreloadResponse


class GameChapterResponse(GameContractModel):
    id: str
    title: str
    location: str


class GameSceneResponse(GameContractModel):
    id: str
    type: Literal["video", "ending"]
    chapter: GameChapterResponse
    media: GameMediaResponse
    choices: list[GameChoiceResponse]


class GameStoryResponse(GameContractModel):
    id: str
    title: str
    version: int


class GameClueResponse(GameContractModel):
    id: str
    title: str
    description: str
    icon: Optional[str] = None
    acquired_at: datetime


class GameProgressResponse(GameContractModel):
    current_chapter: int
    total_chapters: int


class GameEndingResponse(GameContractModel):
    id: str
    code: str


class GameSnapshot(GameContractModel):
    session_id: UUID
    status: Literal["active", "completed"]
    story: GameStoryResponse
    scene: GameSceneResponse
    clues: list[GameClueResponse]
    progress: GameProgressResponse
    awarded_clues: Optional[list[GameClueResponse]] = None
    ending: Optional[GameEndingResponse] = None


class ChoiceRequest(GameContractModel):
    session_id: UUID
    scene_id: str = Field(min_length=2, max_length=64, pattern=r"^[a-z][a-z0-9_]*$")
    choice_id: str = Field(min_length=2, max_length=64, pattern=r"^[a-z][a-z0-9_]*$")
    request_id: UUID


GameStartResponse = GameSnapshot
ChoiceResponse = GameSnapshot
GameState = GameSnapshot


class ChatRequest(BaseModel):
    npc_id: str
    message: str
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    audio_url: Optional[str] = None


class TtsResponse(BaseModel):
    audio_url: str
    text: str


class GenerateRequest(BaseModel):
    input: str
    style: str = "suspense"
    options: Optional[dict] = None


class GenerateResponse(BaseModel):
    script_id: str
    title: str
    chapters: list
    style: str
    era: str
    demo_mode: Optional[bool] = None


class ScriptMeta(BaseModel):
    id: str
    title: str
    description: str = ""
    status: str = "draft"
    chapters_count: int = 0
    players_count: int = 0
    created_at: str = ""


class ScriptCreateRequest(BaseModel):
    title: str
    description: str = ""
    data: Optional[dict] = None


class ScriptUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    data: Optional[dict] = None
    status: Optional[str] = None
