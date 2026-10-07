// Structured strength exercises: schema, additive feed, Adrian backfill, isolation, versioning.
// Runs the real migration history in an isolated PGlite database. Never connects to a hosted one.
//   SF_PGLITE_PATH=/tmp/sf-email-db/node_modules/@electric-sql/pglite/dist/index.js node tests/structured-strength-exercises-db.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openPglite, replaySchema, fixture, as, PLATFORM_ONLY } from './support/replay-schema.mjs';
import { MIGRATION } from '../scripts/generate-structured-strength-migration.mjs';

const THIS = '20261006190000_structured_strength_exercises.sql';
let checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks += 1; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks += 1; };
const rejects = async (fn, pattern, message) => {
  let error = null;
  try { await fn(); } catch (e) { error = e; }
  ok(error, `${message}: expected a rejection`);
  ok(pattern.test(String(error.message)), `${message}: got "${error?.message}"`);
};
const rows = async (db, sql, args = []) => (await db.query(sql, args)).rows;
const stripClock = (feed) => { const { synced_at, ...rest } = feed; return rest; };
const withoutExercises = (feed) => ({
  ...stripClock(feed),
  sessions: feed.sessions.map(({ exercises, ...session }) => session)
});

// ── Pre-state: everything before this migration, then production-shaped fixtures ──────────
const db = await openPglite();
const pre = await replaySchema({ db, upTo: '20261006180000' });
eq(pre.ddlFailures.filter((f) => !PLATFORM_ONLY.has(f.file)), [], 'the schema history before this migration replays');

// The migration carries its own frozen snapshot of Adrian's program. The test reads THAT, not the
// live program.json: an applied migration is history and must keep passing after the program is
// revised (revisions are new versions, not a rewritten migration).
const migrationSql = fs.readFileSync(MIGRATION, 'utf8');
const spec = JSON.parse(/\$spec\$(.*?)\$spec\$/s.exec(migrationSql)[1]);
const adrian = await fixture(db, { slug: 'adrian', weeks: 16 });
const offset = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekIds = new Map();
for (const w of [...new Set(spec.map((x) => x.week))].sort((a, b) => a - b)) {
  const first = spec.find((x) => x.week === w);
  const starts = addDays(first.scheduled_on, -offset[first.day_label]);
  const r = await rows(db, `insert into public.training_weeks(athlete_id, block_id, week_number, starts_on, ends_on, state)
    values ($1,$2,$3,$4,$5,'planned') returning id`, [adrian.athlete, adrian.block, w, starts, addDays(starts, 6)]);
  weekIds.set(w, r[0].id);
}
let position = 0;
for (const s of spec) {
  const ps = await rows(db, `insert into public.planned_sessions(athlete_id, week_id, day_label, position, scheduled_on, state)
    values ($1,$2,$3,$4,$5,'published') returning id`, [adrian.athlete, weekIds.get(s.week), s.day_label, (position += 1), s.scheduled_on]);
  // Exactly what the original Adrian migration wrote: prose details, no structure.
  await db.query(`insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape)
    values ($1,$2,1,$3,'Strength',$4,'strength')`, [adrian.athlete, ps[0].id, s.title, s.details]);
}

// A running athlete with a structured running component: must be untouched by all of this.
const runner = await fixture(db, { slug: 'runner' });
const runnerWeek = (await rows(db, `insert into public.training_weeks(athlete_id, block_id, week_number, starts_on, ends_on, state)
  values ($1,$2,1,'2026-09-14','2026-09-20','in_progress') returning id`, [runner.athlete, runner.block]))[0].id;
const runnerSession = (await rows(db, `insert into public.planned_sessions(athlete_id, week_id, day_label, position, scheduled_on, state)
  values ($1,$2,'Mon',1,'2026-09-14','published') returning id`, [runner.athlete, runnerWeek]))[0].id;
const runnerVersion = (await rows(db, `insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape, prescribed_distance, distance_unit)
  values ($1,$2,1,'Easy run','Easy','Easy 4 mi','continuous',4,'mi') returning id`, [runner.athlete, runnerSession]))[0].id;
await db.query(`insert into public.planned_session_components(athlete_id, version_id, position, role, shape, distance, distance_unit)
  values ($1,$2,1,'work','continuous',4,'mi')`, [runner.athlete, runnerVersion]);

const feedFor = (user, athlete) => as(db, user, async () => (await db.query('select public.athlete_plan_feed($1) r', [athlete])).rows[0].r);
const adrianBefore = await feedFor(adrian.athleteUser, adrian.athlete);
const runnerBefore = await feedFor(runner.athleteUser, runner.athlete);
eq(adrianBefore.sessions.length, 58, 'Adrian has 58 published sessions before the migration');
ok(adrianBefore.sessions.every((s) => !('exercises' in s)), 'no session carries exercises before the migration');

// ── Apply the real migration file ────────────────────────────────────────────────────────
await db.exec(migrationSql);

// ── Backfill: all 58, matching what the app ships ───────────────────────────────────────
eq((await rows(db, 'select count(*)::int n from public.planned_session_exercises'))[0].n, 388, 'the migration structured all 388 exercises');
const adrianAfter = await feedFor(adrian.athleteUser, adrian.athlete);
eq(adrianAfter.sessions.filter((s) => s.exercises).length, 58, 'every Adrian session now carries exercises');

const reference = JSON.parse(fs.readFileSync(new URL('./fixtures/forge-adrian-reference.json', import.meta.url), 'utf8'));
const dayIndex = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
const referenceById = new Map(reference.sessions.map((s) => [s.sessionId, s]));
let compared = 0;
for (const session of adrianAfter.sessions) {
  const spec1 = spec.find((s) => s.scheduled_on === session.scheduled_on);
  const ref = referenceById.get(`adrian_runner_mass_w${spec1.week}_d${dayIndex[spec1.day_label]}`);
  ok(ref, `Forge has a bundled session for ${session.scheduled_on}`);
  eq(session.version.title, ref.sessionName, `title ${session.scheduled_on}`);
  eq(session.exercises.length, ref.exercises.length, `exercise count ${session.scheduled_on}`);
  session.exercises.forEach((ex, i) => {
    const f = ref.exercises[i];
    eq([ex.position, ex.movement_id, ex.movement_name, ex.sets, ex.rep_low, ex.rep_high, ex.target_seconds, ex.laterality === 'per_side' ? 'perSide' : 'bilateral'],
       [i + 1, f.movementId, f.name, f.setCount, f.repLow, f.repHigh, f.targetSeconds, f.laterality],
       `${session.scheduled_on} #${i + 1} ${f.name} matches the Forge bundle`);
    compared += 1;
  });
}
eq(compared, 388, 'every exercise was compared with the Forge bundle');
eq(weekIds.size, 16, 'sixteen authored weeks');

// Weeks 5 and 6 keep their own copy of what Week 4 used to hold; Week 4 itself has no calf.
const names = (week) => adrianAfter.sessions.filter((s) => spec.find((x) => x.scheduled_on === s.scheduled_on).week === week).flatMap((s) => s.exercises.map((e) => e.movement_name));
ok(!names(4).some((n) => /calf/i.test(n)), 'Week 4 has no direct calf work');
ok(names(5).some((n) => /calf/i.test(n)), 'Week 5 keeps its explicit calf work');

// Timed work keeps its authored range; nothing is invented.
const plank = adrianAfter.sessions.flatMap((s) => s.exercises).find((e) => e.movement_id === 'core_floor_side_plank');
eq([plank.target_seconds, plank.target_seconds_high, plank.rep_low, plank.rep_high, plank.laterality], [30, 45, null, null, 'per_side'], 'a timed per-side exercise keeps its range');
ok(adrianAfter.sessions.flatMap((s) => s.exercises).every((e) => e.rest_seconds === null && e.cue === null && e.substitutions === null), 'rest, cue and substitutions are not invented');

// ── Additive: nothing else in the feed changed ──────────────────────────────────────────
eq(withoutExercises(adrianAfter), withoutExercises(adrianBefore), 'Adrian\'s feed is identical apart from the new exercises key');
eq(stripClock(await feedFor(runner.athleteUser, runner.athlete)), stripClock(runnerBefore), 'a running athlete\'s feed is byte-for-byte unchanged');
ok(!('exercises' in (await feedFor(runner.athleteUser, runner.athlete)).sessions[0]), 'a session without structured exercises has no exercises key');
const details = await rows(db, `select v.details from public.planned_session_versions v where v.athlete_id = $1 order by v.planned_session_id, v.version_number`, [adrian.athlete]);
eq(details.map((d) => d.details).sort(), spec.map((s) => s.details).sort(), 'the readable details are untouched');

// ── Backfill safety ─────────────────────────────────────────────────────────────────────
const again = (await rows(db, 'select public.backfill_structured_strength($1, $2::jsonb) r', [adrian.athlete, JSON.stringify(spec)]))[0].r;
eq([again.filled, again.already, again.skipped.length], [0, 58, 0], 'the backfill is idempotent');
const odd = [
  { ...spec[0], scheduled_on: '2031-01-01' },
  { ...spec[0], details: 'something else' }
];
const unmatched = (await rows(db, 'select public.backfill_structured_strength($1, $2::jsonb) r', [adrian.athlete, JSON.stringify(odd)]))[0].r;
eq(unmatched.skipped.map((s) => s.reason), ['no_session'], 'an unknown date is reported, not guessed');
eq(unmatched.already, 1, 'a version that already has exercises is never touched');
const runnerBackfill = (await rows(db, 'select public.backfill_structured_strength($1, $2::jsonb) r', [runner.athlete, JSON.stringify([{ scheduled_on: '2026-09-14', details: 'Easy 4 mi', exercises: [] }])]))[0].r;
eq(runnerBackfill.skipped.map((s) => s.reason), ['not_strength'], 'a running session is never given strength exercises');
await as(db, adrian.athleteUser, () => rejects(() => db.query('select public.backfill_structured_strength($1, $2::jsonb)', [adrian.athlete, '[]']), /permission denied/i, 'a client cannot run the backfill'));

// ── Isolation ───────────────────────────────────────────────────────────────────────────
await rejects(() => feedFor(runner.athleteUser, adrian.athlete), /feed serves an athlete their own plan/, 'another athlete cannot read Adrian\'s feed');
await rejects(() => feedFor(runner.coachUser, adrian.athlete), /feed serves an athlete their own plan/, 'another coach cannot read Adrian\'s feed');
const count = (user) => as(db, user, async () => (await rows(db, 'select count(*)::int n from public.planned_session_exercises'))[0].n);
eq(await count(adrian.athleteUser), 388, 'Adrian reads his own exercises');
eq(await count(adrian.coachUser), 388, 'Adrian\'s coach reads his exercises');
eq(await count(runner.athleteUser), 0, 'another athlete reads none of them');
eq(await count(runner.coachUser), 0, 'another athlete\'s coach reads none of them');
const stranger = (await rows(db, `insert into auth.users(email) values ('stranger@example.test') returning id`))[0].id;
eq(await count(stranger), 0, 'a signed-in stranger reads none of them');
await db.exec('reset role; set role anon');
await rejects(() => db.query('select count(*) from public.planned_session_exercises'), /permission denied/i, 'anon has no access');
await db.exec('reset role');

const firstVersion = (await rows(db, `select v.id from public.planned_session_versions v join public.planned_sessions ps on ps.id = v.planned_session_id
  where ps.athlete_id = $1 order by ps.scheduled_on limit 1`, [adrian.athlete]))[0].id;
const newRow = (athlete, version, extra = {}) => ({ athlete, version, position: 99, ...extra });
const insert = (user, r) => as(db, user, () => db.query(
  `insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, target_seconds, laterality)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
  [r.athlete, r.version, r.position, r.movement_id ?? 'x_move', r.name ?? 'X', r.sets ?? 3, 'rep_low' in r ? r.rep_low : 8, 'rep_high' in r ? r.rep_high : 10, r.target_seconds ?? null, r.laterality ?? 'bilateral']));
await rejects(() => insert(adrian.athleteUser, newRow(adrian.athlete, firstVersion)), /row-level security|permission denied/i, 'an athlete cannot write their own prescription');
await rejects(() => insert(runner.coachUser, newRow(adrian.athlete, firstVersion)), /row-level security/i, 'another coach cannot write into Adrian\'s plan');
await rejects(() => insert(runner.coachUser, newRow(runner.athlete, firstVersion)), /same athlete/, 'a row cannot point at another athlete\'s version');
await rejects(() => db.query(`insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, laterality)
  values ($1,$2,50,'a','A',3,8,10,'bilateral')`, [runner.athlete, firstVersion]), /same athlete/, 'the same rule holds for the table owner');

// ── Constraints: nothing ambiguous can be stored ────────────────────────────────────────
const direct = (extra) => db.query(
  `insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, target_seconds, target_seconds_high, laterality)
   values ($1,$2,$3,'a_move','A',3,$4,$5,$6,$7,$8)`,
  [runner.athlete, runnerVersion, extra.position, extra.rep_low ?? null, extra.rep_high ?? null, extra.target_seconds ?? null, extra.target_seconds_high ?? null, extra.laterality ?? 'bilateral']);
await rejects(() => direct({ position: 1 }), /exercise_has_one_measure/, 'an exercise must say reps or seconds');
await rejects(() => direct({ position: 2, rep_low: 8, rep_high: 10, target_seconds: 30 }), /exercise_has_one_measure/, 'an exercise cannot say both');
await rejects(() => direct({ position: 3, rep_low: 12, rep_high: 8 }), /exercise_reps_are_a_range/, 'a reversed rep range is refused');
await rejects(() => direct({ position: 4, target_seconds: 45, target_seconds_high: 30 }), /exercise_seconds_are_a_range/, 'a reversed time range is refused');
await rejects(() => direct({ position: 5, rep_low: 8, rep_high: 10, laterality: 'left' }), /laterality/, 'laterality is one of two values');
await direct({ position: 6, rep_low: 8, rep_high: 8 });
await rejects(() => direct({ position: 6, rep_low: 8, rep_high: 8 }), /unique|duplicate/i, 'a position is used once per version');
await rejects(() => db.query(`update public.planned_session_exercises set sets = 9 where version_id = $1`, [firstVersion]), /append-only/, 'a prescription cannot be edited in place');
await rejects(() => db.query(`delete from public.planned_session_exercises where version_id = $1`, [firstVersion]), /append-only/, 'a prescription cannot be deleted');

// ── Versioning: a revision never touches what an older version held ─────────────────────
const target = (await rows(db, `select ps.id, v.id as v1 from public.planned_sessions ps join public.planned_session_versions v on v.planned_session_id = ps.id
  where ps.athlete_id = $1 order by ps.scheduled_on desc limit 1`, [adrian.athlete]))[0];
const v1Rows = await rows(db, 'select * from public.planned_session_exercises where version_id = $1 order by position', [target.v1]);
ok(v1Rows.length > 0, 'the future session has structured exercises on version 1');
const v2 = (await rows(db, `insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape, change_reason)
  values ($1,$2,2,'Revised','Strength','One revised line — 3 × 10','strength','coach revision') returning id`, [adrian.athlete, target.id]))[0].id;
const afterRevision = await feedFor(adrian.athleteUser, adrian.athlete);
const revised = afterRevision.sessions.find((s) => s.id === target.id);
eq([revised.version.version_number, 'exercises' in revised], [2, false], 'a revised version without structure shows none rather than the old version\'s exercises');
eq(await rows(db, 'select * from public.planned_session_exercises where version_id = $1 order by position', [target.v1]), v1Rows, 'revising leaves version 1\'s exercise rows exactly as they were');
// The backfill refuses to describe a version whose text it does not match.
const mismatch = (await rows(db, 'select public.backfill_structured_strength($1, $2::jsonb) r', [adrian.athlete, JSON.stringify(spec.filter((x) => x.scheduled_on === revised.scheduled_on))]))[0].r;
eq(mismatch.skipped.map((x) => x.reason), ['details_differ'], 'a revised version that no longer matches the source is reported, not overwritten');
eq((await rows(db, 'select count(*)::int n from public.planned_session_exercises where version_id = $1', [v2]))[0].n, 0, 'and nothing was attached to it');
await as(db, adrian.coachUser, () => db.query(
  `insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, laterality)
   values ($1,$2,1,'lat_pulldown','Lat Pulldown',3,10,10,'bilateral')`, [adrian.athlete, v2]));
const structuredRevision = (await feedFor(adrian.athleteUser, adrian.athlete)).sessions.find((s) => s.id === target.id);
eq(structuredRevision.exercises.map((e) => e.movement_id), ['lat_pulldown'], 'the revised version\'s own exercises are delivered');
eq(await rows(db, 'select * from public.planned_session_exercises where version_id = $1 order by position', [target.v1]), v1Rows, 'the older version still resolves to the prescription it held');

// ── The schema history still replays with this migration in it ──────────────────────────
const full = await openPglite();
const replay = await replaySchema({ db: full });
eq(replay.ddlFailures.filter((f) => !PLATFORM_ONLY.has(f.file)), [], 'the full history, including this migration, replays on an empty database');
ok(replay.files.includes(THIS), 'this migration is part of the history');
eq((await rows(full, 'select count(*)::int n from public.planned_session_exercises'))[0].n, 0, 'with no Adrian present the backfill is a quiet no-op');

console.log(`PASS: ${checks} structured strength checks (schema, additive feed, 58-session Adrian backfill vs the Forge bundle, isolation, append-only versioning).`);
