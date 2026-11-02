// Athlete-facing copy gate. Coaching owns the dose; this only checks words.
const RULES = [
  [/\b(?:not a sprint|no sprinting)\b/iu, 'Remove redundant sprint commentary.'],
  [/\brun by your own rhyt?hm\b/iu, 'Replace vague rhythm commentary with a usable instruction.'],
  [/\b(?:he|she|they|you)(?:\s+will|\s*\x27ll)?\s+report back\b/iu, 'Remove reporting instructions from the workout.'],
  [/\b(?:if absorbed|if recovered|if Tuesday absorbed)\b/iu, 'Publish one coached prescription; keep readiness contingencies private.'],
  [/\b(?:joins the cohort|shared team practices|no race entry is assumed)\b/iu, 'Remove internal or administrative narration.'],
  [/\b(?:volume bars show the published plan|measurement of fitness)\b/iu, 'Remove UI/legal commentary.'],
  [/\bno catch-up surges\b/iu, 'Keep general pacing commentary out of the prescription.'],
  [/\bsame measured,? even route you will use\b/iu, 'Remove invented route commitments.'],
  [/\bheart rate is recorded for context and trend only\b/iu, 'Remove measurement-policy commentary from athlete instructions.'],
  [/\b(?:record how the run feels|record your time, splits, effort|note your leg and breathing effort|record the run splits)\b/iu, 'Move recording and review instructions into coach workflow.'],
  [/\b(?:comfortable, conversational pace|building speed smoothly rather than sprinting all-out)\b/iu, 'Say easy or fast but relaxed; remove the extra explanation.'],
  [/(?:^|\s)(?:0\.|\.)(?:[1-9]\d*)\s*(?:km|mi|miles?)\b/iu, 'Write short distances in meters, such as 500 m or 800 m. Keep the actual prescribed distance unchanged.']
];

// Athlete titles should describe a runnable prescription, not an internal
// programming label. The full plan may keep richer coaching context privately.
const VAGUE_TITLES = [
  [/\bmidweek aerobic\b/iu, 'Write the actual easy-run distance or work, not “midweek aerobic”.'],
  [/\bthreshold control\b/iu, 'Name the threshold repetitions or duration; “control” is not a dose.'],
  [/\blong aerobic\b/iu, 'Call this a Long Run and show the distance.'],
  [/\b(?:easy aerobic|recovery aerobic)\b/iu, 'Use a plain Easy Run or Recovery Run title with the dose.'],
  [/\baerobic\s*\+\s*strides\b/iu, 'Write the easy distance and number of strides.'],
  [/^\s*key session\s*$/iu, 'Name the actual work; “key session” is an internal classification.'],
  [/^threshold\s*·\s*\d.*·\s*\d+(?:\.\d+)?\s*mi\s*$/iu, 'Do not put a dot between Threshold and its dose; Week can show an orphan separator.'],
  [/\b\d+\s*[×x]\s*\d+\s*[–-]\s*\d+\s*(?:min|sec)\b/iu, 'Commit to an exact work duration per repetition before publishing.']
];

const SINGLE_PARAGRAPH_LIMIT = 190;

// A strength list's exercise-to-dose separator is useful notation, not prose.
// Examine each line: a valid separator on one line must not excuse a rambling
// em dash elsewhere in the same workout.
function hasNarrativeEmDash(value) {
  return String(value).split(/\r?\n/u).some(line =>
    line.includes('—') && !/^\s*(?:[-*•]\s*)?[^.!?\n—]{2,65}\s+—\s+\d/u.test(line)
  );
}

export function sessionEditorialIssues(copy) {
  const issues = [];
  for (const field of ['title', 'intent', 'details']) {
    const value = String(copy?.[field] ?? '').trim();
    for (const [pattern, message] of RULES) {
      if (pattern.test(value)) issues.push({ field, message });
    }
    if (hasNarrativeEmDash(value))
      issues.push({ field, message: 'Use a short sentence instead of a narrative em dash.' });
  }
  const title = String(copy?.title ?? '').trim();
  const details = String(copy?.details ?? '').trim();
  for (const [pattern, message] of VAGUE_TITLES) {
    if (pattern.test(title)) issues.push({ field: 'title', message });
  }
  if (!title) issues.push({ field: 'title', message: 'Name the session.' });
  if (/\beasy\s*\+\s*strides\b/iu.test(title) && /\b(?:warm[ -]?up)\b/iu.test(details))
    issues.push({ field: 'details', message: 'An easy run with strides is not a warm-up. Describe only the actual prescription.' });
  if (/\b(?:note effort|report back|send (?:me|your coach)|at halfway and at the end)\b/iu.test(details))
    issues.push({ field: 'details', message: 'Keep the athlete focused on executing the session, not submitting commentary.' });
  if (/^\s*\d+(?:\.\d+)?\s*(?:mi|km)\s+(?:running\s+)?total\.\s*(?:warm[ -]?up|run)\b/iu.test(details))
    issues.push({ field: 'details', message: 'Remove the repeated total-mileage lead-in. Keep the warm-up, work, recovery and cool-down.' });
  if (/\b\d+\s*[×x]\s*\d+\s*[–-]\s*\d+\s*(?:min|sec)\b/iu.test(details))
    issues.push({ field: 'details', message: 'Write exact work repetition durations; do not leave an 8–10 minute choice in the instructions.' });
  if (/\bRPE\s*(\d)\s*[–-]\s*\1\b/iu.test(details))
    issues.push({ field: 'details', message: 'Write one RPE number when both ends of a range are the same.' });
  if (details.length > SINGLE_PARAGRAPH_LIMIT && !/[\r\n]/u.test(details))
    issues.push({ field: 'details', message: 'Execution is too long. Keep the exact dose in structured work and use one or two short lines.' });
  return issues;
}

// Week is a compact projection, not a replacement for the coach's complete
// session. These findings belong to the Week renderer. Never delete details
// from the canonical prescription merely to satisfy a collapsed-card layout.
export function weekPreviewEditorialIssues({ title, preview, hasStructuredWork = false } = {}) {
  const issues = [];
  const text = String(preview ?? '').trim();
  if (!text) return issues;
  if (/^\s*[·•]\s*|\s*[·•]\s*$/u.test(text))
    issues.push({ field: 'preview', message: 'Remove leading or trailing separators from the athlete Week headline.' });
  if (hasStructuredWork && /\b(?:drills\s*\+\s*\d+\s*strides|\d+\s*(?:relaxed\s+)?strides\s+(?:after|before)\s+the\s+warm[ -]?up)\b/iu.test(text))
    issues.push({ field: 'preview', message: 'Keep drill and stride instructions in the full session when the structured Week card already shows the speed work.' });
  if (/^\s*\d+(?:\.\d+)?\s*(?:mi|km)\s+(?:running\s+)?total\.\s*(?:warm[ -]?up|run)\b/iu.test(text))
    issues.push({ field: 'preview', message: 'The card already shows the workout total. Start with the actual work.' });
  if (hasStructuredWork && /\b(?:warm[ -]?up|cool[ -]?down)\b/iu.test(text) && /\b(?:warm[ -]?up|cool[ -]?down)\b/iu.test(String(title ?? '')))
    issues.push({ field: 'preview', message: 'Do not repeat structured warm-up or cool-down labels.' });
  return issues;
}

// A quality day cannot be published with only a prose description of work.
// Use this in the editor with the *actual* typed components. Missing recovery
// or ambiguous range still requires a coach to author it; never generate work.
export function unstructuredQualityIssue({ title, components = [] } = {}) {
  const value = String(title ?? '');
  if (!/\b(?:threshold|tempo|intervals?|speed|track|hills?|fartlek)\b/iu.test(value))
    return null;
  if (Array.isArray(components) && components.some(part =>
    part?.role === 'work' && (
      Number(part.distance) > 0 || Number(part.durationSeconds ?? part.duration_seconds) > 0
    ))) return null;
  return {
    field: 'components',
    message: 'Quality work needs typed repetitions or duration, effort and recovery before publishing.'
  };
}

// Validate changed prose only. Existing legacy copy does not block a safe dose
// revision, but newly introduced wording must pass before it is saved.
export function changedSessionEditorialIssues(next, previous = null) {
  const copy = { title: next?.title, intent: next?.intent, details: next?.details };
  const issues = sessionEditorialIssues(copy);
  if (!previous) return issues;
  return issues.filter(issue => String(copy[issue.field] ?? '').trim() !== String(previous[issue.field] ?? '').trim());
}

// Writers/agents use this after each draft and rewrite until it returns ok.
// It cannot approve coaching load, infer a missing recovery or change a pace.
export function selfAuditSessionCopy(next, previous = null) {
  const issues = changedSessionEditorialIssues(next, previous);
  return { ok: issues.length === 0, issues };
}
