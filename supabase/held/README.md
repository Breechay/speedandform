# Held migrations

Written, dry-run clean, deliberately not applied. `supabase db push` takes every
pending file in `migrations/`, so a migration that is waiting on a decision has
to physically leave that directory or it ships with the next unrelated push.
That has happened once already.

- `20260829290000_field_group_memberships.sql` — Field authorization. Field is
  closed at the relay and stays closed. This migration is the authenticated
  replacement, and it does not move until its lifecycle safeguards (grant
  provenance, revocation without deleting identity, append-only grant history,
  retention, a checker rejecting client-writable memberships) are written and
  Brice has read them. Coaching uploads must never be mixed into it.
- `20261101230000_public_plan_preview_allowlist.sql` · restricts `public_plan_preview` to an explicit allowlist
  (`race-pace-durability` only) so an athlete-specific published slug cannot be previewed. Approved in design by Brice
  (Nov 1, 2026), **not applied**. This is the AUTHORITATIVE copy; FORM-iOS holds a byte-identical mirror
  (`supabase/mirrors/speedandform/`, sha256 `ef9ff7547e573ac7c54e999c5428bb7a0162b10dc98ba35f4bb58fd24b99766b`). It requires the reviewed function-definition hash
  (`form.expected_preview_md5`) and refuses to run if the migration ledger already records it. It moves into
  `migrations/` only on Brice's explicit approval, after staging verification, and is then applied by hand per
  `docs/engineering/MIGRATION_OWNERSHIP_AND_APPLICATION_20261101.md`. Do not run `supabase db push` while it is here or there.
