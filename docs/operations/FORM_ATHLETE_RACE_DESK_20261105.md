# FORM Athlete & Race Desk · operating assignment

**Issued:** November 5, 2026  
**Status:** source-level brief and implementation queue, not a running background service, private athlete database migration, external invitation, or athlete outreach.  
**Human authority:** Brice. **Machine coordination:** existing Daily Operating Brief and private Operating Console.  
**Bounded lanes:** Athlete Steward (case continuity), Filing & Feed Reconciler (execution), Practice & Company Operator (race/host logistics), Product & Release Guardian (app defects). The Method Curator receives only source-backed observations.

## Why this desk exists

Every athlete who entrusts FORM with training should have continuity across seasons, cities, programs, filings, race decisions, and changes in what they want. Brice should see exceptions and choices, not have to reconstruct the story of each person.

Build on the existing authorized `coach_agent_athlete_brief(uuid)`, athlete case file, `coach_filing_integrity_read(integer)`, `coach_roster_story_audit()`, `coach_private_notes`, `athlete_observations`, `athlete_track_stats`, `race_events`, `race_entries`, `training_blocks`, FORM Thursday subscriptions, and Forge records. These are separate owners. No public static dossier, duplicate plan database, public location directory, or implied source freshness.

The exact current roster is drawn from authenticated live membership, not a name list pasted into this file. Brice's *Active Training Roster* is an internal service-attention view; it is not a public performance ranking, subscription tier, automatic coaching entitlement, or judgment of someone's worth.

## Private athlete dossier: fields and evidence standard

For each authorized athlete, assemble a **private read projection** with linked owning IDs and independent clocks:

| Section | Required fields / evidence | Owner and hard distinction |
| --- | --- | --- |
| Identity and relationship | Canonical athlete UUID/slug, linked account, coach membership, invitation/claim state, run/strength/independent relationship, sharing settings | Athlete System and Auth. Never link by first name, avatar, or similarity. |
| Place context | Home/base city if athlete-reported, current training city, possible seasonal location, source, as-of date, effective window, privacy/visibility | Coach-private. A possible winter move is not current residence. No precise address without a distinct purpose. |
| Season and groups | One or more season memberships, local/remote practice groups, joined dates, opt-ins, group regular versus real RSVP and attendance | Membership can overlap. No automatic attendance or training dose from joining. |
| Running prescription | Current active block, latest dated Weeks/session versions, next eight days, RPE/pace units, Thursday individual overrides, Saturday distance, current Week story | FORM Athlete System. A shared workout is not permission to replace an athlete's plan. |
| Strength and competing load | Live Forge assignment/digest, dated sessions, known other sport/CrossFit/HYROX, next eight days and relevant restrictions | Forge owner; missing live data stays unknown. Respect currently approved glute placement until new evidence. |
| Execution and ability | Recent filed sessions, measured versus reported distance/time, source/version, 200/400/600/800/1000m session averages and bests, as-of/coverage | Filed records and `athlete_track_stats`. Do not infer a personal best or race result from prescription. |
| Coach learning | Athlete's original words, coach observation, costs/limiter, decision, competing explanation, outcome and next smallest test | Versioned observations and private notes, not a public study by default. |
| Race season | Athlete goal and preferences, race candidate(s), chosen target, registration evidence, date/location, travel/logistics, readiness branch, registration deadline, next decision | `race_events` + `race_entries` when the athlete chooses. Candidate is not target; target is not registered. |
| Service and verification | Last successful source read, missing inputs, attention reason, action owner, review date, filing→Week/feed receipt, app build/device state and support status | Operating Console / release receipts. A completed task needs destination readback. |

Do not put this projection in a browser-visible JSON bundle or GitHub repository. New structured fields, especially place and race suggestions, need private/RLS design, named owner, version/source timestamps and signed-in QA. Existing private notes may hold a candidate temporarily, but cannot be silently treated as structured race entry.

## The race candidate register

These are **public events to consider**, not athlete assignments. Last official page check: **November 5, 2026**. Always recheck entry availability/conditions immediately before proposing a paid registration, and record exact check time. Public event pages may carry a visible Register action without guaranteeing an entry at checkout.

| Place / event | Date | Distances | Candidate use | State on check | Official source |
| --- | --- | --- | --- | --- | --- |
| Miami, Life Time Tropical 5K | Jan 30, 2027 | 5K | Season close weekend, only if space exists | Check current 5K status; no assumed entry | https://www.themiamimarathon.com/registration/ |
| Miami, Life Time Miami Marathon / Half | Jan 31, 2027 | Marathon / half | Existing entrants' season anchor | **General registration sold out**; no new default target | https://www.themiamimarathon.com/registration/ |
| Miami Beach, Life Time 305 | Mar 7, 2027 | Half / 5K | New-season Miami race options | Candidate; check before signup suggestion | https://www.305halfmarathon.com/ |
| New York, NYCRUNS Big Apple Half | Dec 13, 2026 | Half | Winter long-run culmination for someone already prepared | Listed with registration route, checkout unverified | https://nycruns.com/races |
| New York, NYCRUNS Frozen Penguin | Jan 10, 2027 | 5K | Early short-distance benchmark | Listed with registration route, checkout unverified | https://nycruns.com/races |
| Brooklyn, NYCRUNS Frozen Pigeon | Jan 16, 2027 | 5K | Alternative winter 5K benchmark | Listed with registration route, checkout unverified | https://nycruns.com/races |
| New York, NYCRUNS Central Park Half | Feb 28, 2027 | Half | Next-season half-marathon goal | Listed with registration route, checkout unverified | https://nycruns.com/races |
| Brooklyn, NYCRUNS Frozen Bonsai | Mar 6, 2027 | 5K | New-season short-distance goal | Listed with registration route, checkout unverified | https://nycruns.com/races |

**Avoid false inventory:** NYRR states its January–March 2027 adult races were sold out during member-only registration; only member standby or newly verified capacity may change that. https://prod.nyrr.org/run/race-registration-launch-timeline

### Candidate → race entry rule

1. **Discovered:** one public official URL, race date/distance/place, source checked, entry state and intended season role.
2. **Suggested internally:** coach-private note linked to a person, with a reason and unknowns; no external message.
3. **Proposed to athlete:** specific Brice-approved outreach, confirm interest; no implied registration.
4. **Targeted:** create/reconcile an athlete-specific `race_entries` target only when they choose it.
5. **Registered:** registration receipt, athlete statement or official confirmation; never convert a target merely because the calendar event exists.
6. **Completed:** verified result/evidence and archived race note; season closeout may reference it with sharing permissions.

On race dates, avoid duplicate event slugs, and avoid treating multi-day race weekends as verified exact race-day slots. Revisit race availability and athlete preference when a candidate goes stale; preserve the prior observation.

## Cadence and handoffs

| Trigger / cadence | Role | Read and output | Autonomous authority |
| --- | --- | --- | --- |
| New filing / edited result | Filing & Feed Reconciler | Exact filing, plan version, Week and eligible FORM feed; new rep averages/best evidence | Read/recheck and a scoped, previously authorized idempotent repair only; never fabricate results or override opt-out |
| Daily Operating Brief | Athlete Steward | New filings, changed restrictions/feedback, next eight days, program/account gaps, athlete questions needing Brice | Draft a concise exception list; private task/receipt updates if permitted; **no autonomous training changes** |
| Before Thursday/Saturday practice | Practice Operator | Actual hosted Collective occurrence, place/time, people invited, RSVP and attendance states, weather/logistics if relevant | Prepare internal logistics; external sends/booking/attendance publication remain separately authorized |
| Weekly, before next program week | Athlete Steward + Race Desk | Current program, competing Forge work, race dates within 8 weeks, upcoming enrollment/registration cutoff, race candidates for people who want to race | Refresh official sources and internal proposals; **no speculative race entry** |
| At each block transition | Athlete Steward + Season Archivist | Completed versus missing evidence, selected track marks, coach note, next authored block | Assemble factual preview, signed note requires Brice; no fake closeout |
| At product release | Product & Release Guardian | Roster, planned Week, feed, portrait, permissions, version, signed-in device and deploy | Test and create issue/branch; only explicitly authorized release goes live |

Prefer event-driven checks over polling when a real source event exists. An unchanged athlete is not an incident. Escalate real publication defects immediately; summarize routine race possibilities weekly. An individual may be coached, remote, Thursday regular, strength-only, and part of a season simultaneously.

**Scheduler boundary:** `coach/agent-run-contract.json` currently sets `no_new_schedulers=true`. The existing **Daily Operating Brief** is the one coordinator, and **Weekly Company Review** can carry the season/race horizon. First extend those authorized jobs, then consider a new scheduler only if an uncovered event and idempotent trigger are demonstrated. Writing this file does not start any background agent.

## Implementation queue, one accountable owner each

- [ ] **P0 / Operations:** Add the Athlete & Race Desk read section to the existing Daily Operating Brief: current roster from authorized memberships, only new exceptions, next eight days, race decisions due, missing delivery/readback and last successful check time. Never surface private athlete cases in public copy.
- [ ] **P0 / Athlete Steward:** Define a single case-file projection keyed by athlete UUID with the dossier fields above, linked source IDs and independent clocks, using existing `coach_agent_athlete_brief` before proposing a new schema. Include blank/partial-history states.
- [ ] **P0 / Filing Reconciler:** Wire verified completion → Week → eligible FORM feed exception records and source-aware rep-stat summaries. Keep consent/opt-out, immutable filed versions and idempotency hard gates.
- [ ] **P1 / Race Desk:** Store private person-to-candidate suggestions with `as_of`, last official availability check, target distance/season, reason, next question and candidate state. Test that a suggestion cannot become `registered` without evidence. Only create race entries on athlete decision.
- [ ] **P1 / Practice Operator:** Put race/event logistics into existing Collective/Calendar owners; confirm cities and timezones from athletes, not photos, race pages or app IP.
- [ ] **P1 / Product & Release Guardian:** Integrate athlete case-file QA and race status display into the 44.8/44.9 design backlog. Don't block 44.7 stability on speculative scope; require release owner, build hash, signed-in iPhone and privacy acceptance.
- [ ] **P1 / Operations:** Make each specialist's last successful run, receipt, owner and blocker visible in the existing private Console. Never imply they are executing when only the written contract exists.
- [ ] **P2 / Season Archivist:** Use verified marks, signed coach notes and consented photography for block/season sheets; missing data is omitted, not scored zero. Athlete can revisit, skip and control sharing.

## Daily output contract

A brief is useful if it says **what happened, what changed, and what remains unknown**:

1. **New since last check:** athlete and exact source ID/date, whether filing and feed are coherent.
2. **Upcoming:** specific dated Week/strength/hosted event or candidate registration deadline, not generic training advice.
3. **Exceptions:** missing plan, outdated Week story, unread/undelivered invite, mismatched race status, permission/consent conflict or source stale.
4. **Actions:** actor `agent`, `brice`, or `other`; state `queued`, `active`, `waiting` or `done`; existing task ID or a single new idempotency key, not a second task database.
5. **Receipts:** source as-of, read time, version, affected athlete UUID privately, saved/published/delivered/device state, result and unresolved discrepancy.

Do not invent a “daily lesson,” assign Brice a finish, send unsolicited messages, turn an athlete's quiet week into a failure, or let this desk displace the Daily Brief's money-first company view.

## Implementation acceptance

- Authenticated coach roster includes the exact right athlete identities and current programs; no private dossier exposed to another account.
- For a sampled new filing, source, Week and eligible feed have three distinct verified receipts; an opt-out remains respected.
- A new 400/600/800/1000m mark is updated only from actual performed sets and retains source/date and sample coverage.
- Race status distinctions survive UI and backend readback, including sold-out/unavailable candidates and unverified checkout inventory.
- Automated reruns with the same source event change no data after the first successful receipt.
- The existing Daily Operating Brief still has its standing money-first format, no newly invented decisions, and no duplicate work queue.
- Any later native 44.8/44.9 feature has its own preview, large-text/privacy QA, source/branch hash, signed-in phone receipt and App Store release status.
