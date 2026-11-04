import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { feedbackCaptureDecision } from '../private/feedback-capture-policy.mjs';

const facts={athleteResolved:true,sourceKnown:true,observedDateKnown:true,meaningfulAthleticEvidence:true};

test('explicit instruction files without second approval when authorized',()=>{
  assert.equal(feedbackCaptureDecision({...facts,explicitFileRequest:true,authenticatedWriterAvailable:true}),'file_and_read_back');
  assert.equal(feedbackCaptureDecision({...facts,explicitFileRequest:true}),'request_authorized_connection');
});
test('incidental meaningful feedback asks once; small talk stays in conversation',()=>{
  assert.equal(feedbackCaptureDecision(facts),'ask_once_whether_to_file');
  assert.equal(feedbackCaptureDecision({athleteResolved:true}),'leave_in_conversation');
});
test('identity ambiguity and sensitive evidence prevent automatic filing',()=>{
  assert.equal(feedbackCaptureDecision({...facts,athleteResolved:false,explicitFileRequest:true,authenticatedWriterAvailable:true}),'ask_one_clarifying_question');
  assert.equal(feedbackCaptureDecision({...facts,sensitiveOrAmbiguous:true}),'ask_one_clarifying_question');
});
test('existing observation writer checks exact duplicate before insert',()=>{
  const code=fs.readFileSync(new URL('../private/data.js',import.meta.url),'utf8');
  assert.match(code,/\.eq\('observed_on', observedOn\)\.eq\('observation', original\)/);
  assert.match(code,/alreadyPresent: true/);
});
