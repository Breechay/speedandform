# Forge Program Data Contract

Purpose: one canonical data contract for Forge program content shared across website and iOS.

This is source-of-truth prep only.

- No website wiring yet
- No iOS runtime parser yet
- No behavior changes

## Files

- `data/forge-programs.json` — canonical program content payload
- `data/forge-programs.schema.json` — JSON Schema for validation

## Why this exists

The same program data should drive:

- iOS program definitions
- website program content
- coach/admin program review
- future import/export and tooling

## Data model (plain language)

Each program includes:

- `id` — stable machine key
- `displayName` — human label
- `shortDescription` — one-line explanation
- `audience` — who this program is for
- `status` — `placeholder` or `authored`
- `weeks` — ordered training weeks

Each week includes:

- `weekNumber`
- `days`

Each day includes:

- `dayIndex` (0-based order within week)
- `sessionName`
- `estimatedMinutes`
- `equipment`
- `exercises`

Each exercise includes:

- `movementId`
- `name`
- `loadType` (`weighted`, `bodyweight`, or `time`)
- `restSeconds` (optional)
- `equipment` (optional)
- `cue` (optional, keep plain and short)
- `notes` (optional, keep plain and short)
- `sets`

Each set includes:

- `reps` or `seconds` (exactly one required)
- optional `targetWeightPounds`

## Current state

The initial payload includes placeholder structures for:

- `speed_form_strength_v1` (FORM Strength)
- `mason_hypertrophy_v1`
- `jose_apartment_v1`
- `jose_full_gym_v1`

These are intentionally shell-level and ready to be filled with full exercise prescriptions.

## Authoring rules

- Use plain product language.
- Avoid abstract/internal jargon in athlete-facing fields.
- Keep cues short, physical, and actionable.
- Keep IDs stable once published.
- Prefer adding data over renaming IDs.

## Validation

Recommended validation flow:

1. Update `data/forge-programs.json`
2. Run:

```bash
python3 scripts/validate_forge_program_data.py
```

Or use:

```bash
make validate-forge-data
```

For a future-proof umbrella target:

```bash
make validate-all-data
```

3. Validate against `data/forge-programs.schema.json` (if using a JSON Schema validator in CI/tooling)
4. Check for stable IDs and complete week/day coverage

## Migration note

Later, iOS can:

- import/copy this JSON directly, or
- generate Swift program definitions from JSON, or
- sync from backend once a program service exists.
