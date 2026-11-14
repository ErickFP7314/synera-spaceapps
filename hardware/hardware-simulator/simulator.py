#!/usr/bin/env python3
"""
Synera - Hardware Telemetry Simulator
Simulates physiological and environmental telemetry stream for the Software team
according to /contracts/telemetry-payload.schema.json
"""

import json
import time
import random
import argparse
from datetime import datetime, timezone

def generate_telemetry(astronaut_id: str = "ASTRO-001", scenario: str = "normal", environment: str = "ISS"):
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Base nominal values
    bpm = random.randint(62, 74)
    spo2 = random.randint(97, 99)
    systolic = random.randint(112, 122)
    diastolic = random.randint(72, 80)
    temp = round(random.uniform(36.4, 36.8), 1)
    glucose = random.randint(85, 115)
    sleep_hours = round(random.uniform(7.0, 8.2), 1)
    mood = random.randint(7, 9)
    rad_dose = round(random.uniform(10.0, 18.0), 2) # uSv/h

    if scenario == "fatigue_combination":
        # Multi-variable combination: Low sleep + slightly elevated HR + depressed mood
        sleep_hours = round(random.uniform(4.5, 5.2), 1)
        bpm = random.randint(86, 94)
        mood = random.randint(4, 5)
    elif scenario == "fever_infection":
        # Elevated body temp + tachycardia
        temp = round(random.uniform(38.2, 39.0), 1)
        bpm = random.randint(98, 115)
        mood = random.randint(3, 5)
    elif scenario == "hypertensive_emergency":
        # Red alert blood pressure
        systolic = random.randint(165, 180)
        diastolic = random.randint(102, 115)
        bpm = random.randint(90, 105)
    elif scenario == "radiation_spike":
        rad_dose = round(random.uniform(150.0, 320.0), 2)

    payload = {
        "astronaut_id": astronaut_id,
        "timestamp": now_iso,
        "capture_source": "simulator",
        "environment": environment,
        "metrics": {
            "heart_rate": {
                "bpm": bpm,
                "spo2": spo2,
                "hrv_rmssd": random.randint(40, 65)
            },
            "blood_pressure": {
                "systolic": systolic,
                "diastolic": diastolic
            },
            "body_temperature": {
                "celsius": temp
            },
            "glucose": {
                "mg_dl": glucose
            },
            "sleep": {
                "duration_hours": sleep_hours,
                "deep_sleep_hours": round(sleep_hours * 0.22, 1),
                "rem_sleep_hours": round(sleep_hours * 0.25, 1),
                "efficiency_percentage": random.randint(82, 94)
            },
            "mood": {
                "score": mood,
                "stress_level": random.randint(2, 6),
                "pvt_reaction_time_ms": random.randint(220, 290)
            },
            "radiation": {
                "dose_rate_uSv_h": rad_dose,
                "cumulative_dose_mSv": round(random.uniform(12.5, 14.0), 2)
            }
        }
    }
    return payload

def main():
    parser = argparse.ArgumentParser(description="Synera Telemetry Simulator")
    parser.add_argument("--astronaut", default="ASTRO-001", help="Astronaut ID")
    parser.add_argument("--scenario", choices=["normal", "fatigue_combination", "fever_infection", "hypertensive_emergency", "radiation_spike"], default="normal")
    parser.add_argument("--environment", choices=["ISS", "DeepSpaceTransit", "LunarBase"], default="ISS")
    parser.add_argument("--interval", type=int, default=2, help="Seconds between emissions")
    parser.add_argument("--count", type=int, default=5, help="Number of samples (0 for infinite)")
    args = parser.parse_args()

    print(f"[SIMULATOR] Starting telemetry generation for {args.astronaut} [Scenario: {args.scenario}]...")
    emitted = 0
    try:
        while True:
            payload = generate_telemetry(args.astronaut, args.scenario, args.environment)
            print(json.dumps(payload, indent=2))
            emitted += 1
            if args.count > 0 and emitted >= args.count:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n[SIMULATOR] Stopped by user.")

if __name__ == "__main__":
    main()
