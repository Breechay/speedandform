# FORM · Legacy Program Vocabulary Audit

Brice Ikouebe · November 6, 2026 · Read-only production assessment

## Decision

The term **“rhythm”** and its plural are prohibited in new FORM-authored program language. Prefer precise, contextual terms such as pace, timing, cadence, coordination, continuity, control, or settle. This is a presentation and editorial decision; it does not change workout dose, training intent, or the historical record.

## Observed production scope

Read-only inspection of the latest published planned-session version for each future planned session dated November 6, 2026 or later returned:

| Measure | Count |
| --- | ---: |
| Future published planned sessions with one or more matches | **322** |
| Distinct affected athletes | **28** |
| Session-title matches | **13** |
| Intent matches | **260** |
| Detail matches | **75** |

The field counts overlap and must **not** be summed. This is a dated point-in-time snapshot, not a claim about all historical records or all possible copy surfaces. The query looked for the literal substring case-insensitively, which is suitable for a conservative triage list but should be refined for editorial decisions.

## Required migration, not yet performed

1. Confirm the source-of-truth version for each affected planned session and whether a later coach-authored version has superseded it.
2. Generate a human-readable proposed editorial diff for title, intent, and execution details only. Review context rather than using a mechanical single-word substitution. Some titles need renaming, while other passages mean pacing, timing, mechanics, or continuity.
3. Preserve interval structure, work and recovery doses, duration, distance, calendar placement, pace, evidence, filings and prior version history exactly.
4. Route each edit through the legitimate coach publishing/versioning workflow. Do not mass-update published records in place or create duplicate athlete-visible sessions.
5. Verify persisted session title, full details, Week card, and any affected projections. Check notification and duplication behavior before any large batch.
6. Run the same audit again and report remaining active-copy matches separately from immutable historic wording.

## New-authorship defense

The session editorial utility in `private/session-editorial-standard.mjs` now flags the disallowed term in changed title, intent and details; its Week-preview check also flags title and preview, while its numeric presentation check flags title. Targeted regression tests cover the restriction and legacy unchanged-copy behavior. This does not assert that all live authoring entry points or all historical data are already clean. Full workflow integration and production readback remain acceptance gates.

**Status:** restriction and tests proposed in PR #520; existing published copies **not migrated**. No live athlete prescription was changed as part of this audit.
