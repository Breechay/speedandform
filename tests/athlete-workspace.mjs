import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const { renderAthleteWorkspace } = await import(pathToFileURL(new URL('athlete/workspace.js', root).pathname));
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const has = (text, value) => ok(text.includes(value), `missing ${value}`);
const lacks = (text, value) => ok(!text.includes(value), `unexpected ${value}`);

const week1 = { id:'w1', week_number:1, starts_on:'2026-09-14', ends_on:'2026-09-20', intent:'Build the week without forcing it.' };
const base = {
  athlete:{ id:'a1', display_name:'José', account_label:'Run Development', delivery:'form_app', home_surface:'running', program_name:'Race Pace Durability' },
  block:{ id:'b1', current_week:1, total_weeks:15, goal_statement:'Half marathon · Dec 5' },
  weeks:[week1], currentWeek:week1,
  sessionsByWeek:{ w1:[
    {id:'s1',day_label:'Mon',currentVersion:{title:'General aerobic',prescribed_distance:6,distance_unit:'mi',intent:'Easy and conversational.'}},
    {id:'s2',day_label:'Tue',currentVersion:{title:'Race pace',prescribed_distance:9,distance_unit:'mi',intent:'5 mi continuous at your race-pace band.'}}
  ]},
  completions:[{id:'c1',planned_session_id:'s1',status:'completed',actual_distance:6,distance_unit:'mi',filed_at:'2026-09-14T12:00:00Z',athlete_note:'Smooth.'}],
  directions:[], reads:[{published_at:'2026-09-15T12:00:00Z',athlete_text:'The work is landing.'}], decisions:[]
};

for (const view of ['today','plan','history','account']) {
  const html = renderAthleteWorkspace(base,{view,email:'jose@example.com'});
  has(html,'Today'); has(html,'Plan'); has(html,'History'); has(html,'Account');
  lacks(html,'File this session'); lacks(html,'Update your note'); lacks(html,'data-file-session');
}

const today = renderAthleteWorkspace(base,{view:'today'});
has(today,'Your current week.'); has(today,'Record completed running sessions in <strong>FORM</strong>');
has(today,'This website is your read-only reference.');

const plan = renderAthleteWorkspace(base,{view:'plan'});
has(plan,'Week 1'); has(plan,'General aerobic'); has(plan,'Race pace');
has(plan,'Browsing another week does not change your current position.');
has(plan,'RECEIVED'); has(plan,'Record in FORM');

const history = renderAthleteWorkspace(base,{view:'history'});
has(history,'What reached your record.'); has(history,'Session received'); has(history,'Coach read');
has(history,'No record received does not automatically mean a session was missed.');

const account = renderAthleteWorkspace(base,{view:'account',email:'jose@example.com'});
has(account,'Signed in as'); has(account,'jose@example.com'); has(account,'Training app'); has(account,'FORM');

// Match Adrian's current production metadata exactly enough to prevent a remote
// strength athlete from being mislabeled as a runner simply because the legacy
// delivery/home fields still say coach/form.
const strength = structuredClone(base);
strength.athlete = {id:'a2',display_name:'Adrian Gandara',account_label:'Adrian',delivery:'coach',home_surface:'form',program_name:'Runner Mass · Phase 1'};
strength.block = null; strength.weeks=[]; strength.currentWeek=null; strength.sessionsByWeek={}; strength.completions=[]; strength.reads=[];
const adrian = renderAthleteWorkspace(strength,{view:'today'});
has(adrian,'Strength development'); has(adrian,'Runner Mass · Phase 1'); has(adrian,'Your next block is not published here yet.'); has(adrian,'Forge remains the place to record completed sessions.');
lacks(adrian,'Run development'); lacks(adrian,'mi planned');

const physique = structuredClone(strength);
physique.athlete = {id:'a3',display_name:'Rod',account_label:'Rod',delivery:'coach',home_surface:'form',program_name:'Strength & Physique'};
const rod = renderAthleteWorkspace(physique,{view:'today'});
has(rod,'Strength development'); lacks(rod,'Run development');

const emptyHistory = renderAthleteWorkspace(strength,{view:'history'});
has(emptyHistory,'No history has reached this account yet.'); has(emptyHistory,'Forge records');

const athleteJs = read('athlete/athlete.js');
lacks(athleteJs,'fileSession'); lacks(athleteJs,'updateCompletion'); lacks(athleteJs,'fileDialog');
has(athleteJs,'renderAthleteWorkspace'); has(athleteJs,"['today','plan','history','account']");

const index = read('athlete/index.html');
for (const label of ['Today','Plan','History','Account']) has(index,label);
lacks(index,'How did it go?'); lacks(index,'File this session'); lacks(index,'Optional screenshot');

console.log(`PASS: ${checks} athlete workspace checks`);
