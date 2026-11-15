# Galley — the check-up that does itself
**Team Synera · NASA Space Apps Challenge 2026 · Challenge: _Create Health Monitoring Software for Astronauts on Space Missions_**

Team: Erick Flores · Luana Ojopi (Hardware) · Katherine Meneces · Brenda Calizaya (Software) · Ana Nuñez · Fidel Willca (Biotechnology & Data)

> On Mars, a doctor's answer can take 44 minutes. Galley lets astronauts check themselves in about 60 seconds. It compares them against **their own normal** and tells them what to do now.
> Galley is decision support, **not a medical device**: it does not diagnose or prescribe.

---

## What it does
1. **Local face recognition.** The crew member steps in front of the station screen. The face is matched on the device (face-api / TensorFlow.js), the profile loads, and the **camera switches off**.
2. **Head-to-toe body scan with voice.** Head (sleep, mood, reaction test, skin temperature), chest (resting heart rate, SpO₂), abdomen (food intake) and legs (exercise) each turn green, yellow or red.
3. **Personal baseline, not population averages.** Spaceflight shifts physiology: core temperature rises about 1 °C on long missions (Stahn et al., 2017) and ISS crews sleep about 6 h (Barger et al., 2014). Galley therefore uses a robust z-score (median and MAD) of each astronaut's last 14 days, plus absolute safety limits.
4. **Deterministic, cited rules (R1–R7):** short sleep, acute fatigue, under-eating, early infection warning, deconditioning, solar radiation storm, and S-B-A-R escalation. Each rule cites its source.
5. **Mission-aware autonomy:**
   - **ISS:** the flight surgeon is notified now.
   - **Moon:** near-real-time notice (about 1.3 s each way).
   - **Mars:** a guided on-board protocol runs, and an **S-B-A-R report is queued** for Earth (reply in about 44 min).
6. **"What does this mean?"** Every indicator answers four questions: what it measures, which NASA hazard affects it, what is normal for me, and what to do now. Each answer links to the NASA HRP risk page.

## Data used
| Data | Source | How Galley uses it |
|---|---|---|
| Solar energetic particle events | **NASA DONKI** (api.nasa.gov) | Radiation storm alert (R6), with an offline replay of the 10-Nov-2025 event |
| Inspiration4 crew labs (glucose, WBC) | **NASA OSDR** OSD-575 / OSD-569 | Real astronaut data that shows personal baseline vs. lab range |
| Human spaceflight hazards and risks | **NASA HRP** | RIDGE tags and the explanation texts |
| ISS radiation dose (LIDAL) | **ASI** (Di Fino et al., 2023) | Background dose, ISS mode |
| Radiation monitoring (CANS) | **CSA** (2026) | Radiation zone explanation |
| Mars and Moon dose | MSL/RAD (Zeitlin 2013; Hassler 2014), Chang'e-4 LND (Zhang 2020) | Background dose, Moon and Mars modes |
| GOES proton flux | NOAA SWPC | Live S-scale level |
| 14-day vital-sign series | **Simulated**, calibrated on the publications above | Demo scenarios: nominal, fatigue, bradycardia, infection, solar storm |

Details: [`data/README.md`](data/README.md). Thresholds and sources: [`contracts/medical-ranges-config.json`](contracts/medical-ranges-config.json).

## Repository
```
contracts/   frozen interfaces: SerialFrame + DailyRecord, thresholds, S-B-A-R report
data/        real NASA/NOAA data, curated references, calibrated synthetic dataset, scripts
software/    domain engine (TypeScript, pure, tested) + web app
hardware/    ESP32 + MAX30102 firmware (USB serial JSON, 1 Hz), Plan B simulator, Wokwi
docs/        ADRs, medical resources, scientific evidence (Spanish, team-internal)
submission/  project page text, video script (English)
plan.md · WORKFLOW.md   team plan and parallel workflow (Spanish)
```

## Quick start
```bash
# Engine tests (run on the real repo data)
cd software && npm test

# Plan B sensor simulator (same JSON line as the ESP32)
python3 hardware/hardware-simulator/simulator.py --scenario bradycardia

# Refresh real data / rebuild the synthetic dataset
python3 data/scripts/fetch_nasa_data.py
python3 data/scripts/generate_synthetic_dataset.py
```

## Hardware (optional; the app works without it)
ESP32 DevKit v1 + MAX30102 (I²C, SDA = GPIO21, SCL = GPIO22). The board sends one JSON line per second over USB at 115200 baud, for example `{"t":12345,"hr":62,"spo2":97,"temp":36.6,"q":1,"src":"sensor"}`. The browser reads it with the Web Serial API (Chrome/Edge). Finger PPG is not clinical grade: values are shown only when signal quality `q = 1`.

## Ethics and limits
- Camera on only during the check-up. Face data never leaves the device. Profiles can be deleted.
- Vital-sign series are simulated and labeled as such. Real data is used where NASA publishes it openly.
- Blood pressure and glucose need dedicated devices. In this prototype glucose is a manual, informational entry and blood pressure is future work.
- Recommendations only. Galley never blocks tasks or prescribes drugs.

## AI use
- Google Gemini helped with initial brainstorming.
- Claude (Anthropic) and Claude Code helped with source research, code and documentation.
- face-api runs local, non-generative face matching.
- The solution idea is the team's. Every medical figure comes from a cited source, not from an AI.

---
*NASA Space Apps Challenge 2026 · Team Synera. Not affiliated with or endorsed by NASA.*
