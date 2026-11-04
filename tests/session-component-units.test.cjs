const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('coach editor says which pace unit belongs to a metric component', async () => {
  const { componentPaceLabels } = await import('../private/session-component-units.mjs');
  assert.deepEqual(componentPaceLabels({ distance_unit: 'km' }), {
    distance: 'Distance (km)',
    fast: 'Band fast (min/km)',
    slow: 'Band slow (min/km)'
  });
  assert.equal(componentPaceLabels({ distance_unit: 'mi' }).fast, 'Band fast (min/mi)');
  assert.equal(componentPaceLabels({ distanceUnit: 'km' }).slow, 'Band slow (min/km)');
});

test('duration-only and new components default to mile-label convention', async () => {
  const { componentPaceLabels } = await import('../private/session-component-units.mjs');
  assert.equal(componentPaceLabels({ duration_seconds: 600 }).fast, 'Band fast (min/mi)');
  assert.equal(componentPaceLabels({}).distance, 'Distance (mi)');
});

test('coach form binds its pace labels to the component, not the session total', () => {
  const source = fs.readFileSync(path.join(__dirname, '../coach/coach.js'), 'utf8');
  assert.match(source, /componentPaceLabels\(part\)/);
  assert.match(source, /field\(paceLabels\.fast,/);
  assert.match(source, /field\(paceLabels\.slow,/);
  assert.match(source, /distance_unit: carriedParts\[index\]\?\.distance_unit/);
});
