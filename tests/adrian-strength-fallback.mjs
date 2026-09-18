import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const program = JSON.parse(read('plans/adrian-developed-runner-2026/program.json'));
const { strengthFallbackSource, resolvedStrengthWeek } = await import(pathToFileURL(new URL('athlete/strength-fallback.js', root).pathname));
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const has = (text, value) => ok(text.includes(value), `missing ${value}`);
const lacks = (text, value) => ok(!text.toLowerCase().includes(value.toLowerCase()), `unexpected ${value}`);

const adrian = { id:'a', display_name:'Adrian Gandara', account_label:'Adrian', delivery:'coach', home_surface:'form', program_name:'Runner Mass · Phase 1' };
const rod = { id:'r', display_name:'Rod', account_label:'Rod', delivery:'coach', home_surface:'form', program_name:'Strength & Physique' };
const source = strengthFallbackSource(adrian);
ok(source?.source === '/plans/adrian-developed-runner-2026/program.json', 'Adrian resolves canonical 2026 source');
ok(source?.overview === '/plans/adrian-developed-runner-2026/', 'Adrian resolves canonical season overview');
ok(strengthFallbackSource(rod) === null, 'Other strength athletes do not inherit Adrian fallback');

ok(program.season_id === 'adrian_developed_runner_2026', 'season id preserved');\nok(program.authority?.system === 'FORM Athlete System', 'FORM Athlete System owns prescription authority');\nok(program.duration_weeks === 16, 'fallback-compatible season duration is present');
ok(program.legacy_forge_program_id === 'adrian_runner_mass_phase1_v1', 'legacy Forge id preserved for receipt continuity');
ok(program.weeks.length === 16, 'season is authored through year end');
ok(program.phases.length === 5, 'five season phases authored');
ok(program.weeks.at(-1).end_date === '2026-12-31', 'season closes on December 31');

const w2 = resolvedStrengthWeek(program, 2);
ok(w2.days.length === 4, 'Week 2 keeps four strength slots');
ok(w2.days[0].exercises.some(x => x.name === 'Low-to-High Cable Fly'), 'Week 2 uses cable chest work');
ok(w2.days[1].exercises.some(x => x.name === 'Cable Hip Adduction'), 'Week 2 redirects to medial thigh');
ok(w2.days[3].exercises.find(x => x.name === 'Hip Thrust')?.sets === 2, 'glute work moves to maintenance');

const w3 = resolvedStrengthWeek(program, 3);
ok(w3.days[0].exercises.some(x => x.name === 'Incline Dumbbell Bench Press'), 'Week 3 confirms redirected menu');

const w9 = resolvedStrengthWeek(program, 9);
ok(w9.days.length === 3, '10K race week trims strength frequency');
ok(w9.days.some(d => d.title === 'Lower Primer'), '10K race week uses a lower primer');
ok(!w9.days.some(d => d.weekday === 'Sunday'), '10K race day has no lower lift');

const w12 = resolvedStrengthWeek(program, 12);
ok(w12.days.length === 3, 'half race week trims strength frequency');
ok(!w12.days.some(d => d.weekday === 'Sunday'), 'half race day has no lower lift');

const w16 = resolvedStrengthWeek(program, 16);
ok(w16.days.length === 2, 'year-end closeout has two low-fatigue sessions');

const workspace = read('athlete/workspace.js');
for (const phrase of [
  'Your development season is here.',
  'does not infer your current Forge week',
  'Position is not inferred from this page.',
  'does not move Forge',
  'No Forge history has reached this account yet.',
  'web-delivered work is not backfilled as a Forge receipt',
  'does not claim Forge receipt delivery',
  'Record in Forge',
  'Open the 2026 plan →',
]) has(workspace, phrase);
lacks(workspace, '>Synced<');
lacks(workspace, '>Connected<');

const athleteJs = read('athlete/athlete.js');
has(athleteJs,'loadStrengthFallback');
has(athleteJs,'fallbackWeek');
has(athleteJs,'no current Forge week is inferred');
has(athleteJs,'data-fallback-week-step');
lacks(athleteJs,'fileSession');

const handoff = read('plans/adrian-runner-mass-phase-01/FORGE_HANDOFF.md');
has(handoff,'Prescription authority');
has(handoff,'Do not independently author a second Adrian progression');\nhas(handoff,'normal FORM Athlete System assignment/feed path');
has(handoff,'Installed-device acceptance');

console.log(`PASS: ${checks} Adrian developed-runner checks`);
