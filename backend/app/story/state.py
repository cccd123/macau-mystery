"""Game session state and JSON-driven scene transitions."""

from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class GameSession:
    id: str
    script_id: str
    script_data: dict
    current_chapter_id: str
    current_scene_id: str
    clues: list[str] = field(default_factory=list)
    choices_history: list[str] = field(default_factory=list)
    empathy_score: int = 0
    flags: dict[str, bool] = field(default_factory=dict)
    ending_id: str | None = None
    started_at: str = ""

    @classmethod
    def create(cls, script_id: str, script_data: dict) -> "GameSession":
        first_chapter = script_data["chapters"][0]
        first_scene = first_chapter["scenes"][0]
        return cls(
            id=str(uuid.uuid4())[:8],
            script_id=script_id,
            script_data=script_data,
            current_chapter_id=first_chapter["id"],
            current_scene_id=first_scene["id"],
            started_at=datetime.now().isoformat(),
        )

    def find_scene(self, scene_id: str) -> tuple[dict, dict] | tuple[None, None]:
        for chapter in self.script_data.get("chapters", []):
            for scene in chapter.get("scenes", []):
                if scene.get("id") == scene_id:
                    return chapter, scene
        return None, None

    def get_current_scene(self) -> dict | None:
        _, scene = self.find_scene(self.current_scene_id)
        return scene

    def get_current_chapter(self) -> dict | None:
        chapter, _ = self.find_scene(self.current_scene_id)
        return chapter

    def process_choice(self, choice_id: str) -> dict:
        if self.ending_id:
            raise ValueError("Game has already ended")

        chapter = self.get_current_chapter()
        scene = self.get_current_scene()
        if not chapter or not scene:
            raise ValueError("Current scene not found")

        choice = next(
            (item for item in scene.get("choices", []) if item.get("id") == choice_id),
            None,
        )
        if not choice:
            raise ValueError("Choice is not available in the current scene")

        self.choices_history.append(choice_id)

        clue_reward = choice.get("clue_reward")
        if clue_reward and clue_reward not in self.clues:
            self.clues.append(clue_reward)

        self.empathy_score = max(
            0, self.empathy_score + int(choice.get("empathy_delta", 0))
        )
        self.flags.update(choice.get("set_flags", {}))

        next_scene_id = choice.get("next_scene")
        if not next_scene_id:
            raise ValueError("Choice is missing next_scene")

        if next_scene_id == "__ending__":
            return {
                "scene": None,
                "chapter": chapter,
                "clue_reward": clue_reward,
                "is_ending": True,
            }

        next_chapter, next_scene = self.find_scene(next_scene_id)
        if not next_scene or not next_chapter:
            raise ValueError(f"Target scene '{next_scene_id}' not found")

        self.current_chapter_id = next_chapter["id"]
        self.current_scene_id = next_scene["id"]
        return {
            "scene": next_scene,
            "chapter": next_chapter,
            "clue_reward": clue_reward,
            "is_ending": False,
        }

    def to_dict(self) -> dict:
        return {
            "session_id": self.id,
            "script_id": self.script_id,
            "current_chapter": self.current_chapter_id,
            "current_scene": self.current_scene_id,
            "clues": self.clues,
            "choices": self.choices_history,
            "empathy_score": self.empathy_score,
            "hairpin_assembled": self.flags.get("hairpin_assembled", False),
            "ending_id": self.ending_id,
            "started_at": self.started_at,
        }
