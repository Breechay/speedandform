# `establishes_checkpoint_id` — what it means, and what is missing

**Audit only, 5 September 2026. No implementation, no migration, no code change.**

Question put: does this column represent authored ask intent, post-evidence
establishment, or was it never fully specified — and what is the smallest change
that preserves both facts without overloading it?

**Answer: it was fully specified, it means authored intent, and both facts
already exist in separate machinery. No schema change is required.**

---

## 1 · What the column was specified to mean

Introduced 4 September in `…110000_an_athlete_is_not_an_app_user.sql`, with its
reasoning written down at the time:

> Labs currently infers rung-ness from "one continuous work component in band
> whose distance matches an unreached checkpoint". That is right today and it is
> a guess. The column makes it a fact.

and its comment:

> **The ladder rung this session would move if it lands.** Separate from
> `is_key`: a session can be what the week asks without establishing anything.

Then, the same day, `…240000_eligibility_is_authored_not_inferred.sql` drew the
line explicitly against component eligibility:

> It keeps its own meaning — **this session is the one aiming at that rung** —
> which is **a coaching intention** rather than an eligibility test.

So: **authored ask intent.** *Would* move if it lands. *Aiming at.* Coaching
intention. It was never specified as post-evidence establishment, and because it
is set on **0 of 309 sessions**, it has never been used as anything else either.
There is nothing to un-overload.

The verb in the name is the only misleading thing about it.

## 2 · The verdict already has its own machinery, and it is in use

`mark_checkpoint_movements`, added 29 August. Append-only, and it already carries
every part of a ruling:

| | |
| --- | --- |
| `checkpoint_id` | which rung was ruled on |
| `source` | `automatic` · `coach` · `override` |
| `decision` | `advance` · `repeatDose` · `reduce` · `replace` · `hold` |
| `previous_state` → `resulting_state` | what the ruling did |
| `evidence_completion_id` | the filing the ruling read |
| `rule_id` · `rule_version` | for automatic movements only |
| `reason` | **required, non-empty** |
| `moved_by` | enforced for any non-automatic source |

Two constraints make it honest: an automatic movement must name its evidence and
rule version, and a coach movement must name the coach. The idempotency index
applies **only** to `source = 'automatic'`, so a coach may rule more than once on
the same rung and every ruling stays on the record.

**20 movements already exist**, sources `coach` and `override`. This is live
machinery, not a design.

## 3 · The two facts, already separate

    ASK TARGET   planned_sessions.establishes_checkpoint_id
                 authored before the session is run — "this asks rung 8"

    VERDICT      mark_checkpoint_movements
                 written after evidence — "the coach ruled this established rung 8"

Authorship asks the question; coaching answers it. **Both already exist and
neither can be mistaken for the other.**

One structural point in its favour: the ask target is on `planned_sessions`, not
on the version — so unlike `counts_toward_mark_id`, which lives on components and
was silently dropped by the first revision until that was fixed, **a revision
cannot lose the ask target.** It is out of the version's reach by construction.

## 4 · The three verdicts map onto it without a new column

| verdict | movement row |
| --- | --- |
| **ESTABLISHED** | `decision: advance` · `resulting_state: reached` · evidence · reason |
| **CARRIED, NOT ESTABLISHED** | `decision: hold` · state unchanged · evidence · reason |
| **NOT HELD** | `decision: hold` (or `repeatDose` / `reduce` if the dose also changes) · state unchanged · evidence · reason |

`resulting_state` is not constrained to differ from `previous_state`, so a hold
is a legal, recorded ruling — the ask was answered *no*, and that is on the
record rather than being an absence.

The 6:20 case also resolves here without a fourth verdict, which is what you
asked for: the **ownership verdict** is hold, the **coach interpretation** is
`pace` — the ask was never run as prescribed. `NOT HELD` never has to mean
"couldn't do it".

## 5 · Three gaps, none of them the column's

**a · The one candidate for a schema change.** Your third axis — coach
interpretation: pace · durability · load · environment · insufficient evidence —
has no structured home. It can only live in `reason` as prose, which means the
cross-athlete question *"three assignments could not hold W9, and all three were
durability"* cannot be asked of the data.

If you want that axis structured, the smallest change is **one nullable column
with a check constraint** on those five values. Nothing to backfill — the
distinction did not exist when the 20 existing movements were written. This is
the only schema change I would propose, and only if you want to query it.

**b · A real defect in `moveCheckpoint`, code not schema.** On every movement it
writes `evidence_completion_id` onto the `mark_checkpoints` row itself — including
a `hold`. So ruling that an attempt did *not* establish a rung would stamp that
failed attempt onto the checkpoint as its evidence. The ledger should carry the
evidence for a hold; the checkpoint should not.

**c · Nothing maintains the ask target across a revision.** It survives, which is
right, but nothing re-examines it. Revise W9 from 8 miles to 6 and the session
still claims to ask rung 8. Not urgent while the column is unused; it becomes a
correctness problem the day it is populated.

## 6 · One recommendation about the name, and it expires

`establishes_checkpoint_id` reads as a record of the past and means an intention
about the future. That is exactly the confusion your question was probing.

It is set on **0 of 309 rows** and read by no surface. **This is the cheapest
this rename will ever be** — a column rename with no data migration and no
behaviour change. `asks_checkpoint_id` would say what the comment already says.
The moment the ask model ships and the column is populated, the rename costs
data, code and a deployment window.

Not a recommendation to act now. A recommendation to decide now, because the
price only rises.

---

## Smallest change

**For the ask/verdict distinction: none.** Both facts exist, in separate tables,
with the right semantics already written down.

**Optional, and only if you want the five readings queryable:** one nullable
`interpretation` column on `mark_checkpoint_movements`.

**Worth doing while it is free:** rename the column to say what it means.

*Nothing implemented.*
