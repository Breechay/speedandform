'use strict';

const assert=require('node:assert/strict');
global.window=global;
require('../session-model.js');

const day={
  programId:'forge_sculpt',
  programVersion:'forge_sculpt_phase1_v1',
  prescriptionHash:'abc123',
  id:'week-1-day-1',
  version:'forge_sculpt_phase1_v1:week-1-day-1',
  t:'Upper',
  wd:'Monday',
  ex:[{
    id:'forge_sculpt_phase1_v1:week-1-day-1:movement-1:press',
    mid:'press',
    n:'Press',
    lat:'bilateral',
    rest:90,
    cue:'Press.',
    sets:[
      {id:'set-a',sequence:1,reps:{min:8,max:8},seconds:null,targetWeightPounds:50,rir:null},
      {id:'set-b',sequence:2,reps:{min:10,max:10},seconds:null,targetWeightPounds:45,rir:null}
    ]
  }]
};

let draft=ForgeSessionModel.createFocusDraft(day,{id:'draft-1',now:'2026-07-17T10:00:00Z'});
assert.equal(draft.prescription.exercises[0].sets.length,2);
assert.equal(draft.setConfirmations['set-a'],undefined);
day.ex[0].sets[0].targetWeightPounds=999;
assert.equal(draft.prescription.exercises[0].sets[0].targetWeightPounds,50);
assert.throws(
  ()=>ForgeSessionModel.confirmFocusSet(draft,'unknown-set',true,{now:'2026-07-17T10:00:30Z'}),
  /unknown_authored_set/
);

draft=ForgeSessionModel.confirmFocusSet(draft,'set-a',true,{now:'2026-07-17T10:01:00Z'});
assert.equal(draft.setConfirmations['set-a'].truth,'confirmedAsDisplayed');
assert.equal(draft.setConfirmations['set-a'].confirmedPrescription.weightPounds,50);
assert.equal(ForgeSessionModel.canComplete(draft),false);
assert.throws(
  ()=>ForgeSessionModel.completeFocusDraft(draft,{receiptId:'receipt-1',clientEventId:'event-1',now:'2026-07-17T10:02:00Z'}),
  /unconfirmed_authored_sets/
);

draft=ForgeSessionModel.confirmFocusSet(draft,'set-b',true,{now:'2026-07-17T10:03:00Z'});
const completion=ForgeSessionModel.completeFocusDraft(draft,{receiptId:'receipt-1',clientEventId:'event-1',now:'2026-07-17T10:04:00Z'});
assert.equal(completion.draft.status,'completed');
assert.equal(completion.receipt.setConfirmations['set-a'].truth,'confirmedAsDisplayed');
assert.equal(completion.receipt.setConfirmations['set-b'].confirmedPrescription.reps.min,10);
assert.equal(completion.receipt.amendsReceiptId,null);
assert.equal(completion.receipt.activeDurationSeconds,null);
assert.equal(completion.receipt.completionGeneration,1);
assert.throws(
  ()=>ForgeSessionModel.completeFocusDraft(completion.draft,{receiptId:'receipt-2',clientEventId:'event-2',now:'2026-07-17T10:04:30Z'}),
  /session_already_completed/
);

const reopened=ForgeSessionModel.reopenDraft(completion.draft,{clientEventId:'event-2',now:'2026-07-17T10:05:00Z'});
assert.equal(reopened.draft.status,'reopened');
assert.equal(reopened.event.type,'session_reopened');
assert.equal(reopened.event.reopensReceiptId,'receipt-1');
const recompleted=ForgeSessionModel.completeFocusDraft(reopened.draft,{receiptId:'receipt-2',clientEventId:'event-3',now:'2026-07-17T10:05:30Z'});
assert.equal(recompleted.receipt.completionGeneration,2);
assert.equal(recompleted.receipt.amendsReceiptId,'receipt-1');
reopened.draft.setConfirmations['set-a'].confirmedPrescription.weightPounds=40;
assert.equal(completion.receipt.setConfirmations['set-a'].confirmedPrescription.weightPounds,50);
assert.equal(completion.receipt.status,'completed');
assert.equal(ForgeSessionModel.canComplete(reopened.draft),false);

const duplicateDay=JSON.parse(JSON.stringify(day));
duplicateDay.ex[0].sets[1].id=duplicateDay.ex[0].sets[0].id;
assert.throws(
  ()=>ForgeSessionModel.createFocusDraft(duplicateDay,{id:'duplicate-draft',now:'2026-07-17T10:06:00Z'}),
  /duplicate_authored_set_id/
);

console.log('FORGE session model tests passed');
