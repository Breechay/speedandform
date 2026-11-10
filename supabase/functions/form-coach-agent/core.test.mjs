import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertDateWindow, canonicalJson, revisionFingerprint,
  validateRevision, toolFailure, ContractError,
} from './core.mjs';

const revision = () => ({
  plannedSessionId: '11111111-1111-4111-8111-111111111111',
  expectedVersionId: '22222222-2222-4222-8222-222222222222',
  title: 'Long Run · race pace',
  intent: 'Practice controlled race pace inside a longer aerobic run.',
  changeReason: 'Coach-requested Saturday workout revision.',
  prescribedDistance: 11,
  distanceUnit: 'mi',
  details: 'Cool down easy until the watch reaches 11.0 miles.',
  components: [
    { role: 'warm_up', shape: 'continuous', distance: 3, distanceUnit: 'mi' },
    { role: 'work', shape: 'repetitions', repeatCount: 3, durationSeconds: 480,
      recoveryKind: 'easy', recoverySeconds: 480, paceLowSeconds: 408, paceHighSeconds: 412 },
    { role: 'cool_down', shape: 'continuous', durationSeconds: 1200 },
  ],
});

test('accepts exact, typed interval work and whole-run miles', () => {
  const result = validateRevision(revision());
  assert.equal(result.prescribedDistance, 11);
  assert.equal(result.components[1].repeatCount, 3);
});

test('rejects invented component keys and missing time or distance', () => {
  const wrong = revision();
  wrong.components[0].madeUp = true;
  assert.throws(() => validateRevision(wrong), /Unknown component field/);
  const missing = revision();
  delete missing.components[2].durationSeconds;
  assert.throws(() => validateRevision(missing), /needs distance or duration/);
});

test('rejects reversed pace, incompatible units and missing recoveries', () => {
  const pace = revision();
  pace.components[1].paceHighSeconds = 390;
  assert.throws(() => validateRevision(pace), /reversed pace/);
  const unit = revision();
  unit.distanceUnit = 'yards';
  assert.throws(() => validateRevision(unit), /supported unit/);
  const recovery = revision();
  delete recovery.components[1].recoverySeconds;
  assert.throws(() => validateRevision(recovery), /both recovery kind/);
});

test('window never silently crosses more than 22 dates', () => {
  assert.doesNotThrow(() => assertDateWindow('2026-11-09', '2026-11-16'));
  assert.throws(() => assertDateWindow('2026-11-09', '2026-12-09'), /at most/);
  assert.throws(() => assertDateWindow('2026-11-31', '2026-12-01'), /valid window/);
});

test('fingerprints are order-stable but change with the intended dose', async () => {
  const original = revision();
  const rearranged = { ...original, details: original.details, title: original.title };
  assert.equal(canonicalJson(original), canonicalJson(rearranged));
  assert.equal(await revisionFingerprint(original), await revisionFingerprint(rearranged));
  assert.notEqual(await revisionFingerprint(original), await revisionFingerprint({ ...original, prescribedDistance: 12 }));
});

test('unknown tool failures do not leak backend errors or secrets', () => {
  const error = toolFailure(new Error('secret-role-key: xyz'));
  assert.equal(error.isError, true);
  assert.doesNotMatch(JSON.stringify(error), /secret-role-key|xyz/);
  const known = toolFailure(new ContractError('Wrong current version.', 'VERSION_CONFLICT'));
  assert.match(JSON.stringify(known), /VERSION_CONFLICT/);
});
