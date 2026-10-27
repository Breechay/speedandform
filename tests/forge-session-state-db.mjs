// Receipt <-> version link, session-state events, and the Console read models.
// Isolated PGlite, full migration history, the real native-receipt contract. Never a hosted DB.
//   SF_PGLITE_PATH=/tmp/sf-email-db/node_modules/@electric-sql/pglite/dist/index.js node tests/forge-session-state-db.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openPglite, replaySchema, fixture, as, PLATFORM_ONLY } from './support/replay-schema.mjs';

const HELD = 'supabase/held/20261007120000_forge_session_state_and_receipt_version.sql';
const CONSENT = 'forge-coach-receipts-v1';
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
const hist = await replaySchema({ db, skip: (f) => f.endsWith('_forge_session_state_and_receipt_version.sql') });
eq(hist.ddlFailures.filter((f) => !PLATFORM_ONLY.has(f.file)), [], 'the schema history replays');
await db.exec(fs.readFileSync('tests/fixtures/forge-native-receipts-contract.sql', 'utf8'));

// ── Fixtures: Adrian-like athlete (structured strength), a second athlete, a runner ──────────
const A = await fixture(db, { slug: 'adrian', weeks: 16 });
const B = await fixture(db, { slug: 'other' });
const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

async function strengthSession(who, { onDay, title = 'Lower A', exercises = [] }) {
  const weekStart = day(onDay - 1), weekEnd = day(onDay + 5);
  const wk = (await rows(db, `insert into public.training_weeks(athlete_id, block_id, week_number, starts_on, ends_on, state)
    values ($1,$2,(select coalesce(max(week_number),0)+1 from public.training_weeks where athlete_id=$1),$3,$4,'planned') returning id, week_number`,
    [who.athlete, who.block, weekStart, weekEnd]))[0];
  const ps = (await rows(db, `insert into public.planned_sessions(athlete_id, week_id, day_label, position, scheduled_on, state)
    values ($1,$2,'Day',(select coalesce(max(position),0)+1 from public.planned_sessions where athlete_id=$1),$3,'published') returning id`,
    [who.athlete, wk.id, day(onDay)]))[0].id;
  const v = (await rows(db, `insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape)
    values ($1,$2,1,$3,'Strength','x','strength') returning id`, [who.athlete, ps, title]))[0].id;
  for (const [i, e] of exercises.entries()) {
    await db.query(`insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, rep_unit, target_seconds, laterality, side_word, instruction)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [who.athlete, v, i + 1, e.id, e.name, e.sets, e.low ?? null, e.high ?? null, e.unit ?? null, e.seconds ?? null, e.side ? 'per_side' : 'bilateral', e.side ?? null, e.instruction ?? null]);
  }
  return { ps, v, week: wk.week_number };
}

const squats = [
  { id: 'legs_db_bulgarian_split_squat', name: 'Bulgarian Split Squat', sets: 3, low: 6, high: 8, side: 'leg', instruction: 'Use a stable support.' },
  { id: 'legs_hamstring_bridge_walkout', name: 'Hamstring Bridge Walkout', sets: 2, low: 4, high: 6, unit: 'out-and-back cycles' },
  { id: 'core_db_suitcase_hold', name: 'Dumbbell Suitcase Hold', sets: 2, seconds: 20, side: 'side' }
];
const past = await strengthSession(A, { onDay: -2, title: 'Upper A', exercises: squats.slice(0, 1) });
const today = await strengthSession(A, { onDay: 0, title: 'Lower A', exercises: squats });
const future = await strengthSession(A, { onDay: 3, title: 'Upper B', exercises: squats.slice(0, 2) });
const otherSession = await strengthSession(B, { onDay: 0, title: 'Other', exercises: squats.slice(0, 1) });

const iso = (offsetMin = 0) => new Date(Date.now() + offsetMin * 60000).toISOString();
const payload = (s, over = {}) => ({
  id: crypto.randomUUID(), sessionName: 'Lower A', programId: 'adrian_runner_mass_phase1_v1',
  planWeekNumber: s.week, planDayIndex: 3, startedAt: iso(-60), completedAt: iso(-5), durationSeconds: 3300, feedback: null,
  plannedSessionId: s.ps, plannedSessionVersionId: s.v, plannedVersionNumber: 1, scheduledOn: day(0),
  sets: [
    { id: 'a1', movementId: 'legs_db_bulgarian_split_squat', movementName: 'Bulgarian Split Squat', setIndex: 0, weight: 25, reps: 7, seconds: null, isPr: false, completedAt: iso(-50) },
    { id: 'a2', movementId: 'legs_db_bulgarian_split_squat', movementName: 'Bulgarian Split Squat', setIndex: 1, weight: 25, reps: 6, seconds: null, isPr: false, completedAt: iso(-45) },
    { id: 'a3', movementId: 'legs_hamstring_bridge_walkout', movementName: 'Hamstring Bridge Walkout', setIndex: 0, weight: null, reps: 5, seconds: null, isPr: false, completedAt: iso(-30) }
  ],
  ...over
});
const submit = (who, athlete, body) => as(db, who, async () =>
  (await db.query('select public.submit_forge_native_receipt($1::uuid,$2::jsonb,$3) r', [athlete, JSON.stringify(body), CONSENT])).rows[0].r);

// Before the migration: a receipt with version identity is stored with no link (the baseline).
const legacy = payload(today); delete legacy.plannedSessionId; delete legacy.plannedSessionVersionId; delete legacy.plannedVersionNumber; delete legacy.scheduledOn;
eq((await submit(A.athleteUser, A.athlete, legacy)).status, 'stored', 'a receipt with no version identity is accepted before the migration');

await db.exec(fs.readFileSync(HELD, 'utf8'));

// ── 1. receipts name their version ─────────────────────────────────────────────────────────
const good = payload(today);
eq((await submit(A.athleteUser, A.athlete, good)).status, 'stored', 'a receipt naming a real version is stored');
eq((await submit(A.athleteUser, A.athlete, good)).status, 'already_stored', 'and a retry is idempotent');
const linked = (await rows(db, `select planned_session_id, planned_session_version_id from public.forge_strength_receipts where receipt_id = $1`, [`${A.athlete}:${good.id}`]))[0];
eq([linked.planned_session_id, linked.planned_session_version_id], [today.ps, today.v], 'the receipt is linked to the exact version');
eq((await rows(db, `select planned_session_version_id from public.forge_strength_receipts where receipt_id = $1`, [`${A.athlete}:${legacy.id}`]))[0].planned_session_version_id, null, 'a receipt filed before the migration stays unlinked');
const older = (s) => payload(s, {
  startedAt: iso(-300), completedAt: iso(-200),
  sets: payload(s).sets.map((x, i) => ({ ...x, id: `o${i}`, completedAt: iso(-250 + i) }))
});
const legacy2 = older(today); delete legacy2.plannedSessionId; delete legacy2.plannedSessionVersionId;
eq((await submit(A.athleteUser, A.athlete, legacy2)).status, 'stored', 'an old client with no version identity still works after the migration');
await rejects(() => submit(A.athleteUser, A.athlete, { ...payload(today), plannedSessionVersionId: otherSession.v, plannedSessionId: otherSession.ps }), /not this athlete/, 'another athlete\'s version is refused');
await rejects(() => submit(A.athleteUser, A.athlete, { ...payload(today), plannedSessionVersionId: future.v }), /not this athlete/, 'a version of a different session than the one named is refused');
await rejects(() => submit(A.athleteUser, A.athlete, { ...payload(today), plannedSessionVersionId: crypto.randomUUID() }), /not this athlete/, 'an invented version is refused');
await rejects(() => submit(A.athleteUser, A.athlete, { ...payload(today), plannedSessionVersionId: 'not-a-uuid' }), /Invalid planned version identity/, 'a malformed identity is refused');
const half = payload(today); delete half.plannedSessionId;
await rejects(() => submit(A.athleteUser, A.athlete, half), /both the planned session and its version/, 'a half identity is refused');
const changed = { ...good, sets: good.sets.map((s, i) => (i === 0 ? { ...s, weight: 30 } : s)) };
await rejects(() => submit(A.athleteUser, A.athlete, changed), /different work/, 'a retry with different work still cannot overwrite the receipt');

// ── 2. session events ──────────────────────────────────────────────────────────────────────
const event = (s, kind, over = {}) => ({
  id: crypto.randomUUID(), kind, plannedSessionId: s.ps, plannedSessionVersionId: s.v,
  programId: 'adrian_runner_mass_phase1_v1', planWeekNumber: s.week, planDayIndex: 3, occurredAt: iso(-40),
  ...(kind === 'left' ? { completedSetCount: 2 } : {}), ...over
});
const send = (who, athlete, e, consent = CONSENT) => as(db, who, async () =>
  (await db.query('select public.submit_forge_session_event($1::uuid,$2::jsonb,$3) r', [athlete, JSON.stringify(e), consent])).rows[0].r);

const opened = event(today, 'opened');
eq((await send(A.athleteUser, A.athlete, opened)).status, 'stored', 'an opened event is stored');
eq((await send(A.athleteUser, A.athlete, opened)).status, 'already_stored', 'a retry stores nothing twice');
await rejects(() => send(A.athleteUser, A.athlete, { ...opened, occurredAt: iso(-39) }), /different content/, 'the same event id cannot be rewritten');
const left = event(today, 'left', { occurredAt: iso(-20) });
eq((await send(A.athleteUser, A.athlete, left)).status, 'stored', 'a left event carries the sets done so far');
eq((await rows(db, 'select count(*)::int n from public.forge_session_events where athlete_id = $1', [A.athlete]))[0].n, 2, 'exactly two events exist');

await rejects(() => send(B.athleteUser, A.athlete, event(today, 'opened')), /membership required/, 'another athlete cannot write for Adrian');
await rejects(() => send(A.coachUser, A.athlete, event(today, 'opened')), /membership required/, 'a coach cannot write an athlete\'s events');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'opened'), 'nope'), /consent required/, 'sharing consent is required');
await rejects(() => send(A.athleteUser, A.athlete, event(otherSession, 'opened')), /not this athlete/, 'a version that is not Adrian\'s is refused');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'resumed')), /Invalid session event/, 'an unknown kind is refused');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'left', { completedSetCount: undefined })), /Invalid session event/, 'a left event must say how many sets were done');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'opened', { completedSetCount: 1 })), /Invalid session event/, 'an opened event carries no set count');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'opened', { planDayIndex: 9 })), /Invalid session event/, 'an impossible day is refused');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'opened', { planWeekNumber: null })), /Invalid session event/, 'a null week is refused');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'opened', { occurredAt: '2026-10-07 10:00:00' })), /Invalid session event/, 'a timestamp with no zone is refused');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'opened', { occurredAt: iso(60 * 24) })), /Implausible event time/, 'an event from the future is refused');
await rejects(() => send(A.athleteUser, A.athlete, event(today, 'opened', { occurredAt: iso(-60 * 24 * 60) })), /Implausible event time/, 'an event from months ago is refused');
await db.exec('reset role; set role anon');
await rejects(() => db.query(`select public.submit_forge_session_event($1::uuid,$2::jsonb,$3)`, [A.athlete, JSON.stringify(opened), CONSENT]), /permission denied/i, 'anon cannot call the RPC');
await db.exec('reset role');
await rejects(() => db.query('update public.forge_session_events set kind = \'left\''), /append-only/, 'events cannot be edited');
await rejects(() => db.query('delete from public.forge_session_events'), /append-only/, 'events cannot be deleted');
await as(db, A.athleteUser, () => rejects(() => db.query(`insert into public.forge_session_events(athlete_id,event_id,kind,planned_session_id,planned_session_version_id,program_id,plan_week_number,plan_day_index,occurred_at,consent_version,submitted_by,payload)
  values ($1,gen_random_uuid(),'opened',$2,$3,'p',1,0,now(),'x',$4,'{}')`, [A.athlete, today.ps, today.v, A.athleteUser]), /permission denied/i, 'there is no direct write path'));

const seen = (u) => as(db, u, async () => (await rows(db, 'select count(*)::int n from public.forge_session_events'))[0].n);
eq(await seen(A.athleteUser), 2, 'Adrian reads his events');
eq(await seen(A.coachUser), 2, 'his coach reads them');
eq(await seen(B.athleteUser), 0, 'another athlete reads none');
eq(await seen(B.coachUser), 0, 'another coach reads none');

// ── 3. state view ──────────────────────────────────────────────────────────────────────────
const state = (u, id = A.athlete) => as(db, u, async () => (await rows(db, 'select * from public.forge_athlete_state where athlete_id = $1', [id]))[0]);
const st = await state(A.coachUser);
eq(st.last_opened_session_id, today.ps, 'last opened is today\'s session');
eq(st.last_opened_version_id, today.v, 'and the exact version');
eq(st.last_left_set_count, 2, 'last left records the sets done');
eq(st.last_completed_session_id, today.ps, 'last completed is the receipt\'s session');
eq([st.last_completed_week, st.last_completed_day], [today.week, 3], 'with the coordinates it was performed at');
eq(st.last_completed_version_id, today.v, 'and its version');
eq(Number(st.receipts_filed), 3, 'three receipts are filed so far (the baseline, one with identity, one filed later without it)');
eq(st.next_session_id, future.ps, 'next is the earliest published session from today that has no receipt: the future one');
// If the newest receipt carries no version identity it still reports when and where, with no session link.
const lateLegacy = payload(today, { startedAt: iso(-3), completedAt: iso(-1), sets: payload(today).sets.map((x, i) => ({ ...x, id: `late${i}`, completedAt: iso(-2) })) });
delete lateLegacy.plannedSessionId; delete lateLegacy.plannedSessionVersionId;
await submit(A.athleteUser, A.athlete, lateLegacy);
const st2 = await state(A.coachUser);
eq([st2.last_completed_session_id, st2.last_completed_version_id], [null, null], 'a newest receipt with no identity links to no session');
ok(st2.last_completed_at > st.last_completed_at, 'but it is still the last thing completed');
eq(Number(st2.receipts_filed), 4, 'and it is counted');
// A session with no receipt filed is still next; today's is done.
eq(await state(B.athleteUser, A.athlete), undefined, 'another athlete cannot read Adrian\'s state');
eq(await state(B.coachUser, A.athlete), undefined, 'nor can another coach');
eq((await state(B.athleteUser, B.athlete))?.athlete_id, B.athlete, 'each athlete reads their own');
await db.exec('reset role; set role anon');
await rejects(() => db.query('select * from public.forge_athlete_state'), /permission denied/i, 'anon reads nothing');
await db.exec('reset role');

// ── 4. prescribed beside performed ─────────────────────────────────────────────────────────
const mv = await as(db, A.coachUser, async () => rows(db, `select * from public.forge_receipt_movements where receipt_id = $1 order by prescribed_position`, [`${A.athlete}:${good.id}`]));
eq(mv.map((m) => m.movement_id), ['legs_db_bulgarian_split_squat', 'legs_hamstring_bridge_walkout'], 'one row per movement performed');
const split = mv[0];
eq([split.performed_sets, split.prescribed_sets, split.rep_low, split.rep_high, split.side_word, split.instruction], [2, 3, 6, 8, 'leg', 'Use a stable support.'], 'performed 2 of 3 prescribed sets against 6–8 per leg');
eq(split.performed.map((p) => [p.set_index, Number(p.weight), p.reps]), [[0, 25, 7], [1, 25, 6]], 'the performed sets keep their load and reps in order');
eq([mv[1].rep_unit, mv[1].performed_sets, mv[1].prescribed_sets], ['out-and-back cycles', 1, 2], 'a unit-bearing movement keeps its unit');
const unlinked = await as(db, A.coachUser, async () => rows(db, `select prescribed_sets, rep_low from public.forge_receipt_movements where receipt_id = $1`, [`${A.athlete}:${legacy.id}`]));
ok(unlinked.length > 0 && unlinked.every((r) => r.prescribed_sets === null), 'work filed before version identity shows what was done and no invented prescription');
eq(await as(db, B.athleteUser, async () => (await rows(db, 'select count(*)::int n from public.forge_receipt_movements'))[0].n), 0, 'another athlete sees no movements');
eq(await as(db, B.coachUser, async () => (await rows(db, 'select count(*)::int n from public.forge_receipt_movements'))[0].n), 0, 'nor does another coach');

// A revision never changes what an old receipt points at.
const v2 = (await rows(db, `insert into public.planned_session_versions(athlete_id, planned_session_id, version_number, title, intent, details, shape)
  values ($1,$2,2,'Lower A','Strength','revised','strength') returning id`, [A.athlete, today.ps]))[0].id;
await db.query(`insert into public.planned_session_exercises(athlete_id, version_id, position, movement_id, movement_name, sets, rep_low, rep_high, laterality)
  values ($1,$2,1,'legs_db_bulgarian_split_squat','Bulgarian Split Squat',5,4,5,'bilateral')`, [A.athlete, v2]);
const after = await as(db, A.coachUser, async () => rows(db, `select prescribed_sets, rep_low, rep_high from public.forge_receipt_movements where receipt_id = $1 and movement_id = 'legs_db_bulgarian_split_squat'`, [`${A.athlete}:${good.id}`]));
eq(after.map((r) => [r.prescribed_sets, r.rep_low, r.rep_high]), [[3, 6, 8]], 'after a revision the old receipt still shows the prescription it was performed against');

// ── Not callable by clients; the history still replays with this migration in it ───────────
for (const fn of ['forge_link_receipt_version()']) {
  for (const role of ['public', 'anon', 'authenticated']) {
    eq((await rows(db, `select has_function_privilege('${role}', 'public.${fn}', 'execute') ok`))[0].ok, false, `${role} cannot execute ${fn}`);
  }
}
eq((await rows(db, `select has_function_privilege('authenticated', 'public.submit_forge_session_event(uuid,jsonb,text)', 'execute') ok`))[0].ok, true, 'signed-in athletes can submit events');
eq((await rows(db, `select has_function_privilege('anon', 'public.submit_forge_session_event(uuid,jsonb,text)', 'execute') ok`))[0].ok, false, 'anon cannot');

console.log(`PASS: ${checks} forge session-state checks (receipt version link, append-only events, athlete/coach isolation, prescribed-vs-performed).`);
