#!/usr/bin/env python3
"""
Galley — fetch and tidy the REAL open data used by the app.

Sources (all public, no login):
  1. NASA DONKI (CCMC) — Solar Energetic Particle (SEP) events, via api.nasa.gov
  2. NOAA SWPC — GOES integral proton flux, last 7 days (>=10 MeV, >=100 MeV)
  3. NASA OSDR — SpaceX Inspiration4 crew clinical labs:
       OSD-575 (LSDS-8) Comprehensive Metabolic Panel  -> glucose (mg/dL)
       OSD-569 (LSDS-7) Complete Blood Count           -> white blood cells (10^3/uL)

Usage (from repo root):
  python3 data/scripts/fetch_nasa_data.py                 # everything
  python3 data/scripts/fetch_nasa_data.py --only osdr     # just re-tidy OSDR CSVs
  NASA_API_KEY=xxxx python3 data/scripts/fetch_nasa_data.py   # avoid DEMO_KEY limits

DONKI limits: max 60 days per request; DEMO_KEY = 30 requests/hour/IP.
Standard library only (no pip install needed).
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
API_KEY = os.environ.get("NASA_API_KEY", "DEMO_KEY")
UA = {"User-Agent": "galley-spaceapps-data-fetch/1.0"}


def get_json(url: str):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def get_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


# ---------------------------------------------------------------- DONKI SEP
DONKI_FILE = DATA / "nasa" / "donki" / "donki-sep-events.json"
DEMO_FILE = DATA / "nasa" / "donki" / "donki-sep-demo-2025-11.json"
DEMO_WINDOW = ("2025-11-10", "2025-11-15")  # SEP linked to the 2025-11-10 X-class flare


def fetch_donki_sep(start: date, end: date) -> None:
    """Incremental: merges into DONKI_FILE, skips 60-day chunks already covered,
    stops at the first HTTP 429 (rate limit) so it can simply be re-run later."""
    db = {"events": [], "covered_ranges": []}
    if DONKI_FILE.exists():
        db = json.loads(DONKI_FILE.read_text())
    events = {e["sepID"]: e for e in db.get("events", [])}
    covered = [tuple(r) for r in db.get("covered_ranges", [])]

    def is_covered(a: date, b: date) -> bool:
        return any(date.fromisoformat(x) <= a and b <= date.fromisoformat(y) for x, y in covered)

    cur = start
    while cur <= end:
        chunk_end = min(cur + timedelta(days=59), end)
        if not is_covered(cur, chunk_end):
            url = (f"https://api.nasa.gov/DONKI/SEP?startDate={cur.isoformat()}"
                   f"&endDate={chunk_end.isoformat()}&api_key={API_KEY}")
            try:
                for ev in get_json(url) or []:
                    events[ev["sepID"]] = ev
                covered.append((cur.isoformat(), chunk_end.isoformat()))
                print(f"  DONKI SEP {cur}..{chunk_end}: total {len(events)}")
            except Exception as exc:
                print(f"  ! DONKI SEP {cur}..{chunk_end} failed: {exc} — re-run later", file=sys.stderr)
                if "429" in str(exc):
                    break
            time.sleep(1)
        cur = chunk_end + timedelta(days=1)

    ordered = sorted(events.values(), key=lambda e: e["eventTime"])
    DONKI_FILE.write_text(json.dumps({
        "source": "NASA CCMC DONKI — Solar Energetic Particle events (https://api.nasa.gov/DONKI/SEP)",
        "retrieved_at": now_iso(),
        "covered_ranges": sorted(covered),
        "count": len(ordered),
        "events": ordered,
    }, indent=1, ensure_ascii=False))
    print(f"  -> {DONKI_FILE.relative_to(ROOT)} ({len(ordered)} events, {len(covered)} ranges covered)")

    demo = [e for e in ordered if DEMO_WINDOW[0] <= e["eventTime"][:10] <= DEMO_WINDOW[1]]
    if demo:
        DEMO_FILE.write_text(json.dumps({
            "source": "NASA CCMC DONKI — SEP events, demo window " + " to ".join(DEMO_WINDOW),
            "use": "Offline snapshot for the Galley 'solar storm' demo scenario (rule R6).",
            "retrieved_at": now_iso(),
            "events": demo,
        }, indent=1, ensure_ascii=False))
        print(f"  -> {DEMO_FILE.relative_to(ROOT)} ({len(demo)} events)")


# ------------------------------------------------------------- GOES protons
def fetch_goes_protons() -> None:
    url = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-7-day.json"
    rows = get_json(url)
    keep = [r for r in rows if r.get("energy") in (">=10 MeV", ">=100 MeV")]
    out = {
        "source": "NOAA SWPC GOES primary integral proton flux, 7 days (" + url + ")",
        "units": "pfu = particles / (cm^2 s sr)",
        "noaa_s_scale_10MeV_pfu": {"S1": 10, "S2": 100, "S3": 1000, "S4": 10000, "S5": 100000},
        "retrieved_at": now_iso(),
        "count": len(keep),
        "data": keep,
    }
    path = DATA / "noaa" / f"goes-integral-protons-7day-{date.today().strftime('%Y%m%d')}.json"
    path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"  -> {path.relative_to(ROOT)} ({len(keep)} rows)")


# ---------------------------------------------------------- OSDR Inspiration4
OSDR = "https://osdr.nasa.gov/geode-py/ws/studies/{osd}/download?source=datamanager&file={file}"
OSDR_FILES = {
    "cmp": ("OSD-575", "LSDS-8_Comprehensive_Metabolic_Panel_CMP.upload_SUBMITTED.csv"),
    "cbc": ("OSD-569", "LSDS-7_Complete_Blood_Count_CBC.upload_SUBMITTED.csv"),
}
TIMEPOINT_ORDER = ["L-92", "L-44", "L-3", "R+1", "R+45", "R+82", "R+194"]


def read_long_csv(path: Path, analyte: str):
    rows = []
    with path.open(encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            if r["ANALYTE"].strip().upper() != analyte:
                continue
            tp = (r.get("timepoint") or r.get("TEST_DATE") or "").strip()
            try:
                val = float(r["VALUE"])
            except ValueError:
                continue
            rows.append({"subject": r["SUBJECT_ID"], "sex": r["SEX"], "timepoint": tp,
                         "value": val, "range_min": float(r["RANGE_MIN"]),
                         "range_max": float(r["RANGE_MAX"]), "units": r["UNITS"]})
    return rows


def tidy_osdr(download: bool) -> None:
    folder = DATA / "nasa" / "osdr"
    folder.mkdir(parents=True, exist_ok=True)
    if download:
        for osd, fname in OSDR_FILES.values():
            (folder / fname).write_bytes(get_bytes(OSDR.format(osd=osd, file=fname)))
            print(f"  downloaded {osd}/{fname}")
    glucose = read_long_csv(folder / OSDR_FILES["cmp"][1], "GLUCOSE")
    wbc = read_long_csv(folder / OSDR_FILES["cbc"][1], "WHITE BLOOD CELL COUNT")

    def per_subject(rows):
        subjects = {}
        for r in rows:
            s = subjects.setdefault(r["subject"], {"sex": r["sex"], "series": {}})
            s["series"][r["timepoint"]] = r["value"]
        for s in subjects.values():
            pre = [s["series"][t] for t in ("L-92", "L-44", "L-3") if t in s["series"]]
            s["preflight_baseline_mean"] = round(sum(pre) / len(pre), 2) if pre else None
            s["series"] = {t: s["series"][t] for t in TIMEPOINT_ORDER if t in s["series"]}
        return subjects

    out = {
        "source": "NASA Open Science Data Repository (OSDR) — SpaceX Inspiration4 (3-day orbital flight, Sept 2021)",
        "studies": {
            "glucose": "OSD-575 / LSDS-8 Comprehensive Metabolic Panel — https://osdr.nasa.gov/bio/repo/data/studies/OSD-575",
            "wbc": "OSD-569 / LSDS-7 Complete Blood Count — https://osdr.nasa.gov/bio/repo/data/studies/OSD-569",
        },
        "timepoints": "L-x = days before launch, R+x = days after return",
        "crew_ids": "C001-C004 are OSDR's anonymized subject IDs",
        "caveat": ("Civilian 3-day mission, n=4. Several R+45 glucose values (36-44 mg/dL) are far below "
                   "the lab range in all crew at the same visit; treat as a likely pre-analytical/sample "
                   "handling effect (VERIFY in OSDR metadata / Jones et al. 2024) and never as a diagnosis."),
        "how_galley_uses_it": ("Demonstrates the personal-baseline idea on REAL spaceflight data: each crew "
                               "member's pre-flight mean (L-92, L-44, L-3) vs. the lab population range."),
        "retrieved_at": now_iso(),
        "glucose_mg_dl": {
            "lab_reference_range": [glucose[0]["range_min"], glucose[0]["range_max"]] if glucose else None,
            "crew": per_subject(glucose),
        },
        "wbc_thousand_per_ul": {
            "lab_reference_range": [wbc[0]["range_min"], wbc[0]["range_max"]] if wbc else None,
            "crew": per_subject(wbc),
        },
    }
    path = folder / "inspiration4-crew-labs.json"
    path.write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(f"  -> {path.relative_to(ROOT)} ({len(glucose)} glucose, {len(wbc)} WBC values)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["donki", "goes", "osdr"], default=None)
    ap.add_argument("--start", default="2024-05-01", help="DONKI start date (YYYY-MM-DD)")
    ap.add_argument("--end", default=date.today().isoformat(), help="DONKI end date")
    ap.add_argument("--no-download", action="store_true", help="OSDR: only re-tidy local CSVs")
    a = ap.parse_args()
    for sub in ("nasa/donki", "nasa/osdr", "noaa"):
        (DATA / sub).mkdir(parents=True, exist_ok=True)
    if a.only in (None, "osdr"):
        print("[OSDR] Inspiration4 labs"); tidy_osdr(download=not a.no_download)
    if a.only in (None, "goes"):
        print("[NOAA] GOES protons"); fetch_goes_protons()
    if a.only in (None, "donki"):
        print("[NASA] DONKI SEP"); fetch_donki_sep(date.fromisoformat(a.start), date.fromisoformat(a.end))


if __name__ == "__main__":
    main()
