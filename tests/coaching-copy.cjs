// Current copy contract. September 30 explicitly replaces the earlier hero freeze.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
for(const phrase of ['Run better.<br>Feel stronger','I’m Brice.','Find your coaching','Running &amp; strength coaching','I develop<br>runners.','I look for ease.','Change what matters most.','Repeat it until it belongs to you.','Tell me about<br>your running.']) assert.ok(html.includes(phrase),phrase);
for(const href of ['/coaching/miami/','/coaching/strength/','/analysis/','/plans/','/work/']) assert.ok(html.includes('href="'+href+'"'),href);
assert.match(html,/Run \+ Strength · \$1,800 \/ 8 weeks/);
assert.match(html,/\$1,200/);
assert.doesNotMatch(html,/href="\/the-method">Read the method/);
assert.doesNotMatch(html,/guaranteed results|injury-proof|universal perfect form/i);
console.log('PASS: personal first fold, distinct commercial paths, existing prices and selective coaching voice.');
