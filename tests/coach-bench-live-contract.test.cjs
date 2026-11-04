const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dataSource = fs.readFileSync(path.join(__dirname, '../private/data.js'), 'utf8');
const weekSource = fs.readFileSync(path.join(__dirname, '../coach/labs/labs.js'), 'utf8');

test('Coach bench next, today and coming lists use only published sessions', () => {
  const bench = dataSource.split('export async function loadCoachBench')[1]
    .split('export async function loadAttentionFor')[0];
  assert.match(bench, /const mine = sessions\.filter\([^\n]+isPublishedPlanSession\(session\)/);
  assert.match(bench, /const coming = sessions\s*\.filter\(\(session\) => isPublishedPlanSession\(session\)/);
  assert.match(bench, /coming: sessions\.filter\(\(session\) => isPublishedPlanSession\(session\)/);
});

test('Week grid shows only published work and true unresolved holds', () => {
  assert.match(weekSource, /const mine = sessions\.filter\(\(session\) => session\.scheduled_on === date && isPublishedPlanSession\(session\)\)/);
  assert.match(weekSource, /const held = visibleHeldCoachSessions\(sessions, date, asCoach\(\)\)/);
});

test('A withdrawn 12-mile predecessor cannot replace Hope\'s published 4-mile work in the roster', async () => {
  const { isPublishedPlanSession, visibleHeldCoachSessions } =
    await import('../private/coach-bench-live.mjs');
  const old = { id: 'withdrawn-12', scheduled_on: '2026-11-07',
    state: 'cancelled', role: 'key', withdrawn_at: '2026-10-26',
    withdrawn_reason: 'Reconstructed 4 September' };
  const live = { id: 'published-4', scheduled_on: '2026-11-07',
    state: 'published', role: 'key' };
  const sessions = [old, live];
  assert.deepEqual(sessions.filter(isPublishedPlanSession).map((row) => row.id), ['published-4']);
  assert.deepEqual(visibleHeldCoachSessions(sessions, '2026-11-07', true), []);
});

test('A genuine withdrawal without a replacement remains coach-visible', async () => {
  const { visibleHeldCoachSessions } = await import('../private/coach-bench-live.mjs');
  const hold = { scheduled_on: '2026-11-06', state: 'cancelled',
    withdrawn_at: '2026-10-26', withdrawn_reason: 'PT-guided rest' };
  assert.deepEqual(visibleHeldCoachSessions([hold], '2026-11-06', true), [hold]);
  assert.deepEqual(visibleHeldCoachSessions([hold], '2026-11-06', false), []);
  assert.deepEqual(visibleHeldCoachSessions(
    [{ ...hold, withdrawn_reason: 'Superseded by new plan' }], '2026-11-06', true), []);
});
