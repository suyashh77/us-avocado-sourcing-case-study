"""Behavior checks for the procurement tabletop's limiting cases."""

import unittest

from short_horizon_model import calculate


BASELINE = {"worldTonnes": 93_900.7, "mexicoTonnes": 77_542.7}
SCENARIO = {"month": 2, "weeks": 1, "mexicoAvailabilityPct": 0, "otherFlexPct": 10, "bufferDays": 3}


class ScenarioBehaviorTests(unittest.TestCase):
    def test_no_mexico_loss_has_no_gap(self):
        scenario = {**SCENARIO, "mexicoAvailabilityPct": 100}
        self.assertEqual(calculate(BASELINE, scenario)["uncoveredTonnes"], 0)

    def test_more_qualified_flex_reduces_gap(self):
        low = calculate(BASELINE, {**SCENARIO, "otherFlexPct": 0})["uncoveredTonnes"]
        high = calculate(BASELINE, {**SCENARIO, "otherFlexPct": 40})["uncoveredTonnes"]
        self.assertLess(high, low)

    def test_one_time_buffer_does_not_scale_with_duration(self):
        one = calculate(BASELINE, {**SCENARIO, "weeks": 1})["assumedBufferTonnes"]
        eight = calculate(BASELINE, {**SCENARIO, "weeks": 8})["assumedBufferTonnes"]
        self.assertEqual(one, eight)


if __name__ == "__main__":
    unittest.main()
