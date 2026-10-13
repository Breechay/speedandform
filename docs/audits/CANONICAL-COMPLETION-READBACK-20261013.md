# Canonical completion read-back and Speed That Endures backfill

**Date:** October 13, 2026  
**Owner:** Brice / Speed & Form  
**Status:** backend live; native read-back source in the Release 43 integration stream; athlete-device acceptance remains separate.

## Why this exists

FORM already accepted native athlete filings into the canonical `session_completions` ledger. The athlete plan feed did not return those canonical completions to the athlete app.

That asymmetry mattered during the current refinement period:

- plans and refresh behavior changed across several builds;
- Hope and José often reported completed work to Brice by text;
- Brice could preserve those results in the study or coach-side system;
- an athlete phone that did not hold the original local receipt could still treat the same planned session as unfiled.

The correction is not to fabricate a local receipt. A local `FORMSessionReceipt` is evidence created by that installation and carries its own immutable edit/audit history. A coach-imported server completion is canonical evidence with different provenance.

The product rule is now:

**server completion = already filed; local receipt = already filed + editable on this installation.**

## Backend read-back

Applied live migration:

`supabase/migrations/20261013143000_athlete_plan_feed_completion_readback.sql`

The existing authorized `athlete_plan_feed` still owns identity, plan authority, the active block and sessions. The wrapper now adds a read-only `completions` array for the same authorized athlete.

Each completion can carry:

- canonical completion id;
- planned session id;
- exact planned session version id when recorded;
- status;
- actual distance and duration;
- RPE;
- athlete note and symptoms;
- source and evidence id;
- filed / updated timestamps;
- scheduled date, day and historical session title;
- ordered warm-up / rep / float / cooldown pieces.

The projection is historical across blocks and bounded to the latest 250 rows for transport. Postgres remains the durable record. No other athlete id is accepted from the client after the feed authorization has resolved the athlete.

## Speed That Endures backfill

Applied live migration:

`supabase/migrations/20261013143100_speed_that_endures_completion_backfill.sql`

Only sessions already documented with enough athlete-specific execution evidence were imported. All imported rows use `source='coach_import'`, a stable `study-ste-...` evidence id and the exact published planned-session version resolved at migration time.

### Hope

- September 8: 4 × 2 mi at race pace, four recorded work paces.
- September 15: 5 mi continuous at race pace, recorded work time and pace.
- September 22: 5 × 1 mi at race pace, warm-up, five exact reps and four recorded floats.
- September 29: 6 mi continuous at race pace, recorded warm-up, work and cooldown.

### José

- September 8: 4 × 2 mi at race pace, four recorded work paces.
- September 15: 5 mi continuous at race pace, recorded work time and pace.
- September 22: 5 × 1 mi at race pace, warm-up, five exact reps, four floats, cooldown and RPE 8.
- September 29: 6 mi continuous at race pace, recorded warm-up, work and cooldown.
- October 6: 4 × 2 mi at race pace, warm-up, four exact two-mile reps, three floats, cooldown and RPE 10.

Hope's October 6 result is intentionally absent because her coaching state was a recovery hold and no completed result was supplied.

The paired September 10 / 11 threshold observation is intentionally absent from the completion backfill. The existing study establishes the two athlete results but does not resolve which athlete performed on which calendar date. A canonical history should under-claim instead of inventing a date.

## Read-back acceptance

Authenticated own-athlete calls were made against the live project after migration.

- Hope's own feed returned **10 canonical completions**, including all four new `study-ste` rows and their ordered pieces.
- José's own feed returned **18 canonical completions**, including all five new `study-ste` rows and their ordered pieces.
- The returned source remains `coach_import`; the feed does not rewrite these as native athlete filings.

## Native contract

Native source belongs on the current Release 43 integration line.

The intended client behavior is additive:

1. decode the optional canonical `completions` field;
2. keep local `FORMReceiptStore` intact as the installation's own receipt/audit store;
3. regard either a local receipt or a matching canonical completion as already filed;
4. keep Exact Edit available only when the local receipt exists;
5. do not offer a second filing when only the server completion exists;
6. retain canonical completion data in the cached plan payload so later Progress / Memory design can use it without another data migration.

No progress visualization is selected by this pass. It closes the evidence loop first.

## Current operating flow

For the current athlete cohort it is valid for an athlete to text Brice a result while native delivery is still settling.

When the source is sufficiently specific:

**athlete report / Garmin evidence → coach import into the canonical planned session + exact version → athlete app refresh → canonical completion read-back**

Future sessions filed normally in FORM continue through `record_session_from_form` and carry native `source='form'` provenance. The two routes meet in the same canonical completion ledger without pretending they originated the same way.

## Boundaries

- Historical source facts are not upgraded into measurements the study never supplied.
- No missing rep, float, warm-up, cooldown, RPE or date is invented.
- No public progress claim is created by inserting canonical evidence.
- A backend migration does not prove an already-installed iPhone build has decoded or rendered the new field.
- App Store / TestFlight distribution and physical-device acceptance remain release steps.
