const FALLBACKS = [
  {
    match: /runner\s+mass/i,
    source: '/plans/adrian-runner-mass-phase-01/program.json',
    overview: '/plans/adrian-runner-mass-phase-01/',
  },
];

export function strengthFallbackSource(athlete = {}) {
  const text = [athlete.program_name, athlete.account_label, athlete.display_name].filter(Boolean).join(' ');
  return FALLBACKS.find((entry) => entry.match.test(text)) || null;
}

export async function loadStrengthFallback(athlete, fetcher = fetch) {
  const entry = strengthFallbackSource(athlete);
  if (!entry) return null;
  const response = await fetcher(entry.source, { cache: 'no-store' });
  if (!response.ok) throw new Error('Coach-authored strength fallback unavailable');
  const program = await response.json();
  return { ...program, source_path: entry.source, overview_path: entry.overview };
}

export function resolvedStrengthWeek(program, weekNumber) {
  if (!program?.weeks?.length) return null;
  const week = program.weeks.find((item) => item.week === Number(weekNumber)) || program.weeks[0];
  const sourceWeek = Array.isArray(week.days)
    ? week
    : program.weeks.find((item) => item.week === week.days_from_week);
  return { ...week, days: sourceWeek?.days || [] };
}
