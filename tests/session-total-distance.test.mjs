import assert from 'node:assert/strict';
import test from 'node:test';

import { authoredMiles, sessionTotalDistance, sessionTotalLabel, structureOf } from '../private/render.js';

const steadyFinish = (amount, unit, easy, finish) => ({
  prescribed_distance: amount,
  distance_unit: unit,
  components: [
    { position: 1, role: 'work', shape: 'continuous', distance: easy, distance_unit: unit },
    { position: 2, role: 'work', shape: 'continuous', distance: finish, distance_unit: unit }
  ]
});

test('a nine-mile steady finish is nine miles, not its seven-mile opening', () => {
  const version = steadyFinish(9, 'mi', 7, 2);
  assert.equal(sessionTotalLabel(version), '9 mi');
  assert.equal(authoredMiles(version), 9);
  assert.equal(structureOf(version), '7 mi → 2 mi');
});

test('a 14.5 km steady finish retains metric units in its headline and anatomy', () => {
  const version = steadyFinish(14.5, 'km', 11.3, 3.2);
  assert.equal(sessionTotalLabel(version), '14.5 km');
  assert.ok(Math.abs(authoredMiles(version) - 9.0098795) < 0.0001);
  assert.equal(structureOf(version), '11.3 km → 3.2 km');
});

test('fallback sums every measurable segment with an explicit conversion', () => {
  const version = steadyFinish(null, null, 7, 2);
  version.components[0].distance_unit = 'mi';
  version.components[1].distance_unit = 'km';
  assert.deepEqual(sessionTotalDistance(version), { amount: 8.24, unit: 'mi' });
});

test('an unmeasurable timed segment cannot be turned into invented mileage', () => {
  const version = steadyFinish(null, null, 7, 2);
  delete version.components[1].distance;
  version.components[1].duration_seconds = 600;
  assert.equal(sessionTotalDistance(version), null);
});
