import { authErrorMessage, enabledProviders, getAccessContext, sendMagicLink, signInWithApple, signOut } from '/private/auth.js';
import { addPrivateNote, createDirection, createRead, loadAthleteRecord, loadCoachRoster, publishRecordExcerpt, resolveCoachTask } from '/private/data.js';
import { escapeHtml, formatDate, renderAthleteRecord } from '/private/record.js';

const stateLabels = {
  needs_you: 'Needs you', waiting_for_run: 'Waiting for run', waiting_for_athlete: 'Waiting for athlete',
  ready_to_publish: 'Ready to publish', plan_changed: 'Plan changed', on_track: 'On track',
  nothing_needed: 'Nothing needed', resolved: 'Resolved'
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

async function authView() {
  document.body.classList.add('auth-only');
  const apple = (await enabledProviders()).apple === true;
  app.innerHTML = `<section class="auth-page"><div class="auth-card doorway">
    <h1 class="auth-mark">FORM<span class="sr-only"> — Coach sign in</span></h1>
    ${apple ? `<div class="auth-actions"><button class="button primary" id="appleSignIn" type="button">Continue with Apple <span class="icon-arrow">→</span></button></div>
    <div class="auth-divider">or use email</div>` : ''}
    <form id="magicForm" class="form-grid"><label class="field-label">Email address<input class="field-input" type="email" name="email" autocomplete="email" required placeholder="you@example.com"></label><button class="button${apple ? '' : ' primary'}" type="submit">Email me a sign-in link <span class="icon-arrow">→</span></button><p class="status-message" id="authStatus" role="status"></p></form>
  </div></section>`;
  document.getElementById('appleSignIn')?.addEventListener('click', async () => {
    const status = document.getElementById('authStatus'); status.textContent = 'Opening Apple…';
    try { await signInWithApple('/coach/'); } catch (error) { status.textContent = authErrorMessage(error); status.className = 'status-message error'; }
  });
  document.getElementById('magicForm').addEventListener('submit', async (event) => {
    event.preventDefault(); const status = document.getElementById('authStatus'); const button = event.currentTarget.querySelector('button');
    button.disabled = true; status.textContent = 'Sending a secure link…';
    try { await sendMagicLink(new FormData(event.currentTarget).get('email'), '/coach/'); status.textContent = 'Check your email. The link returns to the desk.'; status.className = 'status-message success'; }
    catch (error) { status.textContent = authErrorMessage(error); status.className = 'status-message error'; button.disabled = false; }
  });
}

function pendingView(email) {
  app.innerHTML = `<section class="auth-page"><div class="auth-card"><p class="eyebrow">Signed in</p><h1>No coach assignment yet.</h1><p>${escapeHtml(email)} is authenticated, but this account has not been assigned to the roster.</p></div></section>`;
}

function initials(name) { return String(name || '').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

function rosterHtml() {
  return roster.map((athlete) => {
    const active = athlete.id === selectedId;
    const task = athlete.task;
    const status = task?.state || 'nothing_needed';
    return `<button class="athlete-button${active ? ' active' : ''}" type="button" data-athlete-id="${athlete.id}" aria-pressed="${active}">
      <span class="avatar">${escapeHtml(initials(athlete.display_name))}</span>
      <span class="athlete-list-copy"><b>${escapeHtml(athlete.display_name)}</b><small>${escapeHtml(task?.title || athlete.mark?.current_question || 'Nothing needed')}</small></span>
      <span class="state-pill ${escapeHtml(status)}">${escapeHtml(stateLabels[status])}</span>
    </button>`;
  }).join('');
}

function decisionHtml() {
  const task = selectedRecord.task;
  if (!task) return `<article class="decision-card"><span class="state-pill on_track">Nothing needed</span><h2>The next work is already clear.</h2><p class="decision-summary">No decision is waiting on Brice for ${escapeHtml(selectedRecord.athlete.first_name)}.</p></article>`;
  const evidence = selectedRecord.taskEvidence.map((item) => `<div class="evidence"><span>${escapeHtml(item.label)}</span><b>${escapeHtml(item.value)}</b></div>`).join('');
  const actions = selectedRecord.taskActions.map((action) => `<button class="button${action.is_primary ? ' primary' : ''}" type="button" data-task-action="${action.id}">${escapeHtml(action.label)}${action.is_primary ? ' <span class="icon-arrow">→</span>' : ''}</button>`).join('');
  return `<article class="decision-card">
    <span class="state-pill ${escapeHtml(task.state)}">${escapeHtml(stateLabels[task.state])}</span>
    <h2>${escapeHtml(task.title)}</h2><p class="decision-summary">${escapeHtml(task.summary)}</p>
    ${evidence ? `<div class="evidence-grid">${evidence}</div>` : ''}
    ${actions ? `<div class="action-label">Make the next call</div><div class="decision-actions">${actions}</div>` : ''}
    <button class="button quiet" type="button" id="customDecision">Write ${actions ? 'a different' : 'the'} Decision</button>
  </article>`;
}

function coachMarginHtml() {
  const latestDirection = selectedRecord.directions[0];
  const latestRead = selectedRecord.reads[0];
  const notes = selectedRecord.privateNotes.slice(0, 3).map((note) => `<article class="private-note"><time>${new Date(note.created_at).toLocaleDateString()}</time><p>${escapeHtml(note.body)}</p></article>`).join('');
  const account = selectedRecord.adminStatus;
  return `<aside class="coach-margin" aria-label="Coach margin">
    <section class="margin-panel"><p class="eyebrow">Coach margin</p><h3>Write once. Publish clearly.</h3><div class="margin-actions"><button class="button primary" id="writeCoaching" type="button">Write Direction or Read <span class="icon-arrow">→</span></button><button class="button" id="addPrivateNote" type="button">Add private note</button><button class="button" id="shareExcerpt" type="button">Create share card</button></div></section>
    <section class="margin-panel"><p class="eyebrow">Recent coaching</p>${latestDirection ? `<p><strong>Direction · Published</strong><br>${escapeHtml(latestDirection.athlete_text)}</p>` : '<p>No Direction yet.</p>'}${latestRead ? `<p><strong>Read · Published</strong><br>${escapeHtml(latestRead.athlete_text)}</p>` : ''}</section>
    <section class="margin-panel"><p class="eyebrow">Coach only</p><h3>${escapeHtml(account?.relationship_label || selectedRecord.athlete.account_label)}</h3><p>${account ? escapeHtml(stateLabels[account.payment_state] || account.payment_state.replace('_', ' ')) : ''}</p>${notes || '<p>No private notes.</p>'}</section>
  </aside>`;
}

function deskHtml() {
  const needsCount = roster.filter((athlete) => ['needs_you', 'ready_to_publish', 'plan_changed'].includes(athlete.task?.state)).length;
  return `<div class="desk-layout">
    <aside class="desk-rail"><p class="eyebrow">${new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p><h1>What needs a decision.</h1><p>${needsCount ? `${needsCount} ${needsCount === 1 ? 'decision needs' : 'decisions need'} you today.` : 'Nothing urgent is waiting.'}</p><div class="rail-heading"><strong>Athletes</strong><span>${roster.length} active</span></div><div class="athlete-list">${rosterHtml()}</div></aside>
    <section class="desk-main" id="deskMain">${decisionHtml()}<div class="desk-columns"><section class="projection-frame"><div class="projection-head"><h3>${escapeHtml(selectedRecord.athlete.first_name)}’s record · athlete view</h3><a class="button quiet" href="#recordProjection">View record</a></div><div id="recordProjection">${renderAthleteRecord(selectedRecord, { projection: true })}</div></section>${coachMarginHtml()}</div></section>
  </div>`;
}

function bindDesk() {
  app.querySelectorAll('[data-athlete-id]').forEach((button) => button.addEventListener('click', () => selectAthlete(button.dataset.athleteId)));
  app.querySelectorAll('[data-task-action]').forEach((button) => button.addEventListener('click', () => openDecision(button.dataset.taskAction)));
  document.getElementById('customDecision')?.addEventListener('click', () => openDecision(null));
  document.getElementById('writeCoaching')?.addEventListener('click', openCoaching);
  document.getElementById('addPrivateNote')?.addEventListener('click', () => { noteForm.reset(); document.getElementById('noteStatus').textContent = ''; noteDialog.showModal(); });
  document.getElementById('shareExcerpt')?.addEventListener('click', openShare);
}

async function selectAthlete(athleteId) {
  selectedId = athleteId;
  app.innerHTML = '<div class="loading" aria-label="Loading athlete"></div>';
  selectedRecord = await loadAthleteRecord(athleteId, { coach: true });
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

function openCoaching() {
  coachingForm.reset();
  coachingForm.elements.plannedSessionId.innerHTML = selectedRecord.sessions.map((session) => `<option value="${session.id}">${escapeHtml(session.day_label)} · ${escapeHtml(session.currentVersion?.title || 'Session')}</option>`).join('');
  coachingForm.elements.completionIds.innerHTML = selectedRecord.completions.map((completion) => {
    const session = selectedRecord.sessions.find((item) => item.id === completion.planned_session_id);
    const distance = completion.actual_distance ? ` · ${completion.actual_distance} ${completion.distance_unit || ''}` : '';
    return `<option value="${completion.id}">${escapeHtml(formatDate(completion.filed_at))} · ${escapeHtml(session?.currentVersion?.title || completion.status)}${escapeHtml(distance)}</option>`;
  }).join('') || '<option value="" disabled>No sessions filed yet</option>';
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
  app.innerHTML = deskHtml(); if (animate) document.querySelector('.decision-card')?.classList.add('resolve-in'); bindDesk();
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
