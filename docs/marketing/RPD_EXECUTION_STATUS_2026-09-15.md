# RPD Distribution Execution Status

**Date:** September 15, 2026  
**Owner:** Speed & Form / FORM  
**Status:** build in progress — do not start meaningful Meta spend yet

This file records what is actually implemented versus what is still a launch gate.

## 1. Product truth — DONE

Race Pace Durability is no longer framed as a sub-1:30-only product.

Current product law:

> **Your pace is individual. The progression is shared.**

- 15-week half-marathon durability method.
- Experienced-runner base requirement remains roughly 45 mpw, six days/week, 12-mile long-run readiness.
- Athlete-relative race-pace band.
- Current Hope/José bands are study assignments, not universal constants.
- Canonical ownership ladder remains 5 → 6 → 8 → 12 → race.
- Sub-1:30 can be a case-study / acquisition wedge without defining the product.

See `RPD_OFFER_TRUTH_2026-09-15.md` and `../RACE_PACE_DURABILITY_CANONICAL_v1.md`.

## 2. Public copy — MOSTLY DONE

Updated:

- `plans/race-pace-durability/index.html`
- `plans/index.html`
- `plans/race-pace-durability/support/index.html`
- `pacing.html`
- Stripe live product description

The main RPD page now states the athlete-relative method explicitly and distinguishes the current study bands from plan constants.

Minor stale footer references elsewhere in the library may still call the linked RPD page a “Sub-1:30 Half Marathon Plan.” These are cleanup items, not product logic.

## 3. Paid-plan interaction — DONE

`plans/race-pace-durability/gate.js` now supports:

- Weeks 1–4 open.
- Week 5+ gated for non-buyers.
- Desktop/iPad navigation advances by the number of weeks visible.
- Swipe/trackpad/arrow interaction obeys the same page-size behavior.
- Crossing the free boundary routes to the purchase page.
- A verified paid session bypasses the gate and makes Weeks 5–15 available.

## 4. Stripe offer — DONE

Live Stripe:

- Product: Race Pace Durability.
- Price: $79 USD one time.
- Payment Link remains the checkout surface.
- Metadata now identifies `race-pace-durability` / `rpd_v1`.
- Payment Link now returns successful buyers to:
  `/plans/race-pace-durability/thanks/?session_id={CHECKOUT_SESSION_ID}`
- No subscription.
- Tax automation remains off for now.

## 5. Immediate browser access — CODED, ONE SECRET BLOCKER

Implemented:

- `plans/race-pace-durability/thanks/index.html`
- `plans/race-pace-durability/thanks/thanks.js`
- `product_entitlements` table already exists.
- `rpd-entitlement` Edge Function now verifies against the entitlement store rather than depending on a Stripe API secret in the browser-return path.
- Successful verification stores the checkout session locally and unlocks the same browser.
- The entitlement endpoint health check returns healthy against the database.

### Remaining manual prerequisite

The live Stripe webhook endpoint exists and points to the deployed Supabase `stripe-rpd-webhook` function, but the webhook verifier still needs the **live Stripe webhook signing secret** in Supabase.

Preferred configuration:

- Supabase Edge Function secret name: `STRIPE_WEBHOOK_SIGNING_SECRET`

Alternative already prepared:

- Supabase Vault secret name: `stripe_rpd_webhook_signing_secret`
- service-role-only RPC: `public.rpd_webhook_signing_secret()`

Do not store the signing secret in GitHub or client-side JavaScript.

Until that secret is configured, payments still succeed in Stripe but automatic entitlement creation is not reliable. **Do not start paid acquisition until this is resolved and tested.**

## 6. Refund / dispute revocation — CODED, SAME WEBHOOK GATE

The Stripe webhook handles:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`

Once webhook signature verification is active, refunded/disputed purchases can stop presenting as paid entitlements.

## 7. Browser funnel measurement — DONE FOR V1

`js/rpd-measurement.js` now initializes the existing Speed & Form analytics identities on RPD surfaces and supports:

- `rpd_view`
- Meta `ViewContent`
- `rpd_checkout_start`
- GA4 `begin_checkout`
- Meta `InitiateCheckout`
- GA4 `purchase`
- `rpd_purchase`
- Meta `Purchase`

Purchase is fired only after the return-page entitlement verifies and is guarded against refresh re-fire in that browser.

Campaign source values are retained through the RPD browsing session where analytics consent/privacy signals allow it.

### Still pending before scale

- Meta Conversions API / server-side Purchase.
- GA4 server-side purchase redundancy if desired.
- browser/server event deduplication once CAPI exists.

Client-side V1 is enough to inspect the first tiny diagnostic test only after entitlement works; server-side Purchase should be added before scaling spend.

## 8. Band selection — INTENTIONALLY NOT AUTOMATED YET

Do not expose the existing experimental `save_band` behavior as a customer-facing calculator yet.

The canonical system says the race-pace band is athlete-relative and authored from fitness evidence. There is not yet an approved universal public formula.

Before scale, Brice must choose a self-guided packaging rule:

1. runner already knows a defensible race-pace band;
2. a bounded pre-start diagnostic proposes/verifies a band;
3. an explicitly authored lookup/rule is added after validation.

No agent should invent a formula just to remove friction.

## 9. FORM app — OUT OF TEST 01

Current decision:

- RPD is complete as a web-owned $79 product.
- FORM is a separate product moving toward paid access with a trial/trial-like entry.
- A buyer does not need an ongoing FORM subscription to finish RPD.
- App execution can be revisited after purchase/adherence evidence exists.

## 10. Ad / landing-page build — NEXT

Do not produce six variants.

First diagnostic test should compare two genuinely different reasons to care:

**A. Problem recognition**  
`YOU CAN HIT THE PACE. CAN YOU HOLD IT?`

**B. Product inspection / trust**  
`SEE THE FIRST FOUR WEEKS.`

The page should sell the athlete-relative method, while Hope/José and sub-1:30 remain concrete public evidence rather than the product boundary.

## Launch gate

Before Meta Test 01 spends meaningful money, all of these must be true:

- [x] Product truth reconciled.
- [x] Weeks 1–4 preview and $79 offer are coherent.
- [x] Stripe live Payment Link exists.
- [x] Success redirect includes Checkout Session ID.
- [x] Entitlement store and browser unlock code exist.
- [ ] Stripe webhook signing secret is configured in Supabase.
- [ ] One end-to-end purchase/entitlement test passes.
- [x] Client-side ViewContent / InitiateCheckout / Purchase wiring exists.
- [ ] Purchase event is observed correctly in GA4 + Meta test/debug tools.
- [ ] Final conversion-page editorial/design pass is complete.
- [ ] Two launch creatives are complete.

After the launch gate passes: start the information-buying Meta test, not before.