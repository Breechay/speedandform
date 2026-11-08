'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const page = read('sleep.html');
const css = read('css/sleep-education.css');
const catalog = require('../scripts/discovery-catalog.cjs');
const {rank} = require('../js/discovery-search.js');

assert.match(page, /<link rel="canonical" href="https:\/\/speedandform\.com\/sleep">/);
assert.match(page, /name="description" content="[^"]*REM[^"]*deep[^"]*muscle growth/i);
assert.match(page, /<h1>Sleep is part<br>of the workout\.<\/h1>/);
for (const id of ['stages','running','strength','people','experiments','sources']) {
  assert.match(page, new RegExp('id="' + id + '"'));
}
assert.equal((page.match(/<details class="sleep-experiment"/g) || []).length, 6);
assert.match(page, /Pattern only, not a measured night/);
assert.match(page, /Neither hormone can be read from a watch/);
assert.match(page, /CBT-I/);
assert.doesNotMatch(page, /2h 24m|50m|8h 16m|sleep score of 87|Brice's sleep/i);
assert.match(css, /@media \(max-width:520px\)/);
assert.match(css, /@media print/);
assert.match(css, /prefers-reduced-motion/);
const structured = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(structured, 'Article structured data exists');
const article = JSON.parse(structured[1]);
assert.equal(article['@type'], 'Article');
assert.equal(article.mainEntityOfPage, 'https://speedandform.com/sleep');
assert.equal(catalog.entries.filter(e => e.url === '/sleep').length, 1);
for (const q of [
  'what is rem sleep',
  'does sleep help build muscle',
  'sleep hygiene for athletes',
  'why does sleep affect testosterone',
  'how does sleep affect relationships'
]) {
  assert.equal(rank(catalog.entries, q)[0]?.url, '/sleep', 'sleep is first result for: ' + q);
}
console.log('Sleep education: article, privacy, stages, experiments, SEO and search routes pass.');
