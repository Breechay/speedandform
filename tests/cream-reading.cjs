'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { eligible, transformHtml, collect, declarations, STYLE } = require('../scripts/build-cream-reading.cjs');
const root = path.resolve(__dirname, '..');
const fixture = `<!doctype html><html lang="en"><head><title>Fueling | FORM</title><link rel="canonical" href="https://speedandform.com/fueling"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond&family=Jost&display=swap" rel="stylesheet"><style>
:root { --cream:#f5f2ec; --ink:#2a2620; --ink-l:#6b6459; --ink-f:#a09890; --line:#d8d2c8; }
body { font-family:'Jost', sans-serif; font-weight:300; }
.page-title { font-family:'Cormorant Garamond', serif; font-weight:300; font-size:52px; }
.section-body { font-size:13px; color:var(--ink-l); letter-spacing:.02em; }
.section-label { font-size:8px; text-transform:uppercase; letter-spacing:.35em; }
.fuel-note { font-size:11px; color:var(--ink-f); opacity:.6; }
@media (max-width:480px) { .section-body { font-size:12px; } }
</style></head><body><div class="content"><h1 class="page-title">Fueling</h1><div class="section-body">Keep the original prescription: 20–30g.</div><input id="distance" style="display:none;font-size:12px" value="5"><a href="/library">Library</a><script>const literal = '<span style="font-size:8px">unchanged script</span>'; const work = 5 * 60;</script></div></body></html>`;
const scripts = s => s.match(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi) || [];
const ids = s => [...s.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const anchors = s => [...s.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m => m[1]);
const visible = s => s.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function invariants(source, output, file) {
  assert.deepEqual(scripts(output), scripts(source), `${file}: scripts must remain byte-identical`);
  assert.deepEqual(ids(output), ids(source), `${file}: IDs must remain stable`);
  assert.deepEqual(anchors(output), anchors(source), `${file}: existing anchors must remain stable`);
  assert.equal(visible(output), visible(source), `${file}: visible content must remain unchanged`);
  assert.equal(transformHtml(output, file), output, `${file}: transformation must be idempotent`);
  assert.equal(output.split(STYLE).length - 1, 1, `${file}: one shared stylesheet`);
  assert.ok(output.indexOf(STYLE) > output.slice(0, output.indexOf('</head>')).lastIndexOf('</style>'), `${file}: theme loads after page CSS`);
}
assert.equal(eligible('fueling.html', fixture), true);
const output = transformHtml(fixture, 'fueling.html');
invariants(fixture, output, 'fixture');
assert.match(output, /font-weight:400/);
assert.match(output, /font-size:17px/);
assert.match(output, /font-size:12px; text-transform:uppercase/);
assert.match(output, /display:none;font-size:17px/);
assert.match(output, /font-size:14px; color:var\(--ink-f\); opacity:1/);
assert.ok(!output.includes('fonts.googleapis.com'));
assert.ok(!transformHtml(fixture.replace('.fuel-note {', '.lib-section {'), 'fueling.html').includes('data-reading-layout=\"library\"'), 'CSS class name alone must not opt into the Library layout');
for (const file of ['record/index.html', 'account/index.html', 'login.html', 'signin.html', 'village-intake.html', 'index.html', 'coach.html', 'coach/labs/index.html', 'studio.html', 'films.html', 'athlete/index.html', 'auth/index.html', 'private/test.html', 'plans/test/index.html', 'labs/test/index.html', 'forge-app/index.html', 'form/index.html', 'mockupc/index.html']) {
  assert.equal(eligible(file, fixture), false, `${file} excluded`);
  assert.equal(transformHtml(fixture, file), fixture, `${file} unchanged`);
}
assert.equal(transformHtml(fixture.replace('#f5f2ec', '#060807'), 'dark.html'), fixture.replace('#f5f2ec', '#060807'));
assert.match(declarations('color:var(--line);font-weight:300;'), /color:var\(--ink-f\);font-weight:400;/);
function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(n => parseInt(n,16)/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
for (const ink of ['11100e','5f5a52','655f56','923e29']) for (const paper of ['ece6da','f4efe7']) assert.ok(contrast(ink,paper) >= 4.5, `${ink} on ${paper}`);
const css = fs.readFileSync(path.join(root,'css/cream-reading.css'),'utf8');
assert.ok(!/overflow(?:-x)?\s*:\s*hidden/.test(css), 'Do not conceal overflow');
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /:focus-visible/);
let checked = 0;
if (fs.existsSync(path.join(root,'library.html'))) {
  const pages = collect(root);
  assert.ok(pages.some(p => p.file === 'library.html'));
  for (const {file,html} of pages) { invariants(html, transformHtml(html,file), file); checked++; }
}
console.log(`PASS: reading migration invariants, exclusions, idempotence, contrast; ${checked} repository pages checked.`);
