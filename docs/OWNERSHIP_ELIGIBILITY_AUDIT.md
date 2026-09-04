# Ownership eligibility — audit before change

4 September. **Nothing changed in production.** Report only, per the five
questions asked.

---

## 0 · First, a correction I owe you

**The two-sided-band guard never shipped.** I wrote it into the first attempt at
the evidence migration; that migration was refused by the append-only trigger, I
rewrote it inserts-only, and the view change went with the rewrite. The deployed
`athlete_continuous_owned` still reads:

    and p.pace_seconds <= coalesce(c.pace_high_seconds, 2147483647)

So the one-sided-ceiling hole is **open in production right now**. Ninety-four
components across José and Hope carry the `8:45 or slower` easy ceiling, and any
easy mile filed with a piece against one of them would register as continuous
distance owned. It has not bitten only because easy filings carry no pieces.

I fixed the same hole in `rungFor` on the client, and reported the view's version
as still open on the list — but I should have said plainly that the migration
carrying it was discarded. It is moot if the model below replaces the heuristic
entirely, which is why I am not patching it separately.

---

## 1 · Existing eligibility-related schema

| what exists | grain | populated | verdict |
|---|---|---|---|
| `planned_sessions.establishes_checkpoint_id` | session → checkpoint | **0 of 286** | Right idea, **wrong grain**. A long run is one session holding easy miles *and* a race-pace finish; only the finish can establish anything. Session-level cannot say that. |
| `mark_checkpoints.evidence_completion_id` | checkpoint → the filing that moved it | **0 of 28** | This is the *record of a movement*, not eligibility. Keep it; it is the other end of the chain. |
| `mark_gate_conditions` | mark | 4 rows | Conditions on a mark advancing. Not about which work counts. |
| `mark_signals` | mark | 0 rows | Empty. |
| `athlete_continuous_owned` | **athlete** | live | The bug. Groups by athlete off any two-sided band, with no relationship to what the athlete's experiment asks. |

**Nothing exists at component grain, and nothing connects a prescription to a
mark.** The chain you want — component → mark eligibility → evidence →
established value — is missing exactly one link.

---

## 2 · Proposed minimum change

**One nullable column. No enum, no heuristic, no new table.**

```sql
alter table public.planned_session_components
  add column counts_toward_mark_id uuid
    references public.athlete_marks(id) on delete set null;
```

Component grain, because that is the grain the truth lives at: W12's Saturday is
twelve easy miles and four at race pace in one session, and only the four can
establish anything.

Then `athlete_continuous_owned` is replaced by a **mark-scoped** view:

```
    established value for a mark
      = max(piece.distance)
        where piece.pace is inside the band of a component
          that is explicitly marked counts_toward_mark_id = this mark
```

No pace inference, no title matching, no shape rule, no program type. A
component counts because someone said it counts.

`establishes_checkpoint_id` stays and keeps its meaning — *this session is the
one aiming at that rung* — which is a coaching intention, not an eligibility
test. The two are complementary and neither replaces the other.

---

## 3 · Exactly what becomes eligible for José and Hope

Their mark is *continuous at race pace*, ladder `1 · 2 · 5 · 6 · 8 · 10 · 13.1`,
band `6:30–6:45`.

**Eligible: 24 components each, 48 total** — every current-version work component
at `6:30–6:45`, both shapes:

- 18 continuous each — the race-pace Tuesdays, the 8/10/12-mile continuous
  Saturdays, and the race-pace finishes inside long runs
- 6 repetitions each — `3 × 2 mi`, `2 × 4 mi`, `2 × 5 mi`, `4 × 6 min`, the
  Governor's 15 min, Pressure to Pace's `3 × 8 min`

Repetitions stay eligible on purpose. Each rep of `3 × 2 mi` **is** two
continuous miles, so it establishes 2 and never 6 — the frozen semantics are
unchanged by this and are enforced by the piece, not by the component.

**Not eligible, and deliberately:**

- **8 components at `6:25–6:30`** — faster than race pace. Threshold-side work
  does not establish race-pace durability by being quicker.
- **94 components at `8:45 or slower`** — the easy ceiling. This is the hole in §0,
  closed by construction rather than by another guard.

**Today's value is unaffected.** Both athletes' 2.00 comes from the 1 September
`3 × 2 mi` at `6:30–6:45` — José 6:37 · 6:41 · 6:35, Hope 6:38 · 6:39 — all
eligible. Their 25 August one-mile reps at `6:25–6:30` stop counting, and change
nothing, because 1.00 was never the maximum.

**8 September's `5 mi at race pace` is eligible**, so filed evidence inside the
band moves 2 → 5. That is the first rung and it still works.

**Marcus and Natalie: not inferred.** Marcus is *outdoor_goal_pace_miles* and
Natalie *longest_continuous_distance* — different instruments, audited
separately before anything of theirs is connected.

---

## 4 · Simon

| | |
|---|---|
| Loop test session | **stays**, cancelled, clearly named |
| Its filing — 4.35 mi, 33:30, RPE 7, track, his words | **stays** |
| Pieces — 6:06 · 6:02 | **stay** |
| Standing facts | **unchanged** |
| Continuous-distance mark | **none.** He has no mark and no checkpoints. |
| Continuous-distance owned | **none.** Nothing to point a component at. |

His threshold components can carry a band and count toward nothing, which is the
whole distinction: **measured** is that he ran an uninterrupted 1.66 miles at
6:02; **established** is nothing, because that piece was never authored as
evidence toward an active mark. Labs knows the first without claiming the second.

---

## 5 · Cancellation

**It currently participates, and it should not.** The view has no filter on
`planned_sessions.state`. Simon's two qualifying pieces sit on a session I
cancelled after the test and still produce his 1.66.

Proposed rule: **evidence stays valid; a cancelled prescription stops conferring
eligibility.** Eligibility is a property of what was asked, and a withdrawn ask
is not asking. The run happened and the filing is real — it simply establishes
nothing, the same as Simon's threshold work.

Changes nothing for José and Hope: every one of their qualifying pieces is on a
published session. Their four cancelled race-pace components carry no evidence.

---

## What I need

Approve §2 and I will migrate: add the column, connect José's and Hope's 48
components to their marks explicitly, rebuild the view mark-scoped with the
cancellation rule, and re-verify that both still read 2.00 and Simon reads
nothing. Marcus and Natalie stay untouched pending their own audit.
