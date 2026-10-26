# FORM Curated · Founding Miami network

**Owner:** Brice, FORM. **Status:** staged on feature branches; not deployed to the live schema or Apple app.

FORM is the logistical layer for excellent training. It places real gatherings beside an athlete's independent training calendar, without turning social attendance into prescribed work or completing a workout by RSVP.

## Founding host profiles

| Host | Editorial description | Scheduling rule |
| --- | --- | --- |
| FORM | Coached Thursday practice, occasional hosted long runs, Muscle Beach strength, yoga, social gatherings | Thursday is a practice; Saturday never implies a meetup until its occurrence is posted |
| iRUN | FORM-curated Monday morning runs Brice knows | Recurring rhythm shown in host profile; create dated runs only with verified time and meeting point |
| ALO Wellness | FORM-selected runs and wellness/fitness events | One-off or occasional dates only after Brice has confirmed the event |

These are **curatorial profiles managed by FORM**, not claims that iRUN or ALO operate official accounts inside FORM. Do not copy partner marks or import calendars without permission.

## Ownership and product contract

- Collective Runs is the one owner of an actual gathering's date, time, place, status, changes and attendance intentions. An event is a Collective Run with a curated-host link, not a second scheduling system.
- The new host table owns editorial host identity; event links associate a published run with host/category/cadence/optional verified end time; invitations own explicit per-athlete invitation and unread state.
- Prescribed training sessions and training plan versions are **never** changed by invitations or RSVP. An athlete may do the prescribed session, the curated event, both, or neither; only actual filings indicate exercise execution.
- On Week, a small accent circle beside the athlete name means at least one **unread invitation**. It is not a judgment about training status. Tapping the name opens My FORM, where the invitation is prominent.
- The Dossier has an **Upcoming events** door under its plan/race orientation. A separate **This week** section shows events the athlete has joined. Tapping one opens its dated detail.
- The upcoming list groups real dated events beneath the three host profiles. Labels distinguish **Weekly / Occasional / One time**. A weekly cadence is descriptive, never proof that every future date is hosted.
- A joined event appears **as an additional row** on the dated Week. The original workout remains visible and fileable.
- RSVP shows **I'm in / You're in**; the existing Collective attendee list owns names and counts. Membership/identity gates remain. An invitation is not an RSVP; an RSVP is not witnessed attendance.
- Google Calendar and Apple Calendar choices are offered only when the event has both verified start and end times. iOS shares a standard .ics file through the system share sheet, without accessing the user's calendar or requiring Calendar permission.

## Coach flow

1. Publish a dated FORM-owned Collective Run from the existing coach Run editor. Do not publish an invented Saturday or unsupplied third-party schedule.
2. Link the existing Run to form / irun / alo using the coach-only curated linking function, supplying category, cadence and optional verified end time/source URL.
3. Preview the intended audience, then explicitly invite named athletes via the coach-only curated invitation function. The unique run-and-athlete key prevents duplicate invitations.
4. Athletes read events, mark invitations seen, and RSVP; joining inserts only their existing Collective Run intention.
5. A cancellation or time/place update remains a Collective run change and is projected to event detail. It does not rewrite training or claim attendance.

**Next operator convenience:** add a focused /coach/curated/ editor so Brice can link runs and choose recipients from the dashboard without SQL. In the first pass the existing coach Run editor provides occurrence authoring; linking/inviting is behind coach-restricted RPCs.

## Release truth and proof

- Additive SQL rehearsed in one transaction and **rolled back** against the existing FORM Athlete System schema. Three founding host rows and a signed-out empty response were verified inside the rollback.
- The source is proposed on a branch, not applied to production. No invitation has been sent. No iRUN or ALO event date, venue or time has been guessed.
- Native implementation uses the existing signed-in FORM coaching RPC. The feature stays hidden on an old backend if the new RPC does not exist; no local fixture can create fake upcoming events.
- Native Swift compiles and device QA require the existing Mac/Xcode release lane. The current workspace has no Xcode/Swift compiler; do not equate source review or a PR with Apple distribution.
- Before release: run security advisors, verify anon cannot read private invite rows or call RPC, verify athlete A cannot read/mark athlete B's invitation, coach membership gate, duplicate invitations, cancellation and date changes, no RSVP without Collective membership, account switch clears state, accepted events stay separate from Sessions/Filings, day/time timezone behavior through DST, Google URL and ICS import, Dynamic Type / VoiceOver / dark mode, signed-in physical iPhone Week/Dossier, and no regression to existing Thursday/Plan/Filing.

## Missing event facts (do not infer)

- iRUN Monday precise meet/start/end time, meeting address, and whether Brice is curating a recurring series or issuing each occurrence.
- ALO event schedule, locations, confirmed event descriptions, links and duration.
- Muscle Beach, yoga and social dates and who hosts them.

These are content inputs, not blockers to the shared schema or client wiring.
