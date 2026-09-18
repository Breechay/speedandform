import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const { renderAthleteWorkspace } = await import(pathToFileURL(new URL('athlete/workspace.js', root).pathname));
const dataSource = fs.readFileSync(new URL('private/data.js', root), 'utf8');
let checks = 0;
const ok = (v,m)=>{assert.ok(v,m);checks+=1;};
const has=(s,v)=>ok(s.includes(v),'missing '+v);
const lacks=(s,v)=>ok(!s.includes(v),'unexpected '+v);

const week={id:'w4',week_number:4,starts_on:'2026-09-14',ends_on:'2026-09-20',intent:'Current authored week'};
const base={
 athlete:{id:'a',display_name:'Hope',program_name:'FORM',delivery:'app',home_surface:'form',account_label:'Founding Member'},
 block:{total_weeks:15,goal_statement:'Run under 1:30 at Orlando'},
 weeks:[week],currentWeek:week,completions:[],directions:[],reads:[],decisions:[],
 sessionsByWeek:{w4:[
   {id:'old-tue',day_label:'TUE',position:1,state:'cancelled',withdrawn_at:'2026-09-06T18:33:00Z',currentVersion:{title:'Easy week',prescribed_distance:6,distance_unit:'mi'}},
   {id:'old-thu',day_label:'THU',position:2,state:'cancelled',withdrawn_at:'2026-09-06T18:33:00Z',currentVersion:{title:'6 mi at race pace',prescribed_distance:9.43,distance_unit:'mi'}},
   {id:'live-mon',day_label:'MON',position:14,state:'published',withdrawn_at:null,currentVersion:{title:'Easy',prescribed_distance:6,distance_unit:'mi'}},
   {id:'live-tue',day_label:'TUE',position:15,state:'published',withdrawn_at:null,currentVersion:{title:'5 mi continuous at race pace',prescribed_distance:9,distance_unit:'mi'}},
   {id:'live-wed',day_label:'WED',position:16,state:'published',withdrawn_at:null,currentVersion:{title:'Easy',prescribed_distance:6,distance_unit:'mi'}},
   {id:'live-thu',day_label:'THU',position:17,state:'published',withdrawn_at:null,currentVersion:{title:'Easy with strides',prescribed_distance:6,distance_unit:'mi'}},
   {id:'live-fri',day_label:'FRI',position:18,state:'published',withdrawn_at:null,currentVersion:{title:'Easy',prescribed_distance:7,distance_unit:'mi'}},
   {id:'live-sat',day_label:'SAT',position:19,state:'published',withdrawn_at:null,currentVersion:{title:'Long run',prescribed_distance:12,distance_unit:'mi'}}
 ]}
};

for (const athlete of ['Hope','José']) {
  const record=structuredClone(base); record.athlete.display_name=athlete;
  const html=renderAthleteWorkspace(record,{view:'plan'});
  has(html,'5 mi continuous at race pace');
  has(html,'Easy with strides');
  lacks(html,'Easy week');
  lacks(html,'6 mi at race pace');
}

has(dataSource,"weeks.find((week) => week.starts_on && week.ends_on && week.starts_on <= today && today <= week.ends_on)");
has(dataSource,"// The CALENDAR first, the stored state second.");
console.log(`PASS: ${checks} four-runner reconciliation checks`);
