import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261104183000_coach_filing_integrity_projection.sql',import.meta.url),'utf8');
const next=fs.readFileSync(new URL('../supabase/migrations/20261104194500_coach_filing_reconciliation_consent_timing.sql',import.meta.url),'utf8');
const arithmetic=fs.readFileSync(new URL('../supabase/migrations/20261104200500_program_version_arithmetic_guard.sql',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../coach/ops/console.js',import.meta.url),'utf8');

test('read projection is authenticated, coach-scoped, bounded and no-write',()=>{
  assert.match(sql,/operating_console_owner\(\)/);
  assert.match(sql,/is_coach_member\(c\.athlete_id\)/);
  assert.match(sql,/auth\.uid\(\) is null/);
  assert.match(sql,/least\(greatest\(coalesce\(p_days,14\),1\),30\)/);
  assert.match(sql,/limit 120/);
  assert.match(sql,/revoke all on function public\.coach_filing_integrity_read\(integer\) from public, anon, authenticated/);
  assert.match(sql,/grant execute on function public\.coach_filing_integrity_read\(integer\) to authenticated/);
  assert.doesNotMatch(sql,/\b(?:insert|update|delete|truncate)\s+(?:into\s+|from\s+)?public\./i);
});

test('effective sharing is not inferred from missing settings',()=>{
  assert.match(sql,/not k\.enabled/);
  assert.match(sql,/when sharing_disabled and not sharing_enabled then 'opted_out'/);
  assert.match(sql,/when not sharing_enabled then 'sharing_not_enabled'/);
  assert.match(sql,/when active_posts > 0 and sharing_enabled then 'source_post_present'/);
  assert.match(sql,/rendered Week requires athlete-facing readback/);
  assert.match(sql,/rendered and deduplicated feed requires separate readback/);
});

test('Console uses real projection with an explicit unavailable state',()=>{
  assert.match(js,/supabase\.rpc\('coach_filing_integrity_read',\{p_days:14\}\)/);
  assert.match(js,/filingIntegrity\.error/);
  assert.match(js,/Respect opted-out accounts/);
  assert.match(js,/No source-level filing exceptions/);
  assert.match(js,/escapeHtml as e/);
});

test('historical sharing does not become retroactive feed authority',()=>{
  assert.match(next,/k\.granted_at <= s\.filed_at/);
  assert.match(next,/when not shared_at_filing then 'before_sharing_enabled'/);
  assert.match(next,/when sharing_disabled and active_posts > 0 then 'privacy_conflict'/);
  assert.match(next,/when sharing_disabled then 'opted_out'/);
  assert.match(js,/before_sharing_enabled:'Filed before sharing began/);
});

test('repair is scoped, serialized with opt-out, idempotent and source-only',()=>{
  assert.match(next,/coach_reconcile_filing_post\(p_completion_id uuid\)/);
  assert.match(next,/operating_console_owner\(\)/);
  assert.match(next,/is_coach_member\(rec\.athlete_id\)/);
  assert.match(next,/for update/);
  assert.match(next,/for share of c/);
  assert.match(next,/c\.granted_at<=rec\.filed_at/);
  assert.match(next,/state','already_present'/);
  assert.match(next,/publish_completion\(rec\)/);
  assert.match(next,/rendered_feed_verified',false/);
  assert.match(next,/revoke all on function public\.coach_reconcile_filing_post\(uuid\) from public, anon, authenticated/);
  assert.doesNotMatch(next,/\b(?:insert|update|delete)\s+(?:into\s+|from\s+)?public\.collective_work_consents/i);
});

test('canonical publication rejects mathematically invalid prescriptions',()=>{
  for(const name of ['form_version_rpe_order','form_version_positive_distance','form_version_positive_duration','form_component_rpe_order','form_component_positive_duration']){
    assert.match(arithmetic,new RegExp(`add constraint ${name}`));
    assert.match(arithmetic,new RegExp(`validate constraint ${name}`));
  }
  assert.match(arithmetic,/rpe_low <= rpe_high/);
  assert.match(arithmetic,/prescribed_distance > 0/);
  assert.match(arithmetic,/duration_seconds > 0/);
  assert.doesNotMatch(arithmetic,/\bupdate\s+public\.planned_sessions\b/i);
});
