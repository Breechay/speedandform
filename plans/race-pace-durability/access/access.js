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
  } catch (_) {}
}

async function restore() {
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;
  if (error || !session) return false;

  say('Checking this email for your purchase…');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token
    },
    body: JSON.stringify({ action: 'restore' })
  });
  const purchase = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error('Purchase lookup unavailable');
  }
  if (!purchase.ok || purchase.status !== 'paid') {
    say('No paid Race Pace Durability purchase was found for this signed-in email. Try the email used at checkout.', 'error');
    return false;
  }

  remember(purchase);
  say('Purchase restored. Opening the full plan…', 'success');
  setTimeout(() => location.replace('/plans/race-pace-durability/?restored=1'), 450);
  return true;
}

async function sendLink(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) throw new Error('Enter the email used at checkout.');

  const callback = new URL('/auth/record-callback/', location.origin);
  callback.searchParams.set('return_to', '/plans/race-pace-durability/access/');
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: callback.toString(), shouldCreateUser: true }
  });
  if (error) throw error;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  say('Sending a sign-in link…');
  try {
    await sendLink(email.value);
    say('Check your email. Open the FORM link on this device and your purchase will restore automatically.', 'success');
    button.textContent = 'Link sent';
  } catch (error) {
    const message = String(error?.message || error || 'The link could not be sent.');
    say(/rate limit/i.test(message) ? 'Too many links were requested. Wait a moment, then try again.' : message, 'error');
    button.disabled = false;
  }
});

restore().catch(() => {
  say('We couldn’t check this purchase right now. Nothing was charged or changed. Try again in a moment.', 'error');
  button.disabled = false;
});
