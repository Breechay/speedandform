// Writes (or with --check, verifies) the generated Adrian block of the structured-strength
// migration from the canonical plans/adrian-developed-runner-2026/program.json.
import fs from 'node:fs';
import { buildSpec, loadProgram } from './structured-strength-spec.mjs';

export const MIGRATION = 'supabase/migrations/20261006190000_structured_strength_exercises.sql';
const START = '  -- BEGIN GENERATED ADRIAN STRUCTURED STRENGTH\n';
const END = '  -- END GENERATED ADRIAN STRUCTURED STRENGTH\n';

export function renderBlock(root = '.') {
  const spec = buildSpec(loadProgram(root));
  const json = JSON.stringify(spec);
  if (json.includes('$spec$')) throw new Error('spec contains the dollar-quote tag');
  return `${START}  v_spec jsonb := $spec$${json}$spec$;\n${END}`;
}

export function splice(sql, block) {
  const a = sql.indexOf(START), b = sql.indexOf(END);
  if (a < 0 || b < 0) throw new Error('generated markers not found in migration');
  return sql.slice(0, a) + block + sql.slice(b + END.length);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const current = fs.readFileSync(MIGRATION, 'utf8');
  const next = splice(current, renderBlock());
  if (process.argv.includes('--check')) {
    if (next !== current) { console.error('structured-strength migration is out of sync with program.json; run scripts/generate-structured-strength-migration.mjs'); process.exit(1); }
    console.log('structured-strength migration matches program.json');
  } else {
    fs.writeFileSync(MIGRATION, next);
    console.log('wrote', MIGRATION);
  }
}
