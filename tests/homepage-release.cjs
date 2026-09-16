/* Offline release invariants. Run from the repository root. */
const fs=require('node:fs');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('css/homepage.css','utf8');
const motion=fs.readFileSync('js/homepage-motion.js','utf8');
const measurement=fs.readFileSync('js/coaching-measurement.js','utf8');
assert.equal((html.match(/<video\b/g)||[]).length,2,'Exactly the original hero and the approved review');
assert.match(html, /id="analysisVideo" data-src="\/media\/form-analysis-track-square.mp4"/);
assert.match(html,/poster="\/media\/form-analysis-track-poster.jpg" width="512" height="512"/);
assert.match(html,/id="filmA" data-src="\/media\/run-development.mp4\?v=rd16"/);
assert.match(html,/data-send-to="33a5c7969281803124c58268d7ae6188"/);
assert.match(html,/<noscript>/);assert.match(html,/mailto:brice@speedandform.com/);
assert.ok(!html.includes('id="pick"'));assert.ok(!html.includes('id="drop"'));
assert.ok(!html.includes('fetch("/", { method:"POST"'));
assert.match(html,/AbortController/);assert.match(html,/15000/);
assert.match(html,/checkValidity\(\)/);assert.match(html,/escapeHTML\(r\[1\]\)/);
assert.match(html,/An inquiry only. No payment or booking yet./);
assert.match(html,/Moving time and average pace from Simon/);
assert.ok(!measurement.includes('var simon ='));assert.ok(!measurement.includes('result-grid'));
assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/grid-template-areas:"heading" "film" "body"/);
assert.match(motion,/IntersectionObserver/);assert.match(motion,/visibilitychange/);assert.match(motion,/saveData/);assert.match(motion,/pausedByUser/);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('media/form-analysis-track-square.mp4')).digest('hex'),'fa59a9cfb605b8cf68ac5eee6362e479c75a0739b29b8af3c0ba9ad9280698a1','Approved MP4 bytes unchanged');
// All local homepage destinations resolve as files, directory indexes, or known clean-URL aliases.
for(const m of html.matchAll(/(?:src|data-src|poster|href)="(\/(?!\/)[^"?#]*)(?:[?#][^"]*)?"/g)){
 const pathname=decodeURIComponent(m[1]).replace(/^\//,'');
 if(!pathname)continue;
 assert.ok(fs.existsSync(pathname)||fs.existsSync(pathname+'.html')||fs.existsSync(pathname+'/index.html'),'Local destination exists: '+m[1]);
}
console.log('PASS: two purposeful films; approved media hash; deferred motion; preserved offers and relay; native evidence; all local homepage links/assets resolve.');
