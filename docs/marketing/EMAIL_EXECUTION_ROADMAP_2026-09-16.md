# FORM Email Execution Roadmap

**Updated:** September 16, 2026  
**Priority:** active customer-experience infrastructure  
**North star:** every outward email should feel like part of FORM, not an automated afterthought.

Read first: `docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md`.

## Current state

### Resend

Verified today:
- `send.speedandform.com` — verified, sending enabled.
- transactional open tracking OFF.
- transactional click tracking OFF.
- TLS enforced.

Created today:
- `speedandform.com` root sending domain — **pending DNS verification**.
- Return-Path intentionally uses the `resend` subdomain so existing Cloudflare inbound MX/SPF at the root are not replaced.

Published templates:
1. `form-coaching-inquiry` — compact internal coaching lead card.
2. `form-coaching-inquiry-received` — human acknowledgment to a coaching prospect.
3. `rpd-purchase-confirmation` — buyer access email for Race Pace Durability.

Root-domain sender targets once verified:
- `inquiries@speedandform.com`
- `brice@speedandform.com`
- `hello@speedandform.com`
- `access@speedandform.com`
- reply/support: `support@speedandform.com`

### Coaching form

Live stopgap:
- FormSubmit opaque endpoint remains active.
- visible email uses compact table rather than giant box layout.
- final relay sets `_replyto` to the athlete email.
- subject pattern includes offer, athlete name, term, and price.

Target production path:
`coaching form → server-side validation → Resend internal alert + prospect acknowledgment → browser success → measurement`

Do not remove FormSubmit until the Resend path has delivered a real test to Brice and the test prospect mailbox, with Reply verified.

### RPD purchase

Live today:
`Stripe → webhook → entitlement → web unlock`

Target addition:
`entitlement success → Resend rpd-purchase-confirmation`

Rules:
- email failure must NEVER roll back a successful entitlement;
- Stripe remains the financial receipt;
- FORM email is the useful access/start message;
- access CTA should include the paid Checkout Session so the buyer lands unlocked;
- restore-access link is always present;
- do not send duplicate purchase messages on repeated Stripe webhook delivery.

### Supabase Auth

Canonical 9+/10 templates now versioned in `supabase/templates/`:
- `magic_link.html`
- `recovery.html`
- `confirmation.html`
- `invite.html`
- `email_change.html`
- `reauthentication.html`
- `password_changed_notification.html`
- `email_changed_notification.html`
- `phone_changed_notification.html`
- `identity_linked_notification.html`
- `identity_unlinked_notification.html`
- `mfa_factor_enrolled_notification.html`
- `mfa_factor_unenrolled_notification.html`

Hosted Supabase still needs these templates applied to Auth > Emails / Management API before they are considered live. Do not assume repo presence means hosted email changed.

## Human blocker — root sender DNS

Add the DNS records Resend issued for `speedandform.com`, then verify the domain in Resend.

Do not delete or replace existing Cloudflare Email Routing records.

Once root sending is verified:
1. confirm DKIM/SPF/Return-Path status is green in Resend;
2. send one internal rendering test to Brice;
3. inspect Apple Mail + Gmail mobile;
4. test Reply-To behavior;
5. create a sending-only Resend API key;
6. store it server-side in Supabase (never client JS, never git);
7. wire coaching + RPD notifications;
8. keep FormSubmit fallback during acceptance;
9. retire fallback only after evidence.

## Email critic gates

An email cannot be called 9+/10 unless all pass:
- **Information architecture:** outcome + next action understood in <10 seconds.
- **Visual:** no dashboard dump; one card/action; excellent phone rendering.
- **Voice:** plain, human, literal; no marketing filler.
- **Action:** primary CTA/reply route works with one tap.
- **Recovery:** user can recover if link/device/email changes.
- **Deliverability:** authenticated domain; TLS; stable sender; tracking off where appropriate; plain-text fallback.
- **Privacy:** internal acquisition/debug metadata not exposed to the customer.
- **Resilience:** email failure cannot destroy a successful purchase or inquiry.

## Open queue

1. Verify root Resend DNS.
2. Send/render the three Resend templates using root senders.
3. Critic pass in Gmail mobile + Apple Mail; refine until no material issue remains.
4. Create server-side Resend sending key after domain verification.
5. Build coaching inquiry Edge Function; dual-deliver with FormSubmit fallback during acceptance.
6. Add non-blocking RPD purchase email send to the Stripe webhook after entitlement upsert.
7. Apply canonical hosted Supabase auth templates and sender identity.
8. Audit Stripe receipt branding and Checkout brand settings; current live Stripe branding is generic blue/no logo and does not yet meet the FORM standard.
9. Verify direct coaching reply signature/identity in Gmail.
10. Re-audit after first real RPD purchase and next genuine coaching lead.

## Scorecard right now

- Design system/spec: **9.3/10**
- Published Resend template design: **9.2/10 pending real-client rendering**
- Coaching live notification: **7.5/10 stopgap; replyability fixed, branding still FormSubmit**
- RPD live purchase email: **not wired yet**
- Hosted auth emails: **canonical designs ready; hosted application pending**
- Stripe receipt/Checkout branding: **~5.5/10; still generic**
- Deliverability foundation: **8.5/10; strong subdomain, root pending verification**

Do not average these into a false 9/10. The system reaches the target only after the remaining live wiring/rendering/deliverability checks pass.
