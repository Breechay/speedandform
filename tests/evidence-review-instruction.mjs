import fs from 'node:fs';
import assert from 'node:assert/strict';
import { athleteWording, reviewChainFor, latestAthleteReviewChain } from '../private/review-chain.js';
import { renderCoachReviewChain } from '../coach/review-chain-view.js';
import { renderAthleteWorkspace } from '../athlete/workspace.js';

let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks+=1;};
const eq=(a,b,m)=>{assert.equal(a,b,m);checks+=1;};
const has=(s,v)=>ok(s.includes(v),'missing '+v);
const lacks=(s,v)=>ok(!s.includes(v),'unexpected '+v);

const completion={id:'c1',planned_session_id:'s1',filed_at:'2026-09-17T12:00:00Z',status:'completed',actual_distance:5,distance_unit:'mi',athlete_note:'Felt controlled'};
const week={id:'w4',week_number:4,starts_on:'2026-09-14',ends_on:'2026-09-20',intent:'Hold the week together.'};
const session={id:'s1',week_id:'w4',day_label:'TUE',scheduled_on:'2026-09-15',state:'published',currentVersion:{title:'5 mi continuous at race pace',prescribed_distance:9,distance_unit:'mi',intent:'Hold the band.'}};
const next={id:'s2',week_id:'w4',day_label:'SAT',scheduled_on:'2026-09-19',state:'published',currentVersion:{title:'Long run',prescribed_distance:12,distance_unit:'mi',intent:'Easy throughout.'}};
const base={
 athlete:{id:'a',slug:'hope',display_name:'Hope',first_name:'Hope',program_name:'FORM',delivery:'app',account_label:'Founding Member',home_surface:'form'},
 block:{total_weeks:15,goal_statement:'Run under 1:30 at Orlando'},
 weeks:[week],currentWeek:week,sessions:[session,next],sessionsByWeek:{w4:[session,next]},
 completions:[completion],reads:[],directions:[],decisions:[]
};

eq(reviewChainFor(base,'c1').state,'unreviewed');
let html=renderCoachReviewChain(base,'c1');
has(html,'REVIEW + SET NEXT');
lacks(html,'Published review');

const read={id:'r1',athlete_text:'You held the pace without spending the last mile.',question_answered:'Can five miles stay controlled?',delivery_state:'published',completionIds:['c1'],published_at:'2026-09-17T13:00:00Z'};
const reviewed={...base,reads:[read]};
eq(reviewChainFor(reviewed,'c1').state,'review_published');
html=renderCoachReviewChain(reviewed,'c1');
has(html,'You held the pace');
has(html,'SET NEXT INSTRUCTION');

const direction={id:'d1',planned_session_id:'s2',based_on_read_id:'r1',athlete_text:'Keep Saturday easy. No proving.',delivery_state:'published',published_at:'2026-09-17T13:01:00Z'};
const chained={...base,reads:[read],directions:[direction]};
eq(reviewChainFor(chained,'c1').state,'published_chain');
eq(latestAthleteReviewChain(chained).direction.id,'d1');
html=renderCoachReviewChain(chained,'c1');
has(html,'Published review');
has(html,'Next instruction');
has(html,'Keep Saturday easy');
lacks(html,'REVIEW + SET NEXT');

const external={...read,delivery_state:'delivered_externally',delivered_wording:'Exact review wording from text.'};
eq(athleteWording(external),'Exact review wording from text.','external wording outranks internal athlete_text');

html=renderAthleteWorkspace({...chained,reads:[external],directions:[{...direction,delivery_state:'delivered_externally',delivered_wording:'Exact next instruction from text.'}]},{view:'today'});
has(html,'Coach review');
has(html,'Exact review wording from text.');
has(html,'Exact next instruction from text.');
lacks(html,read.athlete_text);
lacks(html,direction.athlete_text);

const coachSource=fs.readFileSync(new URL('../coach/coach.js',import.meta.url),'utf8');
has(coachSource,'publishReviewAndDirection');
has(coachSource,'data-review-next');
has(coachSource,'Publishing review and next instruction');
const migration=fs.readFileSync(new URL('../supabase/migrations/20260918002500_evidence_review_instruction_chain.sql',import.meta.url),'utf8');
has(migration,'based_on_read_id');
has(migration,'Every reviewed completion must belong to this athlete.');
has(migration,'The next instruction must point at a live session for this athlete.');
has(migration,"Only this athlete''s coach can publish coaching.");
has(migration,'p_existing_read_id uuid default null');

console.log(`PASS: ${checks} evidence-review-instruction checks`);
