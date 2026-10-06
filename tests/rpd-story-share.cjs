const fs = require('fs');
const path = require('path');
const vm = require('node:vm');
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

// English explains the actual offer. Presentation wording may be refined;
// price, preview, workload, delivery and separate coaching stay explicit.
for (const phrase of [
  'Race Pace<br>That Lasts.',
  'Try Weeks 1–4 free',
  'one-time payment',
  '$79',
  'Get the full 15 weeks',
  '45 miles a week',
  'six running days',
  '12-mile long run',
  '60 miles a week',
  '18-mile long run',
  'light and dark print editions',
  'Restore access',
  'FORM app access are separate',
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
  'Ritmo al final · 4 → 6 mi',
  'tirada larga de 18 millas',
  'Las semanas 1–4 son gratis.',
  'Las 15 semanas cuestan $79.',
  'El plan web funciona por sí solo.'
]) has(es, phrase);
lacks(es, 'No necesitas conocer toda la teoría del entrenamiento');
has(es, 'hreflang="en"');

// Week sharing is a visible, presentation-only control. It cannot carry or
// manufacture entitlement, even if an access callback appears in the address.
for(const id of ['share','shareMobile']) ok(new RegExp('<button[^>]*id="'+id+'"[^>]*>Share week</button>').test(viewer), id+' is an accessible share button');
has(viewer, '/plans/race-pace-durability/week-share.js');
has(share, "url.searchParams.set('week'");
lacks(share, 'resolvePlanAccess');
lacks(share, 'rpd_purchase_session');
lacks(share, 'localStorage');
lacks(share, 'fetch(');
lacks(share, 'button.click()');
lacks(share, 'waitForRange');
lacks(share, 'openRequestedWeek');
for(const [visible,requested,expected] of [['Week 03',9,3],['Weeks 10–13',12,12],['Week 05',5,5]]){
 const buttons={share:{},shareMobile:{}};
 const campaign={utm_source:'synthetic',utm_medium:'cpc',utm_campaign:'public running plan',utm_content:'practice-photo',ref:'friend'};
 const query=new URLSearchParams({...campaign,purchase_session:'cs_synthetic',session_id:'cs_synthetic',state:'private',token:'private',code:'private',access_token:'private',refresh_token:'private',token_hash:'private-magic-link',provider_token:'private-provider',unknown_private_parameter:'private-unknown',user:'private-person',week:String(requested)});
 const context={URL,URLSearchParams,Number,location:{href:'https://speedandform.com/plans/race-pace-durability/?'+query+'#access_token=private-fragment&refresh_token=private',search:'?'+query},document:{getElementById:id=>id==='range'?{textContent:visible}:buttons[id]||null,addEventListener(){}}};
 vm.createContext(context);vm.runInContext(share,context);
 const result=new URL(vm.runInContext('shareUrl()',context));
 ok(result.searchParams.get('week')===String(expected),'Sharing follows the visible week, not an unauthorized requested week');
 for(const key of ['purchase_session','session_id','state','token','code','access_token','refresh_token','token_hash','provider_token','unknown_private_parameter','user'])ok(!result.searchParams.has(key),'Shared URL excludes private '+key);
 for(const [key,value] of Object.entries(campaign))ok(result.searchParams.get(key)===value,'Public share preserves '+key);
 ok([...result.searchParams.keys()].every(key=>key==='week'||Object.hasOwn(campaign,key)),'Shared query contains public allowlist only');
 ok(result.hash==='','Shared URL clears authentication fragments');
 ok(result.origin==='https://speedandform.com'&&result.pathname==='/plans/race-pace-durability/','Shared URL preserves canonical public origin and path');
}

// The renderer stays date-derived. The access gate is the one owner that opens
// a shared week after identity/entitlement has resolved.
lacks(planJs, "new URLSearchParams(location.search).get('week')");
lacks(planJs, 'window.formRpdViewWeek');
has(gate, 'SHARED_WEEK');
has(gate, 'resolvePlanAccess');
has(gate, 'function openSharedWeek()');
has(gate, 'openSharedWeek();');
has(gate, 'baseClick(delta > 0 ? 1 : -1, Math.abs(delta));');
has(gate, 'rpd-mobile-lock');
has(gate, 'Unlock full 15 weeks · $79');
has(gate, 'const FREE_THROUGH = 4');
has(gate, 'if (entitled) return;');
has(gate, "cell.dataset.rpdLocked === 'true'");
lacks(gate, 'SYNTHETIC');

// Commercial truth remains unchanged.
for (const page of [en, es]) {
  has(page, '$79');
  has(page, '15');
  has(page, '45');
  has(page, '60');
}

console.log(`PASS: ${checks} RPD story/share source checks`);
