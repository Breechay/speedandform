# Run this audit: Race Pace Durability in FORM
For Claude Code or Codex. Read AGENTS.md and the roadmap first.
This is an executable brief, not a completed app audit.

## Goal and scope
Identify what is real and what is missing for two modes: plan-guided and coached by Brice. Inspect actual app repository/build AND web repo. If unavailable, mark app behavior NOT VERIFIED; do not infer from marketing. Read applicable app/backend instructions and skills before access.
Use synthetic accounts/fixtures, never fabricated Hope/José records. No production migrations, assignment/payment changes or public study writes during audit.

## Starting points to verify
- plans/race-pace-durability/source.js, notation.js, execution.js (new pacing is web-only).
- athlete/athlete.js, private/record.js, private/data.js.
- coach/labs/labs.js and the workflow modules actually loaded.
- Historical migrations: 20260829110000_one_filing_path.sql; 20260829140000_evidence_surface_requirement.sql; 20260904160000_owned_is_derived_from_evidence.sql. Verify actual current schema, not filenames.
- Labs is editorial HTML, not automatic publication of private filings.

## Trace both complete loops
Acquisition → eligibility → sign-in → correct athlete → plan/version → start/race date → band → session → instructions → completion/splits/report → next step → coach visibility if applicable → correction → another device.
Record functions, persistence, permissions and screenshots. Include offline/retry and return after absence.
Filing existing does not mean it replaces Brice's judgment. Identify every manual intervention.

## Minimum useful filing
Autofill identity, prescription, date, band, units and version. Avoid redundant typing.

| Kind | Preserve | Conditional follow-up |
| --- | --- | --- |
| Measured | Distance/time; rep/continuous splits; recovery; source | Opening/middle/finish if not imported |
| Reported | Effort in original scale/words; limiter; reserve in words/units | What changed late? What made you stop? |
| Context | Surface, conditions, interruptions/deviations | Fresh/late segment and prior easy miles |
| Pacing | Entry, drift/correction, intended band versus actual | Blind segment location only if attempted |
| Movement | Supplied observation, cue and response | Optional clip; no universal posture checklist |

Prototype progressive disclosure. Key-session reporting should be short; easy work should not inherit every question. Missing effort is unknown, not low; missing reserve is not zero. No forced success story.
Preserve athlete_id, assigned_session_id, prescription version, activity/filed timestamps, source, author and edit history. Distinguish coach imports from athlete reports without duplicate evidence.

## Decision ownership
Inventory existing rules with evidence before proposing new ones.
- Broken reps meeting band do not establish equal continuous distance.
- Continuous qualification needs approved conditions/rule.
- Aggressive start + fade differs from evenly paced work becoming unsustainable.
- Missing report/GPS gaps/treadmill when outdoors required must limit the conclusion.
- Sickness/injury/interrupted block must not trigger automatic intensification or medical inference.
- Post-filing band changes preserve old prescription evidence.
- Corrections/deletion/duplicates must recompute or invalidate derived claims; replay never advances twice.

Coached mode: distinguish draft, approved and delivered Brice decisions.
Plan-guided: only approved bounded rules select next work. Every rule needs version, scope, inputs, reason, approval, override and undo history. Do not create an unwatched hidden coach queue.
Uncertain cases explain missing evidence and offer a bounded next action. An unresolved recommendation is not an assigned prescription.

## Isolation and publication
Prove server-side athlete isolation, coach authority and entitlement boundaries. Client flags cannot grant access.
Brice owns public study edits. Identity/provenance remain attached, but permission and editorial selection determine publication. Filings may reach the console without the website. Never auto-publish raw notes, symptoms or photos.
Support payment does not change delivery mode.

## Required scenarios
1. New independent runner, no manual database setup.
2. Existing coached athlete, correct individual band across devices.
3. W1 good rep averages conceal aggressive entry.
4. W4 five continuous versus five broken total.
5. W9 eight continuous and separate Saturday fatigue context.
6. W12 four easy + twelve RP; total and qualifying segment stay distinct.
7. Blind middle mile attempted/not attempted.
8. Missing effort, mixed units, interrupted upload, duplicate import, corrected split.
9. Coach revision after filing; history/derived state remain valid.
10. Return after absence; no shame or catch-up overload.
11. Self-guided case needs human judgment; no promised review.
12. Private filing reaches console but not public study without editorial action.

## Deliver
Write docs/audits/PLAN-APP-AUDIT-RESULTS.md:
- Versions inspected and unverified scope.
- Matrix: tested / implemented untested / missing / intentionally manual.
- Gaps with severity, reproduction, expected/observed, source, mode, fix and acceptance test.
- Actual data/decision ownership diagram.
- Short reporting prototype grounded in existing components.
- Smallest viable plan-guided release, separate coached improvements and rollback.
- Public claims supported by tests.
Update roadmap APP IDs. A proposal does not complete implementation.
Present decision-policy choices for review; do not alter training merely to complete the audit.
