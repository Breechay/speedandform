# RPD Distribution Execution Status

**Date:** September 15, 2026  
**Owner:** Speed & Form / FORM  
**Status:** build in progress — ad draft exists, spend remains paused

This file records what is actually implemented versus what is still a launch gate.

## 1. Product truth — DONE

Race Pace Durability is not a sub-1:30-only product.

Current product law:

> **Your pace is individual. The progression is shared.**

- 15-week half-marathon durability method.
- Experienced-runner base requirement remains roughly 45 mpw, six days/week, 12-mile long-run readiness.
- Athlete-relative race-pace band.
- Current Hope/José bands are study assignments, not universal constants.
- Canonical ownership ladder remains 5 → 6 → 8 → 12 → race.
- Sub-1:30 can be a case-study / acquisition wedge without defining the product.

See `RPD_OFFER_TRUTH_2026-09-15.md` and `../RACE_PACE_DURABILITY_CANONICAL_v1.md`.

## 2. Athlete-language rule — DONE

Standing rule is now documented in `docs/marketing/ATHLETE_LANGUAGE_RULE.md` and linked from `AGENTS.md`.

Do not assume a serious runner knows coaching vocabulary. Public copy should be understandable without decoding. Outcome first, what they get second, what they do third, proof next, method later. Generic language is acceptable when it is true and immediately understood.

Meta copy generation is allowed as an ideation source. Keep clear truthful variants; reject false personalization, guarantees, wrong race distances, invented features or claims.

## 3. Public copy + paid landing page — UPDATED

Updated:

- `plans/race-pace-durability/index.html`
- `plans/index.html`
- `plans/race-pace-durability/support/index.html`
- `es/plans/race-pace-durability/index.html`
- `pacing.html`
- Stripe live product description

The paid landing page now continues the ad story in plain language:

- hero remains `Can you keep the pace?`
- states that Race Pace Durability is a 15-week plan used with FORM runners
- tells the athlete they do not need the training theory to execute it
- free Weeks 1–4 is the primary cold-traffic CTA; $79 full plan remains visible
- adds a plain FORM-practice bridge: `This is how we train` / `This is one of the plans we use`
- explains the progression as shorter efforts → 5 → 6 → 8 → 12 late → race
- method / qualification / proof remain lower on the page
- English and Spanish sales pages use the same commercial story

The exact group image used in Meta still needs to be placed into the landing page from a clean web asset. Do not publish an Instagram UI screenshot as the permanent site asset.

## 4. Paid-plan interaction — DONE

`plans/race-pace-durability/gate.js` supports:

- Weeks 1–4 open.
- Week 5+ gated for non-buyers.
- Desktop/iPad navigation advances by the number of weeks visible.
- Swipe/trackpad/arrow interaction obeys the same page-size behavior.
- Crossing the free boundary routes to the purchase page.
- A verified paid session bypasses the gate and makes Weeks 5–15 available.

## 5. Stripe offer — DONE

Live Stripe:

- Product: Race Pace Durability.
- Price: $79 USD one-time payment.
- Payment Link remains the checkout surface.
- Metadata identifies `race-pace-durability` / `rpd_v1`.
- Successful buyers return to `/plans/race-pace-durability/thanks/?session_id={CHECKOUT_SESSION_ID}`.
- No subscription.
- Tax automation remains off for now.

## 6. Purchase entitlement + delivery — CODED, TEST STILL REQUIRED

Implemented:

- `product_entitlements` database table.
- live Stripe webhook destination → Supabase `stripe-rpd-webhook`.
- Supabase signing-secret configuration completed by Brice on Sep 15.
- `rpd-entitlement` verification endpoint.
- browser-local unlock after verified payment.
- `plans/race-pace-durability/thanks/` confirmation surface.
- `plans/race-pace-durability/access/` purchase-recovery surface.
- purchase recovery can attach a paid entitlement to a verified email account without charging again.
- the shared auth callback safely returns RPD recovery links to the RPD access surface.

The webhook handles:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`

### Still required

- one end-to-end live or controlled purchase test to prove: Stripe → webhook → entitlement → thanks page → Weeks 5–15 unlock.
- one cross-device restore test using the checkout email.

Do not treat code existence as a successful purchase test.

## 7. Browser funnel measurement — V1 DONE

`js/rpd-measurement.js` supports:

- `rpd_view`
- Meta `ViewContent`
- `rpd_checkout_start`
- GA4 `begin_checkout`
- Meta `InitiateCheckout`
- GA4 `purchase`
- `rpd_purchase`
- Meta `Purchase`

Purchase is fired only after the return-page entitlement verifies and is guarded against refresh re-fire in that browser.

Still pending before scale:

- Meta Conversions API / server-side Purchase.
- browser/server deduplication when CAPI is added.
- confirming all events in Meta Events Manager + GA4 DebugView.

## 8. Band selection — INTENTIONALLY NOT AUTOMATED YET

Do not expose the existing experimental `save_band` behavior as a universal public calculator.

The method is athlete-relative, but the exact band still needs to be supported by current fitness. Before scale, define the self-guided rule for selecting or validating a band. No agent should invent a formula merely to reduce friction.

## 9. FORM app — OUT OF TEST 01

- RPD is a complete web-owned $79 product.
- FORM is a separate product moving toward paid access with a trial/trial-like entry.
- A buyer does not need an ongoing FORM subscription to finish RPD.
- Native execution can become a later adherence / packaging experiment.

## 10. Meta Test 01 — CAMPAIGN + AD SET CREATED, PAUSED

Created in the Vinchay Meta ad account:

- Campaign: `FORM · RPD · Purchase Test 01`
- Campaign ID: `52675684605200`
- Objective: Sales
- Bid strategy: lowest cost without cap
- Campaign daily budget: $25/day
- Status: paused

Ad set:

- `US · Advantage+ · Purchase`
- Ad set ID: `52675686707200`
- Website destination
- optimized for Purchase using pixel `147659485878240`
- US
- age floor 21; Meta requires a 65 maximum when Advantage+ audience is enabled
- status: paused

## 11. Creative A — DRAFT EXISTS IN ADS MANAGER

Brice manually opened the Meta ad editor after API writes remained blocked by Meta security code `31 / 3858385`.

Current direction:

- real FORM athlete group photo as the visual
- Meta visual touch-ups / crop / brightness refinements are acceptable when they preserve the actual people and scene
- `Can you keep the pace?` is the central cold-traffic question
- Spanish translation is enabled because a Spanish $79 landing page now exists
- Meta text generation can supply plain-language variants, with a truth filter
- campaign and ad set remain off, so publishing the draft does not mean starting spend

Before publishing the ad draft, remove any generated copy that is factually wrong. In particular, reject `15-Week Plan to Marathon Success` because RPD is a half-marathon plan. Also reject any body copy claiming individualized/personalized programming, guaranteed progress, or a simple increase in intensity if that is not what the product provides.

Add URL parameters before publishing:

`utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=group_photo_v1`

## 12. First two creative hypotheses

**A. Social proof + problem recognition**  
Real FORM athletes + `Can you keep the pace?`

**B. Product inspection / trust**  
`SEE THE FIRST FOUR WEEKS.`

Do not spray six unrelated ads. Creative A may use several truthful Meta text/headline assets inside one ad, but the visual / buying reason should remain coherent.

## Launch gate

Before Meta Test 01 spends meaningful money:

- [x] Product truth reconciled.
- [x] Athlete-language rule established.
- [x] Weeks 1–4 preview and $79 offer coherent.
- [x] English paid landing page simplified around the ad story.
- [x] Spanish paid landing page exists and matches the offer.
- [x] Stripe live Payment Link exists.
- [x] Success redirect includes Checkout Session ID.
- [x] Entitlement store and browser unlock code exist.
- [x] Stripe webhook signing secret configured in Supabase by Brice.
- [ ] One end-to-end purchase/entitlement test passes.
- [ ] Cross-device purchase restore passes.
- [x] Client-side ViewContent / InitiateCheckout / Purchase wiring exists.
- [ ] Purchase event observed correctly in GA4 + Meta test/debug tools.
- [ ] Exact group image added to landing page from a clean site asset.
- [ ] Final conversion-page visual QA complete.
- [ ] Creative A published into the paused campaign after copy + UTM cleanup.
- [ ] Creative B complete.
- [x] Meta Sales campaign shell created and paused.
- [x] Purchase ad set created and paused.
- [x] Brice can enter the Meta ad editor manually.

After the launch gate passes: enable the information-buying Meta test. Publishing a paused draft is not the same as enabling delivery.
