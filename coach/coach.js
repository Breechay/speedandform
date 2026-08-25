import { bindAccountSecurity, authErrorMessage, getAccessContext, renderDoorway, signOut } from '/private/auth.js';
import { addPrivateNote, authorSession, proofCoverage, setConfidence, createDirection, createRead, editFiledSession, fileForAthlete, judgeClaim, moveCheckpoint, loadAthleteRecord, loadAttentionFor, loadCoachRoster, publishRecordExcerpt, resolveCoachTask, reviseSession } from '/private/data.js';
import { escapeHtml, evidenceSection, formatDate, progressionSection, gradeSection, whoSection } from '/private/record.js';

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
let judgingCompletionId = null;
// Set when the session dialog is revising rather than authoring. A revision
// appends a version; authoring makes the session.
let revisingSessionId = null;
let roster = [];
let selectedId = null;
let selectedRecord = null;
let shownWeekId = null;

async function authView() {
  document.body.classList.add('auth-only');
  await renderDoorway(app, { destination: '/coach/', label: 'Coach sign in' });
}

function pendingView(email) {
  app.innerHTML = `<section class="auth-page"><div class="auth-card"><p class="eyebrow">Signed in</p><h1>No coach assignment yet.</h1><p>${escapeHtml(email)} is authenticated, but this account has not been assigned to the roster.</p></div></section>`;
}

function initials(name) { return String(name || '').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

function rosterHtml() {
  // Orientation, not ranking. Athletes are grouped by their checkpoint geometry,
  // not by magic numbers or hardcoded names.
  const getGeometryKey = (athlete) => {
    const checkpoints = (athlete.mark?.checkpoints || [])
      .slice().sort((a, b) => a.position - b.position)
      .map((point) => `${point.position}-${point.value}`)
      .join(',');
    return checkpoints;
  };

  const strip = (athlete) => {
    const checkpoints = (athlete.mark?.checkpoints || [])
      .slice().sort((a, b) => a.position - b.position);
    
    // Check if this athlete has a current rung
    const hasCurrent = checkpoints.some((point) => point.state === 'current');
    const isSelected = athlete.id === selectedId;
    
    // Non-selected athletes get read-only numerals
    if (!isSelected) {
      return checkpoints.map((point) => {
        const stateClass = point.state === 'proposed' ? 'consoleRung--proposed' 
          : point.state === 'reached' || point.state === 'repeated' ? 'consoleRung--held'
          : point.state === 'current' ? 'consoleRung--current'
          : point.state === 'retired' ? 'consoleRung--retired' : '';
        return `<span class="consoleRung ${stateClass}">${escapeHtml(point.label)}</span>`;
      }).join('') || '<em>no ladder yet</em>';
    }
    
    // Selected athlete - may be in choosing mode or normal mode
    let rungButtons = checkpoints.map((point) => {
      // Lime is spent once per composition. Four athletes each showing a lime
      // numeral is four, so only the selected athlete's current rung gets it.
      // Lime is spent once per composition, so only the selected athlete's
      // current rung carries it. Other athletes' current rungs stay legible in
      // text, never by colour alone.
      const lit = point.state === 'current' && athlete.id === selectedId;
      const stateClass = point.state === 'proposed' ? 'consoleRung--proposed' 
        : point.state === 'reached' || point.state === 'repeated' ? 'consoleRung--held'
        : point.state === 'current' ? 'consoleRung--current'
        : point.state === 'retired' ? 'consoleRung--retired' : '';
      
      // If athlete is in choosing mode (no current), make rungs clickable for selection
      const label = `${escapeHtml(point.label)} miles, ${escapeHtml(point.state)}`;

      // Another athlete's ladder is orientation. It carries no handler, so a
      // stray click can never move a rung on a record that is not open.
      if (athlete.id !== selectedId) {
        return `<span class="consoleRung ${stateClass}" role="img" aria-label="${label}">${escapeHtml(point.label)}</span>`;
      }

      // With no current rung authored, every numeral becomes the choice. Nothing
      // is inferred and nothing is pre-lit.
      if (!hasCurrent) {
        return `<button class="consoleRung ${stateClass} consoleRung--choosable"
          type="button" data-set-current="${escapeHtml(point.id)}"
          aria-label="Set ${escapeHtml(point.label)} miles as current">${escapeHtml(point.label)}</button>`;
      }

      return `<button class="consoleRung ${stateClass}${lit ? ' consoleRung--lit' : ''}"
        type="button" data-cycle-checkpoint="${escapeHtml(point.id)}" data-state="${escapeHtml(point.state)}"
        aria-label="${label}">${escapeHtml(point.label)}</button>`;
    }).join('');
    
    // Lime goes to the instruction rather than to a guessed numeral.
    if (!hasCurrent && athlete.id === selectedId) {
      rungButtons += `<span class="consoleRung__instruction">CHOOSE CURRENT</span>`;
    }
    
    return rungButtons || '<em>no ladder yet</em>';
  };

  const card = (athlete) => {
    const condition = athlete.mark?.evidence_surface_requirement === 'outdoor' ? 'OUTSIDE EVIDENCE ONLY' : '';
    
    return `<div class="consoleAthleteRow${athlete.id === selectedId ? ' consoleAthleteRow--selected' : ''}">
      <button class="consoleAthleteRow__name" type="button" data-select-athlete="${escapeHtml(athlete.id)}"
        ${athlete.id === selectedId ? 'aria-current="true"' : ''}>
        ${escapeHtml(athlete.first_name || athlete.display_name)}
      </button>
      <div class="consoleAthleteRow__ladder" role="group" aria-label="Capability ladder">
        ${strip(athlete)}
      </div>
      <span class="consoleAthleteRow__condition">${condition}</span>
    </div>`;
  };

  // Group athletes by their checkpoint geometry, sort by group size descending
  const geometryGroups = new Map();
  roster.forEach((athlete) => {
    const key = getGeometryKey(athlete);
    if (!geometryGroups.has(key)) geometryGroups.set(key, []);
    geometryGroups.get(key).push(athlete);
  });

  const groups = [...geometryGroups.values()].sort((a, b) => b.length - a.length);
  return `<section class="consoleSquad">${groups.map((group, index) => 
    `${index > 0 ? '<div class="consoleSquad__apart">' : ''}${group.map(card).join('')}${index > 0 ? '</div>' : ''}`
  ).join('')}</section>`;
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

function confidenceHtml() {
  const mark = selectedRecord.primaryMark;
  if (!mark) return '';
  const read = mark.confidence || (selectedRecord.confidenceReads || [])[0] || null;
  const cover = proofCoverage(mark);
  const goal = [selectedRecord.athlete.goal_label, selectedRecord.athlete.target_event]
    .filter(Boolean).join(' · ');

  // Missing confidence is not zero. Nothing has been said yet, and 0% would be a
  // statement Brice never made.
  const score = read
    ? `<b>${escapeHtml(read.score)}<i>%</i></b><span>${escapeHtml(formatDate(read.created_at))}</span>`
    : `<b class="unset">&mdash;</b><span>not set</span>`;

  return `<div class="consoleInstruments">
    <button class="inst inst--confidence" type="button" id="setConfidence">
      <span class="inst-label">Goal confidence</span>
      ${score}
      ${goal ? `<span class="inst-goal">${escapeHtml(goal)}</span>` : ''}
    </button>
    ${cover ? `<div class="inst inst--coverage">
      <span class="inst-label">Proof coverage</span>
      <b>${escapeHtml(Number(cover.established.toFixed(1)))}<i>/${escapeHtml(cover.target)} mi</i></b>
      <span class="inst-rail" aria-hidden="true"><span style="width:${cover.percent}%"></span></span>
      <span class="inst-goal">${escapeHtml(cover.percent)}% of the race proven</span>
    </div>` : ''}
    ${read ? `<p class="inst-why">${escapeHtml(read.reason)}<em>next: ${escapeHtml(read.next_evidence)}</em></p>` : ''}
  </div>`;
}

function deskHtml() {
  // One typographic instrument on a flat graphite field.
  const mark = selectedRecord.primaryMark;
  const claim = mark?.claim || mark?.current_question || '';
  
  // Check action availability
  const hasCompletion = selectedRecord.completions?.length > 0;
  const latestCompletion = selectedRecord.completions?.[0];
  // Use the same evidence relationship as evidenceSection
  const hasEvidence = latestCompletion && (selectedRecord.evidenceFiles || []).some((file) => file.completion_id === latestCompletion.id);
  
  // Check for coaching sentence - use the most recent published read or direction
  const coachingSentence = (() => {
    const allCoaching = [
      ...(selectedRecord.directions || []).filter((d) => d.delivery_state === 'published'),
      ...(selectedRecord.reads || []).filter((r) => r.delivery_state === 'published')
    ].sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
    return allCoaching[0]?.athlete_text || '';
  })();
  
  return `<section class="coachConsole" id="deskMain">
    <div id="squadStrip"></div>
    <div class="consoleStage">
      <!-- Athlete header with menu -->
      <div class="consoleAthleteHeader">
        ${whoSection(selectedRecord)}
        ${athleteMenuHtml()}
      </div>
      
      <!-- Two instruments. Confidence is Brice's judgment about the race;
           coverage is the distance he has established. They share a row and
           never an axis, because they are different quantities. -->
      ${confidenceHtml()}

      <!-- Claim -->
      ${claim ? `<p class="consoleClaim">${escapeHtml(claim)}</p>` : ''}
      
      <!-- Orientation: current, next, coming -->
      ${progressionSection(selectedRecord, { interactive: true })}
      
      <!-- Latest session -->
      ${evidenceSection(selectedRecord, { interactive: true })}
      
      <!-- Coaching sentence -->
      ${coachingSentence ? `<p class="consoleCoachSentence">${escapeHtml(coachingSentence)}</p>` : ''}
      
      <!-- Actions -->
      <div class="consoleActions">
        <button type="button" data-console-action="file-run">FILE A RUN</button>
        ${hasCompletion ? `<button type="button" data-console-action="correct-entry" data-completion-id="${escapeHtml(latestCompletion.id)}">CORRECT ENTRY</button>` : ''}
        ${hasCompletion ? `<button type="button" data-console-action="judge" data-completion-id="${escapeHtml(latestCompletion.id)}">SAY WHAT THIS DID</button>` : ''}
        ${hasEvidence ? `<button type="button" data-console-action="source-image" data-completion-id="${escapeHtml(latestCompletion.id)}">SOURCE IMAGE</button>` : ''}
      </div>
    </div>
  </section>`;
}

function paintRoster() {
  const needing = roster.filter((entry) => entry.topItem).length;
  document.getElementById('rosterCount').textContent = needing ? `${needing} need you` : 'Nothing waiting';
  document.getElementById('rosterList').innerHTML = rosterDrawerHtml();
  document.getElementById('rosterList').querySelectorAll('[data-athlete-id]').forEach((button) =>
    button.addEventListener('click', () => { closeRoster(); selectAthlete(button.dataset.athleteId); }));
}

function rosterDrawerHtml() {
  // Simplified roster drawer - just athlete names for selection
  return roster.map((athlete) => `<button class="athlete-button${athlete.id === selectedId ? ' active' : ''}" 
    type="button" data-athlete-id="${escapeHtml(athlete.id)}"
    ${athlete.id === selectedId ? 'aria-current="true"' : ''}>
    <div class="avatar">${initials(athlete.first_name || athlete.display_name)}</div>
    <div class="athlete-list-copy">
      <b>${escapeHtml(athlete.first_name || athlete.display_name)}</b>
      <small>${escapeHtml(athlete.account_label || 'Athlete')}</small>
    </div>
  </button>`).join('');
}

function openRoster() {
  paintRoster();
  document.getElementById('rosterDrawer').hidden = false;
  document.getElementById('rosterScrim').hidden = false;
  requestAnimationFrame(() => document.body.classList.add('roster-open'));
}

function closeRoster() {
  document.body.classList.remove('roster-open');
  setTimeout(() => {
    document.getElementById('rosterDrawer').hidden = true;
    document.getElementById('rosterScrim').hidden = true;
  }, 220);
}

function paintSquad() {
  // Always on the desk, not behind a drawer. The strip is orientation, and
  // orientation you have to open is not orientation.
  const squadContainer = document.getElementById('squadStrip');
  if (!squadContainer) return;
  squadContainer.innerHTML = rosterHtml();
  
  // Bind athlete selection once here
  squadContainer.querySelectorAll('[data-select-athlete]').forEach((button) =>
    button.addEventListener('click', () => selectAthlete(button.dataset.selectAthlete)));
  
  // Bind set-current for choosing mode
  squadContainer.querySelectorAll('[data-set-current]').forEach((button) =>
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await setAsCurrent(button.dataset.setCurrent);
      } catch (error) {
        button.disabled = false;
        window.alert(error.message);
      }
    }));
  
  // Bind checkpoint cycling for normal mode
  squadContainer.querySelectorAll('[data-cycle-checkpoint]').forEach((button) =>
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const nextState = { proposed: 'current', current: 'reached', reached: 'repeated', repeated: 'proposed', retired: 'proposed' };
        await moveCheckpoint(button.dataset.cycleCheckpoint, nextState[button.dataset.state] || 'current');
        await refreshSelected(true);
      } catch (error) {
        button.disabled = false;
        window.alert(error.message);
      }
    }));
}

function bindDesk() {
  paintSquad();
  app.querySelectorAll('[data-week]').forEach((button) => button.addEventListener('click', () => {
    shownWeekId = button.dataset.week; app.innerHTML = deskHtml(); bindDesk();
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
  document.getElementById('setConfidence')?.addEventListener('click', openConfidence);
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

async function setAsCurrent(checkpointId) {
  try {
    await moveCheckpoint(checkpointId, 'current');
    await refreshSelected(true);
  } catch (error) {
    window.alert(error.message);
  }
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
document.getElementById('openRoster').addEventListener('click', openRoster);
document.getElementById('closeRoster').addEventListener('click', closeRoster);
document.getElementById('rosterScrim').addEventListener('click', closeRoster);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeRoster(); });

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
