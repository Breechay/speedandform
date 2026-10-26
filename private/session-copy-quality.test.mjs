import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selfAuditSessionCopy, sessionEditorialIssues } from './session-editorial-standard.mjs';

test('the plain, executable version passes', () => {
  assert.equal(selfAuditSessionCopy({
    title: '5 mi easy + 4 strides',
    details: '5 mi easy. Then 4 × 15 sec fast but relaxed. Walk 60 sec between.',
    intent: 'Practice smooth, relaxed speed.'
  }).ok, true);
});

test('wordy single-paragraph explanation fails and can be rewritten', () => {
  const old = {
    title: 'Station → 500 m × 2',
    details: '4 km running total. Warm up 1 km easy (RPE 2–3). Complete 2 rounds: 250 m SkiErg at RPE 5, then run 0.5 km at RPE 4–5. Walk 200 m between rounds. Cool down 2 km easy. Record the run splits and how quickly your breathing settles.'
  };
  const report = selfAuditSessionCopy(old);
  assert.equal(report.ok, false);
  assert.ok(report.issues.some(issue => issue.message.includes('meters')));
  assert.ok(report.issues.some(issue => issue.message.includes('too long')));
  assert.ok(report.issues.some(issue => issue.message.includes('recording')));
  assert.equal(selfAuditSessionCopy({
    title: old.title,
    details: '1 km easy. Then 2 × (250 m SkiErg + 500 m run at RPE 4–5). Walk 200 m between. Finish with 2 km easy.'
  }).ok, true);
});

test('meaningful structured strength instructions are not rejected for line length alone', () => {
  assert.equal(selfAuditSessionCopy({
    title: 'Upper A',
    details: 'Incline dumbbell press: 4 × 8, rest 120 sec.\nChin-ups: 3 × 5, rest 180 sec.\nChest-supported row: 3 × 10, rest 120 sec.'
  }).ok, true);
});

test('unchanged old copy does not block an independent dose revision', () => {
  const old = { title: 'Easy — legacy', details: 'No sprinting. Run 0.5 km and record the run splits.' };
  assert.deepEqual(selfAuditSessionCopy({ ...old }, old), { ok: true, issues: [] });
});

test('new recovery forks remain blocked', () => {
  const report = selfAuditSessionCopy({ title: 'Intervals', details: '4 × 800 m if recovered.' });
  assert.equal(report.ok, false);
  assert.ok(report.issues.some(issue => issue.message.includes('contingencies')));
});

test('race pace ranges remain allowed', () => {
  assert.deepEqual(sessionEditorialIssues({ title: '4 mi at 6:48–6:52/mi', details: '' }), []);
});
