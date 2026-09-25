import { authErrorMessage, finishAuthCallback, getSession, setPassword } from '/private/auth.js';
import { supabase } from '/private/supabase-client.js';
import { acceptImplicitReturn } from './session-handoff.js?v=2';

const title = document.getElementById('callbackTitle');
const status = document.getElementById('callbackStatus');
const retry = document.getElementById('callbackRetry');
const storeWrap = document.getElementById('callbackStoreWrap');

function rpdReturnDestination(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith('/plans/race-pace-durability/access/')) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function isAppHandoff() {
  try {
    return window.sessionStorage.getItem('form-app-signin-handoff') === '1';
  } catch {
    return false;
  }
}

function clearAppHandoff() {
  try { window.sessionStorage.removeItem('form-app-signin-handoff'); } catch {}
}

function appDeepLink(session) {
  const access = session?.access_token;
  const refresh = session?.refresh_token;
  if (!access || !refresh) return null;
  const fragment = new URLSearchParams({
    access_token: access,
    refresh_token: refresh
  });
  return `form://coaching-auth#${fragment.toString()}`;
}

try {
  const url = new URL(window.location.href);
  const returnedFragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const recovery = url.searchParams.get('mode') === 'recovery'
    || url.searchParams.get('type') === 'recovery' || returnedFragment.get('type') === 'recovery';
  const returnTo = url.searchParams.get('return_to') || '';
  const rpdReturn = rpdReturnDestination(returnTo);
  const calendarReturn = returnTo.includes('calendar_return=1');
  const appHandoff = isAppHandoff();
  let calendarTokens = null;

  // Admin-generated email links return access/refresh tokens, not a PKCE code.
  // Restore and verify that session BEFORE finishAuthCallback reads it or claims
  // membership. Previously the valid first tap was incorrectly called expired.
  await acceptImplicitReturn(supabase.auth, url.toString(), (cleanURL) => {
    window.history.replaceState({}, '', cleanURL);
  });

  // Calendar consent is still a normal Supabase Google OAuth flow, but this is
  // the one moment the provider refresh token exists. Capture it in memory and
  // hand it straight to the server before the ordinary callback finishes.
  if (calendarReturn && url.searchParams.get('code')) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(url.searchParams.get('code'));
    if (error) throw error;
    calendarTokens = {
      accessToken: data?.session?.provider_token || null,
      refreshToken: data?.session?.provider_refresh_token || null
    };
    const clean = new URL(window.location.href);
    clean.searchParams.delete('code');
    window.history.replaceState({}, '', clean);
  }

  const destination = await finishAuthCallback();

  if (appHandoff && !recovery && !calendarReturn) {
    const session = await getSession();
    const deepLink = appDeepLink(session);
    if (!deepLink) throw new Error('FORM could not complete the app handoff. Request a new link.');

    title.textContent = 'Signed in.';
    status.textContent = 'Tap Open FORM to continue in the app.';
    retry.textContent = 'Open FORM →';
    retry.href = deepLink;
    retry.hidden = false;
    storeWrap.hidden = false;
    retry.addEventListener('click', clearAppHandoff, { once: true });

    // A real tap gives iOS the user gesture it needs to open a custom scheme.
    // Keep this verified handoff on screen; never re-use the one-time email URL.
  } else if (calendarReturn) {
    if (!calendarTokens?.refreshToken || !calendarTokens?.accessToken) {
      throw new Error('Google did not return offline Calendar access. Open Account → Calendar and approve access again.');
    }
    status.textContent = 'Connecting Google Calendar…';
    const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
      body: {
        action: 'connect',
        providerRefreshToken: calendarTokens.refreshToken,
        providerAccessToken: calendarTokens.accessToken
      }
    });
    calendarTokens = null;
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    status.textContent = 'Calendar connected. Taking you back to the Console…';
    window.location.replace('/coach/labs/?calendar=connected');
  } else if (!recovery) {
    status.textContent = rpdReturn ? 'Purchase email verified. Restoring your plan…' : 'Signed in. Taking you there…';
    window.location.replace(rpdReturn || destination);
  } else {
    title.textContent = 'Set your password.';
    status.textContent = 'Choose a password for this FORM account.';
    retry.hidden = true;
    const card = title.closest('.auth-card') || title.parentElement;
    card.insertAdjacentHTML('beforeend', `<form id="recoveryPasswordForm" class="form-grid auth-form" style="margin-top:20px">
      <label class="field-label">New password
        <input class="field-input" type="password" name="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters">
      </label>
      <label class="field-label">Confirm password
        <input class="field-input" type="password" name="confirm" autocomplete="new-password" minlength="8" required placeholder="Type it again">
      </label>
      <button class="button primary" type="submit">Save password <span class="icon-arrow">→</span></button>
    </form>`);
    const form = document.getElementById('recoveryPasswordForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = form.elements.password.value;
      const confirm = form.elements.confirm.value;
      if (password !== confirm) {
        status.textContent = 'Those passwords do not match.';
        status.className = 'status-message error';
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.className = '';
      status.textContent = 'Saving your password…';
      try {
        await setPassword(password);
        status.textContent = 'Saved. Taking you back to FORM…';
        window.location.replace(destination);
      } catch (error) {
        status.textContent = authErrorMessage(error);
        status.className = 'status-message error';
        button.disabled = false;
      }
    });
    form.elements.password.focus();
  }
} catch (error) {
  clearAppHandoff();
  title.textContent = 'That link did not open.';
  status.textContent = authErrorMessage(error);
  status.className = 'status-message error';
  retry.textContent = 'Request a new link';
  retry.href = '/athlete/';
  retry.hidden = false;
}
