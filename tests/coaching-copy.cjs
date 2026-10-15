// Current homepage coaching copy. Editorial/collective entrances are deliberate.
// September's multi-offer copy freeze is historical, not the live house contract.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const menu=fs.readFileSync('scripts/site-menu-panel.html','utf8').trim();
for(const phrase of [
 'Run farther.<br>Feel smoother.<br>Get stronger',
 'I’m Brice.',
 'Train with me.',
 'Meet the athletes. The faces of FORM.',
 'From the practice',
 'Tell me what you want to be capable of.',
 'Run Development',
 'See the plan',
 'Browse the photographs ↗',
 '$1,200'
])assert.ok(html.includes(phrase),'Approved homepage text: '+phrase);
for(const href of ['/coaching/miami/','/form/','/forge-sculpt/','/plans/','/runs/','/people/','/track/','/contact'])
 assert.ok(html.includes('href="'+href+'"'),'Current entry point: '+href);
assert.ok(html.includes(menu),'The shared cinematic menu is projected from one source');
assert.match(html,/class="home-hero-slide is-active"/,'Opening photograph remains');
assert.match(html,/class="home-media-card"/,'The image-led Collective entrance remains');
assert.doesNotMatch(html,/guaranteed results|injury-proof|universal perfect form/i);
assert.doesNotMatch(html,/Run \+ Strength · \$1,800 \/ 8 weeks/,'The retired combined coaching package stays out');
console.log('PASS: current cinematic homepage, focused Run Development, direct app/collective paths, real pricing and preserved publication language.');
