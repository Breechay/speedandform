import Stripe from 'https://esm.sh/stripe@22.6.0?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1'
import { processVerifiedEvent, supabaseStore } from './core.mjs'

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
    console.error('stripe-rpd-webhook signature rejected')
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    const result = await processVerifiedEvent(event, {
      store: supabaseStore(adminClient()),
      apiKey: Deno.env.get('RPD_RESEND_API_KEY'),
      emailEnabled: Deno.env.get('RPD_PURCHASE_EMAIL_ENABLED') === 'true',
    })
    if (result.retry) {
      console.warn('stripe-rpd-webhook access email awaiting retry', result.email)
      return new Response('Purchase recorded; access email awaiting retry', { status: 503 })
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    // Do not log provider responses, checkout payloads, buyer emails or links.
    console.error('stripe-rpd-webhook processing requires retry')
    return new Response('Webhook handler failed', { status: 500 })
  }
})
