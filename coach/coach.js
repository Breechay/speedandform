import { authErrorMessage, enabledProviders, getAccessContext, sendMagicLink, signInWithApple, signOut } from '/private/auth.js';
import { addPrivateNote, createDirection, createRead, loadAthleteRecord, loadAttentionFor, loadCoachRoster, publishRecordExcerpt, resolveCoachTask } from '/private/data.js';
import { escapeHtml, formatDate, markSection, recordSection, weekSection, whoSection } from '/private/record.js';

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
  return roster.map((athlete) => `<button class="athlete-button${athlete.id === selectedId ? ' active' : ''}${athlete.topItem ? ' needs' : ''}" type="button" data-athlete-id="${athlete.id}">
    <span class="athlete-list-copy"><b>${escapeHtml(athlete.first_name || athlete.display_name)}</b><small>${escapeHtml(athlete.topItem ? athlete.topItem.title : 'Nothing waiting')}</small></span>
    ${athlete.attention.length ? `<span class="attention-count">${athlete.attention.length}</span>` : ''}
  </button>`).join('');
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
      <button class="control-item" id="addPrivateNote" type="button">Add a private note</button>
      <button class="control-item" id="shareExcerpt" type="button">Create a share card</button>
    </div>
  </details>`;
}

function deskHtml() {
  return `<section class="desk-main" id="deskMain">
    <div class="board">
      <div class="board-main">
        <div class="who-row">${whoSection(selectedRecord)}${athleteMenuHtml()}</div>
        ${weekSection(selectedRecord, { shownWeekId })}
        ${markSection(selectedRecord)}
      </div>
      <div class="board-side">
        ${recordSection(selectedRecord, { limit: 4 })}
      </div>
    </div>
  </section>`;
}

function paintRoster() {
  const needing = roster.filter((entry) => entry.topItem).length;
  document.getElementById('rosterCount').textContent = needing ? `${needing} need you` : 'Nothing waiting';
  document.getElementById('rosterList').innerHTML = rosterHtml();
  document.getElementById('rosterList').querySelectorAll('[data-athlete-id]').forEach((button) =>
    button.addEventListener('click', () => { closeRoster(); selectAthlete(button.dataset.athleteId); }));
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

function bindDesk() {
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
