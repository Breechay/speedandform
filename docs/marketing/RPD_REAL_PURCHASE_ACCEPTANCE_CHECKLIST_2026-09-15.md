# Race Pace Durability — Real Purchase Acceptance Checklist

**Prepared:** September 15, 2026  
**Status:** ready to run only after Brice explicitly approves a real $79 live charge.

## Purpose

Prove the complete customer path with one controlled live purchase before paid acquisition is enabled:

**Meta-style source → sales page → Stripe → webhook → entitlement → confirmation → Weeks 5–15 → Purchase event → restore on another device.**

This is an acceptance test, not revenue.

## Hard rule

Do not initiate or submit a real payment until Brice explicitly says to run the $79 live purchase test.

Do not use another person's card, email, or payment identity for this test.

## Preflight before charge

Confirm immediately before the test:

- [ ] RPD campaign remains paused.
- [ ] RPD ad set remains paused.
- [ ] live Payment Link is active and still $79 one-time.
- [ ] return URL contains `{CHECKOUT_SESSION_ID}`.
- [ ] production checkout CTA carries the test UTM values and `client_reference_id`.
- [ ] Supabase management is healthy.
- [ ] deployed `stripe-rpd-webhook` has been read back and contains client-reference source parsing.
- [ ] `rpd-entitlement` is active.
- [ ] current entitlement count is recorded before the purchase.
- [ ] Meta Events Manager / GA4 DebugView is open if Brice wants visual event verification during the same run.

If the attribution-aware webhook cannot be deployed/read back, do not spend the $79 merely to prove a partially known path.

## Controlled source

Use a clearly identifiable internal acceptance source so the entitlement can be distinguished from future real customers:

- `utm_source=qa_live`
- `utm_medium=internal`
- `utm_campaign=rpd_paid_acceptance`
- `utm_content=controlled_purchase`

Expected client reference:

`rpd__s_qa_live__m_internal__c_rpd_paid_acceptance__x_controlled_purchase`

## Live purchase steps

1. Open the production RPD sales page with the controlled source parameters.
2. Verify the page still shows:
   - Race Pace Durability
   - 15 weeks
   - Weeks 1–4 free
   - one-time payment of $79
3. Click `Get the full plan · $79`.
4. At Stripe, verify:
   - merchant = Speed & Form
   - product = Race Pace Durability
   - amount = $79.00
   - one-time payment
5. Use Brice's approved payment method and checkout email.
6. Submit payment once.
7. Do not refresh or manually navigate away during Stripe's redirect.

## Immediate Stripe evidence

Record:

- Checkout Session ID
- Payment Intent ID
- charged amount/currency
- checkout email
- payment status
- client reference ID
- success URL / redirect source labels

Expected:

- payment status = paid
- amount = 7900 USD cents
- client reference matches controlled source

Do not store card details anywhere in FORM, Supabase, docs, or chat.

## Webhook acceptance

Within seconds of payment:

- [ ] Stripe webhook delivery is HTTP 2xx.
- [ ] `checkout.session.completed` was received.
- [ ] one `product_entitlements` row exists for the Checkout Session.
- [ ] entitlement `status = paid`.
- [ ] amount = 7900.
- [ ] currency = usd.
- [ ] checkout email normalized correctly.
- [ ] source JSON contains:
  - `utm_source = qa_live`
  - `utm_medium = internal`
  - `utm_campaign = rpd_paid_acceptance`
  - `utm_content = controlled_purchase`

There should be exactly one entitlement for that Checkout Session.

## Confirmation / same-browser unlock

On the Stripe return page:

- [ ] status advances from verification/checking to paid/ready without manual intervention.
- [ ] copy is clear and human.
- [ ] `Open the full plan` appears.
- [ ] opening the plan exposes Weeks 5–15.
- [ ] local purchase session is recorded.
- [ ] refreshing does not lose access.

Test the Week 5 gate directly:

- navigate from Week 4 forward;
- expected: plan advances into paid weeks rather than returning to the purchase page.

## Purchase measurement acceptance

Expected after entitlement verifies:

GA4:
- [ ] `purchase` fires once
- [ ] transaction ID = Stripe Checkout Session ID
- [ ] value = 79
- [ ] currency = USD
- [ ] `rpd_purchase` fires once

Meta:
- [ ] `Purchase` fires once
- [ ] value = 79
- [ ] currency = USD
- [ ] event ID = Checkout Session ID

Refresh the confirmation page once:

- [ ] no second GA4 purchase
- [ ] no second Meta Purchase

## Cross-device / clean-browser restore

Use a second browser profile or another device with no RPD local storage.

1. Open `/plans/race-pace-durability/access/`.
2. Enter the same checkout email.
3. Open the secure FORM email link on that device/profile.
4. Let the restore endpoint attach/recover the entitlement.
5. Open the plan.

Expected:

- [ ] no new charge
- [ ] no receipt/session ID hunting required
- [ ] Weeks 5–15 available
- [ ] entitlement remains one purchase, not duplicated

## Optional refund/revocation acceptance

Only do this if Brice explicitly wants to test the refund path after the purchase acceptance has passed.

1. Refund the controlled Stripe payment.
2. Verify webhook receives the refund event.
3. Verify entitlement becomes `refunded`.
4. Verify paid access is no longer granted after fresh verification.

Important: a refund can still leave processing costs depending on Stripe account/pricing. Do not assume the acceptance test is financially free.

## Pass criteria

The RPD paid-delivery gate passes only when all of these are true:

- payment accepted once;
- source preserved;
- webhook succeeds;
- one paid entitlement created;
- same-browser access works;
- Week 5+ works;
- Purchase fires once;
- refresh does not duplicate purchase;
- clean-device restore works without payment.

## After pass

Update:

- `docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md`
- `docs/marketing/RPD_EXECUTION_STATUS_2026-09-15.md`
- `docs/marketing/RPD_ATTRIBUTION_ACCEPTANCE_2026-09-15.md`

Then run final Meta preflight. Do not enable Test 01 automatically; activation remains a deliberate campaign action.
