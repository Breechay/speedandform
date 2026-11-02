const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('copy-only revisions never fabricate miles for timed warm-ups and cool-downs', async () => {
  const { revisedAuthoredTotal } = await import('../private/session-revision-total.mjs');
  const hope = { prescribed_distance: null, distance_unit: null,
    components: [
      { role: 'warm_up', duration_seconds: 600 },
      { role: 'work', distance: 4, distance_unit: 'mi' },
      { role: 'cool_down', duration_seconds: 600 }
    ] };
  const work = hope.components[1];
  assert.equal(revisedAuthoredTotal(hope), null);
  assert.equal(revisedAuthoredTotal(hope, work, 4), null);
  assert.equal(revisedAuthoredTotal(hope, work, 5), null);
});

test('authoritative totals follow actual work changes by the measured delta', async () => {
  const { revisedAuthoredTotal } = await import('../private/session-revision-total.mjs');
  assert.equal(revisedAuthoredTotal({ prescribed_distance: 9.5, distance_unit: 'mi' },
    { distance: 4, distance_unit: 'mi' }, 5), 10.5);
  assert.equal(revisedAuthoredTotal({ prescribed_distance: 10, distance_unit: 'mi' },
    { distance: 1, distance_unit: 'km' }, 2), 10.62);
  assert.equal(revisedAuthoredTotal({ prescribed_distance: 14, distance_unit: 'mi' }), 14);
  assert.equal(revisedAuthoredTotal({ prescribed_distance: 8, distance_unit: 'mi' },
    { shape: 'repetitions', repeat_count: 3, distance: 1, distance_unit: 'mi' }, 2), 11);
  assert.equal(revisedAuthoredTotal({ prescribed_distance: 8, distance_unit: 'mi' },
    { shape: 'repetitions', repeat_count: 4, distance: 0.5, distance_unit: 'km' }, 1), 9.24);
});

test('the live editor preserves components on wording changes instead of re-serializing them', () => {
  const source = fs.readFileSync(path.join(__dirname, '../coach/labs/labs.js'), 'utf8');
  const save = source.slice(source.indexOf("const doseField = document.getElementById('rvDose')"),
    source.indexOf("const button = document.getElementById('shSave')", source.indexOf("const doseField = document.getElementById('rvDose')")));
  assert.match(save, /let components = null;/);
  assert.match(save, /let total = revisedAuthoredTotal\(version\);/);
  assert.match(save, /if \(Math\.abs\(next - Number\(dose\.distance\)\) > 0\.000001\)/);
  assert.doesNotMatch(save, /525/);
  assert.doesNotMatch(save, /durationSeconds \* reps/);
});
