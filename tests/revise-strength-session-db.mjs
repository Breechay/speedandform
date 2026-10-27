// Revising a strength session appends an immutable version with its exercises.
// Isolated PGlite, full migration history. Never a hosted database.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openPglite, replaySchema, fixture, as, PLATFORM_ONLY } from './support/replay-schema.mjs';

const HELD = 'supabase/held/20261007130000_revise_strength_session.sql';
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

const db = await openPglite();
const hist = await replaySchema({ db, skip: (f) => f.endsWith('_revise_strength_session.sql') || f.endsWith('_forge_session_state_and_receipt_version.sql') });
eq(hist.ddlFailures.filter((f) => !PLATFORM_ONLY.has(f.file)), [], 'the schema history replays');
await db.exec(fs.readFileSync(HELD, 'utf8'));

const A = await fixture(db, { slug: 'adrian', weeks: 4 });
const B = await fixture(db, { slug: 'other' });
const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

async function session(who, { shape = 'strength', onDay = 3 } = {}) {
  const wk = (await rows(db, `insert into public.training_weeks(athlete_id, block_id, week_number, starts_on, ends_on, state)
    values ($1,$2,(select coalesce(max(week_number),0)+1 from public.training_weeks where athlete_id=$1),$3,$4,'planned') returning id`,
    [who.athlete, who.block, day(onDay - 1), day(onDay + 5)]))[0].id;
  const ps = (await rows(db, `insert into public.planned_sessions(athlete_id, week_id, day_label, position, scheduled_on, state)
    values ($1,$2,'Day',(select coalesce(max(position),0)+1 from public.planned_sessions where athlete_id=$1),$3,'published') returning id`, [who.athlete, wk, day(onDay)]))[0].id;
  const v = (await rows(db, `insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape)
    values ($1,$2,1,'Lower A','Build legs','x',$3) returning id`, [who.athlete, ps, shape]))[0].id;
  if (shape === 'strength') {
    await db.query(`insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, laterality)
      values ($1,$2,1,'legs_db_goblet_squat','Dumbbell Goblet Squat',3,8,10,'bilateral')`, [who.athlete, v]);
  }
  return { ps, v };
}
const s = await session(A);
const running = await session(A, { shape: 'continuous', onDay: 5 });
const theirs = await session(B);

const exercises = [
  { movementId: 'legs_db_goblet_squat', movementName: 'Dumbbell Goblet Squat', sets: 3, repLow: 6, repHigh: 8, laterality: 'bilateral' },
  { movementId: 'legs_db_bulgarian_split_squat', movementName: 'Bulgarian Split Squat', sets: 2, repLow: 6, repHigh: 8, laterality: 'per_side', sideWord: 'leg', instruction: 'Use a stable, load-bearing support.' },
  { movementId: 'legs_hamstring_bridge_walkout', movementName: 'Hamstring Bridge Walkout', sets: 2, repLow: 4, repHigh: 6, repUnit: 'out-and-back cycles', laterality: 'bilateral' },
  { movementId: 'core_db_suitcase_hold', movementName: 'Dumbbell Suitcase Hold', sets: 2, targetSeconds: 20, targetSecondsHigh: 30, laterality: 'per_side', sideWord: 'side', instruction: 'Do not lean.' }
];
const revise = (who, sid, ex = exercises, over = {}) => as(db, who, async () => (await db.query(
  'select public.revise_strength_session($1,$2,$3,$4,$5::jsonb) v', [sid, over.title ?? 'Lower A', over.intent ?? null, over.reason ?? 'Home gym: dumbbells only', JSON.stringify(ex)])).rows[0].v);

const v1rows = await rows(db, 'select * from public.planned_session_exercises where version_id = $1 order by position', [s.v]);
const v2 = await revise(A.coachUser, s.ps);

// A new immutable version, exactly one step on.
const ver = (await rows(db, 'select * from public.planned_session_versions where id = $1', [v2]))[0];
eq([ver.version_number, ver.shape, ver.title, ver.change_reason, ver.authored_by], [2, 'strength', 'Lower A', 'Home gym: dumbbells only', A.coachUser], 'a strength version appended by the coach');
eq(ver.intent, 'Build legs', 'a blank intent carries the previous sentence forward');
eq(await rows(db, 'select * from public.planned_session_exercises where version_id = $1 order by position', [s.v]), v1rows, 'the previous version\'s exercises are exactly as they were');

// Stored rows, in order, as authored.
const stored = await rows(db, 'select * from public.planned_session_exercises where version_id = $1 order by position', [v2]);
eq(stored.map((e) => [e.position, e.movement_id, e.sets]), [[1, 'legs_db_goblet_squat', 3], [2, 'legs_db_bulgarian_split_squat', 2], [3, 'legs_hamstring_bridge_walkout', 2], [4, 'core_db_suitcase_hold', 2]], 'ordered');
eq([stored[1].laterality, stored[1].side_word, stored[1].instruction], ['per_side', 'leg', 'Use a stable, load-bearing support.'], 'laterality, wording and instruction kept');
eq([stored[2].rep_unit, stored[3].target_seconds, stored[3].target_seconds_high], ['out-and-back cycles', 20, 30], 'units and ranges kept');
eq([stored[0].rest_seconds, stored[0].cue, stored[0].substitutions], [null, null, null], 'nothing unauthored is invented');

// The readable text is generated from the same exercises, in the live format, and round-trips.
const reps = (e) => e.target_seconds !== null ? `${e.target_seconds}${e.target_seconds_high ? `–${e.target_seconds_high}` : ''} sec`
  : `${e.rep_low}${e.rep_high !== e.rep_low ? `–${e.rep_high}` : ''}${e.rep_unit ? ` ${e.rep_unit}` : ''}`;
const render = (list) => list.map((e) => `${e.movement_name} — ${e.sets} × ${reps(e)}${e.side_word ? ` / ${e.side_word}` : ''}${e.instruction ? ` · ${e.instruction}` : ''}`).join('\n');
eq(ver.details, render(stored), 'the stored details text equals what the stored exercises render to');

// The athlete's own feed delivers the revision.
const feed = await as(db, A.athleteUser, async () => (await db.query('select public.athlete_plan_feed($1) r', [A.athlete])).rows[0].r);
const served = feed.sessions.find((x) => x.id === s.ps);
eq([served.version.id, served.version.version_number, served.exercises.length], [v2, 2, 4], 'the next feed read carries the new version and its exercises');

// Authority, reason, shape.
await rejects(() => revise(A.athleteUser, s.ps), /only a coach/, 'the athlete cannot revise their own prescription');
await rejects(() => revise(B.coachUser, s.ps), /only a coach|no such session/, 'another coach cannot (they cannot even see the session)');
await rejects(() => revise(A.coachUser, theirs.ps), /only a coach|no such session/, 'and Adrian\'s coach cannot touch another athlete\'s session');
await rejects(() => revise(A.coachUser, s.ps, exercises, { reason: '  ' }), /needs a reason/, 'a revision without a reason is refused');
await rejects(() => revise(A.coachUser, s.ps, exercises, { title: '' }), /needs a title/, 'a title is required');
await rejects(() => revise(A.coachUser, running.ps), /only a strength session/, 'a running session is not revised here');
await rejects(() => revise(A.coachUser, crypto.randomUUID()), /no such session/, 'an unknown session is refused');

// Shape of the exercises.
await rejects(() => revise(A.coachUser, s.ps, []), /between 1 and 30/, 'an empty revision is refused');
await rejects(() => revise(A.coachUser, s.ps, [{ ...exercises[0], surprise: 1 }]), /unknown exercise key "surprise"/, 'unknown keys are refused, not dropped');
await rejects(() => revise(A.coachUser, s.ps, [{ ...exercises[0], movementName: '' }]), /needs a movementId and a movementName/, 'a movement must be named');
await rejects(() => revise(A.coachUser, s.ps, [{ ...exercises[0], repLow: 10, repHigh: 6 }]), /not a valid prescription/, 'a reversed range is refused');
await rejects(() => revise(A.coachUser, s.ps, [{ ...exercises[0], targetSeconds: 30 }]), /not a valid prescription/, 'reps and seconds together are refused');
await rejects(() => revise(A.coachUser, s.ps, [{ ...exercises[0], laterality: 'left' }]), /not a valid prescription/, 'laterality is one of two values');
await rejects(() => revise(A.coachUser, s.ps, [{ ...exercises[0], sets: 'many' }]), /incomplete or malformed/, 'a non-number is refused');

// Atomic: a bad exercise anywhere leaves no new version and no stray rows.
const before = (await rows(db, 'select count(*)::int n from public.planned_session_versions where planned_session_id = $1', [s.ps]))[0].n;
const rowsBefore = (await rows(db, 'select count(*)::int n from public.planned_session_exercises'))[0].n;
await rejects(() => revise(A.coachUser, s.ps, [exercises[0], { ...exercises[1], repLow: 9, repHigh: 2 }]), /exercise 2 is not a valid prescription/, 'the failing exercise is named');
eq((await rows(db, 'select count(*)::int n from public.planned_session_versions where planned_session_id = $1', [s.ps]))[0].n, before, 'a failed revision creates no version');
eq((await rows(db, 'select count(*)::int n from public.planned_session_exercises'))[0].n, rowsBefore, 'and no exercise rows');

// Revising again appends again; history is intact.
const v3 = await revise(A.coachUser, s.ps, [exercises[0]], { reason: 'Simplify the week' });
eq((await rows(db, 'select version_number from public.planned_session_versions where id = $1', [v3]))[0].version_number, 3, 'the next revision is v3');
eq((await rows(db, 'select count(*)::int n from public.planned_session_exercises where version_id = $1', [v2]))[0].n, 4, 'v2 still holds its four exercises');
eq((await rows(db, 'select count(*)::int n from public.planned_session_versions where planned_session_id = $1', [s.ps]))[0].n, 3, 'three versions of one session, none edited');

// Not callable by anon.
await db.exec('reset role; set role anon');
await rejects(() => db.query('select public.revise_strength_session($1,$2,$3,$4,$5::jsonb)', [s.ps, 't', null, 'r', JSON.stringify(exercises)]), /permission denied/i, 'anon cannot call it');
await db.exec('reset role');

console.log(`PASS: ${checks} strength-revision checks (coach-only, reason required, atomic, generated text equals stored rows, history untouched).`);
