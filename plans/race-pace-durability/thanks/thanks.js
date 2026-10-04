const ENTITLEMENT_ENDPOINT = 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/rpd-entitlement';
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id') || '';
const validSession = /^cs_[A-Za-z0-9_]+$/.test(sessionId);

const card = document.getElementById('purchaseStatus');
const label = document.getElementById('statusLabel');
const title = document.getElementById('statusTitle');
const copy = document.getElementById('statusCopy');
const actions = document.getElementById('statusActions');
const openPlan = document.getElementById('openPlan');
const retry = document.getElementById('retryPurchase');
const purchaseTitle = document.getElementById('purchaseTitle');
const purchaseLead = document.getElementById('purchaseLead');
const next = document.getElementById('purchaseNext');
let running = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function checking(attempt = 0) {
  card.dataset.state = 'checking';
  label.textContent = 'Checking purchase';
  title.textContent = attempt > 1 ? 'Still confirming your access.' : 'Confirming your access.';
  copy.textContent = attempt > 1
    ? 'The purchase record is still being confirmed. Keep this page open for a moment.'
    : 'This usually takes a few seconds. Keep this page open.';
  actions.hidden = true;
  next.hidden = true;
}

function failed(message) {
  card.dataset.state = 'failed';
  label.textContent = 'Access not confirmed';
  title.textContent = 'Let’s find your purchase.';
  copy.textContent = message || 'We couldn’t confirm access yet. Check again, or restore access with the email used at checkout. There is no need to make another payment.';
  actions.hidden = !validSession;
  openPlan.hidden = true;
  retry.hidden = !validSession;
  next.hidden = true;
}

async function requestVerification() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(ENTITLEMENT_ENDPOINT, {
      method: 'POST', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', session_id: sessionId })
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally { clearTimeout(timer); }
}

function remember(purchase) {
  // Storage remembers the purchase; server verification alone grants access.
  // A browser that blocks storage must still receive its verified plan link.
  try {
    localStorage.setItem('rpd_purchase_session', sessionId);
    localStorage.setItem('rpd_purchase_id', purchase.purchase_id || '');
    localStorage.setItem('rpd_purchase_verified_at', new Date().toISOString());
    return true;
  } catch { return false; }
}

async function verify() {
  if (running) return;
  if (!validSession) {
    failed('Open the return link from Stripe, or restore access with the email used at checkout.');
    return;
  }
  running = true;
  retry.disabled = true;
  const delays = [0, 900, 1400, 2200, 3200, 4500];
  try {
    for (let attempt = 0; attempt < delays.length; attempt += 1) {
      if (delays[attempt]) await wait(delays[attempt]);
      checking(attempt);
      try {
        const { response, data } = await requestVerification();
        if (response.ok && data.ok && data.status === 'paid') {
          const stored = remember(data);
          card.dataset.state = 'verified';
          label.textContent = 'Your plan is ready';
          title.textContent = 'All 15 weeks are unlocked.';
          purchaseTitle.textContent = 'Your full plan.';
          purchaseLead.textContent = 'One payment. Every week through race day.';
          copy.textContent = stored
            ? 'Open the plan and use the arrows to browse each week. The light and dark print editions are beneath the training.'
            : 'Open the plan below. This browser cannot remember the purchase, so keep this private link or restore access with your checkout email when you return.';
          openPlan.href = '/plans/race-pace-durability/?purchase_session=' + encodeURIComponent(sessionId);
          openPlan.hidden = false;
          retry.hidden = true;
          actions.hidden = false;
          next.hidden = false;
          // Keep the verified access link above. Analytics starts only after the
          // return URL no longer exposes the anonymous checkout bearer.
          const clean = new URL(location.href);
          clean.searchParams.delete('session_id');
          clean.searchParams.delete('purchase_session');
          history.replaceState(history.state, '', clean.pathname + clean.search + clean.hash);
          if (data.purchase_id) window.rpdTrack?.purchase?.(data.purchase_id);
          return;
        }
        // Only the webhook-confirmed paid state can expose the full plan action.
        if (response.status === 401 || response.status === 403) break;
      } catch { /* Brief delivery delays and network failures may be retried. */ }
    }
    failed();
  } finally {
    running = false;
    retry.disabled = false;
  }
}

retry.addEventListener('click', verify);
checking();
verify();
