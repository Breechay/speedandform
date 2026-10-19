// Preserve the approved shorter public opening, authentic photography and real inquiry destination.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
const inquiry=fs.readFileSync('coaching/apply/index.html','utf8');
const menu=fs.readFileSync('scripts/site-menu-panel.html','utf8').trim();
for(const line of ['Run farther.<br>Feel smoother.<br>Get stronger','The work','You can hit the pace.','Tell me what you want to be capable of.'])assert.ok(home.includes(line),'Approved FORM voice: '+line);
assert.equal((home.match(/class="home-hero-slide is-active"/g)||[]).length,1,'One approved still');
assert.equal((home.match(/class="home-hero-slide home-hero-video"/g)||[]).length,1,'One muted film');
assert.equal((home.match(/class="home-media-card"/g)||[]).length,0,'No duplicated photo directory');
assert.match(home,/home-bend-only/,'Keep measured bend');
assert.match(home,/href="\/coaching\/apply\/"/,'Actual inquiry destination');
assert.match(inquiry,/id="sendBtn"/,'Actual working inquiry form');
assert.match(inquiry,/sfSubmitInquiry/,'Preserve backed inquiry submission');
assert.ok(home.includes(menu),'Canonical generated menu must be projected');
assert.doesNotMatch(home,/guaranteed results|injury-proof|universal perfect form|class="questionnaire"/i);
console.log('PASS: restrained photographic homepage, authored voice, real coaching inquiry, shared navigation.');
