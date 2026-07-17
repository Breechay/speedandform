'use strict';

const assert=require('node:assert/strict');
global.window=global;
global.localStorage={getItem:()=>null,setItem:()=>{}};
require('../continuity-store.js');

const Store=ForgeContinuityStore.Store;
const store=new Store({});
const transaction={aborted:false,abort(){this.aborted=true;}};
const existing={state:{storageRevision:2,done:{},sets:{},sessions:{}}};
const committed=store.nextSnapshotState(transaction,existing,{storageRevision:2,done:{a:true},sets:{},sessions:{}});
assert.equal(committed.storageRevision,3);
assert.equal(committed.done.a,true);

const staleTransaction={aborted:false,abort(){this.aborted=true;}};
assert.throws(
  ()=>store.nextSnapshotState(staleTransaction,existing,{storageRevision:1,done:{},sets:{},sessions:{}}),
  /stale_snapshot_revision/
);
assert.equal(staleTransaction.aborted,true);

const receipt={id:'r1',completionGeneration:1,prescription:{sessionVersion:'v1:s1',prescriptionHash:'hash'}};
const first=store.receiptRow('user:a',receipt);
const duplicate=store.receiptRow('user:a',{...receipt,id:'r2'});
const reopened=store.receiptRow('user:a',{...receipt,id:'r3',completionGeneration:2});
const otherNamespace=store.receiptRow('user:b',receipt);
assert.equal(first.id,'user:a:r1');
assert.equal(first.receiptId,'r1');
assert.notEqual(first.id,otherNamespace.id);
assert.equal(first.completionKey,duplicate.completionKey);
assert.notEqual(first.completionKey,reopened.completionKey);
const event={id:'event-1',type:'set_checked',entityId:'v1:s1',payload:{setId:'set-a',truth:'confirmedAsDisplayed'}};
const storedEvent=store.mutationRow('user:a',event);
const otherNamespaceEvent=store.mutationRow('user:b',event);
assert.equal(storedEvent.id,'user:a:event-1');
assert.notEqual(storedEvent.id,otherNamespaceEvent.id);
assert.equal(store.mutationMatches(storedEvent,event),true);
assert.equal(store.mutationMatches(storedEvent,{...event,payload:{setId:'set-b',truth:'confirmedAsDisplayed'}}),false);
assert.equal(store.receiptMatches(first,receipt),true);
assert.equal(store.receiptMatches(first,{...receipt,completionGeneration:2}),false);
assert.equal(Store.hasTrainingState({done:{},sets:{},sessions:{draft:{status:'active'}}}),true);

console.log('FORGE continuity contract tests passed');
