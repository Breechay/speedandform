import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationURL = new URL(
  '../../supabase/migrations/20261106133000_collective_work_feed_v2_rep_splits.sql',
  import.meta.url,
);

const sql = await readFile(migrationURL, 'utf8');
const normalized = sql.toLowerCase();

test('Field v2 is additive and exposes the documented split keys', () => {
  assert.match(sql, /create or replace function public\.collective_work_feed_v2\s*\(/i);
  assert.match(sql, /rep_splits jsonb/i);
  assert.match(sql, /'position',\s*piece\.position/i);
  assert.match(sql, /'distanceMeters'/);
  assert.match(sql, /'durationMs'/);
  assert.match(sql, /'distanceSource'/);
  assert.match(sql, /order by piece\.position/i);
  assert.doesNotMatch(sql, /create or replace function public\.collective_work_feed\s*\(/i);
});

test('Field v2 retains publication, roster, revocation, and evidence gates', () => {
  assert.match(sql, /collective_work_internal\.publication_allowed\(p\.athlete_id\)/i);
  assert.match(sql, /public\.collective_work_viewer_on_roster\(\)/i);
  assert.match(sql, /p\.revoked_at is null/i);
  assert.match(sql, /completion\.id=p\.source_completion_id/i);
  assert.match(sql, /completion\.athlete_id=p\.athlete_id/i);
  assert.match(sql, /completion\.timing_source is distinct from 'strava'/i);
  assert.match(sql, /piece\.kind='rep'/i);
  assert.match(
    sql,
    /coalesce\(correction\.distance_m::numeric,[\s\S]*?case piece\.distance_unit[\s\S]*?end\)>0/i,
  );
});

test('Field v2 is authenticated-only and contains no sensitive response fields', () => {
  assert.match(normalized, /revoke all on function public\.collective_work_feed_v2[\s\S]*from public,anon/);
  assert.match(normalized, /grant execute on function public\.collective_work_feed_v2[\s\S]*to authenticated/);

  for (const forbidden of [
    'athlete_note',
    'coach_note',
    'symptoms',
    'strava_url',
    'medical_data',
    'health_data',
    'private_plan',
  ]) {
    assert.equal(normalized.includes(forbidden), false, `${forbidden} must stay out of Field v2`);
  }
});
