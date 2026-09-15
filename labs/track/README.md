# FORM TRACK

Public Track room at `/labs/track/`, live since September 15, 2026. Static page, no scripts, no stored records, no athlete data.

Sections: the plan (seven relationships), standards, threshold ladder, time trials, how a mark reads, and the Track to Plan to Coaching ladder. Entry points are the Labs index and the HYROX page footer.

## Sources and authority

The authority for Track content is `FORM_TRACK_MASTER_BRIEF_v1.md` (v1, 2026-09-08), which supersedes `FORM_App_Track_Ecosystem_Study_v2.html`. The study is a design study; the brief is the product and evidence source of truth. The first version of this page was built from the study, which is how it shipped with the study's voice and two of its content errors. Read the brief before editing content here.

All 26 sets on this page were verified set by set against brief section 6 and match exactly: reps, distance and target for every set of all six standards.

## Provenance: the standards are named after athletes

Brief section 6.1, verified against `TRACK WORKOUTS.pdf`. Each standard is named for the athlete it was built on or around.

| standard | athlete |
|---|---|
| Nice and Easy | Bobby |
| Pyramid Intervals | Tinius |
| Gauntlet | Sam |
| Speed Demons | Erik |
| Death | Breechay |
| Resurrection | Brice |

The brief is explicit that this should not stay dropped: it answers *where did these come from* for a first-time athlete and is the difference between a curated room and a generated one. It is equally explicit that whether attribution is surfaced on the standard or held one layer in is a design decision, not a data one, **but the data must survive**. That is what this section is for.

It is held one layer in, here, because publishing a real athlete's name on a public page is Brice's call and not a default an agent should take on its own. `track.test.cjs` fails if any of those names appears in `index.html`.

**Open for Brice:** surface it, which costs one line per card, or leave it held.

## Pace bands

Every set publishes the authored per-rep target plus a pace band in both units, per mile and per kilometer, because athletes enter the pace into a watch and some use miles while others use kilometers (Brice, September 15, 2026).

This is compatible with brief section 6.2, which says the derived equivalents must never become the thing the athlete is scored against: an absolute rep-time standard stays an absolute rep time. On the page the rep time is the primary number and the band is described as a reading aid you are not scored on.

Bands are Brice's own, transcribed from the sheets, and are deliberately tighter than the raw target range implies, which is what makes them enterable as one figure. **Three were corrected** to follow their own rep target, because under 6.2 the rep time is the standard and a derived equivalent that contradicts it is a bad derivation rather than a second opinion.

| set | sheet printed | published | why |
|---|---|---|---|
| 800 m, Nice and Easy | 6:05 to 6:15 /mi | 4:52 to 5:02 /mi | the sheet's band implies a 3:01 to 3:06 rep against a 2:25 to 2:30 target |
| 800 m, Death | 6:05 to 6:25 /mi | 4:52 to 5:12 /mi | the same, against a 2:25 to 2:35 target |
| 150 m, Gauntlet | 4:15 to 4:25 /mi | 3:35 to 3:56 /mi | the sheet's band is slower per mile than the 200 m target, which contradicts Gauntlet descending 600 to 150 |

`track.test.cjs` applies every band to its rep distance and requires the result within 3 seconds or 5 percent of the target. All 26 reconcile and no exception remains in the check.

## What is built and what is intent

The page is part authored work and part design intent, and the difference has to stay visible. The standards, threshold rungs, time trials and pace bands exist and can be run today. The seven relationships in section 01 and the record described in section 05 are not built.

The first live version wrote the intent in the present tense and so promised features the app does not have, including a sign-in that saves marks. `track.test.cjs` now fails on those specific claims and requires the intent sections to say they are unshipped. Keep it that way when editing copy.

## Open items

- **Athlete attribution.** Surface it or keep it held. Brice's call.
- **Death versus The Long One.** The brief calls this standard Death. The iOS Speed Emergence arc calls its own session The Long One for the identical shape. The brief is the authority for Track, so the page says Death, but two surfaces disagree and one name should win.
- Threshold rungs and the time-trial list are named only. No target paces or protocols are published for them yet.
- Possible follow-up: a miles and kilometers toggle so a reader sees only the unit their watch uses. Both are shown for now, which needs no script and survives print.

## Settled, do not reopen

- **The Nice and Easy denominator is 6.** Its sets sum to 6 and the brief agrees. The ecosystem study's "9 / 9" was mockup filler, and the preserved memory note had already verified all six denominators against the source PDF. This was raised as a question for Brice in error.
- **The 800 m target is 2:25 to 2:30**, and 2:25 to 2:35 on Death. The rep time is the standard under brief 6.2 and the sheet's printed pace was a bad derivation. Also raised as a question for Brice in error.
- **Time trials are four.** Yasso 800s is an authored session with its own evidence, not a trial, per brief section 6.
- **The threshold ladder ends 25 continuous, then 3 by 10.** Brice confirmed. First extend the uninterrupted hold, then add total volume.
- **Faster than the target is outside the standard.** Brief section 7, with its own worked example on a 300 m standard of 50 to 52: 51.1 is inside, 54.0 is outside, 47.8 is outside.

## Tests

Run `node labs/track/track.test.cjs`. Static validation covers fragment destinations, unique section ids, each standard's stated rep count against its sets, that every set carries both pace units, that each pace band reconciles with its own rep target and with the other unit, the four-trial count, the faster-is-also-outside rule, the authored-recovery condition on ESTABLISHED, the core law, the threshold ordering claim, the absence of capability the app does not have, the absence of any athlete name other than the coach, house style, and registration in the sitemap and Labs index.

Status and remaining gates are owned by `docs/roadmap/FORM-ROADMAP.md`.
