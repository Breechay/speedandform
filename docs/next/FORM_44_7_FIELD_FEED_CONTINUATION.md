# FORM 44.7 Field feed continuation

Status: bounded assessment complete; do not deploy from this document. The full projection repair is deliberately not mixed into PR #461 until its branch is reconciled with the newer Collective publication migrations on `main`.

## Demonstrated path and causes

The mounted athlete path is `FORMAthleteGroupRunsTab` → `FORMHomeRunsModel.BoardClient.sharedWork` → `collective_work_feed` → `FORMHomeRunsSurface` → `FORMHomeFieldEntry`. `groupRunsReplacesFeed` retires the older FORM tab; it does not suppress this mounted Field feed.

Coach and athlete filing both terminate in `session_completions` plus ordered `session_pieces`. Publication is then copied into `collective_work_posts` by `collective_work_internal.publish_completion`. The current implementation on `main` copies distance and duration but never projects `session_pieces` or `rep_paces` into `movement_summary`. `collective_work_feed` returns only the already-copied post columns, so iOS cannot recover canonical repetitions later.

- Sam: four ordered mile repetitions exist in `session_pieces` (6:04.1, 6:00.0, 5:44.3, 5:40.9), but the work post has no structured result payload.
- Hope: the completion has a truthful aggregate 800 m result in `rep_paces`, but no ordered individual rep rows. It must render only an aggregate, never reconstructed splits.
- Elijah: the visible values were published as activity-note mile splits. They are whole-activity splits, not prescribed work repetitions.

The different cards therefore come from different publication payloads, not from the iOS route choosing different athletes.

## Safe implementation sequence

1. Rebase or merge PR #461 onto the reviewed `main` state containing:
   - `20261104171818_collective_work_default_on_opt_out_20261104.sql`
   - `20261104173603_collective_work_feed_avatars_safe_fallback_20261104.sql`
2. Add a new migration after those files. Do not edit an applied migration.
3. In `collective_work_internal.publish_completion`, build an internal typed result from canonical evidence:
   - ordered `session_pieces(kind='rep')` → exact ordered rep tokens;
   - aggregate-only `rep_paces` → a bounded aggregate token;
   - activity-note splits remain explicitly `mile`, never `rep`;
   - absent or malformed evidence → no result, never prescribed values.
4. Store that typed projection on `collective_work_posts` and return it from `collective_work_feed`. Keep `publication_allowed`, `revoked_at`, roster checks, safe portraits, pagination, and deduplication unchanged.
5. Backfill only from canonical completion evidence and only for posts still eligible under current consent. Do not parse prescriptions or fabricate individual rows from Hope's aggregate.
6. Keep the athlete schema minimal. Evidence source and confidence stay internal; the wire needs stable identity, result family, ordered values when present, and a truthful aggregate fallback.

## Native continuation points

- Decode and validation: `FORM/Collective/FORMHomeRunsSurface.swift`, `FORMHomeWorkSplitSummary` and `FORMHomeWorkHighlight`.
- Mounted feed request: `FORM/Collective/FORMHomeRunsAdapter.swift`, `BoardClient.sharedWork`.
- Athlete-shell request: `FORM/Collective/FORMAthleteTabShell.swift`, `loadWork` and `FORMAthleteSharedWork`.
- Field card: `FORM/Collective/FORMHomeRunsSurface.swift`, `FORMHomeFieldEntry`.

The current native code already refuses malformed tokens and distinguishes `split:v1:mile` from `split:v1:rep`; it also supports truthful continuous and aggregate-repetition highlights. The next schema should extend this typed decoder rather than add athlete-specific display logic.

## Required regression matrix

- Athlete filing and coach filing of the same ordered workout produce identical public result shapes.
- Sam renders four ordered work reps in filed order and retains tenths internally; display rounding is explicit and tested.
- Hope renders only the documented aggregate; no individual split is invented.
- Elijah remains labeled as mile splits and is never relabeled as prescribed reps.
- Missing, malformed, partial, slow, or revoked evidence leaves a usable minimal card.
- Explicit sharing OFF revokes/hides existing posts and prevents future publication.
- Unrelated and anonymous users cannot read posts; roster members see only the existing public fields.
- Pagination/deduplication cannot hide a newer canonical result behind an older note-only duplicate.
- iOS decoding and both Field surfaces render the same payload; Dynamic Type and VoiceOver remain usable.

Run the migration/RLS tests on an isolated database, the native `FORMHomeRunsAdapterTests`, a Release build, and signed-in device readback for Sam, Hope, and Elijah before considering inclusion. No production migration is authorized.
