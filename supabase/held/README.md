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
- `20261006190000_structured_strength_exercises.sql` — Structured strength
  exercises (`planned_session_exercises`), the additive `athlete_plan_feed`
  wrapper, and the Adrian backfill (58 sessions / 388 exercises, reconciled to the
  live current versions and verified 58/58). Authored and
  tested (`tests/structured-strength-exercises-db.mjs`, isolated PGlite), applied
  nowhere. It moves to `migrations/` only when Brice approves, and only after the
  live `athlete_plan_feed` / `athlete_plan_feed_impl` definitions have been diffed
  against this repository's chain.
