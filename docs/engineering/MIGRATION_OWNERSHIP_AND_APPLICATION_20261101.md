# Migration ownership and the single application path (Nov 1, 2026)

**Status: process document and held migration. Nothing has been applied to any database.** Authoritative copy of this runbook: speedandform. FORM-iOS carries a pointer.

## Decision
1. **One application path.** Production migrations are applied **by hand, one file at a time, by Brice, from the repository that owns the migration**, after a read-only check of the target database's migration ledger. **Neither repository's `supabase db push` is ever used** (it applies every pending file in `migrations/`; that has already shipped an unapproved migration once, which is why `supabase/held/` exists). The file is then recorded in the ledger under its exact name.
2. **One owner per migration**, named in a manifest. A second repository may hold a **byte-identical mirror** for review traceability and tests; a mirror is never applied.
3. **A reviewed function-definition hash must match** before a function is redefined, in staging and in production.

## Why a ledger check, not a repo listing (read-only evidence, Nov 1)
- The production ledger (`supabase_migrations.schema_migrations`) has **300 rows**, last version `20261101145138`. Versions are **application timestamps** and often differ from the authored file timestamps, and sometimes the names differ too (file `20261027154500_week_mileage_published_only` vs ledger `20261027134639 week_mileage_published_prescriptions_only`).
- Several recent production migrations have **no file in either repository** (`form_home_field_remote_editorial_20261101`, `form_thursday_public_workout_detail`, `form_44_5_training_strength_days_20261030`). The ledger is ahead of both repos (FORM-iOS already says so in `docs/migrations/collective/README.md`).
- Therefore the only answer to "has this been applied?" is the target database's own ledger.

## Ownership
| Domain | Authoritative repo | Examples |
|---|---|---|
| Plans, publications, study and Miami functions, coach plan authoring | **speedandform** | `public_plan`, `public_plan_preview` (allowlist, this PR), `connected_study_plan`, `plan_publications`, `form_miami_*`, `write_session_version`, `file_session` |
| Collective, Field/Home work feed and roster, verified portraits, athlete-owned Week placements | **FORM-iOS** | `collective_work_*`, `collective_member_verified_portraits`, placement RPCs |
| Cross-cutting ACL hardening (client table privileges, EXECUTE revokes) | **FORM-iOS** | #219, #223 (exact signatures, pre-flight, snapshot) |
**Cross-repo hazard:** a speedandform migration that `DROP`s and recreates a function whose EXECUTE was hardened in FORM-iOS resets its grants to the defaults. Such a migration must restate the grants, and `supabase/ops/audit_anon_executable_functions.sql` (FORM-iOS) must be run afterwards.

## Procedure (every environment, in this order)
1. **Verify history, read-only:** run `supabase/ops/verify_migration_history.sql` on the target. Required: `already_recorded_by_name = 0`; note `ledger_size` and the last version; `reviewed_function_definition_md5` equals the reviewed hash below. Reviewed production values on Nov 1: ledger 300, last `20261101145138`, not recorded, hash `68866480ce502984eca14e47aff398dc`.
2. **Verify the file:** the migration's sha256 equals the one in `supabase/held/README.md` and in the FORM-iOS manifest (`node tests/migration-ownership.cjs`).
3. **Staging first.** Same steps, on a PostgreSQL 17 copy of the real schema (a branch or staging project). Apply with the hash set: `set form.expected_preview_md5 = '68866480ce502984eca14e47aff398dc';` then run the file. It aborts, changing nothing, if the hash is missing or different, if the ledger already records the name, or if the signature has drifted.
4. **Staging acceptance:** the PG16 suite results do not substitute for this. Required on staging: the hash gate passed; `race-pace-durability` preview unchanged; Simon and Elijah study functions unchanged; athlete-specific slugs return null; revoke/restore checks; then guest, athlete, coach and publisher smoke tests (website study pages and the iOS preview).
5. **Production** only on Brice's explicit approval: repeat steps 1-3, move the file from `supabase/held/` to `supabase/migrations/` in the same commit that records the approval, apply by hand, then record in the ledger as `public_plan_preview_allowlist` (the migration refuses a second route by checking that name).
6. **After:** update the mirror manifest (`status`, ledger version, date) and run the audit queries again.

## What the allowlist file guards (completed PostgreSQL 16 tests, FORM-iOS `supabase/tests/public_functions`, 43 assertions + 6 shell checks)
Reviewed-hash required; wrong hash aborts; ledger-already-recorded aborts; unrelated ledger history applies; re-apply with the old hash is refused after the function changes; the SQL is idempotent under an explicit harness-only bypass; preview payload for `race-pace-durability` identical before/after; athlete slugs null; study functions unchanged; withdrawal still works; recovery from the stored definition works.

## Staging gates (NOT done; not covered by the PG16 tests)
PostgreSQL 17 behaviour; the real function text hashing to `68866480…` in the staging copy; real-schema ledger and permissions; guest/athlete/coach/publisher smoke tests; the website study pages and iOS preview against the migrated database.

## This PR does not
Apply anything, move any other migration, or change production. It adds the held file, this runbook, the read-only history query and a test.
