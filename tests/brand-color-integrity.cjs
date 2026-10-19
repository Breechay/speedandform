'use strict';
// Owner-approved visual rule: photography is natural full color or true B&W.
// Static guard only; rendered desktop and device QA is still required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');
const photographicSources = [
  'index.html',
  'brand/index.html',
  'photos/index.html',
  'runs/index.html',
  'plans/index.html',
  'coaching/miami/index.html',
  'track/index.html',
  'css/brand.css',
  'css/people.css',
  'css/runs-editorial.css',
  'css/photos-editorial.css',
  'css/sf-menu.css',
  'css/home-editorial-continuation.css',
  'css/home-bend-seam.css',
  'css/home-world.css',
  'css/home-hero-carousel.css',
];
for (const file of photographicSources) {
  const body = read(file);
  for (const match of body.matchAll(/grayscale\(\s*([0-9]*\.?[0-9]+)\s*\)/g)) {
    const amount = Number(match[1]);
    assert.ok(amount === 0 || amount === 1,
      file + ': partial grayscale is not permitted (' + match[0] + ')');
  }
  assert.doesNotMatch(body, /(?:saturate|sepia)\(\s*[\d.]+\s*\)/i,
    file + ': no saturation or sepia grading');
}
const brand = read('brand/index.html');
for (const token of ['#10161A', '#1B242B', '#EEEDE8', '#F1EFE8', '#9CB5C7']) {
  assert.ok(brand.includes(token), 'Brand page includes current palette token ' + token);
}
assert.match(brand, /True monochrome or natural full color/);
assert.doesNotMatch(brand, /Strength keeps bronze inside the app|Running has its own lime/);
const photos = read('photos/index.html');
const nav = photos.match(/<nav class="photos-nav(?: [^"]*)?"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
assert.equal((nav.match(/href="\/runs\/"/g) || []).length, 1, 'Photos nav: one Runs destination');
const runs = read('runs/index.html'), runCode = read('js/group-runs.js');
assert.match(runs, /id="gr-hero-action"[^>]*>Run details/);
assert.match(runCode, /heroAction\.firstChild\.textContent = upcoming\.length/);
const home = read('index.html');
assert.match(home, /href="\/athletes\/"[^>]*>Meet the athletes/);
const rules = read('docs/design/FORM_CINEMATIC_WEB_DIRECTION_2026-10-19.md');
assert.match(rules, /Color integrity/);
assert.match(rules, /native Running and Strength apps are a separate pass/i);
console.log('PASS: natural/full-monochrome imagery, current Brand tokens, no duplicate Photos destination, live Runs CTA and scope rules');
