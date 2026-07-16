#!/usr/bin/env python3
"""Fail-closed checks for the temporary FORGE athlete portal export."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "forge-portal-programs.json"

FLAGSHIP_IDS = [
    "forge_sculpt_phase1_v1",
    "forge_sculpt_phase2_v1_fs",
    "forge_sculpt_phase3_v1_fs",
    "forge_sculpt_phase4_v1_fs",
]
EXPECTED_COUNTS = {
    "forge_sculpt": (15, 90, 519, 1520),
    "rod": (6, 12, 72, 252),
}
FORBIDDEN_TERMS = [
    "tibia",
    "accountability",
    "alcohol",
    "medication",
    "waist",
    "protein",
    "judgment",
    "mania",
    "depression",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def validate_set(item: dict, path: str) -> None:
    require("reps" in item or "seconds" in item, f"{path}: set has no reps or seconds")
    if "reps" in item:
        reps = item["reps"]
        require(reps["min"] >= 1, f"{path}: rep minimum must be positive")
        require(reps["max"] >= reps["min"], f"{path}: invalid rep range")
    if "seconds" in item:
        require(item["seconds"] >= 1, f"{path}: seconds must be positive")
    if "rir" in item:
        rir = item["rir"]
        require(rir["min"] >= 0, f"{path}: RIR minimum cannot be negative")
        require(rir["max"] >= rir["min"], f"{path}: invalid RIR range")


def validate_weeks(weeks: list[dict], path: str) -> tuple[int, int, int, int]:
    week_numbers = [week["weekNumber"] for week in weeks]
    require(len(week_numbers) == len(set(week_numbers)), f"{path}: duplicate week number")

    training_sessions = 0
    exercise_occurrences = 0
    prescribed_sets = 0
    for week in weeks:
        days = week["days"]
        day_indices = [day["dayIndex"] for day in days]
        require(len(day_indices) == len(set(day_indices)), f"{path}/week-{week['weekNumber']}: duplicate day")
        for day in days:
            day_path = f"{path}/week-{week['weekNumber']}/day-{day['dayIndex']}"
            exercises = day["exercises"]
            if day["kind"] == "rest":
                require(not exercises, f"{day_path}: rest day contains exercises")
                continue
            require(exercises, f"{day_path}: training day has no exercises")
            training_sessions += 1
            exercise_occurrences += len(exercises)
            for exercise in exercises:
                sets = exercise["sets"]
                require(sets, f"{day_path}/{exercise['movementId']}: no prescribed sets")
                prescribed_sets += len(sets)
                for index, item in enumerate(sets):
                    validate_set(item, f"{day_path}/{exercise['movementId']}/set-{index + 1}")

    return len(weeks), training_sessions, exercise_occurrences, prescribed_sets


def main() -> None:
    raw = DATA_PATH.read_text()
    data = json.loads(raw)
    require(data["schemaVersion"] == "1.0.0", "unsupported schema version")

    programs = {program["id"]: program for program in data["programs"]}
    require(set(programs) == {"forge_sculpt", "rod"}, "export must contain only Forge Sculpt and Rod")

    sculpt = programs["forge_sculpt"]
    require(sculpt["kind"] == "phased", "Forge Sculpt must use phased navigation")
    require(len(sculpt["phases"]) == 4, "Forge Sculpt must contain exactly four phases")
    require(
        [phase["programId"] for phase in sculpt["phases"]] == FLAGSHIP_IDS,
        "flagship runtime allowlist mismatch",
    )
    sculpt_counts = [0, 0, 0, 0]
    for expected_number, phase in enumerate(sculpt["phases"], start=1):
        require(phase["phaseNumber"] == expected_number, "phase ordering mismatch")
        counts = validate_weeks(phase["weeks"], f"forge_sculpt/phase-{expected_number}")
        sculpt_counts = [left + right for left, right in zip(sculpt_counts, counts)]

    rod = programs["rod"]
    require(rod["kind"] == "weekly", "Rod must use weekly navigation")
    rod_counts = validate_weeks(rod["weeks"], "rod")

    require(tuple(sculpt_counts) == EXPECTED_COUNTS["forge_sculpt"], "Forge Sculpt census mismatch")
    require(rod_counts == EXPECTED_COUNTS["rod"], "Rod census mismatch")

    for term in FORBIDDEN_TERMS:
        require(not re.search(rf"\b{re.escape(term)}\b", raw, re.IGNORECASE), f"forbidden term: {term}")

    print("FORGE portal data valid")
    print(f"Forge Sculpt: {tuple(sculpt_counts)}")
    print(f"Rod: {rod_counts}")


if __name__ == "__main__":
    main()
