// The public preview and the paid plan use two different doors.
//
// `public_plan_preview` is intentionally callable with the publishable key and
// contains full prescription only for Weeks 1–4. Weeks 5–15 are placeholders.
// A verified Stripe purchase can request the complete published plan through the
// entitlement Edge Function. The plan tables themselves remain behind RLS.
const URL = 'https://pbgsjjegycacodiltbhn.supabase.co';
const KEY = 'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';
const ENTITLEMENT_ENDPOINT = `${URL}/functions/v1/rpd-entitlement`;

function purchaseSession() {
  const query = new URLSearchParams(window.location.search).get('purchase_session');
  if (query && /^cs_[A-Za-z0-9_]+$/.test(query)) return query;
  try {
    const stored = window.localStorage.getItem('rpd_purchase_session') || '';
    return /^cs_[A-Za-z0-9_]+$/.test(stored) ? stored : '';
  } catch (_) {
    return '';
  }
}

async function paidPlan(sessionId) {
  const response = await fetch(ENTITLEMENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'plan', session_id: sessionId })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok || !data.plan) throw new Error(data.error || 'paid plan unavailable');
  return data.plan;
}

async function previewPlan(slug) {
  const response = await fetch(`${URL}/rest/v1/rpc/public_plan_preview`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_slug: slug })
  });
  if (!response.ok) throw new Error(`the plan could not be read (${response.status})`);
  const plan = await response.json();
  if (!plan) throw new Error('no published plan at that address');
  return plan;
}

export async function publishedPlan(slug) {
  const sessionId = purchaseSession();
  if (sessionId) {
    try {
      return await paidPlan(sessionId);
    } catch (error) {
      console.warn('RPD paid plan unavailable; rendering the public preview', error);
    }
  }
  return previewPlan(slug);
}
