# Raise the Ceiling — canonicalization packet

**Status: NOT canonical yet. This is the encoding, not the record.**

`public_plan('raise-the-ceiling')` returns `null` today. This document promotes
`RAISE_THE_CEILING_plan_v4.md` (FORM LABS / Main Labs, Sep 07) into the exact
shape the canonical store needs, so the Console work is transcription rather than
authoring, and so nothing gets invented on the way in.

Derived from v4 only. Where v4 is silent, this document is silent.

---

## The blocker, stated precisely

The published-plan shape has **no athlete dimension.**

Verified against the live RPC, not assumed:

```
public_plan('race-pace-durability')
  → plan | field | weeks[] | running | version
     weeks[].sessions[]   one session per day, per week
     sessions[].components[]
```

There is exactly one prescription per day. Nowhere to put two.

Raise the Ceiling's defining feature is that **Simon and Lisa do not share a
Tuesday.** In W3 Simon runs 25 minutes continuous while Lisa runs 2 × 12. In W4
they swap roles. Collapsing that into one row destroys the study — v4 is explicit
that Lisa's repeat is intentional and must not be normalized onto Simon's
sequence.

So this is a **schema change, not data entry.** Options in §7.

Caveat on the evidence: this was verified through the *public* RPC. An assignment
model may exist behind RLS that the public door does not expose. Someone with
Console access should confirm before choosing an option.

---

## 1. Plan record

| field | value | note |
|---|---|---|
| slug | `raise-the-ceiling` | |
| name | Raise the Ceiling | |
| total_weeks | 6 | |
| question | Can a good runner become a better runner without simply running harder? | |
| discipline | — | **not** half_marathon; the expression is a 10K time trial |
| entry_volume / peak_volume | **null** | v4: easy-long distance is athlete-specific. Do not invent mileage. |
| race_pace_low/high_seconds | **null** | there is no single band; the band is per athlete (§3) |

Governing idea, plain language, for the public page:

> Make a fast pace ordinary before asking for a faster one.

Starts W1 · Sep 01 2026. Expression Sat Oct 10 2026 · 10K.

**Only Tuesday, Thursday and Saturday are authored by this plan.** Mon/Wed/Fri
general aerobic and Sun rest-or-HYROX are the athlete's existing week and are
described in v4 as context, not prescription. Do not encode them as sessions.

---

## 2. The six weeks

| Week | Date | Tue · Simon | Tue · Lisa | Thursday | Saturday |
|---|---|---|---|---|---|
| W1 | Sep 01 | 2 × 10 min · filed | 2 × 10 min | filed | Easy long |
| W2 | Sep 08 | 2 × 12 min | 2 × 10 min · race re-entry | Pyramid Intervals | Easy long |
| W3 | Sep 15 | 25 min continuous | 2 × 12 min | Speed Demons | Easy long |
| W4 | Sep 22 | 2 × 12 min · recovery cut to 2 min | 25 min continuous | Gauntlet | Long + controlled faster finish |
| W5 | Sep 29 | 25 min continuous | 25 min continuous | Nice and Easy | Easy long, no proving |
| W6 | Oct 06 | 1 × 12 min touch | 1 × 12 min touch | Strides only | 10K time trial · Oct 10 |

Both arrive at the test with two 25-minute continuous efforts filed at their own
band. Different routes, same destination.

---

## 3. Assignments

Structure is identical for both. Pace is not.

**Simon** — working direction `6:00 /mi · 3:44 /km`.
Hold the floor of the effort, not the ceiling.

**Lisa** — `7:00–7:10 /mi · 4:21–4:25 /km`.
Drawn from her own Aug 18 evidence (eight-minute sets at 7:11 and 7:07). The 6:47
rep shows she has more available; it is deliberately not the band.

Lisa is one week behind on Tuesday and that is correct — she raced HYROX D.C. on
Sep 03. **Do not normalize her onto Simon's sequence.**

### Tuesday execution (both)

```
warm-up    15–20 min easy + 4 × 20s relaxed strides
recovery   3 min float in W2 and W3; 2 min from W4
cool-down  10 min easy
```

Coaching rule to preserve verbatim in meaning: prefer a session that finishes as
strong as it starts. A hot first rep is a warning. The band is not a target to beat.

---

## 4. Thursday — fixed FORM standards

These **do not scale to the athlete.** Athlete variation is expressed by how close
each gets to a standard that does not move. Metric units and absolute rep times
stay exactly as written — never convert to per-mile pace.

| Week | Session | Standard |
|---|---|---|
| W2 · Sep 10 | Pyramid Intervals | 2×300m 50–52s · 90s; 2×400m 1:08–1:12 · 2min; 1×600m 1:42–1:45 · 2:30; 2×400m 1:08–1:10 · 2min; 2×300m 50–52s · full |
| W3 · Sep 17 | Speed Demons | 4×300m 50–52s · 2:30; 6×200m 32–34s · 90s; 8×100m 15–17s · 90s |
| W4 · Sep 24 | Gauntlet | 3×600m 1:48–1:52 · 3min; 2×400m 1:08–1:12 · 2:30; 3×300m 48–52s · 2min; 2×200m 29–32s · 2min; 2×150m 20–22s · full |
| W5 · Oct 01 | Nice and Easy | 3×200m 29–32s · 30s; 2×800m 2:25–2:30 · 4min; 1×400m 1:08–1:10 |
| W6 · Oct 08 | Strides | Easy running + 4×100m relaxed strides · full walk/jog recovery |

Named speed sessions use WU 15 min · CD 10 min.

A week needing less load gets an explicitly authored shortened occurrence. The
standard is never silently scaled, and a truncated workout is never recorded as
the complete named session.

*Death* and *Resurrection* sit out this block.

**The two evidence lanes stay separate.** Tuesday asks how much controlled fast
running the athlete can sustain. Thursday asks how close they got to a fixed
standard. These must never collapse into one speed score.

---

## 5. Saturday

- **W2, W3, W5** — easy long, athlete's normal distance, conversational, no finishing efforts
- **W4** — long run with a controlled faster finish: final 15–20 min at the Tuesday band, *not faster*. The only session that asks for the pace on tired legs, placed deliberately before the two 25-minute efforts.
- **W6** — the test

Distance stays athlete-specific. **Do not invent mileage.**

---

## 6. The expression — Sat Oct 10 2026

```
15–20 min very easy
4 × 20s strides
10K
10–20 min very easy
```

Flat, measured, same course for both if the schedule allows.
Record temperature, humidity and dew point — the result is worthless without them.

Execution, both: open the first kilometre at the Tuesday band, no faster. Progress
from there if the body allows. The last kilometre should be the fastest.

### Never rendered

v4 carries projections of roughly **36:20** (Simon) and **43:15** (Lisa).

> Neither number is prescribed to either athlete and neither should be told to
> chase it.

These must not reach the public page, the athlete app, or any athlete-facing
surface. They are the coach's private read.

---

## 7. What has to happen before a renderer exists

Three ways to hold two athletes in one plan. This is a product decision, not an
implementation detail.

**A · Add an assignment dimension** to the published-plan shape — a plan carries
shared sessions plus per-athlete overrides on the days that differ. Correct
long-term, and it is the same object the app roadmap already needs for the
coach-set working band. Requires a table, an RPC change and a renderer.

**B · Two published plans** (`raise-the-ceiling-simon`, `-lisa`). Zero schema
change, works today — but it presents one block as two methods, duplicates the
shared Thursday standard, and `/plans/` would show two entries for one study.
Cheap and wrong.

**C · Hold.** `/plans/` lists Race Pace Durability honestly. Simon and Lisa read
`/labs/raise-the-ceiling/`, which already carries their six-week table and is the
better artifact for a block still being run.

Recommended: **C now, A next** — publish the rest of the site, then build the
assignment model properly rather than shaping the canonical store around a
deadline.

Whichever is chosen: the public page reads canonical data. The six-week table is
never typed into HTML.
