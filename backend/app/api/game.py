import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models import (
    ChoiceRequest,
    ChoiceResponse,
    GameStartRequest,
    GameStartResponse,
    GameState,
)
from app.story.ending_calculator import calculate_ending
from app.story.state import GameSession


router = APIRouter()
sessions: dict[str, GameSession] = {}
SCRIPTS_DIR = Path(__file__).parent.parent / "story" / "scripts"


def load_script(script_id: str) -> dict:
    script_path = SCRIPTS_DIR / f"{script_id}.json"
    if not script_path.exists():
        raise HTTPException(status_code=404, detail=f"Script '{script_id}' not found")
    with open(script_path, "r", encoding="utf-8") as file:
        return json.load(file)


def clue_payload(script: dict, clue_id: str | None) -> dict | None:
    if not clue_id:
        return None
    clue = script.get("clues", {}).get(clue_id)
    return clue if clue else {"id": clue_id, "title": clue_id, "description": ""}


def scene_response(
    session: GameSession,
    chapter: dict,
    scene: dict,
    clue_reward: str | None = None,
    ending: dict | None = None,
) -> ChoiceResponse:
    return ChoiceResponse(
        scene_id=scene["id"],
        chapter=chapter.get("title", chapter.get("id", "")),
        location=chapter.get("location", ""),
        narration=scene.get("narration", ""),
        dialogue=scene.get("dialogue", {"npc": "旁白", "text": ""}),
        choices=scene.get("choices", []),
        clue_reward=clue_payload(session.script_data, clue_reward),
        transition=scene.get("transition"),
        empathy_score=session.empathy_score,
        hairpin_assembled=session.flags.get("hairpin_assembled", False),
        ending=ending,
    )


@router.post("/start", response_model=GameStartResponse)
async def start_game(req: GameStartRequest):
    script = load_script(req.script_id)
    if not script.get("chapters") or not script["chapters"][0].get("scenes"):
        raise HTTPException(status_code=422, detail="Script has no playable scenes")

    session = GameSession.create(req.script_id, script)
    sessions[session.id] = session
    chapter = session.get_current_chapter()
    scene = session.get_current_scene()
    return GameStartResponse(
        session_id=session.id,
        chapter=chapter.get("title", chapter["id"]),
        location=chapter.get("location", ""),
        narration=scene.get("narration", ""),
        dialogue=scene.get("dialogue", {}),
        choices=scene.get("choices", []),
    )


@router.post("/choice", response_model=ChoiceResponse)
async def make_choice(req: ChoiceRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session expired. Please restart.")

    try:
        result = session.process_choice(req.choice_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    if result["is_ending"]:
        ending = calculate_ending(
            clues=session.clues,
            choices=session.choices_history,
            endings=session.script_data.get("endings", []),
            empathy_score=session.empathy_score,
            hairpin_assembled=session.flags.get("hairpin_assembled", False),
        )
        session.ending_id = ending["id"]
        session.current_chapter_id = "ending"
        session.current_scene_id = ending["id"]
        ending_chapter = {"id": "ending", "title": ending.get("title", "结局"), "location": ending.get("location", "大三巴牌坊")}
        ending_scene = {
            "id": ending["id"],
            "narration": ending.get("narration", ""),
            "dialogue": ending.get("dialogue", {"npc": "旁白", "text": ""}),
            "choices": [],
        }
        return scene_response(
            session,
            ending_chapter,
            ending_scene,
            result["clue_reward"],
            ending,
        )

    return scene_response(
        session,
        result["chapter"],
        result["scene"],
        result["clue_reward"],
    )


@router.get("/state/{session_id}", response_model=GameState)
async def get_state(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    state = session.to_dict()
    return GameState(
        session_id=state["session_id"],
        script_id=state["script_id"],
        current_chapter=state["current_chapter"],
        current_scene=state["current_scene"],
        clues_collected=state["clues"],
        choices_made=state["choices"],
        started_at=state["started_at"],
        empathy_score=state["empathy_score"],
        hairpin_assembled=state["hairpin_assembled"],
        ending_id=state["ending_id"],
    )
