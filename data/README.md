# Galley data

Everything the app reads lives here. Every file says where it comes from. Nothing here is invented without a label.

| Folder | What | Real or simulated | Owner |
|---|---|---|---|
| `nasa/donki/` | Solar Energetic Particle events from **NASA DONKI** (CCMC) via `api.nasa.gov` | **Real (NASA)** | Bio |
| `nasa/osdr/` | **SpaceX Inspiration4** crew clinical labs from **NASA OSDR**: glucose (OSD-575 CMP) and white blood cells (OSD-569 CBC), raw CSV + tidy JSON | **Real (NASA)** | Bio |
| `noaa/` | GOES integral proton flux (≥10 and ≥100 MeV), 7-day snapshot | **Real (NOAA)** | Bio |
| `reference/` | Environments (ISS/Moon/Mars), radiation baselines, rules R1–R7, "What does this mean?" texts | Curated from cited publications | Bio |
| `synthetic/` | 14-day, 5-scenario dataset (`nominal`, `fatigue`, `bradycardia`, `infection`, `solar_storm`) | **Simulated**, calibrated on published spaceflight data | Bio |
| `synthetic/archive/` | Earlier alternative dataset (v1, mood 0–10, BP/glucose). **Not used by the app.** | Simulated | — |
| `scripts/` | `fetch_nasa_data.py` (refresh real data) · `generate_synthetic_dataset.py` (rebuild synthetic) | — | Bio |

Thresholds are not in this folder. They live in [`../contracts/medical-ranges-config.json`](../contracts/medical-ranges-config.json).

## Why the vital signs are simulated
Individual astronaut vital signs are not public. NASA LSAH and LSDA give access only through a formal request. So Galley uses two kinds of data:
1. **Real NASA data wherever it exists openly:**
   - DONKI space weather.
   - Inspiration4 crew labs from OSDR.
   - Published measurements: ISS dose from ASI/LIDAL, Mars dose from MSL/RAD, and core temperature and sleep from ISS studies.
2. **Simulated daily series calibrated on those publications.** Every parameter and its source is listed inside `synthetic/galley-14day-scenarios.json` → `calibration`.

## Real data highlights
- **Personal baseline on real astronauts.** Take `osdr/inspiration4-crew-labs.json`. Compare each crew member's pre-flight mean (L-92, L-44, L-3) with the population lab range. Population ranges hide individual change.
  - **Caveat:** the R+45 glucose values (36–44 mg/dL in every crew member) are likely a sample-handling artifact. Never present them as clinical findings.
- **Solar storm replay.** `nasa/donki/donki-sep-demo.json` holds the SEP events of the May 2024 solar storm (X-class flares on 8–13 May; GOES >10 MeV SEP on 10 May, >100 MeV on 11 May). It drives rule R6 offline.
  - The 10-Nov-2025 event can be added with `fetch_nasa_data.py` once the `DEMO_KEY` limit resets (or with a free personal key from api.nasa.gov).

## Refresh
```bash
python3 data/scripts/fetch_nasa_data.py            # DONKI + GOES + OSDR (DEMO_KEY: 30 req/h)
NASA_API_KEY=<your key> python3 data/scripts/fetch_nasa_data.py --only donki
python3 data/scripts/generate_synthetic_dataset.py # deterministic (seed 2026)
```

## Licenses and citation
- NASA data (DONKI, OSDR) and NOAA data are public. Cite them as listed in `plan.md` §13.
- OSDR: SpaceX Inspiration4, OSD-575 and OSD-569 (https://osdr.nasa.gov).
- Use of the Inspiration4 data must follow the OSDR data use terms.
