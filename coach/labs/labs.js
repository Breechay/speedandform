// FORM LABS
//
// Labs is where you coach. The Console is where you build a block. Reading what
// came back, deciding what it means and choosing what changes is judgment, and
// judgment wants composition; typing fifteen weeks of sessions into a schema is
// data entry, and data entry wants a form. This surface takes the verbs that get
// used weekly and leaves authoring where the dialog already works.
//
// It replaces the Console's information architecture, not its machine. Auth,
// RLS, private/data.js and every write function are imported unchanged, and
// /coach/ stays live.
//
// Three views in one document, so navigating costs no round trip:
//   #/bench            every athlete, one column each
//   #/a/:slug          one athlete
//   #/a/:slug/block    the whole campaign
//
// GEOMETRY NOTE, and it governs the whole file: style-src is 'self' on /coach/*.
// A style="" attribute written into markup is dropped silently. Every value that
// varies — a portrait crop, a bar height, the number of columns in a rail —
// travels through element.style.setProperty in paint(), which the CSP allows.
// Nothing in this file writes a style attribute into a template string.

import { authErrorMessage, getAccessContext } from '/private/auth.js';
import { createRead, loadAthleteRecord, loadAttentionFor, loadCoachBench, setExceptionStatus } from '/private/data.js';
import { escapeHtml } from '/private/record.js';
import { authoredMiles, dayLabel, rangeLabel, structureOf, titleAlreadySays } from '/private/render.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const sheet = document.getElementById('sheet');
const shScrim = document.getElementById('shScrim');

let access = null;
let bench = [];
let record = null;
let attention = [];
let pending = null;

const today = () => new Date().toISOString().slice(0, 10);
const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// ── reading the rows ────────────────────────────────────────────────────────

// A session's character, read from what it asks for rather than from its name.
// A banded work component is quality; an unbanded long distance is the long run;
// everything else is easy. Nothing here is stored, and nothing here is evidence:
// it decides a border colour.
function characterOf(session) {
  const parts = (session?.currentVersion?.components || []).filter((part) => part.role === 'work');
  if (!parts.length) return 'easy';
  const banded = parts.some((part) => part.pace_low_seconds != null);
  const miles = authoredMiles(session.currentVersion) || 0;
  if (banded) return 'quality';
  if (miles >= 8) return 'long';
  return 'easy';
}

const titleOf = (session) => session?.currentVersion?.title || session?.day_label || 'Session';

// What a session asks for, in one line, off the typed components. Falls back to
// the version's own distance when a session was authored with no anatomy — which
// is most of what the Console has written, and saying "9 mi" is honest where
// inventing a structure would not be.
function doseLine(session) {
  const version = session?.currentVersion;
  if (!version) return '';
  const structured = structureOf(version);
  if (structured) return structured;
  if (version.prescribed_distance != null) return `${Number(version.prescribed_distance)} ${version.distance_unit || 'mi'}`;
  if (version.prescribed_duration_minutes != null) return `${version.prescribed_duration_minutes} min`;
  return '';
}

const clock = (seconds) => {
  if (seconds == null) return null;
  const total = Math.round(Number(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// The splits line under a filing. Pace is stored per piece in seconds per mile
// and never recomputed from a rounded distance, so this reads them out rather
// than deriving anything.
function splitsLine(completion, pieces) {
  if (!completion) return '';
  const work = pieces.filter((piece) => piece.kind === 'rep').sort((a, b) => a.position - b.position);
  const paces = work.map((piece) => clock(piece.pace_seconds)).filter(Boolean);
  const bits = [];
  if (paces.length) bits.push(paces.join(' / '));
  else if (completion.actual_distance != null) bits.push(`${Number(completion.actual_distance)} ${completion.distance_unit || 'mi'}`);
  if (completion.rpe != null) bits.push(`RPE ${completion.rpe}`);
  if (completion.surface) bits.push(completion.surface);
  return bits.join(' · ');
}

// The plate behind a monogram. Deterministic from the slug so an athlete's
// column looks the same every morning. It is a background, not a fact.
const plateOf = (slug) => ['', ' warm', ' cool'][String(slug || '').length % 3];

// ── the bench ───────────────────────────────────────────────────────────────

// The race, in the words the block carries. `target_event` is a distance in a
// field that reads as an event — "Half marathon" — so it is the fallback and not
// the source. A block with no place named renders no place.
function raceLine(athlete, block) {
  const named = [block?.race_name, block?.race_place].filter(Boolean).join(' · ');
  return [named || athlete?.target_event, block?.race_on ? dayLabel(block.race_on) : null]
    .filter(Boolean).join(' · ');
}


// The caption under an instrument figure. A mark labelled "miles owned" already
// says its unit, and "MI MILES OWNED" is the same word twice; a mark labelled
// "owned" does not, and needs it. The label is authored, so which case applies
// is not knowable in advance — it is read off the words.
function instrumentWords(mark) {
  const label = String(mark.label || '').trim();
  const unit = String(mark.unit || '').trim();
  if (!unit) return label.toUpperCase();
  if (!label) return unit.toUpperCase();
  return (titleAlreadySays(label, unit) ? label : `${unit} ${label}`).toUpperCase();
}


// The note is one line and it is about what to do, not a transcript.
//
// `coach_attention` hands back a generic title and whatever the athlete wrote —
// José's symptom report is 238 characters of his own words, and two athletes
// both read "Waiting on your reply. Completed · 3.0 mi", which is a template
// wearing the place of a sentence. Neither belongs on a column.
//
// So each kind gets a short factual line naming the thing and when. The words
// themselves are on the athlete's page, which is where a report gets read.
function noteFor(item) {
  if (!item) return '';
  const when = item.occurred_at ? dayLabel(item.occurred_at.slice(0, 10)) : null;
  const on = when ? ` ${when}` : '';
  switch (item.kind) {
    case 'athlete_report':   return `Reported something${on}. Unread.`;
    case 'recovery_flag':    return `Recovery did not settle${on}.`;
    case 'unread_session':   return `Filed${on}, unread.`;
    case 'missing_direction':return `${item.summary || 'A session is due'} — no instructions.`;
    case 'authored':         return item.title || 'Waiting on you.';
    default:                 return item.title || '';
  }
}

function columnHtml(entry) {
  const race = raceLine(entry, entry.block);
  const week = entry.currentWeek && entry.block?.total_weeks
    ? `Week ${entry.currentWeek.week_number} of ${entry.block.total_weeks}` : '';
  const due = entry.today;
  const last = entry.latestCompletion;

  const registers = [];
  registers.push(`<div><div class="lab">GOAL</div><div class="goal">${
    entry.goal_label ? escapeHtml(entry.goal_label) : '<span class="dim">Not set</span>'
  }</div></div>`);

  if (due) {
    registers.push(`<div><div class="lab">TODAY</div><div class="val">${escapeHtml(doseLine(due) || titleOf(due))}</div></div>`);
  } else if (last) {
    registers.push(`<div><div class="lab">LAST · ${escapeHtml(dayLabel(last.filed_at.slice(0, 10)).toUpperCase())}</div><div class="val">${
      escapeHtml(splitsLine(last, entry.latestPieces) || 'Filed')
    }</div></div>`);
  } else {
    registers.push('<div><div class="lab">EVIDENCE</div><div class="val"><span class="dim">Nothing filed since the block opened</span></div></div>');
  }

  if (entry.next) {
    // NEXT KEY, because it is. "NEXT" reads as the very next thing on their
    // calendar and invites you to think the week is three sessions long.
    registers.push(`<div><div class="lab">NEXT KEY · ${escapeHtml(String(entry.next.day_label).slice(0, 3).toUpperCase())}</div><div class="val dim">${
      escapeHtml(doseLine(entry.next) || titleOf(entry.next))
    }</div></div>`);
  }

  // The note is the top of this athlete's queue, in the queue's own words. An
  // athlete's own report reads coral; everything else is the coach's own list.
  const item = entry.topItem;
  const noteClass = item && item.kind === 'athlete_report' ? 'note amb' : 'note';
  const note = noteFor(item);

  // Null is a state and not a gap. An athlete with nothing established gets the
  // em dash rather than a number, and the caption says so in words.
  const mark = entry.mark;
  const figure = mark?.current_value != null
    ? `<b>${escapeHtml(Number(mark.current_value))}</b><span>${escapeHtml(instrumentWords(mark))}</span>`
    : '<b class="none">—</b><span>NOTHING ESTABLISHED</span>';

  return `<button class="col${entry.attention.length ? ' needs' : ''}" type="button" data-slug="${escapeHtml(entry.slug)}">
    <div class="plate${plateOf(entry.slug)}"></div><div class="mono">${escapeHtml((entry.first_name || '?')[0])}</div>
    <img data-portrait="${escapeHtml(entry.slug)}" alt="">
    <div class="tint"></div><div class="scrim"></div>
    <div class="body">
      <div class="nameBlk"><div class="name">${escapeHtml(entry.first_name)}</div>
        <div class="meta">${escapeHtml(race)}</div><div class="week">${escapeHtml(week)}</div></div>
      <div class="regs">${registers.join('')}</div>
      <div class="${noteClass}">${escapeHtml(note)}</div>
      <div class="inst">${figure}</div>
    </div>
  </button>`;
}

// Ordered by who needs you, then by how close the race is.
//
// The roster order was stable and alphabetical, which put the athlete with an
// unread symptom off the right edge of the screen. Position is how you find
// someone, so this is a real trade — but a bench whose first column is never the
// urgent one is a queue you have to scroll to use.
function benchOrder(a, b) {
  const urgency = (entry) => entry.topItem ? (entry.topItem.priority ?? 99) : 999;
  if (urgency(a) !== urgency(b)) return urgency(a) - urgency(b);
  const race = (entry) => entry.block?.race_on || '9999-12-31';
  return race(a).localeCompare(race(b));
}

function benchHtml() {
  if (!bench.length) return '<div class="failed"><h1>No athletes yet.</h1><p>This account holds no coach memberships.</p></div>';
  const ordered = bench.slice().sort(benchOrder);
  return `<main class="view on"><div class="bench">${ordered.map(columnHtml).join('')}</div><div class="benchEdge"></div></main>`;
}

// ── the athlete ─────────────────────────────────────────────────────────────

// The ladder. Rungs are checkpoints on the primary mark, in authored order,
// carrying the state Brice put them in. No dates: a checkpoint does not know
// which session would establish it, and inventing one from the calendar would be
// a guess wearing a date.
function ladderHtml() {
  const mark = record.primaryMark;
  const rungs = (mark?.checkpoints || []).slice().sort((a, b) => a.position - b.position);
  if (!rungs.length) return '';
  const stateWord = { reached: 'REACHED', current: 'CURRENT', proposed: 'AHEAD', repeated: 'REPEATED', retired: 'RETIRED' };
  const cls = (state) => state === 'reached' ? 'rung done' : state === 'current' ? 'rung next' : 'rung';
  return `<div class="h">${escapeHtml(String(mark.label || 'The ladder').toUpperCase())}${
    mark.current_question ? `<span class="qual"> · ${escapeHtml(mark.current_question)}</span>` : ''
  }</div>
  <div class="rail" data-rungs="${rungs.length}">${rungs.map((rung) => `
    <div class="${cls(rung.state)}"><div class="dot"></div>
      <div class="work">${escapeHtml(Number(rung.value))}${mark.unit ? ` ${escapeHtml(mark.unit)}` : ''}</div>
      <div class="at">${escapeHtml(rung.label || '')}</div>
      <div class="state">${escapeHtml(stateWord[rung.state] || String(rung.state).toUpperCase())}</div></div>`).join('')}
  </div>`;
}

// What the plan asks of this week. The authored number only — the watch total is
// Strava, and Strava is not ours until laps ingest lands. A comparison drawn
// against a number the system does not hold would be hand-written.
function loadHtml() {
  const week = record.currentWeek;
  if (!week) return '';
  const sessions = record.sessionsByWeek?.[week.id] || [];
  const miles = sessions.reduce((total, session) => total + (authoredMiles(session.currentVersion) || 0), 0);
  if (!miles) return '';
  return `<div class="loop cont"><span class="then">AUTHORED</span>
    <span><b>${Number(miles.toFixed(1))} mi</b> in week ${escapeHtml(week.week_number)}, across ${sessions.length} session${sessions.length === 1 ? '' : 's'}.</span></div>`;
}

// The newest filing, and the facts that belong to it.
//
// ATHLETE is the athlete's own words off the filing. SYMPTOM is a report they
// made, immutable, read from session_exception_state. FORM and PATTERN are the
// coach's standing interpretation and have no table yet, so they are absent
// rather than approximated.
function evidenceHtml() {
  const completion = (record.completions || [])[0];
  if (!completion) {
    return `<div class="hRow"><div class="h">LATEST EVIDENCE</div></div>
      <p class="empty">Nothing filed yet. No evidence is not no ability.</p>`;
  }
  const pieces = (record.pieces || []).filter((piece) => piece.completion_id === completion.id);
  const session = (record.sessions || []).find((item) => item.id === completion.planned_session_id) || null;
  const facts = [];
  const said = [completion.felt, completion.athlete_note].filter(Boolean).join(' ');
  if (said) facts.push(`<div class="fact"><div class="src a">ATHLETE</div><p>${escapeHtml(said)}</p></div>`);
  (record.exceptions || [])
    .filter((exception) => exception.completion_id === completion.id)
    .forEach((exception) => {
      facts.push(`<div class="fact"><div class="src sym">${escapeHtml(String(exception.kind).replace('_', ' ').toUpperCase())}</div>
        <p class="said">${escapeHtml(exception.detail)}
        <small>${exception.status === 'open' ? 'Filed by them. Nobody has read it.' : 'Read filed against it.'}</small></p></div>`);
    });

  return `<div class="hRow"><div class="h">LATEST EVIDENCE</div></div>
    <div class="evHead"><div class="evWork">${escapeHtml(session ? titleOf(session) : 'Unattached run')}</div>
      <div class="evDate">${escapeHtml(dayLabel(completion.filed_at.slice(0, 10)).toUpperCase())}</div></div>
    <div class="evSplits">${escapeHtml(splitsLine(completion, pieces))}</div>
    ${facts.length ? `<div class="facts">${facts.join('')}</div>` : '<p class="empty">Filed with no words against it.</p>'}`;
}

// The open reports, and the one verb that clears them. A read is what you
// concluded, tied to the evidence that produced it — one object, one label.
function openHtml() {
  const open = (record.exceptions || []).filter((exception) => exception.status === 'open');
  if (!open.length) {
    return `<div class="h">OPEN</div><p class="empty section">Nothing open. The bench is quiet for ${escapeHtml(record.athlete.first_name)}.</p>`;
  }
  return open.map((exception) => `<div class="hRow"><div class="h">OPEN</div>
      <button class="act" type="button" data-read="${escapeHtml(exception.id)}" data-completion="${escapeHtml(exception.completion_id || '')}">Read it</button></div>
    <div class="horizon" data-open="${escapeHtml(exception.id)}">
      <div class="fig sm">${escapeHtml(sentence(String(exception.kind).replace('_', ' ')))}</div>
      <p>${escapeHtml(exception.detail)}</p>
    </div>`).join('');
}

function athleteHtml() {
  const athlete = record.athlete;
  const block = record.block;
  const week = record.currentWeek;
  const race = raceLine(athlete, block);
  const standing = week && block?.total_weeks ? `week ${week.week_number} of ${block.total_weeks}` : '';

  return `<main class="view on"><div class="stage">
    <div class="pane">
      <div class="plate${plateOf(athlete.slug)}"></div><div class="mono">${escapeHtml((athlete.first_name || '?')[0])}</div>
      <img data-portrait="${escapeHtml(athlete.slug)}" alt="">
      <div class="tint"></div><div class="paneFloor"></div>
      <div class="plateName">
        <h1>${escapeHtml(athlete.first_name)}</h1>
        <div class="race">${escapeHtml(race)}</div>
        <div class="pr">${escapeHtml(standing)}</div>
      </div>
    </div>
    <div class="fold">
      <button class="back" type="button" data-nav="bench">← Bench</button>
      <button class="back alt" type="button" data-nav="block">The block →</button>

      <div class="section">
        <div class="h">GOAL</div>
        <p class="goalLine">${athlete.goal_label ? escapeHtml(athlete.goal_label) : '<span class="dim">Not set</span>'}</p>
      </div>

      <div class="rule"></div>
      ${ladderHtml()}
      ${loadHtml()}
      <div class="rule"></div>

      <div class="cols">
        <div>${evidenceHtml()}</div>
        <div>
          <div class="h">WHAT HELPS ${escapeHtml(String(athlete.first_name).toUpperCase())}</div>
          <p class="empty section">Standing facts have no table yet. This section fills when they do.</p>
          <div class="rule tight"></div>
          ${openHtml()}
        </div>
      </div>
    </div>
  </div></main>`;
}

// ── the block ───────────────────────────────────────────────────────────────

// A chip's quote is the session's intent, and it is shown only when this block
// says it once. intent is not null, so a plan authored from one sentence would
// print that sentence thirty times and teach the eye to skip it — the quote is
// there for the session that has something of its own to say. Silence is the
// default, not the failure.
// A weekly budget has no day. It is the week's easy running as one authored
// quantity — 18 miles at 8:45 or slower — and it carries no scheduled_on,
// because "Monday" would be a lie about work the athlete spreads across four
// mornings. Its label is the whole word, not a three-letter stump.
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
function dayChip(session) {
  const label = String(session.day_label || '').toUpperCase();
  if (WEEKDAYS.includes(label.slice(0, 3))) return sentence(label.slice(0, 3).toLowerCase());
  return sentence(label.toLowerCase());
}

function chipHtml(session, filed, voices) {
  const classes = ['chip', characterOf(session)];
  if (session.state === 'cancelled') classes.push('canx');
  if (filed) classes.push('filed');
  const own = session.currentVersion?.intent;
  const intent = own && voices.get(own) === 1 ? own : null;
  return `<div class="${classes.join(' ')}">
    <b>${escapeHtml(dayChip(session))}</b>
    <span>${escapeHtml(titleOf(session))}</span>
    <em>${escapeHtml(doseLine(session))}</em>
    ${intent ? `<q>${escapeHtml(intent)}</q>` : ''}</div>`;
}

function blockHtml() {
  const block = record.block;
  const weeks = (record.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
  if (!block || !weeks.length) {
    return '<main class="view on"><div class="block"><div class="failed"><h1>No active block.</h1><p>Nothing is authored for this athlete yet.</p></div></div></main>';
  }
  const filedFor = new Set((record.completions || []).map((item) => item.planned_session_id).filter(Boolean));
  const voices = new Map();
  (record.sessions || []).forEach((session) => {
    const intent = session.currentVersion?.intent;
    if (intent) voices.set(intent, (voices.get(intent) || 0) + 1);
  });
  const now = today();
  const current = record.currentWeek;

  const upcoming = (record.sessions || [])
    .filter((session) => session.scheduled_on && session.scheduled_on >= now && session.state !== 'cancelled')
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on)).slice(0, 4);

  const milesFor = (week) => (record.sessionsByWeek?.[week.id] || [])
    .reduce((total, session) => total + (authoredMiles(session.currentVersion) || 0), 0);
  const peak = Math.max(1, ...weeks.map(milesFor));

  const strip = weeks.map((week) => {
    const sessions = record.sessionsByWeek?.[week.id] || [];
    const banded = sessions.some((session) => characterOf(session) === 'quality');
    return `<div class="sw${week.id === current?.id ? ' cur' : ''}" data-week="${escapeHtml(week.id)}"
      data-height="${Math.round((milesFor(week) / peak) * 52)}"><i class="${banded ? 'q' : 'l'}"></i></div>`;
  }).join('');

  const rows = weeks.map((week) => {
    const sessions = (record.sessionsByWeek?.[week.id] || []).slice()
      .sort((a, b) => (a.scheduled_on || '').localeCompare(b.scheduled_on || '') || a.position - b.position);
    const out = block.race_on && week.starts_on
      ? Math.max(0, Math.round((new Date(block.race_on) - new Date(week.starts_on)) / 604800000)) : null;
    const miles = milesFor(week);
    const chips = sessions.length
      ? sessions.map((session) => chipHtml(session, filedFor.has(session.id), voices)).join('')
      : '<div class="chip hole"><b>—</b><span>Nothing published</span><em>this week is unwritten</em></div>';
    return `<div class="wrow${week.id === current?.id ? ' cur' : ''}${sessions.length ? '' : ' empty'}" id="wk-${escapeHtml(week.id)}">
      <div class="wmeta"><b class="wn">W${escapeHtml(week.week_number)}</b>
        <span>${escapeHtml(rangeLabel(week.starts_on, week.ends_on))}${out != null ? ` · ${out} out` : ''}</span>
        <em>${miles ? `${Number(miles.toFixed(1))} mi` : '—'}</em></div>
      <div class="chips">${chips}</div></div>`;
  }).join('');

  const holes = weeks.filter((week) => !(record.sessionsByWeek?.[week.id] || []).length);
  const cancelled = (record.sessions || []).filter((session) => session.state === 'cancelled');
  const authored = weeks.reduce((total, week) => total + milesFor(week), 0);

  return `<main class="view on"><div class="block">
    <div class="bHead"><div>
      <button class="back" type="button" data-nav="athlete">← ${escapeHtml(record.athlete.first_name)}</button>
      <div class="bTitle">${escapeHtml(`${block.total_weeks} weeks`)}${
        block.race_on ? ` to ${escapeHtml(block.race_place || block.race_name || record.athlete.target_event || 'the race')}` : ''}</div>
      <div class="bSub">${escapeHtml(rangeLabel(block.starts_on, block.race_on || block.ends_on))}${
        current ? ` · week ${escapeHtml(current.week_number)}` : ''}</div>
    </div></div>

    ${upcoming.length ? `<div class="nextUp"><div class="nuLab">NEXT UP</div><div class="nuRow">${
      upcoming.map((session) => `<div class="nu"><b>${escapeHtml(session.scheduled_on === now ? 'today' : dayLabel(session.scheduled_on))}</b>
        <span>${escapeHtml(titleOf(session))}</span><em>${escapeHtml(doseLine(session))}</em></div>`).join('')
    }</div></div>` : ''}

    <div class="strip"><div class="stripLab">SHAPE</div><div class="stripGrid" data-weeks="${weeks.length}">${strip}</div></div>
    <div class="swk"><div></div><div class="swkGrid" data-weeks="${weeks.length}">${
      weeks.map((week) => `<span class="${week.id === current?.id ? 'cur' : ''}">W${escapeHtml(week.week_number)}</span>`).join('')
    }</div></div>

    <div class="planLab">THE PLAN</div>
    ${rows}

    <div class="bFoot">
      <div><h4>WHAT IS AUTHORED</h4><p>The plan holds <b>${Number(authored.toFixed(0))} mi</b> across ${weeks.length} weeks.
        What the watch recorded is not in this system yet.</p></div>
      <div><h4>HOLES</h4>${
        holes.length
          ? holes.map((week) => `<p class="alarm">Week ${escapeHtml(week.week_number)} has nothing published.</p>`).join('')
          : '<p>Every week is written.</p>'
      }</div>
      <div><h4>CANCELLED</h4>${
        cancelled.length
          ? `<p>${cancelled.map((session) => escapeHtml(titleOf(session))).join('. ')}.</p>`
          : '<p>Nothing cancelled.</p>'
      }</div>
    </div>
  </div></main>`;
}

// ── paint: every geometric value, after render, through the CSSOM ───────────

function paint() {
  const portraits = new Map(bench.map((entry) => [entry.slug, entry]));
  if (record?.athlete) portraits.set(record.athlete.slug, record.athlete);
  document.querySelectorAll('[data-portrait]').forEach((img) => {
    const athlete = portraits.get(img.dataset.portrait);
    const url = athlete?.portraitUrl;
    if (url) { img.setAttribute('src', url); img.classList.add('has-photo'); }
    else { img.removeAttribute('src'); img.classList.remove('has-photo'); }
    if (!athlete) return;
    img.style.setProperty('--px', `${athlete.portrait_x ?? 50}%`);
    img.style.setProperty('--py', `${athlete.portrait_y ?? 40}%`);
    img.style.setProperty('--pz', String(athlete.portrait_zoom ?? 1));
    img.style.setProperty('--exp', String(athlete.portrait_exposure ?? 0.9));
    img.style.setProperty('--con', String(athlete.portrait_contrast ?? 1.16));
    img.style.setProperty('--grade', String(athlete.portrait_grade ?? 0.2));
  });
  document.querySelectorAll('[data-rungs]').forEach((rail) => rail.style.setProperty('--n', rail.dataset.rungs));
  document.querySelectorAll('[data-weeks]').forEach((grid) => grid.style.setProperty('--n', grid.dataset.weeks));
  document.querySelectorAll('[data-height]').forEach((bar) => {
    bar.querySelector('i')?.style.setProperty('--h', `${Math.max(3, Number(bar.dataset.height))}px`);
  });
}

// ── the read drawer ─────────────────────────────────────────────────────────

function openRead(exceptionId, completionId) {
  const exception = (record.exceptions || []).find((item) => item.id === exceptionId);
  pending = { exceptionId, completionId: completionId || exception?.completion_id || null };
  document.getElementById('shKind').textContent = 'FILE A READ';
  document.getElementById('shTitle').textContent = exception ? sentence(String(exception.kind).replace('_', ' ')) : 'Read';
  document.getElementById('shSub').textContent = `${record.athlete.first_name} · this clears the open item`;
  document.getElementById('shNote').textContent = 'A read is what you concluded, not what happened.';
  document.getElementById('shBody').innerHTML = `
    <div class="f"><label>WHAT IT MEANS</label>
      <textarea id="readText"></textarea>
      <div class="hint">This is what reaches them. Their words are already on file; this is yours.</div></div>
    <div class="f"><label>WHAT CHANGES</label><input id="readChange"></div>
    <div class="f"><label>WHY THE REPORT IS CLOSED</label><input id="readReason">
      <div class="hint">Required. It is written beside the report, permanently, with your name on it.</div></div>
    <p class="hint err" id="readError"></p>`;
  sheet.classList.add('on'); shScrim.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
  document.getElementById('readText').focus();
}

function closeSheet() {
  sheet.classList.remove('on'); shScrim.classList.remove('on');
  sheet.setAttribute('aria-hidden', 'true'); pending = null;
}

// One write, then one status change, then the record is re-read. The read is
// what clears the item; the status change is what records that it was cleared
// and why. Both name the evidence.
async function keepRead() {
  if (!pending) { closeSheet(); return; }
  const error = document.getElementById('readError');
  const text = document.getElementById('readText').value.trim();
  const change = document.getElementById('readChange').value.trim();
  const reason = document.getElementById('readReason').value.trim();
  if (!text) { error.textContent = 'A read needs your conclusion.'; return; }
  if (!reason) { error.textContent = 'Closing a report needs your reason.'; return; }
  const button = document.getElementById('shSave');
  button.disabled = true; error.textContent = '';
  try {
    await createRead({
      athleteId: record.athlete.id,
      athleteText: change ? `${text}\n\n${change}` : text,
      questionAnswered: 'What this report means',
      completionIds: pending.completionId ? [pending.completionId] : []
    });
    await setExceptionStatus(pending.exceptionId, 'reviewed', reason);
    closeSheet();
    await selectAthlete(record.athlete.slug, { silent: true });
  } catch (failure) {
    error.textContent = failure.message;
  } finally { button.disabled = false; }
}

// ── routing ─────────────────────────────────────────────────────────────────

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [kind, slug, leaf] = hash.split('/');
  if (kind === 'a' && slug) return { view: leaf === 'block' ? 'block' : 'athlete', slug };
  return { view: 'bench' };
}

function markNav(view, slug) {
  nav.hidden = false;
  nav.querySelectorAll('button').forEach((button) => button.classList.remove('on'));
  const which = view === 'bench' ? 'bench' : view === 'block' ? 'block' : null;
  if (which) nav.querySelector(`[data-nav="${which}"]`)?.classList.add('on');
  nav.querySelector('[data-nav="block"]').hidden = !slug;
}

async function selectAthlete(slug, { silent = false } = {}) {
  const entry = bench.find((item) => item.slug === slug);
  if (!entry) { location.hash = '#/bench'; return; }
  if (!silent) app.innerHTML = '<div class="loading">READING THE RECORD</div>';
  record = await loadAthleteRecord(entry.id, { coach: true });
  attention = await loadAttentionFor(entry.id);
  render();
}

function render() {
  const { view, slug } = route();
  if (view === 'bench') app.innerHTML = benchHtml();
  else if (view === 'block') app.innerHTML = blockHtml();
  else app.innerHTML = athleteHtml();
  markNav(view, slug);
  paint();
}

async function show() {
  const { view, slug } = route();
  if (view === 'bench') { render(); return; }
  if (record?.athlete?.slug !== slug) { await selectAthlete(slug); return; }
  render();
}

// ── binding ─────────────────────────────────────────────────────────────────

document.addEventListener('click', (event) => {
  const column = event.target.closest('[data-slug]');
  if (column) { location.hash = `#/a/${column.dataset.slug}`; return; }

  const read = event.target.closest('[data-read]');
  if (read) { openRead(read.dataset.read, read.dataset.completion); return; }

  const week = event.target.closest('[data-week]');
  if (week) { document.getElementById(`wk-${week.dataset.week}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  const go = event.target.closest('[data-nav]');
  if (!go) return;
  const where = go.dataset.nav;
  if (where === 'console') { location.href = '/coach/console/'; return; }
  if (where === 'bench') { location.hash = '#/bench'; return; }
  const slug = record?.athlete?.slug || route().slug;
  if (!slug) return;
  location.hash = where === 'block' ? `#/a/${slug}/block` : `#/a/${slug}`;
});

document.getElementById('shClose').addEventListener('click', closeSheet);
document.getElementById('shCancel').addEventListener('click', closeSheet);
shScrim.addEventListener('click', closeSheet);
document.getElementById('shSave').addEventListener('click', keepRead);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSheet(); });
window.addEventListener('hashchange', () => { show().catch(fail); });

// Signed portrait URLs last an hour and this tab stays open all day. Re-signing
// on return is cheaper than a longer signature.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !access) return;
  loadCoachBench(access.coachMemberships).then((rows) => { bench = rows; paint(); }).catch(() => {});
});

function fail(error) {
  app.innerHTML = `<div class="failed"><p class="h">COULD NOT OPEN THE BENCH</p>
    <h1>Try that again.</h1><p>${escapeHtml(authErrorMessage(error))}</p>
    <button type="button" id="retry">Retry</button></div>`;
  document.getElementById('retry').addEventListener('click', () => window.location.reload());
}

async function boot() {
  try {
    document.getElementById('stamp').textContent = new Date().toLocaleDateString(undefined,
      { weekday: 'short', day: 'numeric', month: 'short' });
    access = await getAccessContext();
    if (!access.session) { location.href = '/coach/console/'; return; }
    if (!access.coachMemberships.length) { location.href = '/coach/console/'; return; }
    bench = await loadCoachBench(access.coachMemberships);
    if (!location.hash) location.hash = '#/bench';
    await show();
  } catch (error) { fail(error); }
}

boot();
