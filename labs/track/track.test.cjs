'use strict';
// Static validation for /labs/track/. No network, no browser.
// Guards the two errors this page can make silently: a fragment link with no
// destination, and a stated rep count that does not match the sets above it.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

// 1. Every in-page fragment link resolves to an id on the page.
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const fragments = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
check(fragments.length > 0, 'expected in-page navigation');
for (const f of new Set(fragments)) {
  check(ids.has(f), `fragment #${f} has no destination`);
}

// 2. Section ids are unique.
const idList = [...html.matchAll(/<section class="lesson" id="([^"]+)"/g)].map((m) => m[1]);
check(new Set(idList).size === idList.length, 'duplicate section id');

// 3. Each standard's stated rep count equals the sum of its sets.
const cards = [...html.matchAll(/<article class="std">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
check(cards.length === 6, `expected 6 standards, found ${cards.length}`);
for (const card of cards) {
  const name = (card.match(/<h3>([^<]+)<\/h3>/) || [, '?'])[1];
  const reps = [...card.matchAll(/<dt>(\d+)\s*×\s*\d+\s*m/g)].map((m) => Number(m[1]));
  const stated = card.match(/Scored out of <b>(\d+)<\/b> reps/);
  check(reps.length > 0, `${name}: no sets parsed`);
  check(Boolean(stated), `${name}: no stated rep count`);
  if (stated) {
    const sum = reps.reduce((a, b) => a + b, 0);
    check(sum === Number(stated[1]), `${name}: sets sum to ${sum}, page states ${stated[1]}`);
  }
}

// 4. No per-mile or per-kilometer pace is asserted. The source sheets carry
//    conversions that do not reconcile with their own rep targets; publishing a
//    pace column is a deliberate decision for Brice, not a silent addition.
check(!/\/mi\b|min\/mile|per mile pace|\/km\b/.test(html), 'a pace conversion was published');

// 5. No athlete other than the coach is named. The source sheets are per athlete.
for (const n of ['Bobby', 'Tinius', 'Sam', 'Erik', 'Breechay']) {
  check(!new RegExp(`\\b${n}\\b`).test(html), `athlete name "${n}" appears on a public page`);
}

// 6. House style: American spelling, no em dashes.
check(!/—/.test(html), 'em dash in copy');
check(!/practise|kilometre|colour|centre\b/.test(html), 'British spelling in copy');

// 7. Shell requirements.
check(/<title>[^<]+<\/title>/.test(html), 'missing title');
check(/rel="canonical"/.test(html), 'missing canonical');
check(/<h1>/.test(html), 'missing h1');
check((html.match(/<h1>/g) || []).length === 1, 'more than one h1');
check(/prefers-reduced-motion/.test(html), 'missing reduced-motion handling');
check(/@media print/.test(html), 'missing print styles');
check(!/<script(?! type="application\/ld\+json")/.test(html), 'unexpected script on a static page');

// 8. The page is registered where readers find it.
const root = path.join(__dirname, '..', '..');
check(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('/labs/track/'), 'not in sitemap.xml');
check(fs.readFileSync(path.join(root, 'labs', 'index.html'), 'utf8').includes('/labs/track/'), 'not linked from the Labs index');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`PASS  ${cards.length} standards, ${new Set(fragments).size} fragments, 0 findings`);
