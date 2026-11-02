// Shared athlete-visible copy review. The title registry is an *editorial*
// suggestion, never a substitute for inspecting the actual prescription.
// No dosage or pace is inferred from these phrases.
export const STRENGTH_EMPHASIS = Object.freeze({
  'Glute A + Lower': 'Glutes · hinge strength · single-leg control',
  'Glute A · Hinge': 'Glutes · hamstrings · hinge strength',
  'Glute B · Thrust': 'Glutes · hip extension · stability',
  'Upper Push + Shoulders': 'Upper chest · shoulders · triceps',
  'Pull': 'Back width · rear delts · serratus',
  'Pull + Arms + Delts': 'Back · rear delts · arms',
  'Upper A': 'Upper chest · back · shoulders',
  'Upper B': 'Chest · back · arms',
  'Lower A': 'Single-leg strength · hamstrings · core',
  'Lower B': 'Legs · hip extension · trunk stability',
  'Lower Primer': 'Lower-body preparation · core control',
  'Lower Restore': 'Controlled legs · hamstrings · core',
  'Frame A': 'Pressing · rows · shoulders',
  'Frame B': 'Back · pressing · arms'
});

const INTERNAL_COPY = /coach.only|internal.only|private.note|draft|pending.publication|approval.queue|source.system|publish.this|admin.only|rpc|sql|placeholder|lorem ipsum|https?:\/\//i;

export function validateAthleteCopy(copy, limit = 180) {
  const value = String(copy ?? '').trim();
  if (value.length < 8 || value.length > limit || /[\r\n]/.test(value) || INTERNAL_COPY.test(value)) {
    return 'Use one concise athlete-facing sentence, with no administrative text.';
  }
  const segments = value.split('·').map(part => part.trim().toLowerCase()).filter(Boolean);
  if (segments.length !== new Set(segments).size) return 'Remove repeated phrases.';
  if (/(.{10,})[\s;,.]+\1/i.test(value)) return 'Remove repeated boilerplate.';
  return null;
}

export function suggestRunIntent(title) {
  const name = String(title ?? '').toLowerCase();
  if (/track|\d+\s*[×x]\s*\d+\s*m(\b|\s)/.test(name)) {
    return 'Controlled track repeats · smooth form and even recoveries';
  }
  if (/strides?/.test(name)) {
    return 'Comfortable aerobic running · finish with relaxed strides';
  }
  if (/long run/.test(name)) {
    return 'Aerobic endurance · easy effort and patient pacing';
  }
  if (/race pace/.test(name)) {
    return 'Race-pace endurance · controlled, even effort';
  }
  if (/steady|controlled|\d+\s*[×x]\s*\d+\s*min/.test(name)) {
    return 'Steady aerobic work · consistent, repeatable effort';
  }
  if (/easy/.test(name)) {
    return 'Relaxed aerobic running · keep breathing conversational';
  }
  return '';
}

export function buildEditorialProposal(review, overrides = {}) {
  if (review?.schema_version !== 1 || !Array.isArray(review.strength) || !Array.isArray(review.running)) {
    throw new Error('The coach copy review is missing or out of date.');
  }
  const strength = review.strength.map(day => ({
    day_id: day.day_id,
    title: day.title,
    forge_program_id: day.forge_program_id,
    forge_program_digest: day.forge_program_digest,
    emphasis: (overrides['strength:' + day.title] ?? day.emphasis
      ?? STRENGTH_EMPHASIS[day.title] ?? '').trim()
  }));
  const running = review.running.map(day => ({
    session_id: day.session_id,
    version_id: day.version_id,
    title: day.title,
    intent: (overrides['run:' + day.athlete_id + ':' + day.title]
      ?? suggestRunIntent(day.title)).trim()
  }));
  for (const item of strength) {
    const issue = validateAthleteCopy(item.emphasis, 120);
    if (issue) throw new Error(item.title + ': ' + issue);
  }
  for (const item of running) {
    const issue = validateAthleteCopy(item.intent, 180);
    if (issue) throw new Error(item.title + ': ' + issue);
  }
  return { strength, running };
}
