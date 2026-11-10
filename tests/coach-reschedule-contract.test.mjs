import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('coach console has a separate date-move form and keeps dose revision separate', () => {
  const html = read('coach/index.html');
  const js = read('coach/coach.js');
  assert.match(html, /id="rescheduleForm"/);
  assert.match(html, /name="withdrawSessionId"/);
  assert.match(js, /data-reschedule=/);
  assert.match(js, /rescheduleSession\(source\.id, source\.scheduled_on, target, reason, replacement\)/);
  assert.match(js, /This editor revises the workout only; it cannot move an existing session/);
});

test('the move is authenticated, atomic, audited, and refuses filed work', () => {
  const sql = read('supabase/migrations/20261110010000_coach_reschedule_planned_session.sql');
  assert.match(sql, /auth\.uid\(\) is null/);
  assert.match(sql, /is_coach_member\(source_row\.athlete_id\)/);
  assert.match(sql, /session_completions where planned_session_id = p_session_id/);
  assert.match(sql, /athlete_session_placements where planned_session_id = p_session_id/);
  assert.match(sql, /source_row\.scheduled_on is distinct from p_expected_date/);
  assert.match(sql, /insert into public\.planned_session_moves/);
  assert.match(sql, /perform public\.withdraw_session/);
  assert.match(sql, /grant execute on function public\.coach_reschedule_planned_session.*to authenticated/);
});

test('source readback checks both moved and withdrawn sessions', () => {
  const data = read('private/data.js');
  assert.match(data, /p_expected_date: expectedDate/);
  assert.match(data, /row\.scheduled_on === targetDate && row\.state === 'published'/);
  assert.match(data, /row\.id === withdrawSessionId && row\.state === 'cancelled'/);
});
