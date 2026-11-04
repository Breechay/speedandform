// Time-ordered context, not a causal attribution or automatic progression gate.
// Only facts already authorized in the athlete brief and observation read.
export function athleteContinuity(brief, feedback, {feedbackAvailable=false}={}) {
  if (!brief || !feedbackAvailable || !Array.isArray(feedback)) return {available:false,episodes:[],reason:'Historical observations or athlete brief unavailable'};
  const filings=Array.isArray(brief.recent_filings)?brief.recent_filings:[];
  const sessions=Array.isArray(brief.upcoming_sessions)?brief.upcoming_sessions:[];
  const episodes=feedback.slice().filter(o=>o?.observed_on&&o?.observation).sort((a,b)=>
    String(b.observed_on).localeCompare(String(a.observed_on)) || String(b.created_at||'').localeCompare(String(a.created_at||''))
  ).slice(0,6).map(o=>{
    // observed_on has day precision, so same-day filing order is unknown.
    const after=filings.filter(f=>f.filed_at && f.filed_at.slice(0,10)>o.observed_on)
      .sort((a,b)=>String(a.filed_at).localeCompare(String(b.filed_at))).slice(0,3);
    const prescribed=sessions.filter(s=>s.scheduled_on && s.scheduled_on>=o.observed_on)
      .sort((a,b)=>String(a.scheduled_on).localeCompare(String(b.scheduled_on))).slice(0,3);
    const linked=new Set(o.evidence_completion_ids||[]);
    return {
      observation_id:o.id,observed_on:o.observed_on,source:o.source,facet:o.facet,
      observation:o.observation,supersedes:o.supersedes||null,
      linked_filings:filings.filter(f=>linked.has(f.id)).map(f=>({id:f.id,filed_at:f.filed_at})),
      later_filings:after.map(f=>({id:f.id,filed_at:f.filed_at,status:f.status})),
      later_prescriptions:prescribed.map(s=>({id:s.id,scheduled_on:s.scheduled_on,version_id:s.version_id,title:s.title})),
      interpretation:'Chronological context only; no improvement, causality, or plan change is inferred.'
    };
  });
  return {available:true,episodes,limits:'Latest 12 observations, 8 filings, and 8-day upcoming prescriptions at most; not a complete athlete history.'};
}
