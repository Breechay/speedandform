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
