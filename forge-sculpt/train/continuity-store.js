(function(global){
  'use strict';

  const DB_NAME='forge_training_v1';
  const DB_VERSION=3;
  const INSTALLATION_KEY='forge_installation_id';

  const requestResult=request=>new Promise((resolve,reject)=>{
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));
  });
  const transactionDone=transaction=>new Promise((resolve,reject)=>{
    transaction.oncomplete=()=>resolve();
    transaction.onerror=()=>reject(transaction.error||new Error('IndexedDB transaction failed'));
    transaction.onabort=()=>reject(transaction.error||new Error('IndexedDB transaction aborted'));
  });
  const clone=value=>JSON.parse(JSON.stringify(value));
  const stableStringify=value=>{
    if(Array.isArray(value))return`[${value.map(stableStringify).join(',')}]`;
    if(value&&typeof value==='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  };

  function installationId(){
    let value=null;
    try{value=localStorage.getItem(INSTALLATION_KEY);}catch(_){}
    if(value)return value;
    value=crypto.randomUUID();
    try{localStorage.setItem(INSTALLATION_KEY,value);}catch(_){}
    return value;
  }

  function open(){
    if(!('indexedDB' in global))return Promise.reject(new Error('IndexedDB unavailable'));
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains('snapshots'))db.createObjectStore('snapshots',{keyPath:'namespace'});
        if(!db.objectStoreNames.contains('programs'))db.createObjectStore('programs',{keyPath:'key'});
        let mutationStore;
        if(!db.objectStoreNames.contains('mutations')){
          mutationStore=db.createObjectStore('mutations',{keyPath:'id'});
        }else{
          mutationStore=request.transaction.objectStore('mutations');
        }
        if(!mutationStore.indexNames.contains('namespace_status')){
          const store=mutationStore;
          store.createIndex('namespace_status',['namespace','status'],{unique:false});
        }
        if(!mutationStore.indexNames.contains('namespace_created')){
          const store=mutationStore;
          store.createIndex('namespace_created',['namespace','createdAt'],{unique:false});
        }
        if(!mutationStore.indexNames.contains('namespace'))mutationStore.createIndex('namespace','namespace',{unique:false});
        let receiptStore;
        if(!db.objectStoreNames.contains('receipts')){
          receiptStore=db.createObjectStore('receipts',{keyPath:'id'});
        }else{
          receiptStore=request.transaction.objectStore('receipts');
        }
        if(!receiptStore.indexNames.contains('namespace')){
          const store=receiptStore;
          store.createIndex('namespace',['namespace'],{unique:false});
        }
        if(!receiptStore.indexNames.contains('completion_key'))receiptStore.createIndex('completion_key','completionKey',{unique:true});
        if(!db.objectStoreNames.contains('namespaceClaims'))db.createObjectStore('namespaceClaims',{keyPath:'sourceNamespace'});
        if(request.oldVersion<3){
          const migrateKeys=(store,idField)=>{
            store.openCursor().onsuccess=event=>{
              const cursor=event.target.result;
              if(!cursor)return;
              const row=cursor.value;
              if(row.namespace&&!row[idField]){
                const legacyId=row.id;
                const migrated={...row,[idField]:legacyId,id:`${row.namespace}:${legacyId}`};
                store.delete(cursor.primaryKey);
                store.add(migrated);
              }
              cursor.continue();
            };
          };
          migrateKeys(mutationStore,'clientEventId');
          migrateKeys(receiptStore,'receiptId');
        }
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Unable to open training store'));
      request.onblocked=()=>reject(new Error('Training store upgrade blocked'));
    });
  }

  class Store{
    constructor(db){this.db=db;this.installationId=installationId();}
    anonymousNamespace(){return`anonymous:${this.installationId}`;}
    userNamespace(userId){return`user:${userId}`;}

    async snapshot(namespace){
      const transaction=this.db.transaction('snapshots','readonly');
      const value=await requestResult(transaction.objectStore('snapshots').get(namespace));
      await transactionDone(transaction);
      return value?clone(value.state):null;
    }

    async saveSnapshot(namespace,state){
      const transaction=this.db.transaction('snapshots','readwrite');
      const store=transaction.objectStore('snapshots');
      const existing=await requestResult(store.get(namespace));
      const committed=this.nextSnapshotState(transaction,existing,state);
      store.put({namespace,state:committed,updatedAt:new Date().toISOString()});
      await transactionDone(transaction);
      return committed;
    }

    async migrateLegacyAnonymous(legacyState){
      const namespace=this.anonymousNamespace();
      const existing=await this.snapshot(namespace);
      if(existing)return existing;
      return this.saveSnapshot(namespace,legacyState);
    }

    async claimAnonymousLocally(userId){
      const anonymous=this.anonymousNamespace(),target=this.userNamespace(userId);
      const transaction=this.db.transaction(['snapshots','receipts','mutations','namespaceClaims'],'readwrite');
      const snapshots=transaction.objectStore('snapshots');
      const receipts=transaction.objectStore('receipts');
      const mutations=transaction.objectStore('mutations');
      const namespaceClaims=transaction.objectStore('namespaceClaims');
      const requests=[
        requestResult(snapshots.get(anonymous)),
        requestResult(snapshots.get(target)),
        requestResult(receipts.index('namespace').getAll(anonymous)),
        requestResult(receipts.index('namespace').getAll(target)),
        requestResult(mutations.index('namespace').getAll(anonymous)),
        requestResult(mutations.index('namespace').getAll(target)),
        requestResult(namespaceClaims.get(anonymous))
      ];
      const [anonymousRow,targetRow,anonymousReceipts,targetReceipts,anonymousMutations,targetMutations,priorClaim]=await Promise.all(requests);
      if(priorClaim){
        transaction.abort();
        throw new Error('anonymous_namespace_already_claimed');
      }
      if((targetRow&&Store.hasTrainingState(targetRow.state))||targetReceipts.length||targetMutations.length){
        transaction.abort();
        throw new Error('target_namespace_not_empty');
      }
      if((!anonymousRow||!Store.hasTrainingState(anonymousRow.state))&&!anonymousReceipts.length&&!anonymousMutations.length){
        transaction.abort();
        throw new Error('anonymous_namespace_empty');
      }
      const anonymousState=anonymousRow?.state||{done:{},sets:{},sessions:{},email:null,mode:'session'};
      const anonymousRevision=Number.isInteger(anonymousState.storageRevision)?anonymousState.storageRevision:0;
      const targetRevision=Number.isInteger(targetRow?.state?.storageRevision)?targetRow.state.storageRevision:0;
      const claimedState=clone(anonymousState);
      claimedState.storageRevision=Math.max(anonymousRevision,targetRevision)+1;
      const clearedAnonymous={storageRevision:anonymousRevision+1,done:{},sets:{},sessions:{},email:null,mode:'session'};
      const archivedNamespace=`archive:${anonymous}:${userId}:${new Date().toISOString()}`;
      snapshots.put({namespace:archivedNamespace,state:clone(anonymousState),archivedFor:userId,updatedAt:new Date().toISOString()});
      snapshots.put({namespace:target,state:claimedState,claimedFrom:anonymous,updatedAt:new Date().toISOString()});
      snapshots.put({namespace:anonymous,state:clearedAnonymous,archivedTo:archivedNamespace,updatedAt:new Date().toISOString()});
      anonymousReceipts.forEach(receipt=>receipts.add({...this.receiptRow(target,this.receiptPayload(receipt)),claimedFrom:anonymous}));
      anonymousMutations.forEach(mutation=>{
        const clientEventId=mutation.clientEventId||mutation.id;
        mutations.add({...mutation,id:`${target}:${clientEventId}`,clientEventId,namespace:target,claimedFrom:anonymous,updatedAt:new Date().toISOString()});
      });
      namespaceClaims.add({sourceNamespace:anonymous,targetNamespace:target,archiveNamespace:archivedNamespace,claimedAt:new Date().toISOString()});
      const claimId=crypto.randomUUID();
      mutations.add(this.mutationRow(target,{id:claimId,type:'local_state_claimed',entityId:target,payload:{archiveNamespace:archivedNamespace,receiptCount:anonymousReceipts.length,mutationCount:anonymousMutations.length}}));
      await transactionDone(transaction);
      return claimedState;
    }

    async cacheProgram(key,payload,prescriptionHash){
      const transaction=this.db.transaction('programs','readwrite');
      transaction.objectStore('programs').put({key,payload:clone(payload),prescriptionHash,validatedAt:new Date().toISOString()});
      await transactionDone(transaction);
    }

    async cachedProgram(key){
      const transaction=this.db.transaction('programs','readonly');
      const value=await requestResult(transaction.objectStore('programs').get(key));
      await transactionDone(transaction);
      return value?clone(value):null;
    }

    async enqueue(namespace,type,entityId,payload){
      const row=this.mutationRow(namespace,{type,entityId,payload});
      const transaction=this.db.transaction('mutations','readwrite');
      transaction.objectStore('mutations').add(row);
      await transactionDone(transaction);
      return clone(row);
    }

    mutationRow(namespace,event){
      const now=new Date().toISOString();
      const clientEventId=event.id||crypto.randomUUID();
      return{id:`${namespace}:${clientEventId}`,clientEventId,namespace,installationId:this.installationId,type:event.type,entityId:event.entityId,payload:clone(event.payload||event),status:'localOnly',createdAt:event.createdAt||now,updatedAt:now};
    }

    async commitCompletion(namespace,state,receipt,event){
      const transaction=this.db.transaction(['snapshots','receipts','mutations'],'readwrite');
      const snapshots=transaction.objectStore('snapshots');
      const receipts=transaction.objectStore('receipts');
      const mutations=transaction.objectStore('mutations');
      const [existing,priorMutation,priorReceipt]=await Promise.all([
        requestResult(snapshots.get(namespace)),
        requestResult(mutations.get(`${namespace}:${event.id}`)),
        requestResult(receipts.get(`${namespace}:${receipt.id}`))
      ]);
      if(priorMutation){
        if(!this.mutationMatches(priorMutation,event)||!priorReceipt||!this.receiptMatches(priorReceipt,receipt)){
          transaction.abort();
          throw new Error('client_event_id_conflict');
        }
        await transactionDone(transaction);
        return clone(existing?.state||state);
      }
      if(priorReceipt){
        transaction.abort();
        throw new Error('receipt_id_conflict');
      }
      const committed=this.nextSnapshotState(transaction,existing,state);
      snapshots.put({namespace,state:committed,updatedAt:new Date().toISOString()});
      receipts.add(this.receiptRow(namespace,receipt));
      mutations.add(this.mutationRow(namespace,event));
      await transactionDone(transaction);
      return committed;
    }

    async commitStateMutation(namespace,state,event){
      const transaction=this.db.transaction(['snapshots','mutations'],'readwrite');
      const snapshots=transaction.objectStore('snapshots');
      const mutations=transaction.objectStore('mutations');
      const [existing,priorMutation]=await Promise.all([
        requestResult(snapshots.get(namespace)),
        requestResult(mutations.get(`${namespace}:${event.id}`))
      ]);
      if(priorMutation){
        if(!this.mutationMatches(priorMutation,event)){
          transaction.abort();
          throw new Error('client_event_id_conflict');
        }
        await transactionDone(transaction);
        return clone(existing?.state||state);
      }
      const committed=this.nextSnapshotState(transaction,existing,state);
      snapshots.put({namespace,state:committed,updatedAt:new Date().toISOString()});
      mutations.add(this.mutationRow(namespace,event));
      await transactionDone(transaction);
      return committed;
    }

    nextSnapshotState(transaction,existing,state){
      const expected=Number.isInteger(state?.storageRevision)?state.storageRevision:0;
      const current=Number.isInteger(existing?.state?.storageRevision)?existing.state.storageRevision:0;
      if(expected!==current){
        transaction.abort();
        throw new Error('stale_snapshot_revision');
      }
      const committed=clone(state);
      committed.storageRevision=current+1;
      return committed;
    }

    mutationMatches(existing,event){
      return existing.clientEventId===event.id
        &&existing.type===event.type
        &&existing.entityId===event.entityId
        &&stableStringify(existing.payload)===stableStringify(event.payload||event);
    }

    receiptMatches(existing,receipt){
      return stableStringify(this.receiptPayload(existing))===stableStringify(receipt);
    }

    async mutations(namespace,status){
      const transaction=this.db.transaction('mutations','readonly');
      const index=transaction.objectStore('mutations').index('namespace_status');
      const rows=await requestResult(index.getAll(IDBKeyRange.only([namespace,status])));
      await transactionDone(transaction);
      return clone(rows);
    }

    async saveReceipt(namespace,receipt){
      const transaction=this.db.transaction('receipts','readwrite');
      transaction.objectStore('receipts').add(this.receiptRow(namespace,receipt));
      await transactionDone(transaction);
    }

    receiptRow(namespace,receipt){
      const snapshot=clone(receipt),prescription=snapshot.prescription||{};
      const completionKey=`${namespace}:${prescription.sessionVersion}:${prescription.prescriptionHash}:completion-${snapshot.completionGeneration}`;
      return{...snapshot,receiptId:snapshot.id,id:`${namespace}:${snapshot.id}`,namespace,completionKey};
    }

    receiptPayload(stored){
      const payload=clone(stored);
      payload.id=payload.receiptId||payload.id;
      delete payload.receiptId;
      delete payload.namespace;
      delete payload.completionKey;
      delete payload.claimedFrom;
      return payload;
    }

    static hasTrainingState(state){
      if(!state)return false;
      return Object.keys(state.done||{}).length>0||Object.keys(state.sets||{}).length>0||Object.keys(state.sessions||{}).length>0;
    }

    static counts(state){
      return{
        completed:Object.values(state?.done||{}).filter(Boolean).length,
        checks:Object.values(state?.sets||{}).filter(Boolean).length,
        drafts:Object.values(state?.sessions||{}).filter(session=>session?.status!=='completed').length
      };
    }
  }

  global.ForgeContinuityStore={open:async()=>new Store(await open()),Store};
})(window);
