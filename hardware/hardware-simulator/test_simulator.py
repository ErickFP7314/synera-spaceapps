#!/usr/bin/env python3
"""
Trello [HW] "Validar simulador v2 (Plan B)" — automated acceptance test.

Checks that hardware/hardware-simulator/simulator.py:
  1. runs every scenario (normal | bradycardia | fever | no_signal) without error;
  2. emits lines that satisfy the FROZEN contract
     contracts/telemetry-payload.schema.json#/definitions/SerialFrame;
  3. each scenario produces the physiology it promises;
  4. the Software parser (software/src/infrastructure/validators/inputValidator.ts)
     accepts every line  -> proves Software can consume the Plan B stream;
  5. (optional, needs pyserial) --port writes the same lines to a serial port.

Run from the repo root:
  python3 -m unittest hardware/hardware-simulator/test_simulator.py -v
  ~/.venvs/global/bin/python -m unittest hardware/hardware-simulator/test_simulator.py -v   # includes the serial test
Standard library only (pyserial and node are optional; their tests are skipped if missing).
"""
import json
import os
import shutil
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SIM = ROOT / "hardware" / "hardware-simulator" / "simulator.py"
SCHEMA = json.loads((ROOT / "contracts" / "telemetry-payload.schema.json").read_text())["definitions"]["SerialFrame"]
SCENARIOS = ["normal", "bradycardia", "fever", "no_signal"]


def run_sim(scenario: str, count: int = 5, extra=()) -> list:
    out = subprocess.run([sys.executable, "-I", str(SIM), "--scenario", scenario, "--count", str(count),
                          "--interval", "0", *extra], capture_output=True, text=True, timeout=30, check=True)
    return [ln for ln in out.stdout.splitlines() if ln.strip()]


def contract_errors(frame: dict) -> list:
    """Minimal JSON-Schema check for the SerialFrame definition (stdlib only)."""
    errs, props = [], SCHEMA["properties"]
    for key in SCHEMA["required"]:
        if key not in frame:
            errs.append(f"missing required '{key}'")
    for key, val in frame.items():
        if key not in props:
            errs.append(f"unexpected key '{key}' (additionalProperties=false)")
            continue
        p = props[key]
        t = p["type"]
        if t == "integer" and not (isinstance(val, int) and not isinstance(val, bool)):
            errs.append(f"{key} must be integer")
        if t == "number" and not (isinstance(val, (int, float)) and not isinstance(val, bool)):
            errs.append(f"{key} must be number")
        if t == "string" and not isinstance(val, str):
            errs.append(f"{key} must be string")
        if "enum" in p and val not in p["enum"]:
            errs.append(f"{key}={val} not in {p['enum']}")
        if "minimum" in p and isinstance(val, (int, float)) and val < p["minimum"]:
            errs.append(f"{key}={val} < {p['minimum']}")
        if "maximum" in p and isinstance(val, (int, float)) and val > p["maximum"]:
            errs.append(f"{key}={val} > {p['maximum']}")
    return errs


class SimulatorContractTest(unittest.TestCase):
    def test_every_scenario_runs_and_matches_contract(self):
        for sc in SCENARIOS:
            with self.subTest(scenario=sc):
                lines = run_sim(sc)
                self.assertEqual(len(lines), 5)
                for ln in lines:
                    self.assertNotIn("\n", ln)
                    frame = json.loads(ln)  # every line must be pure JSON (no banners)
                    self.assertEqual(contract_errors(frame), [], ln)
                    self.assertEqual(frame["src"], "sim")

    def test_scenarios_produce_promised_physiology(self):
        normal = [json.loads(x) for x in run_sim("normal", 20)]
        self.assertTrue(all(f["q"] == 1 and 60 <= f["hr"] <= 66 and 97 <= f["spo2"] <= 99 for f in normal))
        brady = [json.loads(x) for x in run_sim("bradycardia", 20)]
        self.assertTrue(all(44 <= f["hr"] <= 48 for f in brady))          # below the 50 bpm limit
        fever = [json.loads(x) for x in run_sim("fever", 20)]
        self.assertTrue(all(f["temp"] >= 37.4 and f["hr"] >= 76 for f in fever))
        nosig = [json.loads(x) for x in run_sim("no_signal", 20)]
        self.assertTrue(all(f["q"] == 0 and "hr" not in f and "spo2" not in f for f in nosig))

    @unittest.skipIf(shutil.which("node") is None, "node not installed")
    def test_software_parser_accepts_simulator_stream(self):
        lines = run_sim("normal", 3) + run_sim("bradycardia", 3) + run_sim("fever", 3) + run_sim("no_signal", 3)
        parser = (ROOT / "software" / "src" / "infrastructure" / "validators" / "inputValidator.ts").as_uri()
        script = (f"import {{ parseSerialLine }} from '{parser}';"
                  "const lines = JSON.parse(process.argv[1]);"
                  "const bad = lines.filter(l => parseSerialLine(l) === null);"
                  "console.log(JSON.stringify({ total: lines.length, rejected: bad }));")
        out = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", "--input-type=module",
                              "-e", script, json.dumps(lines)], capture_output=True, text=True, timeout=30)
        self.assertEqual(out.returncode, 0, out.stderr)
        res = json.loads(out.stdout.strip().splitlines()[-1])
        self.assertEqual(res["total"], 12)
        self.assertEqual(res["rejected"], [])

    def test_serial_port_output(self):
        try:
            import serial  # noqa: F401  (pyserial must be importable by THIS interpreter)
        except ImportError:
            self.skipTest("pyserial not installed (optional: python3 -m pip install pyserial inside a venv)")
        if os.name != "posix":
            self.skipTest("pty test is POSIX-only")
        master, slave = os.openpty()
        port = os.ttyname(slave)
        try:
            proc = subprocess.run([sys.executable, str(SIM), "--scenario", "bradycardia", "--count", "3",
                                   "--interval", "0", "--port", port], capture_output=True, text=True, timeout=30)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            data = b""
            while data.count(b"\n") < 3:
                data += os.read(master, 1024)
            received = [json.loads(x) for x in data.decode().replace("\r", "").splitlines() if x.strip()]
            self.assertEqual(len(received), 3)
            for f in received:
                self.assertEqual(contract_errors(f), [])
        finally:
            os.close(master)
            os.close(slave)


if __name__ == "__main__":
    unittest.main(verbosity=2)
