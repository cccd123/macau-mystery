from pydantic import BaseModel
from typing import Optional


class GameStartRequest(BaseModel):
    script_id: str = "macau_mystery_01"


class GameStartResponse(BaseModel):
    session_id: str
    chapter: str
    location: str
    narration: str
    dialogue: dict
    choices: list


class ChoiceRequest(BaseModel):
    session_id: str
    choice_id: str


class ChoiceResponse(BaseModel):
    scene_id: str
    chapter: str
    location: str
    narration: str
    dialogue: dict
    choices: list
    clue_reward: Optional[dict] = None
    transition: Optional[dict] = None
    empathy_score: int = 0
    hairpin_assembled: bool = False
    ending: Optional[dict] = None


class GameState(BaseModel):
    session_id: str
    script_id: str
    current_chapter: str
    current_scene: str
    clues_collected: list[str]
    choices_made: list[str]
    started_at: str
    empathy_score: int = 0
    hairpin_assembled: bool = False
    ending_id: Optional[str] = None


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
