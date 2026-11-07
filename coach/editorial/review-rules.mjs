// This file proposes copy for a HUMAN coach to compare to the historical
// authored wording. It never submits a publish call or alters a workout dose.
const replacements = Object.freeze([
  [/\bweekly rhythm\b/gi, 'weekly practice'],
  [/\bswim rhythm\b/gi, 'stroke timing'],
  [/\brunning rhythm\b/gi, 'running pace'],
  [/\bendurance rhythm\b/gi, 'endurance consistency'],
  [/\brace rhythm\b/gi, 'race pace'],
  [/\bsteady rhythm\b/gi, 'steady pace'],
  [/\beven rhythm\b/gi, 'even pace'],
  [/\bcontrolled rhythm\b/gi, 'controlled pace'],
  [/\brepeat your rhythm\b/gi, 'repeat your prescribed pace'],
  [/\bhold the rhythm\b/gi, 'hold the prescribed pace'],
  [/\bthe rhythm\b/gi, 'the prescribed pace'],
  [/\byour rhythm\b/gi, 'your pace']
]);

const forbidden = /\brhythms?\b/i;
const tight = s => String(s ?? '').trim();

function contextualRewrite(input) {
  let output = tight(input);
  for (const [source, target] of replacements) output = output.replace(source, target);
  // Never guess what an isolated, unmatched term means. A coach must write it.
  return forbidden.test(output) ? null : output;
}

export function proposeContextualCopy(record) {
  const prior = {
    title: tight(record?.original_title),
    intent: tight(record?.original_intent),
    details: tight(record?.original_details)
  };
  const current = {
    title: tight(record?.title),
    intent: tight(record?.intent),
    details: tight(record?.details)
  };
  const proposed = {};
  const needsReview = [];
  for (const field of ['title', 'intent', 'details']) {
    if (!forbidden.test(prior[field])) {
      proposed[field] = current[field];
      continue;
    }
    const rewritten = contextualRewrite(prior[field]);
    if (rewritten == null) {
      proposed[field] = current[field];
      needsReview.push(field);
    } else {
      proposed[field] = rewritten;
    }
  }
  // Improve a few known awkward phrases from the earlier global substitution.
  proposed.intent = proposed.intent
    .replace(/Keep an easy weekend endurance effort\./gi,
      'Keep the weekend long run comfortably easy.')
    .replace(/Maintain an easy running effort\./gi,
      'Maintain easy running at a conversational pace.')
    .replace(/Build the ability to repeat your effort without drifting faster/gi,
      'Build the ability to repeat your prescribed pace without drifting faster');
  return {
    ...proposed,
    needsReview,
    rationale: 'Contextual editorial correction after reviewing previous and current session copy.'
  };
}

export function correctionIssues(next, current) {
  const errors = [];
  const text = ['title','intent','details'];
  for (const field of text) {
    if (forbidden.test(tight(next[field]))) errors.push(field + ': banned term remains');
  }
  if (tight(next.title).length < 3 || tight(next.title).length > 150) errors.push('Title must be 3–150 characters.');
  if (!tight(next.intent) || tight(next.intent).length > 500) errors.push('Intent must be 1–500 characters.');
  if (tight(next.details).length > 2000) errors.push('Details exceed 2000 characters.');
  if (tight(next.rationale).length < 18 || tight(next.rationale).length > 400) errors.push('Give a specific change reason (18–400 characters).');
  if (text.every(field => tight(next[field]) === tight(current[field]))) errors.push('Edit at least one field.');
  return errors;
}
