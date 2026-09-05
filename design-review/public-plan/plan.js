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
// WHAT KIND OF DAY IS THIS.
//
// Derived from what the session is made of, never from the weekday. Tuesday is
// race pace in this plan and Thursday rotates through four different things; a
// renderer that assumed the calendar would be wrong the first time a plan moved
// its key days.
//
// The bands come from the plan itself, so a plan authored at 7:00–7:15 labels
// its own work correctly without a line changing here.
const RP_LO = plan.plan.race_pace_low_seconds;
const RP_HI = plan.plan.race_pace_high_seconds;

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const span = (c) => {
  if (c.distance != null) return `${+c.distance} MI`;
  if (c.duration_seconds == null) return '';
  return c.duration_seconds % 60 === 0
    ? `${c.duration_seconds / 60} MIN` : `${c.duration_seconds} S`;
};
const isRacePace = (c) => c.pace_low_seconds === RP_LO && c.pace_high_seconds === RP_HI;
const isStride = (c) => c.shape === 'repetitions' && c.duration_seconds != null
  && c.duration_seconds <= 30 && c.pace_low_seconds == null;

// THE CELL, IN FULL.
//
// Five columns buy the room the fifteen never had, so the prescription goes back
// into the grid: pace, recovery, bookends, total. Book-like density, not cards.
//
// Notation is semantic, never a generic component arrow. A long run is
// `16 mi · last 3 @ 6:30–6:45`, not `13 mi → 3 mi`; strides are
// `7 mi easy + 4 × 20 s strides`, not `7 mi → 4 × 20 s`.
// A one-sided pace means two different things depending on which side of race
// pace it sits. Easy is a ceiling — 8:45 or slower, and slower is never wrong.
// Threshold is a target the block approaches — ≈6:15. Rendering both as
// "or slower" told an athlete that a threshold session had no floor.
const band = (c) => {
  if (c.rpe_low != null) return `RPE ${c.rpe_low}${c.rpe_high ? `–${c.rpe_high}` : ''}`;
  if (c.pace_low_seconds == null) return '';
  if (c.pace_high_seconds) return `${clock(c.pace_low_seconds)}–${clock(c.pace_high_seconds)}`;
  return c.pace_low_seconds > RP_HI
    ? `${clock(c.pace_low_seconds)} or slower`
    : `≈${clock(c.pace_low_seconds)}`;
};
const rest = (c) => {
  if (!c.recovery_seconds) return '';
  const t = c.recovery_seconds % 60 === 0
    ? `${c.recovery_seconds / 60} min` : `${c.recovery_seconds} s`;
  return `${t}${c.recovery_kind ? ` ${c.recovery_kind}` : ''}`;
};
const lower = (c) => span(c).toLowerCase();

function read(session) {
  if (!session) return { kind: 'rest', head: 'Rest', lines: ['—'] };
  const parts = session.components || [];
  const work = parts.filter((c) => c.role === 'work');
  const wu = parts.find((c) => c.role === 'warm_up');
  const cd = parts.find((c) => c.role === 'cool_down');
  const book = [wu && `WU ${lower(wu)}`, cd && `CD ${lower(cd)}`].filter(Boolean).join(' · ');
  const total = `${+session.distance} mi total`;
  const strides = work.find(isStride);
  const rpCont = work.find((c) => c.shape === 'continuous' && isRacePace(c));
  const aerobic = work.find((c) => c.shape === 'continuous' && !isRacePace(c)
    && c.pace_low_seconds != null && c.pace_low_seconds > RP_HI);
  const reps = work.find((c) => c.shape === 'repetitions' && !isStride(c));

  // Easy running, with or without strides. Quiet, and it does not repeat its own
  // distance back as a total.
  if (session.role === 'easy' || session.role === 'support') {
    const base = work.find((c) => c.shape === 'continuous') || work[0];
    if (strides) {
      return { kind: 'easy', head: `${+session.distance} mi easy + ${
        strides.repeat_count} × ${lower(strides)} strides`,
        lines: [base && band(base) ? `@ ${band(base)}` : ''].filter(Boolean) };
    }
    return { kind: 'easy', head: `${+session.distance} mi easy`,
             lines: [base && band(base) ? `@ ${band(base)}` : ''].filter(Boolean) };
  }

  // The long run, sometimes finishing at the band.
  if (aerobic) {
    const head = rpCont
      ? `${+session.distance} mi · last ${+rpCont.distance} @ ${band(rpCont)}`
      : `${+session.distance} mi long run`;
    const lines = rpCont
      ? [`${+aerobic.distance} mi easy + ${+rpCont.distance} mi at race pace`]
      : [`@ ${band(aerobic)}`];
    if (book) lines.push(book);
    lines.push(total);
    return { kind: 'long', head, lines, asks: session.asks };
  }

  if (rpCont) {
    const race = session.asks == null && +rpCont.distance >= 13;
    const lines = [];
    if (book) lines.push(book);
    lines.push(total);
    return { kind: race ? 'race' : 'rp',
             head: race ? `${+rpCont.distance} mi race @ ${band(rpCont)}`
                        : `${+rpCont.distance} mi continuous @ ${band(rpCont)}`,
             lines, asks: session.asks };
  }

  if (reps) {
    const n = reps.repeat_count > 1 ? `${reps.repeat_count} × ` : '';
    const lines = [];
    if (rest(reps)) lines.push(`${rest(reps)} recovery`);
    if (book) lines.push(book);
    lines.push(total);
    const faster = reps.pace_high_seconds != null && reps.pace_high_seconds < RP_LO;
    const kind = isRacePace(reps) ? 'rp' : 'support';
    return { kind, head: `${n}${lower(reps)} @ ${band(reps)}`, lines,
             asks: session.asks, note: !isRacePace(reps) && !faster && reps.rpe_low == null
               ? 'threshold' : undefined };
  }
  return { kind: 'easy', head: `${+session.distance} mi easy`, lines: [] };
}

// FIVE WEEKS, NOT FIFTEEN.
//
// Fifteen columns of real prescription was fifteen weeks of decoded data. Five
// weeks of understandable coaching is worth more, and the arrows already existed
// because moving through the plan is the point.
//
// The window centres the selected week and pins at the ends, so W1 and W15 stay
// reachable without it sliding off the block.
const WINDOW = 5;
let viewing = 3;

function windowFor(week) {
  const last = plan.weeks.length;
  const half = Math.floor(WINDOW / 2);
  const from = Math.min(Math.max(1, week - half), Math.max(1, last - WINDOW + 1));
  return plan.weeks.filter((w) => w.week_number >= from && w.week_number < from + WINDOW);
}

function matrix(current, complete) {
  viewing = current;
  const shown = windowFor(current);
  const byDay = (week) => Object.fromEntries(week.sessions.map((s) => [s.day, s]));
  const cur = (w) => (!complete && w.week_number === current ? ' cur' : '');
  const span7 = (n) => {
    const from = startOf(n), to = new Date(startOf(n));
    to.setDate(to.getDate() + 6);
    const show = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${show(from)} – ${show(to)}`;
  };

  el('matHead').innerHTML = '<th>DAY</th>' + shown.map((w) =>
    `<th class="wk${cur(w)}">${cur(w) ? '<u>This week</u>' : ''}<b>W${w.week_number}</b>` +
    `<span>${esc(span7(w.week_number))}</span></th>`).join('');

  el('matBody').innerHTML = DAYS.map((day) =>
    `<tr><th>${day[0] + day.slice(1).toLowerCase()}</th>` + shown.map((w) => {
      const session = byDay(w)[day];
      const r = read(session);
      return `<td class="d-${r.kind}${cur(w)}${r.asks != null ? ' asked' : ''}"${
        session ? ` data-w="${w.week_number}" data-day="${day}" tabindex="0"` : ''}>` +
        `<b>${esc(r.head)}</b>${r.lines.map((l) => `<i>${esc(l)}</i>`).join('')}</td>`;
    }).join('') + '</tr>').join('')
    + '<tr class="total"><th>Week<br>total</th>' + shown.map((w) =>
      `<td class="${cur(w).trim()}">${esc(+w.total_distance)} mi</td>`).join('') + '</tr>';

  // The control says which five weeks these are and what dates they cover.
  const first = shown[0].week_number, last = shown[shown.length - 1].week_number;
  const from = startOf(first);
  const to = new Date(startOf(last)); to.setDate(to.getDate() + 6);
  const show = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  el('windowLabel').innerHTML =
    `<b>Weeks ${first} – ${last}</b><span>${esc(show(from))} – ${esc(show(to))}</span>`;
  el('back').disabled = first === 1 && current === 1;
  el('fwd').disabled = current === plan.weeks.length;
}

// THE SESSION, WHOLE — beneath the window, so the five weeks stay on screen.
function inspect(weekNumber, day) {
  const week = plan.weeks.find((w) => w.week_number === weekNumber);
  const session = week?.sessions.find((s) => s.day === day);
  const panel = el('inspector');
  if (!session) { panel.hidden = true; return; }
  const r = read(session);
  const parts = session.components || [];
  const line = (c) => {
    const reps = c.shape === 'repetitions' && c.repeat_count > 1 ? `${c.repeat_count} × ` : '';
    const t = target(c);
    const rec = recovery(c);
    return `${reps}${span(c).toLowerCase()}${t ? ` @ ${t}` : ''}${rec ? ` / ${rec}` : ''}`;
  };
  const wu = parts.find((c) => c.role === 'warm_up');
  const cd = parts.find((c) => c.role === 'cool_down');
  const book = [wu && `WU ${span(wu).toLowerCase()}`, cd && `CD ${span(cd).toLowerCase()}`]
    .filter(Boolean).join(' · ');
  panel.innerHTML = `
    <div class="insHead">
      <div><em>W${weekNumber} · ${esc(day[0] + day.slice(1).toLowerCase())}${
        r.label ? ` · ${esc(r.label)}` : ''}</em>
        <h4>${esc(session.title)}</h4></div>
      <button class="insClose" type="button" aria-label="Close">×</button>
    </div>
    ${parts.filter((c) => c.role === 'work').map((c) => `<p class="insWork">${esc(line(c))}</p>`).join('')}
    ${book ? `<p class="insBook">${esc(book)}</p>` : ''}
    <p class="insTotal">${esc(+session.distance)} mi total</p>
    ${session.intent ? `<p class="insIntent">${esc(session.intent)}</p>` : ''}
    ${session.details ? `<p class="insRule">${esc(session.details)}</p>` : ''}`;
  panel.hidden = false;
}

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

// PLAN INFORMATION — the decoding key, derived from the plan's own components
// rather than typed, so a plan authored at other paces explains itself.
//
// The values are the plan's. The sentence explaining what each band is FOR is
// authored coaching copy that lives on the athletes' blocks and not on the plan,
// so it is deliberately absent here rather than invented. See the findings note.
function paceKey() {
  const seen = new Map();
  plan.weeks.forEach((w) => w.sessions.forEach((s) => (s.components || []).forEach((c) => {
    if (c.role !== 'work' || c.pace_low_seconds == null) return;
    const key = `${c.pace_low_seconds}-${c.pace_high_seconds ?? ''}`;
    if (!seen.has(key)) seen.set(key, c);
  })));
  const rows = [...seen.values()].sort((a, b) => b.pace_low_seconds - a.pace_low_seconds)
    .map((c) => {
      const value = c.pace_high_seconds
        ? `${clock(c.pace_low_seconds)}–${clock(c.pace_high_seconds)} / mi`
        : c.pace_low_seconds > RP_HI
          ? `${clock(c.pace_low_seconds)} / mi or slower`
          : `≈${clock(c.pace_low_seconds)} / mi`;
      let name = 'Race pace';
      if (c.pace_low_seconds > RP_HI) name = 'Easy pace';
      else if (!c.pace_high_seconds) name = 'Threshold';
      else if (c.pace_high_seconds < RP_LO) name = 'VO₂';
      return { name, value };
    });
  el('paceKey').innerHTML = rows.map((r) =>
    `<div><dt>${esc(r.name)}</dt><dd>${esc(r.value)}</dd></div>`).join('');
}

function render(state, week) {
  document.body.dataset.state = state;
  const complete = state === 'complete';
  matrix(week, complete);
  steps(week, complete);
  paceKey();
  if (complete) {
    el('doneDates').textContent = `${weekOne.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${
      raceOn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · the prescription becomes a record.`;
    field();
  } else {
    const moment = MOMENTS[state](week);
    el('momentKicker').textContent = moment.kicker;
    el('momentTitle').innerHTML = moment.title;
    el('momentBody').textContent = moment.body;

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
// Selecting a session opens it beneath the window; the five weeks stay put.
document.addEventListener('click', (event) => {
  if (event.target.closest('.insClose')) { el('inspector').hidden = true; return; }
  const cell = event.target.closest('#matBody td[data-w]');
  if (cell) inspect(Number(cell.dataset.w), cell.dataset.day);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') el('inspector').hidden = true;
  if (event.key === 'Enter' && event.target.matches('#matBody td[data-w]')) {
    inspect(Number(event.target.dataset.w), event.target.dataset.day);
  }
});

// The arrows move ONE week, not one page of five.
[['back', -1], ['fwd', 1]].forEach(([id, step]) => {
  el(id).addEventListener('click', () => {
    const next = Math.min(plan.weeks.length, Math.max(1, viewing + step));
    if (next === viewing) return;
    el('inspector').hidden = true;
    render(document.body.dataset.state, next);
  });
});

// The opening moment.
const params = REVIEW ? new URLSearchParams(location.search) : new URLSearchParams();
const asked = params.get('state');
if (asked === 'auto') {
  const [live, week] = today();
  render(live, week);
} else if (asked && FIXED[asked]) {
  // ?week= lets a capture reach any window without clicking through. Review only.
  const wanted = Number(params.get('week'));
  render(asked, wanted >= 1 && wanted <= plan.weeks.length ? wanted : FIXED[asked]);
} else if (REVIEW) {
  render('build', FIXED.build);
} else {
  const [live, week] = today();
  render(live, week);
}

// Review-only: ?open=3-TUE opens that session so a capture can reach it.
const opening = params.get('open');
if (opening) {
  const [week, day] = opening.split('-');
  inspect(Number(week), day);
}
