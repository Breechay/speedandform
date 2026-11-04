# FORM Coach 44.8 — consolidated implementation handoff

**Release boundary:** Coach / Athletic Compound belongs to **44.8**. The athlete-facing 44.6 stability and 44.7 Speed + Strength release work remains separate. This branch is **draft**, with no production deploy, database migration or athlete plan mutation authorized by this document.

## Scope and owning PRs

| Source PR | Included | Integration state |
| --- | --- | --- |
| #488 | Staff tab, real operating queues, roster and filing exceptions | Code and focused tests |
| #489 | Agent execution receipt contract | No ledger table or writer yet |
| #490 | Athlete feedback → later training chronology | Read-only bounded source index |
| #491 | Decision inputs → later filings | Read-only; subsequent events are not causal proof |
| #492 | Explicit decision → prescription version contract | No relationship table or writer yet |

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

Do not put placeholders for these two unfinished backends into the live Staff dashboard. First verify schema and readback in a controlled environment; then add clearly source-typed panels.

## Release sequence

1. Rebase or merge the 44.8 draft only after 44.6/44.7 priorities are protected. Keep unrelated dirty-tree files out of commits.
2. Run all existing focused tests, full project tests, browser visual checks, RLS denial tests, and Supabase advisors for any actual migration.
3. Fix genuine failures, commit exact files, verify the released commit, and obtain Brice's release decision before production deployment.
4. Mirror to the `production` branch, verify Netlify reports the exact commit as ready, and recheck signed-in behavior.

**Definition of complete:** Verified release and source readbacks. An open PR, a green unit test or a marked-done task does not satisfy it.
