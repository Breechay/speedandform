import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const sql=read('supabase/migrations/20261104211000_coach_agent_athlete_brief.sql');
const js=read('coach/ops/console.js');
const html=read('coach/ops/index.html');

test('athlete brief remains scoped, bounded, private and read-only',()=>{
  assert.match(sql,/auth\.uid\(\) is null/);
  assert.match(sql,/operating_console_owner\(\)/);
  assert.match(sql,/is_coach_member\(p_athlete_id\)/);
  assert.match(sql,/limit 8/);
  assert.match(sql,/limit 10/);
  assert.match(sql,/source_as_of/);
  assert.match(sql,/revoke all on function public\.coach_agent_athlete_brief\(uuid\) from public,anon,authenticated/);
  assert.doesNotMatch(sql,/\b(?:insert|update|delete|truncate)\s+(?:into\s+|from\s+)?public\./i);
});

test('operations provides an authorized source index and Week-story warning',()=>{
  assert.match(html,/data-tab="intelligence"/);
  assert.match(js,/coach_roster_story_audit/);
  assert.match(js,/coach_agent_athlete_brief/);
  assert.match(js,/source brief/);
  assert.match(js,/story_current/);
  assert.match(js,/no native display or wearable refresh implied/i);
});

test('rule index points to actual owning files and does not replace them',()=>{
  const index=JSON.parse(read('coach/rule-index.json'));
  assert.equal(index.schema_version,1);
  assert.ok(index.rules.length>=10);
  const ids=new Set();
  for(const rule of index.rules){
    assert.ok(!ids.has(rule.id));ids.add(rule.id);
    assert.ok(rule.owner && rule.enforcement && rule.verification);
    const ownerPath=rule.authority.split('#')[0];
    assert.ok(fs.existsSync(path.join(process.cwd(),ownerPath)),`${rule.id}: ${ownerPath}`);
  }
});

test('specialists have bounded permissions, receipts and no additional scheduler',()=>{
  const contract=JSON.parse(read('coach/agent-run-contract.json'));
  assert.equal(contract.default_mode,'observe_and_report');
  assert.equal(contract.no_new_schedulers,true);
  assert.equal(contract.lanes.length,5);
  assert.ok(contract.required_receipt_fields.includes('source_as_of'));
  assert.ok(contract.required_receipt_fields.includes('external_visibility'));
  for(const lane of contract.lanes){assert.ok(lane.must_not.length);assert.ok(lane.receipt);}
});
