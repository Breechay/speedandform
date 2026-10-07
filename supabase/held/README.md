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
- `20261007120000_forge_session_state_and_receipt_version.sql` — Forge session
  state and the receipt's exact prescription: receipts name the immutable version
  they were performed against (validated, additive); `forge_session_events`
  (opened / left, append-only, idempotent, one validated RPC); and the Console
  read models `forge_athlete_state` and `forge_receipt_movements` (security-invoker
  views). Authored and tested (`tests/forge-session-state-db.mjs`, against the real
  native-receipt contract), applied nowhere. It depends on the structured-strength
  migration and on the live `forge_strength_receipts` / `submit_forge_native_receipt`
  (from FORM-iOS); it refuses to run if either is missing. Promote only with Brice's
  approval, after diffing the live receipt trigger and RPC against
  `tests/fixtures/forge-native-receipts-contract.sql`.
