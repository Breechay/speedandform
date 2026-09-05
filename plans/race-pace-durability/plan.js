// The public Race Pace Durability page.
//
// Everything drawn here comes from the source Plan object — the same rows Hope
// and José's assignments resolve against. No athlete is read: what they have
// established belongs to their assignments and has no business on a page about
// the method.
//
// The composition is the approved baseline. One title, one week window, and the
// prescription itself inside the cell. There is no metric strip, no tagline, no
// explanatory chapter and no narrative block; the work is the argument.

import { publishedPlan } from './source.js';
import { notation } from './notation.js';

// Live, not a fixture. Changing a value in the canonical plan changes this page
// without anyone editing HTML.
const plan = await publishedPlan('race-pace-durability');
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const weekOne = new Date(`${plan.running.starts_on}T00:00:00`);
const raceOn = new Date(`${plan.running.race_on}T00:00:00`);
const el = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const startOf = (week) => {
  const day = new Date(weekOne);
  day.setDate(day.getDate() + (week - 1) * 7);
  return day;
};
const show = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// The notation is shared with the print edition.
const { read } = notation(plan);

// A session, typeset. Title, the one line that matters, the qualifiers, then
// the total set quietly apart — the same four registers on every surface.
function session(week, day, mobile) {
  const found = week.sessions.find((s) => s.day === day);
  const r = read(found);
  const totalLine = r.lines.length && /mi total$/.test(r.lines[r.lines.length - 1])
    ? r.lines[r.lines.length - 1] : '';
  const details = totalLine ? r.lines.slice(0, -1) : r.lines;
  return `<div class="${mobile ? 'mobile-session' : 'cell'}${r.kind === 'rest' ? ' rest' : ''}">
    <div class="session-title${r.racePace ? ' accent-title' : ''}">${esc(r.label)}</div>
    <div class="primary">${esc(r.head)}</div>
    ${details.map((l) => `<div class="detail">${esc(l)}</div>`).join('')}
    ${totalLine ? `<div class="total">${esc(totalLine)}</div>` : ''}
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────
// THE WINDOW.
//
// `left` is the leftmost week on screen — the window does not centre the week
// you are looking at, it starts there, which is how a printed plan reads.
// `live` is the week today actually falls in, and it keeps its THIS WEEK mark
// wherever the window moves: the viewport moving does not change what week it is.
const weeks = plan.weeks;
const LAST = weeks.length;

let count = visibleCount();
let left = 1;
let live = 1;
let complete = false;
let animating = false;

function visibleCount() {
  const w = window.innerWidth;
  if (w < 600) return 1;
  if (w < 900) return 2;
  if (w < 1280) return 3;
  return 6;
}
const maxLeft = () => Math.max(1, LAST - count + 1);
const clamp = (v) => Math.min(maxLeft(), Math.max(1, v));
const at = (n) => weeks.find((w) => w.week_number === n);
const isNow = (w) => !complete && w.week_number === live;

function desktopSheet(start) {
  const win = weeks.slice(start - 1, start - 1 + count);
  const cols = '<col class="row-label">' + win.map(() => '<col>').join('');
  const head = '<th>DAY</th>' + win.map((w) =>
    `<th class="${isNow(w) ? 'cur' : ''}"><b>W${w.week_number}</b>` +
    `<span>${esc(show(startOf(w.week_number)))}</span></th>`).join('');
  let body = '';
  DAYS.forEach((day) => {
    body += `<tr><th>${day[0] + day.slice(1).toLowerCase()}</th>` + win.map((w) =>
      `<td class="${isNow(w) ? 'cur' : ''}">${session(w, day, false)}</td>`).join('') + '</tr>';
  });
  body += '<tr class="total"><th>WEEK TOTAL</th>' + win.map((w) =>
    `<td class="${isNow(w) ? 'cur' : ''}"><div class="cell"><div class="primary">${
      esc(+w.total_distance)} mi</div></div></td>`).join('') + '</tr>';
  return `<table class="matrix" aria-label="Weeks ${win[0].week_number} through ${
    win[win.length - 1].week_number}"><colgroup>${cols}</colgroup>` +
    `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// One week, read as a page rather than scanned as a grid. Which week it is, is
// said once, in the folio beside the title — not repeated above the days.
function mobileSheet(start) {
  const w = at(start);
  return `<div class="mobile-week">` + DAYS.map((day) =>
    `<div class="mobile-day"><div class="mobile-day-name">${
      day[0] + day.slice(1).toLowerCase()}</div>${session(w, day, true)}</div>`).join('') +
    `<div class="mobile-week-total"><span>WEEK TOTAL</span><strong>${
      esc(+w.total_distance)} mi</strong></div></div>`;
}

const sheet = (start) => (count === 1 ? mobileSheet(clamp(start)) : desktopSheet(clamp(start)));

function label() {
  if (count === 1) {
    const w = at(left);
    const to = new Date(startOf(left)); to.setDate(to.getDate() + 6);
    el('range').textContent = `${String(left).padStart(2, '0')} / ${LAST}`;
    el('folio').innerHTML = (isNow(w) ? '<span class="folio-current">THIS WEEK</span>' : '') +
      `<span class="folio-week">Week ${left}</span>` +
      `<span class="folio-date">${esc(show(startOf(left)))} – ${esc(show(to))}</span>`;
  } else {
    const last = Math.min(LAST, left + count - 1);
    el('range').textContent = `Weeks ${left}–${last}`;
    el('folio').innerHTML = '';
  }
  el('prev').disabled = left <= 1;
  el('next').disabled = left >= maxLeft();
}

// Typeset the three sheets and park the track on the middle one — both in the
// same task. Letting a frame paint between them showed the week after next for
// one frame, which is what a step used to look like.
function paint() {
  el('prevSheet').innerHTML = sheet(left - 1);
  el('curSheet').innerHTML = sheet(left);
  el('nextSheet').innerHTML = sheet(left + 1);
  label();
  el('track').classList.remove('animating');
  el('track').style.transform = 'translate3d(-100%,0,0)';
}

// One step is one week, at every width. Six columns move as a block; they do
// not scroll past each other.
function step(direction) {
  if (animating || !direction) return;
  const track = el('track');
  const next = clamp(left + direction);
  if (next === left) {           // the end of the plan: acknowledge, don't move
    track.classList.add('animating');
    track.style.transform = 'translate3d(-100%,0,0)';
    return;
  }
  left = next;
  track.classList.add('animating');
  // Asked of the element rather than assumed, so reduced motion, a print
  // context and a browser with transitions switched off all take the same
  // path: no duration, no wait, the week is simply there.
  const ms = parseFloat(getComputedStyle(track).transitionDuration) * 1000;
  if (!ms) { paint(); return; }
  animating = true;
  track.style.transform = `translate3d(${direction > 0 ? -200 : 0}%,0,0)`;
  const done = () => { clearTimeout(guard); animating = false; paint(); };
  // A transition that never starts never ends, so the repaint is never left to
  // the event alone — that is how a single dropped frame used to strand the
  // window one week behind the label.
  const guard = setTimeout(done, ms + 140);
  track.addEventListener('transitionend', function once(e) {
    if (e.target !== track || e.propertyName !== 'transform') return;
    track.removeEventListener('transitionend', once);
    done();
  });
}

el('prev').addEventListener('click', () => step(-1));
el('next').addEventListener('click', () => step(1));

// DRAG. The track follows the finger within one sheet's width, and resists at
// the two ends of the plan so the edge is felt rather than announced.
let drag = null;
const viewport = () => el('viewport');
viewport().addEventListener('pointerdown', (e) => {
  if (animating || e.button) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, locked: false };
});
viewport().addEventListener('pointermove', (e) => {
  if (!drag || animating || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.locked) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (Math.abs(dy) >= Math.abs(dx)) { drag = null; return; }  // it was a scroll
    drag.locked = true;
    viewport().setPointerCapture?.(e.pointerId);
  }
  drag.dx = dx;
  const edge = (left <= 1 && dx > 0) || (left >= maxLeft() && dx < 0);
  el('track').classList.remove('animating');
  el('track').style.transform = `translate3d(calc(-100% + ${dx * (edge ? 0.28 : 1)}px),0,0)`;
});
function release() {
  if (!drag) return;
  const dx = drag.locked ? drag.dx : 0;
  drag = null;
  const threshold = Math.min(110, viewport().clientWidth * 0.2);
  if (Math.abs(dx) > threshold) { step(dx < 0 ? 1 : -1); return; }
  el('track').classList.add('animating');
  el('track').style.transform = 'translate3d(-100%,0,0)';
}
viewport().addEventListener('pointerup', release);
viewport().addEventListener('pointercancel', release);

// Trackpad, sideways over the plan. Horizontal intent only, so a normal
// vertical scroll past the matrix is never hijacked.
let wheelLock = 0;
viewport().addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 18) return;
  e.preventDefault();
  const now = Date.now();
  if (now - wheelLock < 820) return;
  wheelLock = now;
  step(e.deltaX > 0 ? 1 : -1);
}, { passive: false });

el('plan').addEventListener('keydown', (e) => {
  if (e.target.closest('button')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
});

let resizing;
window.addEventListener('resize', () => {
  clearTimeout(resizing);
  resizing = setTimeout(() => {
    const was = count;
    count = visibleCount();
    if (was === count) return;
    left = clamp(left);
    paint();
  }, 120);
});

// ─────────────────────────────────────────────────────────────────────────
// SHARE. The canonical address, handed to whatever the device uses to share.
const canonical = () => location.origin + location.pathname;
function toast(message) {
  const t = el('toast');
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
}
async function share() {
  const url = canonical();
  const data = { title: `${plan.plan.name} · FORM LABS`, url };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); }
  catch { toast(url); }
}
['share', 'shareMobile'].forEach((id) => el(id)?.addEventListener('click', share));

// PDF. The print edition is a separate sheet — landscape, a cover and three
// spreads of five weeks — rendered from this same plan and handed to the
// browser's own printer.
//
// Absolute, like every other path into this directory. The route is served at
// both /plans/race-pace-durability and /plans/race-pace-durability/, and a
// relative path resolves one directory up from the slashless form — which is
// the form an athlete gets handed. It 404s and nothing on the page runs.
['pdf', 'pdfMobile'].forEach((id) => el(id)?.addEventListener('click', () => {
  window.open('/plans/race-pace-durability/print.html', '_blank', 'noopener');
}));

// ─────────────────────────────────────────────────────────────────────────
// THE FOUR MOMENTS. Nothing in the composition moves between them; what changes
// is whether a week is marked, and whether the page speaks in the past tense.
function render(state, week, keepWindow) {
  document.body.dataset.state = state;
  complete = state === 'complete';
  if (!keepWindow) { live = week; left = clamp(week); }
  el('done').hidden = !complete;
  if (complete) {
    el('doneDates').textContent = `${show(weekOne)} – ${raceOn.toLocaleDateString('en-US',
      { month: 'short', day: 'numeric', year: 'numeric' })} · the prescription becomes a record.`;
  }
  paint();
  document.querySelectorAll('.dev button').forEach((b) =>
    b.classList.toggle('on', b.dataset.state === state));
}

// The week is derived, never edited. Nobody updates this page on a Monday.
function today() {
  const now = new Date();
  if (now > raceOn) return ['complete', LAST];
  const week = Math.min(LAST, Math.max(1, Math.floor((now - weekOne) / 604800000) + 1));
  const asks = at(week)?.sessions.some((s) => s.asks != null);
  return [week === LAST ? 'race' : asks ? 'ask' : 'build', week];
}

el('eyebrow').textContent = `${plan.plan.discipline.replace(/_/g, ' ').toUpperCase()} · ${LAST} WEEKS`;
el('planTitle').textContent = `THE ${LAST}-WEEK PLAN`;
// The version's date is the date the version was CUT, not the date training
// starts. They are two different facts and the footer is stating the first.
const cutAt = plan.version?.cut_at ? new Date(plan.version.cut_at) : weekOne;
el('version').textContent = `${plan.plan.name} · v${plan.version?.version_number ?? 1} · ${
  cutAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

// The switcher, ?state= and ?week= are DEVELOPMENT ONLY, and the gate is the
// HOSTNAME rather than the path — the page now lives at its public address, and
// a gate keyed on where the file sits would have shipped the switcher with it.
// The published plan derives its state from the date and carries no way to
// override it: a plan that can be told what week it is would be a plan someone
// forgot to update.
const REVIEW = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (!REVIEW) el('dev').remove();

const firstAsk = weeks.find((w) => w.sessions.some((s) => s.asks != null))?.week_number;
const FIXED = { build: Math.max(1, (firstAsk ?? 4) - 1), ask: firstAsk ?? 4, race: LAST, complete: LAST };

// Guarded, because the element is removed outside design review — attaching to
// it unguarded threw before render() ever ran, so the public build showed the
// bare HTML skeleton and nothing else.
if (REVIEW) el('dev').addEventListener('click', (event) => {
  const button = event.target.closest('[data-state]');
  if (!button) return;
  if (button.dataset.state === 'auto') {
    const [state, week] = today();
    render(state, week);
    document.querySelectorAll('.dev button').forEach((b) =>
      b.classList.toggle('on', b.dataset.state === 'auto'));
    return;
  }
  render(button.dataset.state, FIXED[button.dataset.state]);
});

const params = REVIEW ? new URLSearchParams(location.search) : new URLSearchParams();
const asked = params.get('state');
if (asked && asked !== 'auto' && FIXED[asked]) render(asked, FIXED[asked]);
else if (!asked && REVIEW) render('build', FIXED.build);
else { const [state, week] = today(); render(state, week); }

// Review-only: ?week= slides the WINDOW so a capture can reach any six weeks. It
// moves the viewport and nothing else — THIS WEEK stays where the calendar put it.
const wanted = Number(params.get('week'));
if (wanted >= 1 && wanted <= LAST) { left = clamp(wanted); paint(); }
