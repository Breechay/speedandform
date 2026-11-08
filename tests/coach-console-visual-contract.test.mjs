import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const coach = read('coach/coach.js');
const shared = read('coach/workspace-light.css');
const miami = read('coach/miami/index.html');
const miamiClient = read('coach/miami/miami.js');

test('roster remains legible when the coach has many athletes', () => {
  assert.match(coach, /id="athleteQuickFind" type="search"/);
  assert.match(coach, /rosterQuery\.trim\(\)/);
  assert.match(read('private/graphite.css'), /flex: 0 0 auto; min-width: 132px/);
});

test('week navigator is a compact index, not a full workout prescription', () => {
  assert.match(coach, /runwaySummary/);
  assert.match(coach, /runwayContext/);
  assert.match(read('private/graphite.css'), /-webkit-line-clamp: 2/);
});

test('long mixed sessions cannot escape the week row or collide with the inspector', () => {
  const css = read('private/graphite.css');
  assert.match(coach, /const weekSummary = works\.length > 1 \? `\$\{works\.length\} parts` : shortLine/);
  assert.match(coach, /escapeHtml\(dose\.weekSummary\)/);
  assert.match(coach, /escapeHtml\(sessionReadingTitle\(version\)\)/);
  const doseSource = coach.match(/function doseOf\(version\) \{[\s\S]*?\n\}\n\n\/\/ The runway/)?.[0]
    .replace(/\n\n\/\/ The runway$/, '');
  assert.ok(doseSource, 'dose formatter is available for direct regression testing');
  const doseOf = new Function('workMagnitude', 'sessionTotalLabel', 'structureOf', 'selectedRecord',
    `${doseSource}; return doseOf;`)(
    (part) => `${part.distance} ${part.distance_unit}`,
    () => null,
    () => '1 × 1 km @ 5:38–5:46 / 2 min jog → 1 × 600 m @ 5:22–5:30 / 1:30 easy → 1 × 400 m',
    { primaryMark: null }
  );
  const mixed = doseOf({ components: [
    { role: 'work', shape: 'repetitions', repeat_count: 1, distance: 1, distance_unit: 'km', pace_low: '5:38', pace_high: '5:46', recovery_seconds: 120, recovery_kind: 'jog' },
    { role: 'work', shape: 'repetitions', repeat_count: 1, distance: 600, distance_unit: 'm' },
    { role: 'work', shape: 'repetitions', repeat_count: 1, distance: 400, distance_unit: 'm' }
  ] });
  assert.equal(mixed.weekSummary, '3 parts');
  assert.match(mixed.shortLine, /1 × 1 km @ 5:38/,
    'the complete source prescription remains available to the inspector');
  assert.equal(mixed.shortQualifiers, '5:38–5:46/km · 2:00 jog',
    'the week index does not repeat the complete multi-part anatomy');
  assert.match(css, /\.consoleWorkbench \{\s*display: grid; grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, \.85fr\)/);
  assert.match(css, /\.consoleWorkRow__what \{[^}]*overflow-wrap: anywhere/s);
  assert.doesNotMatch(css.match(/\.consoleWorkRow__what \{([^}]*)\}/)?.[1] || '', /white-space: nowrap|text-overflow: ellipsis/);
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\.consoleWorkbench \{ grid-template-columns: minmax\(0, 1fr\)/);
});

test('an interval transcript stays in structured details, not a giant week title', async () => {
  const { sessionReadingTitle } = await import('../private/render.js');
  const components = [{ role: 'work' }, { role: 'work' }, { role: 'work' }];
  const transcript = '1 × 1 km @ 5:38–5:46 / 2 min jog → 1 × 600 m @ 5:22–5:30 / 1:30 easy → 1 × 400 m';
  assert.equal(sessionReadingTitle({ title: transcript, components }), 'Interval session');
  assert.equal(sessionReadingTitle({ title: 'Descending aerobic ladder', components }), 'Descending aerobic ladder');
  assert.equal(sessionReadingTitle({ title: '4 mi easy', components: [{ role: 'work' }] }), '4 mi easy');
  const labs = read('coach/labs/labs.js');
  assert.match(labs, /const title = sessionReadingTitle\(version\)/);
  assert.match(coach, /sourceWasSequence \? `<p class="ins-detail">/,
    'completed sessions keep their exact work visible when the heading is shortened');
  assert.match(coach, /dose && !multipleWorkParts \? `<p class="ins-dose">/,
    'a selected interval session does not print its full transcript twice above the anatomy');
});

test('same-name athletes stay identifiable in both coach rosters and headings', async () => {
  const { coachRosterLabel } = await import('../private/render.js');
  const people = [
    { first_name: 'Sam', display_name: 'Sam Jordan', slug: 'sam-jordan' },
    { first_name: 'Sam', display_name: 'Sam Morris', slug: 'sam-morris' },
    { first_name: 'Tyler', display_name: 'Tyler', slug: 'tyler' },
    { first_name: 'Tyler', display_name: 'Tyler', slug: 'tyler-odwin' },
    { first_name: 'Hope', display_name: 'Hope Williams', slug: 'hope' }
  ];
  assert.equal(coachRosterLabel(people[0], people), 'Sam Jordan');
  assert.equal(coachRosterLabel(people[1], people), 'Sam Morris');
  assert.equal(coachRosterLabel(people[3], people), 'Tyler Odwin');
  assert.equal(coachRosterLabel(people[4], people), 'Hope');
  assert.match(coach, /consoleAthleteTab__name">\$\{escapeHtml\(coachRosterLabel\(athlete, roster\)\)\}/);
  assert.match(read('coach/labs/labs.js'), /escapeHtml\(coachRosterLabel\(entry, bench\)\)/);
});

test('filing counts do not leave a dangling double marker', () => {
  assert.match(coach, /results filed/);
  assert.doesNotMatch(coach, /Double \\u00b7 \$\{escapeHtml\(ordinalIn\(session\) \|\| ''\)\}/);
});

test('coach surfaces give prose room and remove decorative card stacking', () => {
  const group = read('coach/miami/index.html');
  const ops = read('coach/ops/console.css');
  const run = read('coach/runs/attendance.js');
  const runCss = read('coach/runs/runs.css');
  assert.match(group, /WHAT WE ARE DOING<textarea name="intent"[^>]*rows="2"/);
  assert.match(group, /SETUP \/ CUES<textarea name="details"[^>]*rows="3"/);
  assert.match(shared, /\.coach-page--athletes \.ccCard \{\s*background: transparent;/);
  assert.match(shared, /\.coach-page--programming \.consoleHero__name \{[^}]*text-transform: none;/s);
  assert.match(shared, /@media \(max-width: 760px\) \{[\s\S]*?\.coach-page--programming \.consoleHero \{\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(ops, /\.day-heading h1\{font-size:clamp\(27px,3\.2vw,38px\)/);
  assert.match(run, /<details class="attActions"><summary aria-label="Manage/);
  assert.match(runCss, /\.attActions\[open\] \.rowActs\{/);
});

test('selected session keeps readable, contained text and distinct actions', () => {
  assert.match(shared, /\.coach-page--programming \.ins-what \{[^}]*text-transform: none;[^}]*overflow-wrap: anywhere/s);
  assert.match(shared, /\.coach-page--programming \.ins-detail,[\s\S]*?font-size: 16px/);
  assert.match(shared, /\.coach-page--programming \.ins-actions button \{[^}]*min-height: 42px/s);
  assert.match(shared, /\.coach-page--programming \.ins-actions button\[data-file\]/);
});

test('group editor uses shared readable fields without white review cards', () => {
  assert.match(shared, /--coach-editor-font-size: 16px/);
  assert.match(shared, /\.coach-page--programming \.dialog \.field-input/);
  assert.match(shared, /\.coach-page--miami \.story \{\s*display: grid/);
  assert.match(shared, /background: transparent; border: 0; border-top: 1px solid var\(--coach-line\)/);
});

test('meetup shows useful details, with published-run selection disclosed when needed', () => {
  assert.doesNotMatch(miami, /Meet when we meet|One session\.<br>/);
  assert.match(miami, /<h2>Meetup<\/h2>/);
  assert.match(miami, /id="runLinkControls"/);
  assert.match(miamiClient, /<dl class="meetingFacts">/);
  assert.match(miamiClient, /\$\('runLinkControls'\)\.open = !r/);
});
