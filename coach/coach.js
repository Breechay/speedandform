import { bindAccountSecurity, authErrorMessage, getAccessContext, renderDoorway, signOut } from '/private/auth.js';
import { addPrivateNote, authorSession, proofCoverage, setConfidence, createDirection, createRead, editFiledSession, fileForAthlete, judgeClaim, moveCheckpoint, loadAthleteRecord, loadAttentionFor, loadCoachRoster, publishRecordExcerpt, resolveCoachTask, reviseSession } from '/private/data.js';
import { directionWords, escapeHtml, formatDate } from '/private/record.js';

// Account states only. The desk no longer labels athletes by a stored state —
// the queue is derived from the record.
const stateLabels = {
  needs_you: 'Needs you', ready_to_publish: 'Ready to publish', plan_changed: 'Plan changed',
  on_track: 'On track', nothing_needed: 'Nothing needed', resolved: 'Resolved'
};

// What each kind of attention actually asks the coach to do. The primary act
// follows the situation instead of offering every object every time.
const attentionKinds = {
  recovery_flag:     { label: 'Recovery',  act: 'read',      cta: 'Respond' },
  authored:          { label: 'Needs you', act: 'decision',  cta: 'Decide' },
  unread_session:    { label: 'Waiting on you', act: 'read',     cta: 'Respond' },
  missing_direction: { label: 'No Direction', act: 'direction', cta: 'Set the plan' },
  week_unclosed:     { label: 'Week open', act: 'decision',  cta: 'Decide' }
};

const app = document.getElementById('app');
const signOutButton = document.getElementById('signOut');
const userEmail = document.getElementById('userEmail');
const dialogs = [...document.querySelectorAll('dialog')];
const decisionDialog = document.getElementById('decisionDialog');
const decisionForm = document.getElementById('decisionForm');
const coachingDialog = document.getElementById('coachingDialog');
const coachingForm = document.getElementById('coachingForm');
const noteDialog = document.getElementById('noteDialog');
const noteForm = document.getElementById('noteForm');
const shareDialog = document.getElementById('shareDialog');
const shareForm = document.getElementById('shareForm');
const sessionDialog = document.getElementById('sessionDialog');
const sessionForm = document.getElementById('sessionForm');
const fileDialog = document.getElementById('fileDialog');
const fileForm = document.getElementById('fileForm');
// Set when the filing dialog is correcting an existing entry rather than adding one.
let editingCompletionId = null;
const judgeDialog = document.getElementById('judgeDialog');
const judgeForm = document.getElementById('judgeForm');
const confidenceDialog = document.getElementById('confidenceDialog');
const confidenceForm = document.getElementById('confidenceForm');
const ladderDialog = document.getElementById('ladderDialog');
const rungDialog = document.getElementById('rungDialog');
const rungForm = document.getElementById('rungForm');
let editingCheckpointId = null;
let judgingCompletionId = null;
// Set when the session dialog is revising rather than authoring. A revision
// appends a version; authoring makes the session.
let revisingSessionId = null;
let roster = [];
let selectedId = null;
let selectedRecord = null;
let shownWeekId = null;
let shownSessionId = null;
// Set when an ad hoc filing is open rather than an authored session.
let shownCompletionId = null;
// Ordering is a mode, never a permanent rearrangement of the roster.
let attentionOrder = false;

async function authView() {
  document.body.classList.add('auth-only');
  await renderDoorway(app, { destination: '/coach/', label: 'Coach sign in' });
}

function pendingView(email) {
  app.innerHTML = `<section class="auth-page"><div class="auth-card"><p class="eyebrow">Signed in</p><h1>No coach assignment yet.</h1><p>${escapeHtml(email)} is authenticated, but this account has not been assigned to the roster.</p></div></section>`;
}

function initials(name) { return String(name || '').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

// The standing authored confidence: the newest read nothing has superseded, read
// from mark_standing_confidence through the roster. One source for every surface
// that shows the figure, because the tabs and the hero showing different numbers
// is how confidence and coverage got conflated in the first place. Proof coverage
// is a different instrument and never stands in for this.
function standingConfidence(athleteId, markId) {
  const read = roster.find((entry) => entry.id === athleteId)?.mark?.confidence || null;
  // Filtered by the active mark. A read belonging to another mark is another
  // claim's judgment and must never stand in for this one.
  if (!read) return null;
  return !markId || read.mark_id === markId ? read : null;
}

// Provenance, not permission. A rung whose source is legacy moved before anything
// recorded what moved it, so it is shown with that said out loud rather than
// hidden. The program clock never waits on a review: the week advances, the next
// session is there, and an unreviewed ladder is a note beside a number, not a
// gate in front of one.
function ladderProvenance(mark) {
  const points = (mark?.checkpoints || []).filter((point) =>
    point.state === 'reached' || point.state === 'repeated');
  if (!points.length) return null;
  if (points.every((point) => point.source === 'legacy')) return 'legacy state, not evidenced here';
  if (points.some((point) => point.source === 'legacy')) return 'some rungs are legacy state';
  if (points.every((point) => point.source === 'automatic')) return 'advanced on filed evidence';
  return null;
}

function rosterHtml() {
  // Four shallow tabs. This band selects an athlete and does nothing else: a rung
  // in the navigation turned orientation into an editor, and four ladders stacked
  // down the page pushed the actual work below the fold.
  const tab = (athlete) => {
    const read = standingConfidence(athlete.id, athlete.mark?.id);
    return `<button class="consoleAthleteTab${athlete.id === selectedId ? ' consoleAthleteTab--on' : ''}"
      type="button" data-select-athlete="${escapeHtml(athlete.id)}"
      ${athlete.id === selectedId ? 'aria-current="true"' : ''}>
      <span class="consoleAthleteTab__name">${escapeHtml(athlete.first_name || athlete.display_name)}</span>
      <em class="consoleAthleteTab__score">${read ? `${escapeHtml(read.score)}%` : '\u2014'}</em>
    </button>`;
  };
  const order = attentionOrder
    ? roster.slice().sort((a, b) => (standingConfidence(a.id, a.mark?.id)?.score ?? -1) - (standingConfidence(b.id, b.mark?.id)?.score ?? -1))
    : roster;
  return order.map(tab).join('');
}

function athleteMenuHtml() {
  const account = selectedRecord.adminStatus;
  const notes = selectedRecord.privateNotes.slice(0, 3).map((note) =>
    `<article class="private-note"><time>${new Date(note.created_at).toLocaleDateString()}</time><p>${escapeHtml(note.body)}</p></article>`).join('');
  return `<details class="athlete-menu" id="athleteMenu">
    <summary aria-label="Coach only">\u2026</summary>
    <div class="control-menu wide">
      <p class="control-who">${escapeHtml(account?.relationship_label || selectedRecord.athlete.account_label)}</p>
      ${notes || '<p class="control-who">No private notes.</p>'}
      <button class="control-item" id="setPassword" type="button">Set a password</button>
      <button class="control-item" id="linkApple" type="button" hidden>Link Apple</button>
      <button class="control-item" id="newSession" type="button">Add a session</button>
      <button class="control-item" data-console-action="file-run" type="button">File a run</button>
      <button class="control-item" id="addPrivateNote" type="button">Add a private note</button>
      <button class="control-item" id="shareExcerpt" type="button">Create a share card</button>
    </div>
  </details>`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dayLabel = (iso) => {
  const date = new Date(`${iso}T12:00:00`);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};
// "Aug 31 to Sep 6" collapses to "Aug 31–Sep 6"; a range inside one month
// collapses further to "Sep 7–13", which is how the dates read on paper.
const rangeLabel = (from, to) => {
  if (!from || !to) return '';
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return a.getMonth() === b.getMonth()
    ? `${MONTHS[a.getMonth()]} ${a.getDate()}\u2013${b.getDate()}`
    : `${dayLabel(from)}\u2013${dayLabel(to)}`;
};

// Marcus's evidence standard is outside. A treadmill run is a real completion and
// real tolerance; it simply cannot answer the question the claim is asking, and
// saying so in words is the whole point of recording surface.
function qualifyingWords(completion) {
  const needs = selectedRecord.primaryMark?.evidence_surface_requirement;
  if (needs === 'outdoor' && completion.surface === 'treadmill') {
    return 'Completed \u00b7 non qualifying proof';
  }
  return 'Completed';
}

// The proof-bearing dose, read from the stored anatomy. Never from the title and
// never from the total: three doubles with floats, six continuous miles and a six
// mile session containing a warm up all total six, and they establish different
// things. A session with no structured dose says so rather than guessing.
function doseOf(version) {
  const work = (version?.components || []).find((part) => part.role === 'work');
  if (!work) return null;
  const unit = work.distance_unit || 'mi';
  const amount = work.distance != null
    ? `${Number(work.distance)} ${unit}`
    : `${Math.round((work.duration_seconds || 0) / 60)} min`;
  const total = work.shape === 'repetitions' && work.distance != null
    ? Number((work.distance * work.repeat_count).toFixed(2)) : null;
  const line = work.shape === 'repetitions'
    ? `${work.repeat_count} \u00d7 ${amount}`
    : `${amount} continuous`;
  // Four reps of a mile is four miles of work and one mile held. The total is
  // said so nobody reads it as the other thing, and it is never proof on its own.
  const totalLine = total != null ? `${total} ${unit} total` : null;
  const band = [work.pace_low, work.pace_high].filter(Boolean).join('\u2013');
  // A pace band is what makes a session proof bearing. An easy run and a long run
  // are authored against effort, so they are real work and not evidence for this
  // claim, and the outside condition does not apply to them.
  const proofBearing = Boolean(band);
  const qualifiers = [];
  if (band) qualifiers.push(`${band}/${unit}`);
  else if (work.rpe_low) qualifiers.push(`RPE ${work.rpe_low}\u2013${work.rpe_high}`);
  if (work.recovery_seconds != null) {
    qualifiers.push(`${Math.floor(work.recovery_seconds / 60)}:${String(work.recovery_seconds % 60).padStart(2, '0')} ${work.recovery_kind}`);
  } else if (work.recovery_kind === 'equal') {
    qualifiers.push('equal recovery');
  }
  if (proofBearing && selectedRecord.primaryMark?.evidence_surface_requirement === 'outdoor') {
    qualifiers.push('outside');
  }
  if (totalLine) qualifiers.unshift(totalLine);
  return { line, qualifiers: qualifiers.join(' \u00b7 '), work, proofBearing, totalLine };
}

// The runway. Every authored week with its real dates, the key race-pace session
// in each, and the race. Weeks are a calendar and the ladder is a capability, so
// no rung appears here: this says when the chances to change the evidence fall.
//
// Stored dates are the authority. Week 1 is Sunday anchored and starts Aug 23;
// the Monday anchored dates in the illustrative mockups are not migrated to.
function runwayHtml() {
  const weeks = (selectedRecord.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
  if (!weeks.length) return '';
  const today = new Date().toISOString().slice(0, 10);
  const shown = shownWeekId || selectedRecord.currentWeek?.id;
  const raceOn = selectedRecord.block?.race_on || null;
  // The race belongs to a week only when a week actually contains it. Marcus's
  // last authored week ends Dec 12 and he races Dec 13, so painting RACE into the
  // final column would put the race inside a week that ends before it happens.
  const raceWeek = raceOn
    ? weeks.find((week) => week.starts_on && week.ends_on && week.starts_on <= raceOn && raceOn <= week.ends_on)
    : null;

  const cells = weeks.map((week) => {
    // Today and selected are different states. Choosing another week must not
    // move today.
    const isToday = week.starts_on && week.ends_on && week.starts_on <= today && today <= week.ends_on;
    const isShown = week.id === shown;
    // The key session is the proof bearing one: the dose authored against a pace
    // band. Every session carries structure now, so "has a dose" would have made
    // the Sunday long run the headline of most weeks.
    const dose = (selectedRecord.sessionsByWeek?.[week.id] || [])
      .map((session) => doseOf(session.currentVersion))
      .filter((item) => item && item.proofBearing)[0] || null;
    return `<button class="consoleWeek${isToday ? ' consoleWeek--today' : ''}${isShown ? ' consoleWeek--shown' : ''}"
      type="button" data-week="${escapeHtml(week.id)}"
      aria-current="${isShown ? 'true' : 'false'}"
      aria-label="Week ${escapeHtml(week.week_number)}, ${escapeHtml(rangeLabel(week.starts_on, week.ends_on))}">
      <span class="consoleWeek__no">W${escapeHtml(week.week_number)}</span>
      <span class="consoleWeek__when">${escapeHtml(rangeLabel(week.starts_on, week.ends_on))}</span>
      <span class="consoleWeek__now">${isToday ? 'current week' : ''}</span>
      <span class="consoleWeek__key">${dose ? escapeHtml(dose.line) : ''}</span>
      <span class="consoleWeek__how">${dose ? escapeHtml(dose.qualifiers) : ''}</span>
      <span class="consoleWeek__race">${raceWeek && week.id === raceWeek.id ? 'race' : ''}</span>
    </button>`;
  }).join('');

  // When no authored week holds race day, it gets its own marker past the last
  // column rather than being folded into a week that does not contain it.
  const apart = raceOn && !raceWeek
    ? `<div class="consoleWeek consoleWeek--raceApart">
        <span class="consoleWeek__no">Race</span>
        <span class="consoleWeek__when">${escapeHtml(dayLabel(raceOn))}</span>
        <span class="consoleWeek__now"></span>
        <span class="consoleWeek__key"></span>
        <span class="consoleWeek__how"></span>
        <span class="consoleWeek__race"></span>
      </div>`
    : '';

  return `<section class="consoleRunwayViewport" aria-label="The block, week by week">
    <div class="consoleRunway">${cells}${apart}</div>
  </section>`;
}

// The chosen week's work, and the session under it. This is the band with
// something to act on, and it sits in the first viewport rather than below it.
function workbenchHtml() {
  const weeks = (selectedRecord.weeks || []);
  const shown = weeks.find((week) => week.id === (shownWeekId || selectedRecord.currentWeek?.id)) || weeks[0];
  if (!shown) return '';
  // Calendar order, from the stored dates. The long run is stored on the week's
  // first day, so a Sunday anchored week opens with it.
  const sessions = (selectedRecord.sessionsByWeek?.[shown.id] || [])
    .filter((session) => session.currentVersion)
    .sort((a, b) => String(a.scheduled_on).localeCompare(String(b.scheduled_on)));
  const picked = sessions.find((session) => session.id === shownSessionId) || sessions[0];

  const rows = sessions.map((session) => {
    const version = session.currentVersion;
    const done = (selectedRecord.completions || []).find((item) => item.planned_session_id === session.id);
    const dose = doseOf(version);
    return `<button class="consoleWorkRow${session.id === picked?.id ? ' consoleWorkRow--on' : ''}${done ? ' consoleWorkRow--done' : ''}"
      type="button" data-session="${escapeHtml(session.id)}">
      <span class="consoleWorkRow__day">${escapeHtml(String(session.day_label).slice(0, 3))}<em>${escapeHtml(session.scheduled_on ? dayLabel(session.scheduled_on) : '')}</em></span>
      <span class="consoleWorkRow__dose">${dose
        ? escapeHtml(dose.line)
        : version.prescribed_distance ? `${escapeHtml(Number(version.prescribed_distance))}<i>mi</i>`
        : version.prescribed_duration_minutes ? `${escapeHtml(version.prescribed_duration_minutes)}<i>min</i>` : ''}</span>
      <span class="consoleWorkRow__what">${escapeHtml(version.title)}
        ${dose ? `<em>${escapeHtml(dose.qualifiers)}</em>` : ''}</span>
    </button>`;
  }).join('');

  // Work that was filed against no prescription. It belongs to the record, but it
  // is not a planned session and must never be dressed as one.
  const adHoc = (selectedRecord.completions || []).filter((item) =>
    !item.planned_session_id && item.filed_at
      && item.filed_at.slice(0, 10) >= shown.starts_on && item.filed_at.slice(0, 10) <= shown.ends_on);

  return `<section class="consoleWorkbench">
    <div class="consoleWorkbench__week">
      <p class="consoleWorkbench__head">Week ${escapeHtml(shown.week_number)}<span>${escapeHtml(rangeLabel(shown.starts_on, shown.ends_on))}</span></p>
      ${rows || '<p class="consoleWorkbench__empty">Nothing authored for this week.</p>'}
      ${adHoc.map((item) => `<button class="consoleWorkRow consoleWorkRow--adhoc" type="button"
        data-completion="${escapeHtml(item.id)}">
        <span class="consoleWorkRow__day">${escapeHtml(dayLabel(item.filed_at.slice(0, 10)))}</span>
        <span class="consoleWorkRow__dose">${escapeHtml(Number(item.actual_distance || 0))}<i>mi</i></span>
        <span class="consoleWorkRow__what">Ad hoc${item.surface ? ` \u00b7 ${escapeHtml(item.surface)}` : ''}
          <em>${escapeHtml(qualifyingWords(item))}</em></span>
      </button>`).join('')}
    </div>
    <div class="consoleWorkbench__inspector">${
      shownCompletionId
        ? adHocInspectorHtml((selectedRecord.completions || []).find((item) => item.id === shownCompletionId))
        : picked ? sessionInspectorHtml(picked) : ''}</div>
  </section>`;
}

// A filing with no prescription behind it. It is shown as what it is: work that
// happened, with the record's own words about whether it can carry the claim.
function adHocInspectorHtml(completion) {
  if (!completion) return '';
  const clock = (seconds) => seconds ? `${Math.floor(seconds / 60)}:${String(Math.round(seconds) % 60).padStart(2, '0')}` : '';
  return `<div class="inspect">
    <p class="ins-when">${escapeHtml(dayLabel(completion.filed_at.slice(0, 10)))} \u00b7 ad hoc</p>
    <h3 class="ins-what">${escapeHtml(completion.title || 'Filed without a prescription')}</h3>
    <p class="ins-dose"><span>${escapeHtml([
      completion.actual_distance ? `${Number(completion.actual_distance)} mi total` : '',
      completion.duration_seconds ? clock(completion.duration_seconds) : ''
    ].filter(Boolean).join(' \u00b7 '))}</span></p>
    ${evidenceFactsHtml(completion)}
    <div class="ins-actions">
      <button type="button" data-correct="${escapeHtml(completion.id)}">CORRECT ENTRY</button>
      <button type="button" data-judge="${escapeHtml(completion.id)}">SAY WHAT THIS DID</button>
    </div>
  </div>`;
}

function sessionInspectorHtml(session) {
  const version = session.currentVersion;
  const done = (selectedRecord.completions || []).find((item) => item.planned_session_id === session.id);
  const head = `<p class="ins-when">${escapeHtml(session.day_label)}${session.scheduled_on ? ` \u00b7 ${escapeHtml(dayLabel(session.scheduled_on))}` : ''}</p>
    <h3 class="ins-what">${escapeHtml(version.title)}${
      selectedRecord.primaryMark?.evidence_surface_requirement === 'outdoor' && /race pace/i.test(version.title || '')
        ? ' <em>outside</em>' : ''}</h3>`;

  // Once a session is filed the same inspector becomes the evidence, rather than
  // sending the coach to a different surface to read what happened.
  if (done) return `<div class="inspect">
    ${head}
    ${evidenceFactsHtml(done)}
    <div class="ins-actions">
      <button type="button" data-correct="${escapeHtml(done.id)}">CORRECT ENTRY</button>
      <button type="button" data-judge="${escapeHtml(done.id)}">SAY WHAT THIS DID</button>
      ${(selectedRecord.evidenceFiles || []).some((file) => file.completion_id === done.id)
        ? `<button type="button" data-console-action="source-image" data-completion-id="${escapeHtml(done.id)}">SOURCE IMAGE</button>` : ''}
    </div>
  </div>`;

  const band = [version.pace_low, version.pace_high].filter(Boolean).join('\u2013');
  const dose = doseOf(version);
  const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const anatomy = (version.components || []).map((part) => {
    const what = part.shape === 'repetitions'
      ? `${part.repeat_count} \u00d7 ${Number(part.distance)} ${part.distance_unit}`
      : part.distance != null ? `${Number(part.distance)} ${part.distance_unit} continuous`
      : `${Math.round((part.duration_seconds || 0) / 60)} min`;
    const at = [part.pace_low, part.pace_high].filter(Boolean).join('\u2013');
    const after = part.recovery_seconds != null
      ? `${clock(part.recovery_seconds)} ${part.recovery_kind}` : '';
    return `<div class="ins-part">
      <dt>${escapeHtml(String(part.role).replace('_', ' '))}</dt>
      <dd><b>${escapeHtml(what)}</b>${at ? `<span>${escapeHtml(at)}/${escapeHtml(part.distance_unit || 'mi')}</span>` : ''}
        ${after ? `<span>${escapeHtml(after)}</span>` : ''}</dd>
    </div>`;
  }).join('');

  return `<div class="inspect">
    ${head}
    ${dose ? `<p class="ins-dose"><b>${escapeHtml(dose.line)}</b><span>${escapeHtml(dose.qualifiers)}</span></p>` : ''}
    ${anatomy ? `<dl class="ins-anatomy">${anatomy}</dl>` : `<div class="ins-facts">
      ${band ? `<span><b>${escapeHtml(band)}</b>race pace</span>` : ''}
      ${version.rpe_low ? `<span><b>${escapeHtml(version.rpe_low)}\u2013${escapeHtml(version.rpe_high)}</b>RPE</span>` : ''}
    </div>`}
    ${version.details ? `<p class="ins-detail">${escapeHtml(version.details)}</p>` : ''}
    ${version.intent ? `<p class="ins-why">${escapeHtml(version.intent)}</p>` : ''}
    ${version.version_number > 1 ? `<p class="ins-rev">version ${escapeHtml(version.version_number)}${
      version.change_reason ? ` \u00b7 ${escapeHtml(version.change_reason)}` : ''}</p>` : ''}
    <div class="ins-actions">
      <button type="button" data-revise="${escapeHtml(session.id)}">MODIFY SESSION</button>
      <button type="button" data-file="${escapeHtml(session.id)}">FILE RESULT</button>
      <button type="button" data-write="direction" data-subject="${escapeHtml(session.id)}">ADD INSTRUCTIONS</button>
    </div>
  </div>`;
}

// Recovery first and largest, effort second, splits quiet. The reading order is
// the judgment: recovery decides whether the session can answer anything, and
// splits are the most seductive figure and the least decisive.
// What the session actually established, read against what was actually asked.
//
// The prescription comes from the stored components now, not the legacy verdict
// table. That table predates structured dose and says "not prescribed" for
// sessions that plainly were, which is how Hope's 3:00 float came to read as
// nothing being asked of her recovery.
//
// Order follows what carries the claim. For interval work the reps are the
// evidence: how many, at what range, how tight. Recovery earns the top of the
// page only when it was prescribed or when it materially changed the session,
// which is different from always. RPE is context and reads as context.
function evidenceFactsHtml(completion) {
  const pieces = (selectedRecord.pieces || []).filter((piece) => piece.completion_id === completion.id);
  const floats = pieces.filter((piece) => piece.kind === 'float');
  const reps = pieces.filter((piece) => piece.kind === 'rep');
  const pace = (seconds) => (seconds ? `${Math.floor(seconds / 60)}:${String(Math.round(seconds) % 60).padStart(2, '0')}` : '');
  const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const judgment = (selectedRecord.judgments || []).find((item) => item.completionIds.includes(completion.id));

  // The authored prescription behind this filing, when there is one.
  const session = (selectedRecord.sessions || []).find((item) => item.id === completion.planned_session_id);
  const work = (session?.currentVersion?.components || []).find((part) => part.role === 'work');
  const askedBand = [work?.pace_low, work?.pace_high].filter(Boolean).join('\u2013');
  const askedRecovery = work?.recovery_seconds != null
    ? `${clock(work.recovery_seconds)} ${work.recovery_kind}`
    : work?.recovery_kind === 'equal' ? 'equal' : null;
  const askedEffort = work?.rpe_low ? `${work.rpe_low}\u2013${work.rpe_high}` : null;

  // The athlete's own easy pace that day decides whether a recovery was run at
  // all. Never another athlete's. It is computed per completion from the easy
  // pieces of that same session and exposed on the verdict, which is where the
  // prescription stops being the source and the athlete's own reference starts.
  const verdict = (selectedRecord.verdicts || []).find((item) => item.completion_id === completion.id);
  const easy = verdict?.easy_pace || null;
  const floatSeconds = floats.map((piece) => piece.pace_seconds).filter((value) => value != null);
  const restedInstead = Boolean(easy && floatSeconds.length && Math.min(...floatSeconds) > easy + 60);
  // Prescribed, or so far off that it changed what the session could answer.
  const recoveryMatters = Boolean(askedRecovery) || restedInstead;

  const repSeconds = reps.map((piece) => piece.pace_seconds).filter((value) => value != null);
  const spread = repSeconds.length ? Math.max(...repSeconds) - Math.min(...repSeconds) : null;

  const where = [completion.surface, completion.conditions].filter(Boolean).join(' \u00b7 ');
  const standing = qualifyingWords(completion);
  const nonQualifying = /non qualifying/i.test(standing);

  const workRow = reps.length ? `<div class="evf-row evf-row--lead">
      <dt>Work</dt>
      <dd class="evf-asked">${work
        ? `asked ${escapeHtml(work.repeat_count)} \u00d7 ${escapeHtml(Number(work.distance))} ${escapeHtml(work.distance_unit)}`
        : 'no prescription filed'}</dd>
      <dd class="evf-was"><b>${escapeHtml(reps.length)} \u00d7 ${escapeHtml(pace(Math.min(...repSeconds)))}\u2013${escapeHtml(pace(Math.max(...repSeconds)))}</b>
        <span>${escapeHtml(spread)} sec across ${escapeHtml(reps.length)} reps</span></dd>
    </div>
    <div class="evf-row evf-row--quiet">
      <dt>Splits</dt>
      <dd class="evf-asked">${askedBand ? `asked ${escapeHtml(askedBand)}` : 'pace not prescribed'}</dd>
      <dd class="evf-was">${reps.map((piece) => escapeHtml(pace(piece.pace_seconds))).join(' \u00b7 ')}</dd>
    </div>` : '';

  const recoveryRow = floats.length ? `<div class="evf-row${recoveryMatters ? '' : ' evf-row--quiet'}${restedInstead ? ' evf-row--off' : ''}">
      <dt>Recovery</dt>
      <dd class="evf-asked">${askedRecovery ? `asked ${escapeHtml(askedRecovery)}` : 'not prescribed'}</dd>
      <dd class="evf-was">${recoveryMatters
        ? `<b>${floats.map((piece) => escapeHtml(pace(piece.pace_seconds))).join('  ')}</b>`
        : floats.map((piece) => escapeHtml(pace(piece.pace_seconds))).join(' \u00b7 ')}
        ${restedInstead ? '<span>rested rather than floated</span>' : ''}</dd>
    </div>` : '';

  const effortRow = `<div class="evf-row evf-row--quiet">
      <dt>RPE</dt>
      <dd class="evf-asked">${askedEffort ? `asked ${escapeHtml(askedEffort)}` : 'not asked'}</dd>
      <dd class="evf-was">${completion.rpe ? escapeHtml(completion.rpe) : '\u2014'}</dd>
    </div>`;

  return `${where ? `<p class="ins-where">${escapeHtml(where)}<em${nonQualifying ? ' class="ins-where--flag"' : ''}>${escapeHtml(standing)}</em></p>` : ''}
    <dl class="evf">${workRow}${effortRow}${recoveryRow}</dl>
    ${judgment ? `<p class="ins-judgment ${escapeHtml(judgment.direction)}">
      <span>${escapeHtml(directionWords[judgment.direction] || judgment.direction)}</span>${escapeHtml(judgment.reason)}</p>` : ''}
    ${completion.athlete_note ? `<p class="ins-said">${escapeHtml(completion.athlete_note)}</p>` : ''}`;
}

function currentRungHtml() {
  const mark = selectedRecord.primaryMark;
  if (!mark?.checkpoints?.length) return '';
  const points = mark.checkpoints.slice().sort((a, b) => a.position - b.position);
  const current = points.find((point) => point.state === 'current');
  const established = points.filter((point) =>
    point.state === 'reached' || point.state === 'repeated').pop();
  // Next is the first thing not yet proposed past whichever of the two is higher.
  const floor = Math.max(current?.position ?? -1, established?.position ?? -1);
  const next = points.find((point) => point.position > floor && point.state === 'proposed');

  return `<button class="consoleRungLine" type="button" id="openLadder">
    <span class="consoleRungLine__label">Current test</span>
    ${current
      ? `<b>${escapeHtml(current.label)} mi</b>`
      : '<b class="consoleRungLine__unset">not set</b>'}
    ${established ? `<span class="consoleRungLine__label">Established</span><b class="consoleRungLine__next">${escapeHtml(established.label)} mi</b>` : ''}
    ${next ? `<span class="consoleRungLine__label">Next</span><b class="consoleRungLine__next">${escapeHtml(next.label)} mi</b>` : ''}
    <em>${current ? 'change' : 'choose'} \u203a</em>
  </button>`;
}

// Discrete authored points only. No interpolation, no smoothing, no projection to
// race day: a line drawn between two readings would show days on which Brice said
// nothing. One reading is a legitimate state and renders as one mark.
function confidenceHistoryHtml() {
  const reads = (selectedRecord.confidenceReads || []).slice().reverse();
  if (!reads.length) return '';
  const times = reads.map((read) => new Date(read.created_at).getTime());
  const first = Math.min(...times);
  const span = Math.max(1, Math.max(...times) - first);
  const latest = reads[reads.length - 1];
  // Positions travel as data and are applied through the CSSOM. style-src is
  // 'self' with no unsafe-inline, so a style attribute written into markup is
  // dropped by the browser and every mark would stack at the left edge.
  return `<div class="consoleConfidenceHistory" role="img"
    aria-label="${escapeHtml(reads.map((read) => `${formatDate(read.created_at)} ${read.score} per cent`).join(', '))}">
    <span class="consoleConfidenceHistory__latest">${escapeHtml(formatDate(latest.created_at))} · ${escapeHtml(latest.score)}%</span>
    <span class="consoleConfidenceHistory__rail">${reads.map((read) =>
      `<i data-at="${Math.round(((new Date(read.created_at).getTime() - first) / span) * 100)}"></i>`).join('')}</span>
  </div>`;
}

// Confidence is Brice's judgment about the race. Coverage is the distance he has
// established. They sit in one column and never on one axis: five of 13.1 miles
// is 38 per cent proven and says nothing about whether he believes in the day.
function confidenceHtml() {
  const mark = selectedRecord.primaryMark;
  if (!mark) return '';
  const read = standingConfidence(selectedRecord.athlete.id, mark.id);
  const cover = proofCoverage(mark);
  const provenance = ladderProvenance(mark);

  return `<div class="consoleInstrument consoleInstrument--confidence">
    <button class="consoleInstrument__score" type="button" id="setConfidence">
      ${read
        // Missing confidence is not zero. Nothing has been said yet, and 0% would
        // be a statement Brice never made.
        ? `<b>${escapeHtml(read.score)}<i>%</i></b>`
        : '<b class="consoleInstrument__unset">\u2014</b>'}
      <span class="consoleInstrument__read">
        <span class="consoleInstrument__label">Goal confidence</span>
        <span class="consoleInstrument__note">${read
          ? `Updated ${escapeHtml(formatDate(read.created_at))}`
          : 'Set confidence'}</span>
        ${read?.reason ? `<span class="consoleInstrument__note">${escapeHtml(read.reason)}</span>` : ''}
      </span>
    </button>
    ${confidenceHistoryHtml()}
    ${read?.next_evidence
      ? `<p class="consoleInstrument__next">Next thing that can change confidence<em>${escapeHtml(read.next_evidence)}</em></p>`
      : ''}
  </div>
  <div class="consoleInstrument consoleInstrument--coverage">
    <span class="consoleInstrument__label">Established proof</span>
    ${cover && cover.established > 0
      ? `<b>${escapeHtml(cover.established.toFixed(1))}<i>mi</i></b>
         <span class="consoleCoverageRail" aria-hidden="true"><i data-at="${escapeHtml(cover.percent)}"></i></span>
         <span class="consoleInstrument__note">${escapeHtml(cover.established.toFixed(1))} of ${escapeHtml(cover.target)} mi</span>
         ${provenance ? `<span class="consoleInstrument__note consoleInstrument__caveat">${escapeHtml(provenance)}</span>` : ''}`
      : `<b class="consoleInstrument__unset">\u2014</b>
         <span class="consoleInstrument__note">Nothing established yet</span>`}
  </div>`;
}

const fullDate = (iso) => {
  const date = new Date(`${iso}T12:00:00`);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

function heroHtml() {
  const athlete = selectedRecord.athlete;
  const mark = selectedRecord.primaryMark;
  const raceOn = selectedRecord.block?.race_on;
  const goal = [athlete.goal_label, athlete.target_event, raceOn ? fullDate(raceOn) : '']
    .filter(Boolean).join(' · ');

  return `<section class="consoleHero">
    <div class="consoleHero__identity">
      <div class="consoleHero__identityHead">
        <h1 class="consoleHero__name">${escapeHtml(athlete.first_name || athlete.display_name)}</h1>
        ${athleteMenuHtml()}
      </div>
      ${goal ? `<p class="consoleHero__goal">${escapeHtml(goal)}</p>` : ''}
      ${currentRungHtml()}
      ${mark?.evidence_surface_requirement === 'outdoor'
        // A condition on whether evidence counts, said in words beside the goal.
        // It is not a rung and never sits on top of a numeral.
        ? '<p class="consoleHero__condition">Outside evidence only</p>' : ''}
    </div>
    <div class="consoleHero__instruments">${confidenceHtml()}</div>
  </section>`;
}

// Five bands, in order, and nothing before them. The composition is replaced as a
// whole rather than patched, because every previous pass moved a component and
// left the page shape that put the work below the fold.
function deskHtml() {
  return `<div class="coachConsole" id="deskMain">
    <nav class="consoleAthleteTabs" id="squadStrip" aria-label="Athletes"></nav>
    ${heroHtml()}
    ${runwayHtml()}
    ${workbenchHtml()}
  </div>`;
}

// Proportions arrive as data attributes and are applied here. style-src is 'self'
// with no unsafe-inline, so a width or offset written into a style attribute is
// dropped by the browser: on the deployed page every confidence mark sat at the
// left edge and the coverage rail read empty at any percentage.
function paintRails() {
  app.querySelectorAll('.consoleCoverageRail i, .consoleConfidenceHistory__rail i').forEach((mark) => {
    const at = Number(mark.dataset.at);
    if (!Number.isFinite(at)) return;
    if (mark.parentElement.classList.contains('consoleCoverageRail')) mark.style.width = `${at}%`;
    else mark.style.left = `${at}%`;
  });
}

// The chosen week is brought into view inside its own scroller. scrollIntoView
// would also move the page vertically, which on a phone throws away the hero the
// coach just read.
function revealShownWeek() {
  const viewport = app.querySelector('.consoleRunwayViewport');
  const shown = viewport?.querySelector('.consoleWeek--shown');
  if (!viewport || !shown) return;
  const left = shown.offsetLeft;
  const right = left + shown.offsetWidth;
  if (left < viewport.scrollLeft) viewport.scrollLeft = left - 12;
  else if (right > viewport.scrollLeft + viewport.clientWidth) {
    viewport.scrollLeft = right - viewport.clientWidth + 12;
  }
}

function paintSquad() {
  // Always on the desk, not behind a drawer. The strip is orientation, and
  // orientation you have to open is not orientation. Selecting is all it does.
  const squadContainer = document.getElementById('squadStrip');
  if (!squadContainer) return;
  squadContainer.innerHTML = rosterHtml();
  squadContainer.querySelectorAll('[data-select-athlete]').forEach((button) =>
    button.addEventListener('click', () => selectAthlete(button.dataset.selectAthlete)));
  const toggle = document.getElementById('orderToggle');
  if (toggle) toggle.textContent = attentionOrder ? 'needs attention' : 'roster';
}

function bindDesk() {
  paintSquad();
  paintRails();
  revealShownWeek();
  app.querySelectorAll('[data-week]').forEach((button) => button.addEventListener('click', () => {
    shownWeekId = button.dataset.week; shownSessionId = null;
    app.innerHTML = deskHtml(); bindDesk();
  }));
  app.querySelectorAll('[data-session]').forEach((button) => button.addEventListener('click', () => {
    shownSessionId = button.dataset.session; shownCompletionId = null;
    app.innerHTML = deskHtml(); bindDesk();
  }));
  app.querySelectorAll('[data-completion]').forEach((button) => button.addEventListener('click', () => {
    shownCompletionId = button.dataset.completion; app.innerHTML = deskHtml(); bindDesk();
  }));
  app.querySelectorAll('[data-week-step]').forEach((button) => button.addEventListener('click', () => {
    const weeks = (selectedRecord.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
    const current = weeks.findIndex((entry) => entry.id === (shownWeekId || selectedRecord.currentWeek?.id));
    const next = weeks[current + Number(button.dataset.weekStep)];
    if (next) { shownWeekId = next.id; app.innerHTML = deskHtml(); bindDesk(); }
  }));
  app.querySelectorAll('[data-task-action]').forEach((button) => button.addEventListener('click', () => openDecision(button.dataset.taskAction)));
  app.querySelectorAll('[data-write]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.write === 'decision') openDecision(null);
    else openCoaching(button.dataset.write, button.dataset.subject);
  }));
  bindAccountSecurity();
  // Ordering is a mode, never a permanent rearrangement of the roster, so the
  // control sits with the account tools rather than inside the tab row.
  document.getElementById('orderToggle')?.addEventListener('click', () => {
    attentionOrder = !attentionOrder;
    paintSquad();
  });
  document.getElementById('setConfidence')?.addEventListener('click', openConfidence);
  document.getElementById('openLadder')?.addEventListener('click', openLadder);
  document.getElementById('newSession')?.addEventListener('click', () => openSession(null));
  
  // Console actions using data-console-action
  app.querySelectorAll('[data-console-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.consoleAction;
      if (action === 'file-run') openFile('');
      else if (action === 'correct-entry' && button.dataset.completionId) openFile('', button.dataset.completionId);
      else if (action === 'judge' && button.dataset.completionId) openJudge(button.dataset.completionId);
      else if (action === 'source-image' && button.dataset.completionId) {
        // Find the evidence details for this specific completion
        const evidenceDetails = document.querySelector(`.ev-source[data-completion-id="${button.dataset.completionId}"]`);
        if (evidenceDetails) evidenceDetails.open = !evidenceDetails.open;
      }
    });
  });
  
  // Revise and file from the session itself, so the coach never re-finds it.
  app.querySelectorAll('[data-revise]').forEach((button) =>
    button.addEventListener('click', () => openSession(button.dataset.revise)));
  app.querySelectorAll('[data-file]').forEach((button) =>
    button.addEventListener('click', () => openFile(button.dataset.file)));
  app.querySelectorAll('[data-correct]').forEach((button) =>
    button.addEventListener('click', () => openFile('', button.dataset.correct)));
  document.getElementById('addPrivateNote')?.addEventListener('click', () => { noteForm.reset(); document.getElementById('noteStatus').textContent = ''; noteDialog.showModal(); });
  document.getElementById('shareExcerpt')?.addEventListener('click', openShare);
}

async function selectAthlete(athleteId) {
  selectedId = athleteId;
  shownWeekId = null;
  app.innerHTML = '<div class="loading" aria-label="Loading athlete"></div>';
  selectedRecord = await loadAthleteRecord(athleteId, { coach: true });
  selectedRecord.attention = roster.find((entry) => entry.id === athleteId)?.attention || await loadAttentionFor(athleteId);
  app.innerHTML = deskHtml(); bindDesk();
  history.replaceState(null, '', `/coach/?athlete=${encodeURIComponent(selectedRecord.athlete.slug)}`);
}

function openDecision(actionId) {
  decisionForm.reset(); document.getElementById('decisionStatus').textContent = '';
  const action = selectedRecord.taskActions.find((item) => item.id === actionId);
  decisionForm.elements.actionId.value = action?.id || '';
  decisionForm.elements.athleteText.value = action?.athlete_text || '';
  decisionForm.elements.rationale.value = action?.rationale || '';
  document.getElementById('decisionDialogTitle').textContent = action?.label || 'Write a different Decision';
  decisionDialog.showModal();
}

function openCoaching(objectType = 'direction', subjectId = '') {
  coachingForm.reset();
  const wanted = objectType === 'read' ? 'read' : 'direction';
  [...coachingForm.elements.objectType].forEach((radio) => { radio.checked = radio.value === wanted; });
  coachingForm.elements.plannedSessionId.innerHTML = selectedRecord.sessions.map((session) => `<option value="${session.id}">${escapeHtml(session.day_label)} · ${escapeHtml(session.currentVersion?.title || 'Session')}</option>`).join('');
  coachingForm.elements.completionIds.innerHTML = selectedRecord.completions.map((completion) => {
    const session = selectedRecord.sessions.find((item) => item.id === completion.planned_session_id);
    const distance = completion.actual_distance ? ` · ${completion.actual_distance} ${completion.distance_unit || ''}` : '';
    return `<option value="${completion.id}">${escapeHtml(formatDate(completion.filed_at))} · ${escapeHtml(session?.currentVersion?.title || completion.status)}${escapeHtml(distance)}</option>`;
  }).join('') || '<option value="" disabled>Nothing logged yet</option>';
  // Preselect what the situation pointed at, so the coach is not re-finding it.
  if (subjectId) {
    if (objectType === 'read') {
      [...coachingForm.elements.completionIds.options].forEach((option) => { option.selected = option.value === subjectId; });
    } else if ([...coachingForm.elements.plannedSessionId.options].some((option) => option.value === subjectId)) {
      coachingForm.elements.plannedSessionId.value = subjectId;
    }
  }
  // The dialog names the session it is for, so nothing has to be re-found.
  const session = selectedRecord.sessions.find((entry) => entry.id === subjectId);
  const version = session?.currentVersion;
  document.getElementById('coachingContext').textContent = session
    ? `${session.day_label} · ${version?.title || 'Session'}${version?.prescribed_distance ? ` · ${Number(version.prescribed_distance)} ${version.distance_unit || ''}` : ''}`
    : `${selectedRecord.athlete.first_name} · ${wanted === 'read' ? 'after the run' : 'before the run'}`;
  if (version?.intent) coachingForm.elements.athleteText.value = version.intent;
  document.getElementById('coachingStatus').textContent = '';
  toggleCoachingFields(); coachingDialog.showModal();
}

function toggleCoachingFields() {
  const read = [...coachingForm.elements.objectType].find((radio) => radio.checked)?.value === 'read';
  const external = coachingForm.elements.deliveryState.value === 'delivered_externally';
  coachingForm.querySelectorAll('[data-direction-only]').forEach((node) => { node.hidden = read; });
  coachingForm.querySelectorAll('[data-read-only]').forEach((node) => { node.hidden = !read; });
  coachingForm.querySelectorAll('[data-external-only]').forEach((node) => { node.hidden = !external; });
  coachingForm.elements.deliveredWording.required = external;
}

function openShare() {
  shareForm.reset();
  shareForm.elements.headline.value = `${selectedRecord.athlete.first_name}’s work, chosen week by week.`;
  shareForm.elements.summary.value = selectedRecord.decisions[0]?.athlete_text || '';
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  shareForm.elements.consentRecordedAt.value = now.toISOString().slice(0, 16);
  document.getElementById('shareStatus').textContent = '';
  shareDialog.showModal();
}

// mm:ss or h:mm:ss. A coach reads a watch, not a seconds counter.
function toSeconds(text) {
  const parts = String(text || '').trim().split(':').map(Number);
  if (!parts.length || parts.some((part) => Number.isNaN(part))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function openSession(plannedSessionId = null) {
  sessionForm.reset();
  revisingSessionId = plannedSessionId;
  const weeks = selectedRecord.weeks;
  sessionForm.elements.weekId.innerHTML = weeks
    .map((week) => `<option value="${week.id}">Week ${week.week_number}${week.starts_on ? ` · ${escapeHtml(formatDate(week.starts_on))}` : ''}</option>`)
    .join('');

  const session = plannedSessionId ? selectedRecord.sessions.find((entry) => entry.id === plannedSessionId) : null;
  const version = session?.currentVersion;
  document.getElementById('changeReasonField').hidden = !session;
  sessionForm.elements.changeReason.required = !!session;

  if (session) {
    // Revising starts from what is already there, so the coach edits rather than retypes.
    document.getElementById('sessionContext').textContent = `${session.day_label} · version ${(version?.version_number || 0) + 1}`;
    sessionForm.elements.weekId.value = session.week_id;
    sessionForm.elements.dayLabel.value = session.day_label;
    sessionForm.elements.scheduledOn.value = session.scheduled_on || '';
    sessionForm.elements.title.value = version?.title || '';
    sessionForm.elements.prescribedDistance.value = version?.prescribed_distance || '';
    sessionForm.elements.prescribedDurationMinutes.value = version?.prescribed_duration_minutes || '';
    sessionForm.elements.intent.value = version?.intent || '';
    sessionForm.elements.details.value = version?.details || '';
    sessionForm.elements.rpeLow.value = version?.rpe_low || '';
    sessionForm.elements.rpeHigh.value = version?.rpe_high || '';
  } else {
    document.getElementById('sessionContext').textContent = `New session for ${selectedRecord.athlete.first_name}`;
    if (selectedRecord.currentWeek) sessionForm.elements.weekId.value = selectedRecord.currentWeek.id;
  }
  document.getElementById('sessionStatus').textContent = '';
  sessionDialog.showModal();
}

function secondsToClock(seconds) {
  const value = Math.round(seconds);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function pieceRowHtml(piece = null) {
  const kind = piece?.kind || 'rep';
  const sel = (value) => (kind === value ? ' selected' : '');
  return `<div class="piece-row">
    <select class="field-select" data-piece="kind">
      <option value="warmup"${sel('warmup')}>Warm up</option><option value="rep"${sel('rep')}>Rep</option>
      <option value="float"${sel('float')}>Float</option><option value="cooldown"${sel('cooldown')}>Cool down</option>
    </select>
    <input class="field-input" data-piece="distance" type="number" step="0.01" min="0" placeholder="1" value="${piece?.distance ?? ''}">
    <input class="field-input" data-piece="time" placeholder="6:29" value="${piece?.duration_seconds ? secondsToClock(piece.duration_seconds) : ''}">
    <input class="field-input" data-piece="pace" placeholder="pace" value="${piece?.pace_seconds ? secondsToClock(piece.pace_seconds) : ''}">
    <button class="button small" type="button" data-remove-piece aria-label="Remove">&times;</button>
  </div>`;
}

function openFile(plannedSessionId = '', completionId = null) {
  fileForm.reset();
  editingCompletionId = completionId;
  const existing = completionId ? selectedRecord.completions.find((item) => item.id === completionId) : null;
  const existingPieces = completionId
    ? (selectedRecord.pieces || []).filter((piece) => piece.completion_id === completionId)
    : [];
  document.getElementById('pieceRows').innerHTML =
    (existingPieces.length ? existingPieces.map((piece) => pieceRowHtml(piece)).join('') : pieceRowHtml());
  fileForm.elements.plannedSessionId.innerHTML =
    '<option value="">Not one of her sessions</option>' +
    selectedRecord.sessions.map((session) =>
      `<option value="${session.id}">${escapeHtml(session.day_label)} · ${escapeHtml(session.currentVersion?.title || 'Session')}</option>`).join('');
  if (plannedSessionId) fileForm.elements.plannedSessionId.value = plannedSessionId;
  if (existing) {
    // Correcting starts from what is there, so a wrong number is changed rather
    // than the whole session retyped from the screenshot again.
    const f = fileForm.elements;
    f.plannedSessionId.value = existing.planned_session_id || '';
    f.status.value = existing.status;
    f.rpe.value = existing.rpe ?? '';
    f.actualDistance.value = existing.actual_distance ?? '';
    f.duration.value = existing.duration_seconds ? secondsToClock(existing.duration_seconds) : '';
    f.surface.value = existing.surface || '';
    f.temperatureF.value = existing.temperature_f ?? '';
    f.conditions.value = existing.conditions || '';
    f.athleteNote.value = existing.athlete_note || '';
  }
  // Correcting asks why and can move the date; filing takes the screenshot.
  fileForm.querySelectorAll('[data-correct-only]').forEach((node) => { node.hidden = !existing; });
  fileForm.querySelectorAll('[data-file-only]').forEach((node) => { node.hidden = !!existing; });
  fileForm.elements.reason.required = !!existing;
  if (existing) fileForm.elements.filedOn.value = String(existing.filed_at).slice(0, 10);
  document.getElementById('fileContext').textContent = existing
    ? `Correct ${escapeHtml(formatDate(existing.filed_at))}`
    : `File a run for ${selectedRecord.athlete.first_name}`;
  document.getElementById('fileStatus').textContent = '';
  fileDialog.showModal();
}

document.getElementById('addPiece').addEventListener('click', () => {
  document.getElementById('pieceRows').insertAdjacentHTML('beforeend', pieceRowHtml());
});
document.getElementById('pieceRows').addEventListener('click', (event) => {
  if (event.target.closest('[data-remove-piece]')) event.target.closest('.piece-row').remove();
});

function openJudge(completionId) {
  judgeForm.reset();
  judgingCompletionId = completionId;
  const mark = selectedRecord.primaryMark;
  document.getElementById('judgeClaimText').textContent = mark?.claim || mark?.current_question || '';
  // A judgment can rest on more than one session; the one clicked is implied.
  judgeForm.elements.completionIds.innerHTML = selectedRecord.completions
    .filter((completion) => completion.id !== completionId)
    .map((completion) => `<option value="${completion.id}">${escapeHtml(formatDate(completion.filed_at))} · ${escapeHtml(completion.status)}</option>`)
    .join('') || '<option value="" disabled>Nothing else filed</option>';
  document.getElementById('judgeStatus').textContent = '';
  judgeDialog.showModal();
}

const stateWords = {
  proposed: 'Proposed', current: 'Current', reached: 'Established',
  repeated: 'Established again', retired: 'Retired'
};

// The ladder, reachable without occupying the page. Opening it writes nothing.
function openLadder() {
  const mark = selectedRecord.primaryMark;
  if (!mark?.checkpoints?.length) return;
  document.getElementById('ladderContext').textContent =
    `${selectedRecord.athlete.first_name || selectedRecord.athlete.display_name}\u2019s ladder`;
  document.getElementById('ladderRows').innerHTML = mark.checkpoints
    .slice().sort((a, b) => a.position - b.position)
    .map((point) => `<button class="ladderRow" type="button"
      data-cycle-checkpoint="${escapeHtml(point.id)}" data-state="${escapeHtml(point.state)}">
      <b>${escapeHtml(point.label)}<i>mi</i></b>
      <span class="ladderRow__state ${escapeHtml(point.state)}">${escapeHtml(stateWords[point.state] || point.state)}</span>
    </button>`).join('');
  document.getElementById('ladderRows').querySelectorAll('[data-cycle-checkpoint]').forEach((button) =>
    button.addEventListener('click', () => {
      ladderDialog.close();
      openRung(button.dataset.cycleCheckpoint, button.dataset.state, button.querySelector('b').textContent.replace('mi', '').trim());
    }));
  ladderDialog.showModal();
}

let editingCheckpointSource = null;

function openRung(checkpointId, state, label) {
  rungForm.reset();
  editingCheckpointId = checkpointId;
  const point = (selectedRecord.primaryMark?.checkpoints || []).find((item) => item.id === checkpointId);
  editingCheckpointSource = point?.source || null;
  // A rung that predates provenance is being corrected, not decided. Saying so
  // is the difference between repairing the erasure and quietly overwriting it.
  document.getElementById('rungProvenance').textContent = editingCheckpointSource === 'legacy'
    ? 'This rung moved before anything recorded what moved it. Changing it is filed as a correction and the old value stays in the ledger.'
    : '';
  document.getElementById('rungContext').textContent = `${label} miles`;
  [...rungForm.elements.state].forEach((radio) => { radio.checked = radio.value === state; });
  document.getElementById('rungStatus').textContent = '';
  rungDialog.showModal();
}

rungForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('rungStatus');
  const button = rungForm.querySelector('button[type="submit"]');
  const chosen = [...rungForm.elements.state].find((radio) => radio.checked)?.value;
  if (!chosen) { status.textContent = 'Pick one.'; return; }
  button.disabled = true; status.textContent = 'Saving.';
  try {
    // Correcting a rung nobody can vouch for is an override; setting one that
    // was properly recorded is a coach decision. Both name a reason, and the
    // previous value survives in the append-only ledger either way.
    await moveCheckpoint(editingCheckpointId, chosen, {
      source: editingCheckpointSource === 'legacy' ? 'override' : 'coach',
      decision: chosen === 'proposed' ? 'reduce' : 'advance',
      reason: rungForm.elements.reason.value
    });
    rungDialog.close();
    await refreshSelected(true);
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});

function openConfidence() {
  confidenceForm.reset();
  const mark = selectedRecord.primaryMark;
  const read = mark?.confidence || (selectedRecord.confidenceReads || [])[0] || null;
  document.getElementById('confidenceGoal').textContent =
    [selectedRecord.athlete.goal_label, selectedRecord.athlete.target_event, selectedRecord.athlete.race_on]
      .filter(Boolean).join(' · ');
  confidenceForm.elements.completionIds.innerHTML = selectedRecord.completions
    .map((completion) => `<option value="${completion.id}">${escapeHtml(formatDate(completion.filed_at))} · ${escapeHtml(completion.status)}</option>`)
    .join('') || '<option value="" disabled>Nothing filed yet</option>';
  // Amending starts from what stands, so the change is visible as a change.
  if (read) {
    confidenceForm.elements.score.value = read.score;
    confidenceForm.elements.nextEvidence.value = read.next_evidence || '';
    confidenceForm.elements.interveneIf.value = read.intervene_if || '';
  }
  document.getElementById('confidenceStatus').textContent = '';
  confidenceDialog.showModal();
}

confidenceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('confidenceStatus');
  const button = confidenceForm.querySelector('button[type="submit"]');
  const mark = selectedRecord.primaryMark;
  const standing = mark?.confidence || (selectedRecord.confidenceReads || [])[0] || null;
  const f = confidenceForm.elements;
  button.disabled = true; status.textContent = 'Saving.';
  try {
    await setConfidence({
      athleteId: selectedRecord.athlete.id,
      markId: mark.id,
      score: f.score.value,
      reason: f.reason.value,
      nextEvidence: f.nextEvidence.value,
      interveneIf: f.interveneIf.value,
      // Amending names what it replaces, so the earlier reading stays readable.
      supersedes: standing?.id || null,
      completionIds: [...f.completionIds.selectedOptions].map((option) => option.value).filter(Boolean)
    });
    confidenceDialog.close();
    await refreshSelected(true);
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});

judgeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('judgeStatus');
  const button = judgeForm.querySelector('button[type="submit"]');
  const also = [...judgeForm.elements.completionIds.selectedOptions].map((option) => option.value).filter(Boolean);
  button.disabled = true; status.textContent = 'Saving.';
  try {
    await judgeClaim({
      athleteId: selectedRecord.athlete.id,
      markId: selectedRecord.primaryMark.id,
      direction: [...judgeForm.elements.direction].find((radio) => radio.checked).value,
      reason: judgeForm.elements.reason.value,
      completionIds: [judgingCompletionId, ...also]
    });
    judgeDialog.close();
    await refreshSelected(true);
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});

sessionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('sessionStatus');
  const button = sessionForm.querySelector('button[type="submit"]');
  const f = sessionForm.elements;
  const payload = {
    athleteId: selectedRecord.athlete.id,
    weekId: f.weekId.value,
    dayLabel: f.dayLabel.value,
    scheduledOn: f.scheduledOn.value || null,
    title: f.title.value.trim(),
    prescribedDistance: f.prescribedDistance.value ? Number(f.prescribedDistance.value) : null,
    distanceUnit: 'mi',
    prescribedDurationMinutes: f.prescribedDurationMinutes.value ? Number(f.prescribedDurationMinutes.value) : null,
    intent: f.intent.value.trim(),
    details: f.details.value.trim() || null,
    rpeLow: f.rpeLow.value ? Number(f.rpeLow.value) : null,
    rpeHigh: f.rpeHigh.value ? Number(f.rpeHigh.value) : null,
    changeReason: f.changeReason.value.trim() || null
  };
  button.disabled = true; status.textContent = 'Saving.';
  try {
    if (revisingSessionId) await reviseSession(revisingSessionId, payload);
    else {
      // Position orders the week. Take the next free slot rather than asking.
      const inWeek = selectedRecord.sessions.filter((entry) => entry.week_id === payload.weekId);
      payload.position = inWeek.reduce((highest, entry) => Math.max(highest, entry.position), 0) + 1;
      await authorSession(payload);
    }
    sessionDialog.close();
    await refreshSelected(true);
  } catch (error) {
    status.textContent = error.message;
  } finally { button.disabled = false; }
});

fileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('fileStatus');
  const button = fileForm.querySelector('button[type="submit"]');
  const f = fileForm.elements;
  const pieces = [...document.querySelectorAll('.piece-row')].map((row) => {
    const value = (name) => row.querySelector(`[data-piece="${name}"]`).value.trim();
    const distance = value('distance') ? Number(value('distance')) : null;
    const durationSeconds = toSeconds(value('time'));
    // Pace typed wins. Otherwise derive it, but only when both parts are there.
    const paceSeconds = toSeconds(value('pace'))
      || (distance && durationSeconds ? Math.round(durationSeconds / distance) : null);
    return { kind: value('kind'), distance, distanceUnit: 'mi', durationSeconds, paceSeconds };
  }).filter((piece) => piece.distance || piece.durationSeconds || piece.paceSeconds);

  button.disabled = true; status.textContent = 'Filing.';
  try {
    const payload = {
      athleteId: selectedRecord.athlete.id,
      plannedSessionId: f.plannedSessionId.value || null,
      status: f.status.value,
      actualDistance: f.actualDistance.value ? Number(f.actualDistance.value) : null,
      distanceUnit: 'mi',
      durationSeconds: toSeconds(f.duration.value),
      rpe: f.rpe.value ? Number(f.rpe.value) : null,
      surface: f.surface.value || null,
      temperatureF: f.temperatureF.value ? Number(f.temperatureF.value) : null,
      conditions: f.conditions.value.trim() || null,
      athleteNote: f.athleteNote.value.trim() || null,
      recoveredNextDay: null,
      reason: f.reason.value,
      // A date without a time would move the session to midnight; keep the clock.
      filedAt: f.filedOn.value
        ? new Date(`${f.filedOn.value}T${String(editingCompletionId
            ? (selectedRecord.completions.find((item) => item.id === editingCompletionId)?.filed_at || '')
            : '').slice(11, 19) || '12:00:00'}`).toISOString()
        : null
    };
    if (editingCompletionId) await editFiledSession(editingCompletionId, payload, pieces);
    else await fileForAthlete(payload, pieces, f.evidence.files[0] || null);
    fileDialog.close();
    await refreshSelected(true);
  } catch (error) {
    status.textContent = error.message;
  } finally { button.disabled = false; }
});

dialogs.forEach((dialog) => dialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close())));
[...coachingForm.elements.objectType].forEach((radio) => radio.addEventListener('change', toggleCoachingFields));
coachingForm.elements.deliveryState.addEventListener('change', toggleCoachingFields);

decisionForm.addEventListener('submit', async (event) => {
  event.preventDefault(); const form = new FormData(decisionForm); const status = document.getElementById('decisionStatus'); const button = decisionForm.querySelector('button[type="submit"]');
  button.disabled = true; status.textContent = 'Publishing the Decision…';
  try {
    if (!selectedRecord.task) throw new Error('This situation has no coach task to resolve. Publish a Read or Direction instead.');
    await resolveCoachTask(selectedRecord.task.id, form.get('actionId') || null, form.get('actionId') ? null : { athleteText: form.get('athleteText'), rationale: form.get('rationale') });
    decisionDialog.close(); await refreshSelected(true);
  } catch (error) { status.textContent = error.message; status.className = 'status-message error'; button.disabled = false; }
});

coachingForm.addEventListener('submit', async (event) => {
  event.preventDefault(); const form = new FormData(coachingForm); const status = document.getElementById('coachingStatus'); const button = coachingForm.querySelector('button[type="submit"]');
  button.disabled = true; status.textContent = 'Publishing…';
  try {
    const deliveryState = form.get('deliveryState');
    const deliveredWording = deliveryState === 'delivered_externally' ? form.get('deliveredWording') : null;
    if (form.get('objectType') !== 'read') {
      // Surface is the purpose for some marks, not metadata: a treadmill completion
      // produces the numbers without answering an outdoor question.
      const executionContext = {};
      if (form.get('surface')) executionContext.surface = form.get('surface');
      if (form.get('company')) executionContext.company = form.get('company');
      if (String(form.get('heatAllowance') || '').trim()) executionContext.heat_allowance = form.get('heatAllowance').trim();
      const priorityTargets = String(form.get('priorityTargets') || '').split('\n').map((line) => line.trim()).filter(Boolean);
      await createDirection({
        athleteId: selectedId, plannedSessionId: form.get('plannedSessionId'),
        protectedVariable: form.get('protectedVariable'), movableVariable: form.get('movableVariable'),
        stopOrChangeIf: form.get('stopOrChangeIf'),
        priorityTargets: priorityTargets.length ? priorityTargets : [form.get('protectedVariable')],
        athleteText: form.get('athleteText'), executionContext, deliveryState, deliveredWording
      });
    } else {
      await createRead({
        athleteId: selectedId, athleteText: form.get('athleteText'), questionAnswered: form.get('questionAnswered'),
        completionIds: form.getAll('completionIds').filter(Boolean), deliveryState, deliveredWording
      });
    }
    coachingDialog.close(); await refreshSelected(true);
  } catch (error) { status.textContent = error.message; status.className = 'status-message error'; button.disabled = false; }
});

noteForm.addEventListener('submit', async (event) => {
  event.preventDefault(); const status = document.getElementById('noteStatus'); const button = noteForm.querySelector('button[type="submit"]'); button.disabled = true; status.textContent = 'Saving privately…';
  try { await addPrivateNote(selectedId, new FormData(noteForm).get('body')); noteDialog.close(); await refreshSelected(true); }
  catch (error) { status.textContent = error.message; status.className = 'status-message error'; button.disabled = false; }
});

shareForm.addEventListener('submit', async (event) => {
  event.preventDefault(); const form = new FormData(shareForm); const status = document.getElementById('shareStatus'); const button = shareForm.querySelector('button[type="submit"]'); const mark = selectedRecord.primaryMark; button.disabled = true; status.textContent = 'Freezing the approved excerpt…';
  try {
    const publication = await publishRecordExcerpt({ athleteId: selectedId, publicationSlug: selectedRecord.athlete.slug, athleteDisplayName: selectedRecord.athlete.display_name, headline: form.get('headline'), markLabel: mark?.label || 'The mark', markValue: mark?.current_value == null ? 'In progress' : `${mark.current_value}${mark.unit ? ` ${mark.unit}` : ''}`, summary: form.get('summary'), consentRecordedAt: new Date(form.get('consentRecordedAt')).toISOString(), consentNote: form.get('consentNote') });
    status.innerHTML = `Published safely: <a href="/record/${encodeURIComponent(publication.publication_slug)}" target="_blank" rel="noopener">open share card</a>`; status.className = 'status-message success'; button.disabled = false;
  } catch (error) { status.textContent = error.message; status.className = 'status-message error'; button.disabled = false; }
});

async function refreshSelected(animate = false) {
  const access = await getAccessContext(); roster = await loadCoachRoster(access.coachMemberships); selectedRecord = await loadAthleteRecord(selectedId, { coach: true });
  selectedRecord.attention = roster.find((entry) => entry.id === selectedId)?.attention || [];
  app.innerHTML = deskHtml(); if (animate) document.querySelector('.situation')?.classList.add('resolve-in'); bindDesk();
}

signOutButton.addEventListener('click', signOut);

async function boot() {
  try {
    const access = await getAccessContext();
    if (!access.session) { await authView(); return; }
    document.body.classList.remove('auth-only');
    const email = access.session.user.email || '';
    userEmail.textContent = email;
    document.getElementById('userInitials').textContent = (email[0] || 'B').toUpperCase();
    if (!access.coachMemberships.length && access.athleteMemberships.length) { window.location.replace('/athlete/'); return; }
    if (!access.coachMemberships.length) { pendingView(access.session.user.email || 'This account'); return; }
    roster = await loadCoachRoster(access.coachMemberships);
    const requested = new URLSearchParams(location.search).get('athlete');
    selectedId = roster.find((athlete) => athlete.slug === requested)?.id || roster[0]?.id;
    await selectAthlete(selectedId);
  } catch (error) {
    app.innerHTML = `<section class="auth-page"><div class="auth-card"><p class="eyebrow">Could not open the desk</p><h1>Try that again.</h1><p class="status-message error">${escapeHtml(authErrorMessage(error))}</p><button class="button" id="retry" type="button">Retry</button></div></section>`;
    document.getElementById('retry').addEventListener('click', () => window.location.reload());
  }
}

boot();
