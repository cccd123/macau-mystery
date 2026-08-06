from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class GenerateOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    era: Literal["qing", "ming", "modern", "fantasy"] = "qing"
    acts: Literal[3, 5, 7] = 3
    custom_prompt: Optional[str] = Field(default=None, max_length=1000)


class GenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    input: str = Field(min_length=1, max_length=500)
    style: Literal["suspense", "romance", "comedy", "tragedy"] = "suspense"
    options: GenerateOptions = Field(default_factory=GenerateOptions)

    @field_validator("input")
    @classmethod
    def require_non_blank_input(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("input cannot be blank")
        return normalized

    @field_validator("options", mode="before")
    @classmethod
    def default_null_options(cls, value):
        return {} if value is None else value


class GeneratedDialogue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    character: str
    line: str
    stage_direction: Optional[str] = None


class GeneratedScene(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    location: str
    narration: str
    dialogues: list[GeneratedDialogue]
    choices: list = Field(default_factory=list)


class GeneratedChapter(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    scenes: list[GeneratedScene]


class RagSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    source_url: Optional[str] = None
    location_id: Optional[str] = None
    chunk_id: str


class RagMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")

    used: bool
    degraded: bool
    sources: list[RagSource] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    script_id: str
    title: str
    content: str
    chapters: list[GeneratedChapter]
    style: str
    era: str
    rag: RagMetadata
    demo_mode: bool = False


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
