const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const html = fs.readFileSync('design/drafts/race-pace-durability-results/band.html', 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*type="module")[^>]*>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length, 'calculator script found');

function element() {
  return {
    value: '', textContent: '', innerHTML: '', style: {}, disabled: false,
    classList: { add() {}, remove() {} },
    setAttribute() {}, addEventListener() {}, scrollIntoView() {},
    querySelectorAll() { return []; },
  };
}
const elements = new Map();
const context = {
  console,
  URLSearchParams,
  CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init?.detail; },
  location: { search: '' },
  navigator: {},
  setTimeout,
  document: {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
  },
  window: { dispatchEvent() {} },
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(scripts[0][1], context);

const math = context.window.__rpdBandMath;
assert.ok(math, 'math helpers exposed');

assert.equal(math.parseTime('47:30'), 2850);
assert.equal(math.parseTime('1:30:00'), 5400);
assert.equal(math.parseTime('47:90'), null, 'reject invalid seconds');
assert.equal(math.parseTime('1:75:00'), null, 'reject invalid minutes');

const HALF = 13.1094;
const hope = math.snapBand(5400 / HALF);
const jose = math.snapBand(5220 / HALF);
assert.deepEqual(Array.from(hope), [405, 420], '1:30 goal snaps to 6:45-7:00');
assert.deepEqual(Array.from(jose), [390, 405], '1:27 goal snaps to 6:30-6:45');

assert.equal(math.verdict(61)[1], 'Beyond the self-guided range');
assert.ok(html.indexOf('if(state.mpw<25)') < html.indexOf('var b=snapBand'), 'under-25 gate occurs before band render');
assert.ok(!html.includes('if(new URLSearchParams(location.search).get("mode")==="welcome")'), 'query string alone cannot unlock welcome mode');

console.log('RPD band calculator checks passed.');
