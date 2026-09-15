# Race Pace Durability — Purchase Attribution Acceptance

**Date:** September 15, 2026

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

For Payment Links configured with a redirect after payment, Stripe carries the UTM parameters onto the success redirect URL. Stripe also places `client_reference_id` on the Checkout Session and includes it in `checkout.session.completed`.

## Live acceptance evidence

A live, unpaid checkout session was opened with:

- `utm_source=qa`
- `utm_medium=internal`
- `utm_campaign=rpd_attribution_acceptance`
- `utm_content=client_ref_test`
- `client_reference_id=rpd__s_qa__m_internal__c_rpd_attribution_acceptance__x_client_ref_test`

Stripe created an open live Checkout Session with:

- product: Race Pace Durability
- amount: $79.00
- `client_reference_id` preserved exactly
- success URL expanded to include the four UTM parameters in addition to `{CHECKOUT_SESSION_ID}`
- no payment submitted

This proves Stripe itself preserves both the human-readable UTM redirect path and the compact server-readable reference.

## Front-end implementation

`plans/race-pace-durability/checkout.js` now:

1. reads first-party source values from `window.rpdSource()`;
2. appends supported UTM parameters to the Payment Link URL;
3. generates a non-sensitive compact `client_reference_id` such as:

`rpd__s_meta__m_paid_social__c_rpd_purchase_test_01__x_group_photo_v1`

The reference uses only alphanumeric characters, hyphens and underscores and stays within Stripe's 200-character limit.

`js/rpd-measurement.js` now captures first-party campaign continuity before the analytics privacy gate. This means DNT/GPC still prevents Meta/GA4 scripts and events, while explicit campaign labels can still follow the buyer into checkout for first-party order reconciliation.

Reason for this change: the first browser acceptance run used a privacy-respecting browser. Because `rpdSource()` was previously created only after the DNT/GPC check, the outgoing Stripe session had no client reference. Source continuity and third-party analytics consent are now separate concerns.

## Webhook implementation

Source-controlled target:

`supabase/functions/stripe-rpd-webhook/index.ts`

The target webhook parses the compact `client_reference_id` into:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`

and merges those values into `product_entitlements.source` when the paid entitlement is created.

### Deployment status

The source-controlled webhook update is **not yet accepted as deployed**. Supabase management calls were returning upstream HTTP 502 errors during this pass, so the currently active Edge Function was not overwritten without first being able to inspect/reach the deployment service.

Do not mark server-side entitlement attribution complete until:

1. Supabase function deployment succeeds;
2. deployed function version is read back;
3. one paid test creates an entitlement whose `source` JSON contains the expected campaign values.

## Measurement implications

Client-side custom events now include explicit first-party source labels on:

- `rpd_view`
- `rpd_preview_open`
- `rpd_checkout_start`
- `rpd_purchase`

Standard GA4 purchase/checkout events remain standard ecommerce events. Meta standard events remain `ViewContent`, `InitiateCheckout`, and `Purchase`.

## Privacy rule

Never put email, name, card data, health data, training inputs, or private athlete information into UTM parameters or `client_reference_id`.

Only use campaign/source labels needed for acquisition reconciliation.
