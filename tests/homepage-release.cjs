/* Offline release invariants. Run from the repository root. */
const fs=require('node:fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const inquiry=fs.readFileSync('coaching/apply/index.html','utf8');
const css=fs.readFileSync('css/homepage.css','utf8');
assert.match(css,/body\{margin:0;background:var\(--dark\)/,'Top and bottom overscroll canvas stays dark');
const motion=fs.readFileSync('js/homepage-motion.js','utf8');
const measurement=fs.readFileSync('js/coaching-measurement.js','utf8');
assert.equal((html.match(/<video\b/g)||[]).length,1,'One ambient hero film, not a competing full player');
assert.match(html,/<video\b[^>]*\bmuted\b[^>]*\bplaysinline\b[^>]*preload="none"/,'The film is silent, inline and lazy');
assert.doesNotMatch(html,/<video\b[^>]*\bcontrols\b/,'The ambient film must never show playback controls');
assert.doesNotMatch(html,/id="analysisVideo"/);
assert.doesNotMatch(html,/id="analysisToggle"/);
assert.match(html,/class="home-hero-media"/,'The photographic hero remains');
assert.match(html,/class="home-hero-shade"/,'A layered text-protection treatment remains');
assert.match(html,/class="home-hero-slide is-active"/,'There is a meaningful photographic opening frame');
assert.match(inquiry,/data-send-to="33a5c7969281803124c58268d7ae6188"/,'Delivery preserved on inquiry page');
assert.match(inquiry,/<noscript>/,'No-JS reply path preserved');
assert.match(inquiry,/mailto:brice@speedandform.com/);
assert.ok(!html.includes('id="pick"'));assert.ok(!html.includes('id="drop"'));
assert.ok(!html.includes('fetch("/", { method:"POST"'));
const intake=fs.readFileSync('js/commercial-inquiry.js','utf8');assert.match(intake,/AbortController/);assert.match(intake,/15000/);
assert.match(inquiry,/checkValidity\(\)/);assert.match(inquiry,/escapeHTML\(r\[1\]\)/);
assert.doesNotMatch(html,/An inquiry only\. No payment or booking yet\./);
assert.doesNotMatch(html,/I read every inquiry myself\./);
assert.doesNotMatch(html,/Coaching you’re interested in/);
assert.doesNotMatch(html,/first Miami track assessment is complimentary/i);
assert.doesNotMatch(html,/id="simon"/);
assert.match(html,/Run farther\.<br>Feel smoother\./);
assert.match(html,/class="home-world-sheet"/,'The cinematic photo wall remains');
assert.match(html,/class="home-entry home-bend-only"/,'Full-size continuous track transition retained');
assert.doesNotMatch(html,/href="\/the-method">Read the method/);
assert.match(html,/href="\/athletes\/"/,'Public athletes remain directly discoverable');
assert.match(inquiry,/class="questionnaire"/,'Functional form has its dedicated entrance');
assert.ok(!measurement.includes('var simon ='));assert.ok(!measurement.includes('result-grid'));
assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/grid-template-areas:"heading" "film" "body"/);
assert.match(motion,/IntersectionObserver/);assert.match(motion,/visibilitychange/);assert.match(motion,/saveData/);assert.match(motion,/pausedByUser/);assert.match(motion,/video\.autoplay = true/);assert.match(motion,/inViewport/);
// All local homepage destinations resolve as files, directory indexes, or known clean-URL aliases.
for(const m of html.matchAll(/(?:src|data-src|poster|href)="(\/(?!\/)[^"?#]*)(?:[?#][^"]*)?"/g)){
 const pathname=decodeURIComponent(m[1]).replace(/^\//,'');
 if(!pathname)continue;
 assert.ok(fs.existsSync(pathname)||fs.existsSync(pathname+'.html')||fs.existsSync(pathname+'/index.html'),'Local destination exists: '+m[1]);
}
console.log('PASS: theatrical photographic hero, silent ambient film, protected copy, cinematic media entrances, simplified inquiry, original source and local destinations.');
