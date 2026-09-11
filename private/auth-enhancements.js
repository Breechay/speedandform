import {
  authErrorMessage,
  bindAccountSecurity,
  enabledProviders,
  linkedIdentities,
  safeReturnTo,
  signOut
} from '/private/auth.js';
import { callbackUrl, supabase } from '/private/supabase-client.js';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';
const wired = new WeakSet();
let scheduled = false;

function doorwayDestination() {
  return window.location.pathname.startsWith('/coach/') ? '/coach/labs/' : '/athlete/';
}

async function signInWithGoogle(destination) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl(safeReturnTo(destination)) }
  });
  if (error) throw error;
}

async function linkGoogle() {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: callbackUrl(window.location.pathname) }
  });
  if (error) throw error;
}

async function calendarStatus() {
  const { data, error } = await supabase.rpc('google_calendar_status');
  if (error) {
    if (['42883', 'PGRST202'].includes(error.code)) return null;
    throw error;
  }
  return data || null;
}

async function connectCalendar() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: CALENDAR_SCOPE,
      redirectTo: callbackUrl('/coach/labs/?calendar_return=1'),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true'
      }
    }
  });
  if (error) throw error;
}

async function syncCalendarNow() {
  const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
    body: { action: 'sync-now' }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

async function disconnectCalendar() {
  const { error } = await supabase.rpc('disconnect_google_calendar');
  if (error) throw error;
}

function statusNode(card) {
  return card?.querySelector('#authStatus');
}

function say(card, text, kind = '') {
  const node = statusNode(card);
  if (!node) return;
  node.textContent = text;
  node.className = `status-message${kind ? ` ${kind}` : ''}`;
}

async function wireDoorway() {
  const card = document.querySelector('.auth-card.doorway');
  if (!card || wired.has(card)) return;
  wired.add(card);

  const providers = await enabledProviders();
  if (providers.google !== true) return;

  const alts = card.querySelector('.auth-alts');
  if (!alts || card.querySelector('#googleSignIn')) return;
  const button = document.createElement('button');
  button.className = 'button auth-secondary auth-google';
  button.id = 'googleSignIn';
  button.type = 'button';
  button.innerHTML = '<span class="auth-google-mark" aria-hidden="true">G</span> Continue with Google';
  alts.prepend(button);
  button.addEventListener('click', async () => {
    button.disabled = true;
    say(card, 'Opening Google.');
    try {
      await signInWithGoogle(doorwayDestination());
    } catch (error) {
      say(card, authErrorMessage(error), 'error');
      button.disabled = false;
    }
  });
}

async function wireAthleteAccount() {
  const actions = document.querySelector('.account-actions');
  if (!actions || wired.has(actions)) return;
  wired.add(actions);

  const providers = await enabledProviders();
  const identities = await linkedIdentities();
  if (providers.google === true && !identities.includes('google') && !actions.querySelector('#linkGoogle')) {
    const button = document.createElement('button');
    button.className = 'button';
    button.type = 'button';
    button.id = 'linkGoogle';
    button.textContent = 'Connect Google';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await linkGoogle(); }
      catch (error) { window.alert(authErrorMessage(error)); button.disabled = false; }
    });
    const changeEmail = actions.querySelector('#changeEmail');
    actions.insertBefore(button, changeEmail || actions.lastElementChild);
  }

  const password = actions.querySelector('#setPassword');
  if (password) password.textContent = 'Set or change password';
}

function labsAccountMarkup() {
  return `<div class="ccAccount" data-auth-account>
    <details>
      <summary>Account</summary>
      <div class="ccAccountMenu">
        <button type="button" id="setPassword">Set or change password</button>
        <button type="button" id="linkGoogle" hidden>Connect Google</button>
        <button type="button" id="calendarConnect" hidden>Connect Google Calendar</button>
        <button type="button" id="calendarSync" hidden>Sync Calendar now</button>
        <button type="button" id="calendarDisconnect" hidden>Disconnect Calendar</button>
        <button type="button" id="linkApple" hidden>Connect Apple</button>
        <button type="button" data-auth-signout>Sign out</button>
        <p class="ccAccountState" id="calendarState" hidden></p>
      </div>
    </details>
  </div>`;
}

async function refreshCalendarControls(account, googleLinked) {
  const connect = account.querySelector('#calendarConnect');
  const sync = account.querySelector('#calendarSync');
  const disconnect = account.querySelector('#calendarDisconnect');
  const state = account.querySelector('#calendarState');
  const status = await calendarStatus().catch(() => null);
  if (!status?.authorized) return;

  state.hidden = false;
  if (!googleLinked) {
    connect.hidden = true;
    sync.hidden = true;
    disconnect.hidden = true;
    state.textContent = 'Connect Google first, then Calendar can stay in sync.';
    return;
  }

  connect.hidden = Boolean(status.connected);
  sync.hidden = !status.connected;
  disconnect.hidden = !status.connected;

  if (!status.connected) {
    state.textContent = 'Calendar is not connected.';
  } else if (!status.automatic_ready) {
    state.textContent = 'Calendar connected · automatic refresh is waiting on the server credential.';
  } else if (status.last_error) {
    state.textContent = `Calendar needs attention · ${status.last_error}`;
  } else if (status.last_synced_at) {
    const when = new Date(status.last_synced_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    state.textContent = `Calendar connected · last synced ${when}`;
  } else {
    state.textContent = 'Calendar connected · automatic refresh ready.';
  }
}

async function wireLabsAccount() {
  const rail = document.querySelector('.ccRail');
  if (!rail || rail.querySelector('[data-auth-account]')) return;
  rail.insertAdjacentHTML('beforeend', labsAccountMarkup());
  const account = rail.querySelector('[data-auth-account]');

  const providers = await enabledProviders();
  const identities = await linkedIdentities();
  const googleLinked = identities.includes('google');
  const google = account.querySelector('#linkGoogle');
  if (google) {
    google.hidden = providers.google !== true || googleLinked;
    google.addEventListener('click', async () => {
      google.disabled = true;
      try { await linkGoogle(); }
      catch (error) { window.alert(authErrorMessage(error)); google.disabled = false; }
    });
  }

  account.querySelector('#calendarConnect')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try { await connectCalendar(); }
    catch (error) { window.alert(authErrorMessage(error)); button.disabled = false; }
  });
  account.querySelector('#calendarSync')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await syncCalendarNow();
      await refreshCalendarControls(account, googleLinked);
      window.dispatchEvent(new CustomEvent('form:calendar-synced'));
    } catch (error) {
      window.alert(authErrorMessage(error));
    } finally { button.disabled = false; }
  });
  account.querySelector('#calendarDisconnect')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (!window.confirm('Disconnect Google Calendar from the Coach Console?')) return;
    button.disabled = true;
    try {
      await disconnectCalendar();
      await refreshCalendarControls(account, googleLinked);
    } catch (error) {
      window.alert(authErrorMessage(error));
      button.disabled = false;
    }
  });

  account.querySelector('[data-auth-signout]')?.addEventListener('click', signOut);
  await bindAccountSecurity();
  await refreshCalendarControls(account, googleLinked);
}

function run() {
  scheduled = false;
  wireDoorway().catch(() => {});
  wireAthleteAccount().catch(() => {});
  wireLabsAccount().catch(() => {});
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(run);
}

new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
schedule();
