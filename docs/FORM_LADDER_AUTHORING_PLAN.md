# The ladder changes — the final list

Settled 2 September. **Nothing has been authored.** The gate is one signed-in
load of the bench.

Hope and José are identical in every week checked. Every operation below is done
twice, once each: **nine edits per athlete, eighteen in total.**

---

## What was corrected on the way here

**Long-run distance is the first component plus the race-pace finish.** Reading
only the first component under-reports every long run in the block by two to
three miles. Those Sundays were never 9 and 11; they were 7 + 2 and 9 + 2. Every
long run already finishes at race pace, so extending that is a change of degree,
not a new pattern.

**W6 has no five-mile continuous.** It has The Governor — fifteen minutes at band
inside a session about choosing the opening gear. The rung never went backwards
from 7 to 5; that reading came from counting The Governor as a rung.

**W9 has two banded continuous runs**, 4 mi on the Tuesday and 9 mi on the Sunday.

**The rung stops being a long run once the ramp passes it.** A twelve-mile
continuous run at 6:30–6:45 four weeks out is a harder and more specific session
than a sixteen-mile easy run with a race-pace finish, and it is the one that
establishes the race. Running both spends recovery on something the rung already
delivers. So the ramp stops at W7, and from W8 the rung is the long run.

---

## The ladder

**6, 7, 8, 10, 12** across W4, W5, W8, W9, W11. No week carries both a rung and a
long run.

| Week | Operation | Session |
|---|---|---|
| W4 | **6 mi** continuous @ 6:30–6:45, replacing the easy run | Tue Sep 15 |
| W5 | leave at 7 | Tue Sep 22 |
| W8 | **7 → 8 mi** | Sun Oct 18 |
| W9 | **9 → 10 mi** | Sun Oct 25 |
| W11 | **10 → 12 mi** | Sun Nov 8 |

## The long runs

Ramp stops at W7. Each is a distance change on the **first** component only; the
race-pace finish segment is left exactly as it is.

| Week | Total | First component | Finish |
|---|---|---|---|
| W3 | 9, leave | 7 | + 2 @ band |
| W4 | 11, leave | 9 | + 2 @ band |
| W5 | 11 → **13** | 9 → **11** | + 2 @ band |
| W6 | 12 → **14** | 10 → **12** | + 2 @ band |
| W7 | 7, leave — the down week | 7 | none |
| W10 | 13 → **15** | 10 → **12** | + 3 @ band |

Longest run 15 at W10. Longest continuous at pace 12 at W11.

---

## How each one is written

Seven of the nine are revisions through the session dialog: open the session,
change one number on one component, give the reason. The anatomy editor rewrites
components only when it is touched, so nothing else in the session moves.

**W8 is a revision, not a new session.** The instruction was to take the Sunday
that the cancelled 7-mile rung vacates. Revising 7 → 8 on that same session is
one edit and keeps the session's identity and its whole version history, which is
what `planned_sessions` is for — a session is a stable identity and what it asks
for is a numbered version. Cancelling one session to author another in its place
would throw away the history to arrive at the same Sunday.

**W4 is the only one that is not obvious**, and it needs a decision:

The instruction is to replace Tuesday's easy run rather than author a double.
Two ways, and they are different claims about what happened:

- **Revise it.** Tue Sep 15 stays one session and its version 2 says 6 mi at race
  pace instead of Easy week 6 mi. The history reads: this Tuesday changed from an
  easy run to a rung, with a reason. One edit, no new primitive.
- **Cancel and author.** Two sessions on the record, one cancelled, one new. It
  says the easy run was withdrawn and something else put in its place.

**Revising is recommended**, and there is a second reason: **nothing in any
surface can cancel a session.** `planned_sessions.state` has `'cancelled'` and
Labs renders it — the block draws the 2 × 4 and the 2 × 5 struck through — but no
form, function or RPC writes that state. The two cancelled sessions in this block
could only have been set by SQL. That is the same family of gap the component
editor just closed, and it is worth closing on its own account rather than
because this plan tripped over it.

---

## The eighteen operations

Per athlete, in the order they would be done:

1. W4 Tue Sep 15 — revise Easy week → **6 mi at race pace**, one continuous work
   component, 6 mi, band 6:30–6:45
2. W5 Sun Sep 27 — long run first component 9 → **11**
3. W6 Sun Oct 4 — long run first component 10 → **12**
4. W8 Sun Oct 18 — rung 7 → **8**
5. W9 Sun Oct 25 — rung 9 → **10**
6. W10 Sun Nov 1 — long run first component 10 → **12**
7. W11 Sun Nov 8 — rung 10 → **12**

Seven per athlete, fourteen in total — not nine and eighteen. W5 needs no ladder
edit and W4 needs no long-run edit, so two of the nine cancel out.

Every one of them carries a change reason. None of them touches a filed session.
