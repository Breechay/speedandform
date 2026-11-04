# FORM 44.8 — Athletic Compound / Coach Console resume brief

**Checkpoint:** November 4, 2026. **Canonical integration:** [draft PR #493](https://github.com/Breechay/speedandform/pull/493), branch `release/coach-44-8-integration`, last inspected commit `c7dbc69161c74d00c8dbdc536a0385d0707a881a`. **Do not assume that SHA remains current when resuming.**

## The product decision

FORM's $400/month Athletic Compound is whole-person, individualized coaching management. Brice directs the service primarily through conversation. Authorized agents do operating work and preserve inspectable evidence. Coach is an orientation and exception surface—not a second place where Brice must manually manage the work.

Coach should answer, from current owning sources:

1. **What changed?** Athlete feedback, decisions, exact prescription versions and subsequent filings, without conflating dates or claiming causality.
2. **What did staff do?** Requested work versus actual action, saved readback, separately verified delivery and remaining uncertainty.
3. **What deserves conversation?** Genuine coaching judgment and exceptions, separate from agent-owned maintenance. No algorithmic review gate merely because a date elapsed.
4. **What is unknown?** Freshness, missing sources, unseen native app state and incomplete receipts. Unknown must never render as zero, success or verified.

## Release boundaries

| Release | Owner | Boundary |
| --- | --- | --- |
| 44.6 | Stability | Hope launch failure, Tinius performance and urgent athlete-facing fixes. No Coach feature work. |
| 44.7 | Speed + Strength | The parked athlete-facing features. Do not accidentally un-gate them into 44.6. |
| **44.8** | **Coach / Athletic Compound** | Integrate and verify draft #493. No new feature categories before release. |

Approved glute-day placements stay as designed. Update only with new athlete feedback/evidence. Program the best justified progression now; do not add routine human-review blockers. Do not revise real plans as a side effect of Coach verification.

## What's actually implemented in the draft

- Staff Console with separate agent-owned work, coach conversation points, week/filing exceptions and unavailable-source states. A queued/done item is not proof that an external action happened.
- Bounded athlete observations, provenance, supersession, explicit filing references and later chronology. Date-only feedback cannot order same-day filings.
- Decision inputs via explicit completion links, later filings as **chronology**, and optional explicit before/after prescription-version links. Never infer a version link from scheduling proximity.
- Agent receipt statuses and validation, optional exact `athlete_id` scoped to coach membership, bounded read-only athlete execution history, and client-side rejection of invalid or cross-athlete receipts.
- Two **unapplied** SQL drafts under `docs/operations/sql/`. Writer helpers in `private/coach-agent-writers.mjs` validate inputs, insert using an authenticated client and read back the new row. Persisted/delivered status requires independent source/destination verification callbacks supplied by future integration adapters.
- Fictional controlled journey and negative tests in `tests/coach-44-8-journey.test.mjs`; targeted tests passed at the November 4 checkpoint. This is not production RLS, browser, or device proof.

Source PRs #488–#492 are reference branches **already consolidated** into #493. Do not merge the duplicate feature branches separately after merging the consolidated branch.

## What is not done

1. Neither `public.coach_agent_execution_receipts` nor `public.coach_decision_version_links` existed in the **live FORM Athlete System** at the Nov 4 read-only checkpoint.
2. No numbered migrations have been generated through Supabase CLI, applied or verified. No agent execution writer is connected to a real source verifier, and no authenticated database end-to-end test exists.
3. Coach desktop/mobile signed-in visual and cross-account RLS testing remain open. A sign-in wall prevented prior private UI inspection; do not claim native or browser verification.
4. No production merge, Netlify deploy, publication, real-athlete plan change, or external message is authorized by this brief.

## Resume sequence for Codex / Claude Code

1. **Refresh sources first.** Inspect current `main`, draft #493 head/base/diff and review comments, production branch/deploy, current Supabase migration list and schema, and any newer coaching doctrine/feature decisions. Preserve unrelated dirty changes. Reconcile changed requirements into this brief before editing.
2. **Migrate in a controlled environment.** Use Supabase CLI's current `--help` and migration workflow; convert SQL drafts into numbered migrations after independently checking the actual schema. Check RLS, Data API grants, cross-athlete trigger, table ownership, immutable history, idempotency, and advisor results. Do not apply to production as a shortcut.
3. **Wire real writers.** Build owning-record and destination adapters that genuinely fetch source IDs and timestamps, rather than simply returning `true`. Exercise insert plus readback under signed-in coach credentials. An execution receipt's own saved row does not prove its underlying change was published.
4. **Run one fictional athlete journey.** Feedback → sourced coaching decision → explicit before/after version → filing → agent execution and source/destination receipts. Include missing data, same-day ambiguity, wrong athlete, duplicate key, denied account, failed readback and sign-out midrequest.
5. **Test the product.** Sign in as an authorized coach and an unrelated account; test desktop and iPhone widths, Staff versus Coach questions, athlete identity switching, loading/failure states, and links to original records. No fabricated numbers, no duplicate surfaces, no automatic review gates.
6. **Finish only after proof.** Run focused and full tests, database advisors, clean build, signed-in readback, review the exact release diff, and ask Brice for the 44.8 release decision. Merge/deploy is a separate authorized step.

## Change-reconciliation rule (important)

This is a **living handoff, not a claim that an automation is watching every conversation**. At each restart or before accepting newer PR work, compare this checkpoint against:

- Newer merged/unmerged PRs and their current commit hashes;
- Actual production schema and current migrations, grants and policies;
- New athlete-facing release decisions and the 44.6/44.7 scope boundary;
- Athlete feedback, training doctrine, consent defaults and approved-program exceptions;
- Coach UI changes and source owner contracts.

Record a short delta: **new evidence / changed decision / affected files or records / whether PR #493 already includes it / any new test / verification state**. Update the handoff and tests in the same PR as a meaningful 44.8 revision. If a change belongs to 44.6/44.7 or real athlete programming, link its owner instead of copying it into #493. If nothing changed, state **"rechecked; no relevant delta"** with the check date—do not silently assume freshness.

## Completion standard

Distinct states are **drafted, committed, migration applied, saved readback, delivered, native verified**. A GitHub PR, a task marked done, or a mocked green test cannot be promoted into a later state without its own evidence. The service is ready when agents can act within authority, prove what happened, and leave Brice with a useful coaching conversation—not a new pile of tasks.
