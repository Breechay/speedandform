# RPD Distribution Execution Status

**Updated:** September 15, 2026  
**Owner:** Speed & Form / FORM  
**Status:** Creative A published; campaign + ad set explicitly paused; launch gate still open

For the full active checklist and cross-surface priorities, read `docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md`. This file is the RPD-specific status summary.

## Product / offer — DONE

Race Pace Durability is not a sub-1:30-only product.

> **Your pace is individual. The progression is shared.**

- 15-week half-marathon plan.
- Athlete-relative race pace.
- Published workload remains roughly 45 → 60 miles/week, six days/week.
- Weeks 1–4 are open/free to try.
- Full plan is a one-time payment of $79.
- FORM app is separate and not required to complete RPD.
- Current Hope/José pace ranges are study assignments, not universal product paces.

## Athlete-language rule — DONE

Standing rule: do not assume a fit or fast runner knows coaching vocabulary. Outcome first, what they get second, what they do third, proof next, method later. Generic language is acceptable when it is true and immediately understood.

Meta copy generation is allowed as an ideation source. Reject wrong race distance, fake personalization, guarantees, scarcity, `secret`, instant transformation and other unsupported claims.

## Paid landing page — ACTIVE / MOSTLY BUILT

English and Spanish sales pages now continue the ad story:

- `Can you keep the pace?`
- plain description of the 15-week half-marathon plan
- says RPD is one of the plans used with FORM runners
- tells athletes they do not need to understand the training theory to follow it
- `Try Weeks 1–4 free` is the primary cold-traffic action
- $79 full plan remains immediately visible
- progression explained plainly: shorter race-pace efforts → 5 → 6 → 8 → 12 late → race
- deeper method and qualification come after the offer is understood

**Open:** place the exact real group image from Creative A high on the page using a clean web asset and complete phone/desktop visual QA.

## Stripe / entitlement — CODED, ACCEPTANCE OPEN

Implemented:

- live $79 Stripe Payment Link
- success return with Checkout Session ID
- Stripe webhook destination → Supabase
- signing secret configured
- `product_entitlements` store
- same-browser paid unlock
- thanks page
- cross-device Restore Access flow by verified checkout email
- refund/dispute handling

Still required:

1. one controlled/live end-to-end purchase proving Stripe → webhook → entitlement → thanks → Weeks 5–15 unlock;
2. one second-browser/device restore proving access without another charge.

Do not treat code existence as a successful purchase test.

## Measurement — CLIENT SIDE BUILT, ACCEPTANCE OPEN

Implemented:

- RPD view / Meta ViewContent
- checkout start / GA4 begin_checkout / Meta InitiateCheckout
- verified-return purchase / GA4 purchase / Meta Purchase
- refresh guard
- campaign UTMs

Still required before meaningful spend:

- observe ViewContent in Meta Events Manager + GA4 DebugView;
- observe checkout event once;
- observe verified $79 Purchase once;
- confirm campaign URL tags reach the destination as intended.

Later before scale: Meta CAPI + browser/server deduplication.

## Meta Test 01 — PUBLISHED, PARENTS PAUSED

Campaign:

- `FORM · RPD · Purchase Test 01`
- ID `52675684605200`
- Sales objective
- $25/day
- Purchase optimization
- **explicitly paused via connector after Creative A publication on Sep 15**

Ad set:

- `US · Advantage+ · Purchase`
- ID `52675686707200`
- website Purchase
- US
- **explicitly paused via connector after Creative A publication on Sep 15**

Creative A:

- `Creative A · Can You Hold It? · v1`
- manually published in Ads Manager Sep 15
- Meta showed `Processing` immediately after publish
- real FORM athlete group image
- Meta visual touch-ups/crops allowed when the people/scene remain authentic
- Spanish translation enabled
- Meta text-generation variants allowed with truth filter
- intended URL tags:
  `utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=group_photo_v1`

Because the parent campaign and ad set are explicitly paused, publishing the ad is not approval to spend.

## Creative B — OPEN

Different buying reason from A:

> **SEE THE FIRST FOUR WEEKS.**

Use the actual product/preview as proof. Do not build a pile of minor copy variants before learning from A and one materially different B.

## Unbounce conversion audit — BLOCKED ONLY ON LOGIN

Unbounce is a research surface, not the default production host.

The connected browser reached Unbounce but was not authenticated. When convenient, Brice should log into Unbounce in the connected browser profile without sharing credentials in chat. Then rerun the read-only audit.

Priority questions:

- hero/image/copy balance
- mobile first-screen hierarchy
- free-preview framing
- CTA repetition
- proof placement
- qualification without application friction
- pricing block
- FAQ order
- sticky mobile CTA
- long vs short page
- ad-message → landing-page message match
- AI copy suggestions worth testing

See `docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`.

## Launch gate

Before RPD Test 01 spends meaningful money:

- [x] product truth reconciled
- [x] athlete-language rule established
- [x] English $79 page simplified around ad story
- [x] Spanish $79 sales page exists
- [x] Stripe live checkout exists
- [x] webhook signing secret configured
- [x] entitlement / same-browser unlock code exists
- [x] Restore Access code exists
- [x] Creative A published into Meta
- [x] RPD campaign explicitly paused after publication
- [x] RPD ad set explicitly paused after publication
- [ ] Creative A finishes Meta processing/review cleanly
- [ ] exact group image added high on landing page from clean asset
- [ ] final phone + desktop landing-page visual QA passes
- [ ] end-to-end purchase/entitlement test passes
- [ ] cross-device restore test passes
- [ ] Meta + GA4 funnel events visibly verified
- [ ] Creative B built or deliberately deferred for the first spend
- [ ] final preflight: destination URL, URL tags, Spanish translation, price, copy, CTA, pixel

After the gate passes, deliberately enable the campaign/ad set and run the information-buying test. Do not infer profitability from CTR/CPC alone.
