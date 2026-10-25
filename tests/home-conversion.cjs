/* Regression contract for the homepage orientation and the application routes.
 * Layout requires a rendered browser acceptance pass before publication. */
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const home = read('index.html');
const homeCss = read('css/home-orientation.css');
const heroCss = read('css/home-bend-seam.css');
const apply = read('coaching/apply/index.html');
const choice = read('js/coaching-choice.js');
const choiceCss = read('css/coaching-choice.css');

assert.match(home, /<section class="home-introduction" aria-labelledby="home-introduction-title">/);
assert.match(home, /<h2 id="home-introduction-title">I'm Brice\.<\/h2>/);
assert.match(home, /brice-owner-1021\.webp" alt="Brice standing beside the track/);
for (const path of ['/coaching/miami/', '/coaching/strength/', '/plans/', '/thursday', '/form/', '/forge-sculpt/']) {
  assert.ok(home.includes(`href="${path}"`), `Homepage offer links to ${path}`);
}
assert.match(homeCss, /@media\(max-width:760px\)/);
assert.match(heroCss, /@media\(max-width:760px\) and \(max-height:740px\)\s*\{[\s\S]*?clamp\(105px,19svh,145px\)/);
assert.match(apply, /<select id="coachingChoice" data-choice-layout="cards">/);
assert.match(apply, /<option value="run">/);
assert.match(apply, /<option value="remote">/);
assert.match(choice, /input\.type = 'radio'/);
assert.match(choice, /input\.name = 'coaching-route'/);
assert.match(choice, /select\.dispatchEvent\(new Event\('change'/);
assert.match(choice, /select\.hidden = true/);
assert.match(choiceCss, /#coachingChoice\[data-choice-layout="cards"\]\[hidden\],\.coaching-select-label\[hidden\]\{display:none!important\}/);
assert.match(apply, /window\.sfSubmitInquiry\(inquiry\)/);
assert.match(apply, /receipt && receipt\.accepted === true/);
assert.match(apply, /selected === "remote"/);
console.log('PASS: homepage offer paths, short-phone CTA rule, visible coaching radios, native fallback and unchanged inquiry receipt.');
