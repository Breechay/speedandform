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

## October 25 · Plan copy is a teaching surface

FORM should read like a brilliant children's science book: **one clear idea, easy to picture, scientifically honest**. Explain like the runner is five, without talking down to them. A small physical image or analogy is welcome only when it makes the training idea click; do not force a metaphor into every week. A fast athlete may still be new to coaching vocabulary.

**What goes where**

| Field | The athlete should get | Limit |
|---|---|---:|
| Plan goal | What the program builds in one sentence | 150 characters |
| Phase name/purpose | One skill and a short reason | 125-character purpose |
| Week `intent` | A quick, understandable focus | 100 characters |
| Week `matters_because` | One reason worth knowing; omit if redundant | 125 characters |
| Session | Exact sets, pace/time, recovery, warm-up and cool-down | No lost prescription detail |
| Coach-private note | Recovery decisions, record provenance, admin/attendance, evidence uncertainty, readiness conditions | Not published as narrative |

**Real examples**

| Not athlete copy | Athlete copy |
|---|---|
| "Sam joins the cohort ... No history or attendance implied." | "Easy start" / "Start with a relaxed run. The faster work comes next." |
| "No race entry is assumed. Monday iRUN and Thursday FORM Track are shared team practices." | Speed Reserve: "Build relaxed speed, a stronger threshold, and the endurance to hold both." |
| "Shared target is aspirational, not a mandatory pass/fail gate." | "Quick feet, easy miles, a rhythm you can repeat." |
| "The volume bars show the published plan, not a measurement of fitness." | No caption. The chart is already readable. |
| "Threshold development · Threshold 01 · 2 × 10 min" | "Threshold · 2 × 10 min" / "Find a pace you can settle into and keep." |

No first-person narration by FORM, no third-person summary of the athlete, no internal coach-to-coach commentary, no release/disclaimer prose, and no invented progress. Name a technical idea only when it is understood from its neighbors. Avoid extra RPE text in warm-up/cool-down and "Week:" details that simply repeat the visible workout.

**The required editorial gate:** read the exact Plan on a phone or in an equivalent signed-in preview. Could the runner explain it after one reading? Would Brice actually say it? Does the image explain something real? If not, rewrite or remove. Never approve copy solely because it passes a regex or character count.

**Write-time minimum:** The live FORM Athlete System has `form_validate_athlete_copy`, with guards on `training_blocks.goal_statement`, `training_weeks.intent/matters_because`, append-only `training_block_phases.purpose`, and new `training_plan_weeks.intent`. They reject long high-level copy and recurring bad expressions. These checks do not assess coaching correctness, nor can they judge whether an analogy is good. The read-only release SQL now audits high-level plan stories too.

**October 25 live correction:** 14 active Plan introductions and 207 Week stories were reauthored; four Speed Reserve athlete blocks received new append-only phase revisions. The old high-level copy is recoverable from `form_editorial_private.athlete_copy_revisions`, batch `athlete_voice_20261025`. Workouts, dates, session versions, pace bands and filed history were not changed.

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
