import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sessionEditorialIssues, changedSessionEditorialIssues } from './session-editorial-standard.mjs';

test('clean prescribed easy run and strides passes', () => {
  assert.deepEqual(sessionEditorialIssues({
    title: 'Easy + strides',
    details: 'Easy pace: 8:00/mi or slower. 6 × 20 sec strides with 2 min walk/jog recovery.',
    intent: 'Build aerobic endurance and relaxed mechanics.'
  }), []);
});

test('blocks filler, em dash and falsely labelled easy run warm-up', () => {
  const found = sessionEditorialIssues({
    title: 'Easy + Strides',
    details: '40 min warm-up — not a sprint. Note effort halfway and at the end.',
    intent: ''
  });
  assert.ok(found.some(issue => issue.message.includes('em dash')));
  assert.ok(found.some(issue => issue.message.includes('warm-up')));
  assert.ok(found.some(issue => issue.message.includes('reporting') || issue.message.includes('executing')));
});

test('unchanged legacy narration cannot block a pacing revision', () => {
  const previous = { title: 'Easy — short', details: 'No sprinting.', intent: '' };
  assert.deepEqual(changedSessionEditorialIssues({ ...previous }, previous), []);
});

test('a revision with newly introduced bad wording is blocked', () => {
  const previous = { title: 'Threshold', details: '4 × 6 min', intent: '' };
  const found = changedSessionEditorialIssues({ ...previous, details: '4 × 6 min — if recovered' }, previous);
  assert.ok(found.length >= 2);
  assert.ok(found.every(issue => issue.field === 'details'));
});

test('a new athlete has the same standard', () => {
  const found = changedSessionEditorialIssues({ title: 'Easy', details: 'Run by your own rhythm.', intent: '' });
  assert.ok(found.length > 0);
});

test('pace ranges retain the typographic en dash', () => {
  assert.deepEqual(sessionEditorialIssues({ title: '4 mi continuous at 6:48–6:52/mi', details: '' }), []);
});
