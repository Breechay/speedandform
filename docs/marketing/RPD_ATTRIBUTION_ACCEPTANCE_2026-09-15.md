# Race Pace Durability — Purchase Attribution Acceptance

**Date:** September 15, 2026  
**Status:** landing page → Stripe attribution accepted before payment; paid entitlement attribution still requires webhook deployment + one paid test.

## Goal

Preserve campaign/source information from the RPD landing page through Stripe Checkout and into the paid entitlement without sending private athlete data to Meta or GA4.

## What Stripe supports

Stripe Payment Links accept these URL parameters:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `client_reference_id`

For Payment Links configured with a redirect after payment, Stripe carries supported UTM parameters onto the success redirect URL. Stripe also puts `client_reference_id` on the Checkout Session and includes it in `checkout.session.completed`.

## Live acceptance — PASSED through Checkout Session creation

### Direct Stripe capability test

A live, unpaid Payment Link session was opened with explicit UTM parameters and:

`client_reference_id=rpd__s_qa__m_internal__c_rpd_attribution_acceptance__x_client_ref_test`

Stripe created an open live Checkout Session with:

- product: Race Pace Durability
- amount: $79.00
- `client_reference_id` preserved exactly
- success URL expanded with the four UTM values plus `{CHECKOUT_SESSION_ID}`
- no payment submitted

This proved Stripe itself supports the mechanism.

### Actual live landing-page code test — PASSED

The production RPD page was then opened with:

- `utm_source=qa5`
- `utm_medium=internal`
- `utm_campaign=rpd_prewrite_acceptance`
- `utm_content=group_photo_codepath`

The real `$79` CTA was followed to Stripe. No payment data was entered and no payment was submitted.

Stripe API then confirmed the Checkout Session created from that actual landing-page path:

- Checkout Session: `cs_live_a1MwavR7AwNwYXKIOl7lltlBlhhEEH94zTh5MfMrjQArKfU2zkQHh2DVbx`
- amount: `7900` cents
- payment status: `unpaid`
- `client_reference_id`:
  `rpd__s_qa5__m_internal__c_rpd_prewrite_acceptance__x_group_photo_codepath`
- success redirect includes:
  `utm_source=qa5`
  `utm_medium=internal`
  `utm_campaign=rpd_prewrite_acceptance`
  `utm_content=group_photo_codepath`

**Conclusion:** the production landing page now carries acquisition source into the Stripe Checkout Session before payment. This portion is accepted.

## Front-end implementation

`plans/race-pace-durability/checkout.js` now:

1. reads campaign source from the shared first-party source state when available;
2. falls back directly to the current page query string;
3. appends supported UTM parameters to the Payment Link;
4. generates a non-sensitive compact `client_reference_id`, for example:

`rpd__s_meta__m_paid_social__c_rpd_purchase_test_01__x_group_photo_v1`

5. prewrites every RPD checkout anchor `href` on page load with that attributed URL rather than relying only on click interception.

Prewriting matters because browsers, automation, open-in-new-tab behavior, and accessibility/navigation tools may follow an anchor directly rather than exercise a custom click handler.

The reference uses only campaign/source labels, is sanitized to alphanumeric / hyphen / underscore, and stays within Stripe's 200-character limit.

`js/rpd-measurement.js` now captures first-party campaign continuity before the analytics privacy gate. DNT/GPC still prevents GA/Meta scripts and events, but explicit campaign labels can still follow the buyer into Stripe for first-party order reconciliation.

Source continuity and third-party analytics consent are separate concerns.

## Webhook implementation target

Source-controlled target:

`supabase/functions/stripe-rpd-webhook/index.ts`

The target webhook parses the compact `client_reference_id` into:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`

and merges those values into `product_entitlements.source` when a paid entitlement is created.

### Deployment status — BLOCKED BY SUPABASE MANAGEMENT SERVICE

The source-controlled webhook update is **not yet accepted as deployed**.

Repeated Supabase management calls (`list_edge_functions`, `get_edge_function`, and SQL reads during this period) returned upstream HTTP `502` errors. The live Edge Function was therefore not overwritten blindly.

Do not mark server-side entitlement attribution complete until:

1. Supabase management access recovers;
2. the current deployed webhook is read back;
3. the source-controlled attribution-aware version is deployed;
4. the deployed version is read back;
5. one paid test creates an entitlement whose `source` JSON contains the expected campaign labels.

## Measurement implications

Client-side custom events include first-party source labels on:

- `rpd_view`
- `rpd_preview_open`
- `rpd_checkout_start`
- `rpd_purchase`

Standard GA4 purchase/checkout events remain standard ecommerce events. Meta standard events remain `ViewContent`, `InitiateCheckout`, and `Purchase`.

No accepted paid Purchase event exists yet because no real RPD payment has been completed.

## Privacy rule

Never put email, name, card data, health data, training inputs, or private athlete information into UTM parameters or `client_reference_id`.

Only campaign/source labels needed for acquisition reconciliation belong in this mechanism.

## Remaining acceptance

- [x] Stripe Payment Link preserves UTM parameters.
- [x] Stripe Payment Link preserves `client_reference_id`.
- [x] Actual production RPD CTA creates an attributed live Checkout Session.
- [x] Success redirect is prepared to return the UTM values to FORM.
- [ ] Attribution-aware webhook deployed to Supabase.
- [ ] Paid Checkout Session emits webhook successfully.
- [ ] Entitlement source JSON contains expected campaign labels.
- [ ] Verified purchase page fires Purchase once.
- [ ] Cross-device restore works for the paid entitlement.
