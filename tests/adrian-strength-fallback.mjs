import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const program = JSON.parse(read('plans/adrian-runner-mass-phase-01/program.json'));
const { strengthFallbackSource, resolvedStrengthWeek } = await import(pathToFileURL(new URL('athlete/strength-fallback.js', root).pathname));
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

const workspace = read('athlete/workspace.js');
for (const phrase of [
  'Your three-week plan is here.',
  'does not infer your current Forge week',
  'Position is not inferred from this page.',
  'does not move Forge',
  'No Forge history has reached this account yet.',
  'web-delivered work is not backfilled as a Forge receipt',
  'does not claim Forge receipt delivery',
  'Record in Forge',
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
has(handoff,'no fake Forge receipts are created');
has(handoff,'actual current week/day');
has(handoff,'Installed-device acceptance passes before Brice tells Adrian to switch from the web plan.');

console.log(`PASS: ${checks} Adrian strength fallback checks`);
