const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let checks = 0;
function ok(value, message) { if (!value) throw new Error(message); checks += 1; }
function has(text, value, message = value) { ok(text.includes(value), `missing ${message}`); }
function lacks(text, value, message = value) { ok(!text.includes(value), `unexpected ${message}`); }

const en = read('plans/race-pace-durability/support/index.html');
const es = read('es/plans/race-pace-durability/index.html');
const checkout = read('plans/race-pace-durability/checkout.js');
const viewer = read('plans/race-pace-durability/index.html');
const planJs = read('plans/race-pace-durability/plan.js');
const gate = read('plans/race-pace-durability/gate.js');
const share = read('plans/race-pace-durability/week-share.js');

// Editorial content has one owner: HTML, never checkout runtime mutation.
lacks(checkout, 'installPracticeProof', 'runtime editorial replacement');
lacks(checkout, 'This is FORM.', 'retired editorial copy');
lacks(checkout, 'coaching theory', 'retired coaching-theory copy');
has(checkout, 'data-rpd-checkout');
has(checkout, 'client_reference_id');

// English explains shape, load and actual product without internal doctrine.
for (const phrase of [
  'Build the ability to carry your race pace for 13.1 miles.',
  'The structure behind the sessions.',
  '5 continuous',
  '12 after 4 easy',
  '18-mile long run',
  'Weeks 1–4 are free.',
  'All 15 weeks are $79.',
  'The web plan stands on its own.',
  'Individual coaching'
]) has(en, phrase);
lacks(en, 'You do not need to know the training theory');
lacks(en, 'You do not need to learn the coaching theory');
lacks(en, 'This is FORM.');
has(en, 'https://buy.stripe.com/bJeaEX1YvfNwgMX3Doffy00');
has(en, 'data-rpd-checkout');
has(en, 'hreflang="es-US"');

// Spanish carries the same product truth rather than the old explanation.
for (const phrase of [
  'Desarrolla la capacidad de sostener tu ritmo de carrera durante 13.1 millas.',
  'La estructura detrás de las sesiones.',
  '5 continuas',
  '12 después de 4 fáciles',
  'tirada larga de 18 millas',
  'Las semanas 1–4 son gratis.',
  'Las 15 semanas cuestan $79.',
  'El plan web funciona por sí solo.'
]) has(es, phrase);
lacks(es, 'No necesitas conocer toda la teoría del entrenamiento');
has(es, 'hreflang="en"');

// Week sharing is presentation-only: it cannot carry or manufacture entitlement.
has(viewer, 'Share Week');
has(viewer, '/plans/race-pace-durability/week-share.js');
has(share, "url.searchParams.set('week'");
has(share, "url.searchParams.delete('purchase_session')");
has(share, "url.searchParams.delete('state')");
lacks(share, 'resolvePlanAccess');
lacks(share, 'rpd_purchase_session');
lacks(share, 'localStorage');
lacks(share, 'session_id');

// The renderer, not a post-load click loop, owns public week presentation.
has(planJs, "new URLSearchParams(location.search).get('week')");
has(planJs, 'const sharedWeek');
has(planJs, 'left = clamp(sharedWeek); paint();');
has(planJs, 'window.formRpdViewWeek');
lacks(planJs, 'live = sharedWeek');
lacks(share, 'button.click()');
lacks(share, 'waitForRange');

// Future shared weeks may open a redacted placeholder, never prescription data.
has(gate, 'SHARED_WEEK');
has(gate, 'resolvePlanAccess');
has(gate, 'rpd-mobile-lock');
has(gate, 'Full plan · $79');
lacks(gate, 'SYNTHETIC');

// Commercial truth remains unchanged.
for (const page of [en, es]) {
  has(page, '$79');
  has(page, '15');
  has(page, '45');
  has(page, '60');
}

console.log(`PASS: ${checks} RPD story/share source checks`);
