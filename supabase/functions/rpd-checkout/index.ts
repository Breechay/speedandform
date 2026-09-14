import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { corsHeaders, json, PRODUCT_SLUG, PRODUCT_VERSION, requireEnv, safeMetadata, stripeClient } from '../_shared/rpd-commerce.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const stripe = stripeClient()
    const priceId = requireEnv('STRIPE_RPD_PRICE_ID')
    const siteUrl = (Deno.env.get('RPD_SITE_URL')?.trim() || 'https://speedandform.com').replace(/\/$/, '')
    const payload = await req.json().catch(() => ({}))
    const metadata = safeMetadata(payload?.source)

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/race-pace-durability/band/?mode=welcome&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/race-pace-durability/#offer`,
      metadata,
      payment_intent_data: { metadata },
      allow_promotion_codes: false,
    }

    if (Deno.env.get('STRIPE_TAX_ENABLED') === 'true') {
      params.automatic_tax = { enabled: true }
    }

    const session = await stripe.checkout.sessions.create(params)
    if (!session.url) throw new Error('Stripe did not return a checkout URL')

    return json(req, {
      checkout_url: session.url,
      session_id: session.id,
      product_slug: PRODUCT_SLUG,
      product_version: PRODUCT_VERSION,
    })
  } catch (error) {
    console.error('rpd-checkout', error)
    return json(req, { error: 'Checkout is not available yet.' }, 503)
  }
})
