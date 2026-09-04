# FORM Labs — the open list

The single place. Not the chat. Brice edits, Code re-reads at the start of a
session. Rewritten 4 September, after Tranche C and the ownership-eligibility
fix closed. Everything resolved has been removed rather than struck through;
the archaeology lives in git.

---

## BLOCKING

Three things, and only the first two stop work.

- **Simon's cycle.** He is real in production — coach-delivered, eight weeks to
  HYROX Nashville, all eight weeks generated, a portrait, two standing facts, and
  **zero sessions**. Send the cycle (2 × 10 → 2 × 12 → 2 × 15 → 25 min at
  6:00–6:08) and it gets authored. His experiment is a duration question; he must
  not land on the continuous-distance ladder.
- **W14 and W15.** The taper and race week are unauthored for José and Hope. W14
  has no Saturday and W15 is entirely empty — the block currently stops three
  weeks out and the race is not in it. A coaching decision, and the next thing to
  do inside Labs rather than to Labs.
- **José: Full or Half.** The 1 September handoff says Orlando *Full*; the
  database and everything since say OUC Half, same date. Unresolved, and it has
  been unresolved for four days.

## SHOULD DO

- **Build 41.** The wiring is complete and the server is green — feed filtered,
  both switches on, all 66 easy days published. Until 41 ships, José's phone
  still runs the app's own plan. `docs/BUILD_41_ACCEPTANCE.md` is the eight-item
  physical-device pass; item 4 is the one likely to need UI work, because
  `prescribed_distance` changed meaning and a Tuesday now reads 10.4 where it
  read 7.
- **Netlify.** Paused on the usage limit. No functions exist; the cost is
  `no-store` on `/*` over 11 MB of assets and three MP4s, `publish = "."`
  shipping 115 MB per deploy, and 29 pushes in a day. `docs/NETLIFY_USAGE_AUDIT.md`
  has the three cheap fixes. Nothing is urgent while development is local.
- **Note to self** — `coach_private_notes` exists, the panel exists, nothing is
  wired.
- **Week view** — the coming seven days per athlete, one click.
- **Marcus and Natalie have no instrument audit.** Neither is connected to an
  eligibility model, deliberately. Marcus is `outdoor_goal_pace_miles` with no
  established value; Natalie is `longest_continuous_distance` at 3. Their marks
  need the same deliberate connection José's and Hope's just got.
- **Marcus and Natalie have no portrait.** Two of five plates on the bench.
- **Is Marcus running Race Pace Durability?** Same goal, same band, a mark asking
  the same question with an outdoor qualifier. A coaching judgment, not a rename.

## LATER

- **Rod and Devin.** Waiting on the strength evidence grammar. `athlete_observations`
  is already the object — WHAT HELPS and WHAT I'M SEEING are the same thing.
- **The method object.** Race Pace Durability as a reusable, eventually sellable
  method, with `PROMOTE TO METHOD` as the only way anything gets there.
  `docs/FORM_LABS_METHOD_OBJECT.md` — concept and minimum schema, built nowhere.
- **`is_key` means "has a day"**, which is true today and will need saying out
  loud the first time a dated session is genuinely optional.
- **Rungs are still inferred** from continuous-at-band matching an unreached
  checkpoint. `establishes_checkpoint_id` is set on 0 of 286 sessions and is the
  real answer. Now that eligibility is explicit, this is the smaller remaining
  inference.
- **Facts that arrived without provenance.** Marcus's rungs and both ladders were
  set by migration with no ledger row. One sweep, whenever.
- **Six prescriptions revised after their filing** — the August RPE and band
  backfills. Not repaired, by decision. The inspector says
  `PRESCRIPTION REVISED AFTER FILING`, and the Revise guard stops it happening again.
- **`actual_distance` means two things** — the whole session on some rows, the
  work only on others. Two rows are null despite carrying full splits. Any weekly
  filed total is wrong until it is one convention; the fix is `correct_session`
  with a reason, per row.
- **Threshold has a home now** (`block_pace_bands`) but no session prescribes it.
  If threshold work is ever authored, it must not be connected to the
  continuous-distance mark.
- **Sixteen tables no surface can write.** `docs/SCHEMA_AHEAD_OF_SURFACES_AUDIT.md`.
  Six have been closed since it was written.

---

## CANON — do not relitigate

**Ownership.** Six laws, settled 4 September:

1. The prescription **component** declares eligibility — `counts_toward_mark_id`.
2. **Filed evidence** determines establishment.
3. **Continuous ownership** is the longest single uninterrupted qualifying piece.
   `3 × 2 mi` establishes 2 and never 6.
4. A **cancelled** prescription cannot establish. Its evidence remains historical
   fact.
5. A **revision inherits** eligibility unless the coach deliberately changes what
   the prescription tests.
6. **Pace alone never determines** what an athlete has established.

MEASURED and ESTABLISHED are different claims. Simon ran an uninterrupted 1.66
miles at 6:02: measured, on the record, establishing nothing, because no
component of his points at a continuous-distance mark.

`mark_established_value` is **not to be generalised further**. It answers
continuous-distance ownership correctly. When Simon gets a duration instrument
or Natalie's is audited, define how *that* mark establishes value — do not make
this view prematurely universal.

**The mileage model.** `prescribed_distance` is the whole session; components are
the work inside it. Warm-ups, cool-downs and running recoveries are real running
and count toward the week; a `standing` recovery does not. **TOTAL** is every mile
the week asks for, **EASY** is standalone easy sessions only. The `Across the
week` budget rows are historical audit context and stop counting the moment a
week authors its days.

**The week.** MON easy · TUE quality · WED easy · THU support · FRI easy ·
SAT long/specific · SUN rest — for José and Hope. Natalie has Sunday work, and
that is correct: the calendar grammar is per athlete and per block, not a FORM law.

**Other standing rules.** Labs is where you coach; the Console is where you build
a block. An athlete is not an app user — `delivery` says which. Blank means
unchanged. Silence beats filler. A signal whose quiet means two different things
is not a signal. Never `unsafe-inline` on `/coach/*`; geometry goes through
`element.style.setProperty` after render. What is live is evidence, not doctrine:
nothing is promoted to the method by being in production.
