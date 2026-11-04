// Explicit relationships only. Never infer a coaching decision's target
// prescription version from an effective date or the current Week.
export const DECISION_VERSION_ROLES=Object.freeze(['before','after']);

export function validateDecisionVersionLink(link, decision, version, session) {
  const errors=[];
  if (!link || !decision || !version || !session) return {ok:false,errors:['Owning records must be loaded']};
  if (!DECISION_VERSION_ROLES.includes(link.role)) errors.push('Unknown link role');
  if (link.decision_id!==decision.id || link.version_id!==version.id) errors.push('Owner IDs do not match');
  if (!decision.athlete_id || decision.athlete_id!==version.athlete_id || version.athlete_id!==session.athlete_id)
    errors.push('Cross-athlete link forbidden');
  if (version.planned_session_id!==session.id) errors.push('Version does not belong to session');
  if (typeof link.reason!=='string' || !link.reason.trim()) errors.push('Sourced link reason required');
  return {ok:errors.length===0,errors};
}

export function decisionVersionStory(decision, links, {available=false}={}) {
  if (!available || !Array.isArray(links)) return {available:false,before:[],after:[],unknown:true};
  const own=links.filter(x=>x.decision_id===decision?.id && DECISION_VERSION_ROLES.includes(x.role));
  const shape=x=>({version_id:x.version_id,planned_session_id:x.planned_session_id,
    version_number:x.version_number,title:x.title,role:x.role,reason:x.reason,
    linked_at:x.created_at});
  return {available:true,before:own.filter(x=>x.role==='before').map(shape),
    after:own.filter(x=>x.role==='after').map(shape),unknown:own.length===0};
}
