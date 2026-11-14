const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('coach/coach.js', 'utf8');
const start = source.indexOf('const canonicalPaceSecondsToDisplay');
const end = source.indexOf('let renderedPaceUnit', start);
assert.ok(start >= 0 && end > start, 'pace conversion helpers remain available');
const helpers = source.slice(start, end);

function evaluate(expression) {
  return vm.runInNewContext(`${helpers}\n${expression}`);
}

test('canonical mile pace renders in kilometers without changing storage', () => {
  assert.equal(evaluate("canonicalPaceSecondsToDisplay(370, 'km')"), 230);
  assert.equal(evaluate("canonicalPaceSecondsToDisplay(386, 'km')"), 240);
  assert.equal(evaluate("displayPaceSecondsToCanonical(230, 'km')"), 370);
  assert.equal(evaluate("displayPaceSecondsToCanonical(240, 'km')"), 386);
});

test('mile display is an identity boundary', () => {
  assert.equal(evaluate("canonicalPaceSecondsToDisplay(370, 'mi')"), 370);
  assert.equal(evaluate("displayPaceSecondsToCanonical(386, 'mi')"), 386);
});
