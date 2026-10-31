const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js/group-runs.js'), 'utf8');
const scheduled = {
  id: 'thursday-2099', kind: 'track', series_id: 'thursday-series',
  title: 'FORM Thursday', status: 'scheduled',
  meet_at: '2099-11-05T11:00:00Z', starts_at: '2099-11-05T11:15:00Z',
  meet_name: 'Flamingo Park Track', meet_address: 'Miami Beach',
  group_facts: {workout_session_id: 'speed-demons'}
};
const published = {
  run_id: scheduled.id, session_title: 'Speed · 1000 / 600 / 400 × 2',
  sets: [
    {reps: 1, meters: 1000, recovery: 120},
    {reps: 1, meters: 600, recovery: 90},
    {reps: 1, meters: 400, recovery: 180},
    {reps: 1, meters: 1000, recovery: 120},
    {reps: 1, meters: 600, recovery: 90},
    {reps: 1, meters: 400, recovery: 0}
  ]
};

async function render({workoutsFail = false, cancelled = false} = {}) {
  const nodes = Object.fromEntries(['gr-album', 'gr-title', 'gr-sub', 'gr-when', 'gr-count'].map(id =>
    [id, {innerHTML: '', textContent: ''}]));
  const requests = [];
  const run = {...scheduled, status: cancelled ? 'cancelled' : 'scheduled'};
  const document = {
    body: {classList: {add() {}}},
    getElementById: id => nodes[id] || null,
    querySelector: () => ({href: ''}),
    addEventListener() {}
  };
  const window = {};
  const fetch = async url => {
    requests.push(url);
    let payload;
    if (url.includes('/collective_public_runs?')) payload = [run];
    else if (url.endsWith('/rpc/collective_galleries')) payload = [];
    else if (url.endsWith('/rpc/form_miami_public_calendar')) {
      if (workoutsFail) return {ok: false};
      payload = [published];
    } else throw new Error('Unexpected public request: ' + url);
    return {ok: true, json: async () => payload};
  };
  vm.runInNewContext(source, {
    document, window, fetch, AbortController, setTimeout, clearTimeout,
    URLSearchParams, location: {pathname: '/run/form-thursday-2099-11-05/'},
  }, {filename: 'group-runs.js'});
  for (let i = 0; i < 8 && !window.FORM_GROUP_ALBUM; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(window.FORM_GROUP_ALBUM?.run, true, 'detail page rendered');
  assert.ok(requests.some(url => url.endsWith('/rpc/form_miami_public_calendar')), 'detail reads public workout projection');
  assert.ok(requests.every(url => !/coach|private|athlete/.test(url)), 'no private endpoint requested');
  return nodes['gr-album'].innerHTML;
}

(async () => {
  const linked = await render();
  assert.match(linked, /gr-workout-title">Speed · 1000 \/ 600 \/ 400 × 2</);
  assert.equal((linked.match(/class="gr-set-work"/g) || []).length, 6, 'exact published set count');
  assert.match(linked, /1 × 1000m/);
  assert.match(linked, /2:00 recovery/);
  assert.match(linked, /1:30 recovery/);
  assert.match(linked, /3:00 recovery/);
  assert.doesNotMatch(linked, /class="gr-work"/, 'detail does not repeat the long inline summary');
  assert.doesNotMatch(linked, /host|pace target|athlete_id/i, 'no private per-athlete fields');

  const fallback = await render({workoutsFail: true});
  assert.doesNotMatch(fallback, /gr-workout-sets/);
  assert.match(fallback, /Speed Demons/, 'a public workout RPC outage preserves legacy summary');

  const cancelled = await render({cancelled: true});
  assert.doesNotMatch(cancelled, /gr-workout-sets|Add to calendar/);
  assert.match(cancelled, /Not meeting on this date/);
  console.log('Group run detail: published workout, graceful fallback and cancellation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
