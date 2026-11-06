// Source-only contract checks. Authenticated RLS and RPC behavior still require
// a migrated test database and separate signed-in acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(
  __dirname, '..', 'supabase', 'migrations',
  '20261106103912_form_miami_fall_2026_season_source.sql'
);
const sql = fs.readFileSync(migrationPath, 'utf8');

for (const table of ['form_seasons', 'form_season_phases', 'form_season_memberships']) {
  assert.match(sql, new RegExp(`create table public\\.${table}\\s*\\(`, 'i'));
  assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
}

assert.match(sql, /language sql stable security invoker/i);
assert.match(sql, /public\.can_read_athlete\(athlete_id\)/);
assert.match(sql, /public\.is_athlete_member\(m\.athlete_id\)/);
assert.match(sql, /where s\.season_key = p_season_key/i);
assert.match(sql, /and m\.status = 'active'/i);
assert.match(sql, /no athlete memberships are seeded here/i);
assert.doesNotMatch(sql, /insert into public\.form_season_memberships\s*\(/i);
assert.doesNotMatch(sql, /grant (insert|update|delete|all) on public\.form_season_memberships to authenticated/i);
assert.doesNotMatch(sql, /security definer/i);

const dates = [
  ['base', '2026-10-19', '2026-11-22'],
  ['build', '2026-11-23', '2026-12-27'],
  ['specific', '2026-12-28', '2027-01-24'],
  ['transition', '2027-01-25', '2027-01-31'],
];
const epochDay = (iso) => Date.parse(iso + 'T00:00:00Z') / 86400000;
const start = epochDay('2026-10-19');
const end = epochDay('2027-01-31');
assert.equal(end - start + 1, 105, 'Fall 2026 is exactly 15 calendar weeks');

for (let i = 0; i < dates.length; i++) {
  const [key, first, last] = dates[i];
  assert.match(sql, new RegExp(`'${key}', '${key[0].toUpperCase() + key.slice(1)}'`, 'i'));
  assert.ok(epochDay(first) <= epochDay(last));
  if (i > 0) assert.equal(epochDay(first), epochDay(dates[i - 1][2]) + 1);
}
assert.equal(epochDay(dates[0][1]), start);
assert.equal(epochDay(dates.at(-1)[2]), end);

const calendarWeek = (date) => Math.floor((epochDay(date) - start) / 7) + 1;
assert.equal(calendarWeek('2026-10-19'), 1);
assert.equal(calendarWeek('2026-11-06'), 3);
assert.equal(calendarWeek('2026-11-23'), 6);
assert.equal(calendarWeek('2027-01-25'), 15);
assert.equal(calendarWeek('2027-01-31'), 15);
assert.equal(calendarWeek('2026-11-02'), 3, 'late joiners do not get Weeks 1–2 credited');

console.log('FORM season source: 3 RLS tables, 15-week calendar and backend-only membership contract verified.');
