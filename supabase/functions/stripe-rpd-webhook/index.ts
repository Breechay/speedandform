import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1'

const PRODUCT_SLUG = 'race-pace-durability'
const PRODUCT_VERSION = 'rpd_v1'
const cryptoProvider = Stripe.createSubtleCryptoProvider()

function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function adminClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function webhookSecret(): Promise<string> {
  const env = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')?.trim()
  if (env) return env
  const { data, error } = await adminClient().rpc('rpd_webhook_signing_secret')
  if (error) throw error
  const secret = typeof data === 'string' ? data.trim() : ''
  if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SIGNING_SECRET')
  return secret
}

function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

function sourceFromMetadata(metadata: Stripe.Metadata | null | undefined) {
  const out: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const value = metadata?.[key]?.trim()
    if (value) out[key] = value.slice(0, 240)
  }
  return out
}

function sourceFromClientReferenceId(reference: string | null | undefined) {
  const out: Record<string, string> = {}
  if (!reference || !reference.startsWith('rpd__')) return out

  const keyMap: Record<string, string> = {
    s: 'utm_source',
    m: 'utm_medium',
    c: 'utm_campaign',
    x: 'utm_content',
  }

  for (const part of reference.split('__').slice(1)) {
    const split = part.indexOf('_')
    if (split <= 0) continue
    const key = keyMap[part.slice(0, split)]
    const value = part.slice(split + 1).trim()
    if (key && value) out[key] = value.slice(0, 240)
  }
  return out
}

function sourceFrom(session: Stripe.Checkout.Session) {
  return {
    ...sourceFromMetadata(session.metadata),
    ...sourceFromClientReferenceId(session.client_reference_id),
  }
}

function isRpdSession(session: Stripe.Checkout.Session) {
  return session.metadata?.product_slug === PRODUCT_SLUG || session.metadata?.offer === 'race_pace_durability'
}

async function ensurePaidEntitlement(session: Stripe.Checkout.Session) {
  if (!isRpdSession(session) || session.payment_status !== 'paid') return
  const email = session.customer_details?.email || session.customer_email
  if (!email) throw new Error('Checkout session has no purchaser email')

  const admin = adminClient()
  const { data: existing, error: readError } = await admin
    .from('product_entitlements')
    .select('status')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()
  if (readError) throw readError

  const status = existing && ['refunded', 'disputed', 'revoked'].includes(existing.status)
    ? existing.status
    : 'paid'

  const { error } = await admin.from('product_entitlements').upsert({
    product_slug: PRODUCT_SLUG,
    product_version: session.metadata?.product_version || PRODUCT_VERSION,
    status,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: asId(session.payment_intent as string | { id: string } | null),
    stripe_customer_id: asId(session.customer as string | { id: string } | null),
    purchaser_email: email.trim().toLowerCase(),
    amount_total: session.amount_total || 0,
    currency: (session.currency || 'usd').toLowerCase(),
    source: sourceFrom(session),
    purchased_at: new Date(session.created * 1000).toISOString(),
  }, { onConflict: 'stripe_checkout_session_id' })
  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const signature = req.headers.get('Stripe-Signature')
  if (!signature) return new Response('Missing Stripe signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event

  try {
    const stripe = new Stripe('sk_test_signature_verification_only', { httpClient: Stripe.createFetchHttpClient() })
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      await webhookSecret(),
      undefined,
      cryptoProvider,
    )
  } catch (error) {
    console.error('stripe-rpd-webhook signature', error)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await ensurePaidEntitlement(event.data.object as Stripe.Checkout.Session)
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
      if (paymentIntentId) {
        const { error } = await adminClient()
          .from('product_entitlements')
          .update({ status: 'refunded', refunded_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntentId)
        if (error) throw error
      }
    }

    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute
      const raw = dispute as unknown as { payment_intent?: string | { id: string } | null }
      const paymentIntentId = typeof raw.payment_intent === 'string' ? raw.payment_intent : raw.payment_intent?.id
      if (paymentIntentId) {
        const { error } = await adminClient()
          .from('product_entitlements')
          .update({ status: 'disputed' })
          .eq('stripe_payment_intent_id', paymentIntentId)
        if (error) throw error
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('stripe-rpd-webhook handler', event.id, error)
    return new Response('Webhook handler failed', { status: 500 })
  }
})
