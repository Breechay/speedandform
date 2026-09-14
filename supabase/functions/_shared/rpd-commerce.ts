import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1'

export const PRODUCT_SLUG = 'race-pace-durability'
export const PRODUCT_VERSION = 'rpd_v1'

export function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export function stripeClient() {
  return new Stripe(requireEnv('STRIPE_API_KEY'), {
    httpClient: Stripe.createFetchHttpClient(),
  })
}

export function adminClient() {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export function allowedOrigin(req: Request): string {
  const origin = req.headers.get('origin') || ''
  const configured = Deno.env.get('RPD_SITE_URL')?.trim() || 'https://speedandform.com'
  if (!origin) return configured
  if (origin === configured) return origin
  if (/^https:\/\/[a-z0-9-]+--zingy-speculoos-16852a\.netlify\.app$/i.test(origin)) return origin
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin
  return configured
}

export function corsHeaders(req: Request): HeadersInit {
  return {
    'Access-Control-Allow-Origin': allowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

function sourceFromMetadata(metadata: Stripe.Metadata | null | undefined) {
  const m = metadata || {}
  const out: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const value = m[key]?.trim()
    if (value) out[key] = value.slice(0, 240)
  }
  return out
}

export async function ensurePaidEntitlement(session: Stripe.Checkout.Session) {
  if (session.metadata?.product_slug !== PRODUCT_SLUG) throw new Error('Wrong product')
  if (session.payment_status !== 'paid') throw new Error('Payment is not complete')

  const email = session.customer_details?.email || session.customer_email
  if (!email) throw new Error('Checkout session has no purchaser email')

  const admin = adminClient()
  const { data: existing, error: existingError } = await admin
    .from('product_entitlements')
    .select('id,status,auth_user_id,band_low_seconds,band_high_seconds,band_source')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()
  if (existingError) throw existingError

  const preservedStatus = existing && ['refunded', 'disputed', 'revoked'].includes(existing.status)
    ? existing.status
    : 'paid'

  const row = {
    product_slug: PRODUCT_SLUG,
    product_version: session.metadata?.product_version || PRODUCT_VERSION,
    status: preservedStatus,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: asId(session.payment_intent as string | { id: string } | null),
    stripe_customer_id: asId(session.customer as string | { id: string } | null),
    purchaser_email: email.trim().toLowerCase(),
    amount_total: session.amount_total || 0,
    currency: (session.currency || 'usd').toLowerCase(),
    source: sourceFromMetadata(session.metadata),
    purchased_at: new Date(session.created * 1000).toISOString(),
  }

  const { data, error } = await admin
    .from('product_entitlements')
    .upsert(row, { onConflict: 'stripe_checkout_session_id' })
    .select('id,status,purchaser_email,auth_user_id,band_low_seconds,band_high_seconds,band_source')
    .single()
  if (error) throw error
  return data
}

export function safeMetadata(input: unknown): Record<string, string> {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const out: Record<string, string> = {
    product_slug: PRODUCT_SLUG,
    product_version: PRODUCT_VERSION,
  }
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const raw = source[key]
    if (typeof raw === 'string' && raw.trim()) out[key] = raw.trim().slice(0, 240)
  }
  return out
}
