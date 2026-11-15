# Space Apps project page — DRAFT (owner: Biotech · final by 17:00 · paste into the form in English)

## Project name
Galley — the check-up that does itself

## High-level summary
Galley is an on-device health check-up for astronauts on long missions. The crew member steps in front of the station screen; Galley recognizes them locally, switches the camera off, and runs a head-to-toe body scan with voice guidance. Each zone (head, chest, abdomen, legs) turns green, yellow or red by comparing today's sleep, mood, reaction-test lapses, resting heart rate, SpO₂, skin temperature, food intake and exercise against the astronaut's **own** 14-day baseline, not a population average, because spaceflight shifts physiology (core temperature rises ~1 °C on long missions). Seven deterministic, cited rules detect fatigue, early infection, under-eating, deconditioning and solar radiation storms, and explain in plain language what to do now. Galley adapts to the mission: on the ISS it alerts flight surgeons immediately; on Mars, with up to 44-minute round-trip delays, it guides the crew step by step and queues an S-B-A-R report for Earth. It uses real NASA DONKI space-weather events, real Inspiration4 crew labs from NASA OSDR, and ISS dose data from the Italian Space Agency. Galley is decision support, not a medical device.

## Demo link
<YouTube unlisted / Google Drive public link — test in a private window>

## Final project link
<GitHub Pages URL> · https://github.com/ErickFP7314/synera-spaceapps

## Detailed description
**What it does.** It turns the daily health check into a 60-second, no-forms routine:
- face login with the camera switched off right after the match;
- a body scan with voice and alarm;
- a body-check index;
- 14-day trend charts;
- "What does this mean?" answers for every indicator: what it measures, which NASA hazard affects it, what is normal for me, and what to do now. Each answer links to the NASA HRP risk page.

**How it works.**
- **Baseline.** A robust z-score (median and MAD of the last 14 days, excluding the 3 most recent) plus absolute safety limits.
- **Rules R1–R7:**
  - R1: short sleep.
  - R2: acute fatigue (short sleep + PVT-B lapses or low mood + heart rate above baseline).
  - R3: under-eating.
  - R4: early infection (resting heart rate up for 2 days + temperature above baseline), as validated with wearables on Earth.
  - R5: deconditioning.
  - R6: solar radiation storm (NASA DONKI SEP / GOES ≥ 10 pfu).
  - R7: S-B-A-R escalation.
- **Escalation.** Four action levels (self-care, tell the crew, flight surgeon, urgent) whose behavior changes per environment (ISS / Moon / Mars).

**Benefits.**
- Astronauts get autonomy when Earth is far away.
- Recommendations are explainable and auditable, with no black-box AI.
- Privacy by design: everything runs and stays on the device.

**On Earth,** the same local-first, baseline-driven model fits remote clinics with intermittent connectivity, high-altitude communities (where the "normal" SpO₂ is lower) and polar stations.

**Tools.**
- **Software:** HTML/CSS/JavaScript, SVG, Web Speech and Web Audio, face-api (TensorFlow.js), Web Serial API, and a TypeScript domain engine with node:test tests.
- **Hardware:** ESP32 + MAX30102 sending JSON at 1 Hz, plus a Python Plan B simulator.
- **Data:** Python scripts.

## Use of AI
- Google Gemini: initial brainstorming.
- Claude / Claude Code (Anthropic): source research, code assistance and documentation.
- face-api: local, non-generative face matching.
- No AI-generated images or video. If any are added, they carry a visible watermark.
- The solution idea is the team's. Every medical claim cites a source.

## NASA data
- NASA DONKI — Solar Energetic Particle events (https://api.nasa.gov/DONKI/SEP).
- NASA OSDR — SpaceX Inspiration4: OSD-575 (Comprehensive Metabolic Panel: glucose) and OSD-569 (Complete Blood Count: WBC).
- NASA Human Research Program — 5 Hazards, Risks of Human Spaceflight, Ongoing HRP Research.
- NASA MSL/RAD radiation measurements (Zeitlin et al. 2013; Hassler et al. 2014).
- NASA-STD-3001 Vol. 1 (career radiation limit).
- NASA ISS Research Explorer — ISS Internal Radiation Monitoring.

## Space agency partner data & other references
- **ASI:** Di Fino et al. 2023, LIDAL ISS radiation measurements (Life Sci Space Res 39:26-42).
- **CSA:** Monitoring radiation for astronaut health (2026); Why do we conduct science experiments in space?
- **NOAA SWPC:** GOES integral proton flux; Space Weather Scales.
- Scientific references: see plan.md §13 in the repository. Key ones: Stahn 2017, Barger 2014, Basner 2011, Mishra 2020, Smarr 2020, Crucian 2018, Haig 2006.
- **Code and libraries:** @vladmandic/face-api (license: VERIFY), SparkFun MAX3010x library.
