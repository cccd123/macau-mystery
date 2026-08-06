"""Pure runtime resolver for validated version 1 stories."""
from __future__ import annotations

from dataclasses import dataclass

from typing import Union

from app.story.contract import Choice, EndingScene, RouterScene, Scene, StoryDocument, VideoScene


class StoryRuntimeError(ValueError):
    pass


PlayableScene = Union[VideoScene, EndingScene]


@dataclass(frozen=True)
class SceneContext:
    scene: Scene
    chapter_index: int


class StoryGraph:
    def __init__(self, document: StoryDocument, *, max_router_hops: int = 32) -> None:
        self.document = document
        self.max_router_hops = max_router_hops
        self._scenes: dict[str, SceneContext] = {}
        for chapter_index, chapter in enumerate(document.chapters):
            for scene in chapter.scenes:
                self._scenes[scene.id] = SceneContext(scene=scene, chapter_index=chapter_index)

    def scene_context(self, scene_id: str) -> SceneContext:
        try:
            return self._scenes[scene_id]
        except KeyError as exc:
            raise StoryRuntimeError(f"unknown scene: {scene_id}") from exc

    def resolve(self, scene_id: str, clue_ids: set[str] | frozenset[str]) -> PlayableScene:
        seen_routers: set[str] = set()
        current_id = scene_id
        for _ in range(self.max_router_hops):
            scene = self.scene_context(current_id).scene
            if isinstance(scene, (VideoScene, EndingScene)):
                return scene
            if current_id in seen_routers:
                raise StoryRuntimeError(f"router cycle detected at {current_id}")
            seen_routers.add(current_id)
            current_id = self._route(scene, clue_ids)
        raise StoryRuntimeError("router hop limit exceeded")

    def choice(self, scene_id: str, choice_id: str) -> Choice:
        scene = self.scene_context(scene_id).scene
        if not isinstance(scene, VideoScene):
            raise StoryRuntimeError(f"scene {scene_id} is not a video scene")
        for choice in scene.choices:
            if choice.id == choice_id:
                return choice
        raise StoryRuntimeError(f"choice {choice_id} is not available in scene {scene_id}")

    def preview_choice(self, scene_id: str, choice_id: str, clue_ids: set[str]) -> PlayableScene:
        choice = self.choice(scene_id, choice_id)
        return self.resolve(choice.next_scene, clue_ids | set(choice.grant_clues))

    @staticmethod
    def _matches(condition, clue_ids: set[str] | frozenset[str]) -> bool:
        if condition.default:
            return True
        if condition.min_clue_count is not None and len(clue_ids) < condition.min_clue_count:
            return False
        if condition.all_clues is not None and not set(condition.all_clues).issubset(clue_ids):
            return False
        if condition.any_clues is not None and not set(condition.any_clues).intersection(clue_ids):
            return False
        return True

    def _route(self, scene: RouterScene, clue_ids: set[str] | frozenset[str]) -> str:
        for route in sorted(scene.routes, key=lambda item: item.priority):
            if self._matches(route.when, clue_ids):
                return route.next_scene
        raise StoryRuntimeError(f"router {scene.id} has no matching route")
