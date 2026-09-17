# FORM email updates: operating contract

Owner: Brice. One release checklist: `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.
This new flow is separate from app identity, paid entitlement, coaching inquiries, RSS and photo downloads.

## Current boundary

Implementation is staged on `work/email-updates-pass6b`. Do not infer live signup from the source or from mocked delivery tests. No existing contacts are imported. No publication generates a campaign automatically. The first newsletter issue still requires an explicit publishing/send decision.

Before enabling the service: obtain the owner's explicit current public business mailing address, provision the dedicated server-side sending key and provider webhook secret, register the Turnstile widget, apply/test the isolated schema, schedule cleanup, and verify actual confirmation/inbox and opt-out behavior. Never use a private home address or the closed café's address by inference. Never commit keys, real recipients, bearer tokens or operational payloads to this public repository.

## Reader journey

`/updates/` contains one unchecked opt-in choice covering Field Notes, track photographs and run announcements. The name is optional by omission: only email is collected. The form appears only after the server reports readiness. It never creates an athlete account.

Subscribe POST requires an exact site Origin, JSON, validated address, current consent version, a server-verified Turnstile token with the right hostname/action, and an atomic admission quota. An approved request creates a pending record, not a subscription. The operational confirmation has one next action and both HTML/plain-text versions. Resend accepting a message is not proof it reached the inbox. No open or click tracking is enabled by this code.

The email's confirmation link carries a 256-bit opaque token in the URL fragment. The page clears that fragment before any remote service loads and waits for a deliberate confirmation button press. GET requests and link-scanner previews cannot confirm or unsubscribe. Token hashes are single-purpose. Expiry is 24 hours; opting out invalidates all older confirmation generations. Rejoining needs a fresh affirmative signup and a fresh confirmation. Repeated confirmation is idempotent while the same consent remains valid.

The visible unsubscribe link opens the same plain page; no login, CAPTCHA, payment or explanation is required. The `List-Unsubscribe` HTTPS endpoint accepts RFC 8058 one-click POSTs with the token and exact form body. Unsubscribe remains operational even when new signup/sending is disabled. It affects these updates only. Suppression from a signed complaint/bounce event cannot be overridden by public signup.

## Data and retries

`newsletter_private` is a new isolated consent schema, not an athlete/workout store. A September 17 metadata-only query found no existing newsletter/subscriber/email tables to reuse. Tables have RLS enabled and no client grants. The only runtime path is explicit service-role RPCs with fixed search paths. Even service_role has no direct table grant. No authenticated athlete obtains newsletter authority.

Confirmation and opt-out tokens are hashed for lookups. **Queued email payloads temporarily contain the raw links**, under the same private schema, to make retries byte-identical. The payload is erased after provider acceptance or cancellation and by cleanup after expiry. Do not claim that no raw link is ever stored. Provider idempotency keys use an opaque request UUID, not an email address. A lease and attempt cap prevent concurrent/repeated transport sends. Ambiguous delivery failures remain pending and produce a visible retry state, not subscription success. The retry uses exactly the original payload and request key.

Initial safety ceilings: 10 new confirmation messages per hourly window, 50 per daily window, two per address per day, a five-minute re-request cooldown, and three delivery leases per request. Turnstile is mandatory; the Origin check is not authentication. Confirm/opt-out tokens and timestamped webhook signatures authorize their own actions. Public API responses do not disclose whether an address is already subscribed or suppressed.

A cleanup job must call `public.newsletter_cleanup()` daily after activation. Pending unconfirmed addresses older than seven days are removed; expired queued payloads are erased; delivery event IDs are retained for 90 days. Unsubscribed/suppressed records are retained to prevent inadvertent resends, with deletion requests handled deliberately. Token capability must not be placed in analytics, debug logs or Git. Platform access logs need a separate review for the one-click query endpoint.

## Hosted setup

Deploy `supabase/functions/email-updates/index.ts` with its three local dependency/config files. Disable platform JWT verification **for this function only**, because email clients cannot supply an app JWT. Custom authentication is implemented with high-entropy confirmation/opt-out tokens and signed provider events; signup alone is public and challenge/rate-limited. Never change JWT behavior on existing functions.

Use Supabase Edge Function secrets for the variables in `newsletter/config.example.env`. These are values to provision securely, not files to publish. A restricted sending key for `send.speedandform.com` is sufficient. The root sending domain remained failed at this review; do not change DNS or other traffic to make this pass work. The chosen From is `FORM <updates@send.speedandform.com>` and Reply-To is the already-public `brice@speedandform.com`.

The webhook URL is the function URL plus `/webhook`; enable the seven email lifecycle event names recognized in `core.mjs`. A valid raw-body Svix signature and a timestamp within five minutes are required. Only the exact `form_updates` stream tag and known request UUID are processed. Persist no complete webhook payload. Reordered or replayed events cannot undo suppression. Observe failures, bounces and complaints before activating any broader issue send.

`NEWSLETTER_MODE` defaults to disabled. Test mode accepts only provider test-recipient addresses at `resend.dev`; its public status still reports unavailable. Live mode additionally refuses common dummy Turnstile secrets. `NEWSLETTER_ADDRESS_APPROVED=true` must follow an actual owner decision. Do not set it simply to pass a test.

Apply `newsletter/activation-headers.toml` to Netlify only as part of the reviewed activation release. Verify the actual `/updates/` response: no injected collector or email rewriting, appropriate CSP, no-transform, no-referrer and noindex. Neither CSP nor a source file proves CDN behavior; inspect the delivered response. Once real signup and unsubscribe work, add a restrained email-update link to Field Notes. Do not alter Ask, coaching, the gallery or purchase consent.

## Testing and deployment

CI creates an empty disposable PostgreSQL instance, installs this schema, and uses fixture transports for Resend and Turnstile. It tests database permissions, consent, token expiry/purpose, replays, renewal, idempotency, concurrency ceilings, provider failure, signed events and suppression. Browser tests use the real handler/database with controlled provider substitutes, at six widths in Chromium and WebKit. All fixture addresses are synthetic. This is not inbox-delivery verification, actual CAPTCHA verification, or testing in Apple Mail/Gmail.

The test server is `tests/newsletter/server.cjs`, never an Edge Function or production service. Its fixture endpoints must not be deployed. `tests/newsletter/helpers.cjs` refuses non-local database hosts. The tested newsletter interface is a staged route; no homepage/Library/navigation changes are included before activation.

Activation acceptance: owner mailing address; verified sender and actual server secrets; genuine challenge success/failure; one authorized real mailbox confirmation with visible plain/HTML and Reply-To; expired/used token behavior; visible and one-click unsubscribe; fresh rejoin; delivery webhook verification; production byte/browser review; updated website privacy disclosure covering email, consent, providers, retention and opt-out; daily cleanup; then discovery link. The first issue-send tool or workflow must select only currently confirmed and non-suppressed subscribers immediately before send and must include a valid unsubscribe capability. This pass does not implement an automatic issue dispatcher.

## Primary references reviewed

- FTC, CAN-SPAM business guide: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Resend send API and 24-hour idempotency window: https://resend.com/docs/api-reference/emails/send-email
- Resend webhook verification: https://resend.com/docs/webhooks/verify-webhooks-requests
- Cloudflare Turnstile server verification: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Supabase server-side secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase Edge Function gateway/authentication: https://supabase.com/docs/guides/functions

The source design requires opt-in confirmation by product choice. It is not a claim that every jurisdiction has identical consent rules or that this code alone certifies legal compliance.
