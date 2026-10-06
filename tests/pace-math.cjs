'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const math = require('../js/pace-math.js');
const { HALF_METERS, MILE_METERS, KM_METERS, fmtPace, fmtTime,
  parseTime, parseDistance, distanceMeters, paceSeconds, splitSeconds,
  buildCheckpoints, STANDARD_DISTANCES } = math;

function close(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should equal ${expected} within ${tolerance}`);
}

assert.equal(HALF_METERS, 21097.5);
assert.equal(MILE_METERS, 1609.344);
assert.equal(KM_METERS, 1000);
assert.notEqual(distanceMeters(13.1, MILE_METERS), HALF_METERS);
close(distanceMeters(13.1, MILE_METERS), 21082.4064);
close(distanceMeters(HALF_METERS / MILE_METERS, MILE_METERS), HALF_METERS);
assert.equal(distanceMeters(21.0975, KM_METERS), STANDARD_DISTANCES.half);
assert.equal(distanceMeters(42.195, KM_METERS), STANDARD_DISTANCES.marathon);
close(distanceMeters(10, MILE_METERS), distanceMeters(16.09344, KM_METERS));
close(paceSeconds(4500, distanceMeters(10, MILE_METERS), MILE_METERS), 450);

for (const [input, expected] of [
  [0, '0:00'], [59.49, '0:59'], [59.5, '1:00'], [59.6, '1:00'],
  [299.6, '5:00'], [3599.5, '60:00'], [5399.6, '90:00']
]) assert.equal(fmtPace(input), expected);
for (const [input, expected] of [
  [0, '0:00'], [59.49, '0:59'], [59.5, '1:00'], [3599.49, '59:59'],
  [3599.5, '1:00:00'], [5399.6, '1:30:00'], [86399.6, '24:00:00']
]) assert.equal(fmtTime(input), expected);

for (const value of [-1, NaN, Infinity, -Infinity, '60', null, undefined, Number.MAX_VALUE]) {
  assert.throws(() => fmtTime(value), RangeError);
  assert.throws(() => fmtPace(value), RangeError);
}

for (const [text, seconds] of [
  ['90', 5400], ['90:00', 5400], ['1:30:00', 5400], [' 1:30:00 ', 5400],
  ['0:01', 1], ['0:00:01', 1], ['00:30', 30], ['25:59', 1559],
  ['48:00:00', 172800], ['30:00', 1800], ['720', 43200]
]) assert.equal(parseTime(text), seconds, text);
for (const text of [
  '', ' ', ':', '::', '0', '00', '0:00', '0:00:00', '-1', '-1:30', '+30',
  '1::2', '1h30', '12:', ':30', 'abc25', '1:30:00junk', '1:60:00', '1:30:60',
  '1:3:00', '1:30:0', '2:3', '1:30:00:00', '1 :30:00', '1.5', '1:30.5',
  '1e2', 'Infinity', 'NaN', '９０', '9'.repeat(400), 90, NaN, Infinity, null, undefined
]) assert.equal(parseTime(text), null, String(text));

for (const [text, number] of [['1', 1], ['8.5', 8.5], ['.5', .5], [' 21.0975 ', 21.0975]]) {
  assert.equal(parseDistance(text), number);
}
for (const text of ['', ' ', '0', '0.0', '-1', '+1', '1.', '.', '1.2.3', '8km', '1,000', '1e3', 'NaN', 'Infinity', '9'.repeat(400), 8, null]) {
  assert.equal(parseDistance(text), null, String(text));
}
for (const value of [0, -1, NaN, Infinity, -Infinity, '5', null, Number.MAX_VALUE]) {
  assert.throws(() => distanceMeters(value, KM_METERS), RangeError);
  assert.throws(() => distanceMeters(1, value), RangeError);
  assert.throws(() => paceSeconds(value, HALF_METERS, MILE_METERS), RangeError);
  assert.throws(() => paceSeconds(5400, value, MILE_METERS), RangeError);
  assert.throws(() => paceSeconds(5400, HALF_METERS, value), RangeError);
  assert.throws(() => buildCheckpoints(value), RangeError);
}
assert.throws(() => splitSeconds(5400, HALF_METERS, HALF_METERS + 1), RangeError);

// Independently checked with decimal arithmetic. Includes all 44 cells in
// the original 11-row source chart and all extended first-release rows.
const chartFixtures = [
  [4800, '6:06', '3:48', '18:58', '37:55'],
  [5100, '6:29', '4:02', '20:09', '40:17'],
  [5400, '6:52', '4:16', '21:20', '42:40'],
  [5700, '7:15', '4:30', '22:31', '45:02'],
  [6000, '7:38', '4:44', '23:42', '47:24'],
  [6300, '8:01', '4:59', '24:53', '49:46'],
  [6600, '8:23', '5:13', '26:04', '52:08'],
  [6900, '8:46', '5:27', '27:15', '54:31'],
  [7200, '9:09', '5:41', '28:26', '56:53'],
  [7500, '9:32', '5:55', '29:37', '59:15'],
  [7800, '9:55', '6:10', '30:49', '1:01:37'],
  [8100, '10:18', '6:24', '32:00', '1:03:59'],
  [8400, '10:41', '6:38', '33:11', '1:06:22'],
  [8700, '11:04', '6:52', '34:22', '1:08:44'],
  [9000, '11:27', '7:07', '35:33', '1:11:06'],
  [9300, '11:49', '7:21', '36:44', '1:13:28'],
  [9600, '12:12', '7:35', '37:55', '1:15:50'],
  [9900, '12:35', '7:49', '39:06', '1:18:12'],
  [10200, '12:58', '8:03', '40:17', '1:20:35'],
  [10500, '13:21', '8:18', '41:28', '1:22:57'],
  [10800, '13:44', '8:32', '42:40', '1:25:19'],
  [11700, '14:52', '9:15', '46:13', '1:32:26'],
  [12600, '16:01', '9:57', '49:46', '1:39:32'],
  [13500, '17:10', '10:40', '53:19', '1:46:39'],
  [14400, '18:18', '11:23', '56:53', '1:53:45']
];
for (const [seconds, perMile, perKm, fiveK, tenK] of chartFixtures) {
  assert.deepEqual([
    fmtPace(paceSeconds(seconds, HALF_METERS, MILE_METERS)),
    fmtPace(paceSeconds(seconds, HALF_METERS, KM_METERS)),
    fmtTime(splitSeconds(seconds, HALF_METERS, 5000)),
    fmtTime(splitSeconds(seconds, HALF_METERS, 10000))
  ], [perMile, perKm, fiveK, tenK], fmtTime(seconds));
}

// Exact displayed 4:16/km and 6:52/mile are both slightly over 90 minutes.
close(256 * HALF_METERS / KM_METERS, 5400.96);
close(412 * HALF_METERS / MILE_METERS, 5401.064036029588);
assert.equal(fmtTime(256 * HALF_METERS / KM_METERS), '1:30:01');

for (const seconds of [1, 1800, 4799, 5399, 5400, 7200, 10800, 14400, 43200, 172800]) {
  for (const meters of [400, MILE_METERS, 5000, 10000, HALF_METERS, 42195, 100000]) {
    for (const unit of [KM_METERS, MILE_METERS]) {
      const unrounded = paceSeconds(seconds, meters, unit);
      close(unrounded * meters / unit, seconds);
      assert.ok(!/:60(?:$|:)/.test(fmtPace(unrounded)));
      assert.ok(!/:60(?:$|:)/.test(fmtTime(seconds)));
    }
    assert.equal(splitSeconds(seconds, meters, meters), seconds);
  }
}

for (const [kind, meters] of [...Object.entries(STANDARD_DISTANCES),
  ...[.1, 1000, 4999, 5001, 8000, 9999, 10000, 21000, HALF_METERS,
    40000, 50000, 100000, 1000000000, Number.MAX_SAFE_INTEGER].map(m => ['custom', m])]) {
  const points = buildCheckpoints(meters, kind);
  assert.ok(points.length > 0 && points.length <= 101);
  assert.equal(points.at(-1).meters, meters);
  assert.equal(points.at(-1).label, 'Finish');
  assert.equal(points.filter(p => p.anchor).length, 1);
  assert.equal(new Set(points.map(p => p.meters)).size, points.length);
  points.forEach((point, index) => {
    assert.ok(point.meters > 0 && point.meters <= meters);
    if (index > 0) assert.ok(point.meters > points[index - 1].meters);
  });
}
assert.deepEqual(buildCheckpoints(HALF_METERS, 'half').map(p => p.label), ['5K', '10K', 'Halfway', '10 miles', 'Finish']);
assert.equal(buildCheckpoints(4999, 'custom').at(-1).meters, 4999);
assert.equal(buildCheckpoints(21000, 'custom').some(p => p.label === 'Halfway'), false);
assert.equal(buildCheckpoints(40000, 'custom').some(p => p.label === '20 miles'), false);
assert.equal(buildCheckpoints(HALF_METERS, 'half').find(p => p.label === '10 miles').meters, MILE_METERS * 10);

const browser = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/pace-math.js'), 'utf8'), browser);
assert.equal(browser.PaceMath.HALF_METERS, HALF_METERS);
assert.equal(browser.PaceMath.fmtTime(5399.6), '1:30:00');
assert.equal(browser.PaceMath.parseTime('1::2'), null);

console.log('pace-math: 25 chart rows (100 cells), strict parsing, exact conversions, rounding, round trips, ordered checkpoints and browser export passed.');
