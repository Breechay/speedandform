# FORM · Published athlete-copy audit · October 25, 2026

**Status:** Read-only production audit, plus a stricter future-authoring check in this branch. No planned session was changed by this file. All canonical corrections require the signed-in coach's versioned authoring path and read-back of the published athlete feed.

## Findings from latest published future versions (October 25 onward)

| Pattern | Examples and scale | Action |
|---|---|---|
| Redundant sprint disclaimer | 46 sessions across the cohort and smaller supporting plans; 13 Marcus, 11 José, 11 Hope | Remove the sentence, retain stride count/duration/recovery in structured components. |
| Reporting instead of executing | Two future occurrences each in José, Hope, Marcus; Simon's 5K test separately lists extensive logging | Remove athlete-facing mid-run/after-run reporting. Keep real measurements in coach review workflows. |
| No catch-up surges | Seven Elijah sessions | Eliminate boilerplate after confirming targets and ordered recoveries stay in the session anatomy. |
| Long em dashes | Tinius 63 future sessions including titles, intents and details; Adrian 35 strength entries; smaller amounts elsewhere | Edit in context. Never bulk-strip meaning from strength instructions or numeric ranges. |
| Administrative / measurement commentary | Tinius HR context paragraphs, several repeated legacy easy-day intents | Move measurement policy to private coaching guidance or omit; preserve actual limits and prescribed targets. |

This is an editorial inventory, not a claim about the number of distinct workouts on an athlete's visible Week page. The Coach Console lists more than one planned session on some dates. Before withdrawing or reassigning any, verify the **assigned plan/feed** and purpose. Multiple plans must not be treated as duplicates solely because they share a date.

## Coach-approved priority replacements to publish by revision

- **José, Hope, Marcus · Oct 26 and future Easy + Strides instances:** Keep the authored mileage, easy pace, stride reps and recovery. The reader needs a complete title such as `6 mi easy + 6 × 20 sec strides`, then `8:00/mi or slower · 2 min walk/jog between strides`. Remove the sprint disclaimer and repeated full prose explanation.
- **José, Hope, Marcus · Oct 27:** Keep each athlete's own pace band, twenty-minute warm-up, four continuous miles and ten-minute cool-down. Remove the implausible Nov 10 route instruction, vague rhythm phrase and halfway/end reporting. The typed sequence should carry the workout.
- **José, Hope, Marcus · Nov 20:** Keep the distance, pace and exact stride prescription; replace the narrative with one pace line only.
- **José · Oct 20 (historic but screenshot-visible):** Clear the lengthy duplicated work and monitoring paragraph in a versioned edit. Preserve 8 mi continuous at 6:40–6:45/mi, the actual 20-minute warm-up and 10-minute cool-down. Do not replace it with another coaching essay.
- **Tinius · Oct 29 Speed 600s & 200s:** `Drills + 4 strides before the first set. Full recovery between sets.` Keep all within-set recoveries and warm-up/cool-down components unchanged.
- **Elijah's repeated speed work:** The typed warm-up, reps, target, jogging recovery and cool-down suffice. Remove generic no-catch-up-surge sentence.
- **Simon · Oct 29 5K test:** Keep test, measured-route and warm-up/cool-down prescription. Move detailed record-keeping request to private coach follow-up rather than an athlete-facing workout paragraph.

## Publication acceptance

1. Read the exact current version and structured components immediately before revising.
2. Change athlete prose and only those structured fields the coach explicitly prescribed. No dose or pace changes implied by copy cleanup.
3. Use authenticated `revise_session` or `write_session_version`; retain revision reason and append-only audit history.
4. Confirm coach membership and version-write authorization. Never use administrator privileges to evade failed coach-auth checks.
5. Re-read the latest version and signed-in Week feed for the targeted athlete/date.
6. Check that same-day sessions reflect the correct assigned season; do not automatically withdraw plausible overlapping plans.
7. Run the Coach Console's `session-editorial-standard` preflight. The form gate now rejects additional generic phrases, but direct SQL/RPC paths are still outside that client-side guard.

## Product contract

The Week page is the execution surface; Plan describes the season; My FORM is personalized orientation. None should expose legal disclaimers, internal status language, meaningless claims of progress, or stale automated notes. A coach-authored cue is useful only when it helps the athlete perform the session today.
