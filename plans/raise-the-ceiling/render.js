/* The renderer. It owns no training content — every value comes from
 * plan-data.js, the public manifest for this plan.
 *
 * Design rule, Sep 09: athlete selection is a lens, pace is a fact, the week is
 * the product. So there is no unit control — both units are always shown — the
 * athlete switch is two plain names, and nothing stands between the band and
 * the week.
 *
 * Window thresholds are the Race Pace Durability sheet's, inherited rather than
 * invented: 599 is where the one-week-per-page read takes over.
 *
 * Two things this must never do:
 *   · convert a Thursday standard into a pace
 *   · normalize Lisa onto Simon's Tuesday sequence
 * Both are structural, not remembered: Thursday reads from the shared block and
 * never touches athlete state; each athlete's Tuesday reads from their own array.
 */
import { plan } from './plan-data.js';

const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]);
const LAST = plan.weeks;

const params = new URLSearchParams(location.search);
let athlete = plan.athletes.find((a) => a.id === params.get('athlete')) || plan.athletes[0];
let first = 1;

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
const maxFirst = () => Math.max(1, LAST - count + 1);
const clamp = (v) => Math.min(maxFirst(), Math.max(1, v));

/* Which week it is now is computed from the authored start, never typed. */
function liveWeek() {
  const start = new Date(plan.startsOn + 'T00:00:00');
  const n = Math.floor(Math.floor((Date.now() - start) / 86400000) / 7) + 1;
  return n >= 1 && n <= LAST ? n : null;
}
const live = liveWeek();

/* One shape for a session, so the desktop cell and the phone row can never
   drift apart in what they say. */
function work(day, w) {
  if (day === 'Tue') {
    const t = athlete.tuesday[w - 1];
    return { title: t.work, note: t.note, reps: null };
  }
  if (day === 'Thu') {
    const s = plan.thursday[w - 1];
    return { title: s.name, note: s.note, reps: s.reps };
  }
  const s = plan.saturday[w - 1];
  return { title: s.title, note: s.note, reps: null };
}

function block(day, w, mobile) {
  const { title, note, reps } = work(day, w);
  const accent = w === live;
  const c = mobile ? ['mtitle','mnote','mrep'] : ['work-title','work-note','rep'];
  let h = `<div class="${c[0]}${accent ? ' accent' : ''}">${esc(title)}</div>`;
  if (reps) h += reps.map((r) => `<span class="${c[2]}">${esc(r)}</span>`).join('');
  if (note) h += `<div class="${c[1]}">${esc(note)}</div>`;
  return h;
}

const DAYS = ['Tue', 'Thu', 'Sat'];

function paint() {
  count = visibleCount();
  first = count === 1 ? clamp(live || 1) : clamp(first);

  el('lensTabs').innerHTML = plan.athletes.map((a) =>
    `<button class="lens-tab" type="button" role="tab" data-athlete="${a.id}" aria-selected="${
      a === athlete}">${esc(a.name)}</button>`).join('');

  el('bandLabel').textContent = `${athlete.bandKind} · ${athlete.name}`;
  el('bandPrimary').textContent = athlete.band[athlete.units];
  el('bandSecondary').textContent = athlete.band[athlete.units === 'km' ? 'mi' : 'km'];

  const win = [];
  for (let i = first; i < first + count && i <= LAST; i++) win.push(i);

  el('weekNav').style.visibility = maxFirst() === 1 ? 'hidden' : 'visible';
  el('range').textContent = count === 1
    ? `W${first} · ${plan.weekDates[first - 1]}`
    : `W${win[0]}–W${win[win.length - 1]}`;
  el('prev').disabled = first <= 1;
  el('next').disabled = first >= maxFirst();

  let g = `<div class="grid" style="--cols:${win.length}"><div class="cell weekcell"></div>`;
  win.forEach((w) => {
    g += `<div class="cell weekcell${w === live ? ' cur' : ''}">${
      w === live ? '<span class="now">This week</span>' : ''
    }<div class="wk">W${w}</div><div class="date">${esc(plan.weekDates[w - 1])}</div></div>`;
  });
  DAYS.forEach((day) => {
    g += `<div class="cell day">${day}</div>`;
    win.forEach((w) => { g += `<div class="cell">${block(day, w, false)}</div>`; });
  });
  el('matrix').innerHTML = g + '</div>';

  const w = first;
  el('mobileSheet').innerHTML =
    `<div class="mobile-week-head"><div class="mobile-week-title"><strong>W${w}</strong>` +
    `<span>${esc(plan.weekDates[w - 1])}${w === live ? ' · this week' : ''}</span></div></div>` +
    `<div class="mobile-sessions">` + DAYS.map((day) =>
      `<div class="msession"><div class="mday">${day}</div><div>${block(day, w, true)}</div></div>`
    ).join('') + `</div>`;

  el('ctxQuestion').textContent = plan.question;
  el('ctxIdea').textContent = plan.idea;
  el('ctxMethod').textContent = plan.method;
  el('ctxTeaching').textContent = plan.teaching;

  document.documentElement.removeAttribute('data-booting');
}

/* One public plan, two athlete doors. */
function syncURL() {
  const u = new URL(location.href);
  u.searchParams.set('athlete', athlete.id);
  history.replaceState(null, '', u);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-athlete]');
  if (a) { athlete = plan.athletes.find((x) => x.id === a.dataset.athlete); syncURL(); return paint(); }
  const p = e.target.closest('#prev');
  if (p && !p.disabled) { first = clamp(first - count); return paint(); }
  const n = e.target.closest('#next');
  if (n && !n.disabled) { first = clamp(first + count); return paint(); }
});

addEventListener('resize', () => { const c = visibleCount(); if (c !== count) paint(); });

syncURL();
paint();
