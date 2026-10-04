import { supabase } from '/private/supabase-client.js';

const endpoint = 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/rpd-entitlement';
const form = document.getElementById('accessForm');
const email = document.getElementById('accessEmail');
const button = document.getElementById('accessButton');
const status = document.getElementById('accessStatus');

function say(text, state = '') {
  status.textContent = text;
  status.dataset.state = state;
}

function remember(data) {
  try {
    if (data.session_id) localStorage.setItem('rpd_purchase_session', data.session_id);
    if (data.purchase_id) localStorage.setItem('rpd_purchase_id', data.purchase_id);
    localStorage.setItem('rpd_purchase_verified_at', new Date().toISOString());
  } catch {}
}

async function bounded(promise) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('request-timeout')), 12000);
    })]);
  } finally { clearTimeout(timer); }
}

async function restore() {
  const { data, error } = await bounded(supabase.auth.getSession());
  const session = data?.session;
  if (error || !session) return false;
  say('Checking this signed-in email for your purchase…');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let response;
  let purchase;
  try {
    response = await fetch(endpoint, {
      method: 'POST', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ action: 'restore' })
    });
    purchase = await response.json().catch(() => ({}));
  } finally { clearTimeout(timer); }
  if (response.status === 404 || (response.ok && (!purchase.ok || purchase.status !== 'paid'))) {
    say('No purchase was found for this signed-in email. Enter the email used at checkout above.', 'error');
    return false;
  }
  if (!response.ok) throw new Error('purchase-unavailable');
  remember(purchase);
  say('Access restored. Opening the full plan…', 'success');
  // The verified purchase reference also works when browser storage is blocked.
  const destination = new URL('/plans/race-pace-durability/', location.origin);
  if (purchase.session_id) destination.searchParams.set('purchase_session', purchase.session_id);
  setTimeout(() => location.replace(destination.pathname + destination.search), 450);
  return true;
}

async function sendLink(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) throw new Error('invalid-email');
  const callback = new URL('/auth/record-callback/', location.origin);
  callback.searchParams.set('return_to', '/plans/race-pace-durability/access/');
  const { error } = await bounded(supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: callback.toString(), shouldCreateUser: true }
  }));
  if (error) throw error;
}

function sendError(error) {
  const message = String(error?.message || error || '');
  if (/rate limit|too many|after \d+ seconds/i.test(message)) return 'A link was requested recently. Check your inbox or wait a minute before trying again.';
  if (/invalid-email|email.*invalid|invalid.*email/i.test(message)) return 'Enter the email used at checkout.';
  return 'We couldn’t confirm the link was sent. Check your inbox before trying again. If you need help, email Brice.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  button.disabled = true;
  button.textContent = 'Sending…';
  say('Sending a secure sign-in link…');
  try {
    await sendLink(email.value);
    say('Check your email and open the FORM sign-in link on this device. If it is missing, check your spam folder.', 'success');
    button.textContent = 'Link sent';
    setTimeout(() => { button.disabled = false; button.textContent = 'Send another link'; }, 60000);
  } catch (error) {
    say(sendError(error), 'error');
    button.disabled = false;
    button.textContent = 'Send sign-in link';
  }
});

restore().catch(() => {
  say('We couldn’t check this purchase right now. Use your checkout email above, or try this page again in a moment.', 'error');
});
