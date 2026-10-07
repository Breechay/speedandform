# Adrian — Canonical Index

**Athlete:** Adrian Gandara  
**Study:** FORM Human Performance Study 001 / FRM-001 — The Developed Runner  
**Canonical control repo:** `Breechay/speedandform`  
**Standalone Forge code repo:** `Breechay/FORM-iOS`  
**Standalone Forge scheme:** `Forge`  
**Standalone Forge bundle:** `com.speedandform.forge`

This file is the control index for Adrian. It exists to stop plan, study, app, backend, and coach-console work from drifting apart.

## Source-of-truth order

1. **FORM Athlete System / Supabase** — live authored prescription and immutable session versions.
2. **This repo's canonical program projection** — `plans/adrian-developed-runner-2026/program.json`.
3. **Public study** — `labs/adrian-runner-mass/index.html` and evidence records in `docs/studies/`.
4. **Standalone Forge app projection** — lives in `Breechay/FORM-iOS`; it must mirror the authored prescription, not invent it.
5. **Coach Console** — reads athlete-system data and strength receipts; it is an observation/authoring surface, not a second prescription source.

If two surfaces disagree, fix the lower item to match the higher item. Never rewrite completed evidence to make surfaces agree.

## Current objective

Build a visibly stronger, more substantial runner while preserving the qualities required for high-level marathon development.

Current aesthetic hierarchy, Oct 5, 2026:

1. Lat width / lower-lat sweep
2. Lateral delts
3. Rear delts / posterior shoulder cap
4. Upper chest
5. Arms
6. Modest upper traps to frame Adrian's long neck
7. Medial thigh / hamstring / quad girth
8. Glute maintenance
9. Calf maintenance

Performance constraint: Adrian has expressed a long-term interest in approximately **2:40 marathon performance (~6:06/mi)**. This is a horizon, not his current prescribed marathon target.

## Current body evidence

Latest repeat tape checkpoint, Oct 5, 2026:

- Waist: 31 in
- Chest: 36 in
- Relaxed arm: 11.5 in
- Relaxed thighs: 20 / 19.75 in
- Calf: 15.5 in

The waist is nominally unchanged from Sep 24; chest and relaxed arm are nominally higher. Side/landmark pairing is incomplete for thigh/calf, so those are not treated as tissue-change claims yet.

Current body-mass evidence includes large short-term scale variance. Do not convert one reading into a tissue-gain claim.

## Recovery ruling

Adrian recently accumulated significant calf irritation while:
- running a 12 × 400 m workout materially faster than prescribed,
- neglecting mobility/self-massage,
- adding roughly one-hour walks to try to loosen the calves.

Current ruling:
- one-hour walks are not the default recovery strategy,
- use lower-load yin yoga / gentle mobility,
- resume consistent self-care,
- direct calf hypertrophy is maintenance only,
- skip direct calf work while tenderness remains,
- running quality governs lower-body progression.

## Nutrition ruling

Working base target remains approximately **3,400 kcal/day**.

Adrian reports that full meals make the target easy to reach. Before this phase he often relied on snacks rather than consistent full meals.

When workload rises, a few hundred extra calories may be added around harder sessions. This is a workload-matched adjustment, not a permanently higher daily target.

## Canonical files

### Program
- `plans/adrian-developed-runner-2026/program.json` — canonical repo projection of the 16-week Developed Runner block.
- `plans/adrian-developed-runner-2026/week.html` — human-readable plan surface.
- `plans/adrian-runner-mass-phase-01/FORGE_HANDOFF.md` — older Forge handoff context; use this index if there is a conflict.

### Study
- `labs/adrian-runner-mass/index.html` — public study.
- `docs/audits/ADRIAN-DEVELOPED-RUNNER-2026.md` — audit history.

### Evidence
- `docs/studies/ADRIAN-MEASUREMENTS-20260924.json`
- `docs/studies/ADRIAN-INTAKE-UPDATE-20260925.json`
- `docs/studies/ADRIAN-WEIGHT-UPDATE-20261001.json`
- `docs/studies/ADRIAN-STUDY-UPDATE-20261005.json`
- `docs/studies/ADRIAN-MEASUREMENTS-20261005.json`

## Live backend state

FORM Athlete System / Supabase project: `pbgsjjegycacodiltbhn`.

Adrian exists as athlete slug `adrian`.

The Oct 5 frame audit has already been projected into new immutable planned-session versions for Weeks 4–16. Week 4 is the active/current week.

Do not edit old versions in place. New coaching changes become new versions.

Strength receipts are stored in `forge_strength_receipts` through the athlete-scoped native receipt path. A real receipt is evidence of performed work; do not fabricate one to test a UI.

## Standalone Forge

Standalone Forge is the athlete-facing strength app.

Repository: `Breechay/FORM-iOS`  
Shared implementation: `FORM/Forge/`  
Standalone host: `Forge/`  
Scheme: `Forge`  
Bundle: `com.speedandform.forge`

Do not build the `FORM` scheme when reviewing Adrian's Forge experience.

Current Forge integration work is tracked in FORM-iOS PR **#44** on branch:
`work/adrian-frame-forge-20261005`

The app projection should preserve stable program id:
`adrian_runner_mass_phase1_v1`

## Coach visibility

The intended loop is:

**Coach authors → Adrian sees → Adrian performs → Forge records → FORM receives → Coach reads what actually happened**

A completed native Forge session should preserve:
- athlete identity,
- program id,
- week/day coordinates,
- session name,
- performed sets,
- load / reps / seconds,
- timestamps,
- optional feedback where supported.

Coach Console should read Forge receipts as strength evidence. Do not mix Forge strength receipts into running `session_completions` as if they were runs.

## Current open work

1. Finish and validate standalone Forge PR #44.
2. Build the **Forge** scheme cleanly.
3. Install on a physical iPhone.
4. Verify Adrian sees Week 4 and the revised frame-first prescription.
5. Verify rear delts, lats, lateral delts, traps, and thigh work render correctly.
6. Verify no direct Week 4 calf hypertrophy work.
7. Verify legitimate completed work can sync through the athlete-scoped receipt path.
8. Verify Coach Console can read the resulting Forge receipt in a useful way.
9. Resolve and merge speedandform PR #219 after its broader release check is understood and green.

## Structured strength (server-side prescription)

Adrian's strength sessions used to exist on the server only as prose (`planned_session_versions.details`). `planned_session_exercises` (held migration `supabase/held/20261006190000_structured_strength_exercises.sql`) gives each immutable session **version** an ordered list of typed exercises, delivered through the same `athlete_plan_feed` as running components.

- Prescription and progress stay separate: nothing here records where Adrian is. Current week/session comes from assignment dates plus real app state and evidence.
- Exercise rows are append-only. A revision writes a new version with its own exercises; a completed workout can always point at the version it was performed against.
- The feed change is additive: a session gains `exercises` only when its current version has structured rows.
- `rest_seconds`, `cue`, `substitutions` stay null unless authored; the server never invents them.
- The migration's Adrian block is generated from `program.json` (`node scripts/generate-structured-strength-migration.mjs`, `--check` to verify before applying). After it is applied, never regenerate it: later revisions are new versions, not a rewritten migration.
- The test proves the 388 server exercises match the Forge app's bundled reference (`tests/fixtures/forge-adrian-reference.json`, extracted from FORM-iOS `a8a68b1c` by `scripts/extract-forge-adrian-reference.mjs`).
- Status: authored and tested in the repo. **Not applied to any hosted database.** Before applying, diff the live `athlete_plan_feed` / `athlete_plan_feed_impl` definitions against the repository chain (the production ledger has migrations that are in no git branch).

## Rules for future agents

Before changing anything, answer:

1. Is this prescription, evidence, delivery, or interpretation?
2. Which source of truth owns it?
3. Am I creating a new version or accidentally rewriting history?
4. Does this preserve Adrian's marathon-development constraint?
5. Does the change help answer what Adrian actually did?

Do not:
- invent completed work,
- infer muscle gain from one scale/tape reading,
- let Forge become a second prescription authority,
- grow calves just because calf work existed in an older plan,
- remove useful leg development merely because Adrian is a runner,
- broaden the app before the Adrian pilot requires it,
- start Forge work from whichever FORM-iOS branch is newest.

## Forge baseline

Forge baseline = the exact deployed Breechay build SHA, not whichever FORM-iOS branch happens to be newest.

- Installed on Brice's phone (read 2026-10-06 via devicectl): **Breechay 3.4 (4)**, `com.speedandform.forge`, developer-signed.
- Matching source: `37f5659b` (`work/forge-adrian-week-context-20260921`), protected at `snapshot/deployed-breechay-3.4-4-37f5659b` in `Breechay/FORM-iOS`. The SHA is inferred from the build fingerprint stamped on the build Mac, not read from the phone.
- App Store Connect lists 3.5 (4) as Ready for Distribution; no branch at 3.5 was found.
- FORM-iOS PR #44 (`fix/hill-week-render-20261005` lineage, version 0.1 (1)) is the wrong baseline and must not be merged.
- Adrian's strength program is regenerated into Forge with `scripts/generate-adrian-program.py <program.json> FORM/Forge/ForgeProgramLibrary.swift`; never hand-edit the generated block.

## Fast handoff

If a new coding session starts with no context, give the agent this file first.

Then point it to:
- `plans/adrian-developed-runner-2026/program.json`
- FORM-iOS PR #44
- speedandform PR #219
- the latest `docs/studies/ADRIAN-*.json` evidence files

The next question should always be: **What changed in Adrian's real execution or evidence since the last checkpoint?**
