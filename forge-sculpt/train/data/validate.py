#!/usr/bin/env python3
"""Fail-closed checks for the temporary FORGE athlete portal export."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "forge-portal-programs.json"
PORTAL_PATH = ROOT.parent / "index.html"
CONTINUITY_PATH = ROOT.parent / "continuity-store.js"
SESSION_MODEL_PATH = ROOT.parent / "session-model.js"
REPOSITORY_ROOT = ROOT.parents[2]

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

    session_ids: list[str] = []
    training_sessions = 0
    exercise_occurrences = 0
    prescribed_sets = 0
    for week in weeks:
        days = week["days"]
        day_indices = [day["dayIndex"] for day in days]
        require(len(day_indices) == len(set(day_indices)), f"{path}/week-{week['weekNumber']}: duplicate day")
        for day in days:
            session_ids.append(day["id"])
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

    require(len(session_ids) == len(set(session_ids)), f"{path}: duplicate stable session id")
    return len(weeks), training_sessions, exercise_occurrences, prescribed_sets


def validate_portal_contract() -> None:
    portal = PORTAL_PATH.read_text()
    require("const ACCESS_MODE='open-preview'" in portal, "portal is not in open-preview mode")
    require("phaseLocked=n=>ACCESS_MODE!=='open-preview'&&n===4" in portal, "Phase IV access contract changed")
    require("validatePortalData(raw)" in portal, "browser runtime validation missing")
    require('name="forge-launch"' in portal and 'data-netlify="true"' in portal, "Netlify form declaration missing")
    require("if(!r.ok)throw new Error" in portal, "signup must fail closed")
    require("navigator.share" in portal and "location.href" in portal, "exact session sharing missing")
    require('<script src="./continuity-store.js"></script>' in portal, "durable continuity store is not loaded")
    require(CONTINUITY_PATH.is_file(), "durable continuity store missing")
    continuity = CONTINUITY_PATH.read_text()
    require("indexedDB.open(DB_NAME,DB_VERSION)" in continuity, "IndexedDB boundary missing")
    require("anonymousNamespace()" in continuity and "userNamespace(userId)" in continuity, "account namespaces missing")
    require("claimAnonymousLocally" in continuity, "explicit anonymous claim path missing")
    require("namespace_status" in continuity and "status:'localOnly'" in continuity, "local queue contract drifted")
    require("completion_key" in continuity and "{unique:true}" in continuity, "cross-tab completion uniqueness missing")
    require("stale_snapshot_revision" in continuity and "storageRevision" in portal, "cross-tab snapshot CAS missing")
    require("anonymousReceipts.forEach" in continuity and "anonymousMutations.forEach" in continuity, "claim must carry receipts and mutations")
    require("type:'local_state_claimed'" in continuity, "claim receipt missing")
    require("STATE.mode=b.dataset.m;await save()" in portal, "Session/Focus preference persistence missing")
    require("Finish session" in portal, "Focus completion must remain explicit")
    require("setInterval(" not in portal and "RestTimer" not in portal, "Focus must not contain a rest timer")
    require("const APPLE_CLIENT_ID='com.speedandform.account.web'" in portal, "Apple web Services ID mismatch")
    require(
        "const APPLE_REDIRECT_URI='https://speedandform.com/auth/apple/callback'" in portal,
        "Apple return URL mismatch",
    )
    require("signInWithIdToken({provider:'apple'" in portal, "Supabase Apple ID-token exchange missing")
    require("scope:'name email'" in portal and "nonce,usePopup:true" in portal, "Apple first-login identity contract missing")
    require('id="appleid-signin"' in portal and 'data-type="continue"' in portal, "official Apple JS control missing")
    require("AppleIDSignInOnSuccess" in portal and "AppleIDSignInOnFailure" in portal, "Apple event handling missing")
    require("authorization.state!==APPLE_TRANSACTION.state" in portal, "Apple state verification missing")
    require("apple-btn" not in portal and "apple-mark" not in portal, "custom Apple control is prohibited")
    require("Saved on this device." in portal and "Saving on this device is not confirmed." in portal, "local persistence evidence states missing")
    require("min-height:64px" in portal, "Focus set action must remain 64px")
    require(".execution .fadein{animation-duration:.2s}" in portal, "execution motion must remain within 220ms")
    require("installExerciseNavigator(barrow)" in portal and "scrollIntoView" in portal, "exercise navigation missing")
    require("No spam. Just the link." not in portal, "removed launch filler returned")
    require("Training progress still saves to this browser during the preview." not in portal, "removed account filler returned")
    require("async function contentHash" in portal and "crypto.subtle.digest('SHA-256'" in portal, "prescription fingerprint missing")
    require("function adaptSet(item,exerciseId,index)" in portal, "stable authored-set adapter missing")
    require("sets=(e.sets||[]).map" in portal and "e.sets[k-1]" in portal, "portal must preserve each authored set")
    require(SESSION_MODEL_PATH.is_file(), "shared session/receipt model missing")
    session_model = SESSION_MODEL_PATH.read_text()
    require("truth:'confirmedAsDisplayed'" in session_model, "Focus confirmation provenance missing")
    require("confirmedPrescription" in session_model and "performedSets" not in session_model, "Focus confirmation must not populate actual-performance fields")
    require("activeDurationSeconds:null" in session_model, "Focus must not invent active duration")
    require("unconfirmed_authored_sets" in session_model, "partial Focus completion guard missing")
    require("amendsReceiptId" in session_model and "reopensReceiptId" in session_model, "receipt amendment lineage missing")
    require("receipts.add(this.receiptRow" in continuity, "immutable receipt insert missing")
    require("commitCompletion(namespace,state,receipt,event)" in continuity, "atomic completion boundary missing")
    require("client_event_id_conflict" in continuity and "mutationMatches" in continuity, "idempotent retry guard missing")
    require("focus.set." not in portal and "session.completed" not in portal, "local event names must match server whitelist")
    require((REPOSITORY_ROOT / "auth/apple/callback.html").is_file(), "Apple callback document missing")

    for invented in ("Build the Frame", "Glute Build", "Specialize", "6:15 AM"):
        require(invented not in portal, f"portal contains invented copy: {invented}")

    assets = (
        "assets/forge/anatomy-reveal.webp",
        "assets/forge/hero-light.webp",
        "assets/forge/anatomy-shoulders.webp",
        "assets/forge/anatomy-glute.webp",
        "assets/home/forge/anatomy-core.webp",
        "assets/home/forge/anatomy-full.webp",
        "assets/home/forge/anatomy-pull.webp",
        "assets/forge/og-forge-portal-v2.jpg",
    )
    for asset in assets:
        require((REPOSITORY_ROOT / asset).is_file(), f"missing portal asset: {asset}")


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

    validate_portal_contract()
    print("FORGE portal data valid")
    print(f"Forge Sculpt: {tuple(sculpt_counts)}")
    print(f"Rod: {rod_counts}")
    print("Portal contract: open preview, sharing, persistence, signup and assets valid")


if __name__ == "__main__":
    main()
