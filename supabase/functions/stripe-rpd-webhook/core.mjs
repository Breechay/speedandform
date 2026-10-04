import { purchaseAccessEmail, EMAIL_VERSION } from './email.mjs';

export const PRODUCT_SLUG = 'race-pace-durability';
const asId = value => typeof value === 'string' ? value : value?.id || null;
const revoked = new Set(['refunded','disputed','revoked']);

function acquisitionSource(session) {
  const out = {};
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','ref']) {
    const value = session.metadata?.[key]?.trim();
    if (value) out[key] = value.slice(0,240);
  }
  const map = {s:'utm_source',m:'utm_medium',c:'utm_campaign',x:'utm_content'};
  if (session.client_reference_id?.startsWith('rpd__')) {
    for (const part of session.client_reference_id.split('__').slice(1)) {
      const split = part.indexOf('_');
      const key = map[part.slice(0,split)];
      const value = part.slice(split+1).trim();
      if (split > 0 && key && value) out[key] = value.slice(0,240);
    }
  }
  return out;
}

export function paidPurchase(session) {
  if (!(session.metadata?.product_slug === PRODUCT_SLUG || session.metadata?.offer === 'race_pace_durability') || session.payment_status !== 'paid') return null;
  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error('Checkout session has no purchaser email');
  return {product_slug:PRODUCT_SLUG,product_version:session.metadata?.product_version || 'rpd_v1',
    stripe_checkout_session_id:session.id,stripe_payment_intent_id:asId(session.payment_intent),
    stripe_customer_id:asId(session.customer),purchaser_email:email.trim().toLowerCase(),
    amount_total:session.amount_total || 0,currency:(session.currency || 'usd').toLowerCase(),
    source:acquisitionSource(session),purchased_at:new Date(session.created*1000).toISOString()};
}

// One provider attempt per delivery. Stripe's automatic retry schedule is the
// durable retry driver; the outbox owns deduplication, leases and the retry cap.
// Returning retry=true never changes or removes an already-recorded entitlement.
export async function processVerifiedEvent(event, {store, apiKey, emailEnabled=false, fetcher=fetch, timeoutMs=8000}) {
  if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    const paymentIntentId = asId(event.data.object.payment_intent);
    if (paymentIntentId) await store.revoke(paymentIntentId,event.type === 'charge.refunded' ? 'refunded' : 'disputed');
    return {received:true};
  }
  if (!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) return {received:true};
  const purchase = paidPurchase(event.data.object);
  if (!purchase) return {received:true};

  const status = await store.record(purchase);
  if (revoked.has(status)) return {received:true,email:'cancelled'};
  // Explicit default-off activation: lack of an email credential must not turn
  // the established payment webhook into a stream of failed deliveries.
  if (!emailEnabled) return {received:true,email:'disabled'};
  // Purchase is committed before email construction, enqueue or provider work.
  const queued = await store.enqueue(purchase.stripe_checkout_session_id,EMAIL_VERSION,purchaseAccessEmail({sessionId:purchase.stripe_checkout_session_id,email:purchase.purchaser_email}));
  if (['sent','failed','manual_review','cancelled'].includes(queued)) return {received:true,email:queued};
  if (!apiKey?.trim()) return {received:true,retry:true,email:'configuration_missing'};
  const claim = await store.claim(purchase.stripe_checkout_session_id);
  if (claim.state !== 'claimed') return {received:true,retry:['busy','pending'].includes(claim.state),email:claim.state};

  let result;
  try {
    const response = await fetcher('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':claim.idempotency_key},
      body:JSON.stringify(claim.payload),signal:AbortSignal.timeout(timeoutMs)
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && typeof body.id === 'string' && body.id.length > 0) {
      result = {kind:'sent',providerId:body.id,errorCode:null};
    } else {
      // Never persist/log provider response bodies: they may echo buyer details.
      const transient = response.status === 429 || response.status >= 500 || response.status === 409 && body.name === 'concurrent_idempotent_requests';
      result = {kind:transient ? 'retry' : 'failed',providerId:null,errorCode:`provider_${response.status}`};
      if (response.ok) result = {kind:'retry',providerId:null,errorCode:'provider_invalid_response'};
    }
  } catch {
    result = {kind:'retry',providerId:null,errorCode:'provider_network'};
  }
  // An ambiguous result keeps the same frozen payload/key. A failed write also
  // retries through the lease; it must never cause a new logical email.
  const state = await store.finish(purchase.stripe_checkout_session_id,claim.lease_token,result);
  return {received:true,retry:['pending','busy'].includes(state),email:state};
}

export function supabaseStore(admin) {
  async function rpc(name,args) {
    const {data,error} = await admin.rpc(name,args);
    if (error) throw new Error(`Purchase store failed: ${name}`);
    return data;
  }
  return {
    record:purchase => rpc('rpd_record_paid_purchase',{p_purchase:purchase}),
    enqueue:(sessionId,version,payload) => rpc('rpd_enqueue_purchase_email',{p_session_id:sessionId,p_email_version:version,p_payload:payload}),
    claim:sessionId => rpc('rpd_claim_purchase_email',{p_session_id:sessionId}),
    finish:(sessionId,token,result) => rpc('rpd_finish_purchase_email',{p_session_id:sessionId,p_lease_token:token,p_outcome:result.kind,p_provider_id:result.providerId,p_error_code:result.errorCode}),
    revoke:(paymentIntentId,status) => rpc('rpd_revoke_paid_purchase',{p_payment_intent_id:paymentIntentId,p_status:status})
  };
}
