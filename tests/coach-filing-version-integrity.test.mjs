import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { filingVersionContext, filingVersionExplanation } from '../private/filing-version-context.mjs';

const older = {
  id: 'old', version_number: 4, title: 'FORM half · 200s', created_at: '2026-11-02T20:36:12Z',
  components: [{ role: 'work', shape: 'repetitions', repeat_count: 4, distance: .2, distance_unit: 'km' }]
};
const current = {
  id: 'new', version_number: 5, title: 'Speed · 100m rhythm', created_at: '2026-11-04T11:58:51Z',
  components: [{ role: 'work', shape: 'repetitions', repeat_count: 10, distance: .1, distance_unit: 'km' }]
};
const session = { id: 'planned', currentVersion: current, versions: [current, older] };
const completion = {
  planned_session_id: session.id, planned_session_version_id: older.id,
  filed_at: '2026-11-05T08:00:00Z'
};

test('a filed 200m version is not silently read as the new 100m prescription', () => {
  const context = filingVersionContext(session, completion);
  assert.equal(context.state, 'older_at_filing');
  assert.equal(context.filed.id, older.id);
  assert.equal(context.current.id, current.id);
  const explanation = filingVersionExplanation(context);
  assert.match(explanation, /version 4 \(4 × 200m\)/);
  assert.match(explanation, /version 5 \(10 × 100m\)/);
  assert.match(explanation, /Check which workout the athlete actually saw and performed/);
});

test('a legitimate revision made after the activity preserves its original meaning', () => {
  const context = filingVersionContext(session, { ...completion, filed_at: '2026-11-03T08:00:00Z' });
  assert.equal(context.state, 'revised_after_filing');
  assert.match(filingVersionExplanation(context), /original filing remains attached/);
});

test('missing or unknown immutable version stays unverified', () => {
  assert.equal(filingVersionContext(session, { ...completion, planned_session_version_id: current.id }).state, 'current');
  assert.equal(filingVersionContext(session, { ...completion, planned_session_version_id: null }).state, 'unverified');
  assert.equal(filingVersionContext(session, { ...completion, planned_session_version_id: 'unknown' }).state, 'version_unavailable');
  assert.equal(filingVersionContext(null, completion).state, 'unlinked');
});

test('both coach readers use the pinned version and keep mismatch visible', () => {
  const coach = fs.readFileSync(new URL('../coach/coach.js', import.meta.url), 'utf8');
  const labs = fs.readFileSync(new URL('../coach/labs/labs.js', import.meta.url), 'utf8');
  assert.match(coach, /const filing = filingVersionContext\(session, completion\)/);
  assert.match(coach, /const work = prescribedParts\.find/);
  assert.match(coach, /filingVersionExplanation\(filingVersion\)/);
  assert.match(labs, /const version = filing\?\.filed \|\| session\.currentVersion/);
  assert.match(labs, /filingVersionExplanation\(filing\)/);
  assert.doesNotMatch(labs, /function revisedAfterFiling\(/);
});
