# RPD Distribution Execution Status

**Date:** September 15, 2026  
**Owner:** Speed & Form / FORM  
**Status:** build in progress — campaign shell exists, spend remains paused

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

`plans/race-pace-durability/gate.js` supports:

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
- Metadata identifies `race-pace-durability` / `rpd_v1`.
- Successful buyers return to `/plans/race-pace-durability/thanks/?session_id={CHECKOUT_SESSION_ID}`.
- No subscription.
- Tax automation remains off for now.

## 5. Purchase entitlement + delivery — CODED, TEST STILL REQUIRED

Implemented:

- `product_entitlements` database table.
- live Stripe webhook destination → Supabase `stripe-rpd-webhook`.
- Supabase signing-secret configuration completed by Brice on Sep 15.
- `rpd-entitlement` verification endpoint.
- browser-local unlock after verified payment.
- `plans/race-pace-durability/thanks/` confirmation surface.
- `plans/race-pace-durability/access/` purchase-recovery surface.
- purchase recovery can attach a paid entitlement to a verified email account without charging again.
- the shared auth callback now safely returns RPD recovery links to the RPD access surface.

The webhook handles:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`

### Still required

- one end-to-end live or controlled purchase test to prove: Stripe → webhook → entitlement → thanks page → Weeks 5–15 unlock.
- one cross-device restore test using the checkout email.

Do not treat code existence as a successful purchase test.

## 6. Browser funnel measurement — V1 DONE

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

## 7. Band selection — INTENTIONALLY NOT AUTOMATED YET

Do not expose the existing experimental `save_band` behavior as a universal public calculator.

The method is athlete-relative, but the exact band still needs to be supported by current fitness. Before scale, define the self-guided rule for selecting or validating a band. No agent should invent a formula merely to reduce friction.

## 8. FORM app — OUT OF TEST 01

- RPD is a complete web-owned $79 product.
- FORM is a separate product moving toward paid access with a trial/trial-like entry.
- A buyer does not need an ongoing FORM subscription to finish RPD.
- Native execution can become a later adherence / packaging experiment.

## 9. Homepage Simon evidence — REFINED

The homepage Simon section now treats the result as evidence instead of a loud sales headline:

- primary result: **1:26**
- secondary context: the goal was sub-1:30
- pace shown as supporting data
- Simon quote corrected from `5mn` to **5 min**
- Strava remains the verification link

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

### Current Meta blocker

Creating the first ad creative was blocked by Meta security error `code 31 / subcode 3858385`. Meta requires the Facebook user who connected the ad account to authenticate in Ads Manager / Security Center before ad-level creation or modification can continue.

Do not repeatedly retry the blocked ad creation. The campaign and ad set remain safely paused and cannot spend.

## 11. First two creative hypotheses

**A. Problem recognition**  
`YOU CAN HIT THE PACE. CAN YOU HOLD IT?`

**B. Product inspection / trust**  
`SEE THE FIRST FOUR WEEKS.`

No six-variant spray. Build these as two genuinely different buying reasons.

## Launch gate

Before Meta Test 01 spends meaningful money:

- [x] Product truth reconciled.
- [x] Weeks 1–4 preview and $79 offer coherent.
- [x] Stripe live Payment Link exists.
- [x] Success redirect includes Checkout Session ID.
- [x] Entitlement store and browser unlock code exist.
- [x] Stripe webhook signing secret configured in Supabase by Brice.
- [ ] One end-to-end purchase/entitlement test passes.
- [ ] Cross-device purchase restore passes.
- [x] Client-side ViewContent / InitiateCheckout / Purchase wiring exists.
- [ ] Purchase event observed correctly in GA4 + Meta test/debug tools.
- [ ] Final conversion-page editorial/design pass complete.
- [ ] Creative A complete.
- [ ] Creative B complete.
- [x] Meta Sales campaign shell created and paused.
- [x] Purchase ad set created and paused.
- [ ] Meta account authentication cleared so the first ad can be created.

After the launch gate passes: start the information-buying Meta test, not before.
