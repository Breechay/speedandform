# RPD Creative B — Meta build spec

**Date:** September 15, 2026  
**Purpose:** second materially different creative for `FORM · RPD · Purchase Test 01`.

## Hypothesis

Creative A sells identity / people / practice.

Creative B sells **product transparency**:

> See the first four weeks.  
> Run them before you decide.

The visitor should immediately see the actual plan, not another explanation of the plan.

## Static asset

Current chat export:
`rpd_creative_b_static_v2.png`

Format:
- 1080 × 1350
- 4:5
- dark FORM treatment
- exact Week 4 prescription facts from canonical RPD data
- Week 5 shown locked
- no fake workout imagery
- no baked Meta-style CTA button

Exact plan facts shown:
- Monday · Easy · 6 mi
- Tuesday · Race pace · 5 mi continuous
- Wednesday · Easy · 6 mi
- Thursday · Recovery + strides · 6 mi
- Friday · Easy · 7 mi
- Saturday · Long run · 12 mi
- Week 5 · locked · Full plan $79

## Destination

Creative B should send directly to the free plan preview, not the long sales page:

`https://speedandform.com/plans/race-pace-durability/?utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=plan_preview_v1`

Reason: the ad promise is `See the first four weeks`; the destination should fulfill that promise immediately.

The preview already preserves first-party source values in session storage. If the runner later hits the Week 5 gate and moves to the $79 sales page, the checkout path can recover the campaign source.

## Ad name

`Creative B · See the First Four Weeks · v1`

## Seed primary text

Use plain source copy and let Meta generate alternatives. Truth-filter the results.

Seed:

> Training for a faster half marathon? Try the first four weeks of Race Pace Durability free.  
>  
> It is a 15-week plan for runners already training consistently, built to help you hold race pace longer.  
>  
> Full plan: one-time payment of $79.

Do not require this exact wording if Meta offers a clearer truthful version.

## Headline seed

`See the First Four Weeks`

Accept simple truthful Meta alternatives such as:
- `Try the First Four Weeks Free`
- `15-Week Half-Marathon Plan`
- `Train to Hold Your Pace Longer`

Reject:
- marathon instead of half marathon;
- `personalized` / `tailored to you`;
- guarantees;
- limited-time urgency;
- secrets/hacks;
- transformation-in-no-time language.

## Description

`15 weeks · Weeks 1–4 free · $79 full plan`

## CTA

`Learn More`

## Automation settings

Allowed:
- faithful crop / placement adaptation;
- visual touch-ups;
- brightness / contrast refinement;
- text-generation suggestions with truth filter.

Do not allow:
- generated replacement runners or fabricated proof;
- copy that changes the event distance, offer, personalization level or price.

## Spanish

If Spanish translation is enabled, remember that the Spanish sales page exists but the complete preview / post-purchase execution path is not fully localized yet. Do not scale Spanish delivery materially until the preview and access surfaces are understandable end-to-end.

## Test interpretation

Creative B is intentionally not a pure one-variable copy test against A. It asks a different question:

- A: does real FORM athlete identity make the right runner stop and care?
- B: does immediate product inspection reduce uncertainty enough to create stronger intent?

Judge downstream behavior:
- landing-page / preview engagement;
- Week 5 gate interaction;
- checkout starts;
- purchases;
- not CTR alone.
