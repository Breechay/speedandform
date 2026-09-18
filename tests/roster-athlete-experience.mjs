import assert from 'node:assert/strict';
import { renderAthleteWorkspace } from '../athlete/workspace.js';

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const has = (html, value, message=value) => ok(html.includes(value), message);
const lacks = (html, value, message=value) => ok(!html.includes(value), message);

const week = { id:'w1', week_number:1, starts_on:'2026-09-14', ends_on:'2026-09-20', intent:'Build the week without forcing it.' };
const runSession = { id:'s1', week_id:'w1', day_label:'THU', state:'published', currentVersion:{ title:'Easy run', prescribed_distance:4, distance_unit:'mi', intent:'Easy and conversational.' } };

function record(athlete, { block=null, sessions=[] } = {}) {
  return {
    athlete,
    block,
    weeks: block ? [week] : [],
    currentWeek: block ? week : null,
    sessions,
    sessionsByWeek: block ? { w1:sessions } : {},
    completions:[], directions:[], reads:[], decisions:[]
  };
}

const natalie = record({
  slug:'natalie', display_name:'Natalie Ajamil', first_name:'Natalie',
  program_name:'Run Development', account_label:'Run Development · 8 weeks · Week 1 · Paid',
  delivery:'app', home_surface:'website'
}, { block:{ total_weeks:8, goal_statement:'Build toward the Miami Half.' }, sessions:[runSession] });

let html = renderAthleteWorkspace(natalie, { view:'today', email:'natalie@example.com' });
has(html, 'Run development', 'Natalie keeps running identity');
has(html, 'Record completed running sessions in <strong>FORM</strong>', 'Natalie gets real FORM recording instruction');
lacks(html, 'Managed by Brice', 'Natalie is not mislabeled coach-direct');

html = renderAthleteWorkspace(natalie, { view:'account', email:'natalie@example.com' });
has(html, '<span>Delivery</span><b>FORM app</b>', 'Natalie account names app delivery');
has(html, '<span>Completed work</span><b>FORM</b>', 'Natalie account names FORM receipt channel');

for (const athlete of [
  { slug:'rod', display_name:'Rod', first_name:'Rod', program_name:'Strength & Physique', account_label:'Rod', delivery:'coach', home_surface:'form' },
  { slug:'devin', display_name:'Devin', first_name:'Devin', program_name:'Strength & Physique', account_label:'Devin', delivery:'coach', home_surface:'form' },
  { slug:'valerie', display_name:'Valerie', first_name:'Valerie', program_name:'Run Development', account_label:'Valerie', delivery:'coach', home_surface:'form' }
]) {
  const r = record(athlete);
  html = renderAthleteWorkspace(r, { view:'today', email:athlete.slug+'@example.com' });
  has(html, 'Your training is coach-managed.', athlete.slug+' no-plan state is coach-managed');
  has(html, 'No filing is expected on this website.', athlete.slug+' website does not invent filing');
  lacks(html, 'Record completed sessions in Forge', athlete.slug+' does not invent Forge');
  lacks(html, 'Record completed sessions in FORM', athlete.slug+' does not invent FORM');

  html = renderAthleteWorkspace(r, { view:'account', email:athlete.slug+'@example.com' });
  has(html, '<span>Delivery</span><b>Coach-managed</b>', athlete.slug+' account names real delivery');
  has(html, '<span>Completed work</span><b>With Brice</b>', athlete.slug+' completed work stays coach-direct');
}

const simon = record({
  slug:'simon', display_name:'Simon', first_name:'Simon', program_name:'Half build',
  account_label:'Coached in person. The app is optional.', delivery:'coach', home_surface:'form'
}, { block:{ total_weeks:8, goal_statement:'Threshold cycle' }, sessions:[] });

html = renderAthleteWorkspace(simon, { view:'today', email:'simon@example.com' });
has(html, 'Brice is managing completed-work records directly.', 'Simon authored-block state stays coach-direct');
lacks(html, 'Record completed running sessions in <strong>FORM</strong>', 'Simon app is not promoted from running discipline');

html = renderAthleteWorkspace(simon, { view:'plan', email:'simon@example.com' });
has(html, 'Managed by Brice', 'Simon plan summary reflects coach management');
lacks(html, 'Record in FORM', 'Simon plan does not invent FORM channel');

console.log(`PASS: ${checks} roster athlete experience checks`);
