"""Script loader and validator"""
import json
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent / "scripts"


def load_script(script_id: str) -> dict:
    path = SCRIPTS_DIR / f"{script_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Script '{script_id}' not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def list_scripts() -> list[dict]:
    scripts = []
    for path in SCRIPTS_DIR.glob("*.json"):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            scripts.append({"id": path.stem, "title": data.get("title", ""), "chapters": len(data.get("chapters", []))})
    return scripts


def validate_script(data: dict) -> list[str]:
    errors = []
    if "script_id" not in data: errors.append("Missing 'script_id'")
    if "title" not in data: errors.append("Missing 'title'")
    if "chapters" not in data or not data["chapters"]: errors.append("Missing or empty 'chapters'")
    return errors
