import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261107021500_coach_scheduled_block_handoff.sql');
const data = read('private/data.js');
const coach = read('coach/coach.js');
const html = read('coach/index.html');

test('new Console and shared data modules parse as JavaScript modules', () => {
  for (const file of ['private/data.js', 'coach/coach.js']) {
    const check = spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: read(file), encoding: 'utf8'
    });
    assert.equal(check.status, 0, file + ': ' + check.stderr);
  }
});

test('scheduling is a separate coach-authorized write, never author_block', () => {
  assert.match(migration, /function public.schedule_training_block\(/);
  assert.match(migration, /is_coach_member\(p_athlete_id\)/);
  assert.match(migration, /p_starts_on <= active_end/);
  assert.match(migration, /status = 'scheduled'/);
  assert.match(migration, /one_scheduled_block_per_athlete_idx/);
  const scheduler = migration.split('function public.schedule_training_block(')[1]
    .split('function coach_audit_private.activate_due_training_blocks()')[0];
  assert.doesNotMatch(scheduler, /set status = 'complete'/);
  assert.doesNotMatch(data.split('export async function scheduleTrainingBlock')[1]
    .split('export async function fileSession')[0], /rpc\('author_block'/);
});

test('automatic handoff requires publication in every week and does not overlap', () => {
  const activation = migration.split('function coach_audit_private.activate_due_training_blocks()')[1];
  assert.match(activation, /s\.state = 'published'/);
  assert.match(activation, /s\.scheduled_on between w\.starts_on and w\.ends_on/);
  assert.match(activation, /weeks_with_work <> candidate\.total_weeks/);
  assert.match(activation, /a\.ends_on >= candidate\.starts_on/);
  assert.match(activation, /set status = 'complete'/);
  assert.match(activation, /set status = 'active'/);
  assert.match(activation, /America\/New_York/);
  assert.match(activation, /cron\.schedule/);
  assert.match(activation, /revoke all on function coach_audit_private\.activate_due_training_blocks\(\) from public, anon, authenticated/);
});

test('coach data selects only the requested active or scheduled block', () => {
  assert.match(data, /loadAthleteRecord\(athleteId, \{ coach = false, blockId = null \}/);
  assert.match(data, /blockId && !coach/);
  assert.match(data, /week => week\.block_id === selectedBlock\?\.id/);
  assert.match(data, /sessions: blockSessions/);
  assert.match(data, /availableBlocks: availableBlocks \|\| \[\]/);
  assert.match(data, /blockResponse\.data\?\.status !== 'scheduled'/);
  assert.match(data, /weekResponse\.data\?\.length !== payload\.totalWeeks/);
  assert.match(data, /do not duplicate|attempting another write/i);
});

test('Console makes block scheduling and dated session publication reachable', () => {
  assert.match(html, /id="blockDialog"/);
  assert.match(html, /id="blockForm"/);
  assert.match(html, /name="startsOn"/);
  assert.match(coach, /id="newBlock"/);
  assert.match(coach, /id="blockPicker"/);
  assert.match(coach, /openBlockDialog/);
  assert.match(coach, /scheduleTrainingBlock\(/);
  assert.match(coach, /sessionForm\.elements\.scheduledOn\.required = !plannedSessionId/);
  assert.match(coach, /payload\.scheduledOn > week\.ends_on/);
  assert.match(coach, /loadAthleteRecord\(selectedId, \{ coach: true, blockId: selectedBlockId \}/);
});
