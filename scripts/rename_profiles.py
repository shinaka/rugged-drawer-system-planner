#!/usr/bin/env python3
"""
rename_profiles.py — Rename downloaded 3MF files to {profile_id}.3mf

Run once from the project root:
  python scripts/rename_profiles.py

For the baseplates file, nothing is renamed — it stays as-is and is handled
specially by slice_profiles.py (each plate = a separate baseplate profile).
"""

import os
from pathlib import Path

PROFILES = Path(__file__).resolve().parent.parent / "print_profiles"

# filename to profile ID

RENAMES = {
    # H1 Standard
    "2x2_Drawers_FullSet":                  "2x2_h1",
    "2x3_Rugged_Drawer_Set":                "2x3_h1",
    "2x4_Drawer_Frame":                     "2x4_h1",
    "2x5_Div_Drawer_Frame":                 "2x5_h1",
    "3x1_Rugged_Drawer":                    "3x1_h1",
    "3x2_Drawers_FullSet":                  "3x2_h1",
    "3x3_Rugged_Drawer":                    "3x3_h1",
    "3x4_Drawer_FullSet":                   "3x4_h1",
    "3x5_Drawer_FullSet":                   "3x5_h1",
    "3x6_Rugged_Drawer_Set":               "3x6_h1",
    "4x1+Rugged+Drawer":                    "4x1_h1",
    "4x2_Drawer_MultiPlate":                "4x2_h1",
    "4x3_Drawer":                           "4x3_h1",
    "4x4_Drawer_MultiPlate_A1mini":         "4x4_h1",
    "4x5_Drawer_Fullset":                   "4x5_h1",
    "4x6_Drawer_Fullset":                   "4x6_h1",
    "5x1+Rugged+Drawer":                    "5x1_h1",
    "5x2_Rugged_Drawer":                    "5x2_h1",
    "5x3_Rugged_Drawer":                    "5x3_h1",
    "5x4_Rugged_Drawer":                    "5x4_h1",
    "5x5_Rugged_Drawer":                    "5x5_h1",
    "5x6_Rugged_Drawers_v2":               "5x6_h1",
    "6x1+Rugged+Drawer_H2x":               "6x1_h1",
    "6x2_Rugged_Drawer_H2D":               "6x2_h1",
    "6x3_Rugged_Drawer_H2D":               "6x3_h1",
    "6x4_Rugged_Drawer":                    "6x4_h1",
    "6x5_Rugged_Drawer_H2D":               "6x5_h1",
    "6x6_Rugged_Drawer_H2D":               "6x6_h1",  # TODO: CHECK

    # H2 Double High ("DEEP" or "Double" in filename = H2)
    "2x2_DEEP_Drawers":                     "2x2_h2",
    "2x4_DoubleHeight_Drawer":              "2x4_h2",
    "2x6_Double_Height_Drawer":             "2x6_h2",
    "3x3_Double-High_Drawer_v1":            "3x3_h2",
    "3x4_Double-High_Drawer":              "3x4_h2",
    "3x5_Double-Height_Drawer_Set":        "3x5_h2",
    "3x6_Rugged_Double_Height_Drawer_Set": "3x6_h2",
    "3x7_Rugged_Double_Height_Drawer_H2D": "3x7_h2",
    "4x2_Double-High_Drawer_MultiPlate":   "4x2_h2",
    "4x3_Double_High_Drawer":              "4x3_h2",
    "4x4_DoubleHeight_Drawer_MultiPlate_A1mini": "4x4_h2",
    "4x5_Double_High_Drawer":              "4x5_h2",
    "4x6_Double-High_Drawer_Frame":        "4x6_h2",
    "4x7_Double_Height_Drawer_v1.2":       "4x7_h2",
    "5x2_Rugged_Double-Height_Drawer":     "5x2_h2",
    "5x3_Rugged_Double_Height_Drawer_Frame": "5x3_h2",
    "5x4_Double_Height":                   "5x4_h2",
    "5x5_Rugged_Double_Height_Drawer":     "5x5_h2",
    "5x6_Double_Height_Drawer":            "5x6_h2",
    "5x7_Rugged_Drawer_H2D_v2":           "5x7_h2",
    "6x3_Rugged_Double-Height_Drawer_H2D": "6x3_h2",
    "6x4_Rugged_Drawer-DEEP":             "6x4_h2",
    "6x6_Double_High":                     "6x6_h2",

    # Special
    "3x5_Double_Stacked":                  "3x5_stacked",
    "5x6_Double_Stacked":                  "5x6_stacked",
}

def main():
    if not PROFILES.exists():
        print(f"ERROR: {PROFILES} not found")
        return

    done = skipped = errors = 0

    for old_stem, new_id in RENAMES.items():
        old_path = PROFILES / f"{old_stem}.3mf"
        new_path = PROFILES / f"{new_id}.3mf"

        if not old_path.exists():
            if new_path.exists():
                print(f"  already done: {new_id}.3mf")
                skipped += 1
            else:
                print(f"  NOT FOUND:    {old_stem}.3mf")
                errors += 1
            continue

        if new_path.exists() and new_path != old_path:
            print(f"  CONFLICT:     {new_id}.3mf already exists, skipping {old_stem}.3mf")
            errors += 1
            continue

        old_path.rename(new_path)
        print(f"  {old_stem}.3mf  ->  {new_id}.3mf")
        done += 1

    print(f"\nDone: {done} renamed, {skipped} already correct, {errors} issues")

    # Report any files that weren't in the map
    known = set(RENAMES.keys())
    unmapped = [
        f.name for f in PROFILES.glob("*.3mf")
        if f.stem not in known
        and f.stem not in RENAMES.values()
        and f.name != "Gridfinity_Baseplates_v2.1.3mf"
    ]
    if unmapped:
        print(f"\nUnmapped files (not renamed):")
        for f in sorted(unmapped):
            print(f"  {f}")


if __name__ == "__main__":
    main()
