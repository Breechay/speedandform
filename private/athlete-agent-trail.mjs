import { validateAgentReceipt } from './agent-execution-receipt.mjs';

// Read-only, bounded projection of independently persisted agent work.
// A task's status or a dated filing never substitutes for a verified receipt.
export function athleteAgentTrail(athleteId, receipts, {available=false}={}) {
  if (!available || !athleteId || !Array.isArray(receipts))
    return {available:false,entries:[],rejected:0,reason:'Agent execution source unavailable'};
  const entries=[];
  let rejected=0;
  for (const receipt of receipts) {
    if (receipt?.athlete_id!==athleteId || !validateAgentReceipt(receipt).ok) {
      rejected++;
      continue;
    }
    entries.push({
      id:receipt.id,created_at:receipt.created_at,status:receipt.status,
      requested_action:receipt.requested_action,action_taken:receipt.action_taken,
      authority:receipt.authority,owning_record_ids:receipt.owning_record_ids,
      readback_source_id:receipt.readback?.verified===true?receipt.readback.source_id:null,
      readback_at:receipt.readback?.verified===true?receipt.readback.checked_at:null,
      destination_evidence_id:['delivered','native_verified'].includes(receipt.status)?receipt.external_visibility?.evidence_id:null,
      uncertainty:receipt.uncertainty
    });
  }
  entries.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  return {available:true,entries:entries.slice(0,12),rejected,
    limits:'Most recent twelve authenticated receipts; not a complete agent history or native app verification.'};
}
