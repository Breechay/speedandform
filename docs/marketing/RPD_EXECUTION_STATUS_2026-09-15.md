# RPD Distribution Execution Status

**Updated:** September 15, 2026  
**Canonical commercial roadmap:** `docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md`

This file is now the RPD-specific technical checkpoint. If it conflicts with `CURRENT_COMMERCIAL_EXECUTION.md`, the current commercial roadmap wins.

## Product

- Race Pace Durability is a 15-week half-marathon plan.
- Weeks 1–4 are free/open.
- Weeks 5–15 require a one-time payment of $79.
- Pace is athlete-relative; the progression is shared.
- Published workload is roughly 45→60 miles/week, six days/week.
- FORM app and individual coaching are separate.

## Public funnel

Live:
- preview: `/plans/race-pace-durability/`
- English sales page: `/plans/race-pace-durability/support/`
- Spanish sales page: `/es/plans/race-pace-durability/`
- thanks: `/plans/race-pace-durability/thanks/`
- restore: `/plans/race-pace-durability/access/`

The sales page continues Creative A's story:
`Can you keep the pace?` → real FORM runners → what the plan is → what changes → fit → live evidence → what you get → price.

The exact Meta group photo is live directly after the hero in English and Spanish. Desktop live-browser QA passed on Sep 15.

The Weeks 1–4 preview explanatory copy has also been simplified; prescription data was not changed.

## Meta Test 01

Campaign:
- `FORM · RPD · Purchase Test 01`
- ID `52675684605200`
- $25/day campaign budget
- Sales / Purchase optimization
- PAUSED

Ad set:
- `US · Advantage+ · Purchase`
- ID `52675686707200`
- PAUSED

Creative A:
- `Creative A · Can You Hold It? · v1`
- published manually Sep 15
- last human-visible state: Processing
- group-photo creative
- Spanish translation enabled
- Meta copy generation allowed with truth filter

Creative B:
- spec ready
- buying reason: product transparency
- headline territory: `SEE THE FIRST FOUR WEEKS.`

Do not enable spend until the launch gate in `CURRENT_COMMERCIAL_EXECUTION.md` is green.

## Stripe / entitlement

Live Payment Link:
`https://buy.stripe.com/bJeaEX1YvfNwgMX3Doffy00`

- $79 one-time payment
- redirect includes Checkout Session ID
- webhook function: `stripe-rpd-webhook`
- verify/restore function: `rpd-entitlement`
- entitlement table: `public.product_entitlements`
- same-browser unlock coded
- email-based cross-device restore coded
- refund/dispute handling coded
- thanks page retries briefly while webhook delivery catches up

Current acceptance state:
- `product_entitlements` count was 0 on Sep 15
- no real successful purchase has been proven
- do not run a real $79 charge without Brice's explicit approval

## Measurement

Built:
- `rpd_view`
- Meta `ViewContent`
- `rpd_checkout_start`
- GA4 `begin_checkout`
- Meta `InitiateCheckout`
- GA4 `purchase`
- `rpd_purchase`
- Meta `Purchase`
- refresh guard

Acceptance still open:
- visibly verify pre-purchase events
- prove Purchase exactly once at $79 during real acceptance test
- later add CAPI + dedupe before scale

## Unbounce / conversion research

Read:
- `docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`
- `docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`

Public Unbounce research supports message match, simple headlines/CTAs, social proof, obvious pricing, and removing distractions.

Authenticated workspace audit is pending Brice logging into Unbounce in the connected browser profile. Never ask him to paste the password into chat.

## Remaining launch gates

- phone-width / physical-device sales + preview QA
- Creative A review completed without error
- Meta/GA4 pre-purchase event verification
- explicit approval for real $79 purchase test
- purchase → webhook → entitlement → unlock passes
- Purchase event fires once
- cross-device restore passes
- Creative B ship/defer decision
- final Meta destination/UTM/translation/price/CTA/pixel preflight

Then deliberately enable Test 01.
