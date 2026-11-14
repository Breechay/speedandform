import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const coach = readFileSync(new URL('../../coach/coach.js', import.meta.url), 'utf8');
const feed = readFileSync(new URL('../../supabase/migrations/20261104230350_speed_44_6_feed.sql', import.meta.url), 'utf8');
const scoring = readFileSync(new URL('../../supabase/migrations/20261104230300_speed_44_6_scoring.sql', import.meta.url), 'utf8');
const strength = readFileSync(new URL('../../supabase/migrations/20261104230600_strength_44_6_feed.sql', import.meta.url), 'utf8');
const quiet = readFileSync(new URL('../../supabase/migrations/20261105043000_quiet_thursday_publication.sql', import.meta.url), 'utf8');
const rollout = readFileSync(new URL('../../supabase/migrations/20261105170000_form_44_7_exact_tab_rollout.sql', import.meta.url), 'utf8');
const seasonCorrection = readFileSync(new URL('../../supabase/migrations/20261105172000_speed_season_canonical_dates_and_work_pace.sql', import.meta.url), 'utf8');
const vaultRead = readFileSync(new URL('../../supabase/migrations/20261105173000_speed_vault_catalogue_entitled_read.sql', import.meta.url), 'utf8');

test('pace denominator comes from the authored plan, not rep distance', () => {
  assert.match(coach, /version\?\.distance_unit \|\| work\.distance_unit/);
  assert.match(coach, /version\.distance_unit \|\| part\.distance_unit/);
  assert.match(feed, /'paceLowSeconds',component\.pace_low_seconds/);
  assert.doesNotMatch(feed, /component\.pace_low_seconds\*1\.609344/);
});

test('Thursday batch publication is email-quiet but keeps its in-app receipt', () => {
  const insertNotice = quiet.indexOf('insert into public.form_miami_notifications');
  const quietReturn = quiet.indexOf("p_source like 'thursday:%'");
  const insertEmail = quiet.indexOf('insert into public.form_miami_email_outbox');
  assert.ok(insertNotice >= 0 && quietReturn > insertNotice && insertEmail > quietReturn);
});

test('the full library remains visible while launchability is publication-owned', () => {
  assert.match(feed, /'launchable',s\.published/);
  assert.match(feed, /where exists\(select 1 from authorized\)/);
  assert.doesNotMatch(feed, /where s\.published and exists/);
});

test('Vault aggregation consumes scored rows carrying completion identity', () => {
  assert.match(scoring, /select t\.completion_id,t\.rep_position/);
  assert.match(scoring, /from attempt a join scored s on s\.completion_id=a\.id/);
  assert.doesNotMatch(scoring, /from attempt a join target s on s\.completion_id=a\.id/);
});

test('nested feed aggregates apply empty-array fallback outside their subquery', () => {
  assert.doesNotMatch(feed, /\),'\[\]'::jsonb\)\n\s*from public\.planned_session_components/);
  assert.doesNotMatch(feed, /\),'\[\]'::jsonb\)\n\s*from public\.session_pieces/);
});

test('Strength JSON extraction is parenthesized before comparison and formatting', () => {
  assert.match(strength, /\(s\.elem->>'movementId'\)=\(e\.elem->>'movement_id'\)/);
  assert.match(strength, /\(e\.elem->>'sets'\)\|\|' × '\|\|\(e\.elem->>'reps'\)/);
});

test('44.7 tabs remain a database-backed nine-athlete Speed and Brice-only Strength pilot', () => {
  for (const slug of ['jose', 'hope', 'tinius', 'brice', 'anthony', 'megan-bolan', 'adrian', 'saul-licona', 'elijah']) {
    assert.match(rollout, new RegExp(`'${slug}'`));
  }
  assert.match(rollout, /v_speed <> 9 or v_strength <> 1/);
  assert.match(rollout, /strength_enabled = \(athlete\.slug = 'brice'\)/);
  assert.doesNotMatch(rollout, /tyler-odwin/);
});

test('Season uses canonical session dates and never substitutes whole-activity pace for filed work', () => {
  assert.match(feed, /planned\.scheduled_on/);
  assert.match(feed, /work\.kind='rep'/);
  assert.match(feed, /sum\(coalesce\(work\.duration_seconds_exact,work\.duration_seconds::numeric\)\)/);
  assert.match(seasonCorrection, /date projection did not match reviewed source/);
  assert.match(seasonCorrection, /work-pace projection did not match reviewed source/);
});

test('Vault RLS exposes the catalogue only to entitled athletes while publication owns launchability', () => {
  assert.match(vaultRead, /membership\.user_id=auth\.uid\(\)/);
  assert.match(vaultRead, /access\.speed_enabled/);
  assert.match(vaultRead, /membership\.status='active'/);
  assert.doesNotMatch(vaultRead, /update public\.vault_sessions set published=true/);
});
