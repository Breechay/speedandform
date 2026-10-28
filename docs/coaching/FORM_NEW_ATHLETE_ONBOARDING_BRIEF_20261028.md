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
