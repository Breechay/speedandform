import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ATHLETIC_LIFE_IDEAS,OPPORTUNITY_CATEGORIES,validateOpportunityFeed,
  activeOpportunityCount,canApproveOpportunity,canStartOpportunity,opportunityEstimate
} from '../coach/ops/opportunity-model.mjs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261029162911_athletic_life_opportunities_v1.sql',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../coach/ops/console.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../coach/ops/index.html',import.meta.url),'utf8');
const candidate={id:'one',title:'One New Door',category:'experience',status:'candidate',hypothesis:'Remove one real barrier',next_test:'Ask a willing athlete what would be meaningful',approval_note:'A single private discovery conversation',estimated_hours:2,estimated_cost_usd:0};

test('twenty different starting ideas without creating a backlog in production',()=>{
  assert.equal(ATHLETIC_LIFE_IDEAS.length,20);
  assert.equal(new Set(ATHLETIC_LIFE_IDEAS.map(([title])=>title)).size,20);
  for(const [,category] of ATHLETIC_LIFE_IDEAS)assert.ok(OPPORTUNITY_CATEGORIES[category]);
  assert.doesNotMatch(sql,/INSERT\s+INTO\s+public\.athletic_opportunities/i);
});
test('candidate requires an explicit scoped experiment before approval',()=>{
  assert.equal(canApproveOpportunity(candidate),true);
  assert.equal(canApproveOpportunity({...candidate,estimated_cost_usd:null}),false);
  assert.equal(canApproveOpportunity({...candidate,estimated_hours:null}),false);
  assert.equal(canApproveOpportunity({...candidate,next_test:' '}),false);
  assert.equal(canApproveOpportunity({...candidate,approval_note:''}),false);
  assert.equal(canApproveOpportunity({...candidate,status:'active'}),false);
  assert.equal(canApproveOpportunity({...candidate,status:'parked'}),false);
});
test('two-slot limit and approval are required to start',()=>{
  const ready={...candidate,status:'ready',approved_at:'2026-10-29T00:00:00Z',approved_by:'owner'};
  assert.equal(canStartOpportunity(ready,[]),true);
  assert.equal(canStartOpportunity(ready,[{status:'active'},{status:'active'}]),false);
  assert.equal(canStartOpportunity({...ready,approved_at:null},[]),false);
  assert.equal(activeOpportunityCount([{status:'active'},{status:'ready'},{status:'parked'}]),1);
  assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/active_count>=2/);
  assert.match(sql,/Invalid opportunity state transition/);
});
test('feed is versioned and incomplete reads fail',()=>{
  assert.throws(()=>validateOpportunityFeed({schema_version:2,items:[]}));
  assert.throws(()=>validateOpportunityFeed({schema_version:1}));
  assert.deepEqual(validateOpportunityFeed({schema_version:1,items:[]}).items,[]);
});
test('estimates distinguish unknown from actual zero',()=>{
  assert.match(opportunityEstimate({...candidate,estimated_hours:null}),/Hours unknown/);
  assert.match(opportunityEstimate({...candidate,estimated_cost_usd:null}),/Cost unknown/);
  assert.match(opportunityEstimate(candidate),/\$0\.00 estimated/);
});
test('private owner-scoped storage and append-only operating history',()=>{
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/owner_id=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql,/is_active_coaching_administrator/);
  assert.match(sql,/REVOKE ALL ON public\.athletic_opportunities FROM PUBLIC,anon,authenticated/);
  assert.match(sql,/GRANT SELECT,INSERT,UPDATE ON public\.athletic_opportunities TO authenticated/);
  assert.doesNotMatch(sql,/GRANT\s+DELETE\s+ON\s+public\.athletic_opportunities\s+TO\s+authenticated/i);
  assert.match(sql,/operating_record_audit/);
  assert.match(sql,/SECURITY INVOKER/);
});
test('experiment decisions cannot execute real-world side effects',()=>{
  assert.match(js,/rpc\('athletic_opportunities_read'/);
  assert.match(js,/\.eq\('revision',item\.revision\)/);
  assert.match(js,/kind:'task',area:'form'/);
  assert.doesNotMatch(js,/from\('collective_runs'\)\.(insert|update)/);
  assert.doesNotMatch(js,/from\('planned_sessions'\)\.(insert|update)/);
  assert.doesNotMatch(js,/sendEmail\(|createEvent\(|publishAlbum\(/);
  assert.match(html,/data-tab="opportunities"/);
  assert.match(html,/Private workspace/);
});
