import { authErrorMessage, enabledProviders, getAccessContext, sendMagicLink, signInWithApple, signOut } from '/private/auth.js';
import { addPrivateNote, createDirection, createRead, loadAthleteRecord, loadAttentionFor, loadCoachRoster, publishRecordExcerpt, resolveCoachTask } from '/private/data.js';
import { escapeHtml, formatDate, gradeSection, markSection, recordSection } from '/private/record.js';

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
let roster = [];
let selectedId = null;
let selectedRecord = null;
let shownWeekId = null;

async function authView() {
  document.body.classList.add('auth-only');
  // Apple is the intended doorway. Email stands in only while the Apple
  // provider is off, so the record is never unreachable.
  const apple = (await enabledProviders()).apple === true;
  const action = apple
    ? `<div class="auth-actions"><button class="button primary" id="appleSignIn" type="button">Sign in with Apple <span class="icon-arrow">\u2192</span></button></div>`
    : `<form id="magicForm" class="form-grid"><label class="field-label">Email address<input class="field-input" type="email" name="email" autocomplete="email" required placeholder="you@example.com"></label><button class="button primary" type="submit">Email me a sign-in link <span class="icon-arrow">\u2192</span></button></form>`;
  app.innerHTML = `<section class="auth-page"><div class="auth-card doorway">
    <h1 class="auth-mark">FORM<span class="sr-only"> \u2014 Coach sign in</span></h1>
    ${action}
    <p class="status-message" id="authStatus" role="status"></p>
  </div></section>`;
  document.getElementById('appleSignIn')?.addEventListener('click', async () => {
    const status = document.getElementById('authStatus'); status.textContent = 'Opening Apple\u2026';
    try { await signInWithApple('/coach/'); } catch (error) { status.textContent = authErrorMessage(error); status.className = 'status-message error'; }
  });
  document.getElementById('magicForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('authStatus');
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true; status.className = 'status-message'; status.textContent = 'Sending a secure link\u2026';
    try {
      await sendMagicLink(new FormData(event.currentTarget).get('email'), '/coach/');
      status.textContent = 'Check your email. The link signs you in.'; status.className = 'status-message success';
    } catch (error) { status.textContent = authErrorMessage(error); status.className = 'status-message error'; button.disabled = false; }
  });
}

function pendingView(email) {
  app.innerHTML = `<section class="auth-page"><div class="auth-card"><p class="eyebrow">Signed in</p><h1>No coach assignment yet.</h1><p>${escapeHtml(email)} is authenticated, but this account has not been assigned to the roster.</p></div></section>`;
}

function initials(name) { return String(name || '').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

function rosterHtml() {
  return roster.map((athlete) => {
    const active = athlete.id === selectedId;
    const item = athlete.topItem;
    const count = athlete.attention.length;
    const reason = item ? item.title : 'Nothing waiting';
    return `<button class="athlete-button${active ? ' active' : ''}${item ? ' needs' : ''}" type="button" data-athlete-id="${athlete.id}" aria-pressed="${active}">
      <span class="athlete-list-copy"><b>${escapeHtml(athlete.first_name || athlete.display_name)}</b><small>${escapeHtml(reason)}</small></span>
      ${count > 1 ? `<span class="attention-count">${count}</span>` : (item ? '<span class="attention-dot" aria-label="Needs you"></span>' : '')}
    </button>`;
  }).join('');
}

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function weekGridHtml() {
  const weeks = (selectedRecord.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
  const total = selectedRecord.block?.total_weeks || weeks.length || 1;
  const week = weeks.find((entry) => entry.id === shownWeekId) || selectedRecord.currentWeek || weeks[0] || null;
  const sessions = week ? (selectedRecord.sessionsByWeek?.[week.id] || []) : [];
  const attention = selectedRecord.attention || [];

  // Every day of the week has a slot, so an empty day reads as a real decision
  // rather than an absence, and other sessions can be filled in later.
  const days = DAY_ORDER.map((label) => {
    const session = sessions.find((entry) => (entry.day_label || '').toUpperCase().startsWith(label.slice(0, 3)));
    const version = session?.currentVersion || {};
    const completion = session ? selectedRecord.completions.find((entry) => entry.planned_session_id === session.id) : null;
    const flag = session ? attention.find((item) => item.subject_id === session.id || item.subject_id === completion?.id) : null;
    return {
      label, session, version, completion, flag,
      planned: Number(version.prescribed_distance) || 0,
      actual: Number(completion?.actual_distance) || 0
    };
  });

  const scale = Math.max(...days.map((day) => Math.max(day.planned, day.actual)), 1);
  const plannedTotal = days.reduce((sum, day) => sum + day.planned, 0);
  const actualTotal = days.reduce((sum, day) => sum + day.actual, 0);
  const index = week ? weeks.findIndex((entry) => entry.id === week.id) : -1;

  const strip = Array.from({ length: total }, (_, position) => {
    const number = position + 1;
    const authored = weeks.find((entry) => entry.week_number === number);
    const isShown = week && authored && authored.id === week.id;
    return `<button class="wk-pip${authored ? ' authored' : ''}${isShown ? ' shown' : ''}" type="button"
      ${authored ? `data-week="${authored.id}"` : 'disabled'} aria-label="Week ${number}">${number}</button>`;
  }).join('');

  return `<div class="week-grid">
    <div class="week-head">
      <div class="wk-nav">
        <button class="wk-arrow" type="button" data-week-step="-1" ${index > 0 ? '' : 'disabled'} aria-label="Previous week">‹</button>
        <span class="wk-label">Week ${escapeHtml(week?.week_number ?? '—')}</span><span class="wk-of">of ${escapeHtml(total)}</span>
        <button class="wk-arrow" type="button" data-week-step="1" ${index >= 0 && index < weeks.length - 1 ? '' : 'disabled'} aria-label="Next week">›</button>
      </div>
      <div class="wk-total"><b>${actualTotal.toFixed(1)}</b><span>of ${plannedTotal.toFixed(1)} mi</span></div>
    </div>
    <div class="wk-strip">${strip}</div>
    ${week?.intent ? `<p class="wk-intent">${escapeHtml(week.intent)}</p>` : ''}
    <div class="week-days">${days.map((day) => {
      const state = day.completion ? day.completion.status : (day.session ? 'pending' : 'empty');
      return `<div class="wk-col ${escapeHtml(state)}${day.flag ? ' flagged' : ''}">
        <span class="wk-dayname">${escapeHtml(day.label)}</span>
        <div class="wk-stack">
          ${day.session ? `<span class="wk-plan" style="height:${Math.max(6, (day.planned / scale) * 100)}%"></span>
          ${day.actual ? `<span class="wk-actual" style="height:${Math.max(6, (day.actual / scale) * 100)}%"></span>` : ''}` : ''}
        </div>
        <span class="wk-num">${day.session ? (day.completion ? day.actual || '—' : `<i>${day.planned || '—'}</i>`) : ''}</span>
        <span class="wk-title" title="${escapeHtml(day.version.title || '')}">${escapeHtml(day.version.title || '')}</span>
        ${day.flag ? `<button class="wk-flag" type="button" data-write="${escapeHtml((attentionKinds[day.flag.kind] || {}).act || 'read')}" data-subject="${escapeHtml(day.flag.subject_id || '')}" title="${escapeHtml(day.flag.title)}"></button>` : ''}
      </div>`;
    }).join('')}</div>
  </div>`;
}


function decisionHtml() {
  const athlete = selectedRecord.athlete;
  const items = selectedRecord.attention || [];
  const unplaced = items.filter((item) => item.kind === 'week_unclosed' || item.kind === 'authored');
  return `<article class="situation">
    <p class="eyebrow">${escapeHtml(athlete.display_name)}${selectedRecord.athlete.target_event ? ` · ${escapeHtml(selectedRecord.athlete.target_event)}` : ''}</p>
    ${weekGridHtml()}
    ${unplaced.length ? `<div class="also">${unplaced.map((item) => `<button class="also-row" type="button" data-write="${escapeHtml((attentionKinds[item.kind] || {}).act || 'decision')}" data-subject="${escapeHtml(item.subject_id || '')}"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.summary)}</small></button>`).join('')}</div>` : ''}
  </article>`;
}



function coachMarginHtml() {
  const latestDirection = selectedRecord.directions[0];
  const latestRead = selectedRecord.reads[0];
  const notes = selectedRecord.privateNotes.slice(0, 2).map((note) => `<article class="private-note"><time>${new Date(note.created_at).toLocaleDateString()}</time><p>${escapeHtml(note.body)}</p></article>`).join('');
  const account = selectedRecord.adminStatus;
  return `<aside class="coach-margin" aria-label="Coach only">
    <section class="margin-panel">
      <p class="eyebrow">Last published</p>
      ${latestDirection ? `<p class="margin-line"><b>Direction</b> ${escapeHtml(latestDirection.athlete_text)}</p>` : ''}
      ${latestRead ? `<p class="margin-line"><b>Read</b> ${escapeHtml(latestRead.athlete_text)}</p>` : ''}
      ${!latestDirection && !latestRead ? '<p class="margin-line muted">Nothing published yet.</p>' : ''}
    </section>
    <section class="margin-panel">
      <p class="eyebrow">Coach only · ${escapeHtml(account?.relationship_label || selectedRecord.athlete.account_label)}</p>
      ${notes || '<p class="margin-line muted">No private notes.</p>'}
      <div class="margin-actions"><button class="button quiet" id="addPrivateNote" type="button">Add a note</button><button class="button quiet" id="shareExcerpt" type="button">Share card</button></div>
    </section>
  </aside>`;
}

function deskHtml() {
  const athlete = selectedRecord.athlete;
  const block = selectedRecord.block;
  const raceOn = block?.race_on
    ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date(`${block.race_on}T12:00:00`))
    : null;
  const goal = block?.goal_statement || [block?.goal_label, block?.target_event].filter(Boolean).join(' · ') || null;
  // A dashboard, not a document. The same parts her page is built from, laid out
  // for a desk: her plan on the left, what Brice is judging on the right.
  return `<div class="desk-layout">
    <aside class="desk-rail">
      <button class="rail-toggle" id="railToggle" type="button" aria-label="Show or hide the roster"><span class="rail-bars"></span></button>
      <div class="rail-body">
        <p class="eyebrow">${new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
        <h1>${escapeHtml(roster.filter((entry) => entry.topItem).length ? `${roster.filter((entry) => entry.topItem).length} need you` : 'Nothing waiting')}</h1>
        <div class="athlete-list">${rosterHtml()}</div>
      </div>
      <div class="rail-collapsed" aria-hidden="true">${roster.map((entry) => `<span class="rail-chip${entry.id === selectedId ? ' active' : ''}${entry.topItem ? ' needs' : ''}">${escapeHtml(initials(entry.display_name))}</span>`).join('')}</div>
    </aside>
    <section class="desk-main" id="deskMain">
      <header class="who">
        <h1>${escapeHtml(athlete.display_name)}</h1>
        ${goal ? `<p class="who-goal">${escapeHtml(goal)}${raceOn ? `<span class="who-date">${escapeHtml(raceOn)}</span>` : ''}</p>` : ''}
      </header>
      <div class="board">
        <div class="board-main">
          ${markSection(selectedRecord)}
          ${weekGridHtml()}
        </div>
        <div class="board-side">
          ${gradeSection(selectedRecord)}
          ${recordSection(selectedRecord)}
          ${coachMarginHtml()}
        </div>
      </div>
    </section>
  </div>`;
}

const RAIL_KEY = 'form-desk-rail-collapsed';
function applyRailState() {
  // Collapsed by default: he opens the desk to work on one athlete, not to
  // browse four names. Expanding is the deliberate act.
  document.body.classList.toggle('rail-collapsed-on', localStorage.getItem(RAIL_KEY) !== '0');
}

function bindDesk() {
  applyRailState();
  document.getElementById('railToggle')?.addEventListener('click', () => {
    localStorage.setItem(RAIL_KEY, localStorage.getItem(RAIL_KEY) === '0' ? '1' : '0');
    applyRailState();
  });
  app.querySelectorAll('[data-athlete-id]').forEach((button) => button.addEventListener('click', () => selectAthlete(button.dataset.athleteId)));
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
  coachingForm.elements.objectType.value = objectType === 'read' ? 'read' : 'direction';
  coachingForm.elements.plannedSessionId.innerHTML = selectedRecord.sessions.map((session) => `<option value="${session.id}">${escapeHtml(session.day_label)} · ${escapeHtml(session.currentVersion?.title || 'Session')}</option>`).join('');
  coachingForm.elements.completionIds.innerHTML = selectedRecord.completions.map((completion) => {
    const session = selectedRecord.sessions.find((item) => item.id === completion.planned_session_id);
    const distance = completion.actual_distance ? ` · ${completion.actual_distance} ${completion.distance_unit || ''}` : '';
    return `<option value="${completion.id}">${escapeHtml(formatDate(completion.filed_at))} · ${escapeHtml(session?.currentVersion?.title || completion.status)}${escapeHtml(distance)}</option>`;
  }).join('') || '<option value="" disabled>No sessions filed yet</option>';
  // Preselect what the situation pointed at, so the coach is not re-finding it.
  if (subjectId) {
    if (objectType === 'read') {
      [...coachingForm.elements.completionIds.options].forEach((option) => { option.selected = option.value === subjectId; });
    } else if ([...coachingForm.elements.plannedSessionId.options].some((option) => option.value === subjectId)) {
      coachingForm.elements.plannedSessionId.value = subjectId;
    }
  }
  document.getElementById('coachingStatus').textContent = '';
  toggleCoachingFields(); coachingDialog.showModal();
}

function toggleCoachingFields() {
  const read = coachingForm.elements.objectType.value === 'read';
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

dialogs.forEach((dialog) => dialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close())));
coachingForm.elements.objectType.addEventListener('change', toggleCoachingFields);
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
    if (form.get('objectType') === 'direction') {
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
    userEmail.textContent = access.session.user.email || ''; signOutButton.hidden = false;
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
