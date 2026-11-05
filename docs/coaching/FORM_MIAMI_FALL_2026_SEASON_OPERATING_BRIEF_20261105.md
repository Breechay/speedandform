# FORM Miami · Fall 2026 | season operating brief

**Design status:** November 5, 2026. Coach-facing proposal, not a live season assignment or permission to publish athlete data.
**Owning sources:** FORM Athlete System for plans and completions; the Athletic Life north star and `the-athletic-life/research/sources/the-season.md` for experience hypotheses; Method Bible for coaching; `docs/coaching/THE_FIVE_MIAMI_WEEKEND_15_WEEK_20261023.md` for the documented 15-week spine, superseded by the latest live session versions wherever they differ.

## Decision to adopt

**Display name:** FORM Miami · Fall 2026  
**Internal season key proposal:** `form-miami-fall-2026`  
**Dates:** October 19, 2026 – January 31, 2027 (15 FORM weeks). Season names follow the entry/start period; dates remain visible because the season continues into winter. The Miami weekend is a seasonal closing anchor, not evidence of race entry, readiness or compulsory attendance. App release numbers such as 44.4–44.8 are independent from season identity.

The coach's priority list can be **Active Training Roster** internally. It reflects people actively following authored work, filing or communicating; it is a service-attention view, not a public badge, performance hierarchy, automatic access rule or test of personal worth. Remote and independent athletes still belong.

## The four existing blocks

Use the **latest authored `training_block_phases` revision** where present. Brice and Tinius's current 15-week blocks already carry these four phases; do not duplicate the training program with a new parallel schedule.

| Block | FORM Weeks | Dates | Question |
| --- | --- | --- | --- |
| 01 · Find the Rhythm | 1–5 | Oct 19 – Nov 22 | Can quick, controlled movement be repeated while easy mileage stays easy? |
| 02 · Hold It Longer | 6–10 | Nov 23 – Dec 27 | Can controlled work last longer without turning sessions into races? |
| 03 · Stretch the Speed | 11–14 | Dec 28 – Jan 24 | Can more of the available speed be carried into longer work? |
| 04 · Finish Fresh | 15 | Jan 25 – Jan 31 | What was built, what was retained and what comes next? |

Those are **season phases**, not replacement titles for every athlete's individual `training_blocks.name`. Athletes may enter midway or have independent blocks, marathon-specific tapers and race dates. Their season position is mapped by **calendar date**, not a fictitious completed Week 1.

## Membership is multidimensional

Do not overload `athlete_training_groups` into a single exclusive roster. A person may have:

1. **Coaching relationship:** run plan, strength plan, both, or independent runner in hosted practice; authorization stays explicit.
2. **Season affiliation:** FORM Miami · Fall 2026, joined date, primary/private display preference and closeout eligibility. This is independent of individual block start/end.
3. **Practice groups:** FORM Thursday, Monday iRUN, a genuine hosted Saturday, local partner group, remote study group. Existing `athlete_training_group_regulars` records indicate known participation, not attendance.
4. **Current place context:** home/base city, current training city, seasonal city and effective dates. Coach-private by default. Do not infer a person's current location from a race, photo or RSVP. A seasonal winter stay is a possibility, not a present address.
5. **Race crew:** event-specific, only when the athlete opts into sharing race and travel details. A target is not registration.

Proposed schema additions, subject to backend review:
- `form_seasons(id, name, slug, starts_on, ends_on, host_city, status)`
- `form_season_memberships(season_id, athlete_id, joined_on, membership_role, privacy_mode, status)` with many-to-many memberships.
- `athlete_place_context(athlete_id, kind, city, region, country, effective_from, effective_to, source, verified_on, visibility)` in a private schema or RLS-protected table.
- `season_close_receipts(season_id, athlete_id, edition_id, presented_at, dismissed_at)` only if native UI cannot reuse existing `season_close_editions`.

Do not create a second training plan, attendance ledger, race registration source or fabricated current-location value. Migration and RLS design require separate tests.

## Training operation

- Individual `training_blocks`, `training_weeks`, `planned_sessions`, latest `planned_session_versions` and typed components remain the only published prescription.
- Thursday's shared workout is one dated session with athlete-specific pace exceptions where coach-authorized. Fast 400/600/1000 times can match while threshold tempo does not. The shared session is not permission to copy another athlete's whole week.
- Saturday long runs belong to each athlete. A hosted meetup exists only with a distinct `collective_runs` occurrence and opt-in RSVP.
- Coupled running and Forge review covers the current and following seven days, especially lower work before quality days.
- An authored progression advances as written; evidence from texts and filings prompts a deliberate revision, not an automatic pause, fabricated gate or blanket pace escalation.
- The Weekly Operating Brief names who needs a race decision, an onboarding action, a plan revision or a transition conversation. No automatic outreach posing as Brice.

## Closeout experience

**Block sheet:** Shown once when an athlete first opens the next authored block, or explicitly from the Dossier. Header: block name and date range. Then three truthful fields: completed work (counts only when filed), selected best/average track marks with sources, and a coach-authored observation. End with a concise next-block purpose and `Enter next block` / `Not now`. The athlete can revisit it. Nothing is graded, streak-ranked or revealed publicly by default.

**Season closeout:** A cinematic but quiet record available after Jan 31, with season title and dates, signed coach note, selected `athlete_season_pins`, verifiable race or workout milestones, and consented photographs. Use `season_close_editions` for signed prose, versioning and withdrawal; do not generate a generic congratulation in Brice's voice. The runner can archive, save or opt into sharing. Missing data is omitted, never set to zero or filled by inference. A new season needs a separately authored plan, not an automatic extension.

**UI boundary:** Loading/interstitial treatment can use the soft-blocks visual language, compact sticky branding and an intentional progress transition, but never trap access to today's Week. Implement native UI and data contract only after product design, preview, accessibility sizes and physical-device QA. Web assets or a design brief do not prove the iPhone implementation exists.

## Race decision desk

For an athlete without a committed event, present **two or three possibilities** by distance, date, location, availability and how the race serves their training. Coach and athlete decide whether to target it. A candidate stays in proposal notes; `race_entries` becomes `target` only after a real athlete-specific decision and `registered` only with evidence.

Verified official dates as of November 5, 2026:
- Life Time Miami Tropical 5K **January 30, 2027** and full/half **January 31, 2027**; organizer reports general registration sold out and 5K waitlist selection underway. These are **not default assignments**. https://www.themiamimarathon.com/registration/
- Life Time 305 Half Marathon & 5K **March 7, 2027** in Miami Beach, useful as a potential next-season 5K/half anchor subject to athlete choice and registration. https://www.305halfmarathon.com/
- NYRR reports January–March 2027 adult races sold out at advance member registration; pursue specific available alternatives individually, not phantom registrations. https://prod.nyrr.org/run/race-registration-launch-timeline
- NYCRUNS official 2026–27 calendar currently advertises **Big Apple Half (Dec 13)**, **Frozen Penguin 5K (Jan 10)**, **Frozen Pigeon 5K (Jan 16)**, **Central Park Half (Feb 28)** and **Frozen Bonsai 5K (Mar 6)** with `Register` links. These are New York candidate races for Sam P, Elijah, Sohel and Bobby where distance/goal fits; never register or assign without checking current entry availability with the athlete. https://nycruns.com/races

## Release and service gates

1. Confirm season name, member rules and visual treatment with Brice. Keep private roster labels and locations out of public website payloads.
2. Add season/membership schema or indexes only with migrations, RLS and backfill/readback; reuse existing group records. Audit legacy duplicates before adopting automatic sync.
3. Prototype block sheet and season closeout with real, permissioned example data. Test empty and partial history, large text, reduced motion, dismissal and revisit.
4. Sign and publish individual race/plan decisions in their owning records; do not invent a general race or an athlete completion.
5. Publish site/app only with separate owner approval, checks and signed-in device evidence. Log changed, committed, deployed and verified states separately.

## Tyler Odwin · authorized coaching direction, onboarding pending identity

Distinct from existing Tyler Gattuso. Target three running days: **Tuesday easy**, **Thursday FORM track** and **Saturday long**, without Monday iRUN. Use the currently authored Thursday work geometry and speed-level short repetitions, but separately calibrate controlled threshold around **6:25–6:40/mi**, RPE 6–7, rather than importing a more developed runner's sustained-speed target. Saturday's requested 10–12-mile progression must be reconciled against his recent longest run and total load; design step-back and some controlled steady-finish weeks without making every Saturday hard. His strength should draw from Brice's *current* assigned Sculpt 02 Full Split, but the two lower sessions must be scheduled with Thursday speed and Saturday running in view.

**Do not mark live:** exact Apple sign-in email, recent training/injury/strength context, portrait asset production HTTP 200, one canonical identity and memberships, full authored Weeks and Thursday links, latest-version readback, signed-in athlete view and invitation delivery remain onboarding gates. A possible Saturday attendance is not a completed workout or RSVP.
