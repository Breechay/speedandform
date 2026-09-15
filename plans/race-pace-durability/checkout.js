const CHECKOUT_ENDPOINT = 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/rpd-checkout';

function source() {
  if (typeof window.rpdSource === 'function') return window.rpdSource();
  const params = new URLSearchParams(window.location.search);
  const out = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'].forEach((key) => {
    const value = params.get(key);
    if (value) out[key] = value.slice(0, 240);
  });
  return out;
}

async function beginCheckout(button) {
  if (!button || button.dataset.checkoutBusy === 'true') return;
  button.dataset.checkoutBusy = 'true';
  const original = button.innerHTML;
  const error = document.getElementById('checkoutError');
  if (error) error.textContent = '';
  button.textContent = 'Opening secure checkout…';

  try {
    window.rpdTrack?.checkout?.();
    const response = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: source() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.checkout_url) throw new Error(data.error || 'Checkout is unavailable.');
    window.location.assign(data.checkout_url);
  } catch (err) {
    console.error('RPD checkout', err);
    button.innerHTML = original;
    button.dataset.checkoutBusy = 'false';
    if (error) error.textContent = 'Checkout could not open. Please try again in a moment.';
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-rpd-checkout]');
  if (!button) return;
  event.preventDefault();
  beginCheckout(button);
});
