import test from 'node:test';
import assert from 'node:assert/strict';
import { athleteAgentTrail } from '../private/athlete-agent-trail.mjs';

const base={id:'r1',athlete_id:'a1',created_at:'2026-11-04T16:00:00Z',status:'saved',
  lane:'coaching',requested_action:'Revise the Thursday track session',authority:'Coach instruction',
  owning_record_ids:['planned_session_versions:v2'],source_read_at:null,source_as_of:null,
  action_taken:'Created version 2',readback:{verified:true,source_id:'v2',checked_at:'2026-11-04T16:01:00Z'},
  external_visibility:{},uncertainty:'Native Week display not checked'};

test('unknown receipt source cannot become a clean zero',()=>{
  assert.equal(athleteAgentTrail('a1',[],{available:false}).available,false);
});
test('the athlete trail accepts only same-athlete structurally verified receipts',()=>{
  const result=athleteAgentTrail('a1',[base,{...base,id:'r2',athlete_id:'a2'},
    {...base,id:'r3',readback:{verified:false}}],{available:true});
  assert.equal(result.entries.length,1);
  assert.equal(result.rejected,2);
  assert.equal(result.entries[0].readback_source_id,'v2');
  assert.equal(result.entries[0].destination_evidence_id,null);
});
test('a delivered assertion without destination proof is withheld',()=>{
  const result=athleteAgentTrail('a1',[{...base,status:'delivered'}],{available:true});
  assert.equal(result.entries.length,0);
  assert.equal(result.rejected,1);
});
test('a drafted action is visible without suggesting it was saved',()=>{
  const result=athleteAgentTrail('a1',[{...base,status:'drafted',readback:{verified:false}}],{available:true});
  assert.equal(result.entries[0].status,'drafted');
  assert.equal(result.entries[0].readback_source_id,null);
});
