# FORM · New athlete onboarding

**Owner:** Coach Brice · **Scope:** privately coached athletes entering the FORM Athlete System and Running app.

The standard is one verified person, one canonical assignment, one truthful Week, and an invitation that reaches the right person. A saved record, a claimed login, an app download, and a signed-in phone check are four different states.

## 1. Establish the person and permission

- Confirm the athlete's name, exact email used for Apple sign-in, preferred distance unit, and the coaching relationship. Check existing `athletes`, `collective_people`, Auth users and pending invites before creating anything.
- Create one `athletes` identity and link one `collective_people.athlete_id`. Do not match people by first name or portrait. Keep `collective_people.visible=false` unless public roster visibility is separately approved.
- Create an `access_invites` record for the exact email and athlete. It does not create or verify an Auth user; the athlete must claim access through the intended sign-in flow. Never fabricate an Auth identity or bypass verified ownership.

## 2. Collect the minimum coaching context

- Record goal, events and registration status, current four-week running frequency and mileage, longest recent run, current strength/CrossFit timetable, relevant injuries or clinician restrictions, recovery, and available days.
- Preserve the source and date for each fact. Strava best efforts are historical observations, not current training volume, medical clearance, or permission to set fixed pace targets.
- Give every active athlete a concise private study note: current question, prescription, competing loads, observations, uncertainty, next review and stop/adjust rules. Keep this out of public pages and athlete-facing coach notes.

## 3. Build the right program

- Confirm the start date and actual event windows. Use precise race day only when verified; a multi-day event may have `race_on=null` until the athlete provides the heat/date.
- Count hard strength, CrossFit competition and HYROX as quality load. Protect the day before the key run and avoid making up skipped work. FORM owns running; Forge owns assigned strength.
- For shared FORM Thursdays, subscribe explicitly with an individual `track_mode` and exact dated `form_miami_session_links`. An effort-based athlete must not inherit another runner's split targets. A recurring group affiliation is not attendance or RSVP.
- Author each dated Week with a clear easy/hard/long structure, correct unit, full warm-up/work/rest/cool-down, sensible load, and one explanatory story tied to its actual published sessions. Leave unknown future group workouts unissued until they are authored.

## 4. Publish and verify

1. Audit identity, active/draft block boundaries, duplicate days, race conflicts, coupled strength work, session components and easy-day contradictions.
2. Self-audit athlete copy: plain language, exact sets and recoveries, no internal gates, health history, other-athlete goals or conditional recovery branches. Recheck both `training_weeks.intent` and `matters_because` after every session edit.
3. Run the live FORM athlete release QA SQL. Zero findings covers only its named categories; the coach still owns the training judgment.
4. Read back latest versions, dates, RPE/pace units, linked Thursday sessions, active assignment and `week_story_is_current` status. Confirm no private `coach_note` reaches the athlete feed.
5. Verify the actual portrait asset exists on production, the linked private directory record resolves correctly, and the athlete sees their own photo and Week on a signed-in iPhone. Check a small phone, collapsed interval card, rest and race sections, and an unrelated account's isolation.
6. Send one short invitation to the verified address with the sign-in action and support route. Confirm send/delivery separately. The athlete can use the App Store link supplied by Brice; an invite alone does not prove an installation.

## 5. Close with a receipt

Record athlete ID, invite claim state, active block and date range, latest published version IDs, event entries, portrait URL reachability, release-audit outcome, signed-in device state, email send status and the single next review date. Keep **prepared**, **published**, **delivered** and **device-verified** distinct. Never call the entire athlete experience live just because the database insert succeeded.


## 6. October 29 release hardening: no more “added, but invisible”

A new athlete is **not onboarded** until this exact end-to-end receipt is checked. Run these gates in order for **each** athlete, even when creating several together:

1. **Identity and access:** One canonical `athletes.slug`, a matching `collective_people.athlete_id`, `active=true`, and active `athlete_memberships(role='coach')` for every Brice coach identity actually used by the app. Do not assume one email account and one Apple account share a user ID. Confirm an unclaimed invite references the *same* athlete and intended email. Invite creation is not delivery.
2. **Coach roster readback:** With the signed-in coach identity, invoke `coach_preview_roster()`; require the exact slug, name, expected portrait path, and `has_active_block=true`. Repeat for the other active coach identity. A database `INSERT` alone does **not** establish that the person will show in the coach app. Do not resolve this by exposing a private `collective_people.visible` record publicly.
3. **Portrait published and loaded:** The original approved source photo must be on the production asset host, not only uploaded to a Git branch or chat. Require an HTTP 200, an `image/*` content type, a nonzero response, matching `athletes.portrait_path` and `collective_people.avatar_path`, and a mobile circular-crop check of the face. A file path that merely looks plausible is not enough.
**Portrait replacement gate:** Publish each replacement under a new versioned filename, confirm the *currently deployed* production host serves the image (HTTP 200 with `image/*`) before switching database pointers, check the face in the circular crop, and retain the prior asset until a signed-in device check confirms the new portrait. A GitHub commit or Netlify build queued is not a live image.\n\n4. **Program and Week readback:** With coach authorization, invoke `coach_preview_plan_feed(athlete_id)`; require the active block and current real dates, expected session count, latest versions, measured components, and no stale or absent opening Week. Inspect the current week for exact weekday changes. Completed attendance is a separate `session_completions` receipt with its source and version; never fabricate distance, splits or intensity. Never call an athlete's actual iPhone verified based on this preview.
5. **One race event, correct athlete entry:** Match the existing race slug, date, distance/division and athlete before inserting. Add an `race_entries` row only when no matching event/athlete entry exists. Label registration `registered` only with athlete evidence; a coach saying someone will run is `target` until confirmed. Never create duplicate full/half event listings for the same named weekend.
6. **Group practice is not attendance:** Create `athlete_training_group_regulars` for known recurring practices without inventing RSVP. Create date-specific `form_miami_session_links` for FORM Thursdays. Only enable `shared_sync_required=true` after **every dated Thursday inside the active block** has a valid linked, published workout or an explicit documented exception. A race build extending beyond the authored Thursday horizon must remain unblocked and get future dated sessions when the coach actually publishes them. Use `form_miami_thursday_sync_issues(date)` and the content audit after onboarding to prevent one newcomer from breaking the publisher for the whole group.
7. **Delivery and athlete verification:** Trigger the existing secure `coaching-email-signin` flow for each verified email; inspect the transactional provider for a corresponding **delivered** message, not just HTTP 202 received. Record claim state separately. A fresh signed-in device check then verifies the actual Week, portrait, race and filing controls. Until that happens, say **published and delivered, phone acceptance pending**, never unqualified “fully live.”

**If any gate fails:** Keep the exact failing gate visible in the handoff, remediate it, and retest. Do not ask Brice to discover an invisible athlete or blank Week on his phone. Date, asset URL, roster result, event ID, active block, emailed recipient and delivery status belong in the closeout receipt.

**Plan-exchange rule:** When athlete availability, swim/bike days, or real mileage are unknown, clearly record them in private coaching context and use the plan exchange to reconcile later. Avoid invented fixed pace targets and avoid generic `TBA` workouts masquerading as published prescriptions. A completed Thursday can be coach-imported with truthful set evidence without making up the athlete's overall distance.

