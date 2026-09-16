# Race Pace Durability — Launch Status

**Date:** September 16, 2026  
**Status:** LIVE TEST ENABLED

## Launch decision

Creative A cleared the visible Ads Manager blocker state: the ad itself was enabled and Ads Manager showed `Ad set off`, with no visible rejection, policy error, or processing state. The parent campaign was still Off.

Based on the completed funnel QA and Brice's standing instruction to proceed once the final visible Meta gate cleared, the live test was enabled through the connected Meta/Windsor action layer.

### Enabled

- Campaign: `FORM · RPD · Purchase Test 01`
- Campaign ID: `52675684605200`
- Ad set: `US · Advantage+ · Purchase`
- Ad set ID: `52675686707200`
- Creative: `Creative A · Can You Hold It? · v1`
- Existing test budget: approximately **$25/day**
- Creative A was already toggled on in Ads Manager.

Action confirmations returned successfully for:
- `enable_adset` on `52675686707200`
- `enable_campaign` on `52675684605200`

No budget, targeting, destination, creative, or pricing changes were made during activation.

## Pre-launch acceptance already completed

- EN sales page live
- ES sales page live
- real FORM runners photo used for ad → landing continuity
- desktop + 390px sales-page QA passed
- Weeks 1–4 free preview works
- Weeks 5–15 prescription withheld server-side from nonbuyers
- live paywall / arrow QA passed
- Stripe checkout opens Race Pace Durability at **$79 one-time payment**
- source UTMs/client reference reach Stripe checkout pre-payment
- Stripe webhook active
- paid entitlement delivery function active
- controlled $79 internal purchase test explicitly waived by owner

## Measurement caveat

Windsor reporting returned no RPD rows immediately after activation. That is expected until Meta begins delivery/reporting. Do not interpret the absence of an immediate row as launch failure.

The first useful read should focus on:

1. delivery begins without policy/config error;
2. impressions and landing-page views appear;
3. preview interaction / checkout starts appear where measurement allows;
4. first genuine purchase is monitored closely through Stripe → webhook → entitlement → unlock.

Do not change the campaign from the first handful of impressions.

## First-buyer contingency

The first genuine buyer is the first full production proof of payment → webhook → entitlement → unlock because Brice declined the internal $79 charge test.

If a real payment succeeds but access fails:
1. pause RPD spend immediately;
2. restore the buyer's access without another charge;
3. diagnose and repair the path;
4. resume only after the issue is fixed.

## Creative B

`rpd_creative_b_static_v2.png` remains the second hypothesis. Do not add it simply because A is live. Let Creative A establish initial delivery first, then add B deliberately as the product-transparency comparison.

## Miami coaching control

`FORM · Miami · Run · Test 01` remains unchanged and active. Do not alter it as part of the RPD launch.
