import test from 'node:test';
import assert from 'node:assert/strict';
import {athleteContinuity} from '../private/athlete-continuity.mjs';

test('unavailable history cannot become an empty all-clear',()=>{
  assert.equal(athleteContinuity({recent_filings:[]},[],{feedbackAvailable:false}).available,false);
});
test('athlete words stay separate from later events and explicit evidence links',()=>{
  const output=athleteContinuity({
    recent_filings:[{id:'before',filed_at:'2026-11-01T12:00:00Z'},{id:'after',filed_at:'2026-11-04T12:00:00Z',status:'completed'}],
    upcoming_sessions:[{id:'planned',scheduled_on:'2026-11-05',version_id:'v2',title:'Long run'}]
  },[{id:'observed',source:'athlete_reported',facet:'helps',observed_on:'2026-11-03',observation:'I understand where the strength work fits',evidence_completion_ids:['before']}],{feedbackAvailable:true});
  const episode=output.episodes[0];
  assert.deepEqual(episode.linked_filings.map(x=>x.id),['before']);
  assert.deepEqual(episode.later_filings.map(x=>x.id),['after']);
  assert.equal(episode.later_prescriptions[0].version_id,'v2');
  assert.match(episode.interpretation,/no improvement, causality/);
});
test('bounded chronology retains source and supersession without invented review gates',()=>{
  const feedback=Array.from({length:10},(_,i)=>({id:`o${i}`,source:'coach_observed',observed_on:`2026-10-${String(i+10).padStart(2,'0')}`,observation:`Observation ${i}`,supersedes:i===9?'o8':null}));
  const output=athleteContinuity({},feedback,{feedbackAvailable:true});
  assert.equal(output.episodes.length,6);
  assert.equal(output.episodes[0].supersedes,'o8');
  assert.equal('review_due' in output.episodes[0],false);
});
test('same-day filings are not falsely ordered after a date-only observation',()=>{
  const out=athleteContinuity({recent_filings:[{id:'same-day',filed_at:'2026-11-04T08:00:00Z'},{id:'next-day',filed_at:'2026-11-05T08:00:00Z'}]},
    [{id:'observation',source:'athlete_reported',observed_on:'2026-11-04',observation:'Strength placement is clearer'}],{feedbackAvailable:true});
  assert.deepEqual(out.episodes[0].later_filings.map(x=>x.id),['next-day']);
});
