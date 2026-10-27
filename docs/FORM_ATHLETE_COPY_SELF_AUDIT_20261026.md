# FORM · Athlete copy self-audit

October 26, 2026

## The rule

Before anything reaches an athlete, write it, audit it, and rewrite it until it passes. Plain English. Short sentences. Exact workout numbers. No filler.

This applies to Week, Plan, Coach Console, Plan Exchange, HYROX, strength instructions, member updates, website and notification copy. Short copy is a quality requirement, not permission to drop a rep, station, rest, pace, warm-up or cool-down.

**Author's loop**

1. Draft the athlete-facing text.
2. Check the shared rules with `selfAuditSessionCopy(next, previous)` for session text. For non-session surfaces, use the same editorial rules as a writing checklist and the applicable surface validator.
3. If an issue is returned, **rewrite the copy**, then run the audit again. The author or writing agent is responsible for revisions. The checker never changes the prescription.
4. Check the numbers and sequence against the coach-approved structured workout. Keep pace units personal to the athlete. Ask the coach if the dose is ambiguous.
5. Save only after editorial pass. For a live session use the authenticated coach create/revision path; verify the latest version and signed-in athlete view before saying "live."

**Pass criteria**

- A child could understand what to do next: e.g. `5 mi easy. Then 4 × 15 sec fast but relaxed. Walk 60 sec between.`
- A single execution paragraph is at most 190 characters; structured multi-line exercise details may be longer where needed.
- No rambling explanation of why a stride is not a sprint, internal coaching commentary, or unnecessary reporting instructions.
- Use meters for short distances (`800 m` instead of `0.5 mi`) after verifying the coach-approved equivalent.
- Preserve all work, recovery and intensity. Do not guess a weakest HYROX station or overwrite an external coach's plan.
- Publish one clear session. Readiness contingencies stay with the coach, not the athlete.
- Do not lead with `4 mi running total.` when the session title and structured work already establish the total. Start with the warm-up and work.
- Write `RPE 6`, not `RPE 6–6`. Exercise list rows such as `Bench press — 4 × 8` are valid; a long prose sentence joined by an em dash is not.

## Two levels of copy

- **Week card:** Title, actual work, distance/splits/RPE/recovery and short warm-up/cool-down labels. Do not repeat `Drills + 4 strides` or `4 relaxed strides after the warm-up` above fully structured speed sets. `weekPreviewEditorialIssues` checks this presentation noise when its renderer supplies `hasStructuredWork: true`.
- **Full session:** Keep every real preparation, execution, safety and recovery instruction. Do not delete drills or strides from canonical workout details to clean the Week card. Do not cut information essential for HYROX equipment use or strength technique.

## $500/month standard

An editorial pass means the words are clean, **not** that the coaching is good. Before athlete publication, coach review also checks the athlete's specific goal and race date, actual training history and feedback, realistic current and following-week load, pace/effort targets, warm-up, work, rest, cool-down, and any paired Forge sessions. Repeating a FORM or iRUN practice never overrides a race-specific session without coach review. If an external coach's plan calls for rest while FORM assigns work, stop and reconcile the program rather than silently changing the dose.

Keep the high-touch review separate from the writing gate: a short session can still be the wrong training. Record the coach decision in the private record, issue an append-only revision through the owning authenticated path, read back the latest published version and test the athlete-facing Week. Reassess goals and plan progress every two weeks using [the athlete release quality standard](coaching/FORM_ATHLETE_RELEASE_QUALITY_STANDARD_2026-10-23.md). This document does not itself schedule that review.

Automated `sessionEditorialIssues` guards Coach Console saves and Plan Exchange imports. `weekPreviewEditorialIssues` is a separate helper for Week presentation and must be connected and tested by the native Week renderer; exporting it here does not mean an iOS build has adopted it. The CI workflow runs unit tests on related PRs. **Current limitation:** direct SQL/RPC and native-only authoring do not share this client-side validation. The eventual server publication gate must apply equivalent rules with coach authentication and append-only version history, then be tested on the actual athlete feed. Until then, writers must self-audit before any other publishing path. A green CI run alone is not proof an athlete received corrected copy.

Preserve the existing one-routine-deploy-per-work-block rule. A completed audit permits publication only through the owning release process; it is not an instruction to deploy every copy edit.
