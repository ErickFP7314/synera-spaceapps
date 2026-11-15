#!/usr/bin/env python3
"""
Galley — Hardware simulator (Plan B), contract v2.

Emits exactly the same line the ESP32 firmware emits, once per second:
  {"t":1731600000,"hr":62,"spo2":97,"temp":36.6,"q":1,"src":"sim"}
Contract: contracts/telemetry-payload.schema.json#/definitions/SerialFrame

Usage:
  python3 hardware/hardware-simulator/simulator.py                       # normal, stdout, infinite
  python3 hardware/hardware-simulator/simulator.py --scenario bradycardia --count 10
  python3 hardware/hardware-simulator/simulator.py --scenario no_signal
  python3 hardware/hardware-simulator/simulator.py --port /dev/ttyUSB0   # write to a serial port (needs: pip install pyserial)

Scenarios match data/synthetic/galley-14day-scenarios.json:
  normal | bradycardia (HR ~46) | fever (temp +1 °C, HR up) | no_signal (q=0, finger off)
"""
import argparse
import json
import random
import sys
import time

SCENARIOS = {
    "normal":      {"hr": (60, 66), "spo2": (97, 99), "temp": (36.4, 36.7), "q": 1},
    "bradycardia": {"hr": (44, 48), "spo2": (96, 98), "temp": (36.4, 36.7), "q": 1},
    "fever":       {"hr": (76, 84), "spo2": (95, 97), "temp": (37.4, 37.7), "q": 1},
    "no_signal":   {"hr": None,     "spo2": None,     "temp": (36.4, 36.7), "q": 0},
}


def frame(scenario: str) -> dict:
    s = SCENARIOS[scenario]
    f = {"t": int(time.time()), "q": s["q"], "src": "sim"}
    if s["hr"]:
        f["hr"] = random.randint(*s["hr"])
    if s["spo2"]:
        f["spo2"] = random.randint(*s["spo2"])
    f["temp"] = round(random.uniform(*s["temp"]), 1)
    return f


def main() -> None:
    ap = argparse.ArgumentParser(description="Galley SerialFrame simulator (Plan B)")
    ap.add_argument("--scenario", choices=list(SCENARIOS), default="normal")
    ap.add_argument("--interval", type=float, default=1.0, help="seconds between frames (contract: 1 Hz)")
    ap.add_argument("--count", type=int, default=0, help="number of frames (0 = infinite)")
    ap.add_argument("--port", default=None, help="serial port to write to, e.g. /dev/ttyUSB0 or COM3")
    a = ap.parse_args()

    out = None
    if a.port:
        try:
            import serial  # type: ignore
        except ImportError:
            sys.exit("pyserial missing: python3 -m pip install pyserial (inside a venv)")
        out = serial.Serial(a.port, 115200)

    n = 0
    try:
        while a.count == 0 or n < a.count:
            line = json.dumps(frame(a.scenario), separators=(",", ":"))
            if out:
                out.write((line + "\n").encode())
            print(line, flush=True)
            n += 1
            time.sleep(a.interval)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
