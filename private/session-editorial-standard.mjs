// Athlete-facing editorial gate for the coach's session authoring form.
// The coach decides the prescription. This validator never rewrites a workout.
const RULES = [
  [/\u2014/u, 'Use a short sentence instead of a long em dash.'],
  [/\b(?:not a sprint|no sprinting)\b/iu, 'Remove redundant sprint commentary.'],
  [/\brun by your own rhyt?hm\b/iu, 'Replace vague rhythm commentary with a usable instruction.'],
  [/\b(?:he|she|they|you)(?:\s+will|\s*\x27ll)?\s+report back\b/iu, 'Remove reporting instructions from the workout.'],
  [/\b(?:if absorbed|if recovered|if Tuesday absorbed)\b/iu, 'Publish one coached prescription; keep readiness contingencies private.'],
  [/\b(?:joins the cohort|shared team practices|no race entry is assumed)\b/iu, 'Remove internal or administrative narration.'],
  [/\b(?:volume bars show the published plan|measurement of fitness)\b/iu, 'Remove UI/legal commentary.'],
  [/\bno catch-up surges\b/iu, 'Keep general pacing commentary out of the prescription.'],
  [/\bsame measured,? even route you will use\b/iu, 'Remove invented route commitments.'],
  [/\bheart rate is recorded for context and trend only\b/iu, 'Remove measurement-policy commentary from athlete instructions.'],
  [/\b(?:record how the run feels|record your time, splits, effort|note your leg and breathing effort)\b/iu, 'Move recording and review instructions into coach workflow.']
];

export function sessionEditorialIssues(copy) {
  const issues = [];
  for (const field of ['title', 'intent', 'details']) {
    const value = String(copy?.[field] ?? '').trim();
    for (const [pattern, message] of RULES) {
      if (pattern.test(value)) issues.push({ field, message });
    }
  }
  const title = String(copy?.title ?? '').trim();
  const details = String(copy?.details ?? '').trim();
  if (!title) issues.push({ field: 'title', message: 'Name the session.' });
  if (/\beasy\s*\+\s*strides\b/iu.test(title) && /\b(?:warm[ -]?up)\b/iu.test(details))
    issues.push({ field: 'details', message: 'An easy run with strides is not a warm-up. Describe only the actual prescription.' });
  if (/\b(?:note effort|report back|send (?:me|your coach)|at halfway and at the end)\b/iu.test(details))
    issues.push({ field: 'details', message: 'Keep the athlete focused on executing the session, not submitting commentary.' });
  return issues;
}

// New sessions: validate all copy. Existing sessions: validate only the prose
// the coach actually changed, so older editorial debt cannot block a safe
// revision to pace, sequence, date, or distance.
export function changedSessionEditorialIssues(next, previous = null) {
  const copy = { title: next?.title, intent: next?.intent, details: next?.details };
  const issues = sessionEditorialIssues(copy);
  if (!previous) return issues;
  return issues.filter(issue => String(copy[issue.field] ?? '').trim() !== String(previous[issue.field] ?? '').trim());
}
