# FORM Training Together · Phase 2 backend

**Owner:** FORM / Brice. **Status:** source staged for review; no live tables, no prompts sent, no athlete locations collected.

FORM connects athletes to good training company. It is not a public directory or plan browser. Brice remains the logistics editor; an algorithm may surface a promising pairing, but it never makes an introduction or publishes a workout on its own.

## What an athlete opts into

An athlete chooses **Find me training company** and supplies:

- City where they prefer to train (e.g. Miami), not inferred from IP/device/home address.
- General **training area** (e.g. Edgewater, Brickell, Miami Beach). Do not collect coordinates, home/work address, or Strava start point.
- Preferred time: early, morning, midday, evening, or flexible.
- Training they'd welcome company for: easy run, long run, speed, strength, yoga.

Nothing is backfilled. All new fields are null/absent until the person opts in. Opting out deletes the matching profile and open help requests and closes pending introductions. These data are only returned to the athlete themself or the authorized coach. A later UI must plainly explain consent and provide an opt-out control. Until that UI exists, no production onboarding should collect this information.

## Two ways to connect

1. **Athlete request:** “I’d like company for Saturday’s long run.” The athlete gives FORM a date, type, and optional short note. This goes only to the coach queue, never another athlete.
2. **Coach suggestion:** FORM examines published sessions privately for athletes who opted in. Only **easy** and explicitly named **long run** sessions with a known mi/km distance are compared automatically today. Same city, compatible time preference and training type, same date, and distance difference at most 3 mi produce a candidate. Same training area raises priority. Missing distance units are skipped, never guessed. No paces, injury history, health state, private notes, or exact location are matched or exposed.

Candidates are suggestions for the coach, **not invitations or proof of compatibility**. Brice reviews pace, individual prescriptions, fatigue and context before proposing anything. Future Plan Exchange plans can participate once their sessions are properly published through the canonical training model.

## Introduction sequence

1. Coach selects two opted-in athletes and proposes the same date and training type.
2. Each athlete privately receives a FORM proposal, initially **without the other person's name or plan**.
3. Each independently answers yes or no. A no closes the proposal.
4. Two yes responses place it in **Ready for FORM**. The coach explicitly completes the introduction.
5. Only then can the athlete's private response include the other athlete's first name. No phone number, email, location detail or plan text is shared; no chat or push notification is implemented yet.

It is deliberately a consent handshake, not direct athlete-to-athlete discovery. An event RSVP is separate and does not automatically opt anyone into matching.

## Owning schema and API

| Object | Ownership | API |
| --- | --- | --- |
| `form_match_profiles` | Athlete's opt-in, training area and preferences | `form_match_profile_set`, `form_match_opt_out`, `form_match_my` |
| `form_match_requests` | Athlete asks FORM for training company | `form_match_request`, `form_match_request_cancel`, `form_match_my` |
| `form_match_introductions` | Coach-mediated proposal, two responses, final connection | `form_match_coach_propose`, `form_match_reply`, `form_match_coach_connect` |
| Existing `planned_sessions` / latest versions | Private training owner; read only | `form_match_coach_candidates(date,limit)` |
| Coach queue | Derived, paged in groups of up to 200, not a second message/plan system | `form_match_coach_queue(limit,offset)` |

All new tables have RLS enabled and direct `anon`/`authenticated` access revoked. Public RPC names are granted to authenticated users but enforce ownership/coach membership internally. No direct athlete-pair list or plan view is exposed. An account with ambiguous active athlete identity cannot opt in or reply until its identity is resolved.

## Operator and release boundaries

- No automatic group creation, event publication, calendar mutation, push, email, follower graph or chat.
- No live GPS, tracking, geocoding, travel estimates or precise proximity. “Same area” is an exact comparison of athlete-supplied words. Brice should still verify practical meeting logistics.
- No automatic speed-workout matching yet; equal intervals/distance are not sufficient proof of compatible paces or recoveries.
- The new matching tables depend on the existing athlete and planning schema, but have their **own migration**, stacked after Phase 1 Curated. They are not applied to production by opening a PR.
- Athlete-facing opt-in and proposal UI and coach-facing review/send UI remain subsequent implementation. The backend is intentionally inert without consented profiles.

## Required QA before any release

1. Signed-out read/write denied; athlete A cannot inspect athlete B's profile, requests, response, area, or plan.
2. Unclaimed and ambiguous identities cannot opt in or answer; coach account cannot call athlete-self RPC to impersonate someone.
3. A coach can see only their own roster, and cannot propose outsiders or non-consenting athletes.
4. Opt-out clears training area, requests and active proposals; both-yes does **not** disclose a name until FORM explicitly connects.
5. Bad input rejected (dates beyond 45 days, bad lane, empty area, wrong pair, duplicates, too many matches); same-city/area comparisons are reproducible.
6. Coach suggestions contain only ids, names, coarse city, date, lane and planned distance, not title, pace target, health/recovery data or plan payloads.
7. Regression: no updates to planned_sessions, session versions, filings, Collective attendance or Curated event invitations.
8. DB security and performance advisors; index/EXPLAIN tests with large opt-in rosters; end-to-end signed-in iPhone testing once UI exists.

## Next product slice

Add a small **Training company** card inside My FORM: opt-in, training area, preferred sessions, requests, and private yes/no invitations. Then put a **Training Together** queue next to Brice's Curated editor with candidate suggestions, review, invite, and connect controls. Do not create a public athlete directory or peer plan browser yet.
