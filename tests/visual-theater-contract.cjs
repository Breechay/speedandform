// Guard the owner's explicit theatrical design direction against silent flattening.
// This check does not judge artistic quality; iPhone screenshots are still required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const doctrine = read('docs/BRAND.md');
const home = read('index.html');
const css = read('css/home-commercial.css');
const hero = read('js/home-hero-carousel.js');
const slides = read('css/home-hero-carousel.css');

assert.match(doctrine, /Owner's visual rule · 14 October 2026/);
assert.match(doctrine, /FORM is not anti-decoration/);
assert.match(doctrine, /Do not mistake restraint for taste/);

// The most common regression was deleting the phone-specific backing gradient.
assert.match(css, /@media\(max-width:760px\)\{\.sf-home-hero-immersive \.hero-copy::before\{content:""/);
assert.match(css, /\.home-hero-shade\{pointer-events:none;z-index:0;background:radial-gradient/);
assert.match(css, /\.home-hero-shade\{background:radial-gradient/);
assert.doesNotMatch(css, /max-width:760px[^\n]*hero-copy::before\{content:none/);

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
console.log('FORM theatrical design contract: pass (still requires visual review).');
