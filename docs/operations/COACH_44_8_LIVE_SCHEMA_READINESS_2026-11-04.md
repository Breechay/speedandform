# FORM Coach 44.8 — live schema readiness checkpoint

**Checked:** 2026-11-04, FORM Athlete System (`pbgsjjegycacodiltbhn`). Read-only SQL and Supabase security advisors; no DDL, seed records, application writes or production deployment.

## Observed

- `public.decisions`, `public.planned_sessions`, `public.planned_session_versions` and `public.athlete_memberships` exist. Exact decision, planned session, session version and athlete identities are UUIDs.
- The two draft 44.8 tables, `public.coach_agent_execution_receipts` and `public.coach_decision_version_links`, **do not exist** in the checked database.
- All four existing tables have RLS enabled, `authenticated` SELECT privileges, and no `anon` SELECT privilege. This does **not** establish row-policy correctness for any signed-in account.
- `public.operating_console_owner()` is executable by `authenticated` and not by `anon`. `public.is_coach_member(uuid)` is executable by both, but must return false for anonymous sessions based on its `auth.uid()` predicate; independently test this after migration.
- The security advisor returned an informational set of `rls_enabled_no_policy` findings in private schemas. This broad result is not evidence of a new 44.8 vulnerability and must not be silently “fixed” as part of this scoped PR. See [Supabase advisory documentation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Blocking release checks

1. Generate numbered migrations from the two reviewed draft SQL files using the installed Supabase CLI in the implementation environment, after checking current database schema and CLI `--help`. Run them in a controlled environment first. Do not apply the drafts as ad-hoc production SQL.
2. Verify table exposure and exact table grants separately from RLS. Verify UUID FKs, same-athlete trigger, append-only policy, author/owner defaults, duplicate-key behavior, and PostgreSQL privileges.
3. Test authenticated owner, authenticated unrelated coach, athlete-only account, and anonymous account against both direct table reads/writes and joined version reads. Assert denied cross-athlete inserts, reads, updates and deletes.
4. Implement independently verified source adapters for receipt statuses, with source IDs and timestamps derived from real owning-record reads; verify destination independently for delivered/native states. A readback of the new receipt row alone cannot prove the plan was saved or shown to an athlete.
5. Run a controlled athlete scenario end to end against a **non-production** environment, then signed-in Coach desktop/mobile checks. Observe the exact returned PostgREST join shape and browser error states.
6. Re-run security/performance advisors and complete a post-deploy readback only after explicit release authorization. Preserve the 44.6/44.7 boundaries and approved athlete plans.

## Current evidence limit

`tests/coach-44-8-journey.test.mjs` proves the local writer/projection contract using fictional records and a fake RLS-bound client. It does not prove Supabase policy behavior, native FORM rendering, or background agent execution. Do not mark those release gates complete from unit-test results.
