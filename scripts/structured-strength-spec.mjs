// Pure projection of Adrian's canonical program.json into structured strength exercises.
// One function, three consumers: the migration generator, the SQL tests, and the check that
// the committed migration still matches the canonical source. Nothing here invents a value:
// a field the source does not author (rest, cue, substitutions) stays null.
import fs from 'node:fs';

export const PROGRAM_PATH = 'plans/adrian-developed-runner-2026/program.json';

const WEEKDAY_OFFSET = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };

// Stable movement ids, shared with the Forge app's bundled reference. The Forge reference
// fixture (tests/fixtures/forge-adrian-reference.json) is what proves these agree; until the
// server owns the id (Step 2) a drift between the two is a test failure, not a silent mismatch.
export const MOVEMENT_IDS = {
  'Incline Barbell Bench Press': 'incline_barbell_press',
  'Flat Dumbbell Bench Press': 'dumbbell_bench_press',
  'One-Arm Dumbbell Row': 'db_single_arm_row',
  'Dumbbell Pullover': 'dumbbell_pullover',
  'Dumbbell Lateral Raise': 'lateral_raise',
  'Parallel Bar Dips': 'parallel_bar_dips',
  'Barbell Curl': 'barbell_curl',
  'Back Squat': 'back_squat',
  'Romanian Deadlift': 'romanian_deadlift',
  'Bulgarian Split Squat': 'legs_db_bulgarian_split_squat',
  'Standing Calf Raise': 'standing_calf_raise',
  'Dead Bug': 'core_floor_dead_bug',
  'Pallof Press': 'core_cable_pallof_press',
  'Seated Dumbbell Shoulder Press': 'dumbbell_shoulder_press',
  'Incline Dumbbell Bench Press': 'incline_dumbbell_press',
  'Rear-Delt Dumbbell Fly': 'rear_delt_fly',
  'Incline Dumbbell Curl': 'incline_dumbbell_curl',
  'Dumbbell Skull Crusher': 'dumbbell_skull_crusher',
  'Dumbbell Hip Thrust': 'glutes_db_hip_thrust',
  'Step-Up': 'legs_db_step_up',
  'Side Plank': 'core_floor_side_plank',
  'Chest-Supported Dumbbell Row': 'db_chest_supported_row',
  'Neutral-Grip Cable Pulldown': 'neutral_grip_cable_pulldown',
  'Low-to-High Cable Fly': 'cable_fly_low_to_high',
  'Single-Arm Cable Lateral Raise': 'cable_lateral_raise_single_arm',
  'Overhead Cable Triceps Extension': 'cable_overhead_triceps_extension',
  'Dumbbell Romanian Deadlift': 'romanian_deadlift',
  'Heel-Elevated Goblet Squat or Leg Press': 'adrian_heel_elevated_goblet_or_leg_press',
  'Seated Leg Curl': 'leg_curl',
  'Bent-Knee Calf Raise': 'seated_calf_raise',
  'Cable Hip Adduction': 'cable_hip_adduction',
  'One-Arm Cable Row': 'cable_row_single_arm',
  'Lat Pulldown': 'lat_pulldown',
  'Mid-Height Cable Fly': 'cable_fly_mid',
  'Cable Rear-Delt Fly': 'cable_rear_delt_fly',
  'Hammer Curl': 'hammer_curl',
  'Rope Pressdown': 'rope_pressdown',
  'Hip Thrust': 'glutes_barbell_hip_thrust',
  'Dumbbell Step-Up': 'legs_db_step_up',
  'Seated or Lying Leg Curl': 'leg_curl',
  'Cable Lateral Raise': 'cable_lateral_raise_single_arm',
  'Cable or Dumbbell Shrug': 'shoulder_shrug',
  'Leg Extension': 'leg_extension',
  // Home / dumbbell-equipment adaptation (live from Oct 8). Where Forge already has the same
  // movement its id is reused; a plausibly distinct variant gets its own id rather than being
  // conflated. Which variants are the same movement is a Step 2 decision, not made silently here.
  'Dumbbell Goblet Squat': 'legs_db_goblet_squat',
  'Dumbbell Shrug': 'shoulder_shrug',
  'Seated Dumbbell Calf Raise': 'seated_calf_raise',
  'Flat Dumbbell Fly': 'dumbbell_chest_fly',
  'Low-Incline Dumbbell Fly': 'db_low_incline_fly',
  'Bench-Supported One-Arm Dumbbell Row': 'db_bench_supported_single_arm_row',
  'Chest-Supported Dumbbell Rear-Delt Fly': 'db_chest_supported_rear_delt_fly',
  'Single-Arm Dumbbell Lateral Raise': 'db_lateral_raise_single_arm',
  'Lying Dumbbell Triceps Extension': 'dumbbell_lying_triceps_extension',
  'Seated Dumbbell Overhead Triceps Extension': 'dumbbell_seated_overhead_triceps_extension',
  'Hamstring Bridge Walkout': 'legs_hamstring_bridge_walkout',
  'Side-Lying Hip Adduction': 'legs_side_lying_hip_adduction',
  'Dumbbell Suitcase Hold': 'core_db_suitcase_hold'
};

export function resolveDays(source, week, seen = new Set()) {
  if (week.days) return week.days;
  const ref = week.days_from_week;
  if (!ref || seen.has(ref)) throw new Error(`Invalid days_from_week for week ${week.week}`);
  const target = source.weeks.find((w) => w.week === ref);
  if (!target) throw new Error(`Missing days_from_week source ${ref}`);
  return resolveDays(source, target, new Set([...seen, ref]));
}

// '8–10' | '12' | '12–15 / side' | '30 sec' | '30–45 sec / side' | '6–8 out-and-back cycles'
// A bare unit word other than "sec" is kept as the unit of a counted target (reps by default).
export function parseTarget(raw) {
  const m = /^(\d+)(?:–(\d+))?(?: ([a-z][a-z -]*?))?(?: \/ (side|leg))?$/.exec(raw);
  if (!m) throw new Error(`Unparsed rep target: ${raw}`);
  const low = Number(m[1]);
  const high = m[2] === undefined ? low : Number(m[2]);
  const unit = m[3] ?? null;
  return { low, high, timed: unit === 'sec', repUnit: unit && unit !== 'sec' ? unit : null, perSide: Boolean(m[4]), sideWord: m[4] ?? null };
}

const addDays = (isoDate, n) => {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// The readable text the live versions carry in planned_session_versions.details:
// "Movement — sets × target" with the authored instruction, if any, after " · ". It is the one
// place the instruction is written, so the readable fallback and the structured rows cannot differ.
export const detailsText = (exercises) =>
  exercises.map((e) => `${e.name} — ${e.sets} × ${e.reps}${e.note ? ` · ${e.note}` : ''}`).join('\n');

export function buildSpec(source) {
  if (source.program_id !== 'adrian_runner_mass_phase1_v1') throw new Error('Program id changed; receipt continuity would break');
  const sessions = [];
  for (const week of source.weeks) {
    for (const day of resolveDays(source, week)) {
      const offset = WEEKDAY_OFFSET[day.weekday];
      if (offset === undefined) throw new Error(`Unknown weekday ${day.weekday}`);
      sessions.push({
        week: week.week,
        scheduled_on: addDays(week.start_date, offset),
        day_label: day.weekday,
        title: day.title,
        details: detailsText(day.exercises),
        exercises: day.exercises.map((e, i) => {
          const movementId = MOVEMENT_IDS[e.name];
          if (!movementId) throw new Error(`No movement id for "${e.name}"`);
          const t = parseTarget(e.reps);
          return {
            position: i + 1,
            movement_id: movementId,
            movement_name: e.name,
            sets: e.sets,
            rep_low: t.timed ? null : t.low,
            rep_high: t.timed ? null : t.high,
            rep_unit: t.repUnit,
            target_seconds: t.timed ? t.low : null,
            target_seconds_high: t.timed && t.high !== t.low ? t.high : null,
            laterality: t.perSide ? 'per_side' : 'bilateral',
            side_word: t.sideWord,
            instruction: e.note ?? null
          };
        })
      });
    }
  }
  return sessions;
}

export function loadProgram(root = '.') {
  return JSON.parse(fs.readFileSync(`${root}/${PROGRAM_PATH}`, 'utf8'));
}
