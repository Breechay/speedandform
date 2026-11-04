// Existing FORM decisions and explicit decision_completions are the owners.
// Evidence linked to a decision is decision INPUT, not proof of its outcome.
export function decisionOutcomeContinuity(decisions, completions, {available=false}={}) {
  if (!available || !Array.isArray(decisions) || !Array.isArray(completions))
    return {available:false,stories:[],reason:'Decision or filing source unavailable'};
  const byId=new Map(completions.map(c=>[c.id,c]));
  const stories=decisions.slice().sort((a,b)=>String(b.effective_on||'').localeCompare(String(a.effective_on||''))).slice(0,8).map(d=>{
    const inputIds=(d.decision_completions||[]).map(link=>link.completion_id).filter(Boolean);
    const later=completions.filter(c=>c.filed_at && d.effective_on && c.filed_at.slice(0,10)>d.effective_on)
      .sort((a,b)=>String(a.filed_at).localeCompare(String(b.filed_at))).slice(0,5);
    return {
      decision_id:d.id,decision_type:d.decision_type,effective_on:d.effective_on,
      athlete_text:d.athlete_text,rationale:d.rationale,delivery_state:d.delivery_state,
      input_evidence:inputIds.map(id=>({id,loaded:byId.has(id)})),
      later_filings:later.map(c=>({id:c.id,filed_at:c.filed_at,status:c.status})),
      outcome:'Not established by chronological proximity. A sourced coach interpretation is needed.',
      prescription_version:'Not linked in current decision schema'
    };
  });
  return {available:true,stories,limits:'Latest eight decisions and eight recent filings; not a complete outcome history.'};
}
