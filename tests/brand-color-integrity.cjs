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
for (const token of ['#0B0B0B', '#1A1A1A', '#F4F2EC']) {
  assert.ok(brand.includes(token), 'Brand page includes current palette token ' + token);
}
assert.match(brand, /True monochrome or natural full color/);
assert.doesNotMatch(brand, /Strength keeps bronze inside the app|Running has its own lime/);
assert.doesNotMatch(brand, /bk-not-lime|#c9ff36/i, 'No neon/bronze demonstration on the approved Brand page');
assert.doesNotMatch(read('css/brand.css'), /#c9ff36/i, 'Brand CSS contains no retired lime mark');
const photos = read('photos/index.html');
const nav = photos.match(/<nav class="photos-nav(?: [^"]*)?"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
assert.equal((nav.match(/href="\/runs\/"/g) || []).length, 1, 'Photos nav: one Runs destination');
const runs = read('runs/index.html'), runCode = read('js/group-runs.js');
assert.match(runs, /id="gr-hero-action"[^>]*>Run details/);
assert.match(runCode, /heroAction\.firstChild\.textContent = upcoming\.length/);
const home = read('index.html');
assert.match(home, /<a class="home-footer-emblem[^>]*><img[^>]*src="\/assets\/brand\/kit\/emblem\/sf-emblem-bone\.svg"/, 'The actual footer mark survives the production brand builder');
assert.ok(home.includes('href="/athletes/"'), 'Athletes remains available through the shared menu');
assert.doesNotMatch(home.match(/<div class="home-hero-actions"[\s\S]*?<\/div>/)?.[0] || '', /\/athletes\//, 'Athletes do not occupy the homepage primary entrance');
assert.match(read('css/home-bend-seam.css'), /margin-top:calc\(-1 \* clamp\(/, 'Bend begins inside the opening viewport');
const rules = read('docs/design/FORM_CINEMATIC_WEB_DIRECTION_2026-10-19.md');
assert.match(rules, /Color integrity/);
assert.match(rules, /native Running and Strength apps are a separate pass/i);
// Source-of-truth navigation, not the compiled copy in each page.
const menuSource = read('scripts/site-menu-panel.html');
for (const route of ['/athletes/', '/runs/', '/photos/']) {
  assert.equal((menuSource.match(new RegExp('href="' + route + '"', 'g')) || []).length, 1,
    'Menu has exactly one destination for ' + route);
}
assert.doesNotMatch(menuSource, /sf-menu-together|>The Team</, 'No duplicate Team group');
const photoFrames = [...photos.matchAll(/<figure class="photo-frame(?: photo-sequence-\\d)?" data-search="([^" ]+)/g)];
const photoIds = photoFrames.map(match => match[1]);
const catalogue = JSON.parse(read('media/library/library.json'));
assert.equal(photoFrames.length, catalogue.photos.length, 'Every public library photograph appears exactly once');
assert.equal(new Set(photoIds).size, photoIds.length, 'No duplicate public gallery photograph');
for (const id of [
  'track-curve-group', 'bridge-profile', 'bw-lead-runner', 'two-on-the-lanes', 'bench-after-reps',
  'after-practice-conversation', 'track-solo-away', 'track-runner-profile-orange',
  'terrace-after-practice-two', 'bw-track-standing-after'
]) assert.ok(photoIds.includes(id), 'Preserve original and new photos: ' + id);
assert.match(read('js/photos-gallery.js'), /getRandomValues/, 'Gallery order rotates on reopening');
assert.match(photos, /id="photo-viewer"/, 'Full-screen viewer remains present');
assert.match(read('css/home-world.css'), /\.home-world-sheet img\{[^}]*filter:none/);
assert.match(read('css/home-editorial-continuation.css'), /\.home-world-featured \.home-world-sheet img\{[^}]*filter:none/);
assert.doesNotMatch(home, /home-world-lanes|home-world-aperture/, 'One measured bend only');
assert.doesNotMatch(brand, /#(?:10161A|1B242B|9CB5C7|42627B)/i, 'No retired blue-black or steel palette in Brand page');
const palette = read('css/home-commercial.css');
assert.match(palette, /--dark:#0B0B0B;--backdrop:#0B0B0B/, 'Neutral ink owns the public homepage');
const runCSS = read('css/runs-editorial.css');
assert.match(runCSS, /background:#1A1A1A;border:1px solid rgba\(241,239,232,\.18\)/, 'Runs surfaces use neutral graphite with a visible boundary');
assert.doesNotMatch(photos, /\.photos-search\{/, 'Legacy search input style retired');
console.log('PASS: natural/full-monochrome imagery, current Brand tokens, no duplicate Photos destination, live Runs CTA and scope rules');
