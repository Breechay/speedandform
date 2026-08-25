import { callbackUrl, supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase-client.js';

const ALLOWED_DESTINATIONS = ['/athlete/', '/coach/'];

export function safeReturnTo(value) {
  if (!value) return '/athlete/';
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return '/athlete/';
    const allowed = ALLOWED_DESTINATIONS.some((path) => url.pathname.startsWith(path));
    return allowed ? `${url.pathname}${url.search}` : '/athlete/';
  } catch {
    return '/athlete/';
  }
}

let providerCache = null;

// Supabase publishes which providers are actually enabled. Asking first means
// we never offer a button that would navigate the browser to a raw JSON error
// page, and Apple appears on its own the moment the provider is configured.
export async function enabledProviders() {
  if (providerCache) return providerCache;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY }
    });
    if (!response.ok) throw new Error('settings unavailable');
    const settings = await response.json();
    providerCache = settings.external || {};
  } catch {
    providerCache = {};
  }
  return providerCache;
}

export async function sendMagicLink(email, returnTo = '/athlete/') {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) throw new Error('Enter the email Brice invited.');
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: callbackUrl(safeReturnTo(returnTo)),
      shouldCreateUser: true
    }
  });
  if (error) throw error;
}

export async function signInWithApple(returnTo = '/athlete/') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: callbackUrl(safeReturnTo(returnTo)) }
  });
  if (error) throw error;
  return data;
}

// Password sign-in. The magic link is the way in the first time; after that a
// password is faster and works when email is slow. Brice's coach access is keyed
// to the invited address, so signing in with a different one (which is what Apple
// hands over) lands on an account with no membership.
export async function signInWithPassword(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
  if (error) throw error;
}

// Only for someone already signed in. Setting a password does not change which
// email the account is, so membership is unaffected.
export async function setPassword(password) {
  if (String(password || '').length < 8) throw new Error('Use at least 8 characters.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function sendPasswordReset(email, returnTo = '/athlete/') {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error('Enter your email address.');
  const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: callbackUrl(safeReturnTo(returnTo))
  });
  if (error) throw error;
}

// Attaching Apple to the account that is already signed in. Without this, signing
// in with an Apple ID on a different address creates a second, membership-less
// account rather than reaching the record.
export async function linkApple() {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'apple',
    options: { redirectTo: callbackUrl(window.location.pathname) }
  });
  if (error) throw error;
}

export async function linkedIdentities() {
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error) return [];
  return (data?.identities || []).map((identity) => identity.provider);
}

export async function finishAuthCallback() {
  const url = new URL(window.location.href);
  const authError = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (authError) throw new Error(authError);
  const tokenHash = url.searchParams.get('token_hash');
  const otpType = url.searchParams.get('type');
  if (tokenHash) {
    const allowedTypes = new Set(['email', 'magiclink', 'signup', 'invite', 'recovery', 'email_change']);
    if (!allowedTypes.has(otpType)) throw new Error('That sign-in link is not valid.');
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (error) throw error;
  }
  const code = url.searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) throw new Error('That sign-in link has expired. Request a new one.');
  await claimAccess();
  return safeReturnTo(url.searchParams.get('return_to'));
}

export async function claimAccess() {
  const { error } = await supabase.rpc('claim_access');
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getAccessContext() {
  const session = await getSession();
  if (!session) return { session: null, memberships: [], athleteMemberships: [], coachMemberships: [] };
  await claimAccess();
  const { data, error } = await supabase
    .from('athlete_memberships')
    .select('athlete_id, role, status, athletes(id, slug, display_name, first_name, home_surface, target_event, goal_label, program_name, account_label)')
    .eq('status', 'active');
  if (error) throw error;
  const memberships = data || [];
  return {
    session,
    memberships,
    athleteMemberships: memberships.filter((item) => item.role === 'athlete'),
    coachMemberships: memberships.filter((item) => item.role === 'coach')
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.assign('/athlete/');
}

export function authErrorMessage(error) {
  const message = String(error?.message || error || 'Sign in could not be completed.');
  if (/provider.*not.*enabled/i.test(message)) return 'Apple sign-in is being connected. Use the email link for now.';
  if (/rate limit/i.test(message)) return 'Too many links were requested. Wait a moment, then try again.';
  if (/expired|invalid.*code|otp/i.test(message)) return 'That link has expired. Request a new sign-in link.';
  return message;
}

// One doorway, rendered from one place. Coach and athlete had their own copies,
// and when Apple went live the copy that replaced the email form with an Apple
// button locked Brice out: his coach access is keyed to the invited address, and
// Apple signs him in as a different one. Password first, link second, Apple third.
export async function renderDoorway(container, { destination, label }) {
  const apple = (await enabledProviders()).apple === true;
  container.innerHTML = `<section class="auth-page"><div class="auth-card doorway">
    <h1 class="auth-mark">FORM<span class="sr-only"> ${label}</span></h1>
    <form id="passwordForm" class="form-grid">
      <label class="field-label">Email<input class="field-input" type="email" name="email" autocomplete="email" required placeholder="you@example.com"></label>
      <label class="field-label">Password<input class="field-input" type="password" name="password" autocomplete="current-password" placeholder="Your password"></label>
      <button class="button primary" type="submit">Sign in <span class="icon-arrow">&rarr;</span></button>
    </form>
    <div class="auth-alts">
      <button class="link-button" id="magicInstead" type="button">Email me a link instead</button>
      <button class="link-button" id="forgotPassword" type="button">Set or reset my password</button>
      ${apple ? '<button class="link-button" id="appleSignIn" type="button">Sign in with Apple</button>' : ''}
    </div>
    <p class="status-message" id="authStatus" role="status"></p>
  </div></section>`;

  const status = () => document.getElementById('authStatus');
  const say = (text, kind = '') => {
    const node = status(); node.textContent = text; node.className = `status-message${kind ? ` ${kind}` : ''}`;
  };
  const emailValue = () => document.getElementById('passwordForm').elements.email.value;

  document.getElementById('passwordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const password = form.elements.password.value;
    // An empty password means they want the link, not a failed sign-in.
    if (!password) {
      button.disabled = true; say('Sending a link.');
      try { await sendMagicLink(emailValue(), destination); say('Check your email. The link signs you in.', 'success'); }
      catch (error) { say(authErrorMessage(error), 'error'); button.disabled = false; }
      return;
    }
    button.disabled = true; say('Signing in.');
    try { await signInWithPassword(emailValue(), password); window.location.reload(); }
    catch (error) { say(authErrorMessage(error), 'error'); button.disabled = false; }
  });

  document.getElementById('magicInstead').addEventListener('click', async () => {
    say('Sending a link.');
    try { await sendMagicLink(emailValue(), destination); say('Check your email. The link signs you in.', 'success'); }
    catch (error) { say(authErrorMessage(error), 'error'); }
  });

  document.getElementById('forgotPassword').addEventListener('click', async () => {
    say('Sending a reset link.');
    try { await sendPasswordReset(emailValue(), destination); say('Check your email. The link lets you set a password.', 'success'); }
    catch (error) { say(authErrorMessage(error), 'error'); }
  });

  document.getElementById('appleSignIn')?.addEventListener('click', async () => {
    say('Opening Apple.');
    try { await signInWithApple(destination); }
    catch (error) { say(authErrorMessage(error), 'error'); }
  });
}

// Password and Apple linking, wired from one place for both pages. The dialog is
// built here rather than sitting in two HTML files, because the doorway already
// showed what happens when the same thing exists twice and only one copy changes.
export async function bindAccountSecurity() {
  const setButton = document.getElementById('setPassword');
  const linkButton = document.getElementById('linkApple');
  if (!setButton) return;

  if (linkButton) {
    const [providers, linked] = await Promise.all([enabledProviders(), linkedIdentities()]);
    linkButton.hidden = providers.apple !== true || linked.includes('apple');
    linkButton.addEventListener('click', async () => {
      try { await linkApple(); } catch (error) { window.alert(authErrorMessage(error)); }
    });
  }

  setButton.addEventListener('click', () => {
    const existing = document.getElementById('passwordDialog');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', `<dialog class="dialog" id="passwordDialog">
      <form class="dialog-inner" id="passwordSetForm">
        <div class="dialog-head">
          <h2>Set a password</h2>
          <button class="dialog-close" type="button" data-close-dialog aria-label="Close">&times;</button>
        </div>
        <label class="field-label">New password
          <input class="field-input" type="password" name="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters">
        </label>
        <p class="status-message" id="passwordSetStatus" role="status"></p>
        <div class="dialog-actions">
          <button class="button" type="button" data-close-dialog>Cancel</button>
          <button class="button primary" type="submit">Save <span class="icon-arrow">&rarr;</span></button>
        </div>
      </form>
    </dialog>`);
    const dialog = document.getElementById('passwordDialog');
    const form = document.getElementById('passwordSetForm');
    dialog.querySelectorAll('[data-close-dialog]').forEach((button) =>
      button.addEventListener('click', () => dialog.close()));
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = document.getElementById('passwordSetStatus');
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true; status.className = 'status-message'; status.textContent = 'Saving.';
      try {
        await setPassword(form.elements.password.value);
        status.className = 'status-message success';
        status.textContent = 'Saved. You can sign in with it from now on.';
      } catch (error) {
        status.className = 'status-message error';
        status.textContent = authErrorMessage(error);
        button.disabled = false;
      }
    });
    dialog.showModal();
  });
}
