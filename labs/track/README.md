# FORM TRACK

Public Track room at `/labs/track/`. Static page, no scripts, no stored records, no athlete data.

Sections: the room (seven relationships), standards, threshold ladder, time trials, how a mark reads, and the Track to Plan to Coaching ladder. Entry points are the Labs index and the HYROX page footer.

## Sources

Session sheets come from the authored `TRACK WORKOUTS.pdf` (six pages, one standard per page). Room states, section names, threshold rungs, time-trial list and the four ladder principles come from `FORM_App_Track_Ecosystem_Study_v2.html`.

Per-rep target times are published. Per-mile and per-kilometer conversions in the source sheets are not published: the 800 m and 150 m conversion lines do not reconcile with their own rep targets, and a rep target is not a race pace. See the open items below.

## Open items

- The source sheets carry per-mile and per-kilometer lines for each set. Those for 800 m (2:25 to 2:30 shown as 6:05 to 6:15 per mile) and 150 m (20 to 22 sec shown as 4:15 to 4:25 per mile) do not follow from the rep target. Brice to confirm intent before any pace column is published.
- Scored rep counts on this page are arithmetic on the sheets: Nice and Easy 6, Pyramid Intervals 9, Gauntlet 12, Speed Demons 18, Death 12, Resurrection 15. The ecosystem study shows Pyramid Intervals out of 9, Gauntlet out of 12 and Speed Demons out of 18, which agree. It shows Nice and Easy out of 9, which does not. Brice to confirm.
- The standard named Death here is named The Long One in the iOS Speed Emergence arc, with the same shape. One name needs to win.
- Threshold rung values and time-trial list are named only. No target paces or protocols are published for them yet.

Run `node labs/track/track.test.cjs`. Static validation covers fragment destinations, unique section ids, each standard's stated rep count against the sets above it, the absence of a published pace conversion, the absence of any athlete name other than the coach, house style, and registration in the sitemap and Labs index.

Status and remaining gates are owned by `docs/roadmap/FORM-ROADMAP.md`.
