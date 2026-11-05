import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const coach = readFileSync(new URL('../../coach/coach.js', import.meta.url), 'utf8');
const feed = readFileSync(new URL('../../supabase/migrations/20261104230350_speed_44_6_feed.sql', import.meta.url), 'utf8');
const quiet = readFileSync(new URL('../../supabase/migrations/20261105043000_quiet_thursday_publication.sql', import.meta.url), 'utf8');

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
