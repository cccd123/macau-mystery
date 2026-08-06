"""Game State Management"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class GameSession:
    id: str
    script_id: str
    script_data: dict
    current_chapter_idx: int = 0
    current_scene_idx: int = 0
    clues: list[str] = field(default_factory=list)
    choices_history: list[str] = field(default_factory=list)
    started_at: str = ""

    @classmethod
    def create(cls, script_id: str, script_data: dict) -> "GameSession":
        return cls(id=str(uuid.uuid4())[:8], script_id=script_id,
                   script_data=script_data, started_at=datetime.now().isoformat())

    def get_current_scene(self) -> dict | None:
        chapters = self.script_data.get("chapters", [])
        if self.current_chapter_idx < len(chapters):
            scenes = chapters[self.current_chapter_idx].get("scenes", [])
            if self.current_scene_idx < len(scenes):
                return scenes[self.current_scene_idx]
        return None

    def get_current_chapter(self) -> dict | None:
        chapters = self.script_data.get("chapters", [])
        if self.current_chapter_idx < len(chapters):
            return chapters[self.current_chapter_idx]
        return None

    def process_choice(self, choice_id: str) -> dict:
        self.choices_history.append(choice_id)
        scene = self.get_current_scene()
        if scene:
            for choice in scene.get("choices", []):
                if choice.get("id") == choice_id:
                    clue = choice.get("clue_reward")
                    if clue:
                        self.clues.append(clue)
                    self.current_scene_idx += 1
                    break
        return {"scene": self.get_current_scene(), "chapter": self.get_current_chapter(), "clue_reward": None}

    def to_dict(self) -> dict:
        return {"session_id": self.id, "script_id": self.script_id,
                "current_chapter": self.current_chapter_idx, "current_scene": self.current_scene_idx,
                "clues": self.clues, "choices": self.choices_history, "started_at": self.started_at}
