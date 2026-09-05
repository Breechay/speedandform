# One source of truth — the reconciliation plan

**Plan only, 5 September 2026. Nothing written for this. Show-me-first, as asked.**

Goal: Race Pace Durability v1 becomes the single prescription source. Hope and
José become assignments of it. No duplicate future prescription, no loss of
history.

---

## 0 · Already applied, and now partly provisional

The approved ask/verdict tranche went in before this instruction arrived:

- `establishes_checkpoint_id` → **`asks_checkpoint_id`** (rename, 0 rows affected)
- **`interpretation`** on `mark_checkpoint_movements` — nullable, checked against
  `pace · durability · load · environment · insufficient_evidence`
- **8 asks populated** — rungs 5, 6, 8, 10 for each of José and Hope
- `moveCheckpoint` no longer stamps evidence onto a checkpoint on a `hold`

The rename, the column and the hold fix are unaffected by anything below.

**The 8 asks are provisional.** They sit on the old blocks at W3/W4/W8/W9. Under
canonical the asks move to W4/W6/W9/W12, so this migration re-points them. That
is a re-point, not a rewrite — no ask has been answered yet.

One thing the ask migration caught that matters here: written without a block
filter it also tagged four of **Marcus's** sessions, including a long run
matching his unreached rung 2. It is scoped to blocks named Race Pace Durability.
Whether Marcus runs this method stays an open coaching question.

## 1 · The timing is the sharpest constraint

| | |
| --- | --- |
| Today | **Sat 5 September** |
| W2 ends | **Sun 6 September** |
| W3 starts | **Mon 7 September** |

You have already told them W3: 51 miles, `4 × 2 @ RP`, `2 × 10` threshold,
13 easy. **That is canonical W3 exactly** — total, Tuesday, Thursday, Saturday
and the 6/6/6 easy days all match the authored plan.

So the boundary is clean and it is tomorrow. Migrate at W3 and the product agrees
with what you already said. Migrate later and the first week of the new plan was
delivered by WhatsApp only.

## 2 · What becomes the source Plan object

`FORM_LABS_METHOD_OBJECT.md` says explicitly: do **not** build the canonical week
and session structure as typed data, because it creates a second authoring system
next to the Console. That advice assumed the method would be *derived from* their
blocks. You have reversed that relationship, so the advice needs revisiting — but
its reasoning still stands, and the cheapest answer honours both.

**Recommendation — the source is a block, authored in the Console like any other.**

    coaching_methods            identity + the question + who it is for
    coaching_method_versions    append-only; v1 cut today
    training_blocks.method_id           this block is an instance
    training_blocks.method_version_id   provenance, never read back down
    training_blocks.source_block_id     this block was assigned FROM that one

The canonical 15 weeks live as a `training_blocks` row that no athlete runs. It
reuses the entire existing stack — weeks, sessions, versions, components,
revisions, the Console — so there is **no second authoring system**, which was
the doc's real objection. Hope and José's blocks carry `source_block_id` pointing
at it, and **an override is any place their prescription differs from their
source**, computable rather than declared.

It needs a holder for the source block's `athlete_id`. There is precedent — the
`walk-fixture` row already exists as a non-athlete. That is the ugliest part of
this proposal and I would rather you saw it than have me hide it. The alternative
is making `athlete_id` nullable on `training_blocks`, which touches RLS on a
table everything reads. **Your call, and I would not decide it alone.**

## 3 · What happens to W3–W15

**Revised in place, never duplicated.** Their weeks and their dated sessions
already map 1:1 onto canonical — Mon–Sat prescribed, Sunday absent, W3 starting
7 September and W15 containing 5 December. So:

- **W1–W2 — untouched.** 8 sessions each, 4 filed each. Not read, not rewritten.
- **W3–W15 — each dated session gets a new version** through `write_session_version`,
  carrying canonical's prescription. Same session id, so the revision ledger
  shows exactly what changed and every existing rule about append-only history
  applies unchanged.
- **The undated budget row in each week is withdrawn.** `Easy — 18 mi across the
  week` is vestigial: it stopped counting the moment the week authored its days,
  and it has no canonical counterpart.
- **Nothing is created and nothing is deleted**, so there is no window in which
  two prescriptions exist for one day.

## 4 · Whether either athlete needs an override

**José: none.** Canonical fits him unmodified from W3.

**Hope: one, and it is already yours.** Her W15 has no Friday — five sessions
against José's six — because you ruled *W15 Friday: José 3, Hope off*. Canonical
prescribes 3. That difference is a coaching decision, not drift, and it should
survive the migration **as an explicit override with provenance** rather than
being quietly overwritten.

Everything else that currently separates them lives in W1–W2, which we do not
touch. From W3 they are identical to source.

## 5 · The ladder does not match, and this is a coaching decision

Their rungs are **1 · 2 · 5 · 6 · 8 · 10 · 13.1**. Canonical asks **5 · 6 · 8 ·
12** and deliberately drops 10 — because 10 and 12 could not both be asked with
absorption between them.

So one of these, and it is yours:

- **Replace 10 with 12** on both ladders — `moveCheckpoint` already has a
  `replace` decision and would record it with provenance.
- **Keep 10, unasked**, and add 12 — the ladder keeps a rung nothing tests.
- **Canonical adopts 10** instead of 12, and the block's closing ask changes.

Until this is settled the W12 ask has no rung to point at, so **this blocks the
migration.** It is the only thing that does.

## 6 · Order of work

1. Your ruling on §5 (the ladder) and §2 (the source block's holder).
2. `coaching_methods`, `coaching_method_versions`, three columns on
   `training_blocks`. Cheap, and useful even alone.
3. Author canonical v1 as the source block — 15 weeks, 90 sessions.
4. Assign: point both blocks at it, revise W3–W15 in place, withdraw the budget
   rows, record Hope's W15 override.
5. Re-point the 8 asks to canonical's weeks; resolve the fourth rung per §5.
6. Revision correctness — a revision that changes what a session tests must make
   the coach confirm `ASKS 8 MI → KEEP / CHANGE / REMOVE` rather than silently
   keeping a stale ask. **Still outstanding from the approved tranche.**

## 7 · What I would not do

- Copy canonical's rows into their blocks as new sessions. That is duplication
  wearing a migration's clothes.
- Touch W1–W2, any filed completion, any existing version, or any movement.
- Change their marks or checkpoints without §5 settled.
- Let the migration decide Marcus.

---

*Nothing written for this plan. The four items in §0 are applied and stand.*
