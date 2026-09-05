// Review-package stub for /private/data.js.
//
// Reads are real: these are production records, rebuilt from the plan dump in
// the shape loadAthleteRecord() returns, so the renderer sees exactly what it
// sees signed in. Writes do not exist. Every authoring path throws rather than
// silently doing nothing, because a Revise button that appears to work and
// changes nothing is how a design review ends up reviewing a lie.
const at = (path) => new URL(path, import.meta.url).href.replace('/assets/js/', '/data/');
const bench = await (await fetch(at('bench.json'))).json();
const records = new Map();
const bySlug = new Map(bench.map((entry) => [entry.slug, entry]));
const byId = new Map(bench.map((entry) => [entry.id, entry]));

async function recordFor(slug) {
  if (!records.has(slug)) {
    const response = await fetch(at(`record-${slug}.json`));
    if (!response.ok) throw new Error(`The review package carries no record for ${slug}.`);
    records.set(slug, await response.json());
  }
  return records.get(slug);
}

export async function loadCoachBench() { return bench; }
export async function loadAthleteRecord(athleteId) {
  const entry = byId.get(athleteId) || bySlug.get(athleteId);
  if (!entry) throw new Error(`Unknown athlete: ${athleteId}`);
  return recordFor(entry.slug);
}
export async function loadAttentionFor() { return []; }
export async function createRead() {}
export async function setExceptionStatus() {}
export async function savePortrait() {}

const readOnly = (what) => { throw new Error(
  `${what} is not available in the design-review package. It renders the plan; it never changes it.`); };
export async function addObservation() { readOnly('Recording an observation'); }
export async function reviseSession() { readOnly('Revising a prescription'); }
export async function fileForAthlete() { readOnly('Filing evidence'); }

// Kept deliberately in step with private/data.js. A rung is inferred from a
// single continuous banded piece matching an unreached checkpoint; drift here
// and the package shows lime on the wrong Saturdays.
export function rungFor(session, mark) {
  const parts = (session?.currentVersion?.components || []).filter((p) => p.role === 'work');
  if (parts.length !== 1) return null;
  const work = parts[0];
  if (work.shape !== 'continuous' || work.pace_low_seconds == null || work.distance == null) return null;
  if (work.pace_high_seconds == null) return null;
  const rungs = (mark?.checkpoints || []).slice().sort((a, b) => a.position - b.position);
  const match = rungs.find((r) => Math.abs(Number(r.value) - Number(work.distance)) < 0.05);
  if (!match || match.state === 'reached') return null;
  const earned = rungs.filter((r) => r.state === 'reached');
  const opening = rungs[0];
  return { rung: match, first: earned.every((r) => r.id === opening?.id) };
}
