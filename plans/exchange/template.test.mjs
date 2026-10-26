import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlanFileStarter, nextMonday, getAssistantInstructions } from './template.mjs';
import { validatePlanExchange } from '../../private/plan-import-standard.mjs';

test('next Monday is in the future, even if input is Monday', () => {
  assert.equal(nextMonday(new Date('2026-10-25T12:00:00Z')), '2026-10-26');
  assert.equal(nextMonday(new Date('2026-10-26T12:00:00Z')), '2026-11-02');
});

test('download starter is valid according to the real FORM import contract in both units', () => {
  for (const unit of ['mi', 'km']) {
    const result = createPlanFileStarter({ startDate: '2026-11-02', unit });
    assert.deepEqual(validatePlanExchange(result), { ok: true, errors: [] });
    assert.equal(result.unit_preference, unit);
    assert.equal(result.sessions.length, 4);
    assert.equal(result.sessions[3].date, '2026-11-07');
    assert.ok(result.sessions.every(s => !('athlete_id' in s)));
  }
});

test('rejects malformed days, non-Monday starts and unrecognized units', () => {
  assert.throws(() => createPlanFileStarter({ startDate: '2026-02-30' }));
  assert.throws(() => createPlanFileStarter({ startDate: '2026-11-03' }));
  assert.throws(() => createPlanFileStarter({ startDate: '2026-11-02', unit: 'pace' }));
});

test('AI instructions explicitly protect data and structured workout fields', () => {
  const instructions = getAssistantInstructions();
  for (const term of ['protected days', 'schema_version 1', 'recovery', 'athlete_id', 'never invent']) {
    assert.ok(instructions.toLowerCase().includes(term.toLowerCase()));
  }
});
