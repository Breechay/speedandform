'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');

const method=fs.readFileSync('the-method.html','utf8');
const home=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('css/method.css','utf8');
const terms=fs.readFileSync('running-terms.html','utf8');

for(const phrase of [
  'Develop the runner.',
  'Hear the out-of-tune note.',
  'Change what matters most.',
  'Watch the next rep.',
  'Frequency teaches the body.',
  'Form is multiplied by every step.',
  'Coach the thinking underneath the running.',
  'The work should stay with you.',
  'Like a kite upon the wind.',
  'Reveal what wants to be set free.'
]) assert.ok(method.includes(phrase), 'method phrase: '+phrase);

assert.match(method,/data-form-reading="20260916"/);
assert.match(method,/href="\/css\/cream-reading\.css\?v=20260916"/);
assert.match(method,/href="\/css\/method\.css\?v=20260917-v1"/);
assert.match(method,/href="\/#begin">Work with Brice/);
assert.match(method,/href="\/running-form-errors"/);
assert.match(method,/href="\/training-week"/);
assert.match(method,/href="\/strength"/);
assert.match(method,/href="\/field-notes"/);
assert.doesNotMatch(method,/Flamingo Park|Hideout, Edgewater|5:50 AM|5:30 AM/);
assert.doesNotMatch(method,/Cormorant|Jost|fonts\.googleapis\.com/);
assert.doesNotMatch(method,/form is almost always the limiter|fix your form and you will get faster/i);
assert.ok((method.match(/<meta property="og:title"/g)||[]).length===1);
assert.ok((method.match(/<meta name="twitter:title"/g)||[]).length===1);

assert.match(home,/href="\/the-method">Read the method/);
assert.match(home,/Like a kite upon the wind\./);
assert.match(home,/Form is multiplied by every step\./);
assert.match(home,/Reveal what wants to be set free\./);
assert.doesNotMatch(home,/form is almost always the limiter|fix your form and you will get faster/i);

assert.match(css,/\.method-step/);
assert.match(css,/\.method-wind/);
assert.match(css,/\.method-principle-grid/);
assert.match(css,/@media\(max-width:600px\)/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(terms,/href="\/sleep">Sleep and training →<\/a>/);
assert.doesNotMatch(terms,/\/the-method#sleep/);

console.log('PASS: Run Development method architecture, evidence boundary, modern reading type and homepage handoff.');
