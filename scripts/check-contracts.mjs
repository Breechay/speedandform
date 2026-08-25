// The doctrine that is easiest to break by accident, enforced.
//
// A rung moves two lawful ways, and the system is coach GOVERNED rather than
// coach GATED. An authored progression rule may advance a checkpoint on
// structured evidence without waiting for Brice; Brice may decide directly. The
// program clock never waits on a review.
//
// What is forbidden is a rung that moved with nothing recording what moved it.
// That is the actual failure: accidental cycling advanced authored decisions
// silently until a ladder with no outdoor evidence read 61 per cent proven. The
// fix was never to ban automation, it was to make every move say who made it.
//
// This checker used to require that a rung only ever moved from a click. That
// rule was written by an agent, not by Brice, and it would have blocked the
// automatic progression the roadmap has always described and FORM-iOS already
// implements as FORMV3ProgressionDecision. It is replaced, not weakened: the
// invariant is now stronger, because a silent move fails here too.
//
// There is no test runner in this repo, so this enforces the invariant
// statically, which also catches the SQL paths a unit test would miss.
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
  // Adds the provenance columns and backfills them. Never touches state.
  'supabase/migrations/20260829180000_checkpoint_provenance.sql',
];

// A sanctioned migration may reshape the ladder or add provenance. Only the two
// that were authored to set state are allowed to write the state column, so a
// future schema migration cannot quietly advance a rung on its way past.
const stateWriters = [
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
  if (sanctioned.includes(relative)) {
    if (!stateWriters.includes(relative)) {
      const text = readFileSync(file, 'utf8');
      if (/update\s+(public\.)?mark_checkpoints[\s\S]{0,400}?\bset\b[\s\S]{0,200}?\bstate\s*=/i.test(text)) {
        console.error(`${relative}: writes checkpoint state, which only an authored ladder migration may do`);
        bad++;
      }
    }
    continue;
  }
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

// Every move of a rung must name its source, and the source must be one the
// doctrine recognises. Following the call sites rather than the UI, because the
// rule engine will move rungs from a server path with no click anywhere near it.
const SOURCES = ['automatic', 'coach', 'override'];
const movers = ['coach/coach.js', 'private/data.js'];

for (const file of movers) {
  const text = readFileSync(file, 'utf8');
  for (const call of text.matchAll(/moveCheckpoint\s*\(/g)) {
    // The declaration itself is not a call site.
    if (/(?:async\s+)?function\s+$/.test(text.slice(Math.max(0, call.index - 30), call.index))) continue;
    const args = text.slice(call.index, call.index + 400);
    const named = SOURCES.some((source) => args.includes(`source: '${source}'`));
    const forwards = /provenance|\.\.\.source|source\s*[,)]/.test(args);
    if (!named && !forwards) {
      const line = text.slice(0, call.index).split('\n').length;
      console.error(`${file}:${line}: a rung moves here without naming what moved it`);
      bad++;
    }
  }
}

// The guard inside moveCheckpoint is the last line of defence. If it goes, a
// caller that forgets a source writes a rung with no provenance at all.
if (!/CHECKPOINT_SOURCES\.includes\(source\)/.test(data)) {
  console.error('private/data.js: moveCheckpoint no longer rejects a move with no source');
  bad++;
}
if (!/moved_at/.test(data)) {
  console.error('private/data.js: moveCheckpoint no longer stamps provenance onto the row');
  bad++;
}
// The ledger is what makes automatic advancement auditable and idempotent. If
// the write disappears, rungs move with no permanent record and a replayed
// filing can move one twice.
if (!/from\('mark_checkpoint_movements'\)\s*\.insert/.test(data)) {
  console.error('private/data.js: a rung can move without writing the movement ledger');
  bad++;
}
if (!/ledgerError\.code === '23505'/.test(data)) {
  console.error('private/data.js: moveCheckpoint no longer treats a replayed filing as already applied');
  bad++;
}
if (!/An automatic advance names its evidence and the rule version/.test(data)) {
  console.error('private/data.js: an automatic advance can fire without citing evidence or a rule version');
  bad++;
}

if (bad) { console.error(`\n${bad} contract violation(s)`); process.exit(1); }
console.log('contract check passed: every rung that moves records what moved it');
