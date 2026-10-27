'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const read = path => fs.readFileSync(path, 'utf8');
const main = read('labs/rebuilt-athlete/index.html');
const speed = read('labs/rebuilt-athlete/speed-exposure/index.html');
const strength = read('labs/rebuilt-athlete/strength-and-speed/index.html');
const ledger = read('labs/rebuilt-athlete/SPEED-EXPOSURE-LEDGER-20261018.md');

assert.match(main, /Current orientation · 27 October 2026/);
assert.match(main, /4\.989 km iRUN loop effort/);
assert.match(main, /Company, leg strength and attention are now variables to observe/);
assert.match(strength, /Sculpt Phase 2, Week 1, Day 1/);
assert.match(strength, /not verification that the older Sculpt program is now his active Forge assignment/);

assert.match(speed, /data-scope="fivek26"/);
assert.match(speed, /type:"fivek26",pace:387,seconds:1201/);
assert.match(speed, /Oct 26 · Three parts of one continuous 5K/);
assert.match(speed, /not a manually marked course lap/);
assert.match(speed, /not official race splits/);
assert.match(speed, /The bins sum to 20:01/);
assert.equal([18, 221, 353, 532, 72, 5].reduce((sum, seconds) => sum + seconds, 0), 1201);

assert.match(ledger, /7\.74 miles \/ 12\.45365 km/);
assert.match(ledger, /20:01 is a recorded continuous effort, not a certified 5K race result/);
assert.match(ledger, /without the passing group/i);
assert.match(ledger, /not a FORM completion or a new prescription/);

for (const [, script] of speed.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
  new vm.Script(script, { filename: 'speed-exposure-inline.js' });
}
const ids = [...speed.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
assert.equal(ids.length, new Set(ids).size, 'Speed workbench IDs must be unique');

console.log('PASS: October 26 Rebuilt Athlete evidence, privacy scope, chart inputs and inline JavaScript.');
