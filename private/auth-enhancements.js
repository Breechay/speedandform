import {
  authErrorMessage,
  bindAccountSecurity,
  enabledProviders,
  linkedIdentities,
  safeReturnTo,
  signOut
} from '/private/auth.js';
import { callbackUrl, supabase } from '/private/supabase-client.js';

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
        <button type="button" id="linkApple" hidden>Connect Apple</button>
        <button type="button" data-auth-signout>Sign out</button>
      </div>
    </details>
  </div>`;
}

async function wireLabsAccount() {
  const rail = document.querySelector('.ccRail');
  if (!rail || rail.querySelector('[data-auth-account]')) return;
  rail.insertAdjacentHTML('beforeend', labsAccountMarkup());
  const account = rail.querySelector('[data-auth-account]');

  const providers = await enabledProviders();
  const identities = await linkedIdentities();
  const google = account.querySelector('#linkGoogle');
  if (google) {
    google.hidden = providers.google !== true || identities.includes('google');
    google.addEventListener('click', async () => {
      google.disabled = true;
      try { await linkGoogle(); }
      catch (error) { window.alert(authErrorMessage(error)); google.disabled = false; }
    });
  }

  account.querySelector('[data-auth-signout]')?.addEventListener('click', signOut);
  await bindAccountSecurity();
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
