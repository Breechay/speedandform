'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const plan=require('../data/half-marathon-finish-plan.json');
const {routes,trainingTotal}=require('../scripts/build-half-marathon.cjs');
const math=require('../js/pace-math.js');
assert.equal(plan.weeks.length,12);
assert.deepEqual(plan.weeks.map(trainingTotal),[14,15,16.5,14,18,19.5,16,20,21,22,16,4]);
assert.deepEqual(plan.weeks.slice(0,11).map(w=>w.days[6]),[5,6,6.5,5,7,7.5,6,8,9,10,7]);
for(const w of plan.weeks){assert.equal(w.days.length,7);assert.equal(w.days[0],0);assert.equal(w.days[5],0);if(w.week<12){assert.equal(w.days[3],0);assert.equal(w.days.filter(n=>n>0).length,4);}}
assert.deepEqual(plan.weeks[11].days,[0,2,0,2,0,0,'race']);assert.equal(plan.raceMeters,math.HALF_METERS);
for(const route of Object.values(routes)){const h=fs.readFileSync('.'+route+'index.html','utf8');assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.ok(h.includes('rel="canonical" href="https://speedandform.com'+route+'"'));const ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const m of h.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),route+' missing anchor '+m[1]);assert.ok(!/coming soon|sign up to read|RPE.*Zone 2/i.test(h));}
const html=fs.readFileSync('.'+routes.plan+'index.html','utf8');
assert.equal((html.match(/<details class="hm-week"/g)||[]).length,12);
assert.equal((html.match(/<span class="day-name">/g)||[]).length,84);
assert.ok(html.includes('4 mi'));assert.ok(html.includes('21.0975'));
const chart=fs.readFileSync('.'+routes.pace+'index.html','utf8');assert.equal((chart.match(/<th scope="row">/g)||[]).length,25);assert.ok(chart.includes('1:30:00</th><td>6:52</td><td>4:16'));
const css=fs.readFileSync('css/half-marathon-library.css','utf8');assert.ok(css.includes('@media print'));assert.ok(css.includes('.hm-overview{display:block!important}'));assert.ok(!/overflow(?:-x)?:hidden/.test(css));
console.log('PASS: exact reviewed 12-week source, all 84 day entries, rest/taper spacing, resource metadata/anchors, pace fixtures, print fallback.');
