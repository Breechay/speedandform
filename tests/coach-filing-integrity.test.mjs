import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261104183000_coach_filing_integrity_projection.sql',import.meta.url),'utf8');
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
