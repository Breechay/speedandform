// The doctrine that is easiest to break by accident, enforced.
//
// A checkpoint records what Brice decided about a capability. Nothing else may
// move it: not a judgment, not a filed session, not a correction, not a
// synchronisation job. The danger is not that someone argues for auto-advance,
// it is that somebody writes
//
//   if (direction === 'supports') advanceCheckpoint()
//
// in a hurry and it looks helpful. There is no test runner in this repo, so this
// enforces the invariant statically, which also catches the SQL paths a unit test
// against the client would miss.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(js|mjs|sql)$/.test(entry)) files.push(path);
  }
})('.');

// The only sanctioned writer. moveCheckpoint is called from the click on a rung
// and from nowhere else; the migrations that seed and reshape the ladder are
// authored acts, run deliberately.
const sanctioned = [
  'private/data.js',                                        // moveCheckpoint itself
  'supabase/migrations/20260824183100_seed_slice1.sql',
  'supabase/migrations/20260825230000_round_the_ladder.sql',
  'supabase/migrations/20260827140000_race_pace_ladder.sql',
  'supabase/migrations/20260828200000_advance_the_ladder.sql',
  'supabase/migrations/20260829100000_ladder_matches_the_plan.sql',
  'supabase/migrations/20260829120000_ladder_is_capability.sql',
];

let bad = 0;
const write = /(insert\s+into\s+(public\.)?mark_checkpoints|update\s+(public\.)?mark_checkpoints|delete\s+from\s+(public\.)?mark_checkpoints|from\('mark_checkpoints'\)\s*\.\s*(update|insert|delete|upsert))/i;

for (const file of files) {
  const relative = file.replace(/^\.\//, '');
  if (sanctioned.includes(relative)) continue;
  const text = readFileSync(file, 'utf8');
  if (write.test(text)) {
    console.error(`${relative}: writes mark_checkpoints outside the sanctioned path`);
    bad++;
  }
}

// No exported function except moveCheckpoint itself may touch a checkpoint.
// Naming the three that matter today was too narrow: a violation planted in any
// other function passed, which is exactly what happened when this was tested.
const data = readFileSync('private/data.js', 'utf8');
const bodyOf = (text, start) => {
  let depth = 0;
  for (let i = text.indexOf('{', start); i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return text.slice(start, i);
  }
  return text.slice(start);
};

for (const match of data.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) {
  const name = match[1];
  if (name === 'moveCheckpoint') continue;
  const body = bodyOf(data, match.index);
  // Reading a ladder is fine. Writing one, or calling the mover, is not.
  if (/moveCheckpoint\s*\(/.test(body)
      || /from\('mark_checkpoints'\)\s*\.\s*(update|insert|delete|upsert)/.test(body)) {
    console.error(`private/data.js: ${name} moves a rung. Only an explicit coach decision may.`);
    bad++;
  }
}
if (!/export async function moveCheckpoint/.test(data)) {
  console.error('private/data.js: moveCheckpoint is gone; this check is now blind');
  bad++;
}

// And the only caller in the UI is the rung the coach clicked.
const desk = readFileSync('coach/coach.js', 'utf8');
const calls = [...desk.matchAll(/moveCheckpoint\s*\(/g)];
if (calls.length !== 1) {
  console.error(`coach/coach.js: moveCheckpoint called ${calls.length} times; expected exactly one, from the rung click`);
  bad++;
} else if (!/data-checkpoint[\s\S]{0,400}?moveCheckpoint\s*\(/.test(desk)) {
  console.error('coach/coach.js: moveCheckpoint is no longer reached from the rung click');
  bad++;
}

if (bad) { console.error(`\n${bad} contract violation(s)`); process.exit(1); }
console.log('contract check passed: nothing but an explicit coach decision moves a rung');
