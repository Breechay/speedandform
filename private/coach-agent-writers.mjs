import {validateAgentReceipt} from './agent-execution-receipt.mjs';
import {validateDecisionVersionLink} from './decision-version-link.mjs';

// Inject a signed-in, RLS-bound Supabase client. Never use service_role here.
// A successful insert alone is not a receipt: re-read the exact new row.
function requireUser(user) {
  if (!user?.id) throw new Error('Authenticated coach identity required');
}
function verifiedRow(inserted,read,expectedOwner) {
  if (!inserted?.id || !read || read.id!==inserted.id || read[expectedOwner.key]!==expectedOwner.value)
    throw new Error('Source readback failed; do not assert work saved');
  return read;
}

export async function writeAgentExecutionReceipt(client,user,receipt,{verifySource,verifyDestination}={}) {
  requireUser(user);
  const valid=validateAgentReceipt(receipt);
  if (!valid.ok) throw new Error(`Execution receipt invalid: ${valid.errors.join('; ')}`);
  if (!receipt.run_id || !receipt.idempotency_key || !receipt.athlete_id)
    throw new Error('Exact run, idempotency and athlete identities required');
  if (['saved','published','delivered','native_verified'].includes(receipt.status)) {
    if (typeof verifySource!=='function' || await verifySource(receipt)!==true)
      throw new Error('Independent owning-source verification required before saving this status');
  }
  if (['delivered','native_verified'].includes(receipt.status)) {
    if (typeof verifyDestination!=='function' || await verifyDestination(receipt)!==true)
      throw new Error('Independent destination verification required before saving this status');
  }
  const fields=['athlete_id','run_id','idempotency_key','lane','requested_action','authority',
    'owning_record_ids','source_read_at','source_as_of','action_taken','readback','external_visibility','uncertainty','status'];
  const payload=Object.fromEntries(fields.map(key=>[key,receipt[key]]));
  payload.owner_id=user.id;
  const inserted=await client.from('coach_agent_execution_receipts').insert(payload).select('id').single();
  if (inserted.error || !inserted.data?.id)
    throw new Error(`Execution receipt not saved: ${inserted.error?.message||'No inserted ID'}`);
  const read=await client.from('coach_agent_execution_receipts').select('*').eq('id',inserted.data.id).single();
  if (read.error) throw new Error('Source readback failed; do not assert work saved');
  const row=verifiedRow(inserted.data,read.data,{key:'owner_id',value:user.id});
  if (row.athlete_id!==receipt.athlete_id || row.idempotency_key!==receipt.idempotency_key ||
      row.status!==receipt.status || !validateAgentReceipt(row).ok)
    throw new Error('Execution readback mismatched; do not assert work saved');
  return row;
}

export async function writeDecisionVersionLink(client,user,link,decision,version,session) {
  requireUser(user);
  const canonical={...link,version_id:link.planned_session_version_id};
  const valid=validateDecisionVersionLink(canonical,decision,version,session);
  if (!valid.ok) throw new Error(`Decision/version link invalid: ${valid.errors.join('; ')}`);
  const payload={decision_id:link.decision_id,planned_session_version_id:link.planned_session_version_id,
    role:link.role,reason:link.reason,authored_by:user.id};
  const inserted=await client.from('coach_decision_version_links').insert(payload).select('id').single();
  if (inserted.error || !inserted.data?.id)
    throw new Error(`Decision/version link not saved: ${inserted.error?.message||'No inserted ID'}`);
  const read=await client.from('coach_decision_version_links').select('*').eq('id',inserted.data.id).single();
  if (read.error) throw new Error('Source readback failed; do not assert link saved');
  const row=verifiedRow(inserted.data,read.data,{key:'authored_by',value:user.id});
  if (row.decision_id!==link.decision_id || row.planned_session_version_id!==link.planned_session_version_id ||
      row.role!==link.role || row.reason!==link.reason)
    throw new Error('Decision/version readback mismatched; do not assert link saved');
  return row;
}
