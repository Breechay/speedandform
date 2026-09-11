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

function run() {
  polishCalendarControls();
  const ready = polishRailUtilities();
  if (!ready && retries < 20 && !retryTimer) {
    retries += 1;
    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      run();
    }, 150);
  }
}

// The Console renders asynchronously, but this layer must never watch the entire
// document continuously. A bounded startup retry plus interaction-driven refresh
// is enough for the controls that are created later.
run();
window.addEventListener('load', run, { once: true });
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-open-coaching-calendar], [data-ops-week], [data-calendar-step]')) {
    window.setTimeout(run, 0);
  }
}, true);
window.addEventListener('form:calendar-synced', run);
