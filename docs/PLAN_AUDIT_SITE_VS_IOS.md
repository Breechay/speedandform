# Marcus's Half block: site vs FORM-iOS, and the week model

Produced 2026-08-25 for the Coach Console composition pass. Read-only audit.
Nothing in this document has been applied to either repository.

## 1 · Where the plan actually lives

**The dated 16-week block exists only in the website repository.** FORM-iOS has no
dated Half block for Marcus, Hope or Jose, and no calendar week boundaries at all.

| | website | FORM-iOS |
|---|---|---|
| Dated weeks | `training_weeks`, `20260827150000_author_the_block.sql` | none |
| Dated sessions | `planned_sessions.scheduled_on` | none |
| Week identity | absolute calendar dates | `startDate + 7n`, weekday free (`FORMWeekBase`) |
| Session structure | prose in `title` and `shape` | typed: `FORMV3WorkSection`, reps, recovery kind |
| Race-pace ladder | `mark_checkpoints` 1 2 5 6 8 10 13.1 | same ladder, `FORMV3HalfAuthor`, commit `904b8753` |

The two repositories therefore cannot disagree about dates, because only one of
them has any. **The website is the authority for the calendar.** FORM-iOS is the
authority for what a session *is*.

They agree on the ladder. `904b8753` ("Amend the Half author with the race-pace
ladder") encodes `1 → 2 → 5 → 6 → 8 → 10 → 13.1` continuous miles, the same
sequence `20260829120000_ladder_is_capability.sql` writes to `mark_checkpoints`.

They also already agree on the doctrine driving this pass:

> Broken race-pace miles are a different thing from a continuous one: four miles
> split by recoveries means the longest actually held is one.
> — `FORM/Plan/FORMV3Programming.swift:1392`

## 2 · The two authored race-pace sessions in FORM-iOS

| id | structure | dose | recovery |
|---|---|---|---|
| `half.familiar.racePaceBridge` | 20 min easy + 3 × 2 mi HM + 10 easy | 3 × 2 mi HM | 3 min **float** |
| `half.durable.racePaceContinuous` | 20–30 min easy + 5–10 mi continuous HM + 10 easy | 5 → 6 → 8 → 10 mi continuous | none |

The website's week 2 is titled `3 × 2 mi at race pace` with shape
`20 min easy, then 3 × 2 mi with 3 min easy between`. Same session, two wordings.

**Mismatch worth a decision:** iOS says the recovery is a *float*, the site says
`3 min easy`. This is the distinction that decides whether a session can answer
anything, and it is the one Hope's 25 Aug run turned on. The site wording should
follow the iOS doctrine.

**Second mismatch:** the site's shape omits the cool down that iOS authors on both
sessions.

## 3 · The 16-week runway on the Monday–Sunday model

Weeks Monday to Sunday, W1 starting Aug 24, race day inside W16. Sessions are the
stored authored dates, each placed in the week that contains it.

| Wk | Mon–Sun | Tue | Thu | Sun |
|---|---|---|---|---|
| W1 | Aug 24–30 | Aug 25 · 4×1 mi race pace *(Hope and Jose only)* | — | Aug 30 · long 9 |
| W2 | Aug 31–Sep 6 | Sep 1 · 3 × 2 mi race pace | Sep 3 · Threshold 5 | Sep 6 · long 10 |
| W3 | Sep 7–13 | Sep 8 · 5 mi race pace | Sep 10 · Speed 5 | Sep 13 · long 9 |
| W4 | Sep 14–20 | Sep 15 · Easy week 6 | Sep 17 · Easy 5 | Sep 20 · long 11 |
| W5 | Sep 21–27 | Sep 22 · 6 mi race pace | Sep 24 · Threshold 6 | Sep 27 · long 11 |
| W6 | Sep 28–Oct 4 | Sep 29 · Threshold 5 | Oct 1 · Speed 5 | Oct 4 · long 12 |
| W7 | Oct 5–11 | Oct 6 · 6 mi race pace | Oct 8 · Threshold 6 | Oct 11 · long 10 |
| W8 | Oct 12–18 | Oct 13 · Easy week 6 | Oct 15 · Easy 5 | Oct 18 · long 12 |
| W9 | Oct 19–25 | Oct 20 · 8 mi race pace | Oct 22 · Speed 6 | Oct 25 · long 13 |
| W10 | Oct 26–Nov 1 | Oct 27 · Threshold 6 | Oct 29 · Threshold 6 | Nov 1 · long 13 |
| W11 | Nov 2–8 | Nov 3 · 8 mi race pace | Nov 5 · Speed 6 | Nov 8 · long 14 |
| W12 | Nov 9–15 | Nov 10 · 10 mi race pace | Nov 12 · Easy 5 | Nov 15 · long 12 |
| W13 | Nov 16–22 | Nov 17 · 6 mi race pace | Nov 19 · Speed 5 | Nov 22 · long 10 |
| W14 | Nov 23–29 | Nov 24 · 4 mi race pace | Nov 26 · Easy 4 | Nov 29 · long 8 |
| W15 | Nov 30–Dec 6 | Dec 1 · Race week 3 | Dec 3 · Easy 4 | Dec 6 · long 8 |
| W16 | Dec 7–13 | Dec 8 · Race week 3 | Dec 10 · Easy 4 | **Dec 13 · RACE** |

The model is internally consistent: every week gets Tue, Thu, Sun in that order,
and race day lands inside W16. It fixes all three defects named in the brief.

### What reassignment changes, beyond labels

The authored Sunday long run sits on the **first** day of its authored week. Moving
to Monday–Sunday makes it the **last**, which re-pairs every long run with a
different key session:

| | Tue key | paired long run, before | after |
|---|---|---|---|
| W2 | 3 × 2 mi race pace | Aug 30 · 9 mi | Sep 6 · **10 mi** |
| W5 | 6 mi race pace | Sep 20 · 11 mi | Sep 27 · **11 mi** |
| W12 | 10 mi race pace | Nov 8 · 14 mi | Nov 15 · **12 mi** |

**This is a coaching change, not a relabelling, and only Brice can approve it.**
The peak long run (14 mi) currently sits beside the 10 mi race-pace peak in W12.
After reassignment it moves to W11, beside the second 8. Two options:

1. Reassign by date only. Distances shift as above.
2. Reassign by date **and** shift the long-run distance list one week later, so
   each long run keeps the key session it was authored against.

## 4 · Marcus's 25 August session

**There is none.** No migration authors a week 1 or an Aug 25 session for Marcus.

- `20260826140000_rpe_and_key_sessions.sql` creates week 1 and the Aug 25
  `4×1 mi at race pace` for `hope` and `jose` only.
- `20260824183100_seed_slice1.sql` is Natalie.
- `20260827150000_author_the_block.sql` and `20260827160000_full_week_shape.sql`
  start Marcus at week 2.

Marcus's first authored session is **Sun Aug 30, long run, 9 mi**. His first
race-pace work is **Tue Sep 1, 3 × 2 mi**.

The two Garmin screenshots are Hope's and Jose's Aug 25 runs, not Marcus's:

| | reps | recoveries | athlete's own easy | reading |
|---|---|---|---|---|
| 6:31 · 6:28 · 6:30 · 6:27 | 4 × 1 mi | 8:14 · 8:30 · 8:26 | Jose 8:16 | floats held, within 14s |
| 6:29 · 6:20 · 6:22 · 6:19 | 4 × 1 mi | 10:01 · 12:12 · 12:12 | Hope 8:48 | rested instead of floating |

FORM-iOS agrees on the count: "Two athletes ran 4 × 1 mi at HM pace at RPE 8 in
week one of a fifteen-week block." Two, not three. Marcus is the sixteen-week
block and was not among them.

## 5 · The structured-dose gap

`planned_session_versions` columns are:

```
title, shape, prescribed_distance, distance_unit, prescribed_duration_minutes,
pace_low, pace_high, rpe_low, rpe_high, intent, details, change_reason
```

For the runway to say `3 × 2 MI · 6:30–6:45/MI · 3:00 RECOVERY · OUTSIDE`:

| element | available? | source |
|---|---|---|
| pace band | yes | `pace_low` / `pace_high` |
| surface | yes | `athlete_marks.evidence_surface_requirement` |
| effort | yes | `rpe_low` / `rpe_high` |
| rep count and rep distance | **no** | prose only, in `title` and `shape` |
| recovery duration and kind | **no** | prose only, in `shape` |
| continuous vs intervals | **no** | prose only |

Three of six exist only as prose. Rendering them means either parsing the title,
which the brief forbids, or adding structured columns. The typed model already
exists in FORM-iOS (`FORMV3WorkSection`: pieces, recovery kind, construct) and is
the natural shape to mirror.
