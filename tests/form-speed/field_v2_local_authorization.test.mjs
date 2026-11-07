import assert from 'node:assert/strict';
import test from 'node:test';

const apiURL = process.env.FIELD_TEST_API_URL;
const anonKey = process.env.FIELD_TEST_ANON_KEY;
const serviceRoleKey = process.env.FIELD_TEST_SERVICE_ROLE_KEY;

if (!apiURL || !anonKey || !serviceRoleKey) {
  throw new Error(
    'Set FIELD_TEST_API_URL, FIELD_TEST_ANON_KEY, and FIELD_TEST_SERVICE_ROLE_KEY from the local Supabase stack.',
  );
}

const rosterUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'field-roster@example.test',
  password: 'Local-field-v2-roster-111!',
};
const outsiderUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'field-outsider@example.test',
  password: 'Local-field-v2-outsider-222!',
};

async function request(path, { token = anonKey, method = 'POST', body } = {}) {
  const response = await fetch(`${apiURL}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  return { response, payload };
}

async function ensureUser(user) {
  const result = await fetch(`${apiURL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
    }),
  });
  if (!result.ok && result.status !== 422) {
    throw new Error(`Could not create local test user ${user.email}: ${result.status} ${await result.text()}`);
  }
}

async function signIn(user) {
  await ensureUser(user);
  const response = await fetch(`${apiURL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return JSON.parse(text).access_token;
}

const rosterToken = await signIn(rosterUser);
const outsiderToken = await signIn(outsiderUser);

async function fieldFeed(token) {
  return request('/rest/v1/rpc/collective_work_feed_v2', {
    token,
    body: { p_limit: 12 },
  });
}

test('anonymous caller cannot execute Field v2', async () => {
  const { response } = await fieldFeed(anonKey);
  assert.ok([401, 403, 404].includes(response.status), `unexpected status ${response.status}`);
});

test('signed-in outsider receives no Field posts', async () => {
  const { response, payload } = await fieldFeed(outsiderToken);
  assert.equal(response.status, 200);
  assert.deepEqual(payload, []);
});

test('rostered caller receives ordered measured reps without private fields', async () => {
  const { response, payload } = await fieldFeed(rosterToken);
  assert.equal(response.status, 200);
  assert.equal(payload.length, 2);

  const run = payload.find((post) => post.id === 'e0000000-0000-4000-8000-000000000001');
  const strength = payload.find((post) => post.id === 'e0000000-0000-4000-8000-000000000002');
  assert.ok(run);
  assert.ok(strength);
  assert.equal(payload.some((post) => post.id === 'e0000000-0000-4000-8000-000000000003'), false);

  assert.equal(run.rep_splits.length, 11, 'the missing-distance rep is omitted; 9+ measured reps remain');
  assert.deepEqual(run.rep_splits.map((rep) => rep.position), [1,2,3,4,6,7,8,9,10,11,12]);
  assert.equal(run.rep_splits.some((rep) => rep.distanceMeters == null), false);
  assert.deepEqual(
    run.rep_splits.find((rep) => rep.position === 6),
    { position: 6, durationMs: 86125, distanceMeters: 600, distanceSource: 'signed_correction' },
  );
  assert.deepEqual(strength.rep_splits, []);

  const allowed = new Set([
    'id','first_name','session_title','source_kind','actual_distance','distance_unit',
    'duration_seconds','set_count','movement_summary','filed_at','city','portrait_url','rep_splits',
  ]);
  for (const post of payload) {
    for (const key of Object.keys(post)) assert.ok(allowed.has(key), `unexpected response key ${key}`);
    assert.equal(post.city, null);
  }
});

test('existing sharing opt-out removes the complete post', async () => {
  const patch = await fetch(
    `${apiURL}/rest/v1/field_test_sharing?athlete_id=eq.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ enabled: false }),
    },
  );
  assert.ok(patch.ok, `${patch.status} ${await patch.text()}`);

  const { response, payload } = await fieldFeed(rosterToken);
  assert.equal(response.status, 200);
  assert.deepEqual(payload, []);
});
