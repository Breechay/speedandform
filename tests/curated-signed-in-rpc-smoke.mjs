// FORM Curated staging-only signed-in RPC acceptance.
// Run after applying the migration and seeding one dated, public/member QA run.
// This script refuses the production project and never uses a service-role key.
//
// Required env:
//   FORM_CURATED_QA_URL, FORM_CURATED_QA_PUBLISHABLE_KEY,
//   FORM_CURATED_QA_ATHLETE_TOKEN, FORM_CURATED_QA_MEMBER_TOKEN,
//   FORM_CURATED_QA_COACH_TOKEN, FORM_CURATED_QA_RUN_ID
// Optional FORM_CURATED_QA_OUTSIDER_TOKEN exercises a second non-member subject.

import assert from 'node:assert/strict';

const liveRef = 'pbgsjjegycacodiltbhn';
const required = [
  'FORM_CURATED_QA_URL',
  'FORM_CURATED_QA_PUBLISHABLE_KEY',
  'FORM_CURATED_QA_ATHLETE_TOKEN',
  'FORM_CURATED_QA_MEMBER_TOKEN',
  'FORM_CURATED_QA_COACH_TOKEN',
  'FORM_CURATED_QA_RUN_ID',
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}. No RPCs called.`);
}

const endpoint = new URL(process.env.FORM_CURATED_QA_URL);
assert.equal(endpoint.protocol, 'https:', 'Use a TLS staging branch.');
assert.ok(/\.supabase\.co$/.test(endpoint.hostname), 'Use an actual Supabase QA project.');
assert.ok(!endpoint.hostname.includes(liveRef), 'Production FORM Athlete System is forbidden.');
assert.match(process.env.FORM_CURATED_QA_RUN_ID, /^[0-9a-f-]{36}$/i);
const base = new URL('/rest/v1/rpc/', endpoint);
const key = process.env.FORM_CURATED_QA_PUBLISHABLE_KEY;
const runID = process.env.FORM_CURATED_QA_RUN_ID;

async function rpc(token, method, data = {}) {
  const response = await fetch(new URL(method, base), {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const raw = await response.text();
  const parsed = raw ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : null;
  return { status: response.status, data: parsed };
}

function success(result, label) {
  assert.ok(result.status >= 200 && result.status < 300,
    `${label} failed HTTP ${result.status}: ${JSON.stringify(result.data)}`);
}
function refused(result, label) {
  assert.ok(result.status === 401 || result.status === 403,
    `${label} must refuse, got HTTP ${result.status}`);
}
function eventIn(result) {
  assert.ok(result.data && Array.isArray(result.data.events), 'form_curated_my must return events[]');
  return result.data.events.find(event => event.id === runID);
}

const athlete = process.env.FORM_CURATED_QA_ATHLETE_TOKEN;
const member = process.env.FORM_CURATED_QA_MEMBER_TOKEN;
const coach = process.env.FORM_CURATED_QA_COACH_TOKEN;

// Both types of actual member must be able to see the published public/member event.
const [athleteMy, memberMy] = await Promise.all([
  rpc(athlete, 'form_curated_my'),
  rpc(member, 'form_curated_my'),
]);
success(athleteMy, 'athlete my');
success(memberMy, 'member my');
assert.ok(eventIn(athleteMy), 'Coached athlete cannot see fixture event');
assert.ok(eventIn(memberMy), 'Uncoached member cannot see fixture event');

// Coach-only management must be inaccessible to both member types.
refused(await rpc(athlete, 'form_curated_manage'), 'athlete manage');
refused(await rpc(member, 'form_curated_manage'), 'member manage');
success(await rpc(coach, 'form_curated_manage'), 'coach manage');

success(await rpc(athlete, 'form_curated_mark_read', { p_run_id: runID }), 'athlete mark read');
success(await rpc(athlete, 'form_curated_attendees', { p_run_id: runID }), 'athlete attendees');
success(await rpc(member, 'form_curated_attendees', { p_run_id: runID }), 'member attendees');

// Join both, remove athlete only, prove the member retains their own intention.
// The fixture event must be upcoming, scheduled, and eligible for both subjects.
for (const [who, token] of [['athlete', athlete], ['member', member]]) {
  const join = await rpc(token, 'form_curated_rsvp', { p_run_id: runID, p_join: true });
  success(join, `${who} join`);
  assert.equal(join.data, true);
  const my = await rpc(token, 'form_curated_my');
  success(my, `${who} joined my`);
  assert.equal(eventIn(my)?.joined, true, `${who} RSVP not reflected`);
}
const left = await rpc(athlete, 'form_curated_rsvp', { p_run_id: runID, p_join: false });
success(left, 'athlete leave');
assert.equal(left.data, false);
const [afterAthlete, afterMember] = await Promise.all([
  rpc(athlete, 'form_curated_my'), rpc(member, 'form_curated_my'),
]);
success(afterAthlete, 'athlete after leave');
success(afterMember, 'member after athlete leave');
assert.equal(eventIn(afterAthlete)?.joined, false, 'Athlete RSVP still present');
assert.equal(eventIn(afterMember)?.joined, true, 'Athlete leave removed someone else');

const memberLeft = await rpc(member, 'form_curated_rsvp', { p_run_id: runID, p_join: false });
success(memberLeft, 'member leave');
assert.equal(memberLeft.data, false);

if (process.env.FORM_CURATED_QA_OUTSIDER_TOKEN) {
  // Out-of-group user never receives a private invite merely by knowing a run ID.
  const outsiderMy = await rpc(process.env.FORM_CURATED_QA_OUTSIDER_TOKEN, 'form_curated_my');
  success(outsiderMy, 'outsider my');
  assert.equal(outsiderMy.data.unread_count, 0, 'Outsider has unexplained unread invite');
  refused(await rpc(process.env.FORM_CURATED_QA_OUTSIDER_TOKEN, 'form_curated_manage'), 'outsider manage');
}

console.log('PASS: Curated staging account reader, RSVP ownership, invite read, attendees and coach authority.');
