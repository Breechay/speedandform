# FORM Coach 44.8 — consolidated implementation handoff

**Release boundary:** Coach / Athletic Compound belongs to **44.8**. The athlete-facing 44.6 stability and 44.7 Speed + Strength release work remains separate. This branch is **draft**, with no production deploy, database migration or athlete plan mutation authorized by this document.

## Scope and owning PRs

| Source PR | Included | Integration state |
| --- | --- | --- |
| #488 | Staff tab, real operating queues, roster and filing exceptions | Code and focused tests |
| #489 | Agent execution receipt contract | Read-only Coach projection, draft schema and non-UI writer contract; no applied ledger or connected source verifier |
| #490 | Athlete feedback → later training chronology | Read-only bounded source index |
| #491 | Decision inputs → later filings | Read-only; subsequent events are not causal proof |
| #492 | Explicit decision → prescription version contract | Read-only Coach projection, draft schema and non-UI writer contract; no applied relationship table or live writer caller |

This integrated branch combines only the files from those five PRs, plus this handoff and asset cache revisions. The originals remain draft reference PRs; do not merge each duplicate change again after this integration branch merges.

## Signed-in product acceptance

1. Coach authentication: no private data before sign-in, anon denied, authorized coach sees their own source views, unauthorized account denied.
2. Staff desktop and iPhone widths: agent tasks versus coach questions clearly separated; no mock numbers, no fabricated run status, no auto action. Unknown roster/filing reads render as unknown rather than `0`.
3. Athlete Intelligence: exact athlete selected, correct source timestamps, filed sessions, observation provenance and supersession, and explicit linked evidence. One athlete's data must never leak into another.
4. Decision history: test at least one decision with explicit `decision_completions` and one with none. Linked completions are **decision inputs**; later filings are **chronology**. No inferred version ID, adaptation or automatic review gate.
5. Approved glute schedule remains untouched. No program changes, forged feed visibility, external communications or claim of native iOS proof.
6. Refresh after a failed RPC and after the browser regains visibility; source freshness never increases merely because the page rerendered.
7. A feedback observation stores an observed **date**, not an exact event timestamp. A filing on that same date is not classified as occurring afterward without separate time evidence.

## Backend implementation still required

- [Execution receipt ledger](AGENT_EXECUTION_LEDGER_HANDOFF_2026-11.md): generate Supabase migration with auth-scoped append-only record, bounded read projection, idempotent signed-in writer, and verified source/destination receipts.
- [Decision/version links](DECISION_VERSION_LINK_HANDOFF_2026-11.md): generate migration and authenticated writer, cross-athlete constraints, `before`/`after` version relation, strict RLS and no retroactive guess/backfill.

Two **unapplied SQL drafts** under `docs/operations/sql/` now show the intended tables and RLS boundaries. These are review material, not numbered migrations. Code must regenerate them through the normal CLI workflow, verify actual database grants and policies, and test in a controlled environment before production.

The Intelligence decision cards now make a bounded, authenticated read of `coach_decision_version_links` for the selected athlete's returned decision IDs, including the exact joined prescription version. A missing table, denied read, or identity mismatch remains **unavailable**, not an empty history. This UI is only a consumer: it does not create links or establish a causal outcome. Once the migration and writer are available, test joined FK permissions and the actual returned shape using an authorized coach, an unrelated coach, and an anonymous session.

The agent execution draft now includes an optional exact `athlete_id`, protected by active coach membership when present. The Intelligence view reads at most twelve receipts for the selected athlete, validates each receipt client-side, and explicitly withholds failed identity/proof checks. The browser never infers verification from a closed operating task. **This remains read-only and unavailable until its migration and authorized writer exist.** Test absent table, no entries, cross-athlete reads, bad receipt, saved-without-readback, delivered-without-destination proof, and sign-out during an in-flight read.

## Scope-freeze implementation contract

`private/coach-agent-writers.mjs` provides two non-UI writer functions for use only after real migrations and signed-in RLS validation. Each checks the coach identity, validates the exact athlete/owner IDs, inserts via the caller's authenticated client, and reads back the inserted row. Execution statuses `saved` or above additionally require a separate `verifySource` callback that must perform an actual owning-record read; `delivered` and `native_verified` require `verifyDestination` as well. A callback returning `true` is a **caller obligation**, not independently established evidence by this module. Do not invoke these writers directly from UI controls or pass fabricated booleans to the verifiers. Implement specific source adapters and log their genuine read results before enabling agent execution.

`tests/coach-44-8-journey.test.mjs` exercises a *fictional* athlete's feedback → decision → exact prescription version → subsequent filing → execution receipt, including authorization failure and unavailable readback. This is a mocked contract test, not production, native device, or database security verification.

**44.8 feature scope is frozen here.** Remaining work is integration and security: create numbered migrations with Supabase CLI, check the live schema and grants, write source-specific verification adapters, run anonymous/unrelated-coach RLS denial tests, verify signed-in responsive Coach views, then obtain the coach's release decision. Do not add speculative scores, inferred causal outcomes, automatic review gates, or new staff categories to this integration PR.

Read the [2026-11-04 live schema readiness checkpoint](COACH_44_8_LIVE_SCHEMA_READINESS_2026-11-04.md) before any migration or wiring work. The production read confirmed the two new tables are absent; pre-existing owning tables and grants were inspected without mutation.

For the concise restart order, current implementation inventory and change-reconciliation procedure, use the [44.8 resume brief](COACH_44_8_RESUME_BRIEF.md). If these documents disagree after subsequent changes, inspect the then-current owning source and reconcile both documents before implementation; neither historical brief is a substitute for a fresh read.

Do not put placeholders for these two unfinished backends into the live Staff dashboard. First verify schema and readback in a controlled environment; then add clearly source-typed panels.

## Release sequence

1. Rebase or merge the 44.8 draft only after 44.6/44.7 priorities are protected. Keep unrelated dirty-tree files out of commits.
2. Run all existing focused tests, full project tests, browser visual checks, RLS denial tests, and Supabase advisors for any actual migration.
3. Fix genuine failures, commit exact files, verify the released commit, and obtain Brice's release decision before production deployment.
4. Mirror to the `production` branch, verify Netlify reports the exact commit as ready, and recheck signed-in behavior.

**Definition of complete:** Verified release and source readbacks. An open PR, a green unit test or a marked-done task does not satisfy it.
