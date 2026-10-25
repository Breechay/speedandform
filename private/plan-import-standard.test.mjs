import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePlanExchange, validatePlanExchange } from './plan-import-standard.mjs';

const fixture = () => ({
  schema_version: 1, name: 'My running plan', unit_preference: 'mi',
  sessions: [
    { date: '2026-11-02', type: 'easy_strides', title: 'Easy + strides', duration: 40, pace: { min: 480, max: 600, unit: 'sec_per_mi' }, instructions: '4 relaxed strides after the easy run.' },
    { date: '2026-11-03', type: 'rest', title: 'Rest' }
  ]
});

test('ordinary draft with easy strides is accepted', () => assert.deepEqual(validatePlanExchange(fixture()), { ok: true, errors: [] }));
test('unknown fields cannot smuggle athlete ID or publish authority', () => {
  const x = fixture(); x.athlete_id = 'someone-else'; x.sessions[0].coach_approved = true;
  const result = validatePlanExchange(x);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(x => x.includes('athlete_id')));
  assert.ok(result.errors.some(x => x.includes('coach_approved')));
});
test('invalid dates and duplicates are rejected', () => {
  const x = fixture(); x.sessions[0].date = '2026-02-30'; x.sessions[1].date = '2026-02-30';
  assert.equal(validatePlanExchange(x).ok, false);
  x.sessions[0].date = '2026-11-03'; x.sessions[1].date = '2026-11-03';
  assert.ok(validatePlanExchange(x).errors.some(e => e.includes('two sessions')));
});
test('speed prose is not silently converted to an executable workout', () => {
  const x = fixture(); x.sessions[0].type = 'speed'; x.sessions[0].title = '6 × 800m';
  assert.ok(validatePlanExchange(x).errors.some(e => e.includes('reviewed interval')));
});
test('editorial guard prevents generic or private language', () => {
  const x = fixture(); x.sessions[0].instructions = 'If recovered — not a sprint.';
  assert.equal(validatePlanExchange(x).ok, false);
});
test('pace units and order are explicit', () => {
  const x = fixture(); x.sessions[0].pace = { min: 600, max: 480, unit: 'minutes' };
  assert.ok(validatePlanExchange(x).errors.some(e => e.includes('fastest bound')));
  assert.ok(validatePlanExchange(x).errors.some(e => e.includes('sec_per_mi')));
});
test('malformed or overlarge JSON fails cleanly', () => {
  assert.equal(parsePlanExchange('{broken').ok, false);
  assert.equal(parsePlanExchange('x'.repeat(262145)).ok, false);
});
