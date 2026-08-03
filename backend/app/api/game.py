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


def chapter_label(chapter: dict) -> str:
    chapter_id = chapter.get("id", "")
    if chapter_id == "prologue":
        return "序章"
    return chapter.get("title") or chapter_id


def find_scene(script: dict, scene_id: str) -> tuple[dict, dict] | None:
    for chapter in script.get("chapters", []):
        for scene in chapter.get("scenes", []):
            if scene.get("id") == scene_id:
                return chapter, scene
    return None


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
        chapter=chapter_label(first_chapter),
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

    script = load_script(session["script_id"])
    current = find_scene(script, session["current_scene"])
    if not current:
        return ChoiceResponse(
            scene_id="unknown", chapter="", location="",
            narration="没有找到当前剧情，请重新开始。",
            dialogue={"npc": "系统", "text": "当前场景不存在。"},
            choices=[],
        )

    current_chapter, current_scene = current
    selected_choice = next(
        (
            choice
            for choice in current_scene.get("choices", [])
            if choice.get("id") == req.choice_id
        ),
        None,
    )
    if not selected_choice:
        return ChoiceResponse(
            scene_id=current_scene.get("id", ""),
            chapter=chapter_label(current_chapter),
            location=current_chapter.get("location", ""),
            narration=current_scene.get("narration", ""),
            dialogue=current_scene.get("dialogue", {}),
            choices=current_scene.get("choices", []),
        )

    session["choices"].append(req.choice_id)
    clue_reward = None
    clue_id = selected_choice.get("clue_reward")
    if clue_id:
        clue_reward = script.get("clues", {}).get(clue_id)
        if clue_reward and clue_id not in session["clues"]:
            session["clues"].append(clue_id)

    next_scene_id = selected_choice.get("next_scene", "")
    next_result = find_scene(script, next_scene_id)
    if next_result:
        next_chapter, next_scene = next_result
        session["current_chapter"] = next_chapter.get("id", "")
        session["current_scene"] = next_scene.get("id", "")
        return ChoiceResponse(
            scene_id=next_scene.get("id", ""),
            chapter=chapter_label(next_chapter),
            location=next_chapter.get("location", ""),
            narration=next_scene.get("narration", ""),
            dialogue=next_scene.get("dialogue", {}),
            choices=next_scene.get("choices", []),
            clue_reward=clue_reward,
        )

    transition = current_chapter.get("transition", {})
    photo_trigger = current_chapter.get("photo_triggers", [{}])[0]
    is_photo_scene = next_scene_id.endswith("photo")
    narration = (
        photo_trigger.get("response_text", "你记录下了现场细节。")
        if is_photo_scene
        else transition.get("text", "这一段调查已经完成。")
    )
    return ChoiceResponse(
        scene_id=next_scene_id or "chapter_complete",
        chapter=chapter_label(current_chapter),
        location=current_chapter.get("location", ""),
        narration=narration,
        dialogue={
            "npc": "调查记录",
            "text": "当前演示剧情到这里。后续场景加入剧本文件后，会自动接着显示。",
        },
        choices=[],
        clue_reward=clue_reward,
        transition=transition or None,
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
