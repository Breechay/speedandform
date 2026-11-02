# FORM · athlete-visible description publication

## Why

The roster audit on November 2 found 236 future native-strength days in 19
athlete feeds, across 14 distinct titles, and 67 published running sessions
without authored intent across Anthony, Natalie, Valerie and Patrick. Eight
additional fixture records were not eligible for publication.

The old Coach Console could show a workout while its athlete-visible emphasis
was blank. A missing description must now be a detectable publication item,
not a silent success.

## The contract

- planned_session_versions.intent: concise running text the athlete sees.
- planned_session_versions.coach_note: coach-only, never in a feed or preview.
- form_training_strength_days.emphasis: new, dedicated athlete-visible
  strength description. The coach preview and athlete strength feed return
  emphasis alongside the exact title and unchanged exercise JSON.
- A known strength title may receive its reviewed default emphasis when
  an older seven-argument strength publisher writes a new day. Unknown titles
  must supply approved copy, or publication fails.
- The current future rows are not rewritten by schema migration. The Coach
  Console previews all proposed copy and publishes through the authenticated
  coach_publish_editorial_copy RPC.
- The RPC verifies active administrator and coach membership, exact program
  and digest for strength, expected current version for running, future
  published status, copy quality, and non-duplicate IDs. All edits are atomic.
- Strength editorial changes receive a private audit entry. Running changes
  append a new version with every dose, pace, exercise component and private
  note copied exactly. No old versions are modified.
- A retry with identical copy is a no-op. A conflicting existing running
  intent requires an individual version revision.

## The screen

The Publish queue is always visible in the top bar. Missing strength emphasis
and running intent add a per-athlete item. It displays a visible warning if
the copy audit is unavailable; the whole roster cannot fail silently.

The Review athlete-visible descriptions dialog displays:

1. Counts and actual-date Week previews.
2. All 14 strength title suggestions with example prescribed exercise names.
3. Running suggestions grouped by athlete and exact session title.
4. An explicit ATHLETE VISIBLE label and separate INTERNAL ONLY notice.
5. Validation, publication, server readback, and a statement that physical
   native-device receipt is still pending.

## Checks before production

- Run the coach-editorial-copy.test.mjs contract and mapping tests.
- Run coach-editorial-authenticated-db.mjs against an isolated PGlite database
  with an authenticated coach role. This reproduces the table-permission
  regression and proves the private drafts table stays inaccessible.
- Confirm original running prescription fields and components are byte-for-byte
  equal after an editorial-only version append; completed work is unchanged.
- Verify production SQL migration grants only the two new authenticated RPCs,
  not any private table or strength-day direct write permission.
- Review all 14 title-to-emphasis mappings against actual live exercises.
- Preview exactly the eligible 236 strength and 67 running rows, excluding
  test fixtures, before selecting Publish.
- Read back the live strength feed with emphasis and each running latest
  intent. Confirm group publication separately from description publication.
- Verify the FORM native Week and Filing presentation on a physical 44.5
  build. An updated server feed is not a native device receipt.

## Remaining release boundary

The FORM 44.5 iOS catalog is not currently proven to consume the new
strength-day feed. Adding emphasis to the API is backward-compatible, but
native display depends on a separately built, tested, and distributed iOS
reader. Do not mark physical-device verification complete from SQL or web.

The intentional Glute Priority v1 cohort (Braelinn, Hope, Lisa, Megan Bolan,
Patrick Stowe) is separate from legacy Glute Build 02 and from the unverified
Full Split v2 cohort. Activation must still pass its per-athlete six-day
source/digest check.
