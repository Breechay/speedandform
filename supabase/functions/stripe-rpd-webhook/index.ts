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

function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

function sourceFrom(metadata: Stripe.Metadata | null | undefined) {
  const out: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const value = metadata?.[key]?.trim()
    if (value) out[key] = value.slice(0, 240)
  }
  return out
}

async function ensurePaidEntitlement(session: Stripe.Checkout.Session) {
  if (session.metadata?.product_slug !== PRODUCT_SLUG || session.payment_status !== 'paid') return
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
    source: sourceFrom(session.metadata),
    purchased_at: new Date(session.created * 1000).toISOString(),
  }, { onConflict: 'stripe_checkout_session_id' })
  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const signature = req.headers.get('Stripe-Signature')
  if (!signature) return new Response('Missing Stripe signature', { status: 400 })

  const stripe = new Stripe(requireEnv('STRIPE_API_KEY'), { httpClient: Stripe.createFetchHttpClient() })
  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      requireEnv('STRIPE_WEBHOOK_SIGNING_SECRET'),
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
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id
      if (chargeId) {
        const charge = await stripe.charges.retrieve(chargeId)
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
        if (paymentIntentId) {
          const { error } = await adminClient()
            .from('product_entitlements')
            .update({ status: 'disputed' })
            .eq('stripe_payment_intent_id', paymentIntentId)
          if (error) throw error
        }
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
