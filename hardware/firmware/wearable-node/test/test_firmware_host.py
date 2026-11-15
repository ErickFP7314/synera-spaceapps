#!/usr/bin/env python3
"""
Trello [HW] "Firmware ESP32 + MAX30102 -> SerialFrame 1 Hz por USB" — laptop-side checks.

1. Compiles test/host/test_frame.cpp with g++ against src/frame.h (the exact logic the ESP32 runs)
   and runs its unit checks (quality q, beat average, omit-invalid rules, no buffer overflow).
2. Validates every frame it prints against the frozen contract (same checker as the simulator test).
3. Feeds those frames to Software's parseSerialLine (cross-team check).
4. (Optional) Compiles the real firmware for ESP32 with arduino-cli, in both modes
   (default HR and -DGALLEY_SPO2=1). Skipped if arduino-cli / esp32 core / library are missing.

Run from the repo root:
  python3 -m unittest hardware/firmware/wearable-node/test/test_firmware_host.py -v
"""
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
NODE = ROOT / "hardware" / "firmware" / "wearable-node"
SRC = NODE / "src"

_spec = importlib.util.spec_from_file_location("simtest", ROOT / "hardware" / "hardware-simulator" / "test_simulator.py")
_simtest = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_simtest)
contract_errors = _simtest.contract_errors

ARDUINO_CLI = shutil.which("arduino-cli") or (str(Path.home() / "bin" / "arduino-cli") if (Path.home() / "bin" / "arduino-cli").exists() else None)


def host_frames() -> list:
    exe = Path(tempfile.mkdtemp()) / "test_frame"
    subprocess.run(["g++", "-std=c++17", "-Wall", "-Wextra", "-Werror", f"-I{SRC}",
                    str(NODE / "test" / "host" / "test_frame.cpp"), "-o", str(exe)], check=True,
                   capture_output=True, text=True)
    out = subprocess.run([str(exe)], capture_output=True, text=True, timeout=20)
    if out.returncode != 0:
        raise AssertionError(out.stderr)
    return [ln for ln in out.stdout.splitlines() if ln.strip()]


@unittest.skipIf(shutil.which("g++") is None, "g++ not installed")
class FirmwareHostTest(unittest.TestCase):
    def test_frame_logic_and_contract(self):
        lines = host_frames()
        self.assertEqual(len(lines), 6)
        frames = [json.loads(ln) for ln in lines]
        for ln, f in zip(lines, frames):
            self.assertEqual(contract_errors(f), [], ln)
        finger, off, spo2, bogus, sim, skin = frames
        self.assertEqual((finger["q"], finger["hr"], finger["src"]), (1, 62, "sensor"))
        self.assertTrue(off["q"] == 0 and "hr" not in off and "spo2" not in off)
        self.assertEqual(spo2["spo2"], 97)
        self.assertNotIn("hr", bogus)          # out-of-range values are omitted, never clamped
        self.assertEqual(sim["src"], "sim")
        self.assertEqual(skin["temp"], 36.6)     # MAX30205 raw 0x249A -> 36.6 °C, 1 decimal

    @unittest.skipIf(shutil.which("node") is None, "node not installed")
    def test_software_parser_accepts_firmware_frames(self):
        lines = host_frames()
        parser = (ROOT / "software" / "src" / "infrastructure" / "validators" / "inputValidator.ts").as_uri()
        script = (f"import {{ parseSerialLine }} from '{parser}';"
                  "const l = JSON.parse(process.argv[1]);"
                  "console.log(JSON.stringify(l.filter(x => parseSerialLine(x) === null)));")
        out = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", "--input-type=module",
                              "-e", script, json.dumps(lines)], capture_output=True, text=True, timeout=30)
        self.assertEqual(out.returncode, 0, out.stderr)
        self.assertEqual(json.loads(out.stdout.strip()), [])


@unittest.skipIf(ARDUINO_CLI is None, "arduino-cli not installed")
class FirmwareCompileTest(unittest.TestCase):
    def compile(self, extra_flags: str = "") -> subprocess.CompletedProcess:
        sketch = Path(tempfile.mkdtemp()) / "galley_node"
        sketch.mkdir()
        shutil.copy(SRC / "main.cpp", sketch / "galley_node.ino")
        shutil.copy(SRC / "frame.h", sketch / "frame.h")
        shutil.copy(SRC / "temp.h", sketch / "temp.h")
        cmd = [ARDUINO_CLI, "compile", "--fqbn", "esp32:esp32:esp32", str(sketch)]
        if extra_flags:
            cmd += ["--build-property", f"compiler.cpp.extra_flags={extra_flags}"]
        return subprocess.run(cmd, capture_output=True, text=True, timeout=900)

    def setUp(self):
        cores = subprocess.run([ARDUINO_CLI, "core", "list"], capture_output=True, text=True).stdout
        libs = subprocess.run([ARDUINO_CLI, "lib", "list"], capture_output=True, text=True).stdout
        if "esp32:esp32" not in cores or not all(x in libs for x in ("MAX3010x", "OneWire", "DallasTemperature")):
            self.skipTest("needs: arduino-cli core install esp32:esp32 && arduino-cli lib install "
                          "\"SparkFun MAX3010x Pulse and Proximity Sensor Library\" OneWire DallasTemperature")

    def test_compiles_hr_mode(self):
        r = self.compile()
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])

    def test_compiles_spo2_mode(self):
        r = self.compile("-DGALLEY_SPO2=1")
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])


if __name__ == "__main__":
    unittest.main(verbosity=2)
