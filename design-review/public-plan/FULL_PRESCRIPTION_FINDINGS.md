# The approved composition, under the real fifteen weeks

The page now reads the canonical plan through `public_plan` and renders **the
complete prescription** in every cell — pace, recovery, warm-up, cool-down and
session total — rather than the notation it was designed around.

That was the point: put the real thing through and see where it breaks.

---

## What survived

- **No horizontal overflow at 1600.** The matrix is 1530 wide in a 1180 measure
  page; fifteen columns at 96px still fit.
- **The asks read exactly as intended.** `ASKS 5 MI`, `ASKS 6 MI`, `ASKS 8 MI`,
  `ASKS 12 MI` land in the four right cells and are the only lime in the grid.
- **The current-week column still works** at full density.
- **The grid is still a grid.** You can still read down a week and across a day.

## What broke

**1 · Easy running became the loudest thing on the page.**
`@ 8:45 or slower` appears in **66 of 120 cells**. A Monday now reads

    6 mi
    @ 8:45 or slower
    6 mi total

— three lines for one number, repeated 45 times. Easy running is supposed to be
unremarkable and it is now the most repeated element in the composition. The band
belongs in the pace key once, not in every cell that uses it.

**2 · The session total restates the head in 56 of 120 cells.**
Any single-component session says `6 mi` and then `6 mi total`. Duplication, not
information.

**3 · The row heights are now driven by the busiest cell in the row.**

| | height | max lines |
| --- | --- | --- |
| Mon · Wed · Fri | 87px | 2 |
| Tue | 121px | 3 |
| Thu | 134px | 3 |
| **Sat** | **150px** | 3 |
| Sun | 38px | — |

An easy Wednesday is 87px tall because of a line that says nothing. The week's
shape used to come through row rhythm; now the rhythm is an artifact of text
wrapping.

**4 · Two heads are misleading.**
- Thursday's strides render as `7 mi → 4 × 20 s`, which reads as a structured
  workout rather than an easy run with strides at the end.
- Saturday's long runs render as `13 mi → 3 mi` with a 16-mile total. The arrow
  is right and the numbers are not: it is one 16-mile run whose last 3 are at the
  band, not thirteen miles then three.

**5 · The matrix now dominates the page.** 816px of a 1563px page. The
methodology sections — the part that explains why any of this exists — are pushed
below two folds.

---

## What I would do about it, and what I have not done

The pattern in every one of those failures is the same: **the matrix is being
asked to be two things.** It is the fifteen-week argument, and it is now also the
execution detail for 105 sessions. Those want different densities.

The obvious move is the one Brice already floated — matrix keeps the notation,
selecting a session reveals its whole prescription:

    4 × 2 MI                    →    4 × 2 mi @ 6:30–6:45
                                     3 min float between
                                     WU 20 min · CD 10 min · 12 mi total
                                     Accumulate eight miles at the band
                                     without asking for continuous ownership.

That keeps the fifteen weeks legible **and** the plan complete, and it is the same
PLAN → WEEK → SESSION grammar Labs already uses.

Three smaller things are true regardless of that decision:

- the easy band belongs in the pace key, not in 66 cells
- `n mi total` should only appear when it differs from the head
- the strides and long-run heads need their own notation rather than the generic
  progression arrow

**Nothing above has been applied.** This state is the evidence, kept so the
decision is made against it rather than against a description of it. The
screenshot is `screenshots/full-15-weeks.png`.
