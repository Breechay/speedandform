// The public Race Pace Durability page.
//
// Everything drawn here comes from the source Plan object — the same rows Hope
// and José's assignments resolve against. No athlete is read: what they have
// established belongs to their assignments and has no business on a page about
// the method.
//
// The page has four moments and one composition. The architecture never moves;
// the meaning changes.

import { publishedPlan } from './source.js';

// Live, not a fixture. Changing a value in the canonical plan changes this page
// without anyone editing HTML.
const plan = await publishedPlan('race-pace-durability');
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RUNGS = [2, 5, 6, 8, 12, 13.1];

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
const range = (week) => {
  const from = startOf(week), to = new Date(startOf(week));
  to.setDate(to.getDate() + 6);
  const show = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${show(from)} – ${show(to)}`;
};

// A day's cell is the notation, not the prose. Distances for easy days, the
// title for anything the week is proving something with.
// THE PRESCRIPTION, WHOLE.
//
// Written to show what a runner actually needs to execute the session, not what
// fits the matrix. Where the two disagree, this renders the session and the
// composition is what gets reconsidered — the point of this pass is to find out
// where the approved layout breaks under the real thing.
//
// FORM notation: → progression · × repetitions · / recovery · @ target ·
// WU / CD bookends.
const pace = (c) => {
  if (c.pace_low_seconds == null) return '';
  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return c.pace_high_seconds
    ? `${clock(c.pace_low_seconds)}–${clock(c.pace_high_seconds)}`
    : `${clock(c.pace_low_seconds)} or slower`;
};
const span = (c) => {
  if (c.distance != null) return `${+c.distance} mi`;
  if (c.duration_seconds == null) return '';
  return c.duration_seconds % 60 === 0
    ? `${c.duration_seconds / 60} min` : `${c.duration_seconds} s`;
};
const recovery = (c) => {
  if (!c.recovery_seconds) return '';
  const rest = c.recovery_seconds % 60 === 0
    ? `${c.recovery_seconds / 60} min` : `${c.recovery_seconds} s`;
  return ` / ${rest}${c.recovery_kind ? ` ${c.recovery_kind}` : ''}`;
};

function prescription(session) {
  if (!session) return { head: 'Rest', lines: [] };
  const parts = session.components || [];
  const work = parts.filter((c) => c.role === 'work');
  const wu = parts.find((c) => c.role === 'warm_up');
  const cd = parts.find((c) => c.role === 'cool_down');

  const head = work.map((c) => {
    const reps = c.shape === 'repetitions' && c.repeat_count > 1 ? `${c.repeat_count} × ` : '';
    return `${reps}${span(c)}`;
  }).join(' → ') || `${+session.distance} mi`;

  const lines = [];
  work.forEach((c) => {
    const target = pace(c) || (c.rpe_low ? `RPE ${c.rpe_low}${c.rpe_high ? `–${c.rpe_high}` : ''}` : '');
    if (target) lines.push(`${work.length > 1 ? `${span(c)} ` : ''}@ ${target}${recovery(c)}`);
    else if (recovery(c)) lines.push(recovery(c).replace(' / ', 'recovery '));
  });
  const book = [wu && `WU ${span(wu)}`, cd && `CD ${span(cd)}`].filter(Boolean).join(' · ');
  if (book) lines.push(book);
  if (session.distance != null) lines.push(`${+session.distance} mi total`);
  return { head, lines, asks: session.asks };
}

function matrix(current, complete) {
  const byDay = (week) => Object.fromEntries(week.sessions.map((s) => [s.day, s]));
  // `cur` is the approved stylesheet's own class. The current week used to be
  // pinned to the fourth column by nth-child; it is a class now so the week can
  // move on its own, and the appearance is unchanged.
  const mark = (week) => (!complete && week.week_number === current ? ' class="cur"' : '');
  el('matHead').innerHTML = '<th>WEEK</th>' + plan.weeks.map((w) =>
    `<th${mark(w)}><b>W${w.week_number}</b><span>${esc(
      startOf(w.week_number).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}</span></th>`).join('');
  const rows = DAYS.map((day) => `<tr><th>${day[0] + day.slice(1).toLowerCase()}</th>` + plan.weeks.map((w) => {
    const p = prescription(byDay(w)[day]);
    return `<td${mark(w)}><b>${esc(p.head)}</b>${
      p.lines.map((line) => `<i>${esc(line)}</i>`).join('')}${
      p.asks != null ? `<mark>asks ${esc(+p.asks)} mi</mark>` : ''}</td>`;
  }).join('') + '</tr>').join('');
  el('matBody').innerHTML = rows + '<tr class="total"><th>TOTAL</th>' + plan.weeks.map((w) =>
    `<td${mark(w)}>${esc(+w.total_distance)}</td>`).join('') + '</tr>';
}

// The progression moves through time. Past is quiet, the live question is lime,
// what has not been asked yet is dim. Complete reads as a finished journey.
function steps(current, complete) {
  const asked = plan.weeks.filter((w) => w.sessions.some((s) => s.asks != null)
    && w.week_number <= current).flatMap((w) => w.sessions.filter((s) => s.asks != null).map((s) => +s.asks));
  const live = plan.weeks.find((w) => w.week_number === current)?.sessions.find((s) => s.asks != null)?.asks;
  // Race week is not "only 13.1 matters". Every rung behind it is the path that
  // led here, so nothing is dimmed and the race carries the accent.
  const racing = document.body.dataset.state === 'race';
  el('steps').innerHTML = RUNGS.map((value, i) => {
    let cls = 'step';
    if (complete) cls += value === 13.1 ? ' race' : '';
    else if (racing) cls += value === 13.1 ? ' race' : ' past';
    else if (value === live) cls += ' now';
    else if (value === 2 || asked.includes(value)) cls += ' past';
    else cls += ' future';
    if (value === 13.1 && !complete && !racing) cls += ' race';
    return `${i ? '<i>→</i>' : ''}<div class="${cls}"><span>${value}</span><small>${
      value === 13.1 ? 'RACE' : 'MI'}</small></div>`;
  }).join('');
}

// THE FIELD is placeholder only. It stays that way until there is evidence:
// inventing a race result on a page whose entire argument is "here are the
// receipts" would be the one unforgivable thing this page could do.
function field() {
  el('athletes').innerHTML = ['José', 'Hope'].map((name) => `
    <article class="athlete">
      <h4>${esc(name.toUpperCase())}</h4>
      <div class="evrow">
        <div class="ev"><b>Entered</b><strong>2 mi</strong></div>
        <div class="ev"><b>The questions</b><strong>5 · 6 · 8 · 12</strong></div>
        <div class="ev pending"><b>Race</b><strong>—</strong></div>
      </div>
      <p class="read"><em>Coach read</em>Written after the race, from what the
      assignment actually recorded. Nothing here is generated.</p>
    </article>`).join('');
}

const MOMENTS = {
  build: (w) => ({
    kicker: 'Build',
    title: 'Building the ability to carry the pace.',
    body: 'This week accumulates race-pace volume and asks nothing. It is what makes the next question answerable.'
  }),
  ask: (w) => {
    const ask = plan.weeks.find((x) => x.week_number === w).sessions.find((s) => s.asks != null);
    return {
      kicker: 'The question',
      title: `${+ask.asks} mi<span class="band">Continuously · 6:30–6:45 /mi</span>`,
      body: `Can you carry the prescribed pace for ${+ask.asks} uninterrupted miles?`
    };
  },
  race: () => ({
    kicker: 'Race week',
    title: 'The work is done.',
    body: `${raceOn.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} · the answer is 13.1.`
  })
};

function render(state, week) {
  document.body.dataset.state = state;
  const complete = state === 'complete';
  matrix(week, complete);
  steps(week, complete);
  if (complete) {
    el('doneDates').textContent = `${weekOne.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${
      raceOn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · the prescription becomes a record.`;
    field();
  } else {
    const moment = MOMENTS[state](week);
    el('momentKicker').textContent = moment.kicker;
    el('momentTitle').innerHTML = moment.title;
    el('momentBody').textContent = moment.body;
    document.querySelector('.week-now span').textContent = `Week ${week} · ${range(week)}`;
    document.querySelector('.week-now .pill').textContent = state === 'race' ? 'RACE WEEK' : 'THIS WEEK';
  }
  document.querySelectorAll('.dev button').forEach((b) =>
    b.classList.toggle('on', b.dataset.state === state));
}

// The week is derived, never edited. Nobody updates this page on a Monday.
function today() {
  const now = new Date();
  if (now > raceOn) return ['complete', 15];
  const week = Math.min(15, Math.max(1, Math.floor((now - weekOne) / 604800000) + 1));
  const asks = plan.weeks.find((w) => w.week_number === week)?.sessions.some((s) => s.asks != null);
  return [week === 15 ? 'race' : asks ? 'ask' : 'build', week];
}

// The switcher and ?state= are DESIGN-REVIEW ONLY. The public page derives its
// state from the date and carries no way to override it — a plan that can be
// told what week it is would be a plan someone forgot to update.
const REVIEW = location.pathname.includes('/design-review/');
if (!REVIEW) document.getElementById('dev').remove();

// Representative weeks for the review switcher, derived from the plan rather
// than typed. If an ask moves, the shortcut follows it; nothing here is a fact
// about the plan, only a way to reach a moment.
const firstAsk = plan.weeks.find((w) => w.sessions.some((s) => s.asks != null))?.week_number;
const lastWeek = plan.weeks[plan.weeks.length - 1].week_number;
const FIXED = {
  build: Math.max(1, (firstAsk ?? 4) - 1),
  ask: firstAsk ?? 4,
  race: lastWeek,
  complete: lastWeek
};
// Guarded, because the element is removed outside design review — attaching to
// it unguarded threw before render() ever ran, so the public build showed the
// bare HTML skeleton and nothing else.
if (REVIEW) document.getElementById('dev').addEventListener('click', (event) => {
  const button = event.target.closest('[data-state]');
  if (!button) return;
  const state = button.dataset.state;
  if (state === 'auto') {
    const [live, week] = today();
    render(live, week);
    document.querySelectorAll('.dev button').forEach((b) => b.classList.toggle('on', b.dataset.state === 'auto'));
    return;
  }
  render(state, FIXED[state]);
});

// Capture hook, development only: ?state=ask renders that moment directly so a
// screenshot can reach it without a click. The live page will derive its state
// from the date and carry no switcher at all.
const asked = REVIEW ? new URLSearchParams(location.search).get('state') : null;
if (asked === 'auto') {
  const [live, week] = today();
  render(live, week);
} else if (asked && FIXED[asked]) {
  render(asked, FIXED[asked]);
} else if (REVIEW) {
  render('build', 3);
} else {
  const [live, week] = today();
  render(live, week);
}
