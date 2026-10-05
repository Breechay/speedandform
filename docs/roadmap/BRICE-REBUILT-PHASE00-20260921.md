# Brice · Rebuilt Athlete Phase 00 · web/backend state

**Dated:** 2026-09-21  
**Bridge Season authority:** `FORM-iOS/docs/operations/bridge-season/` on `codex/bridge-season-roadmap-source`  
**Native handoff:** `FORM-iOS/docs/operations/bridge-season/BRICE_REBUILT_PHASE00_HANDOFF_20260921.md`

This file is the speedandform-side implementation record. It does not become a second Bridge Season roadmap.

## Study → plan → backend

Study:
- `/labs/rebuilt-athlete/`

Applied Phase 00 week:
- `/plans/rebuilt-athlete-phase-00/`
- Monday through Sunday sibling field sheets
- web projection: `/plans/rebuilt-athlete-phase-00/program.json`

FORM backend:
- plan slug `brice-rebuilt-athlete-phase-00`
- migration `supabase/migrations/20260921144500_brice_rebuilt_phase00.sql`
- 3 weeks · 9 run occurrences
- 2026-09-21 → 2026-10-11
- Tuesday / Saturday anchors
- Thursday optional
- outdoors or treadmill
- RPE 2–3
- no pace target
- no race target
- development block

## Authority

The web JSON is review/projection only. FORM's canonical prescription is the existing athlete assignment + immutable planned session versions returned by `athlete_plan_feed`.

FORM owns running prescription and filing. Forge owns strength. Study 002 selects evidence and interprets the whole athlete.

## Identity

Do not create another Brice.

The existing `brice` athlete has:
- one active Sign in with Apple athlete owner;
- `briceikouebe@gmail.com` as the coach/authorship identity.

This split is protected by the one-active-athlete-owner constraint and was verified before the Phase 00 migration. Native filing stays athlete-only.

## Verified feed

The Apple athlete owner successfully called the canonical athlete plan feed after migration. It returned:
- `The Rebuilt Athlete · Phase 00`
- purpose `development`
- no race
- 3 weeks
- 9 sessions
- W1 Tuesday `Easy run · 35 min`
- W1 Thursday `Optional easy run · 25–30 min`
- W1 Saturday `Longer easy run · 45 min`

The sessions are duration-authored. Missing prescribed miles must not be rendered as a planned `0 mi`; actual mileage belongs to filed evidence.

## Web-first rule

The working product sequence for this lane is:

**Study → applied web plan → real use → native projection.**

When real use changes the method, update the study. When it changes daily execution, update the web plan. When it changes running prescription, update the backend assignment/version. When it creates future implementation work, update Bridge Season. Native UI follows settled reality rather than getting ahead of it.


## 2026-10-04 · Week 02 active authoring

The one-week-at-a-time block has been extended through **2026-10-11** without opening a new race build. Backend active block now reads Week 02 / 02 and carries **31 prescribed miles** across five running sessions:

- MON 5 mi treadmill · feel-first
- TUE 5 mi outdoors · low aerobic / Zone 2
- THU 5 mi treadmill · feel-first
- SAT 6 mi treadmill · easy
- SUN 10 mi outdoors · first 7.5 mi low aerobic, final 2.5 mi optional natural if still fluid

Canonical write: `supabase/migrations/20261004223000_brice_rebuilt_hold_31_week.sql`.

Web projection and all seven daily field sheets were updated to match. FORM remains running prescription + filing authority; Forge remains strength authority; Study 002 owns interpretation. No native prescription fork is required because the app reads the active FORM Athlete System block/feed.

The progression decision is explicit: **hold volume; improve control.** The previous week closed at 31.03 actual miles, so Week 02 does not increase the running-load target. The next week remains unauthored until this hold is read.

## 2026-10-05 · Monday completion / velocity contrast

Monday's authored **5 mi treadmill · feel-first** session was completed as **5.01 mi / 47:42** and filed in the FORM Athlete System. The athlete used self-selected speed contrast rather than a pace- or HR-driven workout, then finished the final mile easy with reserve.

Study 002 owns the detailed interpretation. Garmin ground-contact-time balance was **51.1% left / 48.9% right**; the athlete identifies the recovering left limb as still having slower reaction/rebound. Treat this as a small timing asymmetry and recovery signal, not evidence of greater left-side force.

Week 02 remains a **31-mile volume hold**. No pace target, threshold prescription or fixed interval pattern is created from this run. Future feel-first treadmill running may allow spontaneous velocity contrast when it improves movement, but should stop before it becomes a push.
