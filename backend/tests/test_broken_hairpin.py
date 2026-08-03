import asyncio
import unittest

from app.api.game import make_choice, sessions, start_game
from app.models import ChoiceRequest, GameStartRequest
from app.story.ending_calculator import calculate_ending
from app.story.script_loader import load_script, validate_script


class BrokenHairpinScriptTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.script = load_script("broken_hairpin")

    def test_script_structure_and_targets(self):
        self.assertEqual(validate_script(self.script), [])
        self.assertEqual(len(self.script["chapters"]), 6)
        self.assertEqual(
            sum(len(chapter["scenes"]) for chapter in self.script["chapters"]),
            21,
        )
        self.assertEqual(len(self.script["npcs"]), 5)
        self.assertEqual(len(self.script["endings"]), 4)

    def test_all_four_endings(self):
        endings = self.script["endings"]
        all_fragments = [f"inscription_{index}" for index in range(1, 5)]
        three_fragments = all_fragments[:3]

        hidden = calculate_ending(
            all_fragments, [], endings, empathy_score=8, hairpin_assembled=True
        )
        good = calculate_ending(
            three_fragments, [], endings, empathy_score=7, hairpin_assembled=True
        )
        release = calculate_ending(
            all_fragments[:2], [], endings, empathy_score=10, hairpin_assembled=True
        )
        unfinished = calculate_ending(
            all_fragments, [], endings, empathy_score=10, hairpin_assembled=False
        )

        self.assertEqual(hidden["id"], "ending_c")
        self.assertEqual(good["id"], "ending_a")
        self.assertEqual(release["id"], "ending_b")
        self.assertEqual(unfinished["id"], "ending_d")

    def test_complete_playthrough_reaches_hidden_ending(self):
        sessions.clear()
        start = asyncio.run(start_game(GameStartRequest(script_id="broken_hairpin")))
        session_id = start.session_id
        choices = [
            "ch1_tell_truth",
            "ch1_note_gently",
            "ch1_to_lilau",
            "ch2_ask_directly",
            "ch2_collect_fragment",
            "ch2_listen_silently",
            "ch2_to_mandarin_house",
            "ch3_sincere",
            "ch3_take_tail",
            "ch3_collect_fragment",
            "ch3_listen",
            "ch4_ask_date",
            "ch4_collect_fragment",
            "ch4_ask_fate",
            "ch4_to_senado",
            "ch5_reflect",
            "ch5_collect_fragment",
            "ch5_to_ruins",
            "ch6_review",
            "ch6_ask_last",
            "ch6_assemble",
        ]

        response = None
        for choice_id in choices:
            response = asyncio.run(
                make_choice(ChoiceRequest(session_id=session_id, choice_id=choice_id))
            )

        self.assertIsNotNone(response)
        self.assertEqual(response.ending["id"], "ending_c")
        self.assertEqual(response.empathy_score, 14)
        self.assertTrue(response.hairpin_assembled)
        self.assertEqual(
            sessions[session_id].clues,
            [f"inscription_{index}" for index in range(1, 5)],
        )

    def test_invalid_choice_is_rejected(self):
        sessions.clear()
        start = asyncio.run(start_game(GameStartRequest(script_id="broken_hairpin")))
        with self.assertRaises(Exception):
            asyncio.run(
                make_choice(
                    ChoiceRequest(
                        session_id=start.session_id,
                        choice_id="not_a_real_choice",
                    )
                )
            )

if __name__ == "__main__":
    unittest.main()
