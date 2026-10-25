// FORM Plan Exchange, schema 1. Pure validation only: never publishes a plan.
// The authenticated server must determine identity, permission and ownership.
import { sessionEditorialIssues } from './session-editorial-standard.mjs';

const TYPES = new Set(['easy', 'easy_strides', 'speed', 'threshold', 'long', 'recovery', 'rest', 'race', 'cross_training']);
const UNITS = new Set(['mi', 'km', 'min']);
const PACE_UNITS = new Set(['sec_per_mi', 'sec_per_km']);
const MAX_BYTES = 256 * 1024;
const DAY_MS = 86400000;

function isRecord(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
function exactKeys(object, allowed, path, errors) {
  for (const key of Object.keys(object)) if (!allowed.includes(key)) errors.push(`${path}.${key}: unsupported field`);
}
function dateNumber(x) {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return NaN;
  const n = Date.parse(`${x}T00:00:00Z`);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === x ? n : NaN;
}
function textField(x, path, errors, max = 160) {
  if (typeof x !== 'string' || !x.trim() || x.length > max) errors.push(`${path}: must be nonempty text of at most ${max} characters`);
}
function positive(x, path, errors, max = 500) {
  if (typeof x !== 'number' || !Number.isFinite(x) || x <= 0 || x > max) errors.push(`${path}: invalid positive number`);
}

/**
 * Strict exchange-file validation. No free-form JSON is copied into a privileged
 * database write, and no imported value can claim to be coach-approved.
 * A valid file remains a draft until athlete preview and explicit confirmation.
 */
export function validatePlanExchange(input) {
  const errors = [];
  if (!isRecord(input)) return { ok: false, errors: ['root: expected an object'] };
  exactKeys(input, ['schema_version', 'name', 'unit_preference', 'sessions'], 'root', errors);
  if (input.schema_version !== 1) errors.push('schema_version: unsupported version');
  textField(input.name, 'name', errors, 100);
  if (!['mi', 'km'].includes(input.unit_preference)) errors.push('unit_preference: use mi or km');
  if (!Array.isArray(input.sessions) || input.sessions.length < 1 || input.sessions.length > 366) {
    errors.push('sessions: expected 1 to 366 entries');
    return { ok: false, errors };
  }
  const seen = new Set();
  let earliest = Infinity;
  let latest = -Infinity;
  input.sessions.forEach((s, index) => {
    const path = `sessions[${index}]`;
    if (!isRecord(s)) { errors.push(`${path}: expected an object`); return; }
    exactKeys(s, ['date', 'type', 'title', 'distance', 'duration', 'pace', 'instructions'], path, errors);
    const day = dateNumber(s.date);
    if (!Number.isFinite(day)) errors.push(`${path}.date: expected a real YYYY-MM-DD date`);
    else {
      if (seen.has(s.date)) errors.push(`${path}.date: two sessions on the same day; combine or review separately`);
      seen.add(s.date);
      earliest = Math.min(earliest, day);
      latest = Math.max(latest, day);
    }
    if (!TYPES.has(s.type)) errors.push(`${path}.type: unknown session type`);
    textField(s.title, `${path}.title`, errors, 100);
    if (s.instructions !== undefined && (typeof s.instructions !== 'string' || s.instructions.length > 1000)) errors.push(`${path}.instructions: use text up to 1000 characters`);
    const distance = s.distance !== undefined;
    const duration = s.duration !== undefined;
    if (s.type === 'rest') {
      if (distance || duration || s.pace !== undefined) errors.push(`${path}: rest cannot have distance, duration or pace`);
    } else if (!distance && !duration) errors.push(`${path}: provide distance or duration`);
    if (distance) {
      if (!isRecord(s.distance)) errors.push(`${path}.distance: expected value and unit`);
      else {
        exactKeys(s.distance, ['value', 'unit'], `${path}.distance`, errors);
        positive(s.distance.value, `${path}.distance.value`, errors, 200);
        if (!UNITS.has(s.distance.unit) || s.distance.unit === 'min') errors.push(`${path}.distance.unit: use mi or km`);
      }
    }
    if (duration) positive(s.duration, `${path}.duration`, errors, 1440);
    if (s.pace !== undefined) {
      if (!isRecord(s.pace)) errors.push(`${path}.pace: expected min, max and unit`);
      else {
        exactKeys(s.pace, ['min', 'max', 'unit'], `${path}.pace`, errors);
        positive(s.pace.min, `${path}.pace.min`, errors, 3600);
        positive(s.pace.max, `${path}.pace.max`, errors, 3600);
        if (Number.isFinite(s.pace.min) && Number.isFinite(s.pace.max) && s.pace.min > s.pace.max) errors.push(`${path}.pace: fastest bound must not exceed slowest bound`);
        if (!PACE_UNITS.has(s.pace.unit)) errors.push(`${path}.pace.unit: use sec_per_mi or sec_per_km`);
      }
    }
    if (typeof s.title === 'string') {
      for (const issue of sessionEditorialIssues({ title: s.title, details: s.instructions || '' }))
        errors.push(`${path}.${issue.field}: ${issue.message}`);
    }
    // More detailed interval structure cannot safely be inferred from prose.
    // Complex sessions require a separate reviewed structured-workout path.
    if (['speed', 'threshold'].includes(s.type)) errors.push(`${path}.type: structured speed and threshold workouts require the reviewed interval format`);
  });
  if (latest - earliest > 366 * DAY_MS) errors.push('sessions: plan spans more than one year');
  return { ok: errors.length === 0, errors };
}

export function parsePlanExchange(jsonText) {
  if (typeof jsonText !== 'string' || new TextEncoder().encode(jsonText).length > MAX_BYTES)
    return { ok: false, errors: ['file: JSON must be no larger than 256 KB'] };
  try { return validatePlanExchange(JSON.parse(jsonText)); }
  catch { return { ok: false, errors: ['file: invalid JSON'] }; }
}
