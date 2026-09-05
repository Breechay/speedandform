// The public Race Pace Durability page.
//
// Everything drawn here comes from the source Plan object — the same rows Hope
// and José's assignments resolve against. No athlete is read: what they have
// established belongs to their assignments and has no business on a page about
// the method.
//
// The page has four moments and one composition. The architecture never moves;
// the meaning changes.

const plan = await (await fetch('plan.json')).json();
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RUNGS = [2, 5, 6, 8, 12, 13.1];

const weekOne = new Date(`${plan.first_run.week_one_starts_on}T00:00:00`);
const raceOn = new Date(`${plan.first_run.race_on}T00:00:00`);
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
function cell(session) {
  if (!session) return '';
  if (session.role === 'easy') return `${+session.distance} MI`;
  if (session.asks != null) return `${+session.asks} MI CONT`;

  const work = (session.components || []).filter((c) => c.role === 'work');
  const main = work.find((c) => c.shape === 'repetitions') || work[0];
  if (!main) return `${+session.distance} MI`;

  // A long run that finishes at the band: the tail is what the day is for.
  const tail = work.find((c) => c.shape === 'continuous' && c.pace_high_seconds);
  if (tail && work.length > 1) return `${+session.distance} · LAST ${+tail.distance} RP`;

  if (main.shape === 'repetitions') {
    // Distance reps say miles; time reps say the unit they were authored in.
    // Dividing 45 seconds by 60 gave `0.75 MIN`, and a VO₂ rep authored in
    // seconds with no distance gave `5 × 0 MI` — both from assuming the shape.
    if (main.distance != null) return `${main.repeat_count} × ${+main.distance} MI`;
    if (main.duration_seconds != null) {
      return main.duration_seconds % 60 === 0
        ? `${main.repeat_count} × ${main.duration_seconds / 60} MIN`
        : `${main.repeat_count} × ${main.duration_seconds} S`;
    }
  }
  return `${+session.distance} MI`;
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
  const rows = DAYS.map((day) => `<tr><th>${day[0] + day.slice(1).toLowerCase()}</th>` + plan.weeks.map((w) =>
    `<td${mark(w)}>${esc(cell(byDay(w)[day]) || 'Rest')}</td>`).join('') + '</tr>').join('');
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
