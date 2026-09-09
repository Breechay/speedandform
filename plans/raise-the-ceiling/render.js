/* The renderer. It owns no training content — every value comes from
   plan-data.js, which is the public manifest for this plan.

   Two things it must never do:
     · convert a Thursday standard into a pace
     · normalize Lisa onto Simon's Tuesday sequence
   Both are structural here rather than remembered: Thursday is read from the
   shared block and never touches athlete state, and each athlete's Tuesday is
   read from their own array. */
import { plan } from './plan-data.js';

const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]);

let athlete = plan.athletes[0];
let units = athlete.units;
let week = 1;                     /* mobile reads one week at a time */

/* Which week it is now is derived from the date, never typed. The plan runs
   Tue-to-Mon from its own start, so week n covers [start + 7(n-1), +7). */
function liveWeek() {
  const start = new Date(plan.startsOn + 'T00:00:00');
  const days = Math.floor((Date.now() - start) / 86400000);
  const n = Math.floor(days / 7) + 1;
  return n >= 1 && n <= plan.weeks ? n : null;
}

const cell = (inner, cls = '') => `<div class="cell ${cls}"><div class="primary">${inner}</div></div>`;

function tuesday(w) {
  const t = athlete.tuesday[w - 1];
  const other = plan.athletes.find((a) => a !== athlete).tuesday[w - 1];
  const differs = t.work !== other.work;
  return cell(
    `${esc(t.work)}${t.note ? `<span class="note">${esc(t.note)}</span>` : ''}`,
    differs ? 'divergent' : ''
  );
}

function thursday(w) {
  const s = plan.thursday[w - 1];
  if (!s.reps) return cell(`<span class="std">${esc(s.name)}</span><span class="note">${esc(s.note)}</span>`);
  return cell(
    `<span class="std">${esc(s.name)}</span>` +
    `<ul class="reps">${s.reps.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
  );
}

function saturday(w) {
  const s = plan.saturday[w - 1];
  return cell(`${esc(s.title)}${s.note ? `<span class="note">${esc(s.note)}</span>` : ''}`);
}

const ROWS = [['TUE', tuesday], ['THU', thursday], ['SAT', saturday]];

/* The phone reads one week as a page rather than scanning a grid — the same
   choice the Race Pace Durability sheet makes, and the reason .matrix is hidden
   below 900px. Without this the plan simply had no plan in it on a phone. */
function mobileWeek(w) {
  return `<div class="mobile-week">` + ROWS.map(([day, build]) =>
    `<div class="mobile-day"><div class="mobile-day-name">${
      day[0] + day.slice(1).toLowerCase()}</div><div class="mobile-session">${
      build(w)}</div></div>`).join('') + `</div>`;
}

function matrix() {
  const now = liveWeek();
  const cur = (w) => (w === now ? 'cur' : '');
  const head = '<th>DAY</th>' + plan.weekDates.map((d, i) =>
    `<th class="${cur(i + 1)}"><b>W${i + 1}</b><span>${esc(d)}</span></th>`).join('');
  const body = ROWS.map(([day, build]) =>
    `<tr data-day="${day}"><th>${day[0] + day.slice(1).toLowerCase()}</th>` +
    plan.weekDates.map((_, i) => `<td class="${cur(i + 1)}">${build(i + 1)}</td>`).join('') +
    '</tr>').join('');
  return `<table class="matrix" aria-label="The six weeks"><colgroup><col class="row-label">${
    plan.weekDates.map(() => '<col>').join('')}</colgroup>` +
    `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function band() {
  const primary = athlete.band[units];
  const secondary = athlete.band[units === 'km' ? 'mi' : 'km'];
  return `<div class="k">${esc(athlete.bandKind)} &middot; ${esc(athlete.name)}</div>` +
    `<div class="v">${esc(primary)}<span class="alt">${esc(secondary)}</span></div>` +
    `<p class="why">${esc(athlete.bandNote)}</p>`;
}

function paint() {
  const now = liveWeek();
  el('band').innerHTML = band();
  el('sheet').innerHTML = matrix() + mobileWeek(week);
  el('range').textContent = `W${week} \u00B7 ${plan.weekDates[week - 1]}`;
  el('prev').disabled = week <= 1;
  el('next').disabled = week >= plan.weeks;
  document.querySelectorAll('[data-athlete]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.athlete === athlete.id)));
  document.querySelectorAll('[data-unit]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.unit === units)));
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-athlete]');
  if (a) {
    athlete = plan.athletes.find((x) => x.id === a.dataset.athlete);
    units = athlete.units;          /* each athlete arrives in their own units */
    return paint();
  }
  const u = e.target.closest('[data-unit]');
  if (u) { units = u.dataset.unit; return paint(); }
  const step = e.target.closest('[data-step]');
  if (step) {
    week = Math.min(plan.weeks, Math.max(1, week + Number(step.dataset.step)));
    paint();
  }
});

week = liveWeek() || 1;
paint();
