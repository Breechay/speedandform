import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDecisionVersionLink,decisionVersionStory} from '../private/decision-version-link.mjs';

const decision={id:'d',athlete_id:'athlete'};
const session={id:'s',athlete_id:'athlete'};
const version={id:'v',athlete_id:'athlete',planned_session_id:'s',version_number:2};
const link={decision_id:'d',version_id:'v',role:'after',reason:'Explicitly revised pacing after filed 800m baseline'};
test('an explicit same-athlete decision/version link is accepted',()=>{
  assert.equal(validateDecisionVersionLink(link,decision,version,session).ok,true);
});
test('a cross-athlete or wrong-session link is rejected',()=>{
  assert.equal(validateDecisionVersionLink(link,decision,{...version,athlete_id:'other'},session).ok,false);
  assert.equal(validateDecisionVersionLink(link,decision,{...version,planned_session_id:'other'},session).ok,false);
});
test('missing role and source reason cannot be inferred',()=>{
  assert.equal(validateDecisionVersionLink({...link,role:'afterward',reason:''},decision,version,session).ok,false);
});
test('an unavailable link source stays unknown and explicit before/after stay separate',()=>{
  assert.equal(decisionVersionStory(decision,[],{available:false}).unknown,true);
  const story=decisionVersionStory(decision,[{...link,version_number:2,title:'4 × 800m'},
    {...link,version_id:'old',role:'before',version_number:1,title:'3 × 800m'}],{available:true});
  assert.equal(story.before.length,1);
  assert.equal(story.after.length,1);
});
test('database link shape preserves exact version identity and joined title',()=>{
  const story=decisionVersionStory(decision,[{
    decision_id:'d',planned_session_version_id:'v',role:'after',reason:'Confirmed new speed prescription',
    planned_session_versions:{planned_session_id:'s',version_number:2,title:'10 × 200m',athlete_id:'athlete'}
  }],{available:true});
  assert.deepEqual(story.after.map(x=>[x.version_id,x.planned_session_id,x.version_number,x.title]),
    [['v','s',2,'10 × 200m']]);
});
