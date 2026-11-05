import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20261105113000_halo_announcements_and_thursday_rollover.sql', import.meta.url), 'utf8');

test('Halo snapshots recipients and never exposes a broad announcement read', () => {
  assert.match(migration, /form_home_announcement_recipients/);
  assert.match(migration, /drop policy if exists form_home_team_member_read/);
  assert.match(migration, /r\.account_id=\(select auth\.uid\(\)\)/);
  assert.match(migration, /confirmed_closeout_required/);
  assert.match(migration, /c\.witness_confirmed/);
  assert.doesNotMatch(migration, /grant\s+select\s+on\s+public\.form_home_team_announcements/i);
});

test('Halo delivery is push-opt-in and has no publication email path', () => {
  assert.match(migration, /push_preferences/);
  assert.match(migration, /p_enable_push/);
  assert.match(migration, /New message from Brice/);
  assert.doesNotMatch(migration, /form_miami_email_outbox/);
  assert.doesNotMatch(migration, /coach_messages/);
});

test('Thursday rollover is guarded, idempotent, quiet and deliberately unscheduled', () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /form_miami_rollover_exceptions/);
  assert.match(migration, /current_run\.starts_at\+interval '2 hours'/);
  assert.match(migration, /p_dry_run/);
  assert.match(migration, /form_miami_rollover_receipts/);
  assert.match(migration, /publication\.payload->>'title'/);
  assert.doesNotMatch(migration, /cron\.schedule\s*\(/);
  assert.doesNotMatch(migration, /queue_notice|collective_notifications|email_outbox/);
});
