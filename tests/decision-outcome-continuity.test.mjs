import test from 'node:test';
import assert from 'node:assert/strict';
import {decisionOutcomeContinuity} from '../private/decision-outcome-continuity.mjs';

const decision={id:'d1',decision_type:'prescription',effective_on:'2026-11-03',athlete_text:'Longer run',rationale:'Observed capacity',delivery_state:'published',decision_completions:[{completion_id:'f1'}]};
const filings=[{id:'f1',filed_at:'2026-11-02T12:00:00Z'},{id:'f2',filed_at:'2026-11-04T12:00:00Z'}];
test('explicit predecision evidence stays separate from later results',()=>{
  const r=decisionOutcomeContinuity([decision],filings,{available:true});
  assert.deepEqual(r.stories[0].input_evidence,[{id:'f1',loaded:true}]);
  assert.deepEqual(r.stories[0].later_filings.map(x=>x.id),['f2']);
  assert.match(r.stories[0].outcome,/Not established/);
  assert.match(r.stories[0].prescription_version,/Not linked/);
});
test('missing decision source never becomes absence of decisions',()=>{
  assert.equal(decisionOutcomeContinuity([],filings).available,false);
});
test('only bounded decision stories are projected, without a review due date',()=>{
  const out=decisionOutcomeContinuity(Array.from({length:12},(_,i)=>({...decision,id:String(i)})),filings,{available:true});
  assert.equal(out.stories.length,8);
  assert.equal('review_due' in out.stories[0],false);
});
