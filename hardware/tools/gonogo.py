#!/usr/bin/env python3
"""Objective GO / NO-GO check for the real sensor (Trello: "[HW+SW] Go/No-Go del sensor real").

Rule (WORKFLOW.md): >= 10 s of valid SerialFrames from the REAL sensor -> GO. Otherwise the demo
uses the simulator and the decision is not discussed again.

GO needs >= N consecutive frames that (1) pass contracts/telemetry-payload.schema.json#SerialFrame,
(2) come from the real pulse sensor (src="sensor") and (3) have good signal (q=1).
Non-JSON lines (ESP32 boot log) are ignored, never counted as errors.

Usage:
  python3 hardware/tools/gonogo.py --port /dev/ttyUSB0 --seconds 15     # board on USB (needs pyserial)
  wokwi-cli ... | python3 hardware/tools/gonogo.py                      # any line source on stdin
Exit code: 0 = GO, 1 = NO-GO.
"""
import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "contracts" / "telemetry-payload.schema.json").read_text())["definitions"]["SerialFrame"]


def contract_errors(frame: dict) -> list:
    """Minimal JSON-Schema check for SerialFrame (stdlib only; same rules as the simulator tests)."""
    errs, props = [], SCHEMA["properties"]
    for key in SCHEMA["required"]:
        if key not in frame:
            errs.append(f"missing required '{key}'")
    for key, val in frame.items():
        if key not in props:
            errs.append(f"unexpected key '{key}'")
            continue
        p, t = props[key], props[key]["type"]
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


def evaluate(lines, need: int = 10) -> dict:
    r = {"valid": 0, "invalid": 0, "ignored_non_json": 0, "sensor": 0, "sim": 0, "q0": 0,
         "best_real_run_s": 0, "errors": []}
    run = 0
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        try:
            frame = json.loads(line)
            if not isinstance(frame, dict):
                raise ValueError
        except ValueError:
            r["ignored_non_json"] += 1
            continue
        errs = contract_errors(frame)
        if errs:
            r["invalid"] += 1
            r["errors"].append(f"{line} -> {errs}")
            run = 0
            continue
        r["valid"] += 1
        r[frame.get("src", "sensor")] += 1
        if frame["q"] == 0:
            r["q0"] += 1
        real_ok = frame.get("src") == "sensor" and frame["q"] == 1
        run = run + 1 if real_ok else 0
        r["best_real_run_s"] = max(r["best_real_run_s"], run)

    r["pipeline_ok"] = r["valid"] >= need
    if r["best_real_run_s"] >= need:
        r["verdict"], r["reason"] = "GO", f"{r['best_real_run_s']} s in a row of valid real-sensor frames with q=1"
    elif r["valid"] and r["sensor"] == 0:
        r["verdict"], r["reason"] = "NO-GO", "only src=sim frames: the pulse sensor was not detected (USB/JSON chain works)"
    elif r["q0"]:
        r["verdict"], r["reason"] = "NO-GO", f"sensor present but q=0 too often ({r['q0']} frames): finger/contact or signal problem"
    else:
        r["verdict"], r["reason"] = "NO-GO", f"fewer than {need} s of continuous valid real-sensor frames"
    return r


def read_port(port: str, seconds: float):
    import serial  # pyserial, only needed for --port
    end = time.time() + seconds
    with serial.Serial(port, 115200, timeout=1) as s:
        while time.time() < end:
            yield s.readline().decode("utf-8", "replace")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", help="serial port, e.g. /dev/ttyUSB0 or COM3 (default: read stdin)")
    ap.add_argument("--seconds", type=float, default=15, help="how long to listen on --port (default 15)")
    ap.add_argument("--need", type=int, default=10, help="consecutive good seconds required (default 10)")
    a = ap.parse_args()
    lines = read_port(a.port, a.seconds) if a.port else sys.stdin
    r = evaluate(lines, a.need)
    print(f"frames valid={r['valid']} invalid={r['invalid']} ignored(non-JSON)={r['ignored_non_json']} "
          f"src: sensor={r['sensor']} sim={r['sim']} · q=0 frames={r['q0']} · best real run={r['best_real_run_s']} s")
    for e in r["errors"][:5]:
        print("  invalid:", e)
    print(f"USB/JSON pipeline: {'OK' if r['pipeline_ok'] else 'NOT OK'}")
    print(f"VERDICT: {r['verdict']} — {r['reason']}")
    return 0 if r["verdict"] == "GO" else 1


if __name__ == "__main__":
    sys.exit(main())
