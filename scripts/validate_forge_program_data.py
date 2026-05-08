#!/usr/bin/env python3
"""Validate Forge program data JSON without external dependencies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "forge-programs.json"

VERSION_RE = re.compile(r"^\d+\.\d+\.\d+$")
PROGRAM_ID_RE = re.compile(r"^[a-z0-9_]+_v\d+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def fail(msg: str) -> None:
    print(f"ERROR: {msg}")
    raise SystemExit(1)


def expect(condition: bool, msg: str) -> None:
    if not condition:
        fail(msg)


def expect_type(value, expected_type, path: str) -> None:
    if not isinstance(value, expected_type):
        fail(f"{path} expected {expected_type.__name__}, got {type(value).__name__}")


def validate_set(set_obj: dict, path: str) -> None:
    expect_type(set_obj, dict, path)
    has_reps = "reps" in set_obj
    has_seconds = "seconds" in set_obj
    expect(has_reps != has_seconds, f"{path} must contain exactly one of reps or seconds")

    if has_reps:
        expect_type(set_obj["reps"], int, f"{path}.reps")
        expect(set_obj["reps"] >= 1, f"{path}.reps must be >= 1")
    if has_seconds:
        expect_type(set_obj["seconds"], int, f"{path}.seconds")
        expect(set_obj["seconds"] >= 1, f"{path}.seconds must be >= 1")
    if "targetWeightPounds" in set_obj:
        expect_type(set_obj["targetWeightPounds"], int, f"{path}.targetWeightPounds")
        expect(set_obj["targetWeightPounds"] >= 0, f"{path}.targetWeightPounds must be >= 0")


def validate_exercise(exercise: dict, path: str) -> None:
    expect_type(exercise, dict, path)
    for field in ("movementId", "name", "loadType", "sets"):
        expect(field in exercise, f"{path}.{field} is required")

    expect_type(exercise["movementId"], str, f"{path}.movementId")
    expect(exercise["movementId"].strip() != "", f"{path}.movementId cannot be empty")
    expect_type(exercise["name"], str, f"{path}.name")
    expect(exercise["name"].strip() != "", f"{path}.name cannot be empty")
    expect(
        exercise["loadType"] in {"weighted", "bodyweight", "time"},
        f"{path}.loadType must be weighted/bodyweight/time",
    )
    expect_type(exercise["sets"], list, f"{path}.sets")
    expect(len(exercise["sets"]) > 0, f"{path}.sets must have at least one set")

    if "restSeconds" in exercise:
        expect_type(exercise["restSeconds"], int, f"{path}.restSeconds")
        expect(exercise["restSeconds"] >= 0, f"{path}.restSeconds must be >= 0")
    if "equipment" in exercise:
        expect_type(exercise["equipment"], list, f"{path}.equipment")
    if "cue" in exercise:
        expect_type(exercise["cue"], str, f"{path}.cue")
    if "notes" in exercise:
        expect_type(exercise["notes"], str, f"{path}.notes")

    for idx, set_obj in enumerate(exercise["sets"]):
        validate_set(set_obj, f"{path}.sets[{idx}]")


def validate_day(day: dict, path: str) -> None:
    expect_type(day, dict, path)
    for field in ("dayIndex", "sessionName", "estimatedMinutes", "equipment", "exercises"):
        expect(field in day, f"{path}.{field} is required")

    expect_type(day["dayIndex"], int, f"{path}.dayIndex")
    expect(day["dayIndex"] >= 0, f"{path}.dayIndex must be >= 0")
    expect_type(day["sessionName"], str, f"{path}.sessionName")
    expect(day["sessionName"].strip() != "", f"{path}.sessionName cannot be empty")
    expect_type(day["estimatedMinutes"], int, f"{path}.estimatedMinutes")
    expect(day["estimatedMinutes"] >= 1, f"{path}.estimatedMinutes must be >= 1")
    expect_type(day["equipment"], list, f"{path}.equipment")
    expect_type(day["exercises"], list, f"{path}.exercises")

    for idx, exercise in enumerate(day["exercises"]):
        validate_exercise(exercise, f"{path}.exercises[{idx}]")


def validate_week(week: dict, path: str) -> None:
    expect_type(week, dict, path)
    for field in ("weekNumber", "days"):
        expect(field in week, f"{path}.{field} is required")
    expect_type(week["weekNumber"], int, f"{path}.weekNumber")
    expect(week["weekNumber"] >= 1, f"{path}.weekNumber must be >= 1")
    expect_type(week["days"], list, f"{path}.days")

    seen_day_idx = set()
    for idx, day in enumerate(week["days"]):
        validate_day(day, f"{path}.days[{idx}]")
        day_index = day["dayIndex"]
        expect(day_index not in seen_day_idx, f"{path}.days has duplicate dayIndex {day_index}")
        seen_day_idx.add(day_index)


def validate_program(program: dict, path: str, seen_ids: set[str]) -> None:
    expect_type(program, dict, path)
    for field in ("id", "displayName", "shortDescription", "audience", "status", "weeks"):
        expect(field in program, f"{path}.{field} is required")

    program_id = program["id"]
    expect_type(program_id, str, f"{path}.id")
    expect(PROGRAM_ID_RE.match(program_id) is not None, f"{path}.id has invalid format")
    expect(program_id not in seen_ids, f"Duplicate program id {program_id}")
    seen_ids.add(program_id)

    for text_key in ("displayName", "shortDescription", "audience"):
        expect_type(program[text_key], str, f"{path}.{text_key}")
        expect(program[text_key].strip() != "", f"{path}.{text_key} cannot be empty")

    expect(program["status"] in {"placeholder", "authored"}, f"{path}.status invalid")
    expect_type(program["weeks"], list, f"{path}.weeks")

    seen_week_numbers = set()
    for idx, week in enumerate(program["weeks"]):
        validate_week(week, f"{path}.weeks[{idx}]")
        week_number = week["weekNumber"]
        expect(week_number not in seen_week_numbers, f"{path}.weeks has duplicate weekNumber {week_number}")
        seen_week_numbers.add(week_number)


def main() -> None:
    expect(DATA_PATH.exists(), f"Missing {DATA_PATH}")
    try:
        payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        fail(f"Invalid JSON: {err}")

    expect_type(payload, dict, "root")
    for field in ("schemaVersion", "updatedAt", "programs"):
        expect(field in payload, f"root.{field} is required")

    expect_type(payload["schemaVersion"], str, "root.schemaVersion")
    expect(VERSION_RE.match(payload["schemaVersion"]) is not None, "root.schemaVersion must match X.Y.Z")
    expect_type(payload["updatedAt"], str, "root.updatedAt")
    expect(DATE_RE.match(payload["updatedAt"]) is not None, "root.updatedAt must match YYYY-MM-DD")
    expect_type(payload["programs"], list, "root.programs")

    seen_ids: set[str] = set()
    for idx, program in enumerate(payload["programs"]):
        validate_program(program, f"root.programs[{idx}]", seen_ids)

    print("OK: forge-programs.json is valid")


if __name__ == "__main__":
    main()
