import test from 'node:test';
import assert from 'node:assert/strict';
import {writeAgentExecutionReceipt,writeDecisionVersionLink} from '../private/coach-agent-writers.mjs';
import {decisionVersionStory} from '../private/decision-version-link.mjs';
import {decisionOutcomeContinuity} from '../private/decision-outcome-continuity.mjs';
import {athleteContinuity} from '../private/athlete-continuity.mjs';
import {athleteAgentTrail} from '../private/athlete-agent-trail.mjs';

const user={id:'coach-1'},athlete='athlete-1';
const decision={id:'decision-1',athlete_id:athlete,decision_type:'speed',effective_on:'2026-11-03',
  athlete_text:'Progress Thursday speed mechanics',rationale:'Athlete filed a controlled baseline',
  delivery_state:'published',decision_completions:[{completion_id:'baseline-1'}]};
const session={id:'session-1',athlete_id:athlete};
const version={id:'version-2',planned_session_id:session.id,athlete_id:athlete,version_number:2,title:'10 × 200m'};
const link={decision_id:decision.id,planned_session_version_id:version.id,role:'after',reason:'Explicit coach decision'};
const receipt={athlete_id:athlete,run_id:'run-1',idempotency_key:'run-1-version-2',
  lane:'coaching',requested_action:'Publish revised Thursday session',authority:'Coach approved',
  owning_record_ids:['planned_session_versions:version-2'],source_read_at:null,source_as_of:null,
  action_taken:'Saved version 2',status:'saved',
  readback:{verified:true,source_id:'version-2',checked_at:'2026-11-04T15:00:00Z'},
  external_visibility:{},uncertainty:'Native app display not yet checked'};
const checkedSource={verifySource:async r=>r.readback.source_id==='version-2'};

function memoryClient({deny=false,missingReadback=false}={}) {
  const tables=new Map();let counter=0;
  return {from(name){
    return {
      insert(payload){
        return {select(){return {async single(){
          if(deny)return {data:null,error:{message:'RLS denied'}};
          const row={...payload,id:`row-${++counter}`,created_at:'2026-11-04T15:01:00Z'};
          if(!tables.has(name))tables.set(name,[]);
          tables.get(name).push(row);
          return {data:{id:row.id},error:null};
        }}}};
      },
      select(){return {eq(key,value){return {async single(){
        const row=tables.get(name)?.find(r=>r[key]===value);
        return missingReadback?{data:null,error:{message:'read failed'}}:{data:row,error:row?null:{message:'missing'}};
      }}}};}
    };
  }};
}

test('controlled athlete story: feedback, decision, version, filing, independently read-back execution',async()=>{
  const client=memoryClient();
  const versionRow=await writeDecisionVersionLink(client,user,link,decision,version,session);
  const execution=await writeAgentExecutionReceipt(client,user,receipt,checkedSource);
  const versionStory=decisionVersionStory(decision,[{
    ...versionRow,planned_session_versions:{planned_session_id:session.id,version_number:2,title:version.title,athlete_id:athlete}
  }],{available:true});
  const filings=[{id:'baseline-1',filed_at:'2026-11-02T14:00:00Z'},
    {id:'later-1',filed_at:'2026-11-05T14:00:00Z',status:'filed'}];
  const decisionStory=decisionOutcomeContinuity([decision],filings,{available:true});
  const observation={id:'feedback-1',observed_on:'2026-11-02',source:'athlete_reported',
    observation:'More confident arm rhythm',evidence_completion_ids:['baseline-1']};
  const chronology=athleteContinuity({recent_filings:filings,upcoming_sessions:[]},[observation],{feedbackAvailable:true});
  const agent=athleteAgentTrail(athlete,[execution],{available:true});
  assert.equal(versionStory.after[0].version_id,'version-2');
  assert.equal(decisionStory.stories[0].input_evidence[0].id,'baseline-1');
  assert.equal(decisionStory.stories[0].later_filings[0].id,'later-1');
  assert.match(decisionStory.stories[0].outcome,/Not established/);
  assert.equal(chronology.episodes[0].linked_filings[0].id,'baseline-1');
  assert.equal(agent.entries[0].readback_source_id,'version-2');
  assert.equal(agent.entries[0].destination_evidence_id,null);
});

test('identity, denied writes and failed source readbacks cannot be called complete',async()=>{
  await assert.rejects(writeDecisionVersionLink(memoryClient(),user,link,decision,
    {...version,athlete_id:'other'},session),/Cross-athlete/);
  await assert.rejects(writeAgentExecutionReceipt(memoryClient({deny:true}),user,receipt,checkedSource),/not saved/);
  await assert.rejects(writeAgentExecutionReceipt(memoryClient({missingReadback:true}),user,receipt,checkedSource),/readback failed/);
  await assert.rejects(writeAgentExecutionReceipt(memoryClient(),null,receipt),/Authenticated/);
  await assert.rejects(writeAgentExecutionReceipt(memoryClient(),user,receipt),/Independent owning-source/);
  await assert.rejects(writeAgentExecutionReceipt(memoryClient(),user,receipt,{verifySource:async()=>false}),/Independent owning-source/);
});
