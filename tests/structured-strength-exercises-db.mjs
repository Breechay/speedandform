// Structured strength exercises: schema, additive feed, Adrian backfill, isolation, versioning.
// Runs the real migration history in an isolated PGlite database. Never connects to a hosted one.
//   SF_PGLITE_PATH=/tmp/sf-email-db/node_modules/@electric-sql/pglite/dist/index.js node tests/structured-strength-exercises-db.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openPglite, replaySchema, fixture, as, PLATFORM_ONLY } from './support/replay-schema.mjs';
import { MIGRATION } from '../scripts/generate-structured-strength-migration.mjs';
import { MOVEMENT_IDS } from '../scripts/structured-strength-spec.mjs';

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
// This migration is held (supabase/held), so the migrations directory is exactly its pre-state.
// Once it is promoted into migrations/ it replays as part of the history instead.
const pre = await replaySchema({ db, skip: (f) => f.endsWith('_structured_strength_exercises.sql') });
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
// Production-shaped: each session carries exactly the text the live system carries today
// (frozen in tests/fixtures), at the live version number. The test never edits a version.
const live = JSON.parse(fs.readFileSync(new URL('./fixtures/adrian-live-current-2026-10-06.json', import.meta.url), 'utf8')).sessions;
eq(live.length, 58, 'the live fixture holds 58 current versions');
const liveByDate = new Map(live.map((l) => [l.scheduled_on, l]));
let position = 0;
for (const s of spec) {
  const l = liveByDate.get(s.scheduled_on);
  ok(l, `a live version exists for ${s.scheduled_on}`);
  const ps = await rows(db, `insert into public.planned_sessions(athlete_id, week_id, day_label, position, scheduled_on, state)
    values ($1,$2,$3,$4,$5,'published') returning id`, [adrian.athlete, weekIds.get(s.week), s.day_label, (position += 1), s.scheduled_on]);
  await db.query(`insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape)
    values ($1,$2,$3,$4,'Strength',$5,'strength')`, [adrian.athlete, ps[0].id, l.version_number, l.title, l.details]);
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

// The live system is canonical. The bundled Forge program is only historical/offline-fallback
// evidence: where it still agrees with live, the structured rows agree with it exactly; it may
// differ only on the future sessions revised after the bundle was built (from 2026-10-08).
const reference = JSON.parse(fs.readFileSync(new URL('./fixtures/forge-adrian-reference.json', import.meta.url), 'utf8'));
const dayIndex = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
const referenceById = new Map(reference.sessions.map((s) => [s.sessionId, s]));
const signature = (e) => JSON.stringify([e.movement_id, e.movement_name, e.sets, e.rep_low, e.rep_high, e.target_seconds, e.laterality]);
let bundleAgrees = 0; const bundleDiffers = [];
for (const session of adrianAfter.sessions) {
  const spec1 = spec.find((s) => s.scheduled_on === session.scheduled_on);
  const ref = referenceById.get(`adrian_runner_mass_w${spec1.week}_d${dayIndex[spec1.day_label]}`);
  ok(ref, `Forge has a bundled session for ${session.scheduled_on}`);
  const refSig = ref.exercises.map((f) => JSON.stringify([f.movementId, f.name, f.setCount, f.repLow, f.repHigh, f.targetSeconds, f.laterality === 'perSide' ? 'per_side' : 'bilateral']));
  const mine = session.exercises.map(signature);
  if (JSON.stringify(refSig) === JSON.stringify(mine)) bundleAgrees += 1; else bundleDiffers.push(session.scheduled_on);
}
ok(bundleDiffers.every((d) => d >= '2026-10-08'), `the Forge bundle differs from live only from 2026-10-08, not on ${bundleDiffers.filter((d) => d < '2026-10-08')}`);
ok(bundleAgrees >= 10 && bundleDiffers.length > 0, 'the bundle still agrees on the sessions that have not been revised');

// The authoritative proof: the structured rows render back to the live text, byte for byte.
const reps = (e) => e.target_seconds !== null
  ? `${e.target_seconds}${e.target_seconds_high ? `–${e.target_seconds_high}` : ''} sec`
  : `${e.rep_low}${e.rep_high !== e.rep_low ? `–${e.rep_high}` : ''}${e.rep_unit ? ` ${e.rep_unit}` : ''}`;
const renderDetails = (exercises) => exercises
  .map((e) => `${e.movement_name} — ${e.sets} × ${reps(e)}${e.side_word ? ` / ${e.side_word}` : ''}${e.instruction ? ` · ${e.instruction}` : ''}`).join('\n');
let roundTripped = 0;
for (const session of adrianAfter.sessions) {
  eq(renderDetails(session.exercises), liveByDate.get(session.scheduled_on).details, `${session.scheduled_on} round-trips to the live text exactly`);
  roundTripped += 1;
}
eq(roundTripped, 58, 'all 58 live versions round-trip exactly');
// The text proves the prescription; the ids prove identity. One stable id per movement name,
// and the id map covers every movement the live system uses.
const idsByName = new Map();
for (const e of adrianAfter.sessions.flatMap((s) => s.exercises)) idsByName.set(e.movement_name, new Set([...(idsByName.get(e.movement_name) ?? []), e.movement_id]));
ok([...idsByName.values()].every((ids) => ids.size === 1), 'every movement name has exactly one stable id');
eq([...idsByName.keys()].filter((n) => !(n in MOVEMENT_IDS)), [], 'every live movement has a stable id');
for (const [name, [id]] of [...idsByName].map(([n, ids]) => [n, [...ids]])) eq(id, MOVEMENT_IDS[name], `${name} keeps its stable id`);
eq(adrianAfter.sessions.flatMap((s) => s.exercises).length, 388, 'and they hold 388 exercises');
eq(adrianAfter.sessions.flatMap((s) => s.exercises).filter((e) => e.instruction).length, 225, 'with all 225 authored instructions preserved');

// Weeks 5 and 6 keep their own copy of what Week 4 used to hold; Week 4 itself has no calf.
const names = (week) => adrianAfter.sessions.filter((s) => spec.find((x) => x.scheduled_on === s.scheduled_on).week === week).flatMap((s) => s.exercises.map((e) => e.movement_name));
ok(!names(4).some((n) => /calf/i.test(n)), 'Week 4 has no direct calf work');
ok(names(5).some((n) => /calf/i.test(n)), 'Week 5 keeps its explicit calf work');

// Timed work keeps its authored range; nothing is invented.
const plank = adrianAfter.sessions.flatMap((s) => s.exercises).find((e) => e.movement_id === 'core_floor_side_plank');
eq([plank.target_seconds, plank.target_seconds_high, plank.rep_low, plank.rep_high, plank.laterality, plank.side_word], [30, 45, null, null, 'per_side', 'side'], 'a timed per-side exercise keeps its range');
const walkout = adrianAfter.sessions.flatMap((s) => s.exercises).find((e) => e.movement_id === 'legs_hamstring_bridge_walkout');
eq([walkout.rep_unit, walkout.target_seconds, walkout.rep_low <= walkout.rep_high], ['out-and-back cycles', null, true], 'a counted target keeps its unit');
eq(adrianAfter.sessions.flatMap((s) => s.exercises).filter((e) => e.rep_unit).length, 16, 'all 16 unit-bearing targets keep their unit');
const row = adrianAfter.sessions.find((s) => s.scheduled_on === '2026-10-09').exercises.find((e) => e.movement_id === 'db_bench_supported_single_arm_row');
eq([row.laterality, row.side_word, row.instruction], ['per_side', 'side', 'Brace on the bench and draw your elbow toward your hip without twisting.'], 'the authored instruction is kept exactly');
const legWork = adrianAfter.sessions.flatMap((s) => s.exercises).find((e) => e.side_word === 'leg');
ok(legWork, 'the coach\'s "per leg" wording is kept, not flattened to "side"');
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

// ── No helper in this migration is a client-callable RPC ────────────────────────────────
for (const fn of ['exercise_matches_version_athlete()', 'backfill_structured_strength(uuid, jsonb)', 'athlete_plan_feed_before_exercises(uuid)']) {
  for (const role of ['public', 'anon', 'authenticated']) {
    const [{ ok: allowed }] = await rows(db, `select has_function_privilege('${role}', 'public.${fn}', 'execute') ok`);
    eq(allowed, false, `${role} cannot execute ${fn}`);
  }
}
const [{ ok: feedOpen }] = await rows(db, `select has_function_privilege('authenticated', 'public.athlete_plan_feed(uuid)', 'execute') ok`);
eq(feedOpen, true, 'the public feed entry point stays callable by signed-in users');

// ── Constraints: nothing ambiguous can be stored ────────────────────────────────────────
const direct = (extra) => db.query(
  `insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, target_seconds, target_seconds_high, laterality, side_word, rep_unit)
   values ($1,$2,$3,'a_move','A',3,$4,$5,$6,$7,$8,$9,$10)`,
  [runner.athlete, runnerVersion, extra.position, extra.rep_low ?? null, extra.rep_high ?? null, extra.target_seconds ?? null, extra.target_seconds_high ?? null, extra.laterality ?? 'bilateral', extra.side_word ?? null, extra.rep_unit ?? null]);
await rejects(() => direct({ position: 1 }), /exercise_has_one_measure/, 'an exercise must say reps or seconds');
await rejects(() => direct({ position: 2, rep_low: 8, rep_high: 10, target_seconds: 30 }), /exercise_has_one_measure/, 'an exercise cannot say both');
await rejects(() => direct({ position: 3, rep_low: 12, rep_high: 8 }), /exercise_reps_are_a_range/, 'a reversed rep range is refused');
await rejects(() => direct({ position: 4, target_seconds: 45, target_seconds_high: 30 }), /exercise_seconds_are_a_range/, 'a reversed time range is refused');
await rejects(() => direct({ position: 5, rep_low: 8, rep_high: 10, laterality: 'left' }), /laterality/, 'laterality is one of two values');
await rejects(() => direct({ position: 7, rep_low: 8, rep_high: 8, laterality: 'per_side' }), /exercise_side_word_matches_laterality/, 'a per-side exercise must say how it was written');
await rejects(() => direct({ position: 8, rep_low: 8, rep_high: 8, side_word: 'leg' }), /exercise_side_word_matches_laterality/, 'a bilateral exercise has no side word');
await rejects(() => direct({ position: 9, target_seconds: 30, rep_unit: 'cycles' }), /exercise_unit_needs_a_count/, 'a unit belongs to a counted target, not a timed one');
await direct({ position: 10, rep_low: 6, rep_high: 8, rep_unit: 'out-and-back cycles' });
await direct({ position: 11, rep_low: 6, rep_high: 6, laterality: 'per_side', side_word: 'leg' });
await direct({ position: 6, rep_low: 8, rep_high: 8 });
await rejects(() => direct({ position: 6, rep_low: 8, rep_high: 8 }), /unique|duplicate/i, 'a position is used once per version');
await rejects(() => db.query(`update public.planned_session_exercises set sets = 9 where version_id = $1`, [firstVersion]), /append-only/, 'a prescription cannot be edited in place');
await rejects(() => db.query(`delete from public.planned_session_exercises where version_id = $1`, [firstVersion]), /append-only/, 'a prescription cannot be deleted');

// ── Versioning: a revision never touches what an older version held ─────────────────────
const target = (await rows(db, `select ps.id, v.id as v1, v.version_number as vn from public.planned_sessions ps join public.planned_session_versions v on v.planned_session_id = ps.id
  where ps.athlete_id = $1 order by ps.scheduled_on desc limit 1`, [adrian.athlete]))[0];
const v1Rows = await rows(db, 'select * from public.planned_session_exercises where version_id = $1 order by position', [target.v1]);
ok(v1Rows.length > 0, 'the future session has structured exercises on version 1');
const v2 = (await rows(db, `insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape, change_reason)
  values ($1,$2,$3,'Revised','Strength','One revised line — 3 × 10','strength','coach revision') returning id`, [adrian.athlete, target.id, target.vn + 1]))[0].id;
const afterRevision = await feedFor(adrian.athleteUser, adrian.athlete);
const revised = afterRevision.sessions.find((s) => s.id === target.id);
eq([revised.version.version_number, 'exercises' in revised], [target.vn + 1, false], 'a revised version without structure shows none rather than the old version\'s exercises');
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
// When the migration is still held, append it explicitly. Once promoted into migrations/,
// replaySchema will discover it there and must not apply the same file twice.
const promoted = MIGRATION.startsWith('supabase/migrations/');
const replay = await replaySchema({ db: full, extra: promoted ? [] : [MIGRATION] });
eq(replay.ddlFailures.filter((f) => !PLATFORM_ONLY.has(f.file)), [], 'the full history, including this migration, replays on an empty database');
ok(replay.files.some((f) => f.endsWith('_structured_strength_exercises.sql')), 'this migration is part of the replayed history');
eq((await rows(full, 'select count(*)::int n from public.planned_session_exercises'))[0].n, 0, 'with no Adrian present the backfill is a quiet no-op');

console.log(`PASS: ${checks} structured strength checks (schema, additive feed, 58-session Adrian backfill vs the Forge bundle, isolation, append-only versioning).`);
