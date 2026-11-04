import test from 'node:test';
import assert from 'node:assert/strict';
import { staffSnapshot } from '../coach/ops/staff-model.mjs';

test('Staff derives real queues and keeps unavailable reads unknown', () => {
  const snap = staffSnapshot({
    items: [{kind:'task',actor:'agent',status:'active',title:'Recheck'}, {kind:'task',actor:'agent',status:'done',title:'Complete'}],
    coach_tasks:[], sources:[]
  }, {available:false}, {available:false});
  assert.equal(snap.agentQueue.length,1);
  assert.equal(snap.done.length,1);
  assert.equal(snap.filingExceptions,null);
  assert.equal(snap.weekExceptions,null);
});

test('Staff separates roster exceptions from feed exceptions without asserting device visibility', () => {
  const snap = staffSnapshot({items:[],coach_tasks:[{title:'Coach question'}],sources:[]},
    {available:true,filings:[{feed_state:'source_post_present'},{feed_state:'missing_source_post'}]},
    {available:true,athletes:[{state:'current'},{state:'missing_week'}]});
  assert.equal(snap.coachQueue.length,1);
  assert.equal(snap.weekExceptions.length,1);
  assert.equal(snap.filingExceptions.length,1);
});
