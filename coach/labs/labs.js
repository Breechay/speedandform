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
import { addObservation, createRead, fileForAthlete, loadAthleteRecord, loadAttentionFor, loadCoachBench, reviseSession, rungFor, savePortrait, setExceptionStatus } from '/private/data.js';
import { escapeHtml } from '/private/record.js';
import { authoredMiles, dayLabel, initials, rangeLabel, structureOf, titleAlreadySays, workMiles } from '/private/render.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const sheet = document.getElementById('sheet');
const shScrim = document.getElementById('shScrim');

// COACH VIEW / ATHLETE VIEW.
//
// One prescription, two capabilities. The renderer is shared on purpose: if the
// athlete's plan were drawn by different code it would drift within a fortnight,
// and the first anyone would know is an athlete running a session the coach
// thinks he replaced. So `viewAs` changes what you can DO and what peripheral
// coaching material you can see — it must never fork prescription rendering.
//
// The athlete sees the prescription, the session, what they filed, and the
// question their block is asking. They do not see how the prescription came to
// be: revisions, version numbers, audit conditions, the coach's reads. That is
// not secrecy, it is scope — authorship mechanics are the coach's instrument and
// decoding them is not part of running on Tuesday.
//
// The law is PRESCRIPTION read-only, not read-only. The distinction matters
// because the athlete's half of this surface is not finished: RPE, a note, a
// photograph, an answer to the week's question are all athlete-owned reporting,
// and every one of them is a write this mode must be able to grow into. What
// the athlete can never do is author or alter the work.
//
// The toggle itself is a Labs instrument — a coach checking what he is about to
// send. A signed-in athlete does not receive a control that offers them the
// coach's eyes; their identity decides their `viewAs`, and nothing else does.
let viewAs = 'coach';
const asCoach = () => viewAs === 'coach';

let access = null;
let bench = [];
let record = null;
let attention = [];
let pending = null;

// Local, not UTC. toISOString rolls over at 8pm Eastern, so every surface that
// asks "is this today" — the week view's marker, whether a session can be filed,
// whether it can still be revised — was four hours ahead of the athlete from
// evening onward. Caught by the week view putting the lime bar on Saturday.
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
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

// What the last key session SAID. Prescription, then what came back, then a
// verdict in four words.
//
// The bench was answering "what state is this athlete in" — goal, last filed,
// instrument — when the question you open it with is "what did the hard work say
// and what does the next one ask". Splits without the band they were run against
// are a number with no question attached, and "10 mi" for a long run with two at
// race pace is the wrong session entirely.
function heldTheBand(completion, pieces, version) {
  const work = (version?.components || []).find((part) => part.role === 'work' && part.pace_low_seconds != null);
  const reps = pieces.filter((piece) => piece.kind === 'rep' && piece.pace_seconds != null);
  if (!work || !reps.length) return null;
  const inside = reps.filter((piece) => piece.pace_seconds >= work.pace_low_seconds
    && piece.pace_seconds <= (work.pace_high_seconds ?? Infinity)).length;
  const asked = work.repeat_count || work.repeat_target;
  const short = asked && reps.length < asked ? `, stopped at ${reps.length} of ${asked}` : '';
  if (inside === reps.length) return `held the band${short}`;
  // Which way it missed, not just that it did. Running under a band is a
  // different conversation from falling off it, and "1 of 4 inside" tells you
  // neither.
  const fast = reps.filter((piece) => piece.pace_seconds < work.pace_low_seconds).length;
  const slow = reps.length - inside - fast;
  const way = fast > slow ? 'under' : 'over';
  if (inside === 0) return `${way} the band throughout${short}`;
  return `${inside} of ${reps.length} inside, the rest ${way}${short}`;
}

// THE COLUMN TAKES A POSITION.
//
// A coach opening five athletes on a Friday is asking one thing: is this athlete
// on track, and does anything need me? The card used to show a goal, a date,
// some splits and an unread flag, and leave the judging to be done five times
// from a screen that already had the answer. An overview that will not say
// "this one is fine" is making you do its job.
//
// So the verdict comes first and the evidence sits under it. Weeks to the race,
// not week of the block — 13 weeks out is how you think about whether there is
// time; week 2 of 15 is bookkeeping. And every number against its target,
// because 6.1 owned reads as failure next to 13.1 until you can see both.

function weeksOut(entry) {
  if (!entry.block?.race_on) return null;
  const days = (new Date(`${entry.block.race_on}T12:00:00`) - new Date()) / 86400000;
  return Math.max(0, Math.round(days / 7));
}

// The position, and the sentence that earns it. Derived only from what the card
// already holds: did the last key session land in its band, is anything of
// theirs unread, has anything been filed at all.
// Two instances are a pattern. One is an instance.
//
// Hope went under her band on 25 August and again on 1 September, and the second
// time the third rep cost her. A card that judges only the most recent session
// calls that "running hot" twice and never says the word that matters, which is
// that it is happening repeatedly and has started to take something.
function patternOf(entry) {
  const judged = (entry.judgeable || [])
    .map((filing) => heldTheBand(filing.completion, filing.pieces, filing.version))
    .filter(Boolean);
  if (judged.length < 2) return null;
  const under = judged.filter((verdict) => verdict.includes('under')).length;
  if (under >= 2) return 'under';
  const over = judged.filter((verdict) => verdict.includes('over')).length;
  if (over >= 2) return 'over';
  return null;
}

function standing(entry) {
  const report = (entry.attention || []).find((item) => item.kind === 'athlete_report');
  if (report) {
    return { word: 'Needs you', tone: 'amb',
      because: `Something reported ${dayLabel(report.occurred_at.slice(0, 10))} and nobody has read it.` };
  }
  if (!entry.latestCompletion) {
    // Two different states that used to look identical. Simon is coached in
    // person and the app is optional; Marcus was invited and never opened it.
    // One is a coaching choice and the other is a gap, and a bench that cannot
    // tell them apart nags about both and is wrong about one.
    return entry.delivery === 'coach'
      ? { word: 'Coach-delivered', tone: 'dim',
          because: 'Coached in person. Evidence arrives through you, so nothing here is waiting on him.' }
      : { word: 'No evidence', tone: 'dim',
          because: 'Nothing filed since the block opened. No evidence is not no ability.' };
  }
  const verdict = heldTheBand(entry.latestCompletion, entry.latestPieces, entry.latestVersion);
  const when = dayLabel(entry.latestCompletion.filed_at.slice(0, 10));
  const pattern = patternOf(entry);
  if (pattern === 'under') {
    return { word: 'Watch', tone: 'amb',
      because: 'Second session running where she went under the band early and paid for it late.' };
  }
  if (pattern === 'over') {
    return { word: 'Watch', tone: 'amb',
      because: 'Second session running off the back of the band. The dose is asking too much.' };
  }
  if (verdict?.startsWith('held the band')) {
    return { word: 'On track', tone: 'ok', because: `Held the band ${when}${verdict.includes('stopped') ? ' and stopped where he was told to' : ''}.` };
  }
  if (verdict?.includes('under')) {
    return { word: 'Running hot', tone: 'amb',
      because: `${sentence(verdict)} ${when}. Faster is not better here — the band is the instruction.` };
  }
  if (verdict?.includes('over')) {
    return { word: 'Drifting', tone: 'amb', because: `${sentence(verdict)} ${when}.` };
  }
  const unread = (entry.attention || []).filter((item) => item.kind === 'unread_session').length;
  if (unread) return { word: 'Unread', tone: 'dim', because: `Filed ${when} and waiting on your reply.` };
  return { word: 'On track', tone: 'ok', because: `Filed ${when}. Nothing outstanding.` };
}

// THE BENCH IS AN INSTRUMENT, NOT AN INBOX.
//
// The column used to carry a verdict, the last key session's prescription, its
// execution, the next key session's prescription, the ladder movement, an unread
// flag and the instrument — an athlete record poured into a column, everything
// competing at the same weight, and the whole thing reading as a task list with
// red words on it. "Where is my judgment useful" is a subtler question than an
// alert, and a bench that shouts is a bench you stop looking at.
//
// So three reads, and they work from ten feet away:
//
//     JOSÉ                who
//     2 MI OWNED          what he has established
//     NEEDS A READ        where judgment is useful, quietly
//     NEXT · 5 MI · SEP 8 what is coming
//
// Everything else — the splits, the verdict, the prescription, the athlete's own
// words — is one click away on his page, which is where a thing gets read.

// What the coach is being asked for, in three words or none. Silence is a
// legitimate answer and the commonest one: an athlete who is simply training
// says nothing here.
function askedOf(entry) {
  const item = entry.topItem;
  if (!item) return null;
  const when = item.occurred_at ? dayLabel(item.occurred_at.slice(0, 10)) : null;
  switch (item.kind) {
    case 'athlete_report':    return { word: 'Needs a read', when, live: true };
    case 'recovery_flag':     return { word: 'Recovery did not settle', when, live: true };
    case 'unread_session':    return { word: 'Filed, unread', when, live: false };
    case 'missing_direction': return { word: 'Due without instructions', when, live: true };
    default:                  return { word: item.title || 'Waiting on you', when, live: false };
  }
}

function columnHtml(entry) {
  const mark = entry.mark;
  const out = weeksOut(entry);
  const asked = askedOf(entry);
  const next = entry.next;
  const nextLine = next ? [shortDose(next.currentVersion) || titleOf(next),
    next.scheduled_on ? dayLabel(next.scheduled_on) : null].filter(Boolean).join(' · ') : null;
  const rung = next ? rungFor(next, mark) : null;

  return `<button class="col${entry.portraitUrl ? ' shot' : ''}" type="button" data-slug="${escapeHtml(entry.slug)}">
    <div class="plate${plateOf(entry.slug)}"></div>
    <img data-portrait="${escapeHtml(entry.slug)}" alt="">
    <div class="tint"></div><div class="scrim"></div>
    <div class="body">
      <div class="name">${escapeHtml(entry.first_name)}</div>
      <div class="owned">${mark?.current_value != null
        ? `<b>${escapeHtml(Number(mark.current_value))}</b><span>${escapeHtml(String(mark.unit || 'mi').toUpperCase())} OWNED</span>`
        : '<b class="none">—</b><span>NOT YET ESTABLISHED</span>'}</div>
      <div class="colFoot">
        ${asked ? `<div class="asked${asked.live ? ' live' : ''}">${escapeHtml(asked.word)}${
          asked.when ? `<em>${escapeHtml(asked.when)}</em>` : ''}</div>` : ''}
        ${nextLine ? `<div class="nextUp"><b>NEXT</b><span>${escapeHtml(nextLine)}</span>${
          rung ? '<em>Moves what he owns</em>' : ''}</div>` : ''}
        ${out == null ? '' : `<div class="outIn">${escapeHtml(entry.block?.race_place
          || entry.block?.race_name || entry.target_event || 'Race')} · ${escapeHtml(out)} weeks</div>`}
      </div>
    </div>
  </button>`;
}

// Ordered by who needs you, then by how close the race is.
//
// The roster order was stable and alphabetical, which put the athlete with an
// unread symptom off the right edge of the screen. Position is how you find
// someone, so this is a real trade — but a bench whose first column is never the
// urgent one is a queue you have to scroll to use.
//
// Coach-delivered athletes lead, and that is not a favour to Simon. Attention
// items are produced by the app: a filing, an unread report, a symptom. An
// athlete who does not use the app cannot generate one, so sorting by attention
// puts every coach-delivered athlete permanently last — the bench quietly ranks
// people by how much software they touch. They are also the only ones the app
// will never remind you about, which makes burying them the exact wrong answer.
// So delivery decides the first band, and urgency orders inside it.
function benchOrder(a, b) {
  const delivered = (entry) => entry.delivery === 'coach' ? 0 : 1;
  if (delivered(a) !== delivered(b)) return delivered(a) - delivered(b);
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
  // `current` on a checkpoint means current TARGET, and printing it under a rung
  // the athlete has not reached read as current capability — the page said he
  // owns two while the ladder said five was current. OWNED is what he has; NEXT
  // is what is being asked.
  const stateWord = { reached: 'OWNED', current: 'NEXT', proposed: '', repeated: 'REPEATED', retired: 'RETIRED' };
  const cls = (state) => state === 'reached' ? 'rung done' : state === 'current' ? 'rung next' : 'rung';
  // No question here. The page already asked it, in the size it deserves.
  return `<div class="h">${escapeHtml(String(mark.label || 'The ladder').toUpperCase())}</div>
  <div class="rail" data-rungs="${rungs.length}">${rungs.map((rung) => `
    <div class="${cls(rung.state)}"><div class="dot"></div>
      <div class="work">${escapeHtml(Number(rung.value))}${mark.unit ? ` ${escapeHtml(mark.unit)}` : ''}</div>
      <div class="at">${escapeHtml(rung.label || '')}</div>
      <div class="state">${escapeHtml(stateWord[rung.state] ?? String(rung.state).toUpperCase())}</div></div>`).join('')}
  </div>`;
}

// What the plan asks of this week. The authored number only — the watch total is
// Strava, and Strava is not ours until laps ingest lands. A comparison drawn
// against a number the system does not hold would be hand-written.
// The week's authored mileage used to sit under the ladder as "AUTHORED 39 mi in
// week 2, across 4 sessions" — accounting language on a page whose whole job is
// one coaching thought. Weekly load is a fact about the plan, and the plan has a
// surface. It lives there.
function loadHtml() { return ''; }

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

// THE ATHLETE PAGE HAS ONE DOMINANT THOUGHT.
//
// The photograph said JOSÉ and the right-hand side said goal, ladder, authored,
// latest evidence, what helps, open, symptom — an editorial portrait with a
// dashboard pushed against it, and nothing to look at first. The page already
// knows what it is about, and it is not a goal label:
//
//     RACE PACE DURABILITY
//     How far can he hold 6:30–6:45 without it coming apart?
//     2 MI  continuously owned
//     NEXT  5 mi continuous · Sep 8
//
// The ladder supports that sentence. It is not the sentence.
//
// And the ladder's own words were dangerous: it marked 5 mi CURRENT while the
// page said he owns 2. Five is not current ownership — it is the next question.
// `mark_checkpoints.state` calls the next unreached rung `current`, meaning
// current target; the surface was reading it as current capability. Two is
// OWNED, five is NEXT, and nothing else is emphasised.

// ── STANDING FACTS ──────────────────────────────────────────────────────────
//
// Everything else on this page is an event: a session, a filing, a report. This
// is the other kind of knowledge — what is true about this athlete right now,
// which no amount of scrolling through evidence will tell you. José tolerates
// heat badly. Hope goes under her band when she feels good. Those are the things
// a coach carries in their head and a coaching system should not make them.
//
// Superseded, never overwritten, the same as a judgment: the view hands back the
// newest per facet that nothing has replaced, so the history stays and the page
// shows what stands.
//
// FACETS are deliberately small and deliberately shared with strength athletes.
// WHAT HELPS for a runner and WHAT I'M SEEING for Rod and Devin are one object.
const FACETS = [
  ['helps', 'WHAT HELPS'],
  ['body', 'BODY'],
  ['capacity', 'CAPACITY'],
  ['practice', 'PRACTICE'],
  ['pattern', 'PATTERN'],
  ['aspiration', 'WANTS'],
  ['means', 'MEANS']
];
const FACET_WORD = new Map(FACETS);
const SOURCE_WORD = { athlete_reported: 'They said', coach_observed: 'You saw', system_detected: 'The rule found' };

function observationsHtml() {
  const rows = (record.observations || []).slice()
    .sort((a, b) => String(b.observed_on).localeCompare(String(a.observed_on)));
  const first = record.athlete?.first_name || '';
  return `<div class="hRow">
      <div class="h">WHAT HELPS ${escapeHtml(String(first).toUpperCase())}</div>
      ${asCoach() ? '<button class="act quiet" type="button" data-observe="new">Add</button>' : ''}
    </div>
    ${rows.length
      ? `<div class="stands">${rows.map((row) => `<div class="stand" data-observation="${escapeHtml(row.id)}">
          <div class="standTop">
            <b>${escapeHtml(FACET_WORD.get(row.facet) || String(row.facet).toUpperCase())}</b>
            <span>${escapeHtml(SOURCE_WORD[row.source] || row.source)} · ${
              escapeHtml(dayLabel(String(row.observed_on).slice(0, 10)))}</span>
          </div>
          <p>${escapeHtml(row.observation)}</p>
        </div>`).join('')}</div>`
      : `<p class="empty section">Nothing standing yet. A standing fact is what stays true between
         sessions — how ${escapeHtml(first)} responds to heat, what his week can absorb, what he is
         actually training for. Not an event.</p>`}`;
}

function athleteHtml() {
  const athlete = record.athlete;
  const block = record.block;
  const week = record.currentWeek;
  const mark = record.primaryMark;
  const race = raceLine(athlete, block);
  const standing = week && block?.total_weeks ? `week ${week.week_number} of ${block.total_weeks}` : '';
  const owned = mark?.current_value != null ? Number(mark.current_value) : null;

  // The next question, not the next session: the first coming session that would
  // move what he owns, falling back to the next rung the ladder has not reached.
  const coming = (record.sessions || [])
    .filter((session) => session.scheduled_on && session.scheduled_on >= today()
      && session.state !== 'cancelled')
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on));
  const nextRungSession = coming.find((session) => rungFor(session, mark));
  const nextRung = (mark?.checkpoints || []).slice().sort((a, b) => a.position - b.position)
    .find((rung) => rung.state !== 'reached');
  const nextLine = nextRungSession
    ? `${shortDose(nextRungSession.currentVersion)} continuous · ${dayLabel(nextRungSession.scheduled_on)}`
    : nextRung ? `${Number(nextRung.value)} ${mark?.unit || 'mi'}` : null;

  return `<main class="view on"><div class="stage">
    <div class="pane">
      <div class="plate${plateOf(athlete.slug)}"></div>
      <img data-portrait="${escapeHtml(athlete.slug)}" alt="">
      <div class="tint"></div><div class="paneFloor"></div>
      <div class="plateName">
        <h1>${escapeHtml(athlete.first_name)}</h1>
        <div class="race">${escapeHtml(race)}</div>
        <div class="pr">${escapeHtml(standing)}</div>
      </div>
    </div>
    <div class="fold">
      <div class="hRow">
        <button class="back" type="button" data-nav="bench">← Bench</button>
        <button class="back alt" type="button" data-nav="plan">The plan →</button>
      </div>

      <div class="thesis">
        <div class="h">${escapeHtml(CAP(block?.name || 'The block'))}</div>
        <h1>${escapeHtml(mark?.current_question || block?.goal_statement || athlete.goal_label || '')}</h1>
        <div class="state">
          <div class="owns">
            <b>${owned != null ? escapeHtml(owned) : '—'}</b>
            <span>${escapeHtml(String(mark?.unit || 'mi').toUpperCase())} YOU OWN<br>CONTINUOUSLY</span>
          </div>
          ${nextLine ? `<div class="nextQ"><div class="h">NEXT</div>
            <p>${escapeHtml(nextLine)}</p></div>` : ''}
        </div>
      </div>

      ${ladderHtml()}
      ${loadHtml()}

      <div class="rule"></div>
      <div class="cols">
        <div>${evidenceHtml()}</div>
        <div>
          ${observationsHtml()}
          <div class="rule tight"></div>
          ${openHtml()}
        </div>
      </div>
    </div>
  </div></main>`;
}


// ── THE BRIEF ───────────────────────────────────────────────────────────────
//
// Not a dashboard. Five messages you have not sent yet.
//
// One athlete per block, three questions in order — what they did, what is
// coming, what to ask — and the last one is the point. Everything above it
// exists so the ask is right. A block that does not end in something worth
// saying to a person does not earn its place, so an athlete who is quiet and on
// track gets one line and no block. That absence is information too, and it is
// what stops this becoming a list of chores.
//
// It is dated and it does not persist. Reading it is not an action. The actions
// are Read, and messaging them yourself.

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdayOf = (iso) => SHORT_DAY[new Date(`${iso}T12:00:00`).getDay()];

// A long run is two facts, not one number. Nine miles with two at race pace is
// a different session from nine easy, and "9 mi" cannot tell you which.
function shapeOf(session) {
  const parts = (session?.currentVersion?.components || [])
    .filter((part) => part.role === 'work').sort((a, b) => a.position - b.position);
  const banded = parts.filter((part) => part.pace_low_seconds != null);
  if (parts.length === 2 && banded.length === 1 && parts.every((part) => part.distance != null)) {
    const total = parts.reduce((sum, part) => sum + Number(part.distance), 0);
    const easy = parts.find((part) => part.pace_low_seconds == null);
    return `${Number(total.toFixed(1))} = ${Number(easy.distance)} + ${Number(banded[0].distance)} at band`;
  }
  return doseLine(session) || titleOf(session);
}

// What they did. Days filed, and anything of theirs still sitting unread.
function didLine(entry) {
  const filed = (entry.recentFilings || [])
    .map((item) => weekdayOf(item.filed_at.slice(0, 10)));
  const days = [...new Set(filed)];
  const said = [];
  if (days.length) {
    said.push(`Filed ${days.length === 1 ? days[0] : `${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}`}.`);
  } else if (entry.latestCompletion) {
    said.push(`Nothing filed this week. Last was ${dayLabel(entry.latestCompletion.filed_at.slice(0, 10))}.`);
  } else {
    said.push('Nothing filed since the block opened.');
  }
  const report = (entry.attention || []).find((item) => item.kind === 'athlete_report');
  if (report) said.push(`Reported something ${dayLabel(report.occurred_at.slice(0, 10))}, still unread.`);
  const unread = (entry.attention || []).filter((item) => item.kind === 'unread_session').length;
  if (unread && !report) said.push(`${unread} ${unread === 1 ? 'filing' : 'filings'} still unread.`);
  return said.join(' ');
}

// What is coming. Key work named, easy running counted, nothing padded.
function comingLine(entry) {
  // Every dated session, not only the key ones. The long run is usually what you
  // end up talking about and it is deliberately not flagged key; a coming line
  // that hides it would send you into a conversation missing half the week.
  const coming = entry.coming || [];
  if (!coming.length) return 'Nothing authored in the next seven days.';
  return coming.slice(0, 4)
    .map((session) => `${weekdayOf(session.scheduled_on)} · ${shapeOf(session)}`).join('   ');
}

// The ask, as a draft rather than a prompt. It starts from what actually
// happened — an unread symptom, a first rung, a week with nothing in it — and it
// is written to be edited, not to be obeyed.
const LONG_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const spokenDay = (iso) => LONG_DAY[new Date(`${iso}T12:00:00`).getDay()];

function askFor(entry) {
  const report = (entry.attention || []).find((item) => item.kind === 'athlete_report');
  const firstKey = (entry.coming || []).find((session) => session.role === 'key' && session.scheduled_on);
  // A sentence speaks in full weekdays. The tabular line above it does not.
  const when = firstKey ? spokenDay(firstKey.scheduled_on) : 'the next hard one';
  if (report) {
    // Never quote a fragment of what they wrote. Splitting an athlete's sentence
    // on its first full stop produced "Ask about stopped at 4 and shortened cool
    // down" — their words, mangled, in your voice. Name the report and let the
    // words stay on their page.
    return `Ask about what they reported on ${dayLabel(report.occurred_at.slice(0, 10))} before ${when}.`;
  }
  if ((entry.attention || []).some((item) => item.kind === 'recovery_flag')) {
    return `Ask how the day after landed before ${when}.`;
  }
  if (!entry.latestCompletion) {
    // The line above already said nothing has been filed. Do not say it twice.
    return 'Ask what is getting in the way before authoring anything else.';
  }
  const unread = (entry.attention || []).filter((item) => item.kind === 'unread_session');
  if (unread.length) {
    return `Read ${dayLabel(unread[0].occurred_at.slice(0, 10))} before you write to them.`;
  }
  return null;
}

function briefBlock(entry) {
  const ask = askFor(entry);
  const week = entry.currentWeek && entry.block?.total_weeks
    ? `Week ${entry.currentWeek.week_number} of ${entry.block.total_weeks}` : '';
  if (!ask) {
    return `<div class="bq"><h3>${escapeHtml(entry.first_name)}</h3><p class="bqQuiet">Nothing to raise.</p></div>`;
  }
  return `<div class="bBlock">
    <h3>${escapeHtml(entry.first_name)}<span>${escapeHtml(week)}</span></h3>
    <p class="bDid">${escapeHtml(didLine(entry))}</p>
    <p class="bComing">${escapeHtml(comingLine(entry))}</p>
    <div class="bAsk">
      <textarea class="bAskText" rows="2" data-ask="${escapeHtml(entry.slug)}">${escapeHtml(ask)}</textarea>
      <button class="bCopy" type="button" data-copy="${escapeHtml(entry.slug)}">Copy</button>
    </div>
  </div>`;
}

function briefHtml() {
  const day = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const ordered = bench.slice().sort(benchOrder);
  const speaking = ordered.filter((entry) => askFor(entry));
  const quiet = ordered.filter((entry) => !askFor(entry));
  return `<main class="view on"><div class="brief">
    <div class="bHead"><div><div class="bTitle">The brief</div>
      <div class="bSub">${escapeHtml(day)} · ${speaking.length} to write to${quiet.length ? `, ${quiet.length} quiet` : ''}</div></div></div>
    ${speaking.map(briefBlock).join('')}
    ${quiet.length ? `<div class="bQuiet">${quiet.map(briefBlock).join('')}</div>` : ''}
    <p class="bFoot">This is today's. It is not saved and reading it changes nothing —
      the actions are filing a read, and writing to them yourself.</p>
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

// ── THE PLAN ────────────────────────────────────────────────────────────────
//
// TRANCHE A: the matrix mechanics. Every week of the block across, seven days
// down, the budget outside the dated days, volume in the footer. The hero, the
// pace bands, the week rhythm, the rung marks and THIS WEEK IS FOR are tranches
// B and C and are deliberately absent here rather than half-built.
//
// Built to `the-plan-6.html` as a contract. Three deviations from it, all
// declared before writing rather than discovered after:
//
//   The reference stops at W14. José and Hope are fifteen-week blocks, and a
//   column dropped because the table got wide is a week of someone's life that
//   the plan does not mention. Every week renders.
//
//   The reference's volume row holds a flat 45 for eleven of fourteen weeks.
//   The authored components do not sum to that. This row reports what is
//   authored; whether the plan should hold 45 is a coaching decision and not
//   the view's to make.
//
//   The reference draws Monday, Wednesday and Friday as dated prescriptions.
//   They are not, and they are not orphans either. The plan has two kinds of
//   authored work: KEY SESSIONS, dated and changing week to week — Tuesday
//   quality, Thursday quality or support, Saturday long — and EASY RUNNING,
//   authored once a week as a quantity the athlete places around that spine.
//   A Monday easy run is an ALLOCATION against the week's budget: authored work
//   whose day the athlete chose. So the cell says "from the weekly budget", not
//   "nothing was asked", and the Across the week row stays because it is the
//   source those allocations are drawn from.
//
// One athlete per route, always. José and Hope share a plan by coincidence, not
// by design, and "you own 2 mi" printed under someone else's initial is the one
// thing that must never ship. The reference carries a JOSÉ/HOPE switcher to
// demonstrate that everything resolves per athlete; there is none here, because
// the route already carries the athlete.
//
// GEOMETRY: no cell writes a style attribute. Everything is class-driven, which
// is what style-src 'self' leaves available.
//
// NAMING: not one class here is shared with the bench. `.plate` on a bench
// column is `position:absolute; inset:0` with a gradient on it, and the block
// view reused the name — which is why a translucent rectangle sat over FORM LABS
// and why the hero never appeared. The plan's names all start `pg`.

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Saturday, not Sunday. Hope, José and Simon run their long day on a Saturday;
// the block was authored on the wrong weekday from the start and 25 sessions
// moved on 4 September.
const HEAVY_DAYS = new Set(['Tuesday', 'Thursday', 'Saturday']);

const addDays = (iso, count) => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + count);
  return date.toISOString().slice(0, 10);
};

// The local calendar day a filing belongs to. filed_at is the activity's own
// start instant; the day it lands on is the day the athlete ran.
const filedOn = (completion) => {
  const date = new Date(completion.filed_at);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Weeks until the race, counted from the end of the week. A coach thinks in
// weeks out; "week 2 of 15" is bookkeeping, "13 to go" is the clock.
function weeksOutOf(week, raceOn) {
  if (!raceOn || !week?.ends_on) return null;
  const days = (new Date(`${raceOn}T12:00:00`) - new Date(`${week.ends_on}T12:00:00`)) / 86400000;
  return Math.max(0, Math.ceil(days / 7));
}

// The band a component asks for, in the words it was authored in. A one-sided
// band is a ceiling and reads as one: 8:45 or slower has no floor.
const bandOf = (part) => {
  if (!part || part.pace_low == null) return null;
  return part.pace_high ? `${part.pace_low}–${part.pace_high}` : `${part.pace_low} or slower`;
};

const workParts = (version) => (version?.components || [])
  .filter((part) => part.role === 'work').sort((a, b) => a.position - b.position);

// What the session asks for, in one line, off the typed components — never off
// the title. A single work piece states its quantity and its band; anything
// composite states its structure, because "3 min work" is a lie about eight
// twelve-second hills.
function workLine(version) {
  const parts = workParts(version);
  if (!parts.length) return '';
  if (parts.length > 1) return structureOf(version) || '';
  const part = parts[0];
  const reps = part.shape === 'repetitions' ? (part.repeat_count || 1) : 1;
  const band = bandOf(part);
  let quantity = null;
  if (part.distance != null) {
    const each = part.distance_unit === 'km' ? Number(part.distance) * 0.621371 : Number(part.distance);
    quantity = `${Number((each * reps).toFixed(2))} mi${reps > 1 ? ' work' : ''}`;
  } else if (part.duration_seconds != null) {
    const seconds = Number(part.duration_seconds) * reps;
    quantity = `${seconds % 60 === 0 ? seconds / 60 : Math.round(seconds / 60)} min${reps > 1 ? ' work' : ''}`;
  }
  if (!quantity) return structureOf(version) || '';
  return [quantity, band].filter(Boolean).join(' · ');
}

// Continuous at a band. This is the shape that can move what an athlete owns:
// one uninterrupted piece with a prescription attached. Three by two miles is six
// miles of race-pace volume and two miles of continuous distance, and only the
// second is what the ladder asks about. A one-sided ceiling is not a band — the
// weekly easy budget has the same shape and cannot establish anything.
function continuousAtBand(version) {
  const parts = workParts(version);
  if (parts.length !== 1) return false;
  const part = parts[0];
  return part.shape === 'continuous' && part.distance != null
    && part.pace_low_seconds != null && part.pace_high_seconds != null;
}

// ── THE MATRIX IS NOT THE INSPECTOR ─────────────────────────────────────────
//
// A cell is ninety-six pixels wide. Fifteen of them across and seven down is a
// hundred and five cells, and when each one is a little article — title, dose,
// band, session distance, splits, RPE — the eye has nowhere to land and the
// season stops being visible, which is the only thing the matrix is for.
//
// So the resting cell holds three short lines at most, and everything else is a
// click away in the drawer. The Pfitzinger table reads because its cells are
// terse; ours were terse until we made them explain themselves.
//
//     3 × 2 MI          the dose, or the session's name if it has one
//     6:30–6:45         the rule
//     ✓ 6:29 avg        what came back, at block scale

const CAP = (text) => String(text || '').toUpperCase();

// A session with a name is a session whose name carries meaning — The Blind
// Mile, Durability Read. A session called "5 mi at race pace" is its own dose
// twice over, so the dose leads and the title is not printed at all.
const isNamed = (title) => !/^[\d\s×x]/.test(String(title || ''))
  && !/^(easy|long run|off|rest)\b/i.test(String(title || ''));

// The dose in as few characters as carry it.
function shortDose(version) {
  const parts = workParts(version);
  if (!parts.length) return '';
  const magnitude = (part) => {
    if (part.distance != null) {
      const each = part.distance_unit === 'km' ? Number(part.distance) * 0.621371 : Number(part.distance);
      return `${Number(each.toFixed(2))} MI`;
    }
    if (part.duration_seconds != null) return `${Math.round(part.duration_seconds / 60)} MIN`;
    return '';
  };
  if (parts.length === 1) {
    const part = parts[0];
    const reps = part.shape === 'repetitions' ? (part.repeat_count || 1) : 1;
    const one = magnitude(part);
    return reps > 1 ? `${reps} × ${one}` : one;
  }
  // A long run and its finish are one distance to the eye. The finish is the rule.
  const total = parts.reduce((sum, part) => {
    const reps = part.shape === 'repetitions' ? (part.repeat_count || 1) : 1;
    if (part.distance == null) return sum;
    const each = part.distance_unit === 'km' ? Number(part.distance) * 0.621371 : Number(part.distance);
    return sum + each * reps;
  }, 0);
  return total ? `${Number(total.toFixed(2))} MI` : '';
}

// The rule the dose is run to. One line, and only where there is one.
function shortRule(version, title) {
  const parts = workParts(version);
  const banded = parts.find((part) => part.pace_low != null && part.pace_high != null);
  if (banded) {
    if (parts.length > 1 && banded.distance != null) {
      return `${Number(banded.distance)} mi @ ${banded.pace_low}–${banded.pace_high}`;
    }
    return `${banded.pace_low}–${banded.pace_high}`;
  }
  const ceiling = parts.find((part) => part.pace_low != null && part.pace_high == null);
  if (ceiling) return 'Easy';
  if (/^long run/i.test(String(title || ''))) return 'Long';
  return '';
}

// What came back, at block scale. Not the splits — the one number that says
// whether the session happened and roughly how.
function compactRan(completion, pieces) {
  if (!completion) return '';
  if (completion.status === 'skipped') return '× skipped';
  const reps = pieces.filter((piece) => piece.kind === 'rep' && piece.pace_seconds != null);
  if (reps.length) {
    const mean = reps.reduce((sum, piece) => sum + piece.pace_seconds, 0) / reps.length;
    return `✓ ${clock(mean)} avg`;
  }
  if (completion.actual_distance && completion.duration_seconds) {
    return `✓ ${clock(Number(completion.duration_seconds) / Number(completion.actual_distance))}`;
  }
  if (completion.rpe != null) return `✓ RPE ${completion.rpe}`;
  return '✓';
}

// The full line, for the drawer, where there is room for it.
function ranLine(completion, pieces) {
  if (!completion) return '';
  const bits = [];
  if (completion.actual_distance != null) {
    bits.push(`${Number(completion.actual_distance)} ${completion.distance_unit || 'mi'}`);
  }
  if (completion.actual_distance && completion.duration_seconds) {
    bits.push(`${clock(Number(completion.duration_seconds) / Number(completion.actual_distance))}/mi`);
  }
  if (completion.rpe != null) bits.push(`RPE ${completion.rpe}`);
  if (completion.surface === 'treadmill') bits.push('treadmill');
  const splits = pieces.filter((piece) => piece.kind === 'rep' && piece.pace_seconds != null)
    .sort((a, b) => a.position - b.position).map((piece) => clock(piece.pace_seconds));
  return [bits.join(' · '), splits.join(' · ')].filter(Boolean).join(' — ');
}

// A CELL IS A WORKOUT, NOT A FILENAME.
//
// "THE GOVERNOR · 6:30–6:45" is a name and a band, and a coach reading the
// season cannot tell what the athlete is being asked to do. The anatomy is
// already typed — six thirty-second efforts with ninety-second jogs, then
// fifteen minutes at race pace — and it was being thrown away in favour of a
// shorter cell. Density is the point of the matrix: the whole argument from ten
// feet, the exact session from ten inches.
//
// So the tiers are:
//
//   easy day          8 MI · Easy                    and nothing else
//   ordinary quality  5 MI · 6:30–6:45 · 8.4 session
//   named session     THE GOVERNOR · full anatomy · rule · session total
//   filed             + RAN, with the splits
//   rung              + MOVES WHAT YOU OWN
//
// The drawer is the exhaustive record — athlete report, RPE, attachments,
// revision history. It deepens the plan; it is not required to decode it.
// NOTATION OVER PROSE.
//
// "Run the first part easy. The last 2.0 miles at race pace, off tired legs."
// is five lines of wrapped sentence in a 100px column, repeated on eight
// Saturdays, describing arithmetic the components already hold. Written as
// notation it is shorter, more precise, and scannable across fifteen weeks:
//
//     13 MI
//     11 MI EASY → 2 MI @ 6:30–6:45
//
// Read down Saturday and the progression is visible without a word of
// explanation: 7+2 → 9+2 → 11+2 → 12+2 → 12+3 → 12+4 → 6+4 → race.
//
// The grammar, and it is the same everywhere in the plan:
//   →   progression within a session      ×   repetitions
//   /   recovery                          @   target
//   WU · CD   the bookends                EASY   easy running
//
// Prose survives only where notation cannot carry the meaning — perception,
// restraint, technique. The Blind Mile keeps its sentence, because "no watch"
// is not expressible in symbols and is the entire session.
//
// Derived from the authored components. Nothing here is a string keyed off a
// title, and nothing changes a prescription.
function anatomyOf(version) {
  const parts = workParts(version);
  if (!parts.length) return null;
  const banded = parts.some((part) => part.pace_low_seconds != null && part.pace_high_seconds != null);

  const magnitude = (part) => {
    if (part.distance != null) {
      const each = part.distance_unit === 'km' ? Number(part.distance) * 0.621371 : Number(part.distance);
      // Decimals should mean precision. 2, never 2.0.
      return `${Number(each.toFixed(2))} MI`;
    }
    if (part.duration_seconds != null) {
      const secs = part.duration_seconds;
      return secs < 60 ? `${secs}S` : (secs % 60 === 0 ? `${secs / 60} MIN` : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`);
    }
    return '';
  };

  return parts.map((part) => {
    const reps = part.shape === 'repetitions' ? (part.repeat_count || 1) : 1;
    let text = reps > 1 ? `${reps} × ${magnitude(part)}` : magnitude(part);
    if (part.pace_low_seconds != null && part.pace_high_seconds != null) {
      text += ` @ ${part.pace_low}–${part.pace_high}`;
    } else if (part.pace_low_seconds != null) {
      text += ' EASY';
    } else if (banded && part.distance != null && part.shape === 'continuous') {
      // The easy portion of a long run: unbanded distance in front of banded
      // work. Deliberately restricted to DISTANCE. Pressure to Pace opens with
      // thirty unbanded minutes and its intent calls them a cost, not easy
      // running — calling that EASY would rewrite the session.
      text += ' EASY';
    }
    if (part.recovery_seconds) {
      const rest = part.recovery_seconds % 60 === 0
        ? `${part.recovery_seconds / 60} MIN` : `${part.recovery_seconds}S`;
      text += ` / ${rest}${part.recovery_kind ? ` ${part.recovery_kind.toUpperCase()}` : ''}`;
    }
    const race = part.pace_low_seconds != null && part.pace_high_seconds != null;
    return `<span class="${race ? 'aw' : 'ae'}">${escapeHtml(text)}</span>`;
  }).join('<span class="ar"> → </span>');
}

function prescribedCell(session, context) {
  const version = session.currentVersion;
  const title = titleOf(session);
  const classes = ['s'];
  if (session.state === 'cancelled') classes.push('canx');

  // Eligibility is authored now. A component that points at the mark is evidence
  // the mark will read; a rung is the subset that would move the ladder. Two
  // different claims, and only the second is lime.
  const eligible = (version?.components || []).some((part) => part.counts_toward_mark_id);
  if (eligible) classes.push('own');
  const mark = context.mark;
  const rung = session.state === 'cancelled' ? null : rungFor(session, mark);
  if (rung) classes.push('rung');

  // What KIND of day this is, authored on the session and never re-derived here.
  // The Week View draws a key session with more presence than an easy one, and
  // the shortest way to that distinction is `title !== 'Easy'` — which would
  // mean the layout changes when a title is reworded, and the next session type
  // FORM invents becomes a key session for having an unfamiliar name.
  //
  // Not the same claim as `own`. A long run can be the week's whole argument and
  // point at no mark; a two-mile touch can be eligible and be nobody's headline.
  classes.push(`r-${session.role || 'key'}`);

  const easy = /^easy/i.test(title);
  const named = isNamed(title);
  const dose = shortDose(version);
  const head = named ? title : (dose || title);

  // Easy days stay terse. Their whole prescription is a distance and a ceiling,
  // and printing an anatomy for them would be noise pretending to be rigour.
  if (easy) {
    const back = context.completionFor(session.id);
    const ran = compactRan(back, context.piecesFor(back?.id));
    return `<span class="${classes.join(' ')}" data-session="${escapeHtml(session.id)}">
      <b>${escapeHtml(CAP(head))}</b><i>Easy</i>
      ${ran ? `<u>${escapeHtml(ran)}</u>` : ''}</span>`;
  }

  // Everything else states what the athlete is actually doing. A named session
  // shows its whole anatomy; a session whose title is its own dose shows the
  // rule it runs to.
  const parts = workParts(version);
  const anatomy = parts.length > 1 || named ? anatomyOf(version) : null;
  const fallback = anatomy ? '' : shortRule(version, title);
  // The warm-up and cool-down, subordinate to the work but present, because an
  // athlete reading this cell has to run the whole session and the total will
  // otherwise look like arithmetic nobody explained.
  const around = (version?.components || [])
    .filter((part) => part.role === 'warm_up' || part.role === 'cool_down')
    .sort((a, b) => a.position - b.position)
    .map((part) => `${part.role === 'warm_up' ? 'WU' : 'CD'} ${
      part.duration_seconds != null ? Math.round(part.duration_seconds / 60)
        : Number(part.distance)}`)
    .join(' · ');
  const total = authoredMiles(version);
  const work = workMiles(version);
  // Name, then work, then target, then logistics. The warm-up, the cool-down and
  // the session total are what you need to execute and not what the session is
  // about, so they are one quiet line rather than two more things to parse.
  const whole = total != null && (work == null || Math.abs(total - work) > 0.05)
    ? `${Number(total.toFixed(1))} MI` : '';
  const logistics = [around, whole].filter(Boolean).join(' · ');
  const completion = context.completionFor(session.id);
  const ran = session.state === 'cancelled' ? ''
    : ranLine(completion, context.piecesFor(completion?.id));

  // The execution rule, where there is one short enough to be a rule. "Run the
  // first part easy. The last 2 miles at race pace, off tired legs." changes how
  // the session is run and belongs in the cell. A paragraph explaining why a
  // session was withdrawn is reasoning, not a rule, and a column ninety-six
  // pixels wide turns it into a wall. Those stay in the drawer, whole.
  const details = String(version?.details || '').trim();
  // A session with no pace and no effort has nothing else telling the athlete
  // what to do, so its instruction gets more room than a cue on a session that
  // already states its target. The Blind Mile's rule is 106 characters and was
  // being dropped for a hundred-character cap written for cues.
  const targeted = workParts(version).some((part) =>
    part.pace_low_seconds != null || part.rpe_low != null) || version?.rpe_low != null;
  let rule = details && details.length <= (targeted ? 100 : 160) ? details : '';

  // A session with no pace and no effort is not necessarily under-authored. The
  // Blind Mile's whole idea is that it has no target — "calibrate internal half
  // effort so a dead watch does not erase race execution" IS the prescription,
  // and it was sitting in the intent where the athlete could not see it.
  //
  // So where a session states no target at all, its intent becomes the rule. It
  // is the only thing in the record telling the athlete what to do.
  if (!rule && !targeted && version?.intent) rule = version.intent;
  // Once the structure is notation, the sentence describing that structure is
  // saying it twice. "Off tired legs" is a real cue and belongs in the drawer,
  // not on eight consecutive Saturdays.
  if (anatomy && parts.length > 1 && targeted) rule = '';

  return `<span class="${classes.join(' ')}" data-session="${escapeHtml(session.id)}">
    <b>${escapeHtml(named ? head : CAP(head))}</b>
    ${anatomy ? `<i>${anatomy}</i>` : (fallback ? `<i>${escapeHtml(fallback)}</i>` : '')}
    ${logistics ? `<small>${escapeHtml(logistics)}</small>` : ''}
    ${rule ? `<q>${escapeHtml(rule)}</q>` : ''}
    ${ran ? `<u>${escapeHtml(ran)}</u>` : ''}
    ${rung ? `<mark>moves → ${escapeHtml(Number(rung.rung.value))} ${escapeHtml(mark?.unit || 'mi')}</mark>` : ''}</span>`;
}

// A run the athlete placed himself against the week's authored easy quantity.
// The matrix says the miles and nothing else — "from the weekly budget" is
// implementation history, and it does not belong on the primary surface.
function allocationCell(completion, context, budgeted) {
  const back = compactRan(completion, context.piecesFor(completion.id));
  const miles = completion.actual_distance != null ? `${Number(completion.actual_distance)} MI` : 'RAN';
  return `<span class="s alloc" data-completion="${escapeHtml(completion.id)}">
    <b>${escapeHtml(miles)}</b>
    <i>${budgeted ? 'Easy' : 'No prescription'}</i>
    ${back ? `<u>${escapeHtml(back)}</u>` : ''}</span>`;
}

// ── TRANCHE B: who this is, and what the block is asking ────────────────────
//
// The grid says what happens. It cannot say why, and a coach opening the plan
// on a Friday is asking a question the calendar has no room for: what is this
// block for, what does this athlete own today, and what do the numbers on those
// cells mean.
//
// One athlete, always. The reference carries a JOSÉ/HOPE switcher to show that
// everything here resolves per athlete; the route already carries the athlete,
// so there is no switcher.

// The pace key. Authored on the block where one exists — including the band the
// block deliberately does NOT prescribe, which is a fact no component can carry.
// Derived from the components otherwise, so every other athlete still gets one.
function paceBands() {
  const authored = (record.paceBands || []).slice().sort((a, b) => a.position - b.position);
  if (authored.length) {
    return authored.map((band) => ({ label: band.label, value: band.value, line: band.when_line }));
  }
  const parts = (record.sessions || [])
    .flatMap((session) => (session.currentVersion?.components || []))
    .filter((part) => part.role === 'work' && part.pace_low != null);
  const tally = new Map();
  parts.forEach((part) => {
    const key = `${part.pace_low}|${part.pace_high || ''}`;
    tally.set(key, (tally.get(key) || 0) + 1);
  });
  return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key, count]) => {
    const [low, high] = key.split('|');
    return {
      label: high ? 'BANDED WORK' : 'CEILING',
      value: high ? `${low}–${high} /mi` : `${low} /mi or slower`,
      line: `${count} component${count === 1 ? '' : 's'} in this block.`
    };
  });
}

// The strip carries the rule, not the essay. The whole authored line sits under
// the matrix where there is room for it; up here it is the sentence that changes
// what an athlete does — "slower is never wrong", "under 6:30 is a different
// session". Taken from the authored text, never rewritten.
const firstSentence = (text) => {
  const line = String(text || '').trim();
  const stop = line.search(/[.!?](\s|$)/);
  return stop === -1 ? line : line.slice(0, stop + 1);
};

// The volume horizon. Not a score — the range this particular block moves them
// across, which is the second progression running underneath the ladder and the
// one the easy days were authored to express.
// The volume horizon. Not a score — the range this block moves them across.
//
// It read "35 mi → 58 mi peak", and 35 was a lie of omission. Weeks 1 and 2 are
// in the past and their easy days were never authored by day, so their totals
// are the shape of an authoring gap rather than of anyone's training. Both
// athletes entered this block running about 45 a week.
//
// So the horizon is drawn only from weeks that actually author their easy
// running. A week whose easy is still a dateless budget has no total worth
// quoting, and quoting it tells a false story about where an athlete started.
function volumeHorizon(weeks, milesFor, authored) {
  const totals = weeks.filter(authored).map(milesFor).filter((miles) => miles > 0);
  if (totals.length < 2) return null;
  const first = Math.round(totals[0]);
  const peak = Math.round(Math.max(...totals));
  return peak > first ? `${first} mi → ${peak} mi peak` : null;
}

// The week, as a rhythm rather than a list. Read off what the block actually
// authors on each weekday, so an athlete whose week is shaped differently gets
// their own sentence rather than this one.
function weekRhythm(weeks, forWeek) {
  const kind = new Map();
  WEEK_DAYS.forEach((day, index) => {
    const seen = weeks.flatMap((week) => {
      const on = week.starts_on ? addDays(week.starts_on, index) : null;
      return on ? forWeek(week).filter((session) => session.scheduled_on === on) : [];
    }).filter((session) => session.state !== 'cancelled');
    if (!seen.length) { kind.set(day, 'off'); return; }
    const easy = seen.filter((session) => /^easy/i.test(String(session.currentVersion?.title || '')));
    const long = seen.filter((session) => /long run|continuous/i.test(String(session.currentVersion?.title || '')));
    if (long.length > seen.length / 2) kind.set(day, 'long');
    else if (easy.length > seen.length / 2) kind.set(day, 'easy');
    else kind.set(day, 'quality');
  });
  return WEEK_DAYS.map((day) => `${day.slice(0, 3)} ${kind.get(day)}`).join(' · ');
}

// What a normal week has actually looked like — filed evidence, not prescription.
// The most recent complete week with anything in it.
function observedWeek(weeks, current) {
  const filed = record.completions || [];
  const done = weeks.filter((week) => week.ends_on && (!current || week.week_number < current.week_number));
  for (const week of done.slice().reverse()) {
    const mine = filed.filter((item) => {
      const on = filedOn(item);
      return on >= week.starts_on && on <= week.ends_on;
    }).sort((a, b) => a.filed_at.localeCompare(b.filed_at));
    if (!mine.length) continue;
    const miles = mine.reduce((total, item) => total + Number(item.actual_distance || 0), 0);
    const days = mine.map((item) => {
      const date = new Date(item.filed_at);
      return `${SHORT_DAY[date.getDay()]} ${item.actual_distance != null ? Number(item.actual_distance) : '—'}`;
    }).join(' · ');
    return { week, days, miles, runs: mine.length };
  }
  return null;
}

function thisWeekSoFar(current) {
  if (!current) return null;
  const mine = (record.completions || []).filter((item) => {
    const on = filedOn(item);
    return on >= current.starts_on && on <= current.ends_on;
  }).sort((a, b) => a.filed_at.localeCompare(b.filed_at));
  const miles = mine.reduce((total, item) => total + Number(item.actual_distance || 0), 0);
  return { runs: mine.length, miles, days: mine.map((item) => {
    const date = new Date(item.filed_at);
    return `${SHORT_DAY[date.getDay()]} ${item.actual_distance != null ? Number(item.actual_distance) : '—'}`;
  }).join(' · ') };
}

// ── THE WEEK ────────────────────────────────────────────────────────────────
//
// PLAN → WEEK → SESSION. The same objects at three magnifications, and the
// middle one is the surface a coach and an athlete actually operate from.
//
// The plan answers what am I getting into and where is this going. It is not
// what you read on a Tuesday morning, and a fifteen-week matrix asked to be both
// ends up good at neither. So a week gets its own scale: seven days at full
// width, the anatomy unwrapped, and the question the week is asking above them.
//
// Nothing new is computed here. It is the same cells, given room.

// THE SHAPE OF THE WEEK, NOT ITS ACCOUNTING.
//
// The first version read TOTAL 39 · EASY 0 · THE WORK 39 for a week containing
// four easy runs and a long run, which is not merely unhelpful — it is false.
// EASY counted only sessions authored by day, and weeks 1 and 2 placed their
// easy running as allocations against a budget, so the number was zero and the
// remainder was labelled work.
//
// A summary should say what kind of week this is. How far, how much of it is
// easy however it was placed, how many sessions carry the argument, how long the
// long day is, and — only when one exists — what the week can establish.
function weekSummary(week, forWeek, milesFor, mark) {
  const filed = record.completions || [];
  const live = forWeek(week).filter((session) => session.state !== 'cancelled'
    || filed.some((item) => item.planned_session_id === session.id));
  const titleOfSession = (session) => String(session.currentVersion?.title || '').trim();
  const isEasyish = (session) => /^(easy|off|rest)/i.test(titleOfSession(session));

  // Easy running however it was placed. A week whose easy days are authored and
  // a week whose easy miles were allocated against a budget are the same week to
  // an athlete, and the summary should not report one of them as zero.
  const datedEasy = live.filter((session) => session.scheduled_on && isEasyish(session))
    .reduce((sum, session) => sum + (authoredMiles(session.currentVersion) || 0), 0);
  const allocated = (record.completions || [])
    .filter((item) => !item.planned_session_id && week.starts_on && week.ends_on
      && filedOn(item) >= week.starts_on && filedOn(item) <= week.ends_on)
    .reduce((sum, item) => sum + Number(item.actual_distance || 0), 0);

  const key = live.filter((session) => session.scheduled_on && !isEasyish(session));
  // The long day is whichever day actually holds the longest run, read off the
  // sessions rather than off a weekday name. Natalie's block puts hers on a
  // Sunday, and a summary that asks "what is Saturday" would be describing
  // José's week while looking at hers.
  const longest = live.filter((session) => session.scheduled_on && !isEasyish(session))
    .reduce((best, session) => {
      const miles = authoredMiles(session.currentVersion) || 0;
      return miles > (best.miles || 0) ? { session, miles } : best;
    }, {});
  const longDay = longest.miles || 0;
  const rung = key.map((session) => rungFor(session, mark)).find(Boolean);

  return {
    total: milesFor(week),
    easy: datedEasy || allocated,
    easyFiled: !datedEasy && allocated > 0,
    key: key.length,
    longDay,
    longIsSpecific: Boolean(longest.session
      && workParts(longest.session.currentVersion).some((part) => part.pace_high_seconds != null)),
    rung: rung ? rung.rung : null
  };
}

function weekHtml(weekNumber) {
  const block = record.block;
  const weeks = (record.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
  const week = weeks.find((item) => String(item.week_number) === String(weekNumber));
  const athlete = record.athlete;
  if (!week) return `<main class="view on planv"><div class="failed"><h1>No such week.</h1></div></main>`;

  const mark = record.primaryMark;
  const completions = record.completions || [];
  const pieces = record.pieces || [];
  const context = {
    mark,
    completionFor: (id) => completions.find((item) => item.planned_session_id === id) || null,
    piecesFor: (id) => id ? pieces.filter((piece) => piece.completion_id === id) : []
  };
  const forWeek = (item) => (record.sessionsByWeek?.[item.id] || []);
  const isEasy = (session) => session.role === 'easy';
  const milesFor = (item) => forWeek(item).reduce((sum, session) => {
    if (session.state === 'cancelled') return sum;
    if (!session.scheduled_on && forWeek(item).some((other) => other.scheduled_on
      && isEasy(other))) return sum;
    return sum + (authoredMiles(session.currentVersion) || 0);
  }, 0);
  const easyFor = (item) => forWeek(item).reduce((sum, session) => {
    if (session.state === 'cancelled' || !session.scheduled_on) return sum;
    if (!isEasy(session)) return sum;
    return sum + (authoredMiles(session.currentVersion) || 0);
  }, 0);

  const sum = weekSummary(week, forWeek, milesFor, mark);
  const out = weeksOutOf(week, block?.race_on);
  const unattached = completions.filter((item) => !item.planned_session_id);
  const isNow = week.id === record.currentWeek?.id;

  const dayRows = WEEK_DAYS.map((day, index) => {
    const on = week.starts_on ? addDays(week.starts_on, index) : null;
    const asked = on ? forWeek(week).filter((session) => session.scheduled_on === on
      && (session.state !== 'cancelled' || context.completionFor(session.id))) : [];
    const ran = on ? unattached.filter((item) => filedOn(item) === on) : [];
    const body = asked.map((session) => prescribedCell(session, context)).join('')
      + ran.map((item) => allocationCell(item, context, true)).join('');
    // Not `today` — that is the module's clock, and shadowing it here put the
    // whole view in a temporal dead zone the moment the week rendered.
    const isToday = on === today();
    return {
      day, on, asked,
      // A day is easy running only when everything asked of it is. A day that
      // is easy plus anything else is not a day you can fold into a block.
      easy: asked.length > 0 && asked.every((session) => isEasy(session)
        && session.state !== 'cancelled'),
      miles: asked.reduce((sum, session) => sum + (authoredMiles(session.currentVersion) || 0), 0),
      html: `<article class="wday${body ? '' : ' rest'}${isToday ? ' now' : ''}">
      <header class="wdayName"><span class="dLong">${day}</span><span class="dShort">${
        escapeHtml(day.slice(0, 3))}</span><em>${on ? escapeHtml(dayLabel(on)) : ''}</em>
        ${isToday ? '<span class="wNow">today</span>' : ''}</header>
      <div class="wdayBody">${body || '<span class="none">Rest</span>'}</div>
    </article>`
    };
  });

  // THE RECOVERY BLOCK.
  //
  // Five easy days are five nearly identical rows saying one thing: 35 miles of
  // easy running, distributed like this. So consecutive easy days are composed
  // into one object with a total, and the days stay inside it — chronological,
  // selectable, each still carrying its own number.
  //
  // The number stays because the athlete runs Monday, not the week: nine miles
  // is what goes into the watch. Brice's ruling — compose them, never replace
  // them with a total.
  //
  // Only CONSECUTIVE days, and only ones the block agrees about. Folding easy
  // days together across a key session would say the week ran in an order it
  // did not, which is a lie about sequence rather than a compression of it.
  const groups = [];
  dayRows.forEach((row) => {
    const run = groups[groups.length - 1];
    if (row.easy && run?.easy) run.rows.push(row);
    else groups.push({ easy: row.easy, rows: [row] });
  });

  const days = groups.map((group) => {
    // One easy day is a day, not a block. A header over a single row would be
    // ceremony around a fact the row already states.
    if (!group.easy || group.rows.length < 2) return group.rows.map((row) => row.html).join('');
    const miles = group.rows.reduce((sum, row) => sum + row.miles, 0);
    // The days are the distribution. Printing MON 9 · TUE 6 in the header AND
    // the rows underneath would say it twice; the rows are already in order and
    // already carry their number, so they become the ticks.
    // No inline style attribute, and no count passed to CSS: the columns are
    // `grid-auto-flow:column`, so the layout counts the days itself. A style=
    // here would need 'unsafe-inline' in the /coach/* CSP, which is never
    // happening.
    return `<section class="wRun">
      <header class="wRunHead">
        <b>Easy volume</b>
        <strong>${escapeHtml(Number(miles.toFixed(1)))} mi</strong>
        <em>${escapeHtml(group.rows.length)} days</em>
      </header>
      <div class="wRunDays">${group.rows.map((row) => row.html).join('')}</div>
    </section>`;
  }).join('');

  const prev = weeks.find((item) => item.week_number === week.week_number - 1);
  const next = weeks.find((item) => item.week_number === week.week_number + 1);

  // THE WEEK IS WHERE YOU WORK.
  //
  // The matrix is the map and the session is the act; this is the surface a
  // coach and an athlete actually operate from, so it gets the question, what
  // they own, what is next, and then seven days with room to be read.
  //
  // No week list down the side. Fifteen identical links duplicating a navigator
  // that is already better than they are, taking 180px from the training. The
  // Full Plan is the way back and the arrows are the way across.
  //
  // The context rail carries only panels with something authoritative behind
  // them. No progress bar — two of 13.1 is arithmetically true and reads as a
  // completion metric, and ownership is not one: five miles is not 38% of an
  // answer. No empty notes box inviting input that goes nowhere.
  const nextRung = (mark?.checkpoints || []).slice().sort((a, b) => a.position - b.position)
    .find((item) => item.state !== 'reached');
  const owned = mark?.current_value != null ? Number(mark.current_value) : null;
  const keySessions = forWeek(week).filter((session) => session.scheduled_on
    && session.state !== 'cancelled'
    && !/^(easy|off|rest)/i.test(String(session.currentVersion?.title || '').trim()));
  const standing = (record.observations || []).slice(0, 2);

  return `<main class="view on planv weekv">
    <div class="wHero">
      <div class="wWho">
        <div class="pfrm"><span>${escapeHtml(initials(athlete.first_name))}</span>
          <img data-portrait="${escapeHtml(athlete.slug)}" alt=""></div>
        <div>
          <button class="back" type="button" data-nav="plan">← ${escapeHtml(block?.name || 'Full plan')}</button>
          <h1>Week ${escapeHtml(week.week_number)}</h1>
          <div class="wWhen">${escapeHtml(rangeLabel(week.starts_on, week.ends_on))}${
            out == null ? '' : ` · ${escapeHtml(out)} week${out === 1 ? '' : 's'} out`}${
            isNow ? ' · this week' : ''}</div>
        </div>
      </div>
      <div class="wAsk">
        <h2>${escapeHtml(mark?.current_question || block?.goal_statement || '')}</h2>
        <div class="wState">
          <div class="wOwned"><b>${owned != null ? escapeHtml(owned) : '—'}</b>
            <span>${escapeHtml(String(mark?.unit || 'mi').toUpperCase())}<br>YOU OWN</span></div>
          ${nextRung ? `<div class="wNext"><b>NEXT ASK</b>
            <strong>${escapeHtml(Number(nextRung.value))} ${escapeHtml(mark?.unit || 'mi')}</strong></div>` : ''}
        </div>
      </div>
      <div class="wStep">
        ${prev ? `<button type="button" data-week-to="${escapeHtml(prev.week_number)}">← W${escapeHtml(prev.week_number)}</button>` : ''}
        ${next ? `<button type="button" data-week-to="${escapeHtml(next.week_number)}">W${escapeHtml(next.week_number)} →</button>` : ''}
      </div>
    </div>

    <div class="wSum">
      <div><b>TOTAL</b><strong>${escapeHtml(Number(sum.total.toFixed(1)))} mi</strong></div>
      <div><b>${sum.easyFiled ? 'EASY, AS FILED' : 'EASY'}</b>
        <strong>${escapeHtml(Number(sum.easy.toFixed(1)))} mi</strong></div>
      <div><b>KEY SESSIONS</b><strong>${escapeHtml(sum.key)}</strong></div>
      ${sum.longDay ? `<div><b>LONGEST DAY</b>
        <strong>${escapeHtml(Number(sum.longDay.toFixed(1)))} mi</strong>
        ${sum.longIsSpecific ? '<em>with race pace in it</em>' : ''}</div>` : ''}
      ${sum.rung ? `<div class="wOwn"><b>CAN ESTABLISH</b>
        <strong>${escapeHtml(Number(sum.rung.value))} ${escapeHtml(mark?.unit || 'mi')}</strong></div>` : ''}
    </div>

    <div class="wWork">
      <div class="wDays">${days}</div>
      <aside class="wRail">
        ${week.intent ? `<section><h3>This week is for</h3><p>${escapeHtml(week.intent)}</p></section>` : ''}
        ${keySessions.length ? `<section><h3>Key sessions</h3>
          ${keySessions.map((session) => {
            const rung = rungFor(session, mark);
            return `<div class="rKey" data-session="${escapeHtml(session.id)}">
              <b>${escapeHtml(weekdayOf(session.scheduled_on))}</b>
              <span>${escapeHtml(titleOf(session))}</span>
              ${rung ? `<em>moves → ${escapeHtml(Number(rung.rung.value))} ${escapeHtml(mark?.unit || 'mi')}</em>`
                : (session.currentVersion?.intent ? `<em>${escapeHtml(session.currentVersion.intent)}</em>` : '')}
            </div>`;
          }).join('')}</section>` : ''}
        ${asCoach() && standing.length ? `<section><h3>What helps ${escapeHtml(athlete.first_name)}</h3>
          ${standing.map((row) => `<p class="rFact">${escapeHtml(row.observation)}</p>`).join('')}</section>` : ''}
      </aside>
    </div>
  </main>`;
}

function planHtml() {
  const block = record.block;
  const weeks = (record.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
  const athlete = record.athlete;
  if (!block || !weeks.length) {
    return `<main class="view on planv"><div class="failed"><h1>No active block.</h1>
      <p>Nothing is authored for ${escapeHtml(athlete?.first_name || 'this athlete')} yet.</p></div></main>`;
  }
  const current = record.currentWeek;
  const completions = record.completions || [];
  const pieces = record.pieces || [];
  const context = {
    mark: record.primaryMark,
    completionFor: (sessionId) => completions.find((item) => item.planned_session_id === sessionId) || null,
    piecesFor: (completionId) => completionId ? pieces.filter((piece) => piece.completion_id === completionId) : []
  };
  const unattached = completions.filter((item) => !item.planned_session_id);

  const forWeek = (week) => (record.sessionsByWeek?.[week.id] || []);
  const budgetFor = (week) => forWeek(week).filter((session) => !session.scheduled_on);
  const datedEasy = (week) => forWeek(week).some((session) =>
    session.scheduled_on && /^easy$/i.test(String(session.currentVersion?.title || '').trim()));
  // Once a week authors its easy days, its budget is history rather than
  // prescription. The rows stay as the record of how the easy running was
  // authored before it had days, and stop being counted.
  const milesFor = (week) => forWeek(week).reduce((total, session) => {
    if (session.state === 'cancelled') return total;
    if (!session.scheduled_on && datedEasy(week)) return total;
    return total + (authoredMiles(session.currentVersion) || 0);
  }, 0);
  // Standalone easy running, wherever it falls. A warm-up counts toward the
  // week's mileage and never toward this: it belongs to its quality session.
  const easyFor = (week) => forWeek(week).reduce((total, session) => {
    if (session.state === 'cancelled' || !session.scheduled_on) return total;
    if (!/^easy/i.test(String(session.currentVersion?.title || '').trim())) return total;
    return total + (authoredMiles(session.currentVersion) || 0);
  }, 0);
  const isCurrent = (week) => week.id === current?.id;
  // A cutback week is one carrying materially less than the block's heaviest.
  // Derived, because nothing in training_weeks says "this one is lighter".
  const heaviest = Math.max(...weeks.map(milesFor), 0);

  const head = weeks.map((week) => {
    const out = weeksOutOf(week, block.race_on);
    const miles = milesFor(week);
    const down = miles > 0 && heaviest > 0 && miles < 0.8 * heaviest;
    return `<th class="${[isCurrent(week) ? 'cur' : '', down ? 'down' : ''].filter(Boolean).join(' ')}"
      data-week-to="${escapeHtml(week.week_number)}">
      <span class="wn">W${escapeHtml(week.week_number)}</span>
      <span class="wd">${escapeHtml(dayLabel(week.starts_on))}</span>
      ${out == null ? '' : `<span class="wo">${escapeHtml(out)}</span>`}</th>`;
  }).join('');

  // What the week is for, in one line. `training_weeks.intent` already exists and
  // is null on every row in the database, so this renders nothing today rather
  // than inventing a sentence per week. The slot stays: a plan whose weeks cannot
  // say what they are for is a calendar, and this row is where that gets fixed.
  const purposeRow = weeks.some((week) => String(week.intent || '').trim())
    ? `<tr class="prow"><th class="d">This week is for</th>${weeks.map((week) => `<td class="${
        isCurrent(week) ? 'cur' : ''}">${week.intent ? escapeHtml(week.intent) : '<span class="none">·</span>'}</td>`).join('')}</tr>`
    : '';

  // A day nothing is ever authored on is not a training row. Sunday is canonical
  // rest across all fifteen weeks, and giving it the same height as Saturday says
  // it is a day with nothing in it rather than a day that is meant to be empty.
  const everAuthored = (index) => weeks.some((week) => week.starts_on
    && forWeek(week).some((session) => session.scheduled_on === addDays(week.starts_on, index)));

  const rows = WEEK_DAYS.map((day, index) => everAuthored(index)
    ? `<tr class="${HEAVY_DAYS.has(day) ? 'heavy' : 'light'}">
      <th class="d">${day}</th>
      ${weeks.map((week) => {
        const on = week.starts_on ? addDays(week.starts_on, index) : null;
        // THE PLAN IS THE CURRENT TRUTH, NOT THE REVISION LEDGER.
        //
        // A withdrawn future session read as a ghost workout floating above the
        // real one, and it asks the athlete a question with no good answer: was
        // I supposed to do that? did I miss it? A prescription we replaced
        // before it was ever run is authorship mechanics, and the athlete has no
        // business decoding those.
        //
        // A cancelled session that WAS performed stays, because then it is not a
        // withdrawn idea — it is evidence, and evidence is never hidden. The
        // record of every withdrawal survives in the session and its versions.
        const asked = on ? forWeek(week).filter((session) => session.scheduled_on === on
          && (session.state !== 'cancelled'
            || (record.completions || []).some((item) => item.planned_session_id === session.id))) : [];
        const ran = on ? unattached.filter((item) => filedOn(item) === on) : [];
        const inside = asked.map((session) => prescribedCell(session, context)).join('')
          + ran.map((item) => allocationCell(item, context, budgetFor(week).length > 0)).join('');
        return `<td class="${isCurrent(week) ? 'cur' : ''}">${inside || '<span class="none">·</span>'}</td>`;
      }).join('')}
    </tr>`
    : `<tr class="restrow"><th class="d">${day}</th>
      <td colspan="${weeks.length}">Rest</td></tr>`).join('');

  // The budget sits outside the dated days and never gets one. It is the week's
  // easy running as one authored quantity, placed by the athlete.
  // The source the daily easy cells are drawn from, and how much of it has been
  // spent. Prescribed is authored; allocated is what the athlete placed.
  // The weekly budget has finished its job.
  //
  // It was how the easy running was authored before it had days, and while the
  // block ran on it the row WAS the prescription. Now that thirteen of fifteen
  // weeks author their easy days, rendering it beside them shows a superseded
  // prescription next to the real one — and TOTAL and EASY already carry the
  // numbers underneath it.
  //
  // The rows are not deleted. They remain the record of how this block was
  // authored before it had days, readable in the database and in the drawer, and
  // W1 and W2 keep their evidence in the day cells where the athlete placed it.
  const budgetRow = '';

  // Two lines, not one. TOTAL is every mile the week asks for, warm-ups
  // included. EASY is standalone easy running only. The gap between them is how
  // much of the week is consumed by structured running, and it widens through
  // the ownership block and narrows at the cutback without a word.
  const volume = `<tr class="volrow"><th class="d">Total</th>${weeks.map((week) => {
    const miles = milesFor(week);
    return `<td class="${isCurrent(week) ? 'cur' : ''}">${miles ? Number(miles.toFixed(0)) : '·'}</td>`;
  }).join('')}</tr>
  <tr class="volrow easyline"><th class="d">Easy</th>${weeks.map((week) => {
    const miles = easyFor(week);
    return `<td class="${isCurrent(week) ? 'cur' : ''}">${miles ? Number(miles.toFixed(0)) : '·'}</td>`;
  }).join('')}</tr>`;

  const mark = record.primaryMark;
  const owned = mark?.current_value != null ? Number(mark.current_value) : null;
  const horizon = volumeHorizon(weeks, milesFor, datedEasy);
  const bands = paceBands();
  const observed = observedWeek(weeks, current);
  const soFar = thisWeekSoFar(current);
  const rungs = weeks.reduce((count, week) => count
    + forWeek(week).filter((session) => session.state !== 'cancelled'
      && rungFor(session, mark)).length, 0);

  return `<main class="view on planv">
    <div class="pgHead">
      ${asCoach() ? `<button class="back" type="button" data-nav="athlete">← ${escapeHtml(athlete.first_name)}</button>` : ''}
      <h3>${escapeHtml(block.name || 'The block')}</h3>
      <span class="pgSub">${escapeHtml(block.total_weeks)} weeks${
        block.race_name ? ` to ${escapeHtml(block.race_name)}` : ''}</span>
    </div>

    <div class="pstrip">
      <div class="pwho">
        <div class="pfrm"><span>${escapeHtml(initials(athlete.first_name))}</span>
          <img data-portrait="${escapeHtml(athlete.slug)}" alt=""></div>
        <div><h1>${escapeHtml(athlete.first_name)}</h1>
          <div class="prace">${escapeHtml(raceLine(athlete, block))}${
            current ? ` · week ${escapeHtml(current.week_number)} of ${escapeHtml(block.total_weeks)}` : ''}</div>
        </div>
      </div>
      <div class="pq">${escapeHtml(mark?.current_question || block.goal_statement || '')}</div>
      <div class="powns">
        <b>${owned != null ? escapeHtml(owned) : '—'}</b>
        <span>${escapeHtml(String(mark?.unit || 'mi').toUpperCase())} YOU OWN</span>
      </div>
      ${horizon ? `<div class="phorizon"><b>VOLUME</b><span>${escapeHtml(horizon)}</span></div>` : ''}
      <div class="pkey">${bands.map((band) => `<div>
        <b>${escapeHtml(band.label)}</b><span>${escapeHtml(band.value)}</span>
        ${band.line ? `<em>${escapeHtml(firstSentence(band.line))}</em>` : ''}</div>`).join('')}</div>
    </div>

    <div class="pgWrap"><div class="pgScroll"><table class="pg">
      <thead><tr><th class="d"><span class="wl">weeks out</span></th>${head}</tr></thead>
      <tbody>${purposeRow}${rows}${budgetRow}${volume}</tbody>
    </table></div></div>
    <div class="prhythm">
      <div><b>THE WEEK</b><strong>${escapeHtml(weekRhythm(weeks, forWeek))}</strong>
        <em>Read off what the block authors on each weekday, not a template.</em></div>
      <div><b>A NORMAL WEEK, OBSERVED</b>${observed
        ? `<strong>${escapeHtml(observed.days)}</strong>
           <em>${escapeHtml(`${Number(observed.miles.toFixed(2))} mi across ${observed.runs} run${observed.runs === 1 ? '' : 's'}`)},
             week ${escapeHtml(observed.week.week_number)}. Filed, not prescribed.</em>`
        : '<strong>—</strong><em>Nothing filed yet.</em>'}</div>
      <div><b>THIS WEEK SO FAR</b>${soFar && soFar.runs
        ? `<strong>${escapeHtml(soFar.days)}</strong>
           <em>${escapeHtml(`${Number(soFar.miles.toFixed(2))} mi`)} against
             ${escapeHtml(Number(milesFor(current).toFixed(0)))} asked.</em>`
        : '<strong>—</strong><em>Nothing filed this week.</em>'}</div>
    </div>
    <div class="pbands">${bands.map((band) => `<div>
      <b>${escapeHtml(band.label)}</b><strong>${escapeHtml(band.value)}</strong>
      <em>${escapeHtml(band.line)}</em></div>`).join('')}</div>

    <div class="pgFoot">
      <b>A lime bar</b> marks a rung — a session that would move what this athlete owns. A lime
      title is work whose evidence the mark will read; the bar is the subset the ladder is
      actually asking for.
      <b>Struck through</b> is cancelled and stays visible, so you can see what was withdrawn.
      A middle dot is a day with nothing authored and nothing filed, not a rest day.
      <b>Total</b> is every mile the week asks for, warm-ups and jog recoveries included.
      <b>Easy</b> is standalone easy running only — a warm-up belongs to its quality session.
      Weeks 1 and 2 authored their easy running as one weekly quantity rather than by day, so
      their easy days are the runs as filed.
    </div>
  </main>`;
}
// ── THE SESSION, OVER THE MATRIX ────────────────────────────────────────────
//
// A cell is 96 pixels wide and holds a title, a dose, a session distance and
// what came back. That is as much as it should hold. Everything else about the
// session — its anatomy piece by piece, its band, its recoveries, why it was
// revised, what the athlete said — needs room, and navigating away to get it
// costs the thing the matrix exists for: you lose the season while you read the
// day.
//
// So the session opens over the grid and the grid stays lit behind it. Escape
// and the scrim close it. Nothing here writes, yet — Revise is tranche D and the
// drawer is where it will live.

let openSession = null;

function anatomyRows(version) {
  const parts = (version?.components || []).slice().sort((a, b) => a.position - b.position);
  if (!parts.length) return '<p class="dNone">No anatomy authored.</p>';
  const clockOf = (secs) => secs % 60 === 0 ? `${secs / 60} min` : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  return `<div class="dParts">${parts.map((part) => {
    const reps = part.shape === 'repetitions' ? (part.repeat_count || 1) : 1;
    const magnitude = part.distance != null
      ? `${Number(part.distance)} ${part.distance_unit || 'mi'}`
      : part.duration_seconds != null ? clockOf(part.duration_seconds) : '—';
    const band = bandOf(part);
    const rest = part.recovery_seconds
      ? `${clockOf(part.recovery_seconds)} ${part.recovery_kind || ''}`.trim() : null;
    return `<div class="dPart">
      <b>${escapeHtml(part.role.replace('_', ' '))}</b>
      <span>${escapeHtml(reps > 1 ? `${reps} × ${magnitude}` : magnitude)}</span>
      <em>${escapeHtml([band, rest ? `${rest} between` : null].filter(Boolean).join(' · ') || '')}</em>
    </div>`;
  }).join('')}</div>`;
}

// Evidence is filed against work that has happened. A session in the future has
// nothing to say yet, a cancelled one was withdrawn, and one already filed is
// corrected rather than filed twice — corrections go through correct_session,
// which keeps the previous reading.
//
// This exists for Simon more than anyone. He is coach-delivered by design: no
// app, no filing of his own, and until this the loop could author his training
// and never hear back. A coaching surface that cannot receive evidence is a
// publisher.
function fileable(session) {
  if (session.state === 'cancelled') return { can: false, why: 'Cancelled' };
  if (!session.scheduled_on) return { can: false, why: 'No date' };
  if (session.scheduled_on > today()) return { can: false, why: 'Not yet' };
  const filed = (record.completions || []).some((item) => item.planned_session_id === session.id);
  if (filed) return { can: false, why: 'Filed' };
  return { can: true, why: '' };
}

// WHAT MAY BE REVISED, AND WHY THE ANSWER IS NOT "ANYTHING".
//
// A revision changes what is being ASKED. It cannot change what happened: a
// session with a filing against it has evidence pointing at a prescription, and
// re-authoring that prescription would make the evidence describe work nobody
// was ever asked to do. Same for a session in the past with no filing — the day
// went by, and rewriting Tuesday on Friday is a different act from planning.
//
// So: future, unfiled, not cancelled. Everything else is read-only here and
// goes through the Console, where re-authoring is deliberate.
function revisable(session) {
  if (session.state === 'cancelled') return { can: false, why: 'Cancelled' };
  const filed = (record.completions || []).some((item) => item.planned_session_id === session.id);
  if (filed) return { can: false, why: 'Filed — history is not revised' };
  if (!session.scheduled_on) return { can: false, why: 'No date' };
  if (session.scheduled_on < today()) return { can: false, why: 'Past' };
  return { can: true, why: '' };
}

// The one dose a revision may move from here: a single distance-carrying work
// piece. Composite work — a long run with a race-pace finish, a pyramid — has an
// anatomy that a number cannot express, and guessing which piece the coach meant
// is how a plan quietly stops matching itself. Those say so and route on.
function soleWorkDistance(version) {
  const parts = workParts(version).filter((part) => part.distance != null);
  return workParts(version).length === 1 && parts.length === 1 ? parts[0] : null;
}

// An audit condition, not a coaching warning.
//
// Six sessions on the record carry a current prescription written after their
// evidence was filed — RPE and band backfills on 25 to 28 August, all of them
// legitimate appends. Nothing was mutated and the evidence is not invalid; the
// version history already says exactly what happened. But a reader looking at
// the prescription beside the filing deserves to know the order they arrived in.
//
// It lives here and nowhere else. On the bench or the resting matrix it would
// read as a fault with the athlete, which it is not. The Revise guard prevents
// the condition from being created again.
function revisedAfterFiling(session, completion) {
  if (!completion) return false;
  const version = session.currentVersion;
  if (!version?.created_at || (version.version_number ?? 1) < 2) return false;
  return version.created_at > completion.filed_at;
}

function drawerHtml(session) {
  if (!session) return '';
  const version = session.currentVersion;
  const versions = (session.versions || []).slice().sort((a, b) => b.version_number - a.version_number);
  const completion = (record.completions || []).find((item) => item.planned_session_id === session.id) || null;
  const pieces = completion ? (record.pieces || []).filter((piece) => piece.completion_id === completion.id) : [];
  const rung = rungFor(session, record.primaryMark);
  const week = (record.weeks || []).find((item) => item.id === session.week_id);
  const whole = authoredMiles(version);
  const work = workMiles(version);
  return `<div class="dHead">
      <div>
        <div class="dWhen">${escapeHtml([week ? `Week ${week.week_number}` : null,
          session.scheduled_on ? dayLabel(session.scheduled_on) : session.day_label].filter(Boolean).join(' · '))}</div>
        <h2>${escapeHtml(titleOf(session))}</h2>
        ${rung ? '<div class="dRung">Moves what you own</div>' : ''}
      </div>
      <div class="dActs">
        ${asCoach() && fileable(session).can
          ? `<button class="act" type="button" data-file="${escapeHtml(session.id)}">File evidence</button>` : ''}
        ${asCoach() && revisable(session).can
          ? `<button class="act quiet" type="button" data-revise="${escapeHtml(session.id)}">Revise</button>`
          : (!asCoach() || fileable(session).can ? '' : `<span class="dLocked">${escapeHtml(revisable(session).why)}</span>`)}
        <button class="dClose" type="button" data-drawer="close" aria-label="Close">×</button>
      </div>
    </div>
    <div class="dBody">
      ${whole != null ? `<div class="dFigs">
        <div><b>SESSION</b><strong>${escapeHtml(Number(whole.toFixed(2)))} mi</strong></div>
        ${work != null ? `<div><b>WORK</b><strong>${escapeHtml(Number(work.toFixed(2)))} mi</strong></div>` : ''}
      </div>` : ''}
      ${version?.intent ? `<p class="dIntent">${escapeHtml(version.intent)}</p>` : ''}
      <div class="dLab">ANATOMY</div>
      ${anatomyRows(version)}
      ${version?.details ? `<div class="dLab">DETAILS</div><p class="dText">${escapeHtml(version.details)}</p>` : ''}
      <div class="dLab">WHAT CAME BACK</div>
      ${completion
        ? `<p class="dText">${escapeHtml(ranLine(completion, pieces) || 'Filed with no measurements.')}</p>
           ${completion.athlete_note ? `<p class="dSaid">“${escapeHtml(completion.athlete_note)}”</p>` : ''}`
        : '<p class="dNone">Nothing filed.</p>'}
      ${asCoach() && revisedAfterFiling(session, completion) ? `<div class="dAudit">Prescription revised after filing</div>` : ''}
      ${asCoach() && versions.length > 1 ? `<div class="dLab">REVISIONS</div>
        <div class="dRevs">${versions.map((item) => `<div class="dRev">
          <b>v${escapeHtml(item.version_number)}</b>
          <span>${escapeHtml(item.change_reason || (item.version_number === 1 ? 'Authored.' : ''))}</span>
        </div>`).join('')}</div>` : ''}
    </div>`;
}

function showSession(sessionId) {
  const session = (record?.sessions || []).find((item) => item.id === sessionId);
  if (!session) return;
  openSession = sessionId;
  const drawer = document.getElementById('sessionDrawer');
  drawer.innerHTML = drawerHtml(session);
  drawer.classList.add('on');
  document.getElementById('sessionScrim').classList.add('on');
  drawer.querySelector('.dClose')?.focus();
}

function closeSessionDrawer() {
  openSession = null;
  document.getElementById('sessionDrawer')?.classList.remove('on');
  document.getElementById('sessionScrim')?.classList.remove('on');
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


// ── THE PHOTO LAB ───────────────────────────────────────────────────────────
//
// The portrait is the design's central premise and every column has been a
// monogram since the first build. The bucket, the columns, the policies and the
// writer all existed; what was missing was somewhere to stand while you decide
// how a photograph is cropped.
//
// So it crops against the real column rather than a preview pane — the sliders
// write the same custom properties paint() writes, so what moves under your hand
// is the bench itself. Nothing is saved until you keep it, and what is kept is
// six numbers on the athlete, not on this browser.

const PL = {};
let plFile = null;
let plCrop = null;

const plAthlete = () => bench.find((entry) => entry.slug === PL.who?.value) || null;

function plSync() {
  const entry = plAthlete();
  if (!entry) return;
  plCrop = plCrop || {
    x: entry.portrait_x ?? 50, y: entry.portrait_y ?? 40,
    zoom: Math.round((entry.portrait_zoom ?? 1) * 100),
    exposure: Math.round((entry.portrait_exposure ?? 0.9) * 100),
    contrast: Math.round((entry.portrait_contrast ?? 1.16) * 100),
    grade: Math.round((entry.portrait_grade ?? 0.2) * 100)
  };
  PL.x.value = plCrop.x; PL.y.value = plCrop.y; PL.z.value = plCrop.zoom;
  PL.e.value = plCrop.exposure; PL.c.value = plCrop.contrast; PL.g.value = plCrop.grade;
  PL.xv.textContent = `${plCrop.x}%`; PL.yv.textContent = `${plCrop.y}%`;
  PL.zv.textContent = `${plCrop.zoom}%`; PL.ev.textContent = `${plCrop.exposure}%`;
  PL.cv.textContent = `${plCrop.contrast}%`; PL.gv.textContent = `${plCrop.grade}%`;
  plApply();
}

// Straight onto the live column, through the CSSOM. Same properties paint()
// writes, so the preview and the saved state cannot disagree.
function plApply() {
  const entry = plAthlete();
  if (!entry || !plCrop) return;
  document.querySelectorAll(`[data-portrait="${entry.slug}"]`).forEach((img) => {
    if (plFile) { img.setAttribute('src', plFile.url); img.classList.add('has-photo'); }
    img.style.setProperty('--px', `${plCrop.x}%`);
    img.style.setProperty('--py', `${plCrop.y}%`);
    img.style.setProperty('--pz', String(plCrop.zoom / 100));
    img.style.setProperty('--exp', String(plCrop.exposure / 100));
    img.style.setProperty('--con', String(plCrop.contrast / 100));
    img.style.setProperty('--grade', String(plCrop.grade / 100));
  });
}

function bindPhotoLab() {
  ['who', 'file', 'x', 'y', 'z', 'e', 'c', 'g', 'xv', 'yv', 'zv', 'ev', 'cv', 'gv', 'note'].forEach((key) => {
    PL[key] = document.getElementById('pl' + key.charAt(0).toUpperCase() + key.slice(1));
  });
  const panel = document.getElementById('plPanel');
  const toggle = document.getElementById('plToggle');
  if (!panel || !toggle) return;

  const open = (on) => {
    panel.classList.toggle('on', on);
    toggle.setAttribute('aria-expanded', String(on));
    if (on) {
      PL.who.innerHTML = bench.slice().sort(benchOrder)
        .map((entry) => `<option value="${escapeHtml(entry.slug)}">${escapeHtml(entry.first_name)}</option>`).join('');
      plFile = null; plCrop = null; plSync();
    }
  };
  toggle.addEventListener('click', () => open(!panel.classList.contains('on')));
  document.getElementById('plClose').addEventListener('click', () => open(false));
  PL.who.addEventListener('change', () => { plFile = null; plCrop = null; plSync(); });

  PL.file.addEventListener('change', () => {
    const chosen = PL.file.files[0];
    if (!chosen) return;
    if (plFile?.url) URL.revokeObjectURL(plFile.url);
    plFile = { file: chosen, url: URL.createObjectURL(chosen) };
    PL.note.textContent = `${chosen.name} — not saved yet.`;
    plApply();
  });

  const map = { x: 'x', y: 'y', z: 'zoom', e: 'exposure', c: 'contrast', g: 'grade' };
  Object.entries(map).forEach(([key, field]) => {
    PL[key].addEventListener('input', () => {
      if (!plCrop) plSync();
      plCrop[field] = Number(PL[key].value);
      PL[`${key}v`].textContent = `${plCrop[field]}%`;
      plApply();
    });
  });

  document.getElementById('plKeep').addEventListener('click', async () => {
    const entry = plAthlete();
    if (!entry || !plCrop) return;
    const button = document.getElementById('plKeep');
    button.disabled = true; PL.note.textContent = 'Keeping…';
    try {
      await savePortrait(entry.id, plFile?.file || null, {
        x: plCrop.x, y: plCrop.y,
        zoom: plCrop.zoom / 100, exposure: plCrop.exposure / 100,
        contrast: plCrop.contrast / 100, grade: plCrop.grade / 100
      });
      bench = await loadCoachBench(access.coachMemberships);
      plFile = null; plCrop = null;
      render(); open(true);
      PL.note.textContent = 'Kept. It is the athlete\'s crop now, on every surface.';
    } catch (error) {
      PL.note.textContent = error.message;
    } finally { button.disabled = false; }
  });

  document.getElementById('plRemove').addEventListener('click', async () => {
    const entry = plAthlete();
    if (!entry) return;
    PL.note.textContent = 'Removing…';
    try {
      // The framing survives the photograph. Taking a picture down is not
      // forgetting how it was cropped.
      await savePortrait(entry.id, null, { clear: true });
      bench = await loadCoachBench(access.coachMemberships);
      plFile = null; plCrop = null;
      render(); PL.note.textContent = 'Removed. The crop values are kept.';
    } catch (error) { PL.note.textContent = error.message; }
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

// FILE EVIDENCE.
//
// The smallest thing that closes the loop, on the filing path that already
// exists. No readiness score, no completion percentage, no second evidence
// model: status, what was actually run, how hard it felt, what they said, and
// the splits where the session had reps to split.
//
// Splits are the part that matters. A distance and a clock make a session; the
// per-rep paces are what a verdict is computed from, and `athlete_continuous_owned`
// reads pieces and nothing else. So a session with repetitions asks for them,
// one line per rep, and a steady run does not pretend to have any.
function openFiling(sessionId) {
  const session = (record?.sessions || []).find((item) => item.id === sessionId);
  if (!session || !fileable(session).can) return;
  const version = session.currentVersion;
  const reps = workParts(version).find((part) => part.shape === 'repetitions');
  const asked = authoredMiles(version);
  pending = { kind: 'file', sessionId };
  document.getElementById('shKind').textContent = 'FILE EVIDENCE';
  document.getElementById('shTitle').textContent = titleOf(session);
  document.getElementById('shSub').textContent = [
    session.scheduled_on ? dayLabel(session.scheduled_on) : '',
    asked != null ? `asked for ${Number(asked)} mi` : ''
  ].filter(Boolean).join(' · ');
  document.getElementById('shNote').textContent = 'Appended. A correction later keeps this reading.';
  document.getElementById('shBody').innerHTML = `
    <div class="f"><label for="flStatus">WHAT HAPPENED</label>
      <select id="flStatus">
        <option value="completed">Completed</option>
        <option value="partial">Partial</option>
        <option value="changed">Changed — did something else</option>
        <option value="skipped">Did not complete</option>
      </select></div>
    <div class="fRow">
      <div class="f"><label for="flDist">DISTANCE</label>
        <input id="flDist" type="number" step="0.01" min="0" placeholder="${escapeHtml(asked != null ? Number(asked) : '')}">
        <p class="hint">Whole session, miles.</p></div>
      <div class="f"><label for="flTime">TIME</label>
        <input id="flTime" type="text" placeholder="1:04:12 or 64:12">
        <p class="hint">Blank if unknown.</p></div>
    </div>
    <div class="fRow">
      <div class="f"><label for="flRpe">RPE</label>
        <input id="flRpe" type="number" min="1" max="10" placeholder="1–10"></div>
      <div class="f"><label for="flSurface">SURFACE</label>
        <select id="flSurface"><option value="">—</option><option value="outdoor">Outdoor</option>
          <option value="treadmill">Treadmill</option><option value="track">Track</option></select></div>
    </div>
    ${reps ? `<div class="f"><label for="flSplits">SPLITS</label>
      <textarea id="flSplits" placeholder="6:31&#10;6:28&#10;6:30"></textarea>
      <p class="hint">One pace per line, in the order they were run. ${
        escapeHtml(reps.repeat_count || '')} asked for. These are what a verdict reads —
        and the only thing continuous ownership is computed from.</p></div>` : ''}
    <div class="f"><label for="flSaid">WHAT THEY SAID</label>
      <textarea id="flSaid" placeholder="Their words, not your summary."></textarea></div>
    <p class="hint err" id="flError"></p>`;
  sheet.classList.add('on'); shScrim.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
  document.getElementById('flDist').focus();
}

// "1:04:12", "64:12" and "3840" all mean the same thing to a coach typing fast.
function seconds(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const parts = raw.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

async function keepFiling() {
  const session = (record?.sessions || []).find((item) => item.id === pending.sessionId);
  const version = session?.currentVersion;
  const error = document.getElementById('flError');
  const status = document.getElementById('flStatus').value;
  const distance = Number(document.getElementById('flDist').value) || null;
  const duration = seconds(document.getElementById('flTime').value);
  const rpe = Number(document.getElementById('flRpe').value) || null;
  if (status !== 'skipped' && !distance && !duration) {
    error.textContent = 'A filing needs a distance or a time. Skipped needs neither.';
    return;
  }

  // Pieces carry their own pace, which is the whole point: a rep is judged on
  // what it ran, never on the session average. Distance comes from what was
  // asked for, because the coach is typing paces off a watch, not re-measuring.
  const repPart = workParts(version).find((part) => part.shape === 'repetitions');
  const splitField = document.getElementById('flSplits');
  const pieces = [];
  if (repPart && splitField) {
    const each = repPart.distance != null
      ? (repPart.distance_unit === 'km' ? Number(repPart.distance) * 0.621371 : Number(repPart.distance))
      : null;
    splitField.value.split(/[\n,]/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
      const pace = seconds(line);
      if (!pace) return;
      pieces.push({
        kind: 'rep', paceSeconds: pace,
        ...(each ? { distance: Number(each.toFixed(2)), distanceUnit: 'mi',
                     durationSeconds: Math.round(pace * each) } : {})
      });
    });
    if (splitField.value.trim() && !pieces.length) {
      error.textContent = 'Splits read as paces — 6:31 per line.'; return;
    }
  }

  const button = document.getElementById('shSave');
  button.disabled = true; error.textContent = '';
  try {
    await fileForAthlete({
      athleteId: record.athlete.id,
      plannedSessionId: session.id,
      status,
      actualDistance: distance,
      durationSeconds: duration,
      rpe,
      surface: document.getElementById('flSurface').value || null,
      athleteNote: document.getElementById('flSaid').value.trim() || null
    }, pieces);
    closeSheet();
    await selectAthlete(record.athlete.slug, { silent: true });
    showSession(session.id);
  } catch (failure) {
    error.textContent = failure.message;
  } finally { button.disabled = false; }
}

// REVISE.
//
// Title, dose, intent, reason. The reason is not optional and it is not
// bookkeeping: it is the thing that is still legible in six weeks when someone
// asks why Tuesday is five miles instead of four. The RPC enforces it.
//
// Components are carried forward untouched unless the dose changes, and when it
// does only the one work piece moves — the total is recomputed from the parts
// rather than typed, so a session can never again declare a distance its own
// anatomy does not add up to.
function openRevise(sessionId) {
  const session = (record?.sessions || []).find((item) => item.id === sessionId);
  if (!session || !revisable(session).can) return;
  const version = session.currentVersion;
  const dose = soleWorkDistance(version);
  pending = { kind: 'revise', sessionId };
  document.getElementById('shKind').textContent = 'REVISE';
  document.getElementById('shTitle').textContent = titleOf(session);
  document.getElementById('shSub').textContent = [
    session.scheduled_on ? dayLabel(session.scheduled_on) : '',
    `v${version?.version_number ?? 1}`
  ].filter(Boolean).join(' · ');
  document.getElementById('shNote').textContent = 'Appends a version. Nothing is overwritten.';
  document.getElementById('shBody').innerHTML = `
    <div class="f"><label for="rvTitle">TITLE</label>
      <input id="rvTitle" type="text" value="${escapeHtml(version?.title || '')}"></div>
    ${dose
      ? `<div class="f"><label for="rvDose">THE WORK</label>
          <input id="rvDose" type="number" step="0.1" min="0"
            value="${escapeHtml(Number(dose.distance))}">
          <p class="hint">${escapeHtml(dose.distance_unit || 'mi')}${
            dose.pace_low ? ` at ${dose.pace_low}${dose.pace_high ? `–${dose.pace_high}` : ' or slower'}` : ''
          }. The session total is recomputed from the pieces, never typed.</p></div>`
      : `<div class="f"><label>THE WORK</label>
          <p class="hint">${escapeHtml(structureOf(version) || 'No typed anatomy')} — composite work is
          re-authored in the Console, where each piece can be changed on purpose.</p></div>`}
    <div class="f"><label for="rvIntent">INTENT</label>
      <textarea id="rvIntent" placeholder="Blank keeps the sentence it already has."></textarea></div>
    <div class="f"><label for="rvReason">WHY</label>
      <input id="rvReason" type="text" placeholder="Still legible in six weeks.">
      <p class="hint">Required. A revision without a reason is a mystery later.</p></div>
    <p class="hint err" id="rvError"></p>`;
  sheet.classList.add('on'); shScrim.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
  document.getElementById('rvTitle').focus();
}

async function keepRevision() {
  const session = (record?.sessions || []).find((item) => item.id === pending.sessionId);
  const version = session?.currentVersion;
  const error = document.getElementById('rvError');
  const title = document.getElementById('rvTitle').value.trim();
  const reason = document.getElementById('rvReason').value.trim();
  if (!title) { error.textContent = 'A session needs a title.'; return; }
  if (!reason) { error.textContent = 'A revision needs a reason.'; return; }

  const doseField = document.getElementById('rvDose');
  const dose = soleWorkDistance(version);
  let components = null;
  let total = authoredMiles(version);
  if (dose && doseField) {
    const next = Number(doseField.value);
    if (!(next > 0)) { error.textContent = 'The work needs a distance.'; return; }
    components = (version.components || []).slice().sort((a, b) => a.position - b.position)
      .map((part) => {
        const wire = {
          role: part.role, shape: part.shape, position: part.position,
          ...(part.distance != null ? { distance: Number(part.distance), distanceUnit: part.distance_unit } : {}),
          ...(part.duration_seconds != null ? { durationSeconds: part.duration_seconds } : {}),
          ...(part.pace_low_seconds != null ? { paceLowSeconds: part.pace_low_seconds } : {}),
          ...(part.pace_high_seconds != null ? { paceHighSeconds: part.pace_high_seconds } : {}),
          ...(part.recovery_kind ? { recoveryKind: part.recovery_kind } : {}),
          ...(part.recovery_seconds != null ? { recoverySeconds: part.recovery_seconds } : {}),
          ...(part.repeat_count != null ? { repeatCount: part.repeat_count } : {}),
          // Eligibility travels with the piece. Without this a dose edit would
          // silently un-eligible the component and the number would only be seen
          // to be wrong when a rung failed to land.
          ...(part.counts_toward_mark_id ? { countsTowardMarkId: part.counts_toward_mark_id } : {})
        };
        if (part.id === dose.id) wire.distance = next;
        return wire;
      });
    // The total follows the parts. This is the rule the whole 4 September
    // normalisation existed to establish, and the editor must not be the one
    // place that breaks it.
    total = components.reduce((sum, part) => {
      const reps = part.shape === 'repetitions' ? (part.repeatCount || 1) : 1;
      if (part.distance != null) {
        return sum + (part.distanceUnit === 'km' ? part.distance * 0.621371 : part.distance) * reps;
      }
      if (part.durationSeconds != null) return sum + (part.durationSeconds * reps) / (part.paceLowSeconds || 525);
      return sum;
    }, 0);
    total = Number(total.toFixed(2));
  }

  const button = document.getElementById('shSave');
  button.disabled = true; error.textContent = '';
  try {
    await reviseSession(pending.sessionId, {
      title,
      intent: document.getElementById('rvIntent').value.trim() || null,
      changeReason: reason,
      prescribedDistance: total,
      distanceUnit: version?.distance_unit || 'mi',
      components
    });
    closeSheet();
    await selectAthlete(record.athlete.slug, { silent: true });
    showSession(session.id);
  } catch (failure) {
    error.textContent = failure.message;
  } finally { button.disabled = false; }
}

// A standing fact goes in through the same drawer a read does, because it is the
// same act: you looked at something and concluded something. The difference is
// only that a read answers a report and this answers the athlete.
function openObservation() {
  pending = { kind: 'observation' };
  document.getElementById('shKind').textContent = 'STANDING FACT';
  document.getElementById('shTitle').textContent = `What is true about ${record.athlete.first_name}`;
  document.getElementById('shSub').textContent = 'Superseded, never overwritten.';
  document.getElementById('shNote').textContent = 'Shown on the athlete page until something replaces it.';
  document.getElementById('shBody').innerHTML = `
    <div class="f"><label for="obFacet">WHICH KIND</label>
      <select id="obFacet">${FACETS.map(([key, word]) =>
        `<option value="${escapeHtml(key)}">${escapeHtml(word)}</option>`).join('')}</select></div>
    <div class="f"><label for="obSource">WHOSE FACT</label>
      <select id="obSource">
        <option value="coach_observed">You saw it</option>
        <option value="athlete_reported">They said it</option>
      </select></div>
    <div class="f"><label for="obText">THE SENTENCE</label>
      <textarea id="obText" placeholder="Heat costs him more than distance does."></textarea>
      <p class="hint">One fact, in the words you would use standing next to them.</p></div>
    <p class="hint err" id="obError"></p>`;
  sheet.classList.add('on'); shScrim.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
  document.getElementById('obText').focus();
}

async function keepObservation() {
  const error = document.getElementById('obError');
  const text = document.getElementById('obText').value.trim();
  if (!text) { error.textContent = 'A standing fact needs a sentence.'; return; }
  const button = document.getElementById('shSave');
  button.disabled = true; error.textContent = '';
  try {
    await addObservation({
      athleteId: record.athlete.id,
      facet: document.getElementById('obFacet').value,
      source: document.getElementById('obSource').value,
      observation: text
    });
    closeSheet();
    await selectAthlete(record.athlete.slug, { silent: true });
  } catch (failure) {
    error.textContent = failure.message;
  } finally { button.disabled = false; }
}

// One write, then one status change, then the record is re-read. The read is
// what clears the item; the status change is what records that it was cleared
// and why. Both name the evidence.
async function keepRead() {
  if (pending?.kind === 'observation') { await keepObservation(); return; }
  if (pending?.kind === 'revise') { await keepRevision(); return; }
  if (pending?.kind === 'file') { await keepFiling(); return; }
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
  // `block` is the route this view used to answer to. It still resolves, so a
  // link kept in a note from last week opens the plan rather than nothing.
  if (kind === 'a' && slug && leaf === 'week') return { view: 'week', slug, week: hash.split('/')[3] };
  if (kind === 'a' && slug) return { view: (leaf === 'plan' || leaf === 'block') ? 'plan' : 'athlete', slug };
  if (kind === 'brief') return { view: 'brief' };
  return { view: 'bench' };
}

function markNav(view, slug) {
  nav.hidden = false;
  document.getElementById('viewAs').hidden = false;
  // Bench, Brief and the Console are the coach's surfaces. An athlete has one
  // plan and one week; showing them doors into other people's records would be
  // a different product with a permissions bug in it.
  nav.querySelectorAll('button').forEach((button) => {
    button.hidden = !asCoach() && button.dataset.nav !== 'plan';
  });
  document.getElementById('plToggle').hidden = !asCoach();
  nav.querySelectorAll('button').forEach((button) => button.classList.remove('on'));
  const which = view === 'bench' ? 'bench' : view === 'brief' ? 'brief'
    : (view === 'plan' || view === 'week') ? 'plan' : null;
  if (which) nav.querySelector(`[data-nav="${which}"]`)?.classList.add('on');
  // Plan stays visible. With nobody chosen it opens the first athlete on the
  // bench, which is the one who needs you.
}

async function selectAthlete(slug, { silent = false } = {}) {
  const entry = bench.find((item) => item.slug === slug);
  if (!entry) { location.hash = '#/bench'; return; }
  if (!silent) app.innerHTML = '<div class="loading">READING THE RECORD</div>';
  record = await loadAthleteRecord(entry.id, { coach: true });
  attention = await loadAttentionFor(entry.id);
  render();
}

// Where you were reading. Studying week ten and opening it should not cost you
// your place in the season on the way back.
let planScroll = 0;

function render() {
  closeSessionDrawer();
  const scroller = document.querySelector('.pgScroll');
  if (scroller) planScroll = scroller.scrollLeft;
  const { view, slug } = route();
  if (view === 'bench') app.innerHTML = benchHtml();
  else if (view === 'brief') app.innerHTML = briefHtml();
  else if (view === 'plan') app.innerHTML = planHtml();
  else if (view === 'week') app.innerHTML = weekHtml(route().week);
  else app.innerHTML = athleteHtml();
  markNav(view, slug);
  paint();
  if (view === 'plan') {
    const back = document.querySelector('.pgScroll');
    if (back && planScroll) back.scrollLeft = planScroll;
  }
}

async function show() {
  const { view, slug } = route();
  // `viewAs` is not a route. Landing on a coach surface while looking through
  // the athlete's eyes goes to the plan rather than rendering a page the athlete
  // would never be given.
  if (!asCoach() && (view === 'bench' || view === 'brief' || view === 'athlete')) {
    const who = slug || record?.athlete?.slug || bench.slice().sort(benchOrder)[0]?.slug;
    if (who) { location.hash = `#/a/${who}/plan`; return; }
  }
  if (view === 'bench' || view === 'brief') { render(); return; }
  if (record?.athlete?.slug !== slug) { await selectAthlete(slug); return; }
  render();
}

// ── binding ─────────────────────────────────────────────────────────────────

document.addEventListener('click', (event) => {
  const column = event.target.closest('[data-slug]');
  if (column) { location.hash = `#/a/${column.dataset.slug}`; return; }

  const copy = event.target.closest('[data-copy]');
  if (copy) {
    const box = document.querySelector(`[data-ask="${copy.dataset.copy}"]`);
    if (box) navigator.clipboard.writeText(box.value.trim()).then(() => {
      copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1400);
    }).catch(() => {});
    return;
  }

  if (event.target.closest('[data-drawer="close"]') || event.target.closest('#sessionScrim')) {
    closeSessionDrawer(); return;
  }
  const cell = event.target.closest('[data-session]');
  if (cell) { showSession(cell.dataset.session); return; }

  const toWeek = event.target.closest('[data-week-to]');
  if (toWeek) {
    const slug = record?.athlete?.slug || route().slug;
    if (slug) { location.hash = `#/a/${slug}/week/${toWeek.dataset.weekTo}`; return; }
  }

  const file = event.target.closest('[data-file]');
  if (file) { closeSessionDrawer(); openFiling(file.dataset.file); return; }

  const revise = event.target.closest('[data-revise]');
  if (revise) { closeSessionDrawer(); openRevise(revise.dataset.revise); return; }

  if (event.target.closest('[data-observe]')) { openObservation(); return; }

  const read = event.target.closest('[data-read]');
  if (read) { openRead(read.dataset.read, read.dataset.completion); return; }

  const week = event.target.closest('[data-week]');
  if (week) { document.getElementById(`wk-${week.dataset.week}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  const go = event.target.closest('[data-nav]');
  if (!go) return;
  const where = go.dataset.nav;
  if (where === 'console') { location.href = '/coach/console/'; return; }
  if (where === 'bench') { location.hash = '#/bench'; return; }
  if (where === 'brief') { location.hash = '#/brief'; return; }
  const slug = record?.athlete?.slug || route().slug
    || bench.slice().sort(benchOrder)[0]?.slug;
  if (!slug) return;
  location.hash = where === 'plan' ? `#/a/${slug}/plan` : `#/a/${slug}`;
});

document.getElementById('viewAs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view-as]');
  if (!button || button.dataset.viewAs === viewAs) return;
  viewAs = button.dataset.viewAs;
  document.querySelectorAll('#viewAs button').forEach((item) =>
    item.classList.toggle('on', item.dataset.viewAs === viewAs));
  closeSessionDrawer(); closeSheet();
  show().catch(fail);
});

document.getElementById('shClose').addEventListener('click', closeSheet);
document.getElementById('shCancel').addEventListener('click', closeSheet);
shScrim.addEventListener('click', closeSheet);
document.getElementById('shSave').addEventListener('click', keepRead);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (openSession) { closeSessionDrawer(); return; }
  closeSheet();
});
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
    bindPhotoLab();
    if (!location.hash) location.hash = '#/bench';
    await show();
  } catch (error) { fail(error); }
}

boot();
