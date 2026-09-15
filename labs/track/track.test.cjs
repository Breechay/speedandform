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

// 4. Every set carries the rep target and both pace units, because athletes
//    enter the pace into a watch and some use miles while others use
//    kilometers. A set missing one of them is a set someone cannot run.
const paceLines = [...html.matchAll(/<span class="pace">([^<]*)<i>\/mi<\/i>[^<]*<i>\/km<\/i>/g)];
const setCount = (html.match(/<div class="std-set">/g) || []).length;
check(setCount === 26, `expected 26 sets, found ${setCount}`);
check(paceLines.length === setCount, `${setCount} sets but ${paceLines.length} carry both pace units`);

// 5. A pace band must be consistent with its own rep target: the band, applied
//    to the rep distance, has to land inside a few seconds of the target. This
//    is the check that catches a transcription slip or a bad conversion.
const MI = 1609.344;
const secs = (t) => (t.includes(':') ? t.split(':').reduce((m, s) => m * 60 + Number(s), 0) : Number(t));
const setRe = /<dt>(\d+) × (\d+) m<span class="rec">[^<]*<\/span><\/dt><dd>([\d:]+)[–-]([\d:]+)(?: sec)?<span class="pace">([\d:]+)[–-]([\d:]+) <i>\/mi<\/i> · ([\d:]+)[–-]([\d:]+) <i>\/km<\/i>/g;
let parsed = 0;
for (const m of html.matchAll(setRe)) {
  parsed += 1;
  const dist = Number(m[2]);
  const [tLo, tHi] = [secs(m[3]), secs(m[4])];
  const perMi = [secs(m[5]), secs(m[6])].map((p) => (p * dist) / MI);
  const perKm = [secs(m[7]), secs(m[8])].map((p) => (p * dist) / 1000);
  // The band may be tighter than the target range, but applied to the rep
  // distance it has to land near the target: within 3 seconds or 5 percent,
  // whichever is larger, which is transcription-rounding territory.
  //
  // Every set now reconciles. The 800 m and 150 m bands printed on the source
  // sheets did not, and were corrected to follow their own rep target, because
  // master brief 6.2 makes the rep time the standard and the pace equivalent a
  // derived reading aid. There is no exception left in this check.
  const slack = Math.max(3, 0.05 * tLo);
  for (const [label, impl] of [['per mile', perMi], ['per km', perKm]]) {
    check(impl[0] >= tLo - slack && impl[0] <= tHi + slack
       && impl[1] >= tLo - slack && impl[1] <= tHi + slack,
      `${dist} m: ${label} band implies ${impl[0].toFixed(1)} to ${impl[1].toFixed(1)} sec, target is ${m[3]}-${m[4]}`);
  }
  // The two units must agree with each other.
  check(Math.abs(perMi[0] - perKm[0]) < 1.5 && Math.abs(perMi[1] - perKm[1]) < 1.5,
    `${dist} m: the per-mile and per-kilometer bands disagree`);
}
check(parsed === setCount, `parsed ${parsed} of ${setCount} sets for the pace check`);

// 6. Master brief section 6 and 7 rules that are easy to lose in an edit.
//    Time trials are four; Yasso 800s is an authored session with its own
//    evidence, not a trial. And a fixed target means faster is also outside.
const trialRungs = [...html.matchAll(/<section class="lesson" id="trials">([\s\S]*?)<\/section>/g)]
  .map((m) => (m[1].match(/<div class="rung">/g) || []).length)[0];
check(trialRungs === 4, `expected 4 time trials, found ${trialRungs}`);
check(/<b>4<\/b> time trials/.test(html), 'the hero does not say 4 time trials');
check(/Yasso 800s is not a time trial/.test(html), 'Yasso 800s is not marked as a session rather than a trial');
check(/47\.8 is also outside it/.test(html), 'the page does not say that faster than target is outside the standard');
check(/the authored recovery/.test(html), 'ESTABLISHED does not mention the authored recovery condition');
check(/The target does not move to meet the athlete/.test(html), 'the core law is missing');
check(/first extend the uninterrupted hold, then add total volume/.test(html), 'the threshold ordering claim is not stated');

// 7. The page must not claim a capability the app does not have. This page is
//     partly a design intent and partly authored work that exists today, and
//     the first version shipped with the intent written in the present tense:
//     "Sign in to save the mark" promised a surface that is not built. Anything
//     an athlete could read as an available feature has to be true.
const falseClaims = [
  'Sign in to save',
  'Nothing is gated behind an account',
  'keep the result',
  'It is filed as standalone',
  'Every attempt stays',
  'Your marks are one list',
  'Marks are yours. Track does not',
  'Your history comes with you',
];
for (const claim of falseClaims) {
  check(!html.includes(claim), `claims a capability the app does not have: "${claim}"`);
}
// The intent sections have to say they are intent, in the reader's path.
check((html.match(/class="state-note"/g) || []).length >= 2,
  'the unbuilt parts are not labelled as intent');
check(/not built yet/.test(html), 'the page does not say plainly that the room is not built yet');
check(/None of it is shipped/.test(html), 'the intent section does not say it is unshipped');

// 8. No athlete other than the coach is named. The source sheets are per athlete.
for (const n of ['Bobby', 'Tinius', 'Sam', 'Erik', 'Breechay']) {
  check(!new RegExp(`\\b${n}\\b`).test(html), `athlete name "${n}" appears on a public page`);
}

// 9. House style: American spelling, no em dashes.
check(!/—/.test(html), 'em dash in copy');
check(!/practise|kilometre|colour|centre\b/.test(html), 'British spelling in copy');

// 10. Shell requirements.
check(/<title>[^<]+<\/title>/.test(html), 'missing title');
check(/rel="canonical"/.test(html), 'missing canonical');
check(/<h1>/.test(html), 'missing h1');
check((html.match(/<h1>/g) || []).length === 1, 'more than one h1');
check(/prefers-reduced-motion/.test(html), 'missing reduced-motion handling');
check(/@media print/.test(html), 'missing print styles');
check(!/<script(?! type="application\/ld\+json")/.test(html), 'unexpected script on a static page');

// 11. The page is registered where readers find it.
const root = path.join(__dirname, '..', '..');
check(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('/labs/track/'), 'not in sitemap.xml');
check(fs.readFileSync(path.join(root, 'labs', 'index.html'), 'utf8').includes('/labs/track/'), 'not linked from the Labs index');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`PASS  ${cards.length} standards, ${setCount} sets with both pace units all reconciling, ${new Set(fragments).size} fragments, 0 findings`);
