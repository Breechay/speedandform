// Guard the owner's explicit theatrical design direction against silent flattening.
// This check does not judge artistic quality; iPhone screenshots are still required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const agents = read('AGENTS.md');
const cursor = read('.cursor/rules/form-speedandform-context.mdc');
const execution = read('docs/design/FORM_VISUAL_EXECUTION_STANDARD_2026-10.md');
const brandPage = read('brand/index.html');
const brandCSS = read('css/brand.css');
const plans = read('plans/index.html');
const coaching = read('coaching/miami/index.html');
const doctrine = read('docs/BRAND.md');
const home = read('index.html');
const css = read('css/home-commercial.css');
const hero = read('js/home-hero-carousel.js');
const slides = read('css/home-hero-carousel.css');

assert.match(doctrine, /Owner's visual rule · 14 October 2026/);
assert.match(doctrine, /FORM is not anti-decoration/);
assert.match(doctrine, /Do not mistake restraint for taste/);
assert.match(agents, /FORM is not anti-decoration/);
assert.match(cursor, /Always applies to the website, FORM Network/);
assert.match(execution, /Creative intention/);
assert.match(brandPage, /id="theater"/);
assert.match(brandPage, /Make them/);
assert.equal((brandPage.match(/bk-theater-frame/g) || []).length, 3);
assert.match(brandCSS, /bk-theater-gallery/);
assert.match(brandCSS, /bk-theater-lead img\{filter:grayscale/);
assert.match(plans, /\.plan-media figure:nth-child\(1\) img\{filter:/);
assert.match(coaching, /\.rd-media-grid figure:nth-child\(2\) img\{filter:/);


// Owner's later photo-specific correction: never force grades or backing
// gradients onto these two original hero frames. Theater remains elsewhere.
assert.match(css, /\.sf-home-hero-immersive \.hero-copy::before\{content:none\}/);
assert.match(css, /\.home-hero-shade\{pointer-events:none;z-index:0;background:none\}/);
assert.match(css, /@media\(max-width:760px\)\{\.sf-home-hero-immersive \.hero-copy::before\{content:none\}/);
assert.match(css, /\.home-hero-shade\{background:none\}/);
assert.match(slides, /\.home-hero-slide:nth-child\(1\) img\{filter:none/);
assert.match(slides, /\.home-hero-slide:nth-child\(4\) img\{filter:grayscale\(1\)/);

// Decoration is allowed to be beautiful. The site also keeps meaningful entry points.
assert.equal((home.match(/class="home-media-card"/g) || []).length, 3);
assert.match(home, /class="home-media-head"/);
assert.match(home, /href="\/people\/"/);
assert.match(home, /href="\/runs\/"/);
assert.match(home, /href="\/track\/"/);

// The homepage film is ambient, silent, and respectful of accessibility.
assert.match(hero, /video\.defaultMuted = true/);
assert.match(hero, /video\.muted = true/);
assert.match(hero, /video\.controls = false/);
assert.match(hero, /prefers-reduced-motion/);
assert.doesNotMatch(hero, /home-hero-sound|Unmute|soundToggle/);
assert.match(slides, /home-hero-slide\{position:absolute;inset:0;opacity:0;transition:opacity/);
assert.match(slides, /home-hero-slide:nth-child\(2\) img\{filter:/);
console.log('FORM theatrical design contract: pass (still requires visual review).');
