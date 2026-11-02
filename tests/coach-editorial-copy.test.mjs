import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const source = read('private/editorial-copy.js');
const editorial = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source));
const { STRENGTH_EMPHASIS, suggestRunIntent, validateAthleteCopy, buildEditorialProposal } = editorial;
const migration = read('supabase/migrations/20261102170000_coach_editorial_copy_publication.sql');

test('all 14 currently published strength titles have concrete reviewed descriptions', () => {
  const titles = [
    'Frame A','Frame B','Glute A · Hinge','Glute A + Lower','Glute B · Thrust',
    'Lower A','Lower B','Lower Primer','Lower Restore','Pull','Pull + Arms + Delts',
    'Upper A','Upper B','Upper Push + Shoulders'
  ];
  assert.deepEqual(Object.keys(STRENGTH_EMPHASIS).sort(), titles.sort());
  for (const description of Object.values(STRENGTH_EMPHASIS)) {
    assert.equal(validateAthleteCopy(description, 120), null);
    assert.ok(migration.includes(description), 'SQL and client mapping must agree');
  }
});

test('running descriptions retain dose and pace in the authoritative structured plan', () => {
  for (const title of [
    '3 × 1 mi · steady','Easy · 5 mi','Easy + strides · 6 mi',
    'Long run · 12 mi easy','Track · 3 × 400m',
    'Track · 2 × 300m + 2 × 200m','30 min easy','3 × 5 min controlled'
  ]) {
    assert.equal(validateAthleteCopy(suggestRunIntent(title)), null, title);
  }
});

test('private admin copy, boilerplate repetition, and blank publication fail closed', () => {
  for (const bad of ['', 'Draft: publish this later', 'Coach-only internal note',
    'Hip extension · Hip extension', 'This is repeated. This is repeated.']) {
    assert.ok(validateAthleteCopy(bad), bad);
  }
});

test('batch proposals reference exact source identities but never rewrite prescriptions', () => {
  const review = { schema_version: 1,
    strength: [{ day_id: 'day-1', athlete_id: 'athlete', title: 'Glute B · Thrust',
      forge_program_id:'sculpt_v1', forge_program_digest:'digest',
      exercises:[{name:'Hip Thrust',sets:3,reps:10}] }],
    running: [{ session_id:'session-1',version_id:'version-3',athlete_id:'athlete',
      title:'Easy · 5 mi',details:'5 mi easy at 8:00/mi or slower',
      prescribed_distance:5,pace_low:'8:00/mi' }]
  };
  const before = JSON.stringify(review);
  const proposed = buildEditorialProposal(review);
  assert.equal(proposed.strength[0].emphasis, 'Glutes · hip extension · stability');
  assert.equal(proposed.running[0].intent, 'Relaxed aerobic running · keep breathing conversational');
  assert.deepEqual(Object.keys(proposed.strength[0]).sort(),
    ['day_id','title','forge_program_id','forge_program_digest','emphasis'].sort());
  assert.deepEqual(Object.keys(proposed.running[0]).sort(),
    ['session_id','version_id','title','intent'].sort());
  assert.equal(JSON.stringify(review), before, 'the prescription is not mutated in memory');
});

test('authenticated publishing RPC is the only editorial write surface', () => {
  const data = read('private/data.js'), coach = read('coach/coach.js'), html = read('coach/index.html');
  assert.match(data, /supabase\.rpc\('coach_copy_review'/);
  assert.match(data, /supabase\.rpc\('coach_publish_editorial_copy'/);
  assert.doesNotMatch(data, /supabase\.from\('athlete_direction_drafts'\)/);
  assert.match(migration, /public\.is_active_coaching_administrator\(coach_id\)/);
  assert.match(migration, /public\.is_coach_member\(session_row\.athlete_id\)/);
  assert.match(migration, /previous\.coach_note/);
  assert.match(migration, /previous\.prescribed_distance/);
  assert.match(migration, /previous\.pace_low/);
  assert.match(migration, /previous\.shape/);
  assert.match(coach, /ATHLETE VISIBLE/);
  assert.match(html, /INTERNAL ONLY/);
  assert.match(coach, /server readback/);
});
