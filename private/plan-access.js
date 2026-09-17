// One permission decision for RPD data, navigation and purchase controls.
// Storage is a discovery hint only. The database/checkout service grants access.
const URL = 'https://pbgsjjegycacodiltbhn.supabase.co';
const KEY = 'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';
const AUTH_KEY = 'form-private-auth';
const FULL_MODES = new Set(['coach', 'assigned', 'purchased']);
const needsPlan = Boolean(document.getElementById('viewport') || document.getElementById('edition'));
let pending = null;
let client = null;
let generation = 0;
let watched = false;
let accountId = storedIdentity();

function storedIdentity() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')?.user?.id || null; }
  catch { return null; }
}
export function hasAccountHint() {
  try { return Boolean(localStorage.getItem(AUTH_KEY)); } catch { return false; }
}
function clearPurchaseHint() {
  try {
    localStorage.removeItem('rpd_purchase_session');
    localStorage.removeItem('rpd_purchase_verified_at');
  } catch {}
}
function changed(nextId) {
  accountId = nextId;
  generation += 1;
  pending = null;
  clearPurchaseHint();
  document.dispatchEvent(new CustomEvent('form:account-changed'));
}
window.addEventListener('storage', (event) => {
  if (event.key !== AUTH_KEY && event.key !== null) return;
  const nextId = storedIdentity();
  if (nextId !== accountId || !event.newValue) changed(nextId);
});

export class AccessError extends Error {
  constructor(code = 'unavailable') { super(code); this.code = code; }
}
async function bounded(promise) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new AccessError('unavailable')), 12000);
    })]);
  } finally { clearTimeout(timer); }
}
async function post(path, body, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${URL}${path}`, {
      method: 'POST', cache: 'no-store', signal: controller.signal,
      headers: { apikey: KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new AccessError(response.status === 401 ? 'sign-in' : 'unavailable');
    if (!data) throw new AccessError();
    return data;
  } catch (error) {
    throw error instanceof AccessError ? error : new AccessError();
  } finally { clearTimeout(timer); }
}
async function authClient() {
  if (!client) client = (await bounded(import('/private/supabase-client.js'))).supabase;
  if (!watched) {
    watched = true;
    // Never await a Supabase call inside its auth callback (SDK lock).
    client.auth.onAuthStateChange((event, session) => {
      const nextId = session?.user?.id || null;
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && nextId !== accountId)) changed(nextId);
    });
  }
  return client;
}
function purchaseSession() {
  const query = new URLSearchParams(location.search).get('purchase_session');
  let stored = '';
  try { stored = localStorage.getItem('rpd_purchase_session') || ''; } catch {}
  const value = query || stored;
  return /^cs_[A-Za-z0-9_]+$/.test(value) ? value : '';
}
function validatePlan(plan, entitled) {
  if (!plan || plan.plan?.slug !== 'race-pace-durability' || !Array.isArray(plan.weeks) || plan.weeks.length !== 15) throw new AccessError();
  if (entitled && !plan.weeks.find(w => w.week_number === 5)?.sessions?.length) throw new AccessError();
  if (!entitled && plan.weeks.some(w => w.week_number > 4 && w.sessions?.length)) throw new AccessError();
  return plan;
}
async function resolve(includePlan) {
  const started = generation;
  let result;
  if (hasAccountHint()) {
    const sb = await authClient();
    const { data: { session }, error } = await bounded(sb.auth.getSession());
    if (error || !session) throw new AccessError('sign-in');
    const verified = await bounded(sb.auth.getUser(session.access_token));
    if (verified.error || !verified.data?.user || verified.data.user.id !== session.user.id) throw new AccessError('sign-in');
    const claim = await bounded(sb.rpc('claim_access'));
    if (claim.error) throw new AccessError();
    // An old checkout token from someone else never substitutes for this account.
    const data = await post('/rest/v1/rpc/rpd_account_access', { p_include_plan: includePlan }, session.access_token);
    if (data.schema !== 1 || data.user_id !== session.user.id || !['preview', ...FULL_MODES].includes(data.mode)
      || data.entitled !== FULL_MODES.has(data.mode)) throw new AccessError();
    result = { ...data, signedIn: true };
  } else {
    const sessionId = purchaseSession();
    if (sessionId) {
      const data = await post('/functions/v1/rpd-entitlement', { action: includePlan ? 'plan' : 'verify', session_id: sessionId });
      if (!data.ok || (!includePlan && data.status !== 'paid')) throw new AccessError();
      result = { entitled: true, mode: 'purchased', signedIn: false, workspace: 'account', plan: data.plan || null };
      try { localStorage.setItem('rpd_purchase_session', sessionId); } catch {}
      const clean = new URL(location.href);
      if (clean.searchParams.has('purchase_session')) {
        clean.searchParams.delete('purchase_session');
        history.replaceState(history.state, '', clean.pathname + clean.search + clean.hash);
      }
    } else result = { entitled: false, mode: 'preview', signedIn: false, workspace: 'account', plan: null };
  }
  if (includePlan) {
    if (!result.entitled) result.plan = await post('/rest/v1/rpc/public_plan_preview', { p_slug: 'race-pace-durability' });
    result.plan = validatePlan(result.plan, result.entitled);
  }
  if (started !== generation) throw new AccessError('account-changed');
  return result;
}
export function resolvePlanAccess() {
  if (!pending) pending = resolve(needsPlan);
  return pending;
}
export function accountDestination(access, spanish = false) {
  if (access.workspace === 'coach') return { href: '/coach/labs/', label: 'Console' };
  if (access.workspace === 'athlete') return { href: '/athlete/', label: spanish ? 'Mi entrenamiento' : 'My training' };
  if (access.entitled && access.mode === 'purchased') return { href: '/plans/race-pace-durability/', label: spanish ? 'Mi plan' : 'My plan' };
  return { href: '/athlete/', label: access.signedIn ? (spanish ? 'Cuenta' : 'Account') : (spanish ? 'Iniciar sesión' : 'Sign in') };
}

// Recheck permissions after a material absence. A failure is not a purchase
// decision; the UI clears protected content and shows a recovery route.
let hiddenAt = null;
let checking = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (!pending || !hiddenAt || Date.now() - hiddenAt < 60000 || checking) return;
  checking = true;
  const previous = pending;
  Promise.all([previous, resolve(false)]).then(([old, fresh]) => {
    if (old.entitled !== fresh.entitled || old.user_id !== fresh.user_id || old.mode !== fresh.mode) changed(fresh.user_id || null);
  }).catch(() => document.dispatchEvent(new CustomEvent('form:access-unavailable'))).finally(() => { checking = false; });
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
