'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const html = fs.readFileSync('index.html', 'utf8');
const changes = [
  ['<body>', '<body data-coaching-copy="20260917-coaching-clarity">'],
  ['For your next race, stronger running for HYROX, or simply more ease and endurance. Individual coaching built around you.', 'I watch you run, build your plan, and coach you through it. Weekly track coaching in Miami, with adjustments as you develop.'],
  ['<span>Start with a conversation.</span>', '<span class="hero-reassurance">Your first Miami track assessment is complimentary.<br>Start with a conversation.</span>'],
  ['      <p>Tell me about your running and what you want to change. I read every inquiry myself.</p>', '      <p>Tell me about your running and what you want to change. I read every inquiry myself.</p>\n      <p class="review-note" id="inquiry-reassurance">An inquiry only. No payment or booking yet.</p>']
];
for (const [, text] of changes) assert.equal(html.split(text).length, 2, 'Approved copy must occur once');
assert.ok(html.indexOf('id="inquiry-reassurance"') < html.indexOf('class="questionnaire"'), 'Reassurance must precede the inquiry');
assert.match(html, /<h1>Run<br>Development<\/h1>/);
assert.match(html, /class="hero-benefit">Run better\. Get faster\. Run farther\./);
assert.match(html, /<small>Miami coaching<\/small><strong>8 weeks · \$1,200<\/strong>/);
assert.match(html, /data-coaching="remote">Discuss remote coaching/);
assert.match(html, /class="hero-kicker eyebrow">Running coaching with Brice · Miami \+ Remote/);
// Release-scoped proof: no accidental changes elsewhere, including every inline
// script, media URL, metadata field, field option and mailto fallback field.
if (process.env.FORM_COPY_BASELINE) {
  const base = process.env.FORM_COPY_BASELINE;
  assert.match(base, /^[a-f0-9]{40}$/);
  let expected = cp.execFileSync('git', ['show', base + ':index.html'], {encoding:'utf8'});
  for (const [from,to] of changes) {
    assert.equal(expected.split(from).length, 2);
    expected = expected.replace(from,to);
  }
  assert.equal(html, expected, 'Only the approved copy patch is allowed');
  for (const path of ['css/homepage.css','css/coaching-choice.css','js/coaching-measurement.js','js/coaching-choice.js','js/homepage-motion.js']) {
    assert.equal(fs.readFileSync(path,'utf8'), cp.execFileSync('git',['show',base+':'+path],{encoding:'utf8'}), path+' must stay unchanged');
  }
}
console.log('PASS: exact coaching copy, early inquiry reassurance, unchanged offer/remote path; release baseline preservation checked when configured.');
