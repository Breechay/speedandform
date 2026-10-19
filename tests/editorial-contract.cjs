'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {scanHtml,findPublicHtml} = require('../scripts/check-editorial-contract.cjs');
const read = p => fs.readFileSync(p, 'utf8');

const expected = [
  ['AGENTS.md', 'Present the evidence. Don\'t narrate the presentation.'],
  ['docs/BRAND.md', 'Present the evidence. Don\'t narrate the presentation.'],
  ['docs/editorial/PUBLICATION_CONTRACT.md', 'Present the evidence. Don\'t narrate the presentation.'],
  ['docs/marketing/ATHLETE_LANGUAGE_RULE.md', 'Present the evidence. Don\'t narrate the presentation.'],
  ['.cursor/rules/form-speedandform-context.mdc', 'Present the evidence. Don\'t narrate the presentation.'],
  ['brand/index.html', 'Present the evidence. Don’t narrate the presentation.'],
];
for (const [file,phrase] of expected) assert.ok(read(file).includes(phrase), 'Publication rule missing in '+file);

const doc = text => '<!doctype html><html><head><title>FORM Study</title><meta name="description" content="A real training question."></head><body>'+text+'</body></html>';
assert.equal(scanHtml(doc('<h1>José · Oct 13</h1><p>20 minutes at 6:06/mi, athlete reported.</p><a href="#source">Reports &amp; splits</a>'), 'fixture.html').length, 0);
assert.equal(scanHtml(doc('<p>Read the study archive for the original splits.</p>'), 'fixture.html').length, 0);
assert.ok(scanHtml(doc('<p>Full details remain one click away.</p>'), 'fixture.html').some(x=>x.rule==='ui.one-click-away'));
assert.ok(scanHtml(doc('<p>Session, experience, decision.</p>'), 'fixture.html').some(x=>x.rule==='ui.editorial-formula'));
assert.ok(scanHtml(doc('<p>Plan 03 · Method frozen. Inspect the plan.</p>'), 'fixture.html').length>=2);
const meta = '<html><head><meta content="See what the camera caught" property="og:description"></head><body><p>Clean content</p></body></html>';
assert.ok(scanHtml(meta,'fixture.html').some(x=>x.section==='og:description'), 'Share descriptions checked regardless of attribute order');
assert.equal(scanHtml(doc('<script>const x="one click away";</script><style>/* Method frozen */</style><p>Real evidence.</p>'), 'fixture.html').length,0,'Source-only text not treated as rendered copy');
// Current commercial/editorial decisions should not regress through generated copy.
assert.doesNotMatch(read('labs/index.html'), /Method frozen|Inspect the plan|href="\/plans\/marathon-durability\/"\s+target=/i, 'Retired method is not on the Labs plan shelf');
assert.doesNotMatch(read('plans/index.html'), /open marathon reference/i, 'Retired reference does not leak into share metadata');
const pages=findPublicHtml();
for (const path of ['index.html','brand/index.html','labs/speed-that-endures/index.html','labs/adrian-runner-mass/index.html','labs/rebuilt-athlete/index.html','labs/the-two-curves/index.html']) assert.ok(pages.includes(path), 'Must scan published study: '+path);
console.log('PASS: FORM publication contract is present in agent/brand rules and public-copy + metadata gate behaves as intended.');
