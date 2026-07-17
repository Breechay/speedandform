(function(global){
  'use strict';

  const copy=value=>JSON.parse(JSON.stringify(value));
  const iso=value=>(value instanceof Date?value:new Date(value)).toISOString();

  function prescriptionSnapshot(day){
    const snapshot={
      programId:day.programId,
      programVersion:day.programVersion,
      prescriptionHash:day.prescriptionHash,
      sessionId:day.id,
      sessionVersion:day.version,
      title:day.t,
      weekday:day.wd,
      exercises:day.ex.map(exercise=>({
        authoredExerciseId:exercise.id,
        movementId:exercise.mid,
        name:exercise.n,
        laterality:exercise.lat,
        restSeconds:exercise.rest,
        cue:exercise.cue||null,
        sets:exercise.sets.map(set=>copy(set))
      }))
    };
    const setIds=snapshot.exercises.flatMap(exercise=>exercise.sets.map(set=>set.id));
    if(!snapshot.programVersion||!snapshot.sessionId||!snapshot.sessionVersion||!snapshot.prescriptionHash)throw new Error('incomplete_prescription_identity');
    if(setIds.length!==new Set(setIds).size)throw new Error('duplicate_authored_set_id');
    return snapshot;
  }

  function createFocusDraft(day,{id,now}){
    return{
      id,
      schemaVersion:1,
      mode:'focus',
      status:'active',
      revision:0,
      completionGeneration:0,
      startedAt:iso(now),
      updatedAt:iso(now),
      completedAt:null,
      currentReceiptId:null,
      prescription:prescriptionSnapshot(day),
      setConfirmations:{}
    };
  }

  function prescribedSet(draft,setId){
    for(const exercise of draft.prescription.exercises){
      const set=exercise.sets.find(item=>item.id===setId);
      if(set)return{exercise,set};
    }
    throw new Error('unknown_authored_set');
  }

  function confirmFocusSet(draft,setId,confirmed,{now}){
    if(draft.status==='completed')throw new Error('completed_session_requires_reopen');
    const next=copy(draft),match=prescribedSet(next,setId);
    if(confirmed){
      next.setConfirmations[setId]={
        authoredSetId:setId,
        authoredExerciseId:match.exercise.authoredExerciseId,
        movementId:match.exercise.movementId,
        truth:'confirmedAsDisplayed',
        confirmedAt:iso(now),
        confirmedPrescription:{
          reps:copy(match.set.reps),
          seconds:match.set.seconds,
          weightPounds:match.set.targetWeightPounds
        }
      };
    }else{
      delete next.setConfirmations[setId];
    }
    next.status=next.status==='reopened'?'reopened':'active';
    next.revision+=1;
    next.updatedAt=iso(now);
    return next;
  }

  function expectedSetIds(draft){
    return draft.prescription.exercises.flatMap(exercise=>exercise.sets.map(set=>set.id));
  }

  function canComplete(draft){
    const expected=expectedSetIds(draft);
    return expected.length>0&&expected.every(setId=>{
      const confirmation=draft.setConfirmations[setId],set=prescribedSet(draft,setId).set;
      return confirmation?.truth==='confirmedAsDisplayed'
        &&JSON.stringify(confirmation.confirmedPrescription.reps)===JSON.stringify(set.reps)
        &&confirmation.confirmedPrescription.seconds===set.seconds
        &&confirmation.confirmedPrescription.weightPounds===set.targetWeightPounds;
    });
  }

  function completeFocusDraft(draft,{receiptId,clientEventId,now}){
    if(draft.status==='completed')throw new Error('session_already_completed');
    if(!canComplete(draft))throw new Error('unconfirmed_authored_sets');
    const completedAt=iso(now),next=copy(draft),amendsReceiptId=draft.status==='reopened'?draft.currentReceiptId:null;
    next.status='completed';
    next.revision+=1;
    next.completionGeneration=(next.completionGeneration||0)+1;
    next.completedAt=completedAt;
    next.updatedAt=completedAt;
    next.currentReceiptId=receiptId;
    const receipt={
      id:receiptId,
      schemaVersion:1,
      clientEventId,
      draftId:next.id,
      mode:'focus',
      status:'completed',
      revision:next.revision,
      completionGeneration:next.completionGeneration,
      startedAt:next.startedAt,
      completedAt,
      activeDurationSeconds:null,
      amendsReceiptId,
      prescription:copy(next.prescription),
      setConfirmations:copy(next.setConfirmations)
    };
    return{draft:next,receipt};
  }

  function reopenDraft(draft,{clientEventId,now}){
    if(draft.status!=='completed')throw new Error('session_not_completed');
    const reopenedAt=iso(now),next=copy(draft);
    next.status='reopened';
    next.revision+=1;
    next.completedAt=null;
    next.updatedAt=reopenedAt;
    return{
      draft:next,
      event:{
        id:clientEventId,
        type:'session_reopened',
        entityId:next.prescription.sessionVersion,
        revision:next.revision,
        reopensReceiptId:next.currentReceiptId,
        reopenedAt
      }
    };
  }

  global.ForgeSessionModel={
    prescriptionSnapshot,
    createFocusDraft,
    confirmFocusSet,
    expectedSetIds,
    canComplete,
    completeFocusDraft,
    reopenDraft
  };
})(window);
