import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coachNoteReading, coachNoteReadingHtml } from '../private/coach-note-reading.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('legacy audit identifiers become quiet provenance without losing words', () => {
  const original = 'CASE-REVIEW-20261108 | 2026-11-08 | The athlete completed the session. The pace was steady. The next step is recovery.';
  const shown = coachNoteReading(original);
  assert.equal(shown.reference, 'CASE-REVIEW-20261108');
  assert.equal(shown.referenceDate, '2026-11-08');
  assert.deepEqual(shown.paragraphs, [
    'The athlete completed the session. The pace was steady.',
    'The next step is recovery.'
  ]);
  assert.equal(shown.original, original);
  assert.match(coachNoteReadingHtml(original), /Record reference: <code>CASE-REVIEW-20261108<\/code> · Source date: 2026-11-08/);
  assert.doesNotMatch(coachNoteReadingHtml(original, { createdAt: '2026-11-08T12:00:00Z' }), /Source date:/);
  const dotted = coachNoteReading('CASE-REVIEW-20261108 · One action was taken. The next step is clear.');
  assert.equal(dotted.reference, 'CASE-REVIEW-20261108');
  assert.equal(dotted.paragraphs[0], 'One action was taken. The next step is clear.');
});

test('historical notes remain exact and user-authored line breaks stay readable', () => {
  const original = 'The run felt easy. No pain was reported.\n\nKeep the next day light.';
  const shown = coachNoteReading(original);
  assert.equal(shown.reference, '');
  assert.deepEqual(shown.paragraphs, ['The run felt easy. No pain was reported.', 'Keep the next day light.']);
  assert.doesNotMatch(coachNoteReadingHtml(original), /Record reference:/);
  assert.match(coachNoteReadingHtml('<script>alert(1)</script>'), /&lt;script&gt;/);
});

test('all three coach note surfaces use the same paragraph reader', () => {
  const labs = read('coach/labs/labs.js');
  const programming = read('coach/coach.js');
  assert.equal((labs.match(/coachNoteReadingHtml\(note\.body, \{ createdAt: note\.created_at \}\)/g) || []).length, 2);
  assert.match(programming, /coachNoteReadingHtml\(note\.body, \{ createdAt: note\.created_at \}\)/);
  assert.match(read('coach/workspace-light.css'), /\.coach-page \.coachNoteProse p \{/);
});

test('the seven-day dossier is a session index rather than a full interval transcript', () => {
  const labs = read('coach/labs/labs.js');
  assert.match(labs, /function dossierSessionTileHtml\(session\)/);
  assert.match(labs, /const mixed = count > 1/);
  assert.match(labs, /\$\{count\} work parts/);
  assert.match(labs, /mine\.map\(dossierSessionTileHtml\)/);
  assert.match(read('coach/workspace-light.css'), /\.ccSession__title \{/);
});
