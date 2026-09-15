const ENTITLEMENT_ENDPOINT = 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/rpd-entitlement';
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id') || '';

const card = document.getElementById('purchaseStatus');
const label = document.getElementById('statusLabel');
const title = document.getElementById('statusTitle');
const copy = document.getElementById('statusCopy');
const actions = document.getElementById('statusActions');
const openPlan = document.getElementById('openPlan');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function checking(attempt = 0) {
  card.dataset.state = 'checking';
  label.textContent = 'Payment received';
  title.textContent = attempt > 1 ? 'Still unlocking your plan.' : 'Unlocking your plan.';
  copy.textContent = attempt > 1
    ? 'Stripe has sent you back to FORM. We are waiting for the purchase record to finish syncing.'
    : 'This normally takes only a few seconds. Keep this page open.';
  actions.hidden = true;
}

function failed(message) {
  card.dataset.state = 'failed';
  label.textContent = 'We need one more step';
  title.textContent = 'Your plan is not unlocked yet.';
  copy.textContent = message || 'We could not confirm the purchase automatically. Use Restore Access with the same email you used at checkout, or email brice@speedandform.com if you need help.';
  actions.hidden = false;
  openPlan.hidden = true;
}

async function requestVerification() {
  const response = await fetch(ENTITLEMENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify', session_id: sessionId })
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function verify() {
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    failed('This page is missing the Stripe checkout reference. Open the return link from Stripe or use Restore Access.');
    return;
  }

  const delays = [0, 900, 1400, 2200, 3200, 4500];
  let lastError = null;

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt]) await wait(delays[attempt]);
    checking(attempt);

    try {
      const { response, data } = await requestVerification();
      if (response.ok && data.ok && data.status === 'paid') {
        localStorage.setItem('rpd_purchase_session', sessionId);
        localStorage.setItem('rpd_purchase_id', data.purchase_id || '');
        localStorage.setItem('rpd_purchase_verified_at', new Date().toISOString());

        card.dataset.state = 'verified';
        label.textContent = 'Ready';
        title.textContent = 'Your full 15 weeks are unlocked.';
        copy.textContent = 'Open the plan. This browser will now show Weeks 5–15 with the first four weeks.';
        openPlan.href = '/plans/race-pace-durability/?purchase_session=' + encodeURIComponent(sessionId);
        openPlan.hidden = false;
        actions.hidden = false;

        window.rpdTrack?.purchase?.(sessionId);
        return;
      }
      lastError = new Error(data.error || 'Purchase is still syncing.');
    } catch (error) {
      lastError = error;
    }
  }

  console.error('RPD purchase verify', lastError);
  failed();
}

checking();
verify();
