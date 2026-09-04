# Recovering the authored easy-day placement

4 September. **No production data changed.** Brice: *"Before generating new easy
sessions, inspect the previous app/plan source and recover the actual authored
easy-day placement and mileage wherever it exists. Show me what you found before
changing production data."*

## What I found: it does not exist

Four sources checked. None of them holds a Monday, Wednesday, Friday or Sunday
easy prescription for Hope or José.

**1 · Supabase.** Every `planned_sessions` row either athlete has ever had
carries one of four day labels:

| | TUE | THU | SAT | WEEK |
|---|---|---|---|---|
| José | 15 | 13 | 13 | 14 |
| Hope | 14 | 14 | 13 | 14 |

No MON, no WED, no FRI, no SUN — not published, not cancelled, and nothing in
`planned_session_moves`. There is no deleted structure hiding behind a state.

**2 · The budget was the original authoring, not a collapse of something older.**
Commit `0988a75`, 3 September: *"Twenty-eight rows authored, Jose 18 mi and Hope
15 … Joses weeks now read 32 to 41 miles where they read 21."* Twenty-one miles
is Tuesday plus Thursday plus Saturday. Before that commit the easy running was
not authored anywhere at all — the budget did not replace daily sessions, it was
the first time easy mileage entered the plan. The `18/12` and `15/10` in the
spec are the normal week and the W7 cutback, not two runs.

**3 · The earlier mock,** `the-plan-2.html`. Monday, Wednesday and Friday are em
dashes across all fifteen columns. Empty.

**4 · FORM-iOS.** The app authors in **minutes**, not miles, and its only
mileage-shaped easy content is Ghost Protocol onboarding — `20 min count your
steps`, `15 min easy`. It is a different plan on a different unit, which is
precisely the plan build 41 replaces on José's phone. Nothing to lift.

`the-plan-6.html` does show Mon 7 · Wed 7 · Fri 0–3, but that is the reference's
own reconstruction, written after the budget existed. It is not a source, and it
does not reconcile with the budget either: 7 + 7 + 3 is 17 against 18.

**So any allocation I write would be invented,** which is the thing you told me
not to do. I have not written one.

## What does exist: how they actually place it

Not authoring — evidence. Filed, and now on the record.

| | placement | total | budget |
|---|---|---|---|
| José W1 | Mon 4.02 · Wed 5.05 · **Thu 6.02** · Fri 3.52 | 18.61 | 18 |
| José W2 | Mon 7.02 · Wed 7.03 · **Thu 7.26** · Fri 3.54 | 24.85 | 18 |
| Hope W1 | Mon 7.29 · Wed 7.27 | 14.56 | 15 |

Three things worth your eye before you author:

- **They run easy on Thursday**, which the plan authors as a key day. José's W2
  Thursday was 7.26 easy with Hope; the authored *Clean Rhythm* was not filed. A
  seven-day canonical week has to decide whether Thursday is quality, easy, or
  quality that gets displaced.
- **José's W2 ran 24.85 against an 18-mile budget** — 38% over. If the canonical
  week is meant to be followable as written, 18 is already not what he does.
- **Hope runs fewer, longer days than José** — two runs of 7.3 against his four
  of 3.5 to 7. The same total distributes differently per athlete, which is an
  argument for the method authoring a shape and the athlete block adjusting it.

## On volume, since it changes what gets authored

The authored weeks currently sum to 33 · 39 · 37 · 41 · 44 · 39 · 25 · 37 · 38 ·
45 · 31 · 39 · 39 · 26, with the budget flat at 18. You want 45 → 55 → 60 and
higher for marathon work. Flat easy is exactly what makes that impossible to
express: the key sessions cannot carry a 15-mile increase on their own without
distorting the race-pace progression. **Authoring the easy days is the mechanism
for volume progression**, and the two dimensions — total absorbed volume, and
continuous distance owned at race pace — stay separate numbers.

Whatever you author, the 35–45 range should not be recorded as a property of
Race Pace Durability. It is where these two athletes are in September.

## What I need from you

The canonical seven-day week for Race Pace Durability, at whatever volume tier
you want week 1 to sit at, and how it progresses. Something as small as:

```
Mon  Easy 6 mi        8:45 or slower
Tue  KEY              deeply authored, unchanged
Wed  Easy 6 mi        8:45 or slower
Thu  KEY / support    deeply authored, unchanged
Fri  Easy 4 mi        8:45 or slower
Sat  LONG / ownership deeply authored, unchanged
Sun  Rest
```

…and the ramp — which weeks step to 50, to 55. I will author it against the
existing weeks without touching a single key session, keep `Across the week` as
an audit row through the migration, and count the miles once.

Two decisions ride on it: whether Thursday stays deeply authored, and whether
Hope's week is the same shape as José's or the same total.
