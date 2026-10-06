/* Shared pace arithmetic for browser tools and static resource generation.
 * Keep calculations in canonical meters and unrounded seconds. Round only
 * for display. Input grammar and numeric limits are defined below.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PaceMath = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const HALF_METERS = 21097.5;
  const MILE_METERS = 1609.344;
  const KM_METERS = 1000;
  const STANDARD_DISTANCES = Object.freeze({
    '5k': 5000, '10k': 10000, half: HALF_METERS, marathon: HALF_METERS * 2
  });

  function positive(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
      throw new RangeError(name + ' must be a positive finite number within numeric precision.');
    }
    return value;
  }

  function roundedSeconds(seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
      throw new RangeError('Seconds must be a nonnegative finite number.');
    }
    const rounded = Math.round(seconds);
    if (!Number.isSafeInteger(rounded)) throw new RangeError('Seconds exceed numeric precision.');
    return rounded;
  }

  function fmtPace(seconds) {
    const rounded = roundedSeconds(seconds);
    return Math.floor(rounded / 60) + ':' + String(rounded % 60).padStart(2, '0');
  }

  function fmtTime(seconds) {
    const rounded = roundedSeconds(seconds);
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor(rounded / 60) % 60;
    const rest = String(rounded % 60).padStart(2, '0');
    return hours > 0 ? hours + ':' + String(minutes).padStart(2, '0') + ':' + rest : minutes + ':' + rest;
  }

  // Accepted strings: whole minutes (90), m:ss (90:00), h:mm:ss (1:30:00).
  // Seconds and the minute field after hours always have two digits, 00–59.
  // Trim outer whitespace only. Signs, decimals, letters and partial fields
  // are rejected. Return null for zero or values outside numeric precision.
  function parseTime(text) {
    if (typeof text !== 'string') return null;
    const input = text.trim();
    let seconds;
    if (/^\d+$/.test(input)) seconds = Number(input) * 60;
    else if (/^\d+:[0-5]\d$/.test(input)) {
      const parts = input.split(':').map(Number);
      seconds = parts[0] * 60 + parts[1];
    } else if (/^\d+:[0-5]\d:[0-5]\d$/.test(input)) {
      const parts = input.split(':').map(Number);
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else return null;
    return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
  }

  // Positive plain decimals only. A leading decimal (.5) is accepted; a
  // trailing decimal (5.) is an incomplete field. Scientific notation,
  // grouping commas, signs and units inside the value are not accepted.
  function parseDistance(text) {
    if (typeof text !== 'string' || !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text.trim())) return null;
    const value = Number(text.trim());
    return Number.isFinite(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER ? value : null;
  }

  function distanceMeters(distance, unitMeters) {
    return positive(positive(distance, 'Distance') * positive(unitMeters, 'Unit'), 'Distance in meters');
  }

  function paceSeconds(totalSeconds, meters, unitMeters) {
    positive(totalSeconds, 'Finish time');
    positive(meters, 'Distance');
    positive(unitMeters, 'Unit');
    return positive(totalSeconds * (unitMeters / meters), 'Pace');
  }

  function splitSeconds(totalSeconds, meters, checkpointMeters) {
    positive(totalSeconds, 'Finish time');
    positive(meters, 'Distance');
    positive(checkpointMeters, 'Checkpoint');
    if (checkpointMeters > meters) throw new RangeError('Checkpoint cannot exceed the finish.');
    return positive(totalSeconds * (checkpointMeters / meters), 'Split');
  }

  function buildCheckpoints(meters, kind) {
    positive(meters, 'Distance');
    let candidates;
    // A custom value close to a race distance remains the exact custom value.
    if (kind === '5k' && meters === STANDARD_DISTANCES['5k']) {
      candidates = [['1 km', 1000], ['1 mile', MILE_METERS], ['2 km', 2000], ['3 km', 3000], ['4 km', 4000]];
    } else if (kind === '10k' && meters === STANDARD_DISTANCES['10k']) {
      candidates = [['1 mile', MILE_METERS], ['5K', 5000], ['5 miles', 5 * MILE_METERS]];
    } else if (kind === 'half' && meters === HALF_METERS) {
      candidates = [['5K', 5000], ['10K', 10000], ['10 miles', 10 * MILE_METERS], ['Halfway', meters / 2]];
    } else if (kind === 'marathon' && meters === STANDARD_DISTANCES.marathon) {
      candidates = [['10K', 10000], ['Halfway', meters / 2], ['30K', 30000], ['20 miles', 20 * MILE_METERS]];
    } else {
      candidates = [];
      let step = meters <= 5000 ? 1000 : meters <= 15000 ? 2000 : 5000;
      // Adapt checkpoint spacing for very long custom distances. This bounds
      // rendering work without imposing a race-distance or finish-time cap.
      while (meters / step > 100) step *= 10;
      for (let index = 1; index * step < meters; index += 1) {
        candidates.push([(index * step / KM_METERS) + ' km', index * step]);
      }
    }
    candidates.push(['Finish', meters, true]);
    candidates.sort(function (a, b) { return a[1] - b[1]; });
    const checkpoints = [];
    for (const point of candidates) {
      if (point[1] <= 0 || point[1] > meters) continue;
      const previous = checkpoints[checkpoints.length - 1];
      const checkpoint = { label: point[0], meters: point[1], anchor: Boolean(point[2]) };
      if (previous && previous.meters === point[1]) {
        if (checkpoint.anchor) checkpoints[checkpoints.length - 1] = checkpoint;
      } else checkpoints.push(checkpoint);
    }
    return checkpoints;
  }

  return Object.freeze({ HALF_METERS, MILE_METERS, KM_METERS, STANDARD_DISTANCES,
    fmtPace, fmtTime, parseTime, parseDistance, distanceMeters, paceSeconds,
    splitSeconds, buildCheckpoints });
}));
