"""Clue management"""
def add_clue(session_clues: list, clue_id: str) -> bool:
    if clue_id and clue_id not in session_clues:
        session_clues.append(clue_id)
        return True
    return False

def check_ending_condition(clues: list[str], condition: str) -> bool:
    if condition == "default": return True
    if ">=" in condition:
        _, count = condition.split(">=")
        return len(clues) >= int(count.strip())
    return False
