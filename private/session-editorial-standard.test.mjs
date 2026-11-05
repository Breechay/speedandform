import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { sessionEditorialIssues, changedSessionEditorialIssues, weekPreviewEditorialIssues, prescriptionPresentationIssues } from './session-editorial-standard.mjs';

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

test('the revision baseline is captured only when the selected session editor opens', () => {
  const coachSource = fs.readFileSync(new URL('../coach/coach.js', import.meta.url), 'utf8');
  const assignment = 'originalSessionEditorialCopy = session ? {';
  assert.equal(coachSource.split(assignment).length - 1, 1);
  assert.ok(coachSource.indexOf(assignment) > coachSource.indexOf('function openSession('));
});

test('published roster boilerplate is rejected for a newly authored session', () => {
  const examples = [
    'No catch-up surges.',
    'Use the same measured, even route you will use November 10.',
    'Heart rate is recorded for context and trend only.',
    'Record your time, splits, effort, conditions and shoes.'
  ];
  for (const details of examples) {
    assert.ok(sessionEditorialIssues({ title: 'Threshold', details }).length > 0, details);
  }
});

test('specific useful instructions remain valid', () => {
  const copy = {
    title: 'Speed · 600s & 200s',
    details: 'Drills + 4 strides before the first set. Full recovery between sets.',
    intent: 'Develop speed and control.'
  };
  assert.deepEqual(sessionEditorialIssues(copy), []);
});

test('strength list em dashes are valid dose separators, prose em dashes are not', () => {
  assert.deepEqual(sessionEditorialIssues({
    title: 'Upper strength',
    details: 'Bench press — 4 × 8\nRow — 3 × 10\nPlank — 3 × 45 sec'
  }), []);
  const issues = sessionEditorialIssues({
    title: 'Upper strength',
    details: 'Bench press — 4 × 8\nRun strong — you can do it.'
  });
  assert.ok(issues.some(issue => issue.message.includes('narrative em dash')));
});

test('repeated mileage introduction and identical RPE range are rejected', () => {
  const issues = sessionEditorialIssues({
    title: '3 × 500 m controlled',
    details: '4 km running total. Warm up 1 km easy. Run 3 × 500 m at RPE 6–6. Cool down 1.5 km.'
  });
  assert.ok(issues.some(issue => issue.message.includes('repeated total-mileage')));
  assert.ok(issues.some(issue => issue.message.includes('one RPE number')));
});

test('Week-only duplicate preparation is flagged without altering actual session details', () => {
  const copy = {
    title: 'Descent Into Ruin',
    details: '4 relaxed strides after the warm-up. Target splits: 1600m 6:00 · 800m 2:55 · 400m 1:24.'
  };
  assert.deepEqual(sessionEditorialIssues(copy), []);
  assert.ok(weekPreviewEditorialIssues({
    title: copy.title,
    preview: copy.details,
    hasStructuredWork: true
  }).length > 0);
  assert.deepEqual(weekPreviewEditorialIssues({ title: copy.title, preview: copy.details }), []);
});

test('Week detects redundant mileage without rejecting concise dose', () => {
  assert.ok(weekPreviewEditorialIssues({
    title: '3 × 800 m controlled',
    preview: '4 mi running total. Warm up 1 mi, then 3 × 800 m.'
  }).length > 0);
  assert.deepEqual(weekPreviewEditorialIssues({
    title: '3 × 800 m controlled',
    preview: '1 mi easy. 3 × 800 m at RPE 6–7, walk 160 m between. 1.5 mi easy.'
  }), []);
});


test('a metric track title must agree with the typed component unit', () => {
  assert.deepEqual(prescriptionPresentationIssues('Speed · 200m rhythm', [
    { role: 'work', distance: 0.2, distanceUnit: 'km' }
  ]), []);
  assert.ok(prescriptionPresentationIssues('Speed · 200m rhythm', [
    { role: 'work', distance: 0.2, distanceUnit: 'mi' }
  ]).length);
  assert.ok(prescriptionPresentationIssues('Aerobic power · 800m', [
    { role: 'work', distance: 0.5, distanceUnit: 'mi' }
  ]).length);
  assert.deepEqual(prescriptionPresentationIssues('Rhythm · 1 minute changes', [
    { role: 'work', durationSeconds: 60 }
  ]), []);
});

test('Console exposes component units and syncs single-work RPE on anatomy edits', () => {
  const coachSource = fs.readFileSync(new URL('../coach/coach.js', import.meta.url), 'utf8');
  assert.match(coachSource, /name=\"partDistanceUnit\"/);
  assert.match(coachSource, /work\.rpeLow = payload\.rpeLow/);
  assert.match(coachSource, /prescriptionPresentationIssues\(payload\.title, payload\.components \|\| existingParts\)/);
});

test('FORM ban rejects 3 × 10-minute run intervals and mile repeats, not strength sets or continuous work', () => {
  assert.ok(prescriptionPresentationIssues('3 × 10 min steady', [
    { role: 'work', repeatCount: 3, durationSeconds: 600 }
  ]).some(issue => issue.includes('3 × 10-minute')));
  assert.ok(prescriptionPresentationIssues('3 × 1 mi at pace', [
    { role: 'work', repeat_count: 3, distance: 1, distance_unit: 'mi' }
  ]).some(issue => issue.includes('mile repeats')));
  assert.ok(prescriptionPresentationIssues('Mile Repeatability', []).some(issue => issue.includes('mile repeats')));
  assert.deepEqual(prescriptionPresentationIssues('Tempo · 30 min', [
    { role: 'work', shape: 'continuous', durationSeconds: 1800 }
  ]), []);
  assert.deepEqual(prescriptionPresentationIssues('3 × 1 km controlled', [
    { role: 'work', repeatCount: 3, distance: 1, distanceUnit: 'km' }
  ]), []);
  assert.deepEqual(prescriptionPresentationIssues('Long run · last 1 mi steady', [
    { role: 'work', shape: 'continuous', distance: 9, distanceUnit: 'mi' },
    { role: 'work', shape: 'continuous', distance: 1, distanceUnit: 'mi' }
  ]), []);
  assert.deepEqual(sessionEditorialIssues({ title: 'Strength', details: 'Bench press — 3 × 10' }), []);
});

test('long-run Week and filing titles never repeat the weekday', () => {
  assert.ok(sessionEditorialIssues({
    title: 'Saturday long · 10 mi', details: '10 mi easy.', intent: 'Build durability.'
  }).some(issue => issue.field === 'title'));
  assert.deepEqual(sessionEditorialIssues({
    title: 'Long run · 10 mi · with FORM', details: '10 mi easy at RPE 2–3.', intent: 'Build durability.'
  }), []);
});

test('late miles are separately typed before the feed can render a long-run finish', () => {
  const title = 'Long run · 11 mi · last 2 steady';
  const flat = [{ role: 'work', shape: 'continuous', distance: 11, distance_unit: 'mi' }];
  const structured = [
    { role: 'work', shape: 'continuous', distance: 9, distance_unit: 'mi' },
    { role: 'work', shape: 'continuous', distance: 2, distance_unit: 'mi' }
  ];
  assert.ok(prescriptionPresentationIssues(title, flat).some(issue => issue.includes('separate typed')));
  assert.deepEqual(prescriptionPresentationIssues(title, structured), []);
  assert.deepEqual(prescriptionPresentationIssues('Long run · 12 mi', [
    { role: 'work', shape: 'continuous', distance: 12, distance_unit: 'mi' }
  ]), []);
});
