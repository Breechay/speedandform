import { bindAccountSecurity, authErrorMessage, getAccessContext, rememberWorkspace, renderDoorway, resolveAuthorizedWorkspace, signOut } from '/private/auth.js';
import { changeEmail, loadAthleteRecord } from '/private/data.js';
import { escapeHtml } from '/private/record.js';
import { renderAthleteWorkspace } from '/athlete/workspace.js';

const app = document.getElementById('app');
const signOutButton = document.getElementById('signOut');
const userEmail = document.getElementById('userEmail');
const emailDialog = document.getElementById('emailDialog');
const emailForm = document.getElementById('emailForm');
let signedInEmail = '';
let record = null;
let shownWeekId = null;
let activeView = ['today','plan','history','account'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today';

async function authView() {
  document.body.classList.add('auth-only');
  await renderDoorway(app, { destination: '/athlete/', label: 'Athlete sign in' });
}

function pendingView(email) {
  app.innerHTML = `<section class="auth-page"><div class="auth-card access-pending">
    <div><p class="eyebrow">Signed in</p><h1>Your training is not linked yet.</h1><p>${escapeHtml(email)} is secure, but it has not been matched to an athlete workspace. Brice can link it without creating another account.</p></div>
    <a class="button" href="mailto:brice@speedandform.com?subject=Link%20my%20FORM%20training">Ask Brice to link this email <span class="icon-arrow">→</span></a>
  </div></section>`;
}

function workspaceChoiceView() {
  app.innerHTML = `<section class="auth-page"><div class="auth-card workspace-chooser">
    <p class="eyebrow">FORM access</p><h1>Choose a workspace.</h1><p>This account can enter both sides of FORM.</p>
    <button class="button primary" type="button" data-workspace="coach">Coach Console <span>→</span></button>
    <button class="button" type="button" data-workspace="athlete">My training <span>→</span></button>
  </div></section>`;
  app.querySelectorAll('[data-workspace]').forEach((button) => button.addEventListener('click', () => {
    const workspace = button.dataset.workspace;
    rememberWorkspace(workspace);
    window.location.replace(workspace === 'coach' ? '/coach/labs/' : '/athlete/');
  }));
}

function setView(view, { push = true } = {}) {
  if (!['today','plan','history','account'].includes(view)) return;
  activeView = view;
  if (push) history.replaceState(null, '', `#${view}`);
  renderFrom();
}

function bindWeekNav() {
  app.querySelectorAll('[data-week-step]').forEach((button) => button.addEventListener('click', () => {
    const weeks = (record.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
    const current = weeks.find((entry) => entry.id === shownWeekId) || record.currentWeek || weeks[0];
    const at = weeks.findIndex((entry) => entry.id === current?.id);
    const next = weeks[at + Number(button.dataset.weekStep)];
    if (next) { shownWeekId = next.id; renderFrom(); }
  }));
}

function bindWorkspaceActions() {
  app.querySelectorAll('[data-athlete-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.athleteView)));
  bindWeekNav();
  document.getElementById('accountSignOut')?.addEventListener('click', signOut);
  bindAccountSecurity();
  document.getElementById('changeEmail')?.addEventListener('click', () => {
    emailForm.reset();
    const status = document.getElementById('emailStatus');
    status.textContent = ''; status.className = 'status-message';
    emailDialog.showModal();
  });
}

function renderFrom() {
  app.innerHTML = renderAthleteWorkspace(record, { view: activeView, shownWeekId, email: signedInEmail });
  // Once the athlete workspace is available, Account owns security and sign-out.
  // Keep the top-bar sign-out only for signed-in accounts whose workspace is not linked yet.
  signOutButton.hidden = true;
  bindWorkspaceActions();
}

async function renderRecord(athleteId) {
  app.innerHTML = '<div class="loading" aria-label="Loading your training"></div>';
  record = await loadAthleteRecord(athleteId);
  shownWeekId = record.currentWeek?.id || record.weeks?.[0]?.id || null;
  renderFrom();
}

signOutButton.addEventListener('click', signOut);

window.addEventListener('hashchange', () => {
  const next = location.hash.slice(1);
  if (record && ['today','plan','history','account'].includes(next) && next !== activeView) setView(next, { push: false });
});

async function boot() {
  try {
    const access = await getAccessContext();
    if (!access.session) { await authView(); return; }
    document.body.classList.remove('auth-only');
    signedInEmail = access.session.user.email || '';
    userEmail.textContent = signedInEmail;
    signOutButton.hidden = false;
    const workspace = resolveAuthorizedWorkspace(access);
    if (workspace === 'coach') { window.location.replace('/coach/labs/'); return; }
    if (workspace === 'choose') { workspaceChoiceView(); return; }
    if (!access.athleteMemberships.length) { pendingView(access.session.user.email || 'This account'); return; }
    rememberWorkspace('athlete');
    await renderRecord(access.athleteMemberships[0].athlete_id);
  } catch (error) {
    app.innerHTML = `<section class="auth-page"><div class="auth-card"><p class="eyebrow">Could not open your training</p><h1>Try that again.</h1><p class="status-message error">${escapeHtml(authErrorMessage(error))}</p><button class="button" type="button" id="retry">Retry</button></div></section>`;
    document.getElementById('retry').addEventListener('click', () => window.location.reload());
  }
}

boot();

emailDialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => emailDialog.close()));
emailForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('emailStatus');
  const submit = emailForm.querySelector('button[type="submit"]');
  submit.disabled = true; status.className = 'status-message'; status.textContent = 'Sending the confirmation…';
  try {
    const next = await changeEmail(new FormData(emailForm).get('email'));
    status.textContent = `Check ${next}. The change takes effect once you confirm it.`;
    status.className = 'status-message success';
  } catch (error) {
    status.textContent = error.message || 'That email could not be saved.';
    status.className = 'status-message error'; submit.disabled = false;
  }
});
