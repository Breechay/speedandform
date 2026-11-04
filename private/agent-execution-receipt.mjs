// Contract for future authorized, append-only agent execution receipts.
// No inference from a completed task, plan publication or GitHub PR.
export const AGENT_RECEIPT_STATES = Object.freeze([
  'observed', 'drafted', 'saved', 'published', 'delivered', 'native_verified', 'blocked'
]);
export const AGENT_RECEIPT_FIELDS = Object.freeze([
  'lane', 'requested_action', 'authority', 'owning_record_ids', 'source_read_at',
  'source_as_of', 'action_taken', 'readback', 'external_visibility', 'uncertainty'
]);

const hasText = value => typeof value === 'string' && value.trim().length > 0;
const timestamp = value => value === null || (hasText(value) && !Number.isNaN(Date.parse(value)));

export function validateAgentReceipt(raw) {
  const errors=[];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {ok:false, errors:['Receipt object required']};
  for (const field of AGENT_RECEIPT_FIELDS) if (!(field in raw)) errors.push(`Missing ${field}`);
  for (const field of ['lane','requested_action','authority','action_taken']) if (!hasText(raw[field])) errors.push(`${field} must be specific text`);
  if (!AGENT_RECEIPT_STATES.includes(raw.status)) errors.push('Unknown status');
  if (!Array.isArray(raw.owning_record_ids) || raw.owning_record_ids.some(x=>!hasText(x))) errors.push('owning_record_ids must be an array of exact source references');
  if (!timestamp(raw.source_read_at) || !timestamp(raw.source_as_of)) errors.push('Source timestamps invalid');
  if (!raw.readback || typeof raw.readback !== 'object' || Array.isArray(raw.readback)) errors.push('Readback object required');
  if (!raw.external_visibility || typeof raw.external_visibility !== 'object' || Array.isArray(raw.external_visibility)) errors.push('External visibility object required');
  if (!hasText(raw.uncertainty)) errors.push('Uncertainty must be stated, including "none identified" if applicable');
  const proof=raw.readback?.verified === true && hasText(raw.readback?.source_id) && hasText(raw.readback?.checked_at);
  if (['saved','published','delivered','native_verified'].includes(raw.status) && !proof) errors.push('Persisted or delivered states require verified source readback');
  if (raw.status==='native_verified' && !(raw.external_visibility?.native_verified === true && hasText(raw.external_visibility?.evidence_id))) errors.push('Native verified requires device evidence ID');
  if (raw.status==='delivered' && !(raw.external_visibility?.delivered === true && hasText(raw.external_visibility?.evidence_id))) errors.push('Delivered requires destination evidence ID');
  return {ok:errors.length===0,errors};
}

export function summarizeAgentReceipts(receipts, {available=false}={}) {
  if (!available || !Array.isArray(receipts)) return {available:false,verified:[],unverified:[],blocked:[]};
  const accepted=receipts.filter(r=>validateAgentReceipt(r).ok);
  return {
    available:true,
    verified:accepted.filter(r=>['saved','published','delivered','native_verified'].includes(r.status)),
    unverified:accepted.filter(r=>['observed','drafted'].includes(r.status)),
    blocked:accepted.filter(r=>r.status==='blocked')
  };
}
