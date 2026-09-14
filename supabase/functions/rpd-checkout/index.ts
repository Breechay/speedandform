import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const PRODUCT_SLUG = 'race-pace-durability'
const PRODUCT_VERSION = 'rpd_v1'

function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function allowedOrigin(req: Request): string {
  const origin = req.headers.get('origin') || ''
  const site = Deno.env.get('RPD_SITE_URL')?.trim() || 'https://speedandform.com'
  if (!origin || origin === site) return origin || site
  if (/^https:\/\/[a-z0-9-]+--zingy-speculoos-16852a\.netlify\.app$/i.test(origin)) return origin
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin
  return site
}

function cors(req: Request): HeadersInit {
  return {
    'Access-Control-Allow-Origin': allowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), 'Content-Type': 'application/json' },
  })
}

function metadataFrom(input: unknown): Record<string, string> {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const out: Record<string, string> = { product_slug: PRODUCT_SLUG, product_version: PRODUCT_VERSION }
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const raw = source[key]
    if (typeof raw === 'string' && raw.trim()) out[key] = raw.trim().slice(0, 240)
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const stripe = new Stripe(requireEnv('STRIPE_API_KEY'), { httpClient: Stripe.createFetchHttpClient() })
    const priceId = requireEnv('STRIPE_RPD_PRICE_ID')
    const siteUrl = (Deno.env.get('RPD_SITE_URL')?.trim() || 'https://speedandform.com').replace(/\/$/, '')
    const payload = await req.json().catch(() => ({}))
    const metadata = metadataFrom(payload?.source)

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/race-pace-durability/band/?mode=welcome&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/race-pace-durability/#offer`,
      metadata,
      payment_intent_data: { metadata },
      allow_promotion_codes: false,
    }
    if (Deno.env.get('STRIPE_TAX_ENABLED') === 'true') params.automatic_tax = { enabled: true }

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
