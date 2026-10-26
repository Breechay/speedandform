// Public, dependency-free file starter for FORM Plan Exchange schema 1.
// It never knows who the member is or publishes a plan.
const DAY = 86400000;
const dateISO = (date) => new Date(date).toISOString().slice(0, 10);

export function nextMonday(from = new Date()) {
  const input = new Date(from);
  if (!Number.isFinite(input.getTime())) throw new TypeError('Invalid date');
  // The page's initial Monday follows the visitor's calendar date, not UTC midnight.
  const utc = Date.UTC(input.getFullYear(), input.getMonth(), input.getDate());
  const dow = new Date(utc).getUTCDay();
  const delta = (8 - dow) % 7 || 7;
  return dateISO(utc + delta * DAY);
}

function parseStartDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new TypeError('Choose a real date');
  }
  const instant = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(instant) || dateISO(instant) !== day) throw new TypeError('Choose a real date');
  return instant;
}

export function createPlanFileStarter({ startDate, unit = 'mi' }) {
  if (!['mi', 'km'].includes(unit)) throw new TypeError('Choose miles or kilometers');
  const start = parseStartDay(startDate);
  if (new Date(start).getUTCDay() !== 1) throw new TypeError('The example starts on a Monday');
  const day = (n) => dateISO(start + n * DAY);

  // Two low-detail example sessions and a rest day. Not an individualized plan.
  // The runner and their editor fill the actual program before an import preview.
  return {
    schema_version: 1,
    name: 'My FORM plan (edit this example)',
    unit_preference: unit,
    sessions: [
      { date: day(0), type: 'easy', title: 'Easy run example', duration: 30 },
      { date: day(2), type: 'easy', title: 'Easy run example', duration: 35 },
      { date: day(4), type: 'rest', title: 'Rest' },
      { date: day(5), type: 'long', title: 'Long easy run example', duration: 60 }
    ]
  };
}

export function getAssistantInstructions() {
  return [
    'I am organizing my training with FORM. I attached a FORM Plan Exchange JSON example.',
    'Build or revise a plan using schema_version 1 and preserve name, unit_preference, and sessions.',
    'Ask me about my goal, training history, days available, protected days, quality days, and recent long run before prescribing hard training.',
    'Use real YYYY-MM-DD dates and one session per day. Keep my original chosen units.',
    'For speed or threshold workouts, provide explicit warmup, work, recovery and cooldown segments; never replace sets with vague prose.',
    'Do not include athlete_id, account IDs, coach approval, completed runs or any personal tokens.',
    'Return a complete JSON file I can preview and import. If you cannot express a workout in schema 1, tell me rather than omitting it.',
    'Never invent prior races, pace thresholds or injury clearance.'
  ].join('\n');
}
