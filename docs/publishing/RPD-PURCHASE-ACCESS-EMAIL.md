# Race Pace That Lasts purchase access delivery

Source prepared October 4, 2026. Deployment and real-mail acceptance are separate gates.

## Verified before implementation

- Hosted project: `pbgsjjegycacodiltbhn`.
- `stripe-rpd-webhook` ACTIVE v13 matched repository source and recorded entitlement only. It had no access-email send path.
- Schema inspection read metadata only. `product_entitlements` exists; no email-delivery/outbox table existed.
- Vault had no Resend-named secret. This does **not** establish hosted Edge Function secret state; that configuration remains unverified.
- No usable Resend/server credential was present in the execution environment.
- Connected Resend: `send.speedandform.com` verified and sending enabled; root `speedandform.com` failed. Use the verified subdomain.
- Existing published Resend alias `rpd-purchase-confirmation` still had the older product name and a root-domain sender. The new code uses its versioned HTML/text message, not that stale alias.
- No buyer records, customer emails, transaction contents or entitlement contents were read. No hosted data, customer messages, API keys or function configuration were changed.

## Behavior

Signature-verified paid Checkout completion or async-payment success records the entitlement first. The service-only email outbox then freezes one HTML/text payload per Checkout Session. The message uses the public name **Race Pace That Lasts**, 15 weeks, a private plan link that is verified by `rpd-entitlement`, another-device restore and support.

Sender: `FORM <hello@send.speedandform.com>`. Reply-To: `support@speedandform.com`. No campaign parameters, subscription changes, tracking pixels, analytics events or provider response bodies enter the message or logs.

Email delivery defaults **off**. Only `RPD_PURCHASE_EMAIL_ENABLED=true` activates enqueue/send. While disabled, the paid entitlement and revocation paths stay active, the webhook returns 200, and no email queue entry or provider call is made. This makes source deployment safe while hosted credentials are unavailable. It does not backfill past buyers.

When enabled, the webhook makes one email request with an 8-second timeout. A successful provider acknowledgment marks the outbox sent. This means accepted by Resend, not confirmed inbox delivery.

Transient network/timeout/429/5xx errors return 503 after the entitlement is committed. Stripe's existing automatic webhook retries drive recovery. Permanent request/credential/domain errors mark delivery failed and do not cause repeated customer messages. Missing configuration returns retryable status without consuming a provider attempt. Repeated paid events preserve both current entitlement status and the frozen delivery payload.

Each claimed delivery has a 60-second lease. Every attempt uses the same Resend idempotency key. Delivery stops for manual review at eight attempts or 23 hours after the first attempt, before Resend's 24-hour idempotency window expires. This avoids a duplicate after an ambiguous send or failed status write. Delayed/manual webhook replays cannot resend a recorded successful delivery.

Refunds/disputes cancel unsent messages and never restore access. Private payment-intent revocation records retain events that arrive before checkout completion. Payment-intent advisory locks serialize this path. Paid upserts preserve an existing revoked/refunded/disputed row.

## Deployment order

1. Review/apply only `supabase/migrations/20261004163816_rpd_purchase_access_email.sql` on the confirmed project. It adds two private RLS tables and five service-role-only, security-invoker RPCs. It does not backfill, query or send to historical buyers.
2. Leave `RPD_PURCHASE_EMAIL_ENABLED` unset or false for staged deployment. Before activation, configure hosted `RPD_RESEND_API_KEY`, a sending-only key restricted to the verified sending domain. Only deliberately set `RPD_PURCHASE_EMAIL_ENABLED=true` after credential/domain/client gates are satisfied. Never put the key value in git, browser code, logs or a support thread. Existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and Stripe webhook signing configuration remain necessary.
3. Verify transactional open/click tracking OFF and TLS enforced on the sending domain. The access link is a private direct link; it must not be rewritten for tracking.
4. Deploy `stripe-rpd-webhook/index.ts`, `core.mjs` and `email.mjs` together with `verify_jwt=false`. The endpoint retains timestamped Stripe signature verification on the raw body. Its remote dependencies are version pinned.
5. First prove the complete flow with an isolated Stripe sandbox/project and test recipients. Test a paid purchase, async payment, repeat event, transient provider failure and reordered refund. Do not replay production buyer events as a deployment test.
6. Run a deliberately addressed Gmail/Apple Mail rendering and Reply-To check only when authorized. Confirm SPF/DKIM alignment, readable dark mode, direct private plan link, restore flow and receipt separation. No such live test has been sent in this source pass.
7. Record the deployed function version, migration receipt, secret-presence result (never value), explicit activation gate, sandbox/client evidence and production acceptance in the main roadmap. Claim email enabled only after configuration, activation and deployed source are verified. The connected tools used in this pass expose no hosted Edge secret metadata/write capability; two existing Resend key names do not provide a usable secret value.

## Observability and recovery

Review only aggregate outbox state counts or a specifically authorized support case. `failed` requires correcting the provider/configuration problem; `manual_review` requires checking whether Resend accepted the ambiguous attempt before any deliberate resend. Never automatically clear a sent state, regenerate a key or replay beyond the idempotency window. Provider delivery/bounce events and real-mail client checks are additional acceptance evidence; this source pass does not invent them.

The existing purchase-confirmation page and verified-email restore remain the buyer's recovery path even if email is delayed. Financial receipt remains Stripe's responsibility.

## Verification

`node tests/rpd-purchase-email.cjs` passed: paid/offer gating, verified private links, sender/HTML/text/accessibility structure, duplicate completed/async events, actual timeout, network and HTTP failures, missing configuration, post-send database failure, enqueue failure and revocation. All provider calls were fixtures; no external sends.

`SF_PGLITE_PATH=/tmp/sf-rpd-email-qa/node_modules/@electric-sql/pglite/dist/index.js node tests/rpd-purchase-email-db.mjs` passed against isolated PostgreSQL (PGlite 0.3.14): actual migration execution, frozen payload, unique outbox, lease/retry ownership, bounded idempotency, out-of-order refund/dispute, manual revoke and denied anon/authenticated grants. The package was installed only in the temporary QA directory.

`SF_STRIPE_PATH=/tmp/sf-rpd-email-qa/node_modules/stripe/esm/stripe.esm.node.js node tests/rpd-webhook-signature.mjs` passed with Stripe 22.6.0: valid raw signature accepted; changed payload, wrong secret and stale timestamp rejected. No Stripe API calls. Full Deno remote-import check was blocked by the environment's connection refusal to `esm.sh`; hosted bundling/deployment must provide that additional compile evidence.

Current official references checked: Supabase changelog (October 4), background tasks docs, Stripe webhook signature/retry documentation and Resend idempotency documentation. The current PostgreSQL minor-upgrade advisory concerns indexes/legacy encryption not introduced here. No hosted migration or function deployment occurred during this scoped implementation.
