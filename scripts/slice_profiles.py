#!/usr/bin/env python3
"""
slice_profiles.py — Slice all 3MF files in print_profiles/ and produce a
ready-to-publish filament CSV for the webapp.

NAMING CONVENTION
  Files must be named {profile_id}.3mf  (e.g.  6x6_h1.3mf, 4x3_h2.3mf)
  The profile ID is taken from the filename stem.

HOW AGGREGATION WORKS
  Each 3MF has multiple plates:
    Plate 1  — always the standard drawer frame  (always included)
    Plates 2+ — drawer variants OR alternate frames for other printers

  Plate classification (in priority order):
  1. Plate name from Metadata/model_settings.config:
       name contains "Frame": alternate frame, skip
       name contains "Drawer": drawer variant, include in average
  2. Weight fallback (if no name info):
       weight >= ALT_FRAME_THRESHOLD * plate-1 weight: skip
       weight <  ALT_FRAME_THRESHOLD * plate-1 weight: include

  Total for a profile = plate_1 + average(drawer_variant_plates)

OUTPUT FILES (both gitignored)
  filament_data_raw.csv        - per-plate data (for inspection)
  filament_data_final.csv      - per-profile aggregated (id, grams, hours)

USAGE
  python scripts/slice_profiles.py              # slice everything
  python scripts/slice_profiles.py 6x6_h1      # slice a single profile
  python scripts/slice_profiles.py --reuse      # re-parse cached gcode, no re-slice
"""

import csv
import re
import subprocess
import sys
import zipfile
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent.parent
PROFILES    = ROOT / "print_profiles"
SLICE_OUT   = ROOT / "slice_output"
RAW_CSV     = ROOT / "filament_data_raw.csv"
FINAL_CSV   = ROOT / "filament_data_final.csv"
BAMBU_EXE   = Path(r"C:\Program Files\Bambu Studio\bambu-studio.exe")

# Weight-based fallback: skip non-plate-1 plates that are >= this fraction of
# plate 1's weight (alternate frames are ~99% of the main frame weight).
ALT_FRAME_THRESHOLD = 0.90

# Files to skip entirely (not a normal frame+drawer profile).
SKIP_FILES = {'Gridfinity_Baseplates_v2.1'}

# Baseplates: each plate is its own catalog entry (no frame+drawer aggregation).
# Maps plate number to catalog profile_id. Corner plates are omitted for now.
BASEPLATE_FILE = 'Gridfinity_Baseplates_v2.1'
BASEPLATE_PLATES: dict[int, str] = {
    1:  'baseplate_3x5',
    2:  'baseplate_3x4',
    3:  'baseplate_2x5',
    4:  'baseplate_2x4',
    5:  'baseplate_3x6',
    6:  'baseplate_2x2',
    7:  'baseplate_2x3',
    8:  'baseplate_2x6',
    9:  'baseplate_4x6',
    10: 'baseplate_4x4',
    11: 'baseplate_3x3',
    12: 'baseplate_4x5',
    13: 'baseplate_5x5',
    14: 'baseplate_5x6',
    # Plates 15-17 are Corner pieces — skipped
}

# Files that contain multiple distinct catalog entries (each with their own frame).
# Each group specifies the catalog profile_id, the frame plate number, and which
# plate numbers are drawer variants for that group.
# These files are NOT processed by the normal single-profile logic.
FILE_SPLITS: dict[str, list[dict]] = {
    # 3x4_h1.3mf has two frame types:
    #   Plate 1 (163g) = 3x4 Mini 1-drawer frame + plates 2-3 = its drawers (print 1)
    #   Plate 4 (172g) = 3x4 Mini 2-drawer frame + plates 5-7 = its drawers (print 2)
    '3x4_h1': [
        {'profile_id': '3x4_mini_1', 'frame': 1, 'drawers': [2, 3], 'drawer_qty': 1},
        {'profile_id': '3x4_mini_2', 'frame': 4, 'drawers': [5, 6, 7], 'drawer_qty': 2},
    ],
    # 4x4_h1.3mf has two frame types:
    #   Plate 1 (235g) = 4x4 1-drawer frame  + plate 2 = its drawer (print 1)
    #   Plate 3 (259g) = 4x4 2-drawer frame + plate 4 = its drawer (print 2)
    '4x4_h1': [
        {'profile_id': '4x4_h1',   'frame': 1, 'drawers': [2], 'drawer_qty': 1},
        {'profile_id': '4x4_mini', 'frame': 3, 'drawers': [4], 'drawer_qty': 2},
    ],
}

# ── Helpers ────────────────────────────────────────────────────────────────────

def parse_time_to_hours(time_str: str) -> float:
    """'14h59m' or '20h 38m 47s' : decimal hours."""
    h  = int(m.group(1)) if (m := re.search(r'(\d+)h',  time_str)) else 0
    mn = int(m.group(1)) if (m := re.search(r'(\d+)m',  time_str)) else 0
    s  = int(m.group(1)) if (m := re.search(r'(\d+)s',  time_str)) else 0
    return round(h + mn / 60 + s / 3600, 8)


def read_plate_names(tmf: Path) -> dict[int, str]:
    """
    Read plate names from Metadata/model_settings.config inside the 3MF zip.
    Returns {plate_number: plate_name}.
    """
    try:
        with zipfile.ZipFile(tmf) as z:
            if "Metadata/model_settings.config" not in z.namelist():
                return {}
            raw = z.read("Metadata/model_settings.config").decode("utf-8", errors="replace")
            plates = re.findall(r"<plate>.*?</plate>", raw, re.DOTALL)
            result = {}
            for plate in plates:
                pid   = re.search(r'plater_id" value="(\d+)"', plate)
                pname = re.search(r'plater_name" value="([^"]*)"', plate)
                if pid and pname:
                    result[int(pid.group(1))] = pname.group(1)
            return result
    except Exception:
        return {}


def parse_gcode(path: Path) -> dict | None:
    """Extract filament weight and total estimated time from a Bambu gcode header."""
    grams    = None
    time_str = None
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.startswith(";"):
                break
            if grams is None:
                m = re.search(r"total filament weight \[g\]\s*:\s*([\d.]+)", line)
                if m:
                    grams = float(m.group(1))
            if time_str is None:
                m = re.search(r"total estimated time:\s*([^;]+)", line)
                if m:
                    time_str = m.group(1).strip()
            if grams is not None and time_str is not None:
                break

    if grams is None or time_str is None:
        return None
    return {"grams": grams, "time_str": time_str, "hours": parse_time_to_hours(time_str)}


SLICE_TIMEOUT = 60  # seconds; Bambu Studio sometimes hangs indefinitely

def slice_file(tmf: Path, out_dir: Path) -> bool:
    """Run Bambu Studio CLI --slice on the given 3MF, output gcode to out_dir."""
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            [str(BAMBU_EXE), "--slice", "0", "--outputdir", str(out_dir), str(tmf)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=SLICE_TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT: Bambu Studio hung after {SLICE_TIMEOUT}s, skipping")
        # Kill any leftover Bambu process
        subprocess.run(["taskkill", "/f", "/im", "bambu-studio.exe"],
                       capture_output=True)
        return False
    return any(out_dir.glob("plate_*.gcode"))


def aggregate(profile_id: str, plate_rows: list[dict], plate_names: dict[int, str]) -> dict | None:
    """
    Apply the plate-1 + avg(drawer variants) formula.
    Uses plate names for classification; falls back to weight ratio.
    """
    if not plate_rows:
        return None

    frame = next((r for r in plate_rows if r["Plate #"] == 1), None)
    if frame is None:
        return None

    frame_g = float(frame["Filament (g)"])
    frame_h = float(frame["Decimal Hours"])

    drawer_variants = []
    skipped = []

    for r in plate_rows:
        if r["Plate #"] == 1:
            continue

        pname  = plate_names.get(r["Plate #"], "")
        weight = float(r["Filament (g)"])

        name_lower = pname.lower()
        if pname and name_lower.endswith("frame"):
            # Name clearly identifies an alternate frame (e.g. "4x5 Divided Drawer Frame")
            skipped.append((r["Plate #"], f'name="{pname}"'))
        elif weight >= frame_g * ALT_FRAME_THRESHOLD:
            # Weight fallback: catches alternate frames regardless of name
            # (e.g. "6x4 Frame - X1-P1-A1 Height" at 99% of frame weight)
            skipped.append((r["Plate #"], f"weight {weight}g >= {ALT_FRAME_THRESHOLD*100:.0f}% of frame"))
        else:
            drawer_variants.append(r)

    if skipped:
        for plate_num, reason in skipped:
            print(f"    Skipped plate {plate_num} ({reason})")

    if drawer_variants:
        avg_g = sum(float(r["Filament (g)"]) for r in drawer_variants) / len(drawer_variants)
        avg_h = sum(float(r["Decimal Hours"]) for r in drawer_variants) / len(drawer_variants)
        total_g = round(frame_g + avg_g, 2)
        total_h = round(frame_h + avg_h, 8)
        note = f"plate1 + avg({len(drawer_variants)} drawer variants)"
    else:
        total_g = round(frame_g, 2)
        total_h = round(frame_h, 8)
        note = "plate1 only"

    print(f"    => {total_g}g  {total_h:.4f}h  ({note})")
    return {"id": profile_id, "grams": total_g, "hours": total_h}


def aggregate_split(plate_rows: list[dict], groups: list[dict]) -> list[dict]:
    """
    Process a FILE_SPLITS file: compute one aggregated row per group.
    Each group specifies {'profile_id', 'frame': plate_num, 'drawers': [plate_nums]}.
    """
    by_plate = {r["Plate #"]: r for r in plate_rows}
    results = []
    for g in groups:
        frame_row = by_plate.get(g["frame"])
        if frame_row is None:
            print(f"    WARNING: frame plate {g['frame']} not found for {g['profile_id']}")
            continue
        frame_g = float(frame_row["Filament (g)"])
        frame_h = float(frame_row["Decimal Hours"])
        drawer_qty = g.get("drawer_qty", 1)
        drawer_rows = [by_plate[p] for p in g["drawers"] if p in by_plate]
        if drawer_rows:
            avg_g = sum(float(r["Filament (g)"]) for r in drawer_rows) / len(drawer_rows)
            avg_h = sum(float(r["Decimal Hours"]) for r in drawer_rows) / len(drawer_rows)
            total_g = round(frame_g + drawer_qty * avg_g, 2)
            total_h = round(frame_h + drawer_qty * avg_h, 8)
            qty_str = f"{drawer_qty}×" if drawer_qty > 1 else ""
            note = f"plate{g['frame']} + {qty_str}avg({len(drawer_rows)} drawers: plates {g['drawers']})"
        else:
            total_g = round(frame_g, 2)
            total_h = round(frame_h, 8)
            note = f"plate{g['frame']} only"
        print(f"    {g['profile_id']}: {total_g}g  {total_h:.4f}h  ({note})")
        results.append({"id": g["profile_id"], "grams": total_g, "hours": total_h})
    return results


# Per-profile processing

def process_profile(tmf: Path, reuse: bool) -> tuple[list[dict], dict[int, str]]:
    """Slice (or reuse) and return (plate_rows, plate_names) for this profile."""
    profile_id = tmf.stem
    out_dir    = SLICE_OUT / profile_id

    # Read plate names from the 3MF before slicing
    plate_names = read_plate_names(tmf)
    if plate_names:
        print(f"    Plate names: { {k: v for k, v in sorted(plate_names.items())} }")

    if not reuse or not any(out_dir.glob("plate_*.gcode")):
        print(f"  Slicing {profile_id}...", flush=True)
        if not slice_file(tmf, out_dir):
            print(f"  FAILED: No gcode produced for {profile_id}")
            return [], plate_names
    else:
        print(f"  Reusing cached gcode for {profile_id}", flush=True)

    rows = []
    gcodes = sorted(
        out_dir.glob("plate_*.gcode"),
        key=lambda p: int(re.search(r"(\d+)", p.stem).group(1))
    )
    for gcode in gcodes:
        plate_num = int(re.search(r"(\d+)", gcode.stem).group(1))
        data = parse_gcode(gcode)
        if data is None:
            print(f"    WARNING: Could not parse {gcode.name}")
            continue
        pname = plate_names.get(plate_num, "")
        label = f'  [{pname}]' if pname else ""
        rows.append({
            "Profile ID":   profile_id,
            "Plate #":      plate_num,
            "Plate Name":   pname,
            "Filament (g)": data["grams"],
            "Time String":  data["time_str"],
            "Decimal Hours": data["hours"],
        })
        print(f"    Plate {plate_num}{label}: {data['grams']}g  {data['time_str']}")

    return rows, plate_names


def process_baseplates(reuse: bool) -> tuple[list[dict], list[dict]]:
    """
    Slice (or reuse) the baseplates 3MF and return (raw_rows, agg_rows).
    Each plate is its own catalog entry — no frame+drawer aggregation.
    """
    tmf = PROFILES / f"{BASEPLATE_FILE}.3mf"
    if not tmf.exists():
        print(f"  Baseplates file not found: {tmf}")
        return [], []

    out_dir = SLICE_OUT / BASEPLATE_FILE
    plate_names = read_plate_names(tmf)

    if not reuse or not any(out_dir.glob("plate_*.gcode")):
        print(f"  Slicing {BASEPLATE_FILE}...", flush=True)
        if not slice_file(tmf, out_dir):
            print(f"  FAILED: No gcode produced for {BASEPLATE_FILE}")
            return [], []
    else:
        print(f"  Reusing cached gcode for {BASEPLATE_FILE}", flush=True)

    raw_rows, agg_rows = [], []
    gcodes = sorted(
        out_dir.glob("plate_*.gcode"),
        key=lambda p: int(re.search(r"(\d+)", p.stem).group(1))
    )
    for gcode in gcodes:
        plate_num = int(re.search(r"(\d+)", gcode.stem).group(1))
        profile_id = BASEPLATE_PLATES.get(plate_num)
        if profile_id is None:
            continue  # Corner plates and any unknowns
        data = parse_gcode(gcode)
        if data is None:
            print(f"    WARNING: Could not parse {gcode.name}")
            continue
        pname = plate_names.get(plate_num, "")
        print(f"    Plate {plate_num}  [{pname}]: {data['grams']}g  {data['time_str']}  -> {profile_id}")
        raw_rows.append({
            "Profile ID":    BASEPLATE_FILE,
            "Plate #":       plate_num,
            "Plate Name":    pname,
            "Filament (g)":  data["grams"],
            "Time String":   data["time_str"],
            "Decimal Hours": data["hours"],
        })
        agg_rows.append({"id": profile_id, "grams": data["grams"], "hours": data["hours"]})

    return raw_rows, agg_rows


# Main

def main():
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    args  = [a for a in sys.argv[1:] if not a.startswith("--")]
    reuse = "--reuse" in flags

    if not BAMBU_EXE.exists():
        print(f"ERROR: Bambu Studio not found at {BAMBU_EXE}")
        sys.exit(1)

    if args:
        # Baseplates are handled separately — exclude from the normal profile loop
        profile_args = [a for a in args if a != BASEPLATE_FILE]
        tmfs = [PROFILES / f"{a}.3mf" for a in profile_args]
        missing = [t for t in tmfs if not t.exists()]
        if missing:
            print(f"ERROR: file(s) not found: {[str(m) for m in missing]}")
            sys.exit(1)
    else:
        tmfs = [t for t in sorted(PROFILES.glob("*.3mf")) if t.stem not in SKIP_FILES]
        if not tmfs:
            print(f"No .3mf files found in {PROFILES}/")
            print("Files should be named {profile_id}.3mf  e.g.  6x6_h1.3mf")
            sys.exit(1)

    all_raw: list[dict] = []
    all_agg: list[dict] = []

    for tmf in tmfs:
        profile_id = tmf.stem
        print(f"\n[{profile_id}]")
        plate_rows, plate_names = process_profile(tmf, reuse)
        all_raw.extend(plate_rows)

        if profile_id in FILE_SPLITS:
            # Multi-profile file: produce one aggregated row per split group
            all_agg.extend(aggregate_split(plate_rows, FILE_SPLITS[profile_id]))
        else:
            agg = aggregate(profile_id, plate_rows, plate_names)
            if agg:
                all_agg.append(agg)

    # Process baseplates (only when running a full pass, not a targeted single-file run)
    if not args or BASEPLATE_FILE in args:
        print(f"\n[{BASEPLATE_FILE}]")
        bp_raw, bp_agg = process_baseplates(reuse)
        all_raw.extend(bp_raw)
        all_agg.extend(bp_agg)

    if not all_raw:
        print("\nNo data extracted.")
        return

    # Merge with existing CSVs when processing a subset
    def merge_existing(path: Path, new_rows: list[dict], id_key: str) -> list[dict]:
        existing = []
        if path.exists() and args:
            updated_ids = {r[id_key] for r in new_rows}
            with open(path, newline="", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    if row[id_key] not in updated_ids:
                        existing.append(row)
        return existing

    # Write raw CSV (includes Plate Name column)
    raw_existing = merge_existing(RAW_CSV, all_raw, "Profile ID")
    raw_final = sorted(raw_existing + all_raw, key=lambda r: (r["Profile ID"], int(r["Plate #"])))
    with open(RAW_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Profile ID", "Plate #", "Plate Name", "Filament (g)", "Time String", "Decimal Hours"])
        writer.writeheader()
        writer.writerows(raw_final)

    # Write final aggregated CSV
    agg_existing = merge_existing(FINAL_CSV, all_agg, "id")
    agg_final = sorted(agg_existing + all_agg, key=lambda r: r["id"])
    with open(FINAL_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "grams", "hours"])
        writer.writeheader()
        writer.writerows(agg_final)

    print(f"\nDone.")
    print(f"  {RAW_CSV.name}   - {len(raw_final)} plate rows (for inspection)")
    print(f"  {FINAL_CSV.name} - {len(agg_final)} profiles")


if __name__ == "__main__":
    main()
