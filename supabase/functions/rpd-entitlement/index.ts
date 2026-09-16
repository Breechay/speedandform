import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1'

const PRODUCT_SLUG = 'race-pace-durability'

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

async function entitlementForSession(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error('Invalid checkout session')
  const admin = adminClient()
  const { data, error } = await admin
    .from('product_entitlements')
    .select('id,status,purchaser_email,auth_user_id,band_low_seconds,band_high_seconds,band_source,stripe_checkout_session_id,purchased_at')
    .eq('product_slug', PRODUCT_SLUG)
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Purchase not received yet')
  return data
}

async function authenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) throw new Error('Sign in first')
  const admin = adminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Error('Invalid FORM session')
  return data.user
}

async function restoreEntitlement(req: Request) {
  const user = await authenticatedUser(req)
  const email = user.email?.trim().toLowerCase()
  if (!email) throw new Error('Account has no email')
  const admin = adminClient()

  const { error: attachError } = await admin
    .from('product_entitlements')
    .update({ auth_user_id: user.id })
    .eq('product_slug', PRODUCT_SLUG)
    .eq('status', 'paid')
    .eq('purchaser_email', email)
    .is('auth_user_id', null)
  if (attachError) throw attachError

  const { data, error } = await admin
    .from('product_entitlements')
    .select('id,status,purchaser_email,auth_user_id,band_low_seconds,band_high_seconds,band_source,stripe_checkout_session_id,purchased_at')
    .eq('product_slug', PRODUCT_SLUG)
    .eq('status', 'paid')
    .eq('auth_user_id', user.id)
    .order('purchased_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data || null
}

function publicEntitlement(entitlement: any) {
  return {
    ok: true,
    status: entitlement.status,
    purchase_id: entitlement.id,
    session_id: entitlement.stripe_checkout_session_id,
    attached: Boolean(entitlement.auth_user_id),
    band: entitlement.band_low_seconds == null ? null : {
      low_seconds: entitlement.band_low_seconds,
      high_seconds: entitlement.band_high_seconds,
      source: entitlement.band_source,
    },
  }
}

function asPositiveInt(value: unknown): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

function asDistance(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 && n < 30 ? n : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || 'verify')

    if (action === 'health') {
      const admin = adminClient()
      const { error } = await admin.from('product_entitlements').select('id').limit(1)
      if (error) throw error
      return json(req, { ok: true, entitlement_store: true })
    }

    if (action === 'restore') {
      const entitlement = await restoreEntitlement(req)
      if (!entitlement) return json(req, { error: 'No Race Pace Durability purchase is attached to this email.' }, 404)
      return json(req, publicEntitlement(entitlement))
    }

    const sessionId = String(body?.session_id || '')
    const entitlement = await entitlementForSession(sessionId)
    if (entitlement.status !== 'paid') return json(req, { error: `Access is ${entitlement.status}.` }, 403)
    const admin = adminClient()

    if (action === 'verify') {
      return json(req, publicEntitlement(entitlement))
    }

    if (action === 'plan') {
      const { data, error } = await admin.rpc('public_plan', { p_slug: PRODUCT_SLUG })
      if (error) throw error
      if (!data) throw new Error('Published plan unavailable')
      return json(req, { ok: true, plan: data })
    }

    if (action === 'save_band') {
      const low = asPositiveInt(body?.band_low_seconds)
      const high = asPositiveInt(body?.band_high_seconds)
      const bandSource = body?.band_source === 'goal' || body?.band_source === 'proposed' ? body.band_source : null
      const recentRaceSeconds = asPositiveInt(body?.recent_race_seconds)
      const recentRaceDistance = asDistance(body?.recent_race_distance_miles)
      const goalHalfSeconds = body?.goal_half_seconds == null ? null : asPositiveInt(body.goal_half_seconds)
      const currentEquivalentSeconds = asPositiveInt(body?.current_equivalent_seconds)

      if (!low || !high || high !== low + 15 || low < 240 || high > 900 || !bandSource) {
        return json(req, { error: 'Invalid race-pace band' }, 400)
      }
      if (!recentRaceSeconds || !recentRaceDistance || !currentEquivalentSeconds) {
        return json(req, { error: 'Incomplete fitness anchor' }, 400)
      }

      const { data, error } = await admin
        .from('product_entitlements')
        .update({
          band_low_seconds: low,
          band_high_seconds: high,
          band_source: bandSource,
          recent_race_seconds: recentRaceSeconds,
          recent_race_distance_miles: recentRaceDistance,
          goal_half_seconds: goalHalfSeconds,
          current_equivalent_seconds: currentEquivalentSeconds,
        })
        .eq('id', entitlement.id)
        .select('id,band_low_seconds,band_high_seconds,band_source')
        .single()
      if (error) throw error
      return json(req, { ok: true, purchase_id: data.id, band: data })
    }

    if (action === 'attach') {
      const user = await authenticatedUser(req)
      const email = user.email?.trim().toLowerCase()
      if (!email || email !== entitlement.purchaser_email) {
        return json(req, { error: 'Use the email that completed the purchase' }, 403)
      }
      if (entitlement.auth_user_id && entitlement.auth_user_id !== user.id) {
        return json(req, { error: 'This purchase is already attached to another account' }, 409)
      }

      const { error: attachError } = await admin
        .from('product_entitlements')
        .update({ auth_user_id: user.id })
        .eq('id', entitlement.id)
      if (attachError) throw attachError

      return json(req, { ok: true, attached: true, user_id: user.id })
    }

    return json(req, { error: 'Unknown action' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'Purchase not received yet') return json(req, { error: 'Purchase is still being confirmed. Try again in a few seconds.' }, 425)
    if (message === 'Invalid checkout session') return json(req, { error: 'Purchase verification failed.' }, 403)
    if (message === 'Sign in first' || message === 'Invalid FORM session') return json(req, { error: message }, 401)
    console.error('rpd-entitlement', error)
    return json(req, { error: 'Purchase verification failed.' }, 403)
  }
})
