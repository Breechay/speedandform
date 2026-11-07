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

## November 6 continuation · cleanup authorization and protected workflow discovery

Brice explicitly requested the existing copy cleanup. A second read-only production count still finds **322 future published planned sessions across 28 athletes** (13 titles, 260 intents, 75 details; overlapping fields). Repeated phrasing spans easy-running, threshold, faster-running, swimming and weekly scheduling copy. Replacements must be contextual—*pace*, *timing*, *continuity*, *coordination*, *cadence*, and *consistent practice* are not interchangeable in all those contexts.

**Important existing function limitation:** The production `coach_publish_editorial_copy` routine is a tightly bounded authenticated editorial tool. Its running branch preserves the existing title, permits only previously blank intentions to gain editorial text, and refuses changes to authored intentions; it does not publish edited execution details. Therefore **it is not an authorized route for this 322-session cleanup**. The normal `revise_session`/`write_session_version` path can version full session copy but is coach-authenticated, requires full existing typed dose to be preserved and has additional linked exercise-anatomy considerations. A direct privileged SQL replacement would bypass authoring controls and is not an acceptable substitute.

### Required next implementation

1. Build a **purpose-specific coach-authenticated versioned editorial cleanup publisher** or verified coach-session revision workflow. It must accept the exact expected current version/session id and the three proposed text changes, re-read current authority under lock, and reject stale, filed, withdrawn or otherwise protected occurrences.
2. Construct **contextual human-readable proposed diffs** by title/intent/details. Include per-field replacement, retained rationale and an explicit no-dose-change check. Do not use one global string substitution for exercise and pace language.
3. On approval, create a new version while cloning **all** structured run components **and linked exercise anatomy**, numeric dose, prescribed pace, coach notes, distance and history. Record an editorial-only change reason and reversible prior-version reference. Audit notification effects before batching.
4. Publish in small bounded, monitored batches; read back the current Week and full-session projections after each. Stop on mismatch, material athlete feedback, revision conflict, or unexpected announcement behavior. Do not silently rewrite immutable completed filings or the frozen September study text.
5. Repeat exact future-active audit. Report separate counts for new sessions, active legacy session text, and intentionally preserved historical quotes.

**Outcome of this review:** current method documents are cleaned except explicit administrative rule wording, and new-copy checks are in the PR; the **live 322 cleanup remains blocked by the existing protected versioned publication workflow**. No bulk update has been run. This is an explicit open implementation item, not a claim of completed sanitation.


## November 7 incident and append-only corrective path

The previously reported “not migrated” status describes the **November 6** read-only audit, not the current production state. On November 7, **322** mechanically edited, editorial-only new session versions were inserted through an administrative database SQL connection, along with **607 cloned structured components**. The prior history was retained; however, this was **not the required coach-authenticated publication** and the substitutions need contextual editorial review.

A scoped rollback of exactly those 322 versions failed atomically: `planned_session_versions_immutable` invoked `forge_private.guard_immutable_history()` and refused deletion. The correct response is **not to disable append-only protection**. The new compensating-version path must append coach-attributed versions to supersede the mechanically edited versions and preserve every older version.

Readback at the time of the failed rollback showed zero downstream references to the 322 latest versions from completions, placements, Forge events, Miami receipts or Speed vault links, with the original 322 predecessor versions intact. José's and Hope's Orlando blocks remained active and their Donna blocks remained scheduled with **45** and **44** published dated sessions respectively.

The candidate solution on `fix/coach-auth-editorial-compensation-20261107` includes an authenticated, stale-version checked, bounded correction RPC, a coach review surface, and regression coverage. The database logic compiled and denied both unauthenticated test calls inside an automatically rolled-back production transaction. **No authenticated positive publication test and no athlete-device acceptance has occurred.** The new correction function has not been released to production from this branch.

For acceptance and incident recording, see `docs/coaching/FORM_EDITORIAL_COMPENSATION_20261107.md` and [#521](https://github.com/Breechay/speedandform/issues/521). Do not close cleanup based on a zero substring count alone.
