const ENTITLEMENT_ENDPOINT = 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/rpd-entitlement';
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id') || '';

const card = document.getElementById('purchaseStatus');
const label = document.getElementById('statusLabel');
const title = document.getElementById('statusTitle');
const copy = document.getElementById('statusCopy');
const actions = document.getElementById('statusActions');
const openPlan = document.getElementById('openPlan');

function failed(message) {
  card.dataset.state = 'failed';
  label.textContent = 'Verification needed';
  title.textContent = 'We could not verify the purchase yet.';
  copy.textContent = message || 'If Stripe just completed the payment, wait a few seconds and reload this page. If it persists, email brice@speedandform.com from the address used at checkout.';
  actions.hidden = false;
  openPlan.hidden = true;
}

async function verify() {
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    failed('This page is missing a valid Stripe checkout reference. Use the return link from Stripe or contact purchase support.');
    return;
  }

  try {
    const response = await fetch(ENTITLEMENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', session_id: sessionId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok || data.status !== 'paid') throw new Error(data.error || 'Payment is not verified.');

    localStorage.setItem('rpd_purchase_session', sessionId);
    localStorage.setItem('rpd_purchase_id', data.purchase_id || '');
    localStorage.setItem('rpd_purchase_verified_at', new Date().toISOString());

    card.dataset.state = 'verified';
    label.textContent = 'Payment verified';
    title.textContent = 'Full-plan access is ready.';
    copy.textContent = 'This browser now recognizes your Race Pace Durability purchase. Open the plan and Weeks 5–15 will be available.';
    openPlan.href = '/plans/race-pace-durability/?purchase_session=' + encodeURIComponent(sessionId);
    actions.hidden = false;

    window.rpdTrack?.purchase?.(sessionId);
  } catch (error) {
    console.error('RPD purchase verify', error);
    failed();
  }
}

verify();
