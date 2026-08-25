import { authErrorMessage, enabledProviders, getAccessContext, sendMagicLink, signInWithApple, signOut } from '/private/auth.js';
import { changeEmail, fileSession, loadAthleteRecord, updateCompletion } from '/private/data.js';
import { escapeHtml, renderAthleteRecord } from '/private/record.js';

const app = document.getElementById('app');
const signOutButton = document.getElementById('signOut');
const userEmail = document.getElementById('userEmail');
const fileDialog = document.getElementById('fileDialog');
const fileForm = document.getElementById('fileForm');
const fileStatus = document.getElementById('fileStatus');
const recordNav = document.getElementById('recordNav');
const emailDialog = document.getElementById('emailDialog');
const emailForm = document.getElementById('emailForm');
let signedInEmail = '';
let record = null;
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
    <h1 class="auth-mark">FORM<span class="sr-only"> \u2014 Athlete sign in</span></h1>
    ${action}
    <p class="status-message" id="authStatus" role="status"></p>
  </div></section>`;
  document.getElementById('appleSignIn')?.addEventListener('click', async () => {
    const status = document.getElementById('authStatus'); status.textContent = 'Opening Apple\u2026';
    try { await signInWithApple('/athlete/'); } catch (error) { status.textContent = authErrorMessage(error); status.className = 'status-message error'; }
  });
  document.getElementById('magicForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('authStatus');
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true; status.className = 'status-message'; status.textContent = 'Sending a secure link\u2026';
    try {
      await sendMagicLink(new FormData(event.currentTarget).get('email'), '/athlete/');
      status.textContent = 'Check your email. The link signs you in.'; status.className = 'status-message success';
    } catch (error) { status.textContent = authErrorMessage(error); status.className = 'status-message error'; button.disabled = false; }
  });
}

function pendingView(email) {
  app.innerHTML = `<section class="auth-page"><div class="auth-card access-pending">
    <div><p class="eyebrow">Signed in</p><h1>Your record is not linked yet.</h1><p>${escapeHtml(email)} is secure, but it has not been matched to an athlete record. Brice can link it without creating another account.</p></div>
    <a class="button" href="mailto:brice@speedandform.com?subject=Link%20my%20FORM%20record">Ask Brice to link this email <span class="icon-arrow">→</span></a>
  </div></section>`;
}

function bindRecordActions() {
  app.querySelectorAll('[data-file-session]').forEach((button) => button.addEventListener('click', () => {
    const completion = record.completions.find((item) => item.id === button.dataset.completionId);
    fileForm.reset();
    fileForm.elements.plannedSessionId.value = button.dataset.fileSession;
    fileForm.elements.completionId.value = completion?.id || '';
    document.getElementById('fileTitle').textContent = completion ? 'Update your session' : 'File this session';
    document.getElementById('evidenceField').hidden = Boolean(completion);
    fileStatus.textContent = ''; fileStatus.className = 'status-message';
    if (completion) {
      fileForm.elements.status.value = completion.status;
      fileForm.elements.actualDistance.value = completion.actual_distance ?? '';
      fileForm.elements.durationMinutes.value = completion.duration_seconds ? Math.round(completion.duration_seconds / 60) : '';
      fileForm.elements.felt.value = completion.felt || '';
      fileForm.elements.kneeDuring.value = completion.knee_during || '';
      fileForm.elements.kneeAfter.value = completion.knee_after || '';
      fileForm.elements.recoveredNextDay.value = completion.recovered_next_day === null ? '' : (completion.recovered_next_day ? 'yes' : 'no');
      fileForm.elements.stravaUrl.value = completion.strava_url || '';
      fileForm.elements.athleteNote.value = completion.athlete_note || '';
    }
    fileDialog.showModal();
  }));
}

function bindWeekNav() {
  app.querySelectorAll('[data-week]').forEach((button) => button.addEventListener('click', () => {
    shownWeekId = button.dataset.week; renderFrom();
  }));
  app.querySelectorAll('[data-week-step]').forEach((button) => button.addEventListener('click', () => {
    const weeks = (record.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
    const at = weeks.findIndex((entry) => entry.id === (shownWeekId || record.currentWeek?.id));
    const next = weeks[at + Number(button.dataset.weekStep)];
    if (next) { shownWeekId = next.id; renderFrom(); }
  }));
}

function renderFrom() {
  app.innerHTML = renderAthleteRecord(record, { interactive: true, email: signedInEmail, shownWeekId });
  bindRecordActions();
  bindWeekNav();
}

async function renderRecord(athleteId) {
  app.innerHTML = '<div class="loading" aria-label="Loading your record"></div>';
  record = await loadAthleteRecord(athleteId);
  app.innerHTML = renderAthleteRecord(record, { interactive: true, email: signedInEmail, shownWeekId });
  bindRecordActions();
  // The record has its own nav, so the bare sign-out button steps aside.
  recordNav.hidden = false;
  signOutButton.hidden = true;
  bindWeekNav();
  document.getElementById('accountSignOut')?.addEventListener('click', signOut);
  document.getElementById('changeEmail')?.addEventListener('click', () => {
    emailForm.reset();
    const status = document.getElementById('emailStatus');
    status.textContent = ''; status.className = 'status-message';
    emailDialog.showModal();
  });
}

fileDialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => fileDialog.close()));
fileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(fileForm);
  const submit = fileForm.querySelector('button[type="submit"]');
  const recovery = data.get('recoveredNextDay');
  const payload = {
    athleteId: record.athlete.id,
    plannedSessionId: data.get('plannedSessionId'),
    status: data.get('status'),
    actualDistance: Number(data.get('actualDistance')) || null,
    distanceUnit: 'mi',
    durationSeconds: Number(data.get('durationMinutes')) ? Number(data.get('durationMinutes')) * 60 : null,
    felt: data.get('felt'), kneeDuring: data.get('kneeDuring'), kneeAfter: data.get('kneeAfter'),
    recoveredNextDay: recovery === '' ? null : recovery === 'yes',
    athleteNote: data.get('athleteNote'), stravaUrl: data.get('stravaUrl')
  };
  submit.disabled = true; fileStatus.textContent = 'Saving your session…'; fileStatus.className = 'status-message';
  try {
    const completionId = data.get('completionId');
    if (completionId) await updateCompletion(completionId, payload);
    else await fileSession(payload, data.get('evidence')?.size ? data.get('evidence') : null);
    fileStatus.textContent = 'Saved. Your record has moved forward.'; fileStatus.className = 'status-message success';
    await renderRecord(record.athlete.id);
    fileDialog.close();
  } catch (error) {
    fileStatus.textContent = error.message || 'The session could not be saved.'; fileStatus.className = 'status-message error'; submit.disabled = false;
  }
});

signOutButton.addEventListener('click', signOut);
document.getElementById('navSignOut').addEventListener('click', signOut);
recordNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { recordNav.open = false; }));

async function boot() {
  try {
    const access = await getAccessContext();
    if (!access.session) { await authView(); return; }
    document.body.classList.remove('auth-only');
    signedInEmail = access.session.user.email || '';
    userEmail.textContent = signedInEmail;
    signOutButton.hidden = false;
    if (!access.athleteMemberships.length && access.coachMemberships.length) { window.location.replace('/coach/'); return; }
    if (!access.athleteMemberships.length) { pendingView(access.session.user.email || 'This account'); return; }
    await renderRecord(access.athleteMemberships[0].athlete_id);
  } catch (error) {
    app.innerHTML = `<section class="auth-page"><div class="auth-card"><p class="eyebrow">Could not open the record</p><h1>Try that again.</h1><p class="status-message error">${escapeHtml(authErrorMessage(error))}</p><button class="button" type="button" id="retry">Retry</button></div></section>`;
    document.getElementById('retry').addEventListener('click', () => window.location.reload());
  }
}

boot();

emailDialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => emailDialog.close()));
emailForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('emailStatus');
  const submit = emailForm.querySelector('button[type="submit"]');
  submit.disabled = true; status.className = 'status-message'; status.textContent = 'Sending the confirmation\u2026';
  try {
    const next = await changeEmail(new FormData(emailForm).get('email'));
    status.textContent = `Check ${next}. The change takes effect once you confirm it.`;
    status.className = 'status-message success';
  } catch (error) {
    status.textContent = error.message || 'That email could not be saved.';
    status.className = 'status-message error'; submit.disabled = false;
  }
});
