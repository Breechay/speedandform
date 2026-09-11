const ICONS = {
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></svg>'
};

let retryTimer = null;
let retries = 0;

function iconizeButton(button, icon) {
  if (!button || button.dataset.polishedIcon === icon) return;
  button.dataset.polishedIcon = icon;
  button.innerHTML = ICONS[icon];
}

function polishCalendarControls() {
  document.querySelectorAll('[data-calendar-step="-1"]').forEach((button) => iconizeButton(button, 'left'));
  document.querySelectorAll('[data-calendar-step="1"]').forEach((button) => iconizeButton(button, 'right'));
  document.querySelectorAll('[data-calendar-close]').forEach((button) => iconizeButton(button, 'close'));
  document.querySelectorAll('[data-ops-week="-1"]').forEach((button) => iconizeButton(button, 'left'));
  document.querySelectorAll('[data-ops-week="1"]').forEach((button) => iconizeButton(button, 'right'));
}

function polishRailUtilities() {
  const rail = document.querySelector('.ccRail');
  if (!rail) return false;
  const calendar = rail.querySelector('.ccRailAction');
  const account = rail.querySelector('.ccAccount');
  if (!calendar || !account) return false;

  let utilities = rail.querySelector('.ccRailUtilities');
  if (!utilities) {
    utilities = document.createElement('div');
    utilities.className = 'ccRailUtilities';
    calendar.before(utilities);
  }
  if (calendar.parentElement !== utilities) utilities.appendChild(calendar);
  if (account.parentElement !== utilities) utilities.appendChild(account);

  const summary = account.querySelector('summary');
  if (!summary) return true;
  if (!summary.querySelector('svg')) summary.innerHTML = `${ICONS.account}<span>Account</span>`;
  summary.setAttribute('aria-haspopup', 'dialog');
  if (!summary.dataset.accountToggleBound) {
    summary.dataset.accountToggleBound = '1';
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      const details = summary.closest('details');
      if (details) details.open = !details.open;
    });
  }
  return true;
}

function polishAccountModal() {
  const account = document.querySelector('.ccAccount');
  const details = account?.querySelector('details');
  const menu = details?.querySelector('.ccAccountMenu');
  if (!account || !details || !menu) return false;

  details.classList.add('ccAccountDetails');
  if (!menu.dataset.modalStructured) {
    menu.dataset.modalStructured = '1';
    const head = document.createElement('div');
    head.className = 'ccAccountModalHead';
    head.innerHTML = `<div><small>Coach Console</small><strong>Account</strong></div><button type="button" data-account-close aria-label="Close account">${ICONS.close}</button>`;

    const googleLabel = document.createElement('div');
    googleLabel.className = 'ccAccountSectionLabel';
    googleLabel.textContent = 'Google Calendar';
    const securityLabel = document.createElement('div');
    securityLabel.className = 'ccAccountSectionLabel ccAccountSecurityLabel';
    securityLabel.textContent = 'Security';

    const setPassword = menu.querySelector('#setPassword');
    const linkGoogle = menu.querySelector('#linkGoogle');
    const calendarConnect = menu.querySelector('#calendarConnect');
    const calendarSync = menu.querySelector('#calendarSync');
    const calendarDisconnect = menu.querySelector('#calendarDisconnect');
    const linkApple = menu.querySelector('#linkApple');
    const signOut = menu.querySelector('[data-auth-signout]');
    const state = menu.querySelector('#calendarState');
    const googleNodes = [linkGoogle, calendarConnect, calendarSync, calendarDisconnect, linkApple, state].filter(Boolean);
    const securityNodes = [setPassword, signOut].filter(Boolean);
    menu.replaceChildren(head, googleLabel, ...googleNodes, securityLabel, ...securityNodes);

    head.querySelector('[data-account-close]')?.addEventListener('click', () => { details.open = false; });
    details.addEventListener('toggle', () => { if (details.open) window.setTimeout(run, 0); });
  }

  const linkGoogle = menu.querySelector('#linkGoogle');
  const calendarConnect = menu.querySelector('#calendarConnect');
  const calendarSync = menu.querySelector('#calendarSync');
  const calendarDisconnect = menu.querySelector('#calendarDisconnect');
  const state = menu.querySelector('#calendarState');

  if (linkGoogle && !linkGoogle.hidden && calendarConnect) {
    calendarConnect.hidden = false;
    calendarConnect.disabled = true;
    calendarConnect.dataset.waitingForGoogle = '1';
    if (state) {
      state.hidden = false;
      state.textContent = 'Connect Google first. Then approve Calendar access here.';
    }
  } else if (calendarConnect?.dataset.waitingForGoogle === '1') {
    calendarConnect.disabled = false;
    delete calendarConnect.dataset.waitingForGoogle;
  }

  if (linkGoogle?.hidden && calendarConnect && calendarSync?.hidden && calendarDisconnect?.hidden && state?.textContent === 'Calendar is not connected.') {
    calendarConnect.hidden = false;
    calendarConnect.disabled = false;
  }
  return true;
}

function polishDossier() {
  const tasks = document.querySelector('.ccTodoPanel');
  if (tasks) tasks.classList.add('ccCard');
  return Boolean(tasks);
}

function run() {
  polishCalendarControls();
  const railReady = polishRailUtilities();
  const accountReady = polishAccountModal();
  const dossierReady = polishDossier();
  if ((!railReady || !accountReady || !dossierReady) && retries < 24 && !retryTimer) {
    retries += 1;
    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      run();
    }, 150);
  }
}

// The Console renders asynchronously. Keep this pass bounded and interaction-driven;
// never watch the whole document continuously.
run();
window.addEventListener('load', run, { once: true });
document.addEventListener('click', (event) => {
  const details = document.querySelector('.ccAccount details[open]');
  if (details) {
    const menu = details.querySelector('.ccAccountMenu');
    const summary = details.querySelector('summary');
    if (menu && summary && !menu.contains(event.target) && !summary.contains(event.target)) details.open = false;
  }
  if (event.target.closest('[data-open-coaching-calendar], [data-ops-week], [data-calendar-step], .ccAthlete, .ccAccount summary')) {
    window.setTimeout(run, 0);
  }
}, true);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const details = document.querySelector('.ccAccount details[open]');
  if (details) details.open = false;
});
window.addEventListener('form:calendar-synced', run);
