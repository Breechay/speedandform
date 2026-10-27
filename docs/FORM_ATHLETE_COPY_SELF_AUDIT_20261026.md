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

Automated `sessionEditorialIssues` guards Coach Console saves and Plan Exchange imports. The new CI workflow runs unit tests on every related PR. **Current limitation:** direct SQL/RPC and native-only authoring do not share this client-side validation. The eventual server publication gate must apply equivalent rules with coach authentication and append-only version history, then be tested on the actual athlete feed. Until then, writers must self-audit before any other publishing path. A green CI run alone is not proof an athlete received corrected copy.

Preserve the existing one-routine-deploy-per-work-block rule. A completed audit permits publication only through the owning release process; it is not an instruction to deploy every copy edit.
