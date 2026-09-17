'use strict';
const fs = require('node:fs');

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, value) { fs.writeFileSync(path, value); }

// Paid traffic keeps the alternate Practice film only. It must not rewrite the
// now-simple hero copy back into the earlier acquisition treatment.
{
  const path = 'js/coaching-choice.js';
  let source = read(path);
  const legacy = `\n  var kicker = hero.querySelector('.hero-kicker');\n  if (kicker) kicker.textContent = 'Run Development · Brice · Miami';\n  var heading = hero.querySelector('h1');\n  if (heading) heading.innerHTML = 'Run better.<br>Get faster.<br>Run farther.';\n  var intro = hero.querySelector('.hero-sub > p');\n  if (intro) intro.textContent = 'Individual running coaching built around how you run now and where you want to go.';\n  var offerLabel = hero.querySelector('.offer small');\n  if (offerLabel) offerLabel.textContent = 'Individual coaching';\n  var begin = hero.querySelector('.begin');\n  if (begin) begin.innerHTML = 'Tell me about your running <span aria-hidden="true">→</span>';\n  var reassurance = hero.querySelector('.hero-reassurance');\n  if (reassurance) reassurance.innerHTML = 'First Miami track assessment complimentary.<br>An inquiry only. No payment or booking yet.';`;
  if (!source.includes(legacy)) throw new Error('legacy paid-copy rewrite not found');
  source = source.replace(legacy, '');
  write(path, source);
}

// Paid-social styling now exists only to crop the alternate film correctly.
write('css/meta-landing.css', `/* Paid-social continuation: same message, alternate Practice film. */\nhtml.meta-paid .hero>img,\nhtml.meta-paid .hero>video{object-position:center 46%}\n`);

// The visible hero text is real HTML. Keep only small-screen composition here;
// no hidden legacy copy and no pseudo-element replacement text.
{
  const path = 'css/coaching-choice.css';
  let source = read(path);
  const startMarker = '/* Acquisition first fold:';
  const endMarker = '@media(forced-colors:active)';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) throw new Error('acquisition CSS block boundaries not found');
  const replacement = `/* Mobile first fold: one promise, one fee, one action. */\n@media(max-width:600px){\n  .coaching-choice{margin-bottom:30px}.coaching-choice__trigger{padding:15px 16px;min-height:78px}.coaching-choice__name{font-size:17px}.coaching-choice__option{padding:13px 10px}\n  .hero{min-height:96svh}\n  .hero-copy{padding:190px 0 54px}\n  .hero h1{font-size:clamp(58px,16vw,74px);line-height:.89;letter-spacing:-.06em}\n  .hero-sub{grid-template-columns:1fr;gap:17px;margin-top:27px;padding-top:18px}\n  .hero-benefit{max-width:17ch;margin:0;font-size:clamp(20px,5.6vw,23px);line-height:1.3;letter-spacing:-.025em}\n  .offer{display:block;text-align:left}\n  .offer strong{font-size:17px;line-height:1.35}\n  .hero-actions{display:block;margin-top:21px}\n  .hero-actions .begin{width:auto;min-width:0;min-height:52px;padding:15px 22px}\n  .film-toggle{right:20px;bottom:17px}\n}\n@media(max-width:359px){.hero-copy{padding-top:176px}.hero h1{font-size:15.8vw}.hero-benefit{font-size:19px}}\n\n`;
  source = source.slice(0, start) + replacement + source.slice(end);
  write(path, source);
}

// Keep the stripped explanations from returning unnoticed.
{
  const path = 'tests/coaching-copy.cjs';
  let source = read(path);
  const marker = "assert.match(html, /data-coaching=\"remote\">Discuss remote coaching/);";
  if (!source.includes(marker)) throw new Error('coaching copy assertion marker not found');
  if (!source.includes('Running coaching with Brice.<br>Miami + Remote')) {
    source = source.replace(marker, marker + `\nassert.doesNotMatch(html, /We change what matters, practice it/);\nassert.doesNotMatch(html, /Running coaching with Brice\\.<br>Miami \\+ Remote/);\nassert.match(html, /<p class=\"training-caption\">One session belongs to a week\\.<\\/p>/);`);
  }
  write(path, source);
}

console.log('PASS: paid runtime and hero styling now match the sparse source copy');
