import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const program = JSON.parse(fs.readFileSync(new URL('plans/adrian-runner-mass-phase-01/program.json', root), 'utf8'));
const { strengthFallbackSource, resolvedStrengthWeek } = await import(pathToFileURL(new URL('athlete/strength-fallback.js', root).pathname));
const { renderAthleteWorkspace } = await import(pathToFileURL(new URL('athlete/workspace.js', root).pathname));
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const has = (text, value) => ok(text.includes(value), `missing ${value}`);
const lacks = (text, value) => ok(!text.toLowerCase().includes(value.toLowerCase()), `unexpected ${value}`);

const adrian = { id:'a', display_name:'Adrian Gandara', account_label:'Adrian', delivery:'coach', home_surface:'form', program_name:'Runner Mass · Phase 1' };
const rod = { id:'r', display_name:'Rod', account_label:'Rod', delivery:'coach', home_surface:'form', program_name:'Strength & Physique' };
const source = strengthFallbackSource(adrian);
ok(source?.source === '/plans/adrian-runner-mass-phase-01/program.json', 'Adrian resolves canonical fallback source');
ok(strengthFallbackSource(rod) === null, 'Other strength athletes do not inherit Adrian fallback');

ok(program.program_id === 'adrian_runner_mass_phase1_v1', 'canonical Forge program id preserved');
ok(program.weeks.length === 3, 'all three weeks available');
ok(program.sessions_per_week === 4, 'four strength slots preserved');
for (const weekNumber of [1,2,3]) {
  const week = resolvedStrengthWeek(program, weekNumber);
  ok(week.week === weekNumber, `week ${weekNumber} resolves`);
  ok(week.days.length === 4, `week ${weekNumber} has four days`);
  ok(week.days[0].exercises.length === 7, `week ${weekNumber} inherits full Upper A menu`);
}

const record = { athlete:adrian, block:null, weeks:[], currentWeek:null, sessionsByWeek:{}, completions:[], directions:[], reads:[], decisions:[] };
const fallback = { ...program, overview_path:'/plans/adrian-runner-mass-phase-01/' };
const today = renderAthleteWorkspace(record, { view:'today', fallbackProgram:fallback, fallbackWeek:1 });
has(today,'Your three-week plan is here.');
has(today,'does not infer your current Forge week');
has(today,'does not');
lacks(today,'synced');
lacks(today,'current week.');

for (const weekNumber of [1,2,3]) {
  const html = renderAthleteWorkspace(record, { view:'plan', fallbackProgram:fallback, fallbackWeek:weekNumber });
  has(html,`Week 0${weekNumber}`);
  has(html,'Incline Barbell Bench Press');
  has(html,'Run week protected');
  has(html,'Position is not inferred from this page.');
  has(html,'does not move Forge');
  lacks(html,'RECEIVED');
  lacks(html,'synced');
}

const history = renderAthleteWorkspace(record, { view:'history', fallbackProgram:fallback });
has(history,'No Forge history has reached this account yet.');
has(history,'web-delivered work is not backfilled as a Forge receipt');
lacks(history,'missed workout');

const account = renderAthleteWorkspace(record, { view:'account', email:'adrian@example.com', fallbackProgram:fallback });
has(account,'Web reference');
has(account,'Runner Mass · Phase 01 · 3 weeks');
has(account,'does not claim Forge receipt delivery');
lacks(account,'connected');
lacks(account,'synced');

const athleteJs = fs.readFileSync(new URL('athlete/athlete.js', root), 'utf8');
has(athleteJs,'loadStrengthFallback');
has(athleteJs,'fallbackWeek');
has(athleteJs,'no current Forge week is inferred');
lacks(athleteJs,'fileSession');

console.log(`PASS: ${checks} Adrian strength fallback checks`);
