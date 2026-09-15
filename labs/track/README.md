# FORM TRACK

Public Track room at `/labs/track/`, **live since September 15, 2026** (main `29d90b3`). Static page, no scripts, no stored records, no athlete data.

It is live with the 800 m question below still open. Brice authorized that.

Sections: the room (seven relationships), standards, threshold ladder, time trials, how a mark reads, and the Track to Plan to Coaching ladder. Entry points are the Labs index and the HYROX page footer.

## Sources

Session sheets come from the authored `TRACK WORKOUTS.pdf` (six pages, one standard per page). Room states, section names, threshold rungs, time-trial list and the four ladder principles come from `FORM_App_Track_Ecosystem_Study_v2.html`.

Each set publishes the authored per-rep target time and the authored pace band in both units, per mile and per kilometer, because athletes enter the pace into a watch and some use miles while others use kilometers. The pace bands are Brice's own, transcribed from the sheets, not derived from the target. They are deliberately tighter than the target range implies, which is what makes them usable as a single number to enter.

## Open items

- **800 m, both sheets that carry one.** The authored pace band implies about 3:01 to 3:06 for the rep, while the authored target says 2:25 to 2:30 (Nice and Easy) and 2:25 to 2:35 (Death). Those are two different reps, not a rounding slip. Under the sheet's pace the 800 is an easy float between fast work; under the target it is the hardest rep on the sheet. `track.test.cjs` names this as an explicit exception rather than hiding it behind loose tolerance, and fails if the two ever reconcile without the exception being removed. **Brice to rule.** The other 24 sets are proven consistent: every pace band, applied to its rep distance, lands within 3 seconds or 5 percent of its target.
- Scored rep counts are arithmetic on the sheets: Nice and Easy 6, Pyramid Intervals 9, Gauntlet 12, Speed Demons 18, Death 12, Resurrection 15. The ecosystem study shows Pyramid Intervals out of 9, Gauntlet out of 12 and Speed Demons out of 18, which agree. It shows Nice and Easy out of 9, which does not. Brice to confirm.
- The standard named Death here is named The Long One in the iOS Speed Emergence arc, with the same shape. One name needs to win.
- Threshold rungs and the time-trial list are named only. No target paces or protocols are published for them yet.
- Possible follow-up: a miles/kilometers toggle so a reader sees only the unit their watch uses. Both are shown for now, which needs no script and survives print.

Run `node labs/track/track.test.cjs`. Static validation covers fragment destinations, unique section ids, each standard's stated rep count against the sets above it, that every set carries both pace units, that each pace band is consistent with its own rep target and with the other unit, the absence of any athlete name other than the coach, house style, and registration in the sitemap and Labs index.

Status and remaining gates are owned by `docs/roadmap/FORM-ROADMAP.md`.
