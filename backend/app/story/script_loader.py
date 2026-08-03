"""Script loader and structural validator."""

import json
from pathlib import Path


SCRIPTS_DIR = Path(__file__).parent / "scripts"


def load_script(script_id: str) -> dict:
    path = SCRIPTS_DIR / f"{script_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Script '{script_id}' not found")
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def list_scripts() -> list[dict]:
    scripts = []
    for path in SCRIPTS_DIR.glob("*.json"):
        with open(path, "r", encoding="utf-8") as file:
            data = json.load(file)
            scripts.append(
                {
                    "id": path.stem,
                    "title": data.get("title", ""),
                    "chapters": len(data.get("chapters", [])),
                }
            )
    return scripts


def validate_script(data: dict) -> list[str]:
    errors: list[str] = []
    for field in ("script_id", "title"):
        if field not in data:
            errors.append(f"Missing '{field}'")
    chapters = data.get("chapters", [])
    if not chapters:
        errors.append("Missing or empty 'chapters'")
        return errors

    scene_ids: set[str] = set()
    choices: list[tuple[str, dict]] = []
    for chapter in chapters:
        if not chapter.get("scenes"):
            errors.append(f"Chapter '{chapter.get('id', '?')}' has no scenes")
        for scene in chapter.get("scenes", []):
            scene_id = scene.get("id")
            if not scene_id:
                errors.append("Scene is missing 'id'")
                continue
            if scene_id in scene_ids:
                errors.append(f"Duplicate scene id '{scene_id}'")
            scene_ids.add(scene_id)
            for choice in scene.get("choices", []):
                choices.append((scene_id, choice))

    clue_ids = set(data.get("clues", {}))
    for scene_id, choice in choices:
        target = choice.get("next_scene")
        if not target:
            errors.append(f"Choice '{choice.get('id', '?')}' in '{scene_id}' has no target")
        elif target != "__ending__" and target not in scene_ids:
            errors.append(f"Choice in '{scene_id}' targets missing scene '{target}'")
        reward = choice.get("clue_reward")
        if reward and reward not in clue_ids:
            errors.append(f"Choice in '{scene_id}' rewards missing clue '{reward}'")

    if len(data.get("endings", [])) < 1:
        errors.append("Missing endings")
    return errors
