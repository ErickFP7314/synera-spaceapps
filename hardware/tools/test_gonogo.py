"""Tests for gonogo.py — the objective GO / NO-GO check for the real sensor.

Run:  python3 -m unittest hardware/tools/test_gonogo.py -v
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gonogo  # noqa: E402

BOOT = ["ets Jun  8 2016 00:22:57", "rst:0x1 (POWERON_RESET),boot:0x13", "entry 0x400805dc"]


def frames(n, start=1, **kw):
    base = {"hr": 62, "spo2": 97, "temp": 36.6, "q": 1, "src": "sensor"}
    base.update(kw)
    out = []
    for i in range(n):
        f = {"t": start + i, **base}
        if f["q"] == 0:            # firmware drops hr/spo2 when q=0
            f.pop("hr", None); f.pop("spo2", None)
        out.append(json.dumps(f, separators=(",", ":")))
    return out


class GoNoGoTest(unittest.TestCase):
    def test_real_sensor_10s_is_go(self):
        r = gonogo.evaluate(BOOT + frames(12))
        self.assertEqual(r["verdict"], "GO")
        self.assertEqual(r["ignored_non_json"], 3)   # ESP32 boot log is ignored, not an error
        self.assertEqual(r["best_real_run_s"], 12)

    def test_simulated_only_is_nogo_but_pipeline_ok(self):
        r = gonogo.evaluate(frames(15, src="sim"))
        self.assertEqual(r["verdict"], "NO-GO")
        self.assertTrue(r["pipeline_ok"])            # USB/JSON chain works, the pulse sensor does not
        self.assertIn("sim", r["reason"])

    def test_finger_off_is_nogo(self):
        r = gonogo.evaluate(frames(12, q=0))
        self.assertEqual(r["verdict"], "NO-GO")
        self.assertIn("q=0", r["reason"])

    def test_invalid_frames_are_counted(self):
        bad = json.dumps({"t": 1, "hr": 300, "q": 1, "src": "sensor"})
        r = gonogo.evaluate([bad, "{not json"] + frames(3))
        self.assertEqual(r["invalid"], 1)
        self.assertEqual(r["ignored_non_json"], 1)

    def test_run_must_be_continuous(self):
        r = gonogo.evaluate(frames(6) + frames(1, start=7, q=0) + frames(6, start=8))
        self.assertEqual(r["best_real_run_s"], 6)
        self.assertEqual(r["verdict"], "NO-GO")

    def test_contract_matches_schema_file(self):
        self.assertEqual(gonogo.contract_errors({"t": 1, "q": 1, "src": "sensor"}), [])
        self.assertTrue(gonogo.contract_errors({"t": 1, "q": 1, "src": "sensor", "bp": 120}))


if __name__ == "__main__":
    unittest.main()
