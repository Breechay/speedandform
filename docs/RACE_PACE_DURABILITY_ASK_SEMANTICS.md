# October 6, 2026 · current ruling

This section is authoritative over older examples below.

The reusable Race Pace Durability plan now has **three programmed continuous ownership asks: 5, 6 and 8 miles**. The former W12 twelve-mile ask is retired. Later race-pace segments inside long runs are **late-access durability work**, not continuous-ownership checkpoints, and do not move the ownership mark.

An athlete can later be assigned 9 or 10 continuous miles when their own execution, reserve and recovery make that useful. Those are athlete-specific coach decisions, not missing rungs that must be collected. Twelve continuous miles at half-marathon pace is not required before racing.

A successful session is not defined by suffering or by completing the largest available number. Preserve prescription, execution, athlete report, cost, limiter and recovery separately. Conditional work must remain visibly conditional on the athlete-facing surface.

---

# The ask, and what an ask returns

**Originally proposed 5 September 2026; current semantics revised 6 October 2026.**
Companion to `RACE_PACE_DURABILITY_CANONICAL_v1.md`. Git history preserves the retired four-ask proposal; this file states the current operating semantics.

---

## 1 · What an ask is

Race Pace Durability contains three programmed continuous-ownership **asks**:

| | | |
| --- | --- | --- |
| **W4** | 5 mi continuous @ the athlete's race-pace band | Tuesday |
| **W6** | 6 mi continuous @ the athlete's race-pace band | Tuesday |
| **W9** | 8 mi continuous @ the athlete's race-pace band | Tuesday |

W11 and W12 contain conditional late-access durability work (4 then 6 race-pace miles after prior easy running). They are not ownership asks and cannot move the ownership mark. Nine or ten continuous miles may be authored later for an individual athlete when evidence makes the question useful; they are not missing reusable-plan rungs.

Every other session is preparation, support, durability or absorption. **A programmed ownership ask is the only reusable-plan session that can return an ownership verdict.** The other weeks are not lesser; they make those questions answerable.

## 2 · The three verdicts

A verdict is a **coach's act**, not a computed result. This is not a new rule —
it is the sixth ownership law already in canon: *pace alone never determines what
an athlete has established.*

### ESTABLISHED

The distance was carried inside the band with sufficient control.

- The rung is now owned. `mark_checkpoints.state → reached`.
- The session records `establishes_checkpoint_id`.
- **The canonical plan remains valid.** Nothing accelerates.

**Note:** ESTABLISHED is not a binary state. Starting with W9, there is a distinction between:

- **Execution established** — the distance was carried inside the band with sufficient control
- **Durability corroborated** — the capability can be re-accessed under compounding fatigue

This distinction is pre-registered in `W9_HYPOTHESIS_PRE_REGISTRATION.md`. An athlete can have execution established but durability not yet corroborated — this is the fractional-credit case the method has been looking for.

### CARRIED, NOT ESTABLISHED

The distance was completed, but execution gives reason not to call it owned —
meaningful late drift, excessive cost, loss of control.

- The rung stays unestablished.
- **The evidence remains fact.** It is on the record as run, at the splits it was
  run; it simply did not answer the question.
- No harder work is added on the strength of it.
- What happens next belongs to the assignment, not the plan.

### NOT HELD

The prescribed distance was not carried at the band.

- No ownership claim advances.
- **Determine why before changing anything.**

## 3 · What a verdict does not do

**ESTABLISHED does not unlock the next rung early.** Establishing 5 in W4 does
not put 6 on the following Tuesday. W5 is still a build week and W6 still asks 6.
The canonical plan already contains the preparation between questions; a good
answer confirms the plan, it does not compress it.

So the rule is not *pass → advance*. It is:

> **Establish → the canonical plan remains valid.**
> **Anything else → a coaching decision point.**

**No verdict edits the plan.** Race Pace Durability does not change because one
athlete struggled at W9. That is the assignment's business.

**No verdict is automatic.** Nothing in the system may write a verdict from
splits. The instrument presents the evidence; the coach rules.

## 4 · When an ask is NOT HELD, the question is why

Five readings, and they call for different things:

| | what it looks like | |
| --- | --- | --- |
| **Pace** | went out at 6:25 against a 6:30–6:45 prescription | an execution problem, not a durability one — the ask was never run |
| **Durability** | correct execution, then genuine deterioration | the real limiter, and the one the block exists to move |
| **Load** | the surrounding week buried them | the ask was fine; its neighbours were not |
| **Environment** | heat, dew point, terrain, wind | the day was not the test |
| **Insufficient evidence** | one occurrence, nothing else pointing the same way | **not a reason to rewrite anything** |

Only the second is evidence about the athlete's durability. The other four are
evidence about the *conditions of the test*, and treating them as durability
failures would teach the plan the wrong lesson.

## 5 · Cases the model has to answer, and one I am not ruling on

**Faster than the band.** 5 continuous at 6:20. Under existing canon — *under
6:30 is a different session* — that is not the prescribed stimulus, so it cannot
establish the rung. I believe that is right and I have written it that way, but
**it deserves your explicit ruling**, because it is the case where the model
tells a successful athlete that their good day did not count.

**Short of the distance at the band.** 3.5 of 5 miles, splits perfect. NOT HELD
for 5. Under law three, continuous ownership is the longest single uninterrupted
qualifying piece — so this establishes 3.5 of nothing, since 3.5 is not a rung.
The evidence stands; no checkpoint moves.

**Beyond the distance.** 7 continuous when 6 was asked. Establishes 6. It does
not establish 7, because 7 is not a rung, and it does not skip to 8.

**A cancelled or missed ask.** Under law four, a cancelled prescription cannot
establish. The rung stays where it was and the plan continues; the next ask is
simply attempted on less evidence.

**An ask repeated inside the assignment.** A repeat is a new attempt, appended.
It never overwrites the first, and the ledger keeps both.

## 6 · This is the act the schema has been waiting for

`planned_sessions.establishes_checkpoint_id` exists and is set on **0 of 309
sessions**. All five reached checkpoints got there by *inference* — a continuous
session at the band matching an unreached rung. The open list already names this:
inference is the placeholder, the column is the real answer.

The verdict is what fills it. `establishes_checkpoint_id` stops being an unused
column and becomes the record of a coach ruling that an ask was answered — which
also retires the last piece of shape-matching from the ownership model.

## 7 · Where the verdict sits

    PLAN         Race Pace Durability v1 — the authored 15-week argument
      ↓
    ASSIGNMENT   v1 → Hope. Inherits the plan exactly.
      ↓
    EVIDENCE     what Hope actually ran
      ↓
    VERDICT      did that evidence establish the capability being asked?
      ↓
    OVERRIDE     only where her evidence gives reason to depart from the source

The plan does not mutate because Hope struggled. **A verdict changes what an
athlete owns; an override changes what an athlete is asked next; neither touches
the source.**

## 8 · How the plan itself gets revised

One athlete failing W9 is a coaching decision about that athlete. The same
failure across athletes is evidence about the *plan*:

> Three assignments could not hold W9. Review the source.

That is a prompt, never an action. `Race Pace Durability v1 → v2` is a
deliberate authoring act, and historical assignments do not move with it — the
same append-only rule every other ledger here follows.

## 9 · Deliberately not specified

**No thresholds.** Nothing here says drift beyond N seconds is CARRIED rather
than ESTABLISHED. We do not know that yet, and guessing it would turn the method
into `PASS → advance / FAIL → repeat`, which is the mechanical thing this exists
to avoid.

**No automatic response to a verdict.** What follows CARRIED or NOT HELD is a
coaching decision, and the responses are not enumerated here.

**No wording.** What the athlete is told when an ask is not held is voice work,
and it has not been written.

---

*Nothing implemented. No migration, no surface, no change to any athlete.*
