# Source plan, assignment, supersession — the design

**Design only, 5 September 2026. Nothing written.** Scope: Hope and José.
Marcus untouched. W1–W2 immutable.

---

## 1 · First, the W15 Friday — I was half wrong

I called it your earlier ruling. Here is exactly what exists.

The migration that authored race week says, in its header:

> race week carries **24 before the race for José, 21 for Hope**

and the database agrees to the decimal — José 24.35, Hope 21.35. The difference
was deliberate *at authoring time*, and the 3 miles were removed by simply not
authoring Hope a Friday.

**But there is no provenance in the system.** No decision row, no
`change_reason`, and an absent session cannot carry a reason. The only record is
a comment in a migration file.

By your own test — *an override should only survive if you actually chose it* —
a prose comment is not a choice the system can show you. **My recommendation:
treat it as drift, give Hope the Friday, and let canonical stand.** If you
recognise it, it becomes an override with a real reason attached this time.

## 2 · The complete override list, W3–W15

**78 day-slots. Exactly two differ.**

| | | |
| --- | --- | --- |
| **W15 Tue** | Hope's intent differs — *"Settle at 6:45. Do not chase faster."* | **Legitimate override.** The migration states the reason: on 25 August she ran three of four reps under her band, and race week is where that costs most. A coaching decision with a cause. |
| **W15 Fri** | Hope has no session | **Drift** — see §1. |

Everything else across thirteen weeks is already identical. The assignment is
genuinely clean: one plan, two athletes, one certain override.

## 3 · The source plan — first class, no template athlete

```
training_plans
  id · slug · name · discipline · total_weeks · status
  question           "How far can you carry race pace before it comes apart?"
  for_whom           the capability required to enter
  entry_volume · peak_volume
  race_pace_low_seconds · race_pace_high_seconds     the band is the plan's
  authored_by · created_at · updated_at

training_plan_versions                                append-only
  id · plan_id · version_number · cut_at · cut_by · summary

training_plan_weeks
  id · plan_id · version_id · week_number · phase · total_distance · intent
  phase ∈ build · ask · absorb · taper · race

training_plan_sessions
  id · plan_id · version_id · plan_week_id · day_of_week · role
  title · intent · details · prescribed_distance · distance_unit
  asks_rung_value        5 · 6 · 8 · 12, else null

training_plan_components
  id · plan_session_id · position · role · shape · distance · duration_seconds
  repeat_* · pace_low_seconds · pace_high_seconds · recovery_* · counts_toward_mark
```

Two deliberate differences from the athlete tables:

- **`asks_rung_value`, not a checkpoint id.** A plan asks *twelve miles*.
  Checkpoints belong to athletes; the assignment resolves value → that athlete's
  checkpoint.
- **`counts_toward_mark` is a boolean.** The plan declares *this component can
  establish*; the assignment resolves it to that athlete's mark id.

A plan that stored athlete ids would not be a plan.

## 4 · The assignment

```
plan_assignments
  id · plan_id · plan_version_id · athlete_id · block_id
  starts_at_plan_week      3 for both — they join at W3
  starts_on                2026-09-07
  assigned_by · assigned_at · notes
```

## 5 · How athlete rows relate to the plan — the real decision

**Option A — resolve at read time.** No athlete rows for inherited future days;
every surface computes them from plan + overrides.

Cost: **14 database functions read `planned_sessions`**, including
`athlete_plan_feed_impl`, `record_session_from_form_impl`, `file_session`,
`write_session_version` and `withdraw_session`, plus six tables with foreign keys
into it. Filing needs a session id, so a row must be materialised the instant
evidence arrives — meaning materialisation does not disappear, it moves to the
worst possible moment. Gate A was proven against the current feed shape.

Architecturally pure. Rewrites the athlete-facing path mid-block, eleven weeks
from a race. **I would not.**

**Option B — materialise, hard-linked and drift-checked.** Recommended.

```
planned_sessions.plan_session_id     which plan session this came from
planned_sessions.override_reason     null = inherited · text = deliberately different
```

- An **inherited** row is generated from the plan and may be regenerated from it.
- An **override** row is frozen against regeneration and states why in words.
- A view — `assignment_drift` — returns any inherited row whose prescription no
  longer equals its plan session.

That last piece is what makes this one source rather than two copies. Today
divergence is invisible; under this it is **queryable, and must resolve to either
an override or a bug.** Your objection was to two synchronised copies with
nothing linking them. The link and the check are the answer to it.

## 6 · Supersession of the existing W3–W15

Those rows were authored from a different plan. Making them *become* plan rows by
revision would blur where the prescription came from — the exact ambiguity this
migration exists to end. So:

1. **`withdraw_session`** each existing dated W3–W15 session, with a reason
   naming the assignment. It already requires one.
2. **Withdraw the vestigial undated budget row** in each of those weeks.
3. **Generate** the assignment's rows from the plan, each carrying
   `plan_session_id`.

No row is edited into pretending it came from somewhere it did not, and nothing
is deleted. **W3–W15 currently hold zero filed completions**, so no evidence,
exception or note is orphaned — I checked before choosing this.

W1–W2 are not read, not revised, not withdrawn. 8 sessions and 4 filed
completions each, untouched.

## 7 · The ladder

Current: `1 · 2 · 5 · 6 · 8 · 10 · 13.1` — 1 and 2 reached.

- **1 and 2 stay.** They are reached. Removing a reached rung destroys history.
- **5 · 6 · 8 stay** — canonical asks them.
- **10 → 12** via `moveCheckpoint` with `decision: 'replace'` and a reason, so the
  change carries provenance instead of being an UPDATE.
- **13.1 — your call.** Canonical says the race is not a training rung. Removing
  it makes the ladder end at 12; keeping it leaves a rung nothing asks. I have
  not chosen.

Result: `1 · 2 · 5 · 6 · 8 · 12` plus whatever you decide about 13.1.

## 8 · The eight asks already written

They point at old W3/W4/W8/W9 sessions that step 6 withdraws, and one points at
rung 10 which step 7 replaces. **They are rolled back in the same migration** and
re-derived from `asks_rung_value` on the plan. No ask has been answered, so
nothing is lost.

## 9 · Order, and what needs you first

1. **§1** — Hope's W15 Friday: drift or override?
2. **§7** — 13.1: keep or drop?
3. **§5** — confirm Option B.

Then: plan tables → author v1 → assignment → withdraw + generate → ladder →
re-derive asks → the outstanding `ASKS 8 MI → KEEP / CHANGE / REMOVE` revision
guard.

**The W3 window closes Monday.** If the migration cannot land before then, the
honest fallback is to author W3 alone against canonical by hand so the athletes
run what you told them, and migrate the rest behind it.

---

*Nothing written.*
