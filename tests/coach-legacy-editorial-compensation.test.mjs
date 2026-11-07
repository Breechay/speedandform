import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { proposeContextualCopy, correctionIssues } from '../coach/editorial/review-rules.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(resolve(root, 'supabase/migrations/20261107083000_coach_legacy_editorial_compensation.sql'), 'utf8');
const ui = readFileSync(resolve(root, 'coach/editorial/editorial.js'), 'utf8');

test('specific weekly language becomes a routine, not a pace assertion', () => {
  const proposal = proposeContextualCopy({
    original_title: '3 mi easy', title: '3 mi easy',
    original_intent: 'Absorb speed and threshold training while maintaining the familiar weekly rhythm.',
    intent: 'Absorb speed and threshold training while maintaining the familiar weekly effort.',
    original_details: '3 mi easy.', details: '3 mi easy.'
  });
  assert.match(proposal.intent, /weekly practice/);
  assert.equal(proposal.title, '3 mi easy');
  assert.equal(proposal.details, '3 mi easy.');
});

test('swimming uses stroke timing rather than generic effort', () => {
  const proposal = proposeContextualCopy({
    original_title: 'Swim easy', title: 'Swim easy',
    original_intent: 'Practice relaxed breathing and efficient swim rhythm.',
    intent: 'Practice relaxed breathing and efficient swim effort.',
    original_details: '', details: ''
  });
  assert.equal(proposal.intent, 'Practice relaxed breathing and efficient stroke timing.');
});

test('ambiguous use remains subject to manual authoring', () => {
  const proposal = proposeContextualCopy({
    original_title: 'Easy', title: 'Easy',
    original_intent: 'Bring the rhythm forward with control.',
    intent: 'Bring the effort forward with control.',
    original_details: '', details: ''
  });
  assert.deepEqual(proposal.needsReview, ['intent']);
  assert.equal(proposal.intent, 'Bring the effort forward with control.');
});

test('unchanged and disallowed corrections cannot be approved', () => {
  const current = { title:'Easy',intent:'Build weekly practice.',details:'30 min easy.' };
  assert.match(correctionIssues({ ...current, rationale:'A specific correction rationale here.' }, current).join(' '), /Edit at least one field/);
  assert.match(correctionIssues({ ...current, intent:'Build weekly rhythm.',rationale:'A specific correction rationale here.' }, current).join(' '), /banned term/);
});

test('server path only appends typed versions with authenticated coach checks', () => {
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /is_active_coaching_administrator/);
  assert.match(sql, /is_coach_member\(s\.athlete_id\)/);
  assert.match(sql, /expected_version_id/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /INSERT INTO public\.planned_session_versions/);
  assert.match(sql, /INSERT INTO public\.planned_session_components/);
  assert.match(sql, /INSERT INTO public\.planned_session_exercises/);
  assert.match(sql, /session_completions/);
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+public\.planned_session_versions/i);
  assert.doesNotMatch(sql, /UPDATE\s+public\.planned_session_versions/i);
});

test('browser publication stays bounded, reviewed and read back', () => {
  assert.match(ui, /currentSelection\(\)/);
  assert.match(ui, /count > 10/);
  assert.match(ui, /approved: true/);
  assert.match(ui, /published_version_id/);
  assert.match(ui, /readback\(items, data\?\.published\)/);
});


test('repeated threshold copy uses pacing cues rather than a generic substitute', () => {
  const old = 'Two 12-minute threshold holds, a longer controlled effort with precise rhythm and no late-race surge.';
  const reviewed = proposeContextualCopy({
    original_title: 'Threshold',title:'Threshold',
    original_intent:old,intent:old.replace('rhythm','effort'),
    original_details:'',details:''
  });
  assert.equal(reviewed.intent,'Two 12-minute threshold holds. Hold controlled pace throughout without a late surge.');
  assert.deepEqual(reviewed.needsReview, []);
});

test('repeated half-marathon copy keeps the evidence-specific pace purpose', () => {
  const old = 'Hold sub-1:30 goal pace continuously with rhythm and manageable effort.';
  const reviewed = proposeContextualCopy({
    original_title:'Goal-pace hold',title:'Goal-pace hold',
    original_intent:old,intent:old.replace('rhythm','effort'),
    original_details:'',details:''
  });
  assert.equal(reviewed.intent,'Hold sub-1:30 goal pace continuously with control and manageable effort.');
});

test('unmatched contextual passages must still be handled by the coach', () => {
  const old = 'Find a safe rhythm over the turns and keep it controlled.';
  const reviewed = proposeContextualCopy({
    original_title:'Easy corners',title:'Easy corners',
    original_intent:old,intent:old.replace('rhythm','effort'),
    original_details:'',details:''
  });
  assert.deepEqual(reviewed.needsReview, ['intent']);
});
