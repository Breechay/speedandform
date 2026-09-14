import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1'
import { adminClient, corsHeaders, ensurePaidEntitlement, json, PRODUCT_SLUG, requireEnv, stripeClient } from '../_shared/rpd-commerce.ts'

function asPositiveInt(value: unknown): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

function asDistance(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 && n < 30 ? n : null
}

async function verifiedPurchase(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error('Invalid checkout session')
  const stripe = stripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.metadata?.product_slug !== PRODUCT_SLUG) throw new Error('Wrong product')
  if (session.payment_status !== 'paid') throw new Error('Payment is not complete')
  const entitlement = await ensurePaidEntitlement(session)
  if (entitlement.status !== 'paid') throw new Error(`Entitlement is ${entitlement.status}`)
  return { session, entitlement }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || 'verify')
    const sessionId = String(body?.session_id || '')
    const { entitlement } = await verifiedPurchase(sessionId)
    const admin = adminClient()

    if (action === 'verify') {
      return json(req, {
        ok: true,
        status: entitlement.status,
        purchase_id: entitlement.id,
        email: entitlement.purchaser_email,
        attached: Boolean(entitlement.auth_user_id),
        band: entitlement.band_low_seconds == null ? null : {
          low_seconds: entitlement.band_low_seconds,
          high_seconds: entitlement.band_high_seconds,
          source: entitlement.band_source,
        },
      })
    }

    if (action === 'save_band') {
      const low = asPositiveInt(body?.band_low_seconds)
      const high = asPositiveInt(body?.band_high_seconds)
      const bandSource = body?.band_source === 'goal' || body?.band_source === 'proposed'
        ? body.band_source
        : null
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
      const authHeader = req.headers.get('Authorization') || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
      if (!token) return json(req, { error: 'Sign in first' }, 401)

      const authClient = createClient(
        requireEnv('SUPABASE_URL'),
        Deno.env.get('SUPABASE_ANON_KEY') || requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
        {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        },
      )
      const { data: userData, error: userError } = await authClient.auth.getUser(token)
      if (userError || !userData.user) return json(req, { error: 'Invalid FORM session' }, 401)

      const user = userData.user
      if (!user.email || user.email.trim().toLowerCase() !== entitlement.purchaser_email) {
        return json(req, { error: 'Use the email that completed the purchase' }, 403)
      }
      if (entitlement.auth_user_id && entitlement.auth_user_id !== user.id) {
        return json(req, { error: 'This purchase is already attached to another account' }, 409)
      }

      // Reuse the existing FORM identity/profile doorway. No athlete membership is created here.
      const { error: claimError } = await authClient.rpc('claim_access')
      if (claimError) throw claimError

      const { error: attachError } = await admin
        .from('product_entitlements')
        .update({ auth_user_id: user.id })
        .eq('id', entitlement.id)
      if (attachError) throw attachError

      return json(req, { ok: true, attached: true, user_id: user.id })
    }

    return json(req, { error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('rpd-entitlement', error)
    return json(req, { error: 'Purchase verification failed.' }, 403)
  }
})
