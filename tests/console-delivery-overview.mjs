import fs from 'node:fs';
import assert from 'node:assert/strict';
import { deliveryOverviewFor } from '../private/delivery-status.js';

let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks+=1;};
const eq=(a,b,m)=>{assert.equal(a,b,m);checks+=1;};

const hope={slug:'hope',program_name:'FORM',delivery:'app',account_label:'Founding Member'};
const jose={slug:'jose',program_name:'FORM',delivery:'app',account_label:'Founding Member'};
const adrian={slug:'adrian',program_name:'Runner Mass · Phase 1',delivery:'coach',account_label:'Adrian'};
const rod={slug:'rod',program_name:'Strength & Physique',delivery:'coach',account_label:'Rod'};

const pending=deliveryOverviewFor(hope,{
  invites:[{role:'athlete',claimed_at:null,expires_at:null}],
  assignments:[{assigned_at:'2026-09-05T18:00:00Z'}],
  blocks:[{status:'active',name:'Race Pace Durability'}]
});
eq(pending.accountState,'invited','Hope remains invite-pending');
eq(pending.accountLabel,'Invite pending');
eq(pending.trainingState,'assigned_plan');
eq(pending.recordingTarget,'FORM');
eq(pending.receiptState,'not_proven','coach-import history is not a native FORM receipt');

const linked=deliveryOverviewFor(jose,{
  athleteMemberships:[{role:'athlete',status:'active'}],
  invites:[{role:'athlete',claimed_at:'2026-09-01T00:00:00Z'}],
  assignments:[{assigned_at:'2026-09-05T18:00:00Z'}]
});
eq(linked.accountState,'linked');
eq(linked.recordingTarget,'FORM');
eq(linked.receiptState,'not_proven');

const formProven=deliveryOverviewFor(jose,{
  athleteMemberships:[{role:'athlete',status:'active'}],
  assignments:[{assigned_at:'2026-09-05T18:00:00Z'}],
  formReceipts:[{source:'form',filed_at:'2026-09-17T12:00:00Z'}]
});
eq(formProven.receiptState,'proven');
eq(formProven.receiptLabel,'Native receipt proven');

const forgePending=deliveryOverviewFor(adrian,{});
eq(forgePending.trainingState,'web_fallback');
eq(forgePending.recordingTarget,'Forge');
eq(forgePending.receiptState,'not_proven');
ok(forgePending.hasWebFallback,'Adrian owns the specific web fallback');

const forgeProven=deliveryOverviewFor(adrian,{forgeReceipts:[{received_at:'2026-09-17T12:00:00Z',program_id:'adrian_runner_mass_phase1_v1'}]});
eq(forgeProven.receiptState,'proven');

const direct=deliveryOverviewFor(rod,{});
eq(direct.recordingTarget,'Coach direct','coach-delivered strength is not silently promoted to Forge');
eq(direct.receiptState,'not_required');

const view=fs.readFileSync(new URL('../coach/delivery-view.js',import.meta.url),'utf8');
ok(view.includes('coach-owned read-only preview · not a sign-in'),'preview owns its coach-only truth label');
ok(view.includes('inert aria-label="Athlete-facing Today preview"'),'preview cannot act as athlete controls');
ok(!view.includes('impersonat'),'preview does not implement impersonation');
const data=fs.readFileSync(new URL('../private/data.js',import.meta.url),'utf8');
ok(data.includes(".eq('source', 'form')"),'only real FORM-source completions prove native FORM delivery');
ok(data.includes("forge_strength_receipts"),'Forge proof reads canonical receipts');

console.log(`PASS: ${checks} console delivery overview checks`);
