import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { adminClient, ensurePaidEntitlement, requireEnv, stripeClient } from '../_shared/rpd-commerce.ts'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const signature = req.headers.get('Stripe-Signature')
  if (!signature) return new Response('Missing Stripe signature', { status: 400 })

  const body = await req.text()
  const stripe = stripeClient()
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
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.product_slug === 'race-pace-durability' && session.payment_status === 'paid') {
        await ensurePaidEntitlement(session)
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id
      if (paymentIntentId) {
        const admin = adminClient()
        const { error } = await admin
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
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id
        if (paymentIntentId) {
          const admin = adminClient()
          const { error } = await admin
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
