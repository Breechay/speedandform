# FORM Email Experience Standard

**Updated:** September 16, 2026  
**Owner:** Speed & Form / Brice  
**Applies to:** every email sent to a prospect, buyer, athlete, app user, or customer.

## Standard

Email is part of the product. It must feel as considered as the site and the training.

Target: **9+/10** across clarity, usefulness, visual restraint, reply/action flow, trust, and deliverability.

### One-message law

Every transactional email should answer, in this order:
1. **What happened?**
2. **What do I do next?**
3. **What do I need to know?**
4. **Where do I get help?**

Anything that does not help one of those jobs should normally stay out of the customer-visible email.

## Visual system

- Warm-neutral outer canvas: `#f5f5f7`.
- White content surface.
- Ink: `#111111`; secondary: `#6e6e73`; tertiary: `#86868b`.
- FORM period may carry one restrained green accent (`#9acb19`).
- System/web-safe sans stack: Arial, Helvetica, sans-serif.
- Content width: 560–600px max.
- Generous whitespace; avoid stacked boxes and dashboard-like chrome.
- One dominant action. Secondary links are text links.
- No decorative hero imagery in transactional mail unless the image materially explains the action.
- Always provide a plain-text alternative.
- Mobile-first: readable without zooming; CTA at least ~44px tall.

## Voice

- Plain language. No decoding.
- Short literal subject lines.
- No fake urgency, secret/hack language, inflated promises, or marketing filler in transactional email.
- Human sender when a human reply is expected (`Brice · FORM`).
- Product sender when the message is operational (`FORM`).
- State what is true now; do not restate the whole sales page.

## Deliverability law

- Send only from verified Speed & Form domains.
- DKIM + aligned SPF/Return-Path must pass before root-domain sending is used in production.
- TLS enforced.
- Open tracking OFF and click tracking OFF for transactional/auth email. This avoids unnecessary link rewriting and protects magic-link reliability.
- Avoid URL shorteners, excessive links, large image payloads, invisible text, spammy subject punctuation, or promotional phrases.
- Keep sender identities stable.
- Use a working Reply-To whenever a person could reasonably reply.
- Auth links are single-purpose and direct; never wrap them in marketing tracking.
- Monitor bounce/complaint/failure logs after new templates or senders launch.

## Sender map

| Job | From | Reply-To | Customer sees |
|---|---|---|---|
| Coaching inquiry acknowledgment | `Brice · FORM <brice@speedandform.com>` | `brice@speedandform.com` | Human, personal acknowledgment |
| Internal coaching inquiry alert | `FORM <inquiries@speedandform.com>` | athlete email | Compact lead card; Reply goes to athlete |
| RPD purchase/access | `FORM <hello@speedandform.com>` | `support@speedandform.com` | Product access, not a second receipt |
| Auth / account access | `FORM <access@speedandform.com>` | `support@speedandform.com` | One secure account action |
| Security notification | `FORM <access@speedandform.com>` | `support@speedandform.com` | What changed + what to do if unexpected |
| Direct coaching reply | `Brice <brice@speedandform.com>` | same | Normal human email thread |

Until `speedandform.com` is verified for Resend sending, keep production sender traffic on the already-verified `send.speedandform.com` path. Do not weaken inbound Cloudflare Email Routing to make root-domain sending work.

## Current audit

| Surface | Before | Current target | Status |
|---|---:|---:|---|
| Coaching inquiry → Brice | 3/10 | 9.5/10 | FormSubmit compact stopgap live; branded Resend template published; server wiring pending |
| Coaching inquiry acknowledgment → prospect | 0/10 | 9.5/10 | Resend template published; wiring pending |
| RPD purchase → buyer | 4/10 (Stripe receipt + web return only) | 9.5/10 | Branded access template published; webhook wiring pending |
| Stripe receipt / Checkout branding | 5/10 | 9/10 | Stripe currently generic blue/no logo; branding pass pending |
| Magic-link email | 7.5/10 | 9.5/10 | Canonical template refinement in repo required + hosted Supabase application required |
| Password reset | default / unverified | 9.5/10 | Canonical template required + hosted Supabase application required |
| Signup / invite / email change / reauth | default / unverified | 9+/10 | Canonical templates required + hosted Supabase application required |
| Security notifications | default / partly disabled | 9+/10 | Canonical templates + deliberate enablement required |

## Canonical customer flows

### Coaching inquiry

**Submit → immediate acknowledgment → Brice receives compact inquiry → Reply goes directly to athlete.**

Prospect acknowledgment subject: `I got your note`.

Internal alert subject pattern: `Run Development · First Last · 8 weeks · $1,200`.

Internal metadata such as UTMs should be stored in the backend/analytics system, not sprayed through the visible quoted email thread.

### RPD purchase

**Stripe payment → entitlement recorded → FORM access email → open full plan.**

Subject: `Your Race Pace Durability plan is ready`.

FORM email owns the useful next step. Stripe may send the financial receipt separately.

The message should contain:
- purchase complete;
- `Open the full plan`;
- 15 weeks / full access;
- `$79 one time · no subscription`;
- restore-access link;
- support link.

### Authentication

One email, one secure action. Subjects should be literal:
- `Your FORM sign-in link`
- `Reset your FORM password`
- `Confirm your FORM email`
- `You’re invited to FORM`
- `Confirm your new email`
- `Your FORM verification code`

Do not add product marketing to authentication messages.

## Quality gate for every new outward email

Before enabling a template, check:
- [ ] Sender domain authenticated and aligned.
- [ ] Subject says exactly why the email exists.
- [ ] Inbox preview is useful, not duplicate filler.
- [ ] One clear primary action.
- [ ] Body is understandable in under 10 seconds.
- [ ] Reply-To is intentional.
- [ ] Plain-text version exists.
- [ ] No internal field names, UTMs, IDs, or debug data are visible unless genuinely useful.
- [ ] No unsupported claims or invented urgency.
- [ ] Links go to `speedandform.com` or a necessary trusted payment/auth destination.
- [ ] Tracking is off for auth/transactional links unless there is a specific justified need.
- [ ] Gmail + Apple Mail mobile visual pass.
- [ ] Dark-mode degradation remains legible.
- [ ] Bounce/failure/complaint path is observable.

## Rollout order

1. Verify `speedandform.com` as a Resend sending domain without replacing the existing root inbound MX/SPF.
2. Wire coaching inquiry notification + acknowledgment through a server-side sender; keep FormSubmit as fallback until acceptance passes.
3. Wire RPD purchase access email after entitlement creation; do not duplicate the Stripe receipt.
4. Apply the canonical auth templates to hosted Supabase.
5. Refine live Stripe branding so Checkout/receipts visually belong to Speed & Form.
6. Run a real Gmail + Apple Mail visual/deliverability check before retiring fallbacks.

## Critic rule

Do not call an email 9+/10 because it is visually attractive. It must also be trustworthy, easy to act on, easy to recover from, replyable where appropriate, resilient across clients, and unlikely to damage deliverability.
