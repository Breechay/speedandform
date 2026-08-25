import { authErrorMessage, enabledProviders, getAccessContext, sendMagicLink, signInWithApple, signOut } from '/private/auth.js';
import { addPrivateNote, createDirection, createRead, loadAthleteRecord, loadAttentionFor, loadCoachRoster, publishRecordExcerpt, resolveCoachTask } from '/private/data.js';
import { escapeHtml, formatDate, renderAthleteRecord } from '/private/record.js';

// Account states only. The desk no longer labels athletes by a stored state —
// the queue is derived from the record.
const stateLabels = {
  needs_you: 'Needs you', ready_to_publish: 'Ready to publish', plan_changed: 'Plan changed',
  on_track: 'On track', nothing_needed: 'Nothing needed', resolved: 'Resolved'
};

// What each kind of attention actually asks the coach to do. The primary act
// follows the situation instead of offering every object every time.
const attentionKinds = {
  recovery_flag:     { label: 'Recovery',  act: 'read',      cta: 'Write the Read' },
  authored:          { label: 'Needs you', act: 'decision',  cta: 'Write the Decision' },
  unread_session:    { label: 'Unanswered', act: 'read',     cta: 'Write the Read' },
  missing_direction: { label: 'No Direction', act: 'direction', cta: 'Write the Direction' },
  week_unclosed:     { label: 'Week open', act: 'decision',  cta: 'Write the Decision' }
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

function decisionHtml() {
  const items = selectedRecord.attention || [];
  const athlete = selectedRecord.athlete;
  if (!items.length) {
    return `<article class="situation quiet">
      <p class="eyebrow">${escapeHtml(athlete.first_name)}</p>
      <h2>Nothing is waiting on you.</h2>
      <p class="lede">${escapeHtml(selectedRecord.primaryMark?.current_question || 'The next work is already clear.')}</p>
      <div class="do"><button class="button" type="button" data-write="direction">Write a Direction</button><button class="button" type="button" data-write="read">Write a Read</button></div>
    </article>`;
  }
  const item = items[0];
  const kind = attentionKinds[item.kind] || { label: 'Needs you', act: 'decision', cta: 'Write the Decision' };
  const rest = items.slice(1);
  return `<article class="situation">
    <p class="eyebrow">${escapeHtml(athlete.first_name)} · ${escapeHtml(kind.label)}</p>
    <h2>${escapeHtml(item.title)}</h2>
    <p class="lede">${escapeHtml(item.summary)}</p>
    ${evidenceHtml(item)}
    <div class="do">
      <button class="button primary" type="button" data-write="${escapeHtml(kind.act)}" data-subject="${escapeHtml(item.subject_id || '')}">${escapeHtml(kind.cta)} <span class="icon-arrow">→</span></button>
      ${item.kind === 'authored' && selectedRecord.taskActions.length
        ? selectedRecord.taskActions.map((action) => `<button class="button" type="button" data-task-action="${action.id}">${escapeHtml(action.label)}</button>`).join('')
        : ''}
    </div>
    ${rest.length ? `<div class="also"><span>Also waiting</span>${rest.map((other) => `<button class="also-row" type="button" data-focus="${escapeHtml(other.subject_id || '')}"><b>${escapeHtml(other.title)}</b><small>${escapeHtml(other.summary)}</small></button>`).join('')}</div>` : ''}
  </article>`;
}

function evidenceHtml(item) {
  const facts = [];
  const mark = selectedRecord.primaryMark;
  if (mark) facts.push({ label: mark.label, value: mark.current_value == null ? '—' : `${mark.current_value}${mark.unit ? ` ${mark.unit}` : ''}` });
  if (item.occurred_at) facts.push({ label: 'When', value: formatDate(item.occurred_at) });
  const completion = selectedRecord.completions.find((entry) => entry.id === item.subject_id);
  if (completion) {
    if (completion.felt) facts.push({ label: 'Felt', value: completion.felt });
    if (completion.knee_after) facts.push({ label: 'Knee after', value: completion.knee_after });
    if (completion.athlete_note) facts.push({ label: 'Her note', value: completion.athlete_note });
  }
  if (!facts.length) return '';
  return `<dl class="facts">${facts.slice(0, 4).map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join('')}</dl>`;
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
  const needing = roster.filter((athlete) => athlete.topItem).length;
  const headline = needing
    ? `${needing === 1 ? 'One athlete needs' : `${needing} athletes need`} you.`
    : 'Nothing is waiting on you.';
  return `<div class="desk-layout">
    <aside class="desk-rail">
      <p class="eyebrow">${new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
      <h1>${escapeHtml(headline)}</h1>
      <div class="athlete-list">${rosterHtml()}</div>
    </aside>
    <section class="desk-main" id="deskMain">
      ${decisionHtml()}
      <div class="desk-columns">
        ${coachMarginHtml()}
        <details class="record-drawer"><summary><span>${escapeHtml(selectedRecord.athlete.first_name)}'s record, as ${escapeHtml(selectedRecord.athlete.first_name)} sees it</span></summary><div class="projection-frame"><div class="projection-scroll"><div id="recordProjection">${renderAthleteRecord(selectedRecord, { projection: true })}</div></div></div></details>
      </div>
    </section>
  </div>`;
}

function bindDesk() {
  app.querySelectorAll('[data-athlete-id]').forEach((button) => button.addEventListener('click', () => selectAthlete(button.dataset.athleteId)));
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
