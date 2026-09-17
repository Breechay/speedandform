'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const html = fs.readFileSync('index.html', 'utf8');
const changes = [];
assert.equal((html.match(/<h1>Run<br>Development<\/h1>/g) || []).length, 1);
assert.equal((html.match(/class="hero-benefit">Run better.<\/strong>/g) || []).length, 1);
assert.equal((html.match(/<strong>8 weeks · \$1,200<\/strong>/g) || []).length, 1);
assert.doesNotMatch(html, /hero-kicker/);
assert.doesNotMatch(html, /hero-reassurance/);
assert.doesNotMatch(html, /first Miami track assessment is complimentary/i);
assert.ok(html.indexOf('id="inquiry-reassurance"') < html.indexOf('class="questionnaire"'), 'Reassurance must precede the inquiry');
assert.match(html, /<h1>Run<br>Development<\/h1>/);
assert.match(html, /class="hero-benefit">Run better\.<\/strong>/);
assert.match(html, /<div class="offer"><strong>8 weeks · \$1,200<\/strong><\/div>/);
assert.match(html, /<dt>Plan<\/dt><dd>Your week\.<\/dd>/);
assert.match(html, /<dt>Practice<\/dt><dd>Weekly track\.<\/dd>/);
assert.match(html, /<dt>Adjust<\/dt><dd>As you develop\.<\/dd>/);
assert.match(html, /assets\/home\/practice\/coaching-track\.webp/);
assert.doesNotMatch(html, /id="analysisVideo"/);
assert.match(html, /data-coaching="remote">Discuss remote coaching/);
// Release-scoped proof: every inline script, media URL, metadata field, field
// option and mailto fallback field is preserved. Only one final LF may differ.
// A local display/line-height override preserves the new reassurance below 360px.
if (process.env.FORM_COPY_BASELINE) {
  const base = process.env.FORM_COPY_BASELINE;
  assert.match(base, /^[a-f0-9]{40}$/);
  let expected = cp.execFileSync('git', ['show', base + ':index.html'], {encoding:'utf8'});
  for (const [from,to] of changes) {
    assert.equal(expected.split(from).length, 2);
    expected = expected.replace(from,to);
  }
  const finalLF = value => value.endsWith('\n') ? value : value + '\n';
  assert.equal(finalLF(html), finalLF(expected), 'Only the approved copy patch and reassurance visibility are allowed');
  for (const path of ['css/homepage.css','css/coaching-choice.css','js/coaching-measurement.js','js/coaching-choice.js','js/homepage-motion.js']) {
    assert.equal(fs.readFileSync(path,'utf8'), cp.execFileSync('git',['show',base+':'+path],{encoding:'utf8'}), path+' must stay unchanged');
  }
}
console.log('PASS: exact coaching copy, early inquiry reassurance, unchanged offer/remote path; release baseline preservation checked when configured.');
