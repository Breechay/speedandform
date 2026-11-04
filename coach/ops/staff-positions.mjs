// Stable positions, not claims that independent agents are already running.
// Source ownership, permissions, and completion receipts stay outside this catalog.
export const STAFF_POSITIONS=Object.freeze([
  {code:'HC',title:'Head Coach',department:'Coaching',holder:'Brice',kind:'human',remit:'Training philosophy, athlete relationship, final coaching judgment and exceptions.'},
  {code:'PD',title:'Program Design',department:'Coaching',kind:'agent_function',remit:'Build and maintain justified progressions from goals, baselines and athlete feedback; never invent evidence or review gates.'},
  {code:'AI',title:'Athlete Intelligence',department:'Performance',kind:'agent_function',remit:'Maintain longitudinal context, track marks and sourced feedback; distinguish observation from inference.'},
  {code:'AC',title:'Athlete Care',department:'Athlete Experience',kind:'agent_function',remit:'Organize check-ins, preferences and whole-person constraints; escalate medical or sensitive judgment to the appropriate human.'},
  {code:'FI',title:'Filing Integrity',department:'Operations',kind:'agent_function',remit:'Reconcile completions, exact rep data, Week records, feed eligibility and rendered evidence across surfaces.'},
  {code:'QR',title:'Quality & Reliability',department:'Product',kind:'agent_function',remit:'Track app crashes, hangs and performance by version; verify fixes through source diagnostics and device evidence.'},
  {code:'CE',title:'Collective Experience',department:'Community',kind:'agent_function',remit:'Maintain group-session logistics and member-facing clarity without making unapproved commitments.'}
]);

export function staffPosition(code) {return STAFF_POSITIONS.find(p=>p.code===code)||null;}
