"""Ending calculator"""
def calculate_ending(clues: list[str], choices: list[str], endings: list[dict]) -> dict:
    for ending in endings:
        cond = ending.get("condition", "default")
        if cond == "default": continue
        if ">=" in cond:
            required = int(cond.split(">=")[-1].strip())
            if len(clues) >= required:
                return ending
    for ending in endings:
        if ending.get("condition") == "default":
            return ending
    return {"id": "ending_default", "text": "故事结束。"}
