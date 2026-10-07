// Brings plans/adrian-developed-runner-2026/program.json forward to the LIVE current versions.
// The live FORM Athlete System is canonical; program.json is a version-controlled projection of it.
// Usage: node scripts/reconcile-program-from-live.mjs <live-export.json> [--write]
// Without --write it only reports what would change. The export is the read-only result of
// scripts/structured-strength-live-export.sql.
import fs from 'node:fs';
import { PROGRAM_PATH, resolveDays } from './structured-strength-spec.mjs';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekdayOf = (iso) => WEEKDAYS[(new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7];

export function parseDetails(details) {
  return String(details).split('\n').filter((l) => l.trim()).map((line) => {
    const m = /^(.+?) — (\d+) × ([^·]+?)(?: · (.+))?$/.exec(line);
    if (!m) throw new Error(`Unparseable live line: ${line}`);
    const ex = { name: m[1], sets: Number(m[2]), reps: m[3] };
    if (m[4]) ex.note = m[4];
    return ex;
  });
}

export function reconcile(program, liveRows) {
  const next = structuredClone(program);
  const byDate = new Map(liveRows.map((r) => [String(r.scheduled_on).slice(0, 10), r]));
  const changed = [];
  for (const week of next.weeks) {
    const inherited = week.days ? null : resolveDays(next, week);
    const days = structuredClone(week.days ?? inherited);
    let differs = false;
    for (const day of days) {
      const idx = WEEKDAYS.indexOf(day.weekday);
      const date = new Date(`${week.start_date}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + idx);
      const iso = date.toISOString().slice(0, 10);
      const live = byDate.get(iso);
      if (!live) throw new Error(`No live session for ${iso} (week ${week.week} ${day.weekday})`);
      if (weekdayOf(iso) !== day.weekday) throw new Error(`Weekday mismatch at ${iso}`);
      if (live.title !== day.title) throw new Error(`Title differs at ${iso}: live "${live.title}" vs program "${day.title}"`);
      const exercises = parseDetails(live.details);
      if (JSON.stringify(exercises) !== JSON.stringify(day.exercises)) { differs = true; changed.push(iso); }
      day.exercises = exercises;
      byDate.delete(iso);
    }
    // A week that inherits its days keeps inheriting only while it still equals them.
    if (week.days || differs) {
      delete week.days_from_week;
      // keep key order: days last, after the descriptive fields
      const { days: _ignored, ...rest } = week;
      Object.keys(week).forEach((k) => delete week[k]);
      Object.assign(week, rest, { days });
    }
  }
  if (byDate.size) throw new Error(`Live sessions with no place in program.json: ${[...byDate.keys()].join(', ')}`);
  return { next, changed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, flag] = process.argv.slice(2);
  if (!file) { console.error('usage: reconcile-program-from-live.mjs <live-export.json> [--write]'); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = Array.isArray(raw) ? raw : raw.rows;
  const program = JSON.parse(fs.readFileSync(PROGRAM_PATH, 'utf8'));
  const { next, changed } = reconcile(program, rows);
  console.log(`${changed.length} sessions change in program.json:`, changed.join(' '));
  if (flag === '--write') {
    next.revision_history = [...(program.revision_history ?? []), {
      date: '2026-10-06',
      label: 'Reconciled to the live current versions',
      reason: 'The FORM Athlete System is canonical. Future sessions from 2026-10-08 were revised there for the home/dumbbell-equipment adaptation (with authored instructions); this projection now follows them.'
    }];
    fs.writeFileSync(PROGRAM_PATH, JSON.stringify(next, null, 2) + '\n');
    console.log('wrote', PROGRAM_PATH);
  }
}
