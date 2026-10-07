// Compares the LIVE current version of each Adrian session (from a read-only export) with the
// frozen snapshot in the held migration, exactly as backfill_structured_strength will.
// Usage: node scripts/preflight-structured-strength.mjs <live-export.json>
// Exit 0 only when every session matches (58/58): that is the gate for applying the backfill.
import fs from 'node:fs';
import { MIGRATION } from './generate-structured-strength-migration.mjs';
import { MOVEMENT_IDS } from './structured-strength-spec.mjs';

const file = process.argv[2];
if (!file) { console.error('usage: preflight-structured-strength.mjs <live-export.json>'); process.exit(2); }
const live = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = Array.isArray(live) ? live : (live.rows ?? live.sessions ?? Object.values(live)[0]);
const sql = fs.readFileSync(MIGRATION, 'utf8');
const spec = JSON.parse(/\$spec\$(.*?)\$spec\$/s.exec(sql)[1]);
const byDate = new Map(rows.map((r) => [String(r.scheduled_on).slice(0, 10), r]));

let match = 0; const differ = []; const missing = []; const unknownMovements = new Map(); const unparsed = [];
for (const s of spec) {
  const r = byDate.get(s.scheduled_on);
  if (!r) { missing.push(s.scheduled_on); continue; }
  if (r.shape && r.shape !== 'strength') { differ.push({ date: s.scheduled_on, why: `shape is ${r.shape}` }); continue; }
  if (r.details === s.details) { match += 1; continue; }
  const a = String(r.details ?? '').split('\n'), b = s.details.split('\n');
  const i = a.findIndex((l, k) => l !== b[k]);
  differ.push({ date: s.scheduled_on, v: r.version_number, live: a[i] ?? '(shorter)', snapshot: b[i] ?? '(longer)', lines: [a.length, b.length] });
}
// Every line of every live current version: which movement names does the snapshot not know?
for (const r of rows) for (const line of String(r.details ?? '').split('\n')) {
  const m = /^(.+?) — (\d+) × (.+)$/.exec(line);
  if (!m) { if (line.trim()) unparsed.push({ date: String(r.scheduled_on).slice(0, 10), line }); continue; }
  const name = m[1];
  if (!(name in MOVEMENT_IDS)) unknownMovements.set(name, (unknownMovements.get(name) ?? 0) + 1);
}

console.log(`live sessions: ${rows.length}; snapshot sessions: ${spec.length}`);
console.log(`matching exactly: ${match}/${spec.length}`);
if (missing.length) console.log(`missing from live (${missing.length}):`, missing.join(', '));
if (differ.length) { console.log(`differ (${differ.length}); first differing line each:`); for (const d of differ) console.log(' ', JSON.stringify(d)); }
if (unknownMovements.size) { console.log('movement names with no stable id yet:'); for (const [n, c] of unknownMovements) console.log(`  ${n}  (x${c})`); }
if (unparsed.length) { console.log(`lines not in "Name — sets × reps" form (${unparsed.length}):`); for (const u of unparsed.slice(0, 40)) console.log(' ', JSON.stringify(u)); }
process.exit(match === spec.length && !missing.length ? 0 : 1);
