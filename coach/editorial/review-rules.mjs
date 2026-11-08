// This file proposes copy for a HUMAN coach to compare to the historical
// authored wording. It never submits a publish call or alters a workout dose.
const replacements = Object.freeze([
  [/\bKeep an easy weekend endurance rhythm\./gi, 'Keep the weekend long run comfortably easy.'],
  [/\bMaintain an easy running rhythm\./gi, 'Maintain easy running at a conversational pace.'],
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
]);


// Exact, reviewed source-copy patterns found in the 2026-11-07 incident audit.
// These are *suggestions*, never automatic coach publication. A repeated intent
// should describe pace, technique or recovery precisely rather than defaulting
// to the generic noun used by the earlier administrative substitution.
const exactIntentSuggestions = new Map([
  ["Two sustained 10-minute holds. Build an even rhythm that lasts.", "Two sustained 10-minute holds. Establish an even pace you can sustain."],
  ["Five controlled 1000m repetitions. Build durable 5K rhythm with consistent mechanics rather than chasing a single fast rep.", "Five controlled 1,000 m repetitions. Practice even 5K pace and consistent mechanics rather than chasing one fast rep."],
  ["Three controlled 8-minute threshold holds. Build the ability to repeat your rhythm without drifting faster than the prescribed band.", "Three controlled 8-minute threshold holds. Repeat your prescribed pace without drifting above the band."],
  ["Run the faster work with a smooth, even rhythm.", "Run the faster work at consistent pace with relaxed mechanics."],
  ["Two 14-minute threshold holds. Sustain the controlled rhythm longer while respecting the pace ceiling.", "Two 14-minute threshold holds. Sustain the prescribed pace without exceeding the ceiling."],
  ["Two 12-minute threshold holds, a longer controlled effort with precise rhythm and no late-race surge.", "Two 12-minute threshold holds. Hold controlled pace throughout without a late surge."],
  ["A single unbroken 22-minute threshold hold. Find the rhythm and hold it steadily—no surges or split-chasing.", "One continuous 22-minute threshold hold. Settle into the prescribed pace without surging."],
  ["Easy aerobic rhythm and relaxed mechanics after Saturday distance.", "Run easily with relaxed mechanics after Saturday's distance."],
  ["Twenty minutes of controlled threshold followed by a final eight-minute hold. A long rhythm first, then an honest repeat—not a faster finish.", "Twenty minutes of controlled threshold followed by an eight-minute hold. Sustain the first hold and repeat the effort without speeding up."],
  ["Hold sub-1:30 goal pace continuously with rhythm and manageable effort.", "Hold sub-1:30 goal pace continuously with control and manageable effort."],
  ["Rebuild running rhythm after a station.", "Return to a controlled running pace after each station."],
  ["Keep an easy rhythm during the holiday week.", "Keep the running easy during the holiday week."],
  ["Maintain an easy running rhythm while freshening up for the marathon.", "Maintain easy running at a conversational pace while freshening up for the marathon."],
  ["Learn to change gears without losing running rhythm.", "Learn to change pace while preserving coordination."],
  ["Continuous half-marathon rhythm and pacing durability during taper, without interval recoveries.", "Sustain half-marathon pace continuously during the taper without interval recoveries."],
  ["Develop controlled late-run rhythm after an easy aerobic start.", "Develop controlled pace late in the run after an easy start."],
  ["Hybrid station-to-run rhythm and pacing; 1 km race-specific runs replace standalone mile repeats.", "Practice controlled transitions from stations to 1 km race-specific runs."],
  ["Keep a settled rhythm without breaks.", "Keep a settled pace without breaks."],
  ["Keep a smooth aerobic rhythm before Thursday FORM.", "Keep the run comfortably easy before Thursday FORM."],
  ["Keep race rhythm familiar while arriving fresh for West Palm Beach.", "Rehearse race pace briefly while arriving fresh for West Palm Beach."],
  ["A short rhythm reminder before Sunday.", "A short controlled pace rehearsal before Sunday."],
  ["Maintain rhythm without adding another hard effort.", "Preserve coordination without adding another hard effort."]
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
  const reviewedIntent = exactIntentSuggestions.get(prior.intent);
  for (const field of ['title', 'intent', 'details']) {
    if (!forbidden.test(prior[field])) {
      proposed[field] = current[field];
      continue;
    }
    const rewritten = field === 'intent' && reviewedIntent
      ? reviewedIntent : contextualRewrite(prior[field]);
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
