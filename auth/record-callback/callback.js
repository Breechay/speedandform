import { authErrorMessage, finishAuthCallback, setPassword } from '/private/auth.js';
import { supabase } from '/private/supabase-client.js';

const title = document.getElementById('callbackTitle');
const status = document.getElementById('callbackStatus');
const retry = document.getElementById('callbackRetry');

try {
  const url = new URL(window.location.href);
  const recovery = url.searchParams.get('mode') === 'recovery' || url.searchParams.get('type') === 'recovery';
  const returnTo = url.searchParams.get('return_to') || '';
  const calendarReturn = returnTo.includes('calendar_return=1');
  let calendarTokens = null;

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

  if (calendarReturn) {
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
    status.textContent = 'Signed in. Taking you there…';
    window.location.replace(destination);
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
  title.textContent = 'That link did not open.';
  status.textContent = authErrorMessage(error);
  status.className = 'status-message error';
  retry.hidden = false;
}
