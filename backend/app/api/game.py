import json
import uuid
from pathlib import Path
from fastapi import APIRouter
from app.models import (
    GameStartRequest, GameStartResponse,
    ChoiceRequest, ChoiceResponse, GameState,
)

router = APIRouter()
sessions: dict = {}
SCRIPTS_DIR = Path(__file__).parent.parent / "story" / "scripts"


def load_script(script_id: str) -> dict:
    script_path = SCRIPTS_DIR / f"{script_id}.json"
    if script_path.exists():
        with open(script_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


@router.post("/start", response_model=GameStartResponse)
async def start_game(req: GameStartRequest):
    session_id = str(uuid.uuid4())[:8]
    script = load_script(req.script_id)

    if not script or not script.get("chapters"):
        return GameStartResponse(
            session_id=session_id,
            chapter="Prologue", location="A-Ma Temple",
            narration="You stand before the A-Ma Temple. An old man is sweeping the ground.",
            dialogue={"npc": "Temple Keeper", "text": "Welcome! This temple is older than you think."},
            choices=[{"id": "c1", "text": "Tell me about the history"}, {"id": "c2", "text": "I am investigating a letter"}],
        )

    first_chapter = script["chapters"][0]
    first_scene = first_chapter["scenes"][0]
    sessions[session_id] = {
        "script_id": req.script_id,
        "current_chapter": first_chapter["id"],
        "current_scene": first_scene["id"],
        "clues": [], "choices": [],
    }

    return GameStartResponse(
        session_id=session_id,
        chapter=first_chapter.get("location", ""),
        location=first_chapter.get("location", ""),
        narration=first_scene.get("narration", ""),
        dialogue=first_scene.get("dialogue", {}),
        choices=first_scene.get("choices", []),
    )


@router.post("/choice", response_model=ChoiceResponse)
async def make_choice(req: ChoiceRequest):
    session = sessions.get(req.session_id)
    if not session:
        return ChoiceResponse(
            scene_id="unknown", chapter="", location="",
            narration="Session expired. Please restart.",
            dialogue={"npc": "System", "text": "Please restart the game."},
            choices=[],
        )

    session["choices"].append(req.choice_id)
    clue_reward = None
    if req.choice_id == "c2":
        clue_reward = {
            "id": "letter_fragment",
            "title": "Letter Fragment",
            "description": "Spring of a certain year, departed from A-Ma Temple",
        }
        session["clues"].append("letter_fragment")

    return ChoiceResponse(
        scene_id="prologue_02b", chapter="Prologue", location="A-Ma Temple",
        narration="The old man's expression turns serious. He puts down his broom and pulls out a yellowed envelope from his pocket.",
        dialogue={
            "npc": "Temple Keeper",
            "text": "A letter? Actually, I did find an old letter in the temple once... Let me look. Ah, here it is! The envelope says: departed from A-Ma Temple in spring.",
        },
        choices=[
            {"id": "c4", "text": "Who wrote this letter?"},
            {"id": "c5", "text": "Is there more content inside?"},
        ],
        clue_reward=clue_reward,
    )


@router.get("/state/{session_id}", response_model=GameState)
async def get_state(session_id: str):
    session = sessions.get(session_id)
    if not session:
        return GameState(
            session_id=session_id, script_id="unknown",
            current_chapter="", current_scene="",
            clues_collected=[], choices_made=[], started_at="",
        )
    return GameState(
        session_id=session_id,
        script_id=session["script_id"],
        current_chapter=session["current_chapter"],
        current_scene=session["current_scene"],
        clues_collected=session["clues"],
        choices_made=session["choices"],
        started_at="2026-08-01T00:00:00",
    )
