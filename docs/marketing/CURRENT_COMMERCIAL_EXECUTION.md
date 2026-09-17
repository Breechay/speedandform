# Current Commercial Execution — canonical roadmap

**Updated:** September 16, 2026  
**Owner:** Brice / Speed & Form  

> **September 17 coaching doctrine:** `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md` is now required reading for Run Development acquisition and homepage work. Keep the offer facts and measurement contracts here; use the manifesto for coaching philosophy, voice and page sequencing. The Miami campaign landing page was not static through the full test, so later analysis must identify the landing revision when comparing session quality.

**Instruction:** if Brice says only `continue`, take the first unblocked item below, execute it, record evidence, then keep moving. Do not wait on a human-only blocker if another useful item is available.

## Operating law

1. **RPD is live and is the active commercial-product test.** Do not redesign from the first handful of visits.
2. **Miami Run Development is the live coaching control.** Keep campaign budget/audience changes evidence-led. September 17 intentionally compresses the landing experience after direct mobile review and weak post-click engagement; do not treat the landing page as unchanged across the entire test.
3. **Think deeply backstage. Speak simply out front.** A fit runner may know very little coaching vocabulary.
4. **Proof carries sophistication.** Real athletes, real sessions, verified outcomes.
5. **Ad → landing → preview → checkout → access → email is one story.** Message match is required.
6. **Real-world conversions outrank platform attribution.** Meta/GA are measurement systems, not the definition of whether a person converted.
7. **Email is part of the product.** Every outward email must follow the 9+/10 experience and deliverability standard.

Read first:
- `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`
- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`
- `docs/marketing/RPD_OFFER_TRUTH_2026-09-15.md`
- `docs/RACE_PACE_DURABILITY_CANONICAL_v1.md`
- `docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md`
- `docs/marketing/EMAIL_EXECUTION_ROADMAP_2026-09-16.md`
- `docs/marketing/UNBOUNCE_PUBLIC_SWIPE_2026-09-16.md`

---

# A. Race Pace Durability — LIVE

## Product truth — locked

- 15-week half-marathon plan.
- Athlete-relative race pace; not a sub-1:30-only product.
- Roughly 45 → 60 mi/week, six days/week.
- Weeks 1–4 free.
- Weeks 5–15 unlocked by **one-time payment of $79**.
- Web plan complete; FORM app separate/not required.
- Coaching separate.
- No guaranteed finish time, fake personalization, fake urgency, secret/hack language.

## Meta Test 01 — LIVE

Campaign: `FORM · RPD · Purchase Test 01`  
Campaign ID: `52675684605200`  
Ad set: `US · Advantage+ · Purchase`  
Ad set ID: `52675686707200`  
Creative A: `Creative A · Can You Hold It? · v1`  
Budget: approximately $25/day  
Optimization: Purchase  
Pixel: `147659485878240`

Creative A uses the real FORM runners group photo, simple athlete-facing copy, Spanish translation, and Meta text generation with a truth filter.

Intended URL tags:
`utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=group_photo_v1`

### First live snapshot

Windsor after activation:
- spend: **$1.33**
- impressions: **163**
- reach: **162**
- click fields were internally noisy at this very small sample and must not be treated as performance evidence yet.
- paid entitlements: **0**

**Decision:** keep the campaign unchanged while the first meaningful traffic accumulates.

## Landing + preview + paid delivery — accepted

English offer: `/plans/race-pace-durability/support/`  
Spanish first sales surface: `/es/plans/race-pace-durability/`  
Free preview: `/plans/race-pace-durability/`

Story:
**real FORM athletes → Can you keep the pace? → same FORM image → what this is → what you do → proof → Weeks 1–4 → $79**

Accepted:
- group-photo continuity;
- desktop + deterministic 390px sales-page QA;
- Weeks 1–4 readable;
- Week 5+ locked;
- arrow/tap navigation works;
- public browser cannot retrieve paid prescription;
- no paid workout leakage;
- $79 CTA opens correct Stripe Checkout.

Literal physical-finger swipe has not been reproduced by automation. Treat as a small residual, not a blocker; fix if live users report trouble.

## Paid-plan security

Public browser uses `public.public_plan_preview(text)`.
Weeks 5–15 return structural placeholders only.
Complete plan requires verified entitlement through `rpd-entitlement`.

Backend:
- `rpd-entitlement` ACTIVE v8
- `stripe-rpd-webhook` ACTIVE v5
- RLS enabled on entitlements
- current genuine paid rows: 0

Brice explicitly declined an internal $79 acceptance charge. **Do not ask again unless he reverses that decision.**

First-buyer contingency:
1. monitor Stripe + entitlement + support inbox;
2. if payment succeeds but access fails, pause RPD spend;
3. restore access without another charge;
4. repair path before resuming.

## Creative B — parked second hypothesis

Static asset: `rpd_creative_b_static_v2.png` · 1080×1350.

Message:
- `See the first four weeks.`
- `Run them before you decide.`
- actual Week 4 prescription
- Week 5 locked
- one-time payment of $79

Do not add merely because it exists. Add it deliberately after Creative A establishes a baseline or when Brice chooses to compare hypotheses.

---

# B. Miami Run Development — LIVE CONTROL

## September 17 landing doctrine pass

Source work on `work/mobile-hero-cut-20260917` deliberately reduces explanation density. The intended sequence is **hero → I develop runners → coaching/practice → training → offer → inquiry**. Simon remains valid evidence elsewhere but is no longer forced into position two on the homepage. The hero uses `Run Development` / `Run better.` / fee / one action. This is a source-state note only until production deployment is separately verified.


Campaign: `FORM · Miami · Run · Test 01`

Latest Windsor snapshot:
- spend: **$27.45**
- impressions: **1,324**
- clicks: **43**
- link clicks: **23**
- reach: **956**
- frequency: **1.38**

Real conversions:
- **1 genuine paid-social coaching inquiry: Jorge Tacoronte**
- no newer genuine coaching inquiry found.

Jorge’s intake:
- Miami
- wants to run longer
- 3 days/week
- 10–20 mi/week
- longest run 6–10 mi
- strength
- obstacle: speed and breath
- saw Run Development · 8 weeks · $1,200

Meta `Lead` / GA4 `generate_lead` remain unreliable/incomplete. A single controlled measurement submission was already attempted and remained inconclusive. **Do not keep resubmitting tests.**

**Decision:** keep budget, audience, creative, offer, and page unchanged.

---

# C. Email experience — ACTIVE SYSTEM WORK

Canonical standard:
`docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md`

Execution roadmap:
`docs/marketing/EMAIL_EXECUTION_ROADMAP_2026-09-16.md`

## Coaching form stopgap — live

FormSubmit still relays live coaching inquiries. It was improved so:
- the opaque confirmed endpoint is stable;
- `_replyto` is explicitly the athlete email;
- giant `box` layout was replaced with compact `table` layout;
- subject carries offer + person + term + price;
- visible fields are compact and readable.

This remains a stopgap because the visible sender is FormSubmit and the message cannot reach the desired FORM-level branded experience.

## Resend — prepared

Existing verified sending domain:
`send.speedandform.com`

Settings:
- sending enabled
- open tracking OFF
- click tracking OFF
- TLS enforced

New root sending domain:
`speedandform.com`
- created in Resend
- **pending DNS verification**
- Return-Path uses the `resend` subdomain so current Cloudflare inbound routing is not replaced.

Published Resend templates:
1. `form-coaching-inquiry` — internal compact lead card.
2. `form-coaching-inquiry-received` — immediate human acknowledgment.
3. `rpd-purchase-confirmation` — useful plan-access email after purchase.

Root-domain target senders after verification:
- `inquiries@speedandform.com`
- `brice@speedandform.com`
- `hello@speedandform.com`
- `access@speedandform.com`
- support/reply: `support@speedandform.com`

## Supabase Auth email design — canonical repo set ready

Version-controlled FORM templates now include:
- magic link
- password recovery
- email confirmation
- invitation
- email change
- reauthentication
- password changed
- email changed
- phone changed
- identity linked/unlinked
- MFA factor added/removed

These repo files are **not yet proof that hosted Supabase is using them**. Hosted Auth templates still need application/acceptance.

## Email next blocker

Brice must add the Resend DNS records for `speedandform.com`. After DNS verification:
1. send rendering tests to Gmail/Apple Mail;
2. verify Reply-To behavior;
3. create a sending-only server key;
4. wire coaching notification + acknowledgment server-side while keeping FormSubmit fallback;
5. wire RPD purchase access email after entitlement success without making email delivery block entitlement;
6. apply/verify hosted Supabase Auth templates;
7. audit Stripe receipt branding.

---

# D. Stripe / purchase experience

Live Payment Link:
`https://buy.stripe.com/bJeaEX1YvfNwgMX3Doffy00`

RPD checkout truth:
- Race Pace Durability
- $79 USD
- one-time payment
- no subscription
- source labels preserved into Checkout Session
- success returns to FORM with Checkout Session ID

Current Stripe brand settings remain generic:
- white background
- Stripe-blue button/accent
- no logo/icon in brand settings

This is a real experience gap. Do not call the purchase flow 9+/10 until Stripe Checkout/receipt branding is intentionally aligned with Speed & Form.

---

# E. Unbounce

Authenticated TinyFish workspace access remains unreliable. Do not block RPD on it.

Public research and swipe notes are parked in:
- `docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`
- `docs/marketing/UNBOUNCE_PUBLIC_SWIPE_2026-09-16.md`
- `docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

Parked surfaces:
1. RPD challenger ideas
2. FORM app
3. Forge
4. alternate coaching homepage

---

# Queue for future `continue`

1. Monitor RPD Creative A without premature changes: delivery → LPV → preview → checkout → purchase.
2. Monitor Miami unchanged for a second genuine inquiry.
3. Complete root Resend DNS verification when Brice has added records.
4. Once root email domain is verified, send real render/reply tests and wire coaching + RPD transactional email server-side.
5. On first genuine RPD purchase, monitor entitlement/unlock/email closely and execute contingency if needed.
6. Apply hosted Supabase Auth templates and verify real magic-link/recovery rendering.
7. Refine Stripe branding deliberately; do not change live account branding blindly.
8. Add Creative B only as a deliberate second hypothesis.
9. Revisit full Spanish RPD execution only when traffic/purchase evidence justifies it or Brice chooses bilingual completeness.

## North star

**Make it easy to understand, easy to buy, easy to start, easy to reply, and easy to keep going. Let the training and the result do the sophisticated talking.**
