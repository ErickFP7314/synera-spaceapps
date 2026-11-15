#!/usr/bin/env python3
"""
Galley — calibrated synthetic 14-day dataset (5 scenarios).

Individual astronaut vital signs are NOT public (NASA LSAH/LSDA are restricted),
so the physiological series are SIMULATED, but calibrated on published
spaceflight data. Every parameter below cites its source.

Output (deterministic, seed=2026):
  data/synthetic/galley-14day-scenarios.json   (used by the app)
  data/synthetic/galley-14day-scenarios.csv    (same data, flat, for Excel)

Usage (from repo root):  python3 data/scripts/generate_synthetic_dataset.py
Standard library only.
"""
import csv
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "synthetic"
SEED = 2026
DAYS = 14

# ---- Calibration (owner: Biotech team — change values here, re-run the script)
CAL = {
    "sleep_h":      {"mean": 6.6, "sd": 0.6,  "source": "Barger et al. 2014, Lancet Neurol 13:904 — ISS mean 6.09 h, only 24% of nights >= 7 h (this crew member: 6.6 h, ~25% nights >= 7 h)"},
    "hr_rest_bpm":  {"mean": 62,  "sd": 3,    "source": "Usual resting HR of the demo profile (same as the prototype's CREW-A profile)"},
    "spo2_pct":     {"min": 96,   "max": 99,  "source": "Normal SpO2 in the ISS sea-level-equivalent atmosphere (BTS target 94-98%)"},
    "skin_temp_c":  {"mean": 36.5, "sd": 0.12, "drift_per_day": 0.013, "source": "Stahn et al. 2017, Sci Rep 7:16180 — core temperature +~1 °C over ~2.5 months (0.013 °C/day)"},
    "mood_1_5":     {"values": [3, 4, 4, 4, 5], "source": "Demo profile usual mood 4/5"},
    "pvt_lapses":   {"mean": 2, "sd": 1, "source": "Basner et al. 2011, Acta Astronaut 69:949 — PVT-B lapses (RT > 355 ms) in rested subjects are low"},
    "intake_pct":   {"mean": 86, "sd": 4, "source": "Smith et al. 2005, J Nutr 135:437 — ISS crews eat below requirement (~80%, VERIFY); NASA HRP nutrition risk"},
    "exercise":     {"prescribed_min": 90, "mean_pct": 92, "sd_pct": 6, "source": "NASA HRP bone risk; ISS daily exercise ~2 h incl. setup (VERIFY) -> 90 min prescribed in the demo"},
    "radiation_mgy_day": {"min": 0.16, "max": 0.21, "source": "Di Fino et al. 2023, Life Sci Space Res 39:26 (ASI LIDAL, ISS Columbus): 1.8-2.4 nGy/s"},
}

BASELINE = {  # what the crew member enters at registration ("usual" values)
    "crew_id": "CREW-A", "environment": "ISS",
    "hr_rest_bpm": 62, "spo2_pct": 98, "skin_temp_c": 36.5, "sleep_h": 6.6,
    "mood_1_5": 4, "pvt_lapses": 2, "intake_pct": 86, "exercise_pct": 92,
    "exercise_prescribed_min": CAL["exercise"]["prescribed_min"],
}


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def nominal_day(rng: random.Random, day: int) -> dict:
    ex_pct = clamp(rng.gauss(CAL["exercise"]["mean_pct"], CAL["exercise"]["sd_pct"]), 60, 110)
    return {
        "day": day,
        "hr_rest_bpm": round(rng.gauss(CAL["hr_rest_bpm"]["mean"], CAL["hr_rest_bpm"]["sd"])),
        "spo2_pct": rng.randint(CAL["spo2_pct"]["min"], CAL["spo2_pct"]["max"]),
        "skin_temp_c": round(rng.gauss(CAL["skin_temp_c"]["mean"], CAL["skin_temp_c"]["sd"])
                             + CAL["skin_temp_c"]["drift_per_day"] * (day - 1), 2),
        "sleep_h": round(clamp(rng.gauss(CAL["sleep_h"]["mean"], CAL["sleep_h"]["sd"]), 5.3, 8.3), 1),
        "mood_1_5": rng.choice(CAL["mood_1_5"]["values"]),
        "pvt_lapses": int(clamp(round(rng.gauss(CAL["pvt_lapses"]["mean"], CAL["pvt_lapses"]["sd"])), 0, 20)),
        "intake_pct": round(clamp(rng.gauss(CAL["intake_pct"]["mean"], CAL["intake_pct"]["sd"]), 74, 100)),
        "exercise_pct": round(ex_pct),
        "exercise_min": round(ex_pct / 100 * CAL["exercise"]["prescribed_min"]),
        "radiation_mgy_day": round(rng.uniform(CAL["radiation_mgy_day"]["min"], CAL["radiation_mgy_day"]["max"]), 3),
        "sep_active": False,
    }


def build():
    scenarios = {}

    rng = random.Random(SEED)
    scenarios["nominal"] = {
        "description": "Nominal ISS adaptation, days 1-14.",
        "expected": "Mostly GREEN; occasional R1 sleep tip (level 1).",
        "days": [nominal_day(rng, d) for d in range(1, DAYS + 1)],
    }

    rng = random.Random(SEED + 1)
    days = [nominal_day(rng, d) for d in range(1, DAYS + 1)]
    for d in days:
        if d["day"] >= 9:
            k = d["day"] - 8  # 1..6, progressive
            d["sleep_h"] = round(clamp(5.6 - 0.15 * k + rng.uniform(-0.2, 0.2), 4.4, 5.8), 1)
            d["mood_1_5"] = 3 if k < 3 else 2
            d["pvt_lapses"] = 4 + k + rng.randint(0, 1)
            d["hr_rest_bpm"] = 62 + 7 + k + rng.randint(1, 2)
            d["intake_pct"] = round(clamp(78 - k + rng.uniform(-2, 2), 65, 80))
    scenarios["fatigue"] = {
        "description": "Circadian disruption from day 9: short sleep, more PVT lapses, compensatory HR, lower mood and intake.",
        "expected": "R1 -> R2 acute fatigue (level 2, level 3 if persists 48 h) + R3 under-eating.",
        "days": days,
    }

    rng = random.Random(SEED + 2)
    days = [nominal_day(rng, d) for d in range(1, DAYS + 1)]
    days[12]["hr_rest_bpm"], days[13]["hr_rest_bpm"] = 46, 45
    scenarios["bradycardia"] = {
        "description": "Resting HR drops to 46/45 bpm on days 13-14 versus a usual 62 bpm.",
        "expected": "RED by personal baseline (z ~ -4) although 46 bpm is only YELLOW by population limits -> R7 S-B-A-R.",
        "days": days,
    }

    rng = random.Random(SEED + 3)
    days = [nominal_day(rng, d) for d in range(1, DAYS + 1)]
    for d in days:
        if d["day"] >= 11:
            k = d["day"] - 10  # 1..4
            d["hr_rest_bpm"] = 62 + 6 + 2 * k + rng.randint(0, 1)
            d["skin_temp_c"] = round(36.5 + 0.013 * (d["day"] - 1) + 0.3 + 0.25 * k, 2)
            d["sleep_h"] = round(clamp(5.6 - 0.1 * k, 4.8, 6.0), 1)
            d["mood_1_5"] = 3
            d["intake_pct"] = round(78 - 3 * k)
    scenarios["infection"] = {
        "description": "Early infection/inflammation from day 11: resting HR and skin temperature above personal baseline, worse sleep.",
        "expected": "R4 early-infection warning (level 2 -> 3 when temperature >= baseline + 1.0 °C).",
        "days": days,
    }

    rng = random.Random(SEED + 4)
    days = [nominal_day(rng, d) for d in range(1, DAYS + 1)]
    for d in days:
        if d["day"] in (12, 13):
            d["sep_active"] = True
            d["sep_ref"] = "data/nasa/donki/donki-sep-demo-2025-11.json"
    scenarios["solar_storm"] = {
        "description": "Nominal vitals; real NASA DONKI solar energetic particle event replayed on days 12-13.",
        "expected": "R6 radiation storm (level 2; level 4 if GOES >= 1000 pfu).",
        "days": days,
    }
    return scenarios


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    scenarios = build()
    doc = {
        "version": "2.0.0",
        "generated_by": "data/scripts/generate_synthetic_dataset.py",
        "seed": SEED,
        "disclaimer": "SIMULATED data calibrated on published spaceflight studies. Not real astronaut data.",
        "units": {"hr_rest_bpm": "bpm", "spo2_pct": "%", "skin_temp_c": "°C (forehead/temporal skin sensor)",
                  "sleep_h": "h", "mood_1_5": "1-5", "pvt_lapses": "count RT>355 ms (PVT-B 3 min)",
                  "intake_pct": "% planned kcal", "exercise_pct": "% prescribed minutes",
                  "exercise_min": "min", "radiation_mgy_day": "mGy/day absorbed", "sep_active": "bool"},
        "thresholds": "contracts/medical-ranges-config.json",
        "calibration": CAL,
        "baseline_profile": BASELINE,
        "scenarios": scenarios,
    }
    (OUT / "galley-14day-scenarios.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False))
    cols = ["scenario", "day", "hr_rest_bpm", "spo2_pct", "skin_temp_c", "sleep_h", "mood_1_5", "pvt_lapses",
            "intake_pct", "exercise_pct", "exercise_min", "radiation_mgy_day", "sep_active"]
    with (OUT / "galley-14day-scenarios.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for name, sc in scenarios.items():
            for d in sc["days"]:
                w.writerow({"scenario": name, **d})
    print("wrote data/synthetic/galley-14day-scenarios.json and .csv")


if __name__ == "__main__":
    main()
