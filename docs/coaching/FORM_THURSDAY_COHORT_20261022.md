# FORM Thursday · Shared Speed Development Cohort

**Coach operating decision:** 22 October 2026
**Current block:** October 19–25, 2026 entry week, followed by October 26–January 17 speed development; Kevin's separate marathon-completion block extends through January 31, 2027.
**Owner:** FORM Athlete System. This document is an editorial cohort standard, not a second independently writable plan.

## Cohort
- Brice — speed first, 12 weeks; personal rebuilt athlete study and low-volume speed development.
- Tinius — same Thursday track session and split targets, shown in km in FORM; former half-marathon block retained as archived history.
- David Morales — shared Thursday work, profile and portrait; details, weekly response, and long-run history to be collected.
- Sam Reyes — shared Thursday work, profile and portrait; details, weekly response, and long-run history to be collected.
- Kevin Helle — Thursday shared work while developing a **separate** first Miami Marathon completion preparation. His long-run progression, nutrition and balanced four-day strength should not be inferred from Brice's speed program.

## Stable weekly structure
- **Monday evenings:** iRUN normally has a group workout; the 40-minute easy run plus four strides currently published in FORM is the **independent easy fallback**, not an invented record of the iRUN session. When the actual iRUN prescription arrives, the coach must revise the athlete's published session and review Thursday speed and Forge strength exposure. Do not stack a hard Monday iRUN session on top of the easy fallback.
- **Wednesday:** Easy aerobic running.
- **Thursday mornings:** The routine FORM group quality day. Same authored intervals and **same split targets** for every participating athlete in this cohort, including Kevin. Coach can review and reauthor an individual's actual session if the target becomes inappropriate based on the athlete's own evidence. Attendance and compliance are not prefilled.
- **Saturday:** A shared easy longer outing whenever suitable, initially about 6 mi (10 km for Tinius), not an automatic mileage ladder. Pace **8:00 per mile or slower**; in Tinius's native metric view, approximately **4:58/km or slower**. Conversation and easy effort still matter. The mile pace is a ceiling, not an obligation to run exactly 8:00.
- **Other days:** Rest, cross-training, personalized strength. Typical experiment volume **20–30 miles/week**, not an enforced minimum, and not guaranteed from four workouts if the runner chooses fewer days.

## Paired strength coordination

For Brice, Tinius and Kevin, every FORM running prescription change requires review of the same athlete's Forge strength prescription, and every Forge change requires review of the active/forming FORM week. The [standing cross-app rule](https://github.com/Breechay/FORM-iOS/blob/main/docs/FORM_FORGE_COUPLED_TRAINING_REVIEW_20261022.md) records the known conflicts and proposed adjustments.

- Brice's current native Sculpt Phase 2 contains multiple heavy glute exposures that require relocation/dose review around Monday iRUN and Thursday FORM speed; live Forge reassignment is not yet verified.
- Tinius's six-week Durable Frame projection places Lower + Core on Thursday, a direct mismatch when Thursday is a regular speed day. New Friday lower + core dosing is proposed, not yet an assigned native revision.
- Kevin's dedicated [Complete Frame](https://github.com/Breechay/FORM-iOS/blob/main/docs/coaching/KEVIN_COMPLETE_FRAME_PHASE01_20261022.md) has **four strength days**: Monday upper, Tuesday controlled legs, Friday upper, Sunday lower support/abs. It is native-authored but not verified on his Forge app. Saturday long runs remain coach-owned and can require a Sunday strength change.

**The apps don't yet auto-rewrite each other.** Apply a mandatory coach review and update the owning program explicitly; do not tell athletes to choose among conditional sessions.

## Thursday development
The shared study opens Oct 29 with **The Fifth Circle**, 5 × 600m in 2:05–2:08 (2-min recovery) then 4 × 200m in 40–41s (200m easy walk/jog), with full easy warm-up and cooldown. Future **8 × 200m** and **5 × 400m** sessions belong on later *Thursdays*, not on the easy Monday iRUN slot. Athlete-specific coach weekly review gates govern future published prescriptions. The same group pace is a development aim; do not infer that the same work is already within everyone's capacity.

## Identity and portraits
One FORM Athlete System athlete ID for each participant. Names and uploaded portraits are **not** an account credential. Website /athletes and the app's Dossier side-door use the linked `collective_people` profile and its explicit `athlete_id`. App links the *signed-in* user to the intended athlete only after invitation claiming / membership; no email-name approximation and no second Forge identity.

Portfolio portrait mapping explicitly approved by Brice:
- Sam Reyes — first uploaded portrait, `/assets/athletes/sam-reyes-512.webp`.
- Kevin Helle — second portrait, `/assets/athletes/kevin-helle-512.webp`.
- David Morales — third portrait, `/assets/athletes/david-morales-512.webp`.

Small cards may use the 256px derivatives. These are images the user supplied; no unrelated athletic image is reused.

### Onboarding verification
1. Link canonical `athletes` row and single `collective_people.athlete_id` before making the public profile visible.
2. Verify each portrait URL is reachable on the deployed website.
3. Verify `collective_people_directory()` and `collective_person(slug)` show the expected person and portrait.
4. For the app, check eligible athlete membership and one claimant per invite before claiming. Confirm the correct portrait on actual signed-in device. Coach preview uses athlete ID, not matching names.
5. Do not claim user account activation or watch sync solely from a pending invite. Do not copy completed runs from Brice.
6. Coach confirms marathon entry/baseline before lengthening Kevin's weekend work. Strength Forge routing is separate from running-cohort scheduling.

Reference running study: [Speed First. Distance Earned.](../../labs/rebuilt-athlete/SPEED-FIRST-12-WEEK-20261022.md).
