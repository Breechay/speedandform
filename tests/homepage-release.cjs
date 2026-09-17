/* Offline release invariants. Run from the repository root. */
const fs=require('node:fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('css/homepage.css','utf8');
const motion=fs.readFileSync('js/homepage-motion.js','utf8');
const measurement=fs.readFileSync('js/coaching-measurement.js','utf8');
assert.equal((html.match(/<video\b/g)||[]).length,1,'One purposeful homepage film: the hero');
assert.doesNotMatch(html,/id="analysisVideo"/);
assert.doesNotMatch(html,/id="analysisToggle"/);
assert.match(html,/class="analysis-screen"><img src="\/assets\/home\/practice\/coaching-track\.webp"/);
assert.match(html,/FORM · Track practice · Miami/);
assert.match(html,/id="filmA" data-src="\/media\/run-development.mp4\?v=rd16"/);
assert.match(html,/data-send-to="33a5c7969281803124c58268d7ae6188"/);
assert.match(html,/<noscript>/);assert.match(html,/mailto:brice@speedandform.com/);
assert.ok(!html.includes('id="pick"'));assert.ok(!html.includes('id="drop"'));
assert.ok(!html.includes('fetch("/", { method:"POST"'));
assert.match(html,/AbortController/);assert.match(html,/15000/);
assert.match(html,/checkValidity\(\)/);assert.match(html,/escapeHTML\(r\[1\]\)/);
assert.doesNotMatch(html,/An inquiry only\. No payment or booking yet\./);
assert.doesNotMatch(html,/I read every inquiry myself\./);
assert.doesNotMatch(html,/Coaching you’re interested in/);
assert.doesNotMatch(html,/first Miami track assessment is complimentary/i);
assert.doesNotMatch(html,/id="simon"/);
assert.match(html,/I develop<br>runners\./);
assert.match(html,/Like a kite upon the wind\./);
assert.match(html,/Form is multiplied by every step\./);
assert.match(html,/Reveal what wants to be set free\./);
assert.match(html,/href="\/the-method">Read the method/);
assert.match(html,/Almost meditative/);
assert.match(html,/out-of-tune note/);
assert.ok(!measurement.includes('var simon ='));assert.ok(!measurement.includes('result-grid'));
assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/grid-template-areas:"heading" "film" "body"/);
assert.match(motion,/IntersectionObserver/);assert.match(motion,/visibilitychange/);assert.match(motion,/saveData/);assert.match(motion,/pausedByUser/);
// All local homepage destinations resolve as files, directory indexes, or known clean-URL aliases.
for(const m of html.matchAll(/(?:src|data-src|poster|href)="(\/(?!\/)[^"?#]*)(?:[?#][^"]*)?"/g)){
 const pathname=decodeURIComponent(m[1]).replace(/^\//,'');
 if(!pathname)continue;
 assert.ok(fs.existsSync(pathname)||fs.existsSync(pathname+'.html')||fs.existsSync(pathname+'/index.html'),'Local destination exists: '+m[1]);
}
console.log('PASS: sparse hero; static track coaching visual; simplified inquiry; preserved offers and relay; all local homepage links/assets resolve.');
