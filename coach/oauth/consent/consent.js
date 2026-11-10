import { supabase } from '/private/supabase-client.js';
import { getAccessContext, sendMagicLink, signInWithPassword } from '/private/auth.js';

const params = new URL(window.location.href).searchParams;
const authorizationId = params.get('authorization_id');
const status = document.getElementById('status');
const signIn = document.getElementById('signIn');
const consent = document.getElementById('consent');
const buttonApprove = document.getElementById('approve');
const buttonDeny = document.getElementById('deny');

function say(message, failed = false) {
  status.textContent = message;
  status.style.color = failed ? '#a32519' : '#575757';
}

function currentReturn() {
  return `${window.location.pathname}?authorization_id=${encodeURIComponent(authorizationId)}`;
}

async function begin() {
  if (!authorizationId || authorizationId.length > 512) {
    say('This connection request has no valid authorization ID.', true);
    return;
  }
  const access = await getAccessContext();
  if (!access.session) {
    signIn.hidden = false;
    say('Sign in with the coach account that owns these athletes.');
    return;
  }
  if (!access.coachMemberships.length) {
    signIn.hidden = false;
    say('This account is not a FORM coach. Sign in with your existing coach identity.', true);
    return;
  }

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !data) {
    say('This connection request expired or could not be verified. Start it again from the agent.', true);
    return;
  }
  const client = data.client || data.authorization?.client || {};
  document.getElementById('applicationName').textContent = client.name || data.client_name || 'External coaching tool';
  document.getElementById('scopes').textContent = data.scope || data.authorization?.scope || 'Identity and coach-authorized training operations';
  signIn.hidden = true;
  consent.hidden = false;
  say('Review the request before connecting.');
}

async function decide(approved) {
  buttonApprove.disabled = true;
  buttonDeny.disabled = true;
  say(approved ? 'Connecting your coach account.' : 'Declining access.');
  const result = approved
    ? await supabase.auth.oauth.approveAuthorization(authorizationId)
    : await supabase.auth.oauth.denyAuthorization(authorizationId);
  const url = result.data?.redirect_url;
  if (result.error || !url) {
    say('The authorization server did not complete this choice. Start the connection again.', true);
    buttonApprove.disabled = false;
    buttonDeny.disabled = false;
    return;
  }
  window.location.assign(url);
}

document.getElementById('signInForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    if (form.elements.password.value) {
      await signInWithPassword(form.elements.email.value, form.elements.password.value);
      await begin();
    } else {
      await sendMagicLink(form.elements.email.value, currentReturn());
      say('Check your email. This link returns to the same consent request.');
    }
  } catch {
    say('Sign-in did not complete. Check the coach account or request a new link.', true);
  } finally {
    submit.disabled = false;
  }
});
document.getElementById('emailLink').addEventListener('click', async () => {
  const email = document.getElementById('signInForm').elements.email.value;
  try { await sendMagicLink(email, currentReturn()); say('Check your email for the coach sign-in link.'); }
  catch { say('The sign-in link could not be sent. Check the email and retry.', true); }
});
buttonApprove.addEventListener('click', () => decide(true));
buttonDeny.addEventListener('click', () => decide(false));
begin().catch(() => say('FORM could not validate the connection. Reload or begin again.', true));
