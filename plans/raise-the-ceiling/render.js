/* The renderer. It owns no training content — every value comes from
   plan-data.js, the public manifest for this plan.
 *
 * The interaction grammar is Race Pace Durability's, not a new one: the same
 * responsive week window, the same three-sheet track parked on the middle, the
 * same one-step-is-one-week stepper, the same current-week treatment. RTC has
 * three authored rows instead of seven because those are the only days this
 * plan authors — that is the only difference, and it comes from the data.
 *
 * With six weeks, visibleCount() returns 6 at ≥1440, so the whole plan is
 * visible on a wide screen and the stepper disables itself. That is the rule
 * doing it, not a special case.
 *
 * Two things it must never do:
 *   · convert a Thursday standard into a pace
 *   · normalize Lisa onto Simon's Tuesday sequence
 * Both are structural: Thursday reads from the shared block and never touches
 * athlete state; each athlete's Tuesday reads from their own array.
 */
import { plan } from './plan-data.js';

const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]);
const LAST = plan.weeks;

/* Simon's link opens in kilometres and Lisa's in her authored mile band, so one
   public plan has two athlete-specific doors. A unit chosen after landing wins
   over the athlete's default and is carried in the URL too. */
const params = new URLSearchParams(location.search);
let athlete = plan.athletes.find((a) => a.id === params.get('athlete')) || plan.athletes[0];
let units = ['km', 'mi'].includes(params.get('units')) ? params.get('units') : athlete.units;
let unitPinned = ['km', 'mi'].includes(params.get('units'));

/* Same thresholds as the Race Pace Durability sheet. */
function visibleCount() {
  const w = window.innerWidth;
  if (w < 600) return 1;
  if (w < 770) return 2;
  if (w < 900) return 3;
  if (w < 990) return 4;
  if (w < 1440) return 5;
  return 6;
}
let count = visibleCount();
const maxLeft = () => Math.max(1, LAST - count + 1);
const clamp = (v) => Math.min(maxLeft(), Math.max(1, v));

/* Which week it is now is computed from the authored start date, never typed. */
function liveWeek() {
  const start = new Date(plan.startsOn + 'T00:00:00');
  const n = Math.floor(Math.floor((Date.now() - start) / 86400000) / 7) + 1;
  return n >= 1 && n <= LAST ? n : null;
}
const live = liveWeek();
const isNow = (w) => w === live;
let left = clamp(live || 1);

const cell = (inner, cls = '') => `<div class="cell ${cls}"><div class="primary">${inner}</div></div>`;

function tuesday(w) {
  const t = athlete.tuesday[w - 1];
  const other = plan.athletes.find((a) => a !== athlete).tuesday[w - 1];
  return cell(`${esc(t.work)}${t.note ? `<span class="note">${esc(t.note)}</span>` : ''}`,
    t.work !== other.work ? 'divergent' : '');
}
function thursday(w) {
  const s = plan.thursday[w - 1];
  if (!s.reps) return cell(`<span class="std">${esc(s.name)}</span><span class="note">${esc(s.note)}</span>`);
  return cell(`<span class="std">${esc(s.name)}</span><ul class="reps">${
    s.reps.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`);
}
function saturday(w) {
  const s = plan.saturday[w - 1];
  return cell(`${esc(s.title)}${s.note ? `<span class="note">${esc(s.note)}</span>` : ''}`);
}
const ROWS = [['TUE', tuesday], ['THU', thursday], ['SAT', saturday]];

function desktopSheet(start) {
  const win = [];
  for (let i = start; i < start + count && i <= LAST; i++) win.push(i);
  const head = '<th>DAY</th>' + win.map((w) =>
    `<th class="${isNow(w) ? 'cur' : ''}"><b>W${w}</b><span>${esc(plan.weekDates[w - 1])}</span></th>`).join('');
  const body = ROWS.map(([day, build]) =>
    `<tr data-day="${day}"><th>${day[0] + day.slice(1).toLowerCase()}</th>` +
    win.map((w) => `<td class="${isNow(w) ? 'cur' : ''}">${build(w)}</td>`).join('') + '</tr>').join('');
  return `<table class="matrix" aria-label="Weeks ${win[0]} through ${win[win.length - 1]}">` +
    `<colgroup><col class="row-label">${win.map(() => '<col>').join('')}</colgroup>` +
    `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/* One week read as a page rather than scanned as a grid — which week it is, is
   said once in the stepper label rather than repeated above the days. */
function mobileSheet(start) {
  return `<div class="mobile-week">` + ROWS.map(([day, build]) =>
    `<div class="mobile-day"><div class="mobile-day-name">${day[0] + day.slice(1).toLowerCase()}</div>` +
    `<div class="mobile-session">${build(start)}</div></div>`).join('') + `</div>`;
}
const sheet = (start) => (count === 1 ? mobileSheet(clamp(start)) : desktopSheet(clamp(start)));

function band() {
  return `<div class="k">${esc(athlete.bandKind)} &middot; ${esc(athlete.name)}</div>` +
    `<div class="v">${esc(athlete.band[units])}<span class="alt">${
      esc(athlete.band[units === 'km' ? 'mi' : 'km'])}</span></div>` +
    `<p class="why">${esc(athlete.bandNote)}</p>`;
}

function label() {
  const end = Math.min(left + count - 1, LAST);
  el('range').textContent = count === 1
    ? `W${left} · ${plan.weekDates[left - 1]}`
    : (left === 1 && end === LAST ? `ALL ${LAST} WEEKS` : `W${left}–W${end}`);
  el('prev').disabled = left <= 1;
  el('next').disabled = left >= maxLeft();
  el('stepper').hidden = maxLeft() === 1;
}

function paint() {
  el('band').innerHTML = band();
  el('prevSheet').innerHTML = sheet(left - 1);
  el('curSheet').innerHTML = sheet(left);
  el('nextSheet').innerHTML = sheet(left + 1);
  const track = el('track');
  track.classList.remove('animating');
  track.style.transform = 'translate3d(-100%,0,0)';
  label();
  /* The reserve only has a job before the first paint; held after it, it leaves
     dead space under the shorter three- and four-column windows. */
  document.documentElement.removeAttribute('data-booting');
  document.querySelectorAll('[data-athlete]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.athlete === athlete.id)));
  document.querySelectorAll('[data-unit]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.unit === units)));
}

/* The address bar carries the state, so an athlete's link lands already in
   their view and stays shareable after they touch the controls. */
function syncURL() {
  const q = new URLSearchParams({ athlete: athlete.id });
  if (unitPinned) q.set('units', units);
  history.replaceState(null, '', `${location.pathname}?${q}`);
}

/* One step is one week, at every width. A tap arriving mid-motion lands the step
   in flight and begins its own rather than being queued or dropped. */
let inFlight = null;
function step(direction) {
  const track = el('track');
  if (inFlight) inFlight();
  const next = clamp(left + direction);
  if (next === left) {
    track.classList.add('animating');
    track.style.transform = 'translate3d(-100%,0,0)';
    return;
  }
  left = next;
  track.classList.add('animating');
  const ms = parseFloat(getComputedStyle(track).transitionDuration) * 1000;
  if (!ms) return paint();
  track.style.transform = `translate3d(${direction > 0 ? -200 : 0}%,0,0)`;
  const done = () => { clearTimeout(guard); track.removeEventListener('transitionend', onEnd); inFlight = null; paint(); };
  const onEnd = (e) => { if (e.target === track && e.propertyName === 'transform') done(); };
  /* A transition that never starts never ends, so the repaint is never left to
     the event alone. */
  const guard = setTimeout(done, ms + 140);
  track.addEventListener('transitionend', onEnd);
  inFlight = done;
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-athlete]');
  if (a) {
    athlete = plan.athletes.find((x) => x.id === a.dataset.athlete);
    if (!unitPinned) units = athlete.units;
    syncURL(); return paint();
  }
  const u = e.target.closest('[data-unit]');
  if (u) { units = u.dataset.unit; unitPinned = true; syncURL(); return paint(); }
  const s = e.target.closest('[data-step]');
  if (s && !s.disabled) step(Number(s.dataset.step));
});

addEventListener('resize', () => {
  const n = visibleCount();
  if (n === count) return;
  count = n; left = clamp(left); paint();
});

syncURL();
paint();
