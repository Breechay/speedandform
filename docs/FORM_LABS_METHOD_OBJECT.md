# The method is not the plan

Recorded 4 September. **Concept only — nothing here is built.** Brice asked for
the idea preserved and the minimum schema determined, explicitly without
"prematurely building a giant template system."

## What this is

Hope and José are not running two plans. They are the first two applications of
one coaching method, which now has a name:

> **RACE PACE DURABILITY** — how much race pace can you carry before it comes
> apart?

Their blocks were renamed on 4 September. The rename named what the progression
already was; no session, week, component or mark changed.

The method is the thing that might eventually be sold. The blocks are not.

    LIVE ATHLETE PLAN → LESSON → METHOD VERSION → PUBLISHED PRODUCT

## The four laws

1. **The block is an instance, never the method.** A change to Hope's Saturday is
   a coaching decision about Hope. It does not touch Race Pace Durability.
2. **The method never rewrites an athlete.** Cutting v0.4 changes nothing that
   was authored under v0.3. A block carries its method version as provenance and
   nothing reads back down that link.
3. **Promotion is explicit and one-directional.** Athlete observation → lesson →
   the next version. There is no sync in either direction and there is no
   automatic anything. `PROMOTE TO METHOD` is a button a coach presses.
4. **Filed history stays frozen.** Versions are append-only, the same as every
   other ledger here.

## Minimum schema

Four objects and two columns. The cheap half is the last two columns, and they
are worth adding on their own even if nothing else is built, because they record
which athletes are running which method — which is the fact Labs cannot answer
today.

```
coaching_methods
  id, slug, name, status, question, for_whom, authored_by, created_at, updated_at
    status ∈ ('in_development','validated','published','retired')
    question  — "How far can you carry race pace before it comes apart?"
    for_whom  — the athlete and the problem it is for

coaching_method_versions              -- append-only
  id, method_id, version_number, cut_at, cut_by, summary
    summary — the distilled method AS PROSE in v0. See "what not to build".

method_lessons                        -- append-only
  id, method_id, athlete_id, block_id, observation_id, body,
  promoted_at, promoted_by, into_version_id
    into_version_id is null until a cut incorporates it. That null is the
    pending pile, and it is the whole feature.

training_blocks.method_id             -- one column: this block is an instance
training_blocks.method_version_id     -- provenance only, never read back down
```

`PROMOTE TO METHOD` writes exactly one `method_lessons` row. It touches no
session, no block and no published version.

## What not to build

**The canonical week and session structure as typed data.** The moment the
method stores its own weeks and components you have a second authoring system,
with its own revision problem, sitting next to the Console. In v0 the structure
lives as prose on the version, and the worked example is José's and Hope's actual
blocks — which are already typed, already real, and already linked by
`method_id`.

Build the typed template when there is a second cut and a concrete reason, not
before.

**A storefront, pricing, or anything athlete-facing.** Not in scope. Labs is
preserving a working method that may become a product.

## What the two live blocks now hold — and why it is not the method

As of 4 September both blocks carry fully authored daily running for W3–W13 on
the canonical rhythm, with totals `43 · 48 · 54 · 50 · 39 · 46 · 52 · 53 · 48 ·
58 · 50` over an easy curve of `21 · 22 · 23 · 24 · 23 · 24 · 25 · 26 · 24 · 30
· 26`.

**That is an implementation, not the method.** The weekly rhythm is almost
certainly method-level. The mileages are almost certainly not — they are where
Hope and José are in September 2026, and a second athlete entering Race Pace
Durability at 30 miles a week would need a different tier of the same argument.

Nothing here is promoted by being live. Law 3 holds: promotion is explicit,
one-directional, and a button a coach presses.

## Open questions for Brice

- **Is Marcus a third application?** Same goal, same 6:30–6:45 band, mark asking
  the same question with an outdoor qualifier, 16 weeks to West Palm Beach. His
  block was deliberately left named *Half build* — renaming him is a coaching
  judgment, not a migration's call.
- **The subline has no home.** *Hold the pace. Lower the cost. Extend the
  distance.* `training_blocks` has `name`, `goal_label`, `goal_statement` and an
  enum `purpose`. Nowhere for a method line. One text column, whenever it matters.
