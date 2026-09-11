import { callbackUrl, supabase } from '/private/supabase-client.js';
import { authErrorMessage, safeReturnTo } from '/private/auth.js';

const wired = new WeakSet();

function destination() {
  return window.location.pathname.startsWith('/coach/') ? '/coach/labs/' : '/athlete/';
}

function wireReset(button) {
  if (!button || wired.has(button)) return;
  wired.add(button);
  // Capture before the legacy listener. The old reset redirect correctly creates
  // a recovery session but never tells the callback to stop and ask for a new
  // password, so it simply signs the person in and carries on.
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = document.getElementById('passwordForm');
    const status = document.getElementById('authStatus');
    const email = String(form?.elements?.email?.value || '').trim().toLowerCase();
    const say = (text, kind = '') => {
      if (!status) return;
      status.textContent = text;
      status.className = `status-message${kind ? ` ${kind}` : ''}`;
    };
    if (!email.includes('@')) { say('Enter your email address.', 'error'); return; }
    const redirect = new URL(callbackUrl(safeReturnTo(destination())));
    redirect.searchParams.set('mode', 'recovery');
    say('Sending a reset link.');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect.toString() });
      if (error) throw error;
      say('Check your email. The link opens a new-password screen.', 'success');
    } catch (error) {
      say(authErrorMessage(error), 'error');
    }
  }, { capture: true });
}

function scan() { wireReset(document.getElementById('forgotPassword')); }
new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
scan();
