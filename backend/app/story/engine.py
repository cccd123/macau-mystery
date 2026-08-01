"""Story Engine - Core game state machine"""
import json
from pathlib import Path
from app.story.state import GameSession

SCRIPTS_DIR = Path(__file__).parent / "scripts"


class StoryEngine:
    def __init__(self):
        self.sessions: dict[str, GameSession] = {}

    def load_script(self, script_id: str) -> dict:
        path = SCRIPTS_DIR / f"{script_id}.json"
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        raise FileNotFoundError(f"Script {script_id} not found")

    def start_game(self, script_id: str) -> GameSession:
        script = self.load_script(script_id)
        session = GameSession.create(script_id, script)
        self.sessions[session.id] = session
        return session

    def make_choice(self, session_id: str, choice_id: str) -> dict:
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        return session.process_choice(choice_id)

    def get_state(self, session_id: str) -> dict:
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        return session.to_dict()
