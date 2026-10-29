// The Athletic Life proposals are private experiment decisions, not public events.
export const OPPORTUNITY_CATEGORIES = {
  experience:'Experiences',connection:'Connections',development:'Development',
  creative:'Creative work',commercial:'Commercial',product:'Product'
};
export const OPPORTUNITY_STATES = {
  candidate:'Candidate',ready:'Approved test',active:'In progress',
  completed:'Reviewed',parked:'Parked'
};
export const ATHLETIC_LIFE_IDEAS = [
  ['The Race You Never Considered','experience'],
  ['The City Is the Course','experience'],
  ['Athletic Curiosity Sessions','experience'],
  ['The 48-Hour Athletic Escape','experience'],
  ['One New Door','experience'],
  ['The Table After Practice','connection'],
  ['The Right Running Partner','connection'],
  ["The Athlete's Dinner",'connection'],
  ['Skill Exchange','connection'],
  ['The Support Crew','connection'],
  ['The Season Conversation','development'],
  ['The Race After the Race','development'],
  ['The Movement Portrait','development'],
  ['A Year in Motion','development'],
  ['The Personal Athletic Question','development'],
  ['Ordinary Greatness','creative'],
  ['The Athletic Life Exhibition','creative'],
  ['Thursday as a Living Studio','creative'],
  ['The FORM Creative Residency','creative'],
  ['The Athletic Life Festival','creative']
];
export function validateOpportunityFeed(data) {
  if (!data || data.schema_version!==1 || !Array.isArray(data.items))
    throw new Error('Unsupported opportunity register response.');
  return data;
}
export function activeOpportunityCount(items) {
  return items.filter(o=>o.status==='active').length;
}
export function canApproveOpportunity(o) {
  return o.status==='candidate' &&
    Boolean(o.title?.trim() && o.hypothesis?.trim() && o.next_test?.trim() &&
    o.approval_note?.trim()) &&
    o.estimated_hours!==null && o.estimated_hours!==undefined &&
    o.estimated_cost_usd!==null && o.estimated_cost_usd!==undefined;
}
export function canStartOpportunity(o,items) {
  return o.status==='ready' && Boolean(o.approved_at && o.approved_by) &&
    activeOpportunityCount(items)<2;
}
export function opportunityEstimate(o) {
  const hours=o.estimated_hours===null?'Hours unknown':`${Number(o.estimated_hours).toLocaleString('en-US')} h`;
  const cost=o.estimated_cost_usd===null?'Cost unknown':Number(o.estimated_cost_usd).toLocaleString('en-US',{style:'currency',currency:'USD'});
  return `${hours} · ${cost} estimated`;
}
