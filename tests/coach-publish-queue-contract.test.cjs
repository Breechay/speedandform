// Release queue must be derived from owning records, not raw draft counts.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8');
const data = read('private/data.js');
const source = data.split('export function publicationQueueForAthlete')[1].split('export async function loadCoachRoster')[0];
const publicationQueueForAthlete = new Function('return function publicationQueueForAthlete' + source)();

const groups = ['strength-sculpt02-full-v2-candidate','strength-sculpt02-glute-only','strength-sculpt02-full','strength-durable-frame-individual'].map(group_key => ({ group_key, status: 'draft' }));
const member = (group_key,status='planned') => ({ athlete_id:'athlete-a',group_key,status });

test('v2 supplants legacy full and Durable Frame: one actionable item, not three', () => {
  const queue = publicationQueueForAthlete('athlete-a', {
    groups, members: [member('strength-sculpt02-full'),member('strength-durable-frame-individual'),member('strength-sculpt02-full-v2-candidate')]
  });
  assert.equal(queue.length, 1);
  assert.match(queue[0].label,/Sculpt 02/);
});

test('the Glute Priority group remains visible for activation even with live strength days', () => {
  const queue = publicationQueueForAthlete('athlete-a', { groups, members:[member('strength-sculpt02-glute-only')] });
  assert.equal(queue.length, 1);
  assert.match(queue[0].label,/Glute Priority/);
  assert.equal(queue[0].state,'verify');
});

test('held and ended memberships do not count as actionable drafts', () => {
  const queue = publicationQueueForAthlete('athlete-a', { groups, members:[member('strength-intake-unassigned','held'),member('strength-sculpt02-full-v2-candidate','ended')] });
  assert.deepEqual(queue, []);
});

test('independent future block drafts stay visible alongside a strength activation', () => {
  const queue = publicationQueueForAthlete('athlete-a', {
    groups, members:[member('strength-sculpt02-glute-only')],
    draftBlocks:[{athlete_id:'athlete-a',name:'Future HYROX'}]
  });
  assert.equal(queue.length, 2);
  assert.equal(queue[1].state,'draft');
});

test('console shows aggregate queue and per-athlete count without auto-publishing', () => {
  const script=read('coach/coach.js'), html=read('coach/index.html');
  assert.match(script,/publicationQueueToggle/);
  assert.match(script,/publicationQueueDialog\.showModal\(\)/);
  assert.match(script,/Draft \$\{publishCount\}/);
  assert.match(html,/id="publicationQueueRows"/);
  assert.doesNotMatch(script,/supabase\.from\('coach_strength_groups'\)\.update/);
});

test('roster does not query the restricted direction-draft table with a coach browser token', () => {
  const roster = data.split('export async function loadCoachRoster')[1];
  assert.doesNotMatch(roster, /supabase\.from\('athlete_direction_drafts'\)/);
  assert.match(roster, /supabase\.from\('coach_strength_group_members'\)/);
});

test('Glute Priority activation requires per-athlete coach feed proof and never claims a phone receipt', () => {
  const source = read('private/data.js');
  assert.match(source, /export async function activatePublishedGlutePriority/);
  assert.match(source, /supabase\.rpc\('coach_preview_strength_days'/);
  assert.match(source, /receipt\.days\?\.length !== 6/);
  assert.match(source, /d\.forge_program_digest === group\.program_digest/);
  assert.match(source, /nativeDeviceVerified: false/);
  const html = read('coach/index.html');
  assert.match(html, /id="activateGlutePriority"/);
});
