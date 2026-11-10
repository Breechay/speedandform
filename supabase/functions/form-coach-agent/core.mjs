// Pure contract helpers shared by the Edge Function and its Node regression tests.
// Never accept an actor or athlete identity from a caller as authorization.

const ALLOWED_ROLES = new Set(['warm_up', 'work', 'recovery', 'cool_down']);
const ALLOWED_SHAPES = new Set(['continuous', 'repetitions']);
const ALLOWED_UNITS = new Set(['mi', 'km', 'm']);
const ALLOWED_RECOVERIES = new Set(['easy', 'float', 'jog', 'standing', 'equal']);
const WIRE_KEYS = new Set([
  'role', 'shape', 'repeatCount', 'distance', 'distanceUnit',
  'durationSeconds', 'recoverySeconds', 'recoveryKind',
  'paceLowSeconds', 'paceHighSeconds', 'rpeLow', 'rpeHigh',
  'rpeSource', 'rpeDefaultVersion', 'repeatMinimum', 'repeatTarget',
  'repeatProgression', 'repeatCeiling', 'countsTowardMarkId',
]);

export class ContractError extends Error {
  constructor(message, code = 'INVALID_REVISION') {
    super(message);
    this.name = 'ContractError';
    this.code = code;
  }
}

export function assertDateWindow(from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new ContractError('Dates must be YYYY-MM-DD.');
  }
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) ||
      new Date(start).toISOString().slice(0, 10) !== from ||
      new Date(end).toISOString().slice(0, 10) !== to ||
      end < start || (end - start) / 86400000 > 21) {
    throw new ContractError('Select a valid window of at most 22 calendar days.');
  }
}

export function validateRevision(input) {
  if (!input || typeof input !== 'object') throw new ContractError('A revision is required.');
  if (!input.title?.trim() || !input.intent?.trim() || !input.changeReason?.trim()) {
    throw new ContractError('Title, intent and a specific revision reason are required.');
  }
  if (!Number.isFinite(input.prescribedDistance) || input.prescribedDistance <= 0 || input.prescribedDistance > 100 ||
      !ALLOWED_UNITS.has(input.distanceUnit)) {
    throw new ContractError('A positive whole-session distance with a supported unit is required.');
  }
  if (!Array.isArray(input.components) || input.components.length < 1 || input.components.length > 32) {
    throw new ContractError('Use 1–32 ordered, typed workout components.');
  }
  for (const [index, part] of input.components.entries()) {
    if (!part || !ALLOWED_ROLES.has(part.role) || !ALLOWED_SHAPES.has(part.shape)) {
      throw new ContractError(`Component ${index + 1} needs an accepted role and shape.`);
    }
    for (const key of Object.keys(part)) {
      if (!WIRE_KEYS.has(key)) throw new ContractError(`Unknown component field: ${key}.`);
    }
    if (part.distance != null && (!Number.isFinite(part.distance) || part.distance <= 0 || !ALLOWED_UNITS.has(part.distanceUnit || 'mi'))) {
      throw new ContractError(`Component ${index + 1} has an invalid distance.`);
    }
    if (part.durationSeconds != null && (!Number.isInteger(part.durationSeconds) || part.durationSeconds < 0)) {
      throw new ContractError(`Component ${index + 1} has an invalid duration.`);
    }
    if (part.distance == null && part.durationSeconds == null) {
      throw new ContractError(`Component ${index + 1} needs distance or duration.`);
    }
    if (part.shape === 'repetitions' && (!Number.isInteger(part.repeatCount) || part.repeatCount < 1)) {
      throw new ContractError(`Component ${index + 1} needs a repetition count.`);
    }
    if (part.recoveryKind != null && !ALLOWED_RECOVERIES.has(part.recoveryKind)) {
      throw new ContractError(`Component ${index + 1} has an invalid recovery kind.`);
    }
    if (part.recoverySeconds != null && (!Number.isInteger(part.recoverySeconds) || part.recoverySeconds < 0)) {
      throw new ContractError(`Component ${index + 1} has an invalid recovery duration.`);
    }
    if ((part.recoveryKind == null) !== (part.recoverySeconds == null)) {
      throw new ContractError(`Component ${index + 1} needs both recovery kind and duration.`);
    }
    if (part.paceLowSeconds != null && (!Number.isInteger(part.paceLowSeconds) || part.paceLowSeconds < 60)) {
      throw new ContractError(`Component ${index + 1} has an invalid pace.`);
    }
    if (part.paceHighSeconds != null && (!Number.isInteger(part.paceHighSeconds) || part.paceHighSeconds < (part.paceLowSeconds ?? 0))) {
      throw new ContractError(`Component ${index + 1} has a reversed pace band.`);
    }
    for (const key of ['rpeLow', 'rpeHigh']) {
      if (part[key] != null && (!Number.isInteger(part[key]) || part[key] < 1 || part[key] > 10)) {
        throw new ContractError(`Component ${index + 1} has an invalid effort.`);
      }
    }
  }
  const positions = input.components.map((part) => part.role);
  if (positions[0] === 'cool_down' || positions.at(-1) === 'warm_up') {
    throw new ContractError('Warm-up and cooldown must be ordered around the work.');
  }
  return input;
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function revisionFingerprint(input) {
  const bytes = new TextEncoder().encode(canonicalJson(input));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function toolResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

export function toolFailure(error) {
  const known = error instanceof ContractError;
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({
      error: known ? error.code : 'FORM_REQUEST_FAILED',
      message: known ? error.message : 'FORM could not complete the request. No success is claimed; check the source before retrying.',
    }) }],
  };
}
