// Pure renderers, shared by every surface.
//
// These were in coach/coach.js and are now imported from there rather than
// copied. Two surfaces rendering the same session from two copies of this file
// would drift within a week, and the thing that drifts is what a session says
// it asks for.
//
// Only pure functions live here. doseOf and qualifyingWords stayed in the
// Console because they read the selected athlete's mark out of module state;
// they move when they take the mark as an argument.

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function initials(name) {
  return String(name || '').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export const dayLabel = (iso) => {
  const date = new Date(`${iso}T12:00:00`);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

// "Aug 31 to Sep 6" collapses to "Aug 31–Sep 6"; a range inside one month
// collapses further to "Sep 7–13", which is how the dates read on paper.
export const rangeLabel = (from, to) => {
  if (!from || !to) return '';
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return a.getMonth() === b.getMonth()
    ? `${MONTHS[a.getMonth()]} ${a.getDate()}–${b.getDate()}`
    : `${dayLabel(from)}–${dayLabel(to)}`;
};

// Whether a session's title already states its dose. Compared on letters and digits
// only, so "3 x 2 mi at race pace" and "3 X 2 MI" are recognised as the same claim
// however either was typed.
export function titleAlreadySays(title, line) {
  const flatten = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const dose = flatten(line);
  return dose.length > 0 && flatten(title).includes(dose);
}

// The structure line, DERIVED from the authored pieces.
//
// Brice's library stores a notation string — "15e + 4 × [5 min LT2 / 2 min steady
// float]" — and the plain-language version was hand-written beside it. That is two
// sources of truth for one fact, and the moment a session's pieces change the
// sentence keeps describing the old one.
//
// So neither string is read. Both renderings come off the typed components, which
// means a session that is re-authored re-renders and cannot lie about itself.
//
//   console form   6 × 30s / 90s jog → 15 min @ 6:30–6:45
//   plain form     6 × 30 sec, 90 sec jog between, then 15 min at race pace
//
// The plain form is what leaves the Console. LT2, HM and 15e are internal
// vocabulary, and a line an athlete reads should say what it means in the words a
// coach would use standing next to them.
export function structureOf(version, { plain = false } = {}) {
  const parts = (version?.components || [])
    .filter((part) => part.role === 'work')
    .sort((a, b) => a.position - b.position);
  if (!parts.length) return null;

  const clock = (secs) => secs % 60 === 0 ? `${secs / 60} min` : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const brief = (secs) => secs < 60 ? `${secs}s` : clock(secs);
  const spoken = (secs) => secs < 60 ? `${secs} sec` : clock(secs);
  const unit = plain ? spoken : brief;

  // A band names the effort it belongs to rather than repeating two numbers the
  // athlete already has on the paces page.
  const effort = (part) => {
    if (part.pace_low_seconds == null) return '';
    if (part.pace_low_seconds >= 390 && part.pace_high_seconds <= 405) {
      return plain ? ' at race pace' : ` @ ${part.pace_low}–${part.pace_high}`;
    }
    return plain ? ' at threshold' : ` @ ${part.pace_low}–${part.pace_high}`;
  };

  const magnitude = (part) => {
    if (part.duration_seconds != null) return unit(part.duration_seconds);
    const distance = Number(part.distance);
    // A rep shorter than a kilometre is spoken in metres. Nobody has ever run
    // "0.2 km", and a decimal in a rep length reads as a rounding error.
    if (part.distance_unit === 'km' && distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance} ${part.distance_unit}`;
  };

  return parts.map((part) => {
    if (part.shape !== 'repetitions') return `${magnitude(part)}${effort(part)}`;
    const reps = `${part.repeat_count} × ${magnitude(part)}${effort(part)}`;
    if (part.recovery_seconds == null) return reps;
    const rest = `${unit(part.recovery_seconds)} ${part.recovery_kind || ''}`.trim();
    return plain ? `${reps}, ${rest} between` : `${reps} / ${rest}`;
  }).join(plain ? ', then ' : ' → ');
}

// The authored distance of a whole session.
//
// `prescribed_distance` is the expected TOTAL SESSION DISTANCE and the
// components describe the work inside it. That ruling landed on 4 September and
// it inverted this function: summing the components used to be the answer, and
// it undercounted every session by its warm-up, its cool-down and its running
// recoveries. Hills + strides types three minutes of running and is five miles.
//
// So the version's own number wins wherever it exists, and the components are
// the fallback for a session authored before the distinction, or one authored
// in time rather than distance.
export function authoredMiles(version) {
  if (version?.prescribed_distance != null) return Number(version.prescribed_distance);
  const parts = (version?.components || []);
  if (!parts.length) return null;
  let miles = 0;
  let sawDistance = false;
  parts.forEach((part) => {
    if (part.distance == null) return;
    const each = part.distance_unit === 'km' ? Number(part.distance) * 0.621371 : Number(part.distance);
    const reps = part.shape === 'repetitions' ? (part.repeat_count || 1) : 1;
    miles += each * reps;
    sawDistance = true;
  });
  return sawDistance ? Number(miles.toFixed(2)) : null;
}

// The work inside the session, as distinct from the session. Six miles at race
// pace inside a nine-and-a-half mile Tuesday: the first number is what the
// session asks the athlete to do, the second is what it costs the week.
export function workMiles(version) {
  const parts = (version?.components || []).filter((part) => part.role === 'work');
  let miles = 0;
  let saw = false;
  parts.forEach((part) => {
    if (part.distance == null) return;
    const each = part.distance_unit === 'km' ? Number(part.distance) * 0.621371 : Number(part.distance);
    miles += each * (part.shape === 'repetitions' ? (part.repeat_count || 1) : 1);
    saw = true;
  });
  return saw ? Number(miles.toFixed(2)) : null;
}
