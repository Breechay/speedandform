'use strict';
// Behavioural test for thursday.html: what the page actually renders on a
// given day. The failure this guards is the one that costs someone a morning:
// a wrong time, a wrong session, or a session invented for a date the coach
// called optional.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'thursday.html'), 'utf8');
const src = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>'));
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

function renderOn(day) {
  const store = {};
  const RealDate = Date;
  global.document = {
    getElementById: (id) => ({
      set textContent(v) { store[id] = v; },
      set innerHTML(v) { store[id] = v; },
    }),
  };
  global.Date = class extends RealDate {
    constructor(...a) { if (!a.length) super(day + 'T12:00:00'); else super(...a); }
    static now() { return new RealDate(day + 'T12:00:00').getTime(); }
  };
  try { new Function(src)(); } finally { global.Date = RealDate; }
  return {
    eyebrow: String(store['thu-eyebrow'] || ''),
    name: String(store['thu-session-name'] || '').replace(/<br>/g, ' '),
    inline: store['thu-session-inline'],
    rotation: store['thu-rotation-line'],
  };
}

// The authored Thursdays render the session Brice named.
const sep17 = renderOn('2026-09-17');
check(sep17.name === 'Speed Demons', `Sep 17 renders "${sep17.name}", expected Speed Demons`);
check(/^This morning/.test(sep17.eyebrow), `Sep 17 eyebrow is "${sep17.eyebrow}"`);

const sep24 = renderOn('2026-09-24');
check(sep24.name === 'Gauntlet', `Sep 24 renders "${sep24.name}", expected Gauntlet`);

// Before the day, the page names the upcoming Thursday, not today.
const mon = renderOn('2026-09-14');
check(mon.name === 'Speed Demons', `the Monday before renders "${mon.name}"`);
check(mon.eyebrow.includes('September 17'), `the Monday before says "${mon.eyebrow}"`);

// An optional morning names no session and makes no promise about what runs.
const oct1 = renderOn('2026-10-01');
check(oct1.name === 'Optional', `Oct 1 renders "${oct1.name}", expected Optional`);
check(oct1.eyebrow.includes('Optional'), `Oct 1 eyebrow is "${oct1.eyebrow}"`);
check(oct1.inline === undefined, 'Oct 1 named a session in the rotation line');
for (const s of ['Nice and Easy', 'Pyramid Intervals', 'Gauntlet', 'Speed Demons', 'Death', 'Resurrection']) {
  check(!String(oct1.rotation).includes(s), `Oct 1 named the session "${s}"`);
}

// The optional morning must not consume a rotation slot: the session after
// Gauntlet is Speed Demons, whichever Thursday it lands on.
check(renderOn('2026-10-08').name === 'Speed Demons',
  `Oct 8 renders "${renderOn('2026-10-08').name}", expected Speed Demons`);

// The rotation stays inside the six sessions, on every Thursday for a year.
const names = new Set(['Nice and Easy', 'Pyramid Intervals', 'Gauntlet', 'Speed Demons', 'Death', 'Resurrection', 'Optional']);
for (let d = new Date('2026-09-17T00:00:00'); d < new Date('2027-09-16T00:00:00'); d.setDate(d.getDate() + 7)) {
  const ymd = d.toISOString().slice(0, 10);
  const r = renderOn(ymd);
  check(names.has(r.name), `${ymd} renders "${r.name}", not one of the six sessions`);
}

// The time appears once, everywhere, and the old time is gone.
check(!/5:50/.test(html), 'the old 5:50 AM time survives somewhere on the page');
check((html.match(/6:30 AM/g) || []).length >= 4, 'expected the 6:30 AM time in the meta tags and the When row');

// Removed content stays removed.
for (const stale of ['Hideout', 'Key Biscayne', 'state-taper', 'state-recovery', 'full-block', 'Race Week', 'Apr 20', 'Apr 24']) {
  check(!html.includes(stale), `stale content "${stale}" is still on the page`);
}

// Copy rules.
check(!/Tonight/.test(html), '"Tonight" appears on a page about a 6:30 AM session');
check(!/practise|kilometre|colour/.test(html), 'British spelling in copy');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('PASS  thursday.html schedule, time and removals');
