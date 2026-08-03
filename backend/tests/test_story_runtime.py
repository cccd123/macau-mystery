"""Validation and runtime coverage for the version 1 story contract."""
from __future__ import annotations

import copy
import json
from pathlib import Path

from app.story.contract import StoryDocument
from app.story.runtime import StoryGraph
from app.story.validator import validate_story_data


DEMO_PATH = Path(__file__).resolve().parents[1] / "app" / "story" / "scripts" / "macau_mystery_demo.json"


def demo_data() -> dict:
    return json.loads(DEMO_PATH.read_text(encoding="utf-8"))


def error_codes(data: dict, *, allow_placeholder_media: bool = True) -> set[str]:
    result = validate_story_data(data, allow_placeholder_media=allow_placeholder_media)
    return {issue.code for issue in result.errors}


def test_demo_story_is_valid_in_development() -> None:
    result = validate_story_data(demo_data(), allow_placeholder_media=True)

    assert result.valid
    assert result.errors == []
    assert result.warnings == []


def test_placeholder_media_is_rejected_outside_development() -> None:
    assert "PLACEHOLDER_MEDIA_NOT_ALLOWED" in error_codes(
        demo_data(), allow_placeholder_media=False
    )


def test_validator_reports_missing_targets_and_router_cycles() -> None:
    missing_target = demo_data()
    missing_target["chapters"][0]["scenes"][0]["choices"][0]["next_scene"] = "missing_scene"
    assert "MISSING_SCENE_TARGET" in error_codes(missing_target)

    router_cycle = demo_data()
    router_cycle["chapters"][0]["scenes"][4]["routes"][0]["next_scene"] = "final_router"
    assert "ROUTER_CYCLE" in error_codes(router_cycle)


def test_validator_reports_reachable_video_without_choices() -> None:
    no_choices = demo_data()
    no_choices["chapters"][0]["scenes"][1]["choices"] = []
    assert "VIDEO_WITHOUT_CHOICES" in error_codes(no_choices)


def test_router_conditions_apply_after_granted_clues_and_branches_merge() -> None:
    document = StoryDocument.model_validate(demo_data())
    graph = StoryGraph(document)

    clue_branch = graph.preview_choice("scene_start", "inspect_letter", set())
    direct_branch = graph.preview_choice("scene_start", "leave_quietly", set())
    assert clue_branch.id == "scene_letter"
    assert direct_branch.id == "scene_direct"

    clue_ending = graph.preview_choice("scene_merge", "draw_conclusion", {"letter_fragment"})
    direct_ending = graph.preview_choice("scene_merge", "draw_conclusion", set())
    assert clue_ending.id == "ending_good"
    assert direct_ending.id == "ending_bad"


def test_combined_minimum_all_and_any_conditions_use_and_semantics() -> None:
    data = copy.deepcopy(demo_data())
    data["clues"]["family_seal"] = {"title": "家族印记", "description": "一枚家族印记。"}
    data["clues"]["old_photo"] = {"title": "旧照片", "description": "一张旧照片。"}
    data["chapters"][0]["scenes"][4]["routes"][0]["when"] = {
        "min_clue_count": 2,
        "all_clues": ["letter_fragment"],
        "any_clues": ["family_seal", "old_photo"],
    }
    graph = StoryGraph(StoryDocument.model_validate(data))

    assert graph.resolve("final_router", {"letter_fragment"}).id == "ending_bad"
    assert graph.resolve("final_router", {"letter_fragment", "family_seal"}).id == "ending_good"
