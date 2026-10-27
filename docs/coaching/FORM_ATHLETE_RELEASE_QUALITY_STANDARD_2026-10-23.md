# FORM Athlete-Facing Training Quality Standard
Date: October 23, 2026
Owner: FORM Coaching + FORM iOS
Status: Partially enforced in production; remaining release checks below are mandatory before a claim of on-device verification.

## What the athlete should see
A runner should understand the day without knowing coaching terminology:
- WHAT: distance or duration, repetitions, target time/pace, and recovery.
- HOW: one concise effort cue. "Easy" means comfortable conversation.
- WHY: at most one useful sentence, if it adds something.
- RACE: the confirmed event and date, without unrelated phase names under the race poster.

Do not show coach notes, administrative change history, uncertainty about intake, recovery forks, labels like "HM durability," or another athlete's goals. Speed Development is a race-optional program for short fast running, mostly easy running, then holding speed longer.

## The failure that changed this standard
Elijah's October 22, 2026 session showed "5 mi easy" while a previous version still contained 6 × 1 minute at 5:55–6:05/mi with 90 seconds recovery. The app displayed the pace faithfully but did not check that it contradicted the easy label. It was corrected with version 4: one continuous 5 mi easy run, 8:00/mi or slower. Earlier versions and any historical evidence remain intact.

## Production protections already installed
1. **Server privacy boundary:** `athlete_plan_feed` strips private `coach_note` from every session in the athlete response.
2. **Independent native boundary:** the iOS translator cannot insert `coachNote` into athlete task copy (source on main, not yet part of an Apple release).
3. **Athlete-specific easy floor:** `athlete_running_guardrails` records a minimum number of seconds per mile for each coached athlete; the initial six are 480 seconds/mi. Unconfigured athletes use a conservative 420-second contradiction threshold until reviewed.
4. **Write-time pace rejection:** the database refuses new fast work components or fast header paces attached to sessions labeled easy.
5. **Write-time shape rejection:** long repeated efforts with recovery are not allowed under an easy label; short strides of up to 30 seconds with recovery remain possible.
6. **Read-only publication audit:** `docs/coaching/FORM_ATHLETE_RELEASE_QA_2026-10-23.sql` detects fast/easy contradictions, longer hidden intervals, duplicate active sessions, specific internal/conditional phrases, unwanted shorthand, and Fifth Circle Week previews. It returned no active upcoming findings at introduction.

Database checks deliberately test consistency, not whether a workout is physiologically appropriate. Coach judgment, injury context, and paired Forge training remain required.

## Required review before declaring a plan published
1. **Identity:** Correct athlete ID, claimed login and active block. Do not match by name.
2. **Prescription:** Compare the session title, structured components, per-rep pace/times, rest, warm-up, cool-down and written details. An easy day cannot silently contain quality work.
3. **Week:** One current published session per athlete/day, realistic weekly mileage, long-run buildup, and no duplicate load in Forge. Compare with both apps' next seven days when the athlete uses both.
4. **Copy/privacy:** Speak plainly, remove coach rationale and conditional decisions from athlete surfaces. Keep them in private coach notes. Never copy goals across athletes.
5. **Data audit:** Run the SQL release query; a BLOCK finding stops publication. A COPY finding must be edited before athlete distribution.
6. **Feed readback:** Fetch the same current active plan under a legitimate athlete identity. Verify newest version, exact pace, dates, units, and absence of `coach_note`.
7. **On-device:** Verify signed-in athlete Week, collapsed track prescription, session details and Dossier on normal and small iPhones. Capture screenshots. Old App Store builds and cached sessions must be checked separately.
8. **Distribution claim:** Distinguish authored data, committed native code, signed build, App Store availability, and observed signed-in device. None implies the next.

## Coach-approved rapid publication rule · October 27, 2026

**Approval is a release instruction, not a request for another approval.** When Brice says publish, make live, update the athlete, or otherwise explicitly approves an athlete prescription, complete author → self-audit → coaching/data checks → versioned publish → exact production readback in the same work cycle. Do not park a passing change as a draft, leave a staged version awaiting a routine follow-up, or ask Brice to approve the same change again. Updating athlete data does not require a native App Store build when the installed reader already supports the data.

**Fast means decisive checks, not skipped checks.** Run the current athlete release gates, including verified identity, existing block/assignment, dated current Week, complete structured warm-up/work/recovery/cool-down, pace or RPE with verified units, load/race/health context, copy/privacy self-audit, duplicate-day and stale-version checks, and athlete-feed readback. Automatic validators should reject or route a specific failing field to immediate rewrite/correction; they must not silently alter a prescribed training dose. Publish as soon as all gates pass, then verify exactly what was saved. Distinguish database publication from actual signed-in iPhone reception.

**A material safety/identity conflict is the narrow exception.** Missing clearance, unresolved injury/PT restriction, unconfirmed imminent race/taper, conflicting external-coach workload, or mismatched identity is a genuine hold on that affected prescription. Never work around it by inventing paces, dates, workouts, memberships or a generic alternative. In the same work cycle, publish any independently safe, already-authorized changes; leave unsafe sessions unissued; identify the exact missing fact and request it once through the appropriate coach/athlete channel. Show the hold explicitly in the Coach Console and keep the queue ready for automatic validation and prompt release when the fact is resolved. Do not claim the whole plan is live because an invitation or Week focus row exists.

**No silent unfinished handoff.** Every approved athlete change ends with either (a) a production receipt listing athlete ID, dates, latest version IDs, active assignment/feed readback and remaining device-verification limit, or (b) a named blocking gate, owning follow-up and exact next action. The next coaching edit must not reintroduce a withdrawn session or stale Week copy. Publication should be idempotent and version-aware; conflicts trigger a fresh read and reconciliation, not a blanket overwrite.

## Engineering follow-up
- Add a typed session intensity to the canonical schema instead of relying forever on words in a title.
- Make pace rules part of coach preview and publish, with a readable reason when rejected.
- Add test fixtures for exactly this class of easy/hard mismatch, an allowed short-strides case, copied goals, private-note leakage, and race Dossier phase suppression.
- Execute the SQL audit in the publish pipeline with clear pass/fail, not just manually.
- Add production readback monitoring and visible coach alerts for unexpected feed regressions.
- Complete signed-in UI regression tests and ship the native Dossier/Week fixes in a subsequent Apple release.

## Acceptance for the October 23 repair
- Elijah Oct 22: 5 mi easy, 8:00/mi or slower, continuous, no fast recovery structure.
- Elijah Oct 27: 6 × 800m at 6:17–6:23/mi, 90s easy recovery, not a 6 mi continuous gate.
- Five October 29 Fifth Circle sessions show 5 × 600m + 4 × 200m; Week preview includes the rep times and rest on the next native build.
- No internal copy in athlete Dossiers. Race poster's phase line is suppressed by native code, awaiting a new app binary.
