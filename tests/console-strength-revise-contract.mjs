// The Console's strength editor and revise_strength_session must agree: an exercise key the editor
// sends that the RPC does not accept is refused whole, and a Console that cannot revise cannot publish.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const labs = fs.readFileSync('coach/labs/labs.js', 'utf8');
const data = fs.readFileSync('private/data.js', 'utf8');
const sql = fs.readFileSync('supabase/held/20261007130000_revise_strength_session.sql', 'utf8');
let checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks += 1; };

const allowed = new Set([...(/allowed constant text\[\] := array\[([^\]]+)\]/s.exec(sql)[1].matchAll(/'([A-Za-z]+)'/g))].map((m) => m[1]));
ok(allowed.size >= 12, 'the RPC publishes its accepted exercise keys');

const body = /async function keepStrengthRevision\(\) \{(.*?)\n\}\n/s.exec(labs)[1];
const pushed = /exercises\.push\(\{(.*?)\n    \}\);/s.exec(body)[1];
const keys = new Set([...pushed.matchAll(/\b([a-zA-Z]+):/g)].map((m) => m[1]).filter((k) => /^[a-z][A-Za-z]+$/.test(k)));
if (/\bsets,/.test(pushed)) keys.add('sets');   // shorthand property
for (const k of ['movementId', 'movementName', 'sets', 'laterality', 'instruction']) ok(keys.has(k), `the editor sends ${k}`);
for (const k of keys) ok(allowed.has(k), `the editor sends "${k}", which the RPC must accept`);
for (const k of ['repLow', 'repHigh', 'targetSeconds', 'targetSecondsHigh']) ok(keys.has(k), `the editor can send ${k}`);

ok(/supabase\.rpc\('revise_strength_session'/.test(data), 'the client calls the strength RPC');
for (const p of ['p_planned_session_id', 'p_title', 'p_intent', 'p_change_reason', 'p_exercises']) {
  ok(data.includes(p) && sql.includes(p.slice(2)), `parameter ${p} exists on both sides`);
}
ok(/pending\?\.kind === 'revise-strength'/.test(labs), 'the sheet routes a strength revision to its own save');
ok(/shape === 'strength' && \(session\.currentVersion\.exercises \|\| \[\]\)\.length\) \{ openReviseStrength/.test(labs), 'only a strength session with structured exercises opens the strength editor');
ok(/if \(!reason\) \{ error\.textContent = 'A revision needs a reason\.'/.test(body), 'the editor requires a reason before it calls the server');
ok(/softFrom = coach \? queries\.length - 4/.test(data), 'loading exercises can never take the record down');
ok(!/escapeHtml\(e\.instruction\)[^\n]*innerHTML/.test(labs), 'instruction text is escaped into the editor');
console.log(`PASS: ${checks} Console strength-revision contract checks (editor keys equal the RPC's accepted keys; reason required; escaped).`);
