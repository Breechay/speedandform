# RPD Live Monitoring — September 16, 2026

## Launch state

`FORM · RPD · Purchase Test 01` is live.

- campaign: enabled
- ad set: enabled
- Creative A: enabled
- budget: approximately $25/day
- creative: real FORM runners group photo
- offer: Race Pace Durability, Weeks 1–4 free, full 15-week plan for a one-time payment of $79

Do not change targeting, copy, creative, landing page, or budget from the first handful of impressions/clicks.

## First connector read after launch

Windsor reported:
- spend: $1.33
- impressions: 163
- clicks: 21
- link clicks: 22
- reach: 162
- frequency: 1.01

The click/link-click counts are internally inconsistent in this very early read, so treat this as proof of delivery only, not as a trustworthy efficiency benchmark yet.

GA4 had not yet surfaced RPD page/event rows in the immediate post-launch connector read. Do not interpret that as failure; allow reporting delay and preserve the current campaign.

Entitlement store immediately after launch:
- total RPD entitlements: 0
- paid entitlements: 0

No purchase has occurred yet.

## Observation rule

Watch the funnel in order:
1. delivery / impressions
2. link clicks
3. landing-page visits
4. free-preview interaction
5. checkout starts
6. purchase
7. entitlement / access

Do not optimize on CTR or CPC alone. Do not edit from a handful of visits.

## First-buyer response

If the first genuine payment appears:
1. confirm Stripe payment state;
2. confirm `product_entitlements` receives a paid RPD row;
3. confirm full Weeks 5–15 unlock;
4. confirm source attribution is preserved where available;
5. if access fails, pause RPD spend, restore access without another charge, repair the path, then resume.

## Creative B

Keep `rpd_creative_b_static_v2.png` parked until Creative A has enough delivery to provide a baseline, unless Brice explicitly chooses to run both immediately.

## Miami control

Keep `FORM · Miami · Run · Test 01` unchanged while RPD launches. Latest read at this checkpoint:
- spend: $27.45
- impressions: 1,324
- clicks: 43
- link clicks: 23
- reach: 956
- frequency: 1.38
- genuine inquiries: 1 (Jorge)

Do not conflate the two tests. Miami is a coaching-acquisition control; RPD is a $79 direct-purchase test.
