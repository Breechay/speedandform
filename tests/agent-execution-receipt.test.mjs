import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAgentReceipt,summarizeAgentReceipts} from '../private/agent-execution-receipt.mjs';

const base={lane:'athlete_steward',requested_action:'File athlete observation',authority:'Explicit coach request',owning_record_ids:['observation:uuid'],source_read_at:'2026-11-04T18:00:00Z',source_as_of:'2026-11-04T17:59:00Z',action_taken:'Recorded observation',readback:{verified:true,source_id:'observation:uuid',checked_at:'2026-11-04T18:01:00Z'},external_visibility:{native_verified:false},uncertainty:'Native app not checked',status:'saved'};

test('source readback authorizes a saved status, but not native verification',()=>{
  assert.equal(validateAgentReceipt(base).ok,true);
  assert.equal(validateAgentReceipt({...base,status:'native_verified'}).ok,false);
});
test('task completion is not itself an execution receipt',()=>{
  assert.equal(validateAgentReceipt({title:'Done',status:'done'}).ok,false);
  assert.equal(summarizeAgentReceipts([{title:'Done',status:'done'}],{available:true}).verified.length,0);
});
test('unknown ledger does not become zero verified work',()=>{
  assert.equal(summarizeAgentReceipts([]).available,false);
  assert.equal(summarizeAgentReceipts([],{available:true}).available,true);
});
test('delivered requires exact destination evidence',()=>{
  assert.equal(validateAgentReceipt({...base,status:'delivered'}).ok,false);
  assert.equal(validateAgentReceipt({...base,status:'delivered',external_visibility:{delivered:true,evidence_id:'destination:receipt'}}).ok,true);
});
