import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260918011500_form_native_exact_retry_noop.sql', import.meta.url),
  'utf8'
);
const original = fs.readFileSync(
  new URL('../supabase/migrations/20260912154500_explicit_session_version_receipt.sql', import.meta.url),
  'utf8'
);

assert.match(migration, /existing\.rpe is distinct from p_rpe/);
assert.match(migration, /existing\.symptoms is distinct from p_symptoms/);
assert.match(migration, /existing\.athlete_note is distinct from p_athlete_note/);
assert.doesNotMatch(migration, /elsif\s+p_symptoms is not null or p_athlete_note is not null/i);
assert.match(migration, /return existing\.id;/);
assert.match(migration, /update public\.session_completions[\s\S]*?rpe = coalesce\(p_rpe, rpe\)[\s\S]*?symptoms = coalesce\(p_symptoms, symptoms\)[\s\S]*?athlete_note = coalesce\(p_athlete_note, athlete_note\)/);
assert.doesNotMatch(
  migration.slice(migration.indexOf('if existing.id is not null'), migration.indexOf('insert into public.session_completions')),
  /actual_distance\s*=|duration_seconds\s*=|planned_session_version_id\s*=/
);

// The prior boundary remains: a planned filing must name the exact version it rendered.
assert.match(original, /A planned FORM filing must carry the exact session version it rendered/);
assert.match(original, /That receipt already belongs to a different prescription/);

console.log('PASS: exact FORM retry is a true no-op; late subjective amendments remain bounded');
