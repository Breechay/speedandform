// FORM Plan Exchange, schema 1. Pure validation only: never publishes a plan.
// The authenticated server must determine identity, permission and ownership.
import { selfAuditSessionCopy } from './session-editorial-standard.mjs';

const TYPES = new Set(['easy', 'easy_strides', 'speed', 'threshold', 'long', 'recovery', 'rest', 'race', 'cross_training']);
const UNITS = new Set(['mi', 'km', 'min']);
const PACE_UNITS = new Set(['sec_per_mi', 'sec_per_km']);
const SEGMENT_KINDS = new Set(['warmup', 'work', 'recovery', 'strides', 'cooldown']);
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
function validateMeasure(measure, path, errors, allowedUnits) {
  if (!isRecord(measure)) { errors.push(`${path}: expected value and unit`); return; }
  exactKeys(measure, ['value', 'unit'], path, errors);
  positive(measure.value, `${path}.value`, errors, measure.unit === 'min' ? 1440 : 200);
  if (!allowedUnits.has(measure.unit)) errors.push(`${path}.unit: unsupported unit`);
}
function validatePace(pace, path, errors) {
  if (!isRecord(pace)) { errors.push(`${path}: expected min, max and unit`); return; }
  exactKeys(pace, ['min', 'max', 'unit'], path, errors);
  positive(pace.min, `${path}.min`, errors, 3600);
  positive(pace.max, `${path}.max`, errors, 3600);
  if (Number.isFinite(pace.min) && Number.isFinite(pace.max) && pace.min > pace.max)
    errors.push(`${path}: fastest bound must not exceed slowest bound`);
  if (!PACE_UNITS.has(pace.unit)) errors.push(`${path}.unit: use sec_per_mi or sec_per_km`);
}
function validateSegments(segments, path, errors) {
  if (!Array.isArray(segments) || segments.length < 1 || segments.length > 30) {
    errors.push(`${path}: expected 1 to 30 structured segments`); return;
  }
  let hasWork = false;
  segments.forEach((segment, i) => {
    const p = `${path}[${i}]`;
    if (!isRecord(segment)) { errors.push(`${p}: expected a segment object`); return; }
    exactKeys(segment, ['kind', 'repeats', 'amount', 'pace', 'recovery'], p, errors);
    if (!SEGMENT_KINDS.has(segment.kind)) errors.push(`${p}.kind: unsupported segment`);
    if (segment.kind === 'work') hasWork = true;
    if (segment.repeats !== undefined && (!Number.isInteger(segment.repeats) || segment.repeats < 1 || segment.repeats > 40))
      errors.push(`${p}.repeats: use 1 to 40 repetitions`);
    validateMeasure(segment.amount, `${p}.amount`, errors, UNITS);
    if (segment.pace !== undefined) validatePace(segment.pace, `${p}.pace`, errors);
    if (segment.recovery !== undefined) {
      if (segment.kind !== 'work' && segment.kind !== 'strides') errors.push(`${p}.recovery: only work or strides can prescribe recovery`);
      if (segment.recovery !== 'full') validateMeasure(segment.recovery, `${p}.recovery`, errors, new Set(['min']));
    }
    if ((segment.repeats ?? 1) > 1 && segment.kind === 'work' && segment.recovery === undefined)
      errors.push(`${p}.recovery: specify a duration or full recovery for repeated work`);
  });
  if (!hasWork) errors.push(`${path}: speed and threshold sessions require a work segment`);
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
    exactKeys(s, ['date', 'type', 'title', 'distance', 'duration', 'pace', 'instructions', 'segments'], path, errors);
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
      if (distance || duration || s.pace !== undefined || s.segments !== undefined) errors.push(`${path}: rest cannot have training volume, pace or segments`);
    } else if (!distance && !duration && s.segments === undefined) errors.push(`${path}: provide distance, duration or segments`);
    if (distance) {
      validateMeasure(s.distance, `${path}.distance`, errors, new Set(['mi', 'km']));
    }
    if (duration) positive(s.duration, `${path}.duration`, errors, 1440);
    if (s.pace !== undefined) validatePace(s.pace, `${path}.pace`, errors);
    if (s.segments !== undefined) validateSegments(s.segments, `${path}.segments`, errors);
    if (['speed', 'threshold'].includes(s.type) && s.segments === undefined)
      errors.push(`${path}.segments: speed and threshold require structured workout details`);
    if (s.type === 'easy' && s.segments?.some?.(x => x?.kind === 'work'))
      errors.push(`${path}.segments: an easy run cannot contain hard work`);
    if (typeof s.title === 'string') {
      for (const issue of selfAuditSessionCopy({ title: s.title, details: s.instructions || '' }).issues)
        errors.push(`${path}.${issue.field}: ${issue.message}`);
    }
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
