"""Ending rules for JSON-driven stories."""


def _matches(
    condition: dict,
    fragment_count: int,
    empathy_score: int,
    hairpin_assembled: bool,
) -> bool:
    required_assembled = condition.get("hairpin_assembled")
    if required_assembled is not None and hairpin_assembled != required_assembled:
        return False
    if fragment_count < int(condition.get("min_fragments", 0)):
        return False
    max_fragments = condition.get("max_fragments")
    if max_fragments is not None and fragment_count > int(max_fragments):
        return False
    if empathy_score < int(condition.get("min_empathy", 0)):
        return False
    return True


def calculate_ending(
    clues: list[str],
    choices: list[str],
    endings: list[dict],
    empathy_score: int = 0,
    hairpin_assembled: bool = False,
) -> dict:
    """Return the first matching ending; JSON order is the priority order."""
    del choices  # Reserved for future choice-specific ending rules.
    fragment_count = len({clue for clue in clues if clue.startswith("inscription_")})

    default_ending = None
    for ending in endings:
        condition = ending.get("condition", {})
        if condition == "default":
            default_ending = ending
            continue
        if isinstance(condition, dict) and _matches(
            condition, fragment_count, empathy_score, hairpin_assembled
        ):
            return ending

    if default_ending:
        return default_ending
    return {
        "id": "ending_default",
        "title": "故事结束",
        "narration": "故事结束。",
        "dialogue": {"npc": "系统", "text": "感谢体验。"},
    }
