import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const receipt=fs.readFileSync(new URL('../docs/operations/sql/coach_44_8_agent_execution_DRAFT.sql',import.meta.url),'utf8');
const link=fs.readFileSync(new URL('../docs/operations/sql/coach_44_8_decision_version_DRAFT.sql',import.meta.url),'utf8');

test('draft receipt ledger is authenticated, owner-scoped, append-only and idempotent',()=>{
  assert.match(receipt,/unique\(owner_id,idempotency_key\)/i);
  assert.match(receipt,/owner_id=\(select auth\.uid\(\)\)/i);
  assert.match(receipt,/operating_console_owner\(\)/i);
  assert.match(receipt,/enable row level security/i);
  assert.match(receipt,/grant select,insert .* to authenticated/i);
  assert.doesNotMatch(receipt,/grant .*update.*to authenticated/i);
  assert.doesNotMatch(receipt,/grant .*delete.*to authenticated/i);
  assert.match(receipt,/readback->>'verified'='true'/);
});
test('draft version links require explicit source and same-athlete identity',()=>{
  assert.match(link,/unique\(decision_id,planned_session_version_id,role\)/i);
  assert.match(link,/d\.athlete_id=v\.athlete_id and v\.athlete_id=s\.athlete_id/i);
  assert.match(link,/role in \('before','after'\)/i);
  assert.match(link,/public\.is_coach_member\(d\.athlete_id\)/i);
  assert.match(link,/authored_by=\(select auth\.uid\(\)\)/i);
  assert.match(link,/enable row level security/i);
  assert.doesNotMatch(link,/grant .*update.*to authenticated/i);
});
