# FORM Labs — the open list

The single place. Not the chat. Brice edits, Code re-reads at the start of a
session. Updated 4 September.

---

## Waiting on Brice

- **Simon's sessions.** He is entered and real in production: coach-delivered,
  eight weeks to HYROX Nashville (Dec 9), all eight weeks generated, block named
  *Threshold cycle*. **The weeks are empty.** Send the cycle
  (2 × 10 → 2 × 12 → 2 × 15 → 25 min at 6:00–6:08) and it gets authored. His
  threshold experiment is a duration question, not a distance one — do not put
  him on the continuous-distance ladder.
- **José: Full or Half.** The Sep 1 handoff says Orlando *Full* Marathon; the
  database and everything else say OUC Half. Same date. Unresolved.
- **Rod and Devin.** Waiting on the strength evidence grammar, not on a build.
- **Where the threshold cell lives.** ≈6:15 is real and intentional for both
  athletes, and no component in either block prescribes it — the number exists
  only in the reference mock. `training_blocks.purpose` is an enum, so there is
  nowhere to author it. Same question as the pace bands below.
- **Pace bands as a block-level fact.** `6:30–6:45` is repeated on 54 components
  per athlete; changing race pace means editing all 54. Brice's own note: it
  belongs on the block once and gets inherited.
- **Ownership eligibility.** `athlete_continuous_owned` counts any segment inside
  "the band its prescription asked for", and the weekly easy budget carries a
  one-sided `8:45 or slower`. Nothing exploits it today because easy filings
  carry no pieces, but the guard is missing. A two-sided-band test is a decent
  temporary fix and must not become doctrine — the robust model is explicit
  eligibility on the prescription (`counts_toward_mark`, or the existing
  `establishes_checkpoint_id` direction), not guessing from whether both pace
  numbers happen to be non-null. Brice's call.
- **Is Marcus running Race Pace Durability?** See
  `docs/FORM_LABS_METHOD_OBJECT.md`.

## Next to build

1. **File evidence.** Promoted to second verb after Read. For a coach-delivered
   athlete it is the only path evidence has — not a bridge to ingest any more.
2. **Cell click → session in place.** The matrix should open a drawer over the
   block rather than navigating away: prescription, evidence, athlete report,
   revise. The block stays visible behind it.
3. **Standing observations on the surfaces.** `athlete_observations` exists and
   nothing reads or writes it yet. WHAT HELPS on the athlete page; WHAT I'M
   SEEING for Rod and Devin. Same object.
4. **Note to self**, wired to `coach_private_notes`, per athlete.
5. **Week view** — the coming seven days per athlete, reachable in one click.

**Recorded, not scheduled:** the method object. Hope's and José's blocks are the
first two applications of a coaching method now named **Race Pace Durability**,
which is the thing that may eventually be sold. The block is an instance; the
method never rewrites an athlete; promotion is explicit and one-directional.
Concept, four laws, minimum schema and what not to build are in
`docs/FORM_LABS_METHOD_OBJECT.md`.

## Settled 4 September — the mileage model

`prescribed_distance` is the **expected total session distance**. The components
describe the work inside it. A `6 mi at race pace` work component lives inside a
9.4-mile session.

- Warm-ups, cool-downs and running recoveries are real running and count toward
  the week. A `jog`, `float` or `easy` recovery is running; a `standing` one is not.
- **TOTAL** is every mile the week asks for. **EASY** is standalone easy sessions
  only — a warm-up belongs to its quality session and never to EASY.
- The weekly `Across the week` budget rows survive as **historical/audit context
  only**. They stop being counted the moment a week authors its days.

Both athlete blocks now carry **fully authored daily running, W3–W13**, on one
canonical rhythm:

    MON easy · TUE quality · WED easy · THU support-quality · FRI easy · SAT long/specific · SUN rest

    TOTAL   43 · 48 · 54 · 50 · 39 · 46 · 52 · 53 · 48 · 58 · 50
    EASY    21 · 22 · 23 · 24 · 23 · 24 · 25 · 26 · 24 · 30 · 26

W7 is the cutback, made by withdrawing structured load rather than gutting the
aerobic base. **W12 is the aerobic peak** — a 16-mile Saturday, 58.4 total.
Hope and José share the architecture exactly.

**W14 and W15 are deliberately unresolved.** The taper and race week are a
coaching decision, not a mileage one.

**None of this is promoted to the method.** These mileages are evidence from the
first two applications of Race Pace Durability, not doctrine. José's `10/8/8`,
the 16-mile W12 and the rest become part of the method when Brice decides they
generalise — through `PROMOTE TO METHOD`, never by being live. See
`docs/FORM_LABS_METHOD_OBJECT.md`.

## Frozen semantics

Two quantities that kept collapsing into one. They are different questions and a
completed `3 × 2 mi` answers both differently:

- **RACE-PACE VOLUME** — the sum of qualifying work. `3 × 2 mi` is **6 mi**.
- **CONTINUOUS DISTANCE OWNED** — the longest **single** uninterrupted
  qualifying segment. `3 × 2 mi` is **2 mi**, and can never be 6.

A segment qualifies when it is one filed piece, carrying a distance, whose **own
pace** falls inside the band its prescription asked for. Per segment, never per
workout average — Hope's third rep came back at 6:59 against a 6:30–6:45 band and
she still owns two miles, because her first two qualify on their own.

`CONTINUOUS DISTANCE OWNED` is the canonical name. UI copy may wrap; it may not
rename the concept. The caption was shortened to `MI AT RACE PACE` once and the
word it dropped was the one carrying the distinction.

**Derived, as of `athlete_continuous_owned`.** Labs reads the view.
`athlete_marks.current_value` is a stored copy that drifts and is no longer what
any surface shows.

## Settled, do not relitigate

- Labs is where you coach; the Console is where you build a block.
- An athlete is not an app user. `delivery` says which.
- Blank means unchanged. Silence beats filler.
- A signal whose quiet means two different things is not a signal.
- RLS answers "what may I read", never "who am I".
- Lime marks work that moves what an athlete owns, nothing else.
- The easy budget is a budget, not a schedule. It has no day.

## Known gaps, not scheduled

- **`is_key` currently means "has a day"**, which is true today and will need
  saying explicitly the moment a dated session is genuinely optional.
- **Rungs are inferred**, not read. `establishes_checkpoint_id` exists and is
  unpopulated; Labs derives rung-ness from continuous-at-band matching an
  unreached checkpoint.
- **Sixteen tables no surface can write.** `docs/SCHEMA_AHEAD_OF_SURFACES_AUDIT.md`
  has the ordered list. Three were closed on 3–4 September (portraits, marks,
  athletes/blocks/weeks).
- **Facts that arrived without provenance.** Marcus's rungs and both ladders were
  set by migration with no ledger row. Worth one sweep: which rows claim a state
  with no corresponding movement or judgment behind them.
- **Do not let the ladder rewrite the plan.** It happened once, on 4 September:
  `current_value` was set to 6.1 for José from race-pace VOLUME across broken
  work, which made his authored 5-mile continuous look like ground he had
  already covered. Broken work carries volume; continuous work establishes
  continuous distance. The plan authors the progression, the ladder reports
  evidence, and the two are never the same statement.
- **Owned is the longest CONTINUOUS piece held in band.** Not the sum of broken
  work, and not the shortest rep. Each rep of 3 × 2 mi is two continuous miles,
  so 3 × 2 owns two.

## The gates

- **Gate A walk** — never done. Both switches are on and the fixture is
  deactivated; rebuilding it is one command.
- **Build 41** — unshipped. Until it lands, José's phone shows the app's own
  plan, not yours.
