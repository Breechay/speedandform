# Current Commercial Execution — canonical roadmap

**Updated:** September 15, 2026, after Creative B build and free-preview gate QA  
**Owner:** Brice / Speed & Form  
**Instruction:** if Brice says only `continue`, take the first unblocked item in the queue, execute it, record evidence, then keep moving. Do not wait on a human-only blocker if another useful item is available.

## Operating law

1. **RPD is the active commercial priority.** Make the $79 funnel trustworthy before expanding active execution elsewhere.
2. **Miami Run Development is a live control.** Do not rewrite the live control mid-test; build challengers separately.
3. **Think deeply backstage. Speak simply out front.** A fast runner may still know little coaching vocabulary.
4. **Proof carries sophistication.** Real athletes, sessions and verified outcomes beat clever doctrine.
5. **Ad → landing page → checkout → delivery is one story.** Message match is a launch requirement.
6. **Unbounce is research, not the production stack by default.** Borrow conversion patterns; implement winners in speedandform.com.
7. **Do not call paid acquisition successful from CTR/CPC.** Purchase, execution, outcome and economics matter.

---

# A. Race Pace Durability — active priority

## Product truth — DONE

- 15-week half-marathon plan.
- Athlete-relative race pace; not a sub-1:30-only product.
- Shared progression, individual pace.
- Roughly 45 → 60 miles/week, six days/week.
- Weeks 1–4 free/open preview.
- Complete plan: **one-time payment of $79**.
- RPD is complete on the web; FORM app is separate and not required.
- Individual coaching is separate.
- No guaranteed finish time, fake personalization, fake scarcity or invented urgency.

Read:
- `docs/marketing/RPD_OFFER_TRUTH_2026-09-15.md`
- `docs/RACE_PACE_DURABILITY_CANONICAL_v1.md`
- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`

## Meta Test 01 — Creative A published; spend paused

Campaign:
- `FORM · RPD · Purchase Test 01`
- ID `52675684605200`
- Sales objective
- $25/day
- Purchase optimization
- **paused**

Ad set:
- `US · Advantage+ · Purchase`
- ID `52675686707200`
- US / website / Purchase / pixel `147659485878240`
- **paused**

Creative A:
- `Creative A · Can You Hold It? · v1`
- real FORM runners group photo
- Spanish translation enabled
- Meta text generation allowed with truth filter
- intended URL tags:
  `utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=group_photo_v1`
- last human-visible state after publication: `Processing`

Reject generated copy that says/implies marathon, individualized programming, guaranteed outcome, false urgency, secret/hack, instant transformation, or false training mechanics.

Meta review status remains a human/session blocker: the connected browser is not authenticated to Meta, and Windsor reporting does not yet surface this no-delivery campaign. **Do not enable the known parent IDs until review/preflight is confirmed.**

## Landing page continuity — LIVE, desktop QA passed

English:
`/plans/race-pace-durability/support/`

Spanish:
`/es/plans/race-pace-durability/`

Story:

**Ad:** real FORM athletes + `Can you keep the pace?`  
**Landing:** same question → same real FORM image → what this is → what you do → proof → try → buy.

Live group asset:
`/assets/rpd/form-runners-miami.webp`

Proof block:
- `FORM runners · Miami`
- `Real runners. Real training.`
- `This is FORM.`
- RPD is described truthfully as **one of** the plans used with FORM runners.

Desktop browser QA passed in English and Spanish. True 390px/physical-device acceptance remains open because the connected browser cannot resize its viewport.

## Weeks 1–4 preview — LIVE + gate QA passed

Route:
`/plans/race-pace-durability/`

Athlete-facing context now uses plain language:
- `Run the pace. Hold it longer.`
- `Try Weeks 1–4 free.`
- `Pick a pace you can run now.`
- shorter efforts → 5 → 6 → 8 → 12 late → race.

Read-only live gate QA passed Sep 15:
- Weeks 1–4 readable for non-buyers;
- Week 5+ content remains locked;
- no paid prescription leakage found;
- next-arrow / lock CTA / Full Plan button route non-buyers to the $79 sales page;
- no Stripe payment entered during QA.

## English / Spanish parity — partial

Done:
- EN + ES sales page
- language handoff/switch
- same offer, price and group-photo proof

Open before Spanish is scaled meaningfully:
- Spanish Weeks 1–4 interface
- Spanish purchase confirmation
- Spanish restore-access surface
- Spanish workout instructions

## Stripe checkout — pre-payment path ACCEPTED

Live Payment Link:
`https://buy.stripe.com/bJeaEX1YvfNwgMX3Doffy00`

- Race Pace Durability
- $79 USD
- one-time payment
- no subscription
- no phone collection
- success return includes `{CHECKOUT_SESSION_ID}`

Production checkout anchors now prewrite:
- supported UTM parameters;
- a sanitized non-sensitive Stripe `client_reference_id`.

Accepted live production test:
- source: `qa5 / internal / rpd_prewrite_acceptance / group_photo_codepath`
- resulting Checkout Session:
  `cs_live_a1MwavR7AwNwYXKIOl7lltlBlhhEEH94zTh5MfMrjQArKfU2zkQHh2DVbx`
- amount: `7900` cents
- status: unpaid
- client reference preserved exactly:
  `rpd__s_qa5__m_internal__c_rpd_prewrite_acceptance__x_group_photo_codepath`
- success redirect preserved the QA UTMs
- no personal/payment data submitted

Read:
`docs/marketing/RPD_ATTRIBUTION_ACCEPTANCE_2026-09-15.md`

## Stripe webhook / entitlement — source ready, Supabase management blocked

Source-controlled target:
`supabase/functions/stripe-rpd-webhook/index.ts`

Target behavior:
- receive Stripe completion/refund/dispute events;
- parse `client_reference_id` into source labels;
- write source into `product_entitlements.source`;
- preserve paid/refunded/disputed entitlement state.

**Current blocker:** Supabase management calls repeatedly return upstream HTTP `502`, including Edge Function list/read and SQL during this outage. Do not blindly overwrite the active webhook.

When Supabase recovers:
1. read current deployed webhook;
2. deploy attribution-aware source-controlled version;
3. read back deployed version;
4. record entitlement count before paid acceptance;
5. prove source JSON with the controlled paid test.

Before the outage, `product_entitlements` had 0 rows and RLS was enabled.

## Real purchase — HUMAN APPROVAL REQUIRED

Prepared checklist:
`docs/marketing/RPD_REAL_PURCHASE_ACCEPTANCE_CHECKLIST_2026-09-15.md`

Do **not** charge $79 until Brice explicitly approves the live acceptance purchase.

The paid test must prove:
- Stripe payment
- webhook 2xx
- one paid entitlement
- campaign source stored
- confirmation verifies automatically
- Weeks 5–15 unlock
- Purchase fires once at $79
- refresh does not duplicate Purchase
- clean-device/email restore works without another charge

Optional refund-path acceptance requires separate explicit approval because processing costs may remain.

## Measurement — built; acceptance partial

Client-side:
- Meta `ViewContent`
- `rpd_view`
- GA4 `begin_checkout`
- `rpd_checkout_start`
- Meta `InitiateCheckout`
- GA4 `purchase`
- `rpd_purchase`
- Meta `Purchase`
- browser refresh guard

Privacy:
- first-party campaign continuity is independent of analytics runtime;
- DNT/GPC still prevents Meta/GA scripts/events;
- attribution contains no email, card, health or private athlete data.

GA4 connector has not yet shown an accepted RPD custom-event/purchase sequence. QA browser privacy settings make its missing analytics events inconclusive.

Before meaningful spend, verify where available:
- ViewContent
- begin checkout / InitiateCheckout
- source labels
- after live paid acceptance: Purchase exactly once, value 79 USD

CAPI + browser/server dedupe remain later-before-scale work.

## Creative B — BUILD READY + live board QA passed

Hypothesis: **product inspection / trust**, not another identity/social-proof hook.

Hidden screenshot/render board:
`/ads/rpd/preview/`

Visual message:
- `See the first four weeks.`
- `Run them before you decide.`
- actual embedded Race Pace Durability plan surface
- `Weeks 1–4 free`
- `Full plan · one-time payment of $79`

Read-only live visual QA passed:
- real plan data visible;
- iframe not blank;
- no clipping detected;
- hierarchy is clear;
- free vs locked weeks and $79 offer are legible.

Next Creative B step is export/capture into a Meta-ready static asset and manual upload, because ad-level API mutations remain unreliable. Do not substitute generated fake workout imagery.

## Unbounce research — blocked only by login

Public research:
`docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`

Four-surface brief:
`docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

A fresh authenticated-browser attempt again reached Unbounce's login wall. No credentials are stored in the connector.

Human step when convenient: Brice logs into Unbounce in the connected browser profile. Never send password in chat.

Then:
1. RPD conversion audit
2. park FORM app ideas
3. park Forge ideas
4. park coaching-homepage challenger ideas

## RPD launch gate

- [x] product truth reconciled
- [x] athlete-language/no-decoding rule
- [x] EN $79 sales page simplified
- [x] ES sales page
- [x] exact Meta group image high on EN + ES
- [x] desktop visual QA
- [x] Weeks 1–4 copy simplified
- [x] Weeks 1–4 / Week 5+ gate QA passed
- [x] Stripe live Payment Link active
- [x] landing page → Stripe $79 path accepted
- [x] landing source → Stripe Checkout Session attribution accepted pre-payment
- [x] webhook signing secret configured
- [x] entitlement/restore code exists
- [x] Creative A published
- [x] campaign paused
- [x] ad set paused
- [x] Creative B live render board built + QA passed
- [x] real-purchase acceptance checklist prepared
- [ ] phone-width / physical-device landing-page visual QA
- [ ] Creative A review completes without policy/config error
- [ ] Meta/GA4 pre-purchase events visibly accepted where privacy settings allow
- [ ] Supabase management recovers
- [ ] attribution-aware webhook deployed + read back
- [ ] controlled real purchase succeeds
- [ ] paid entitlement contains expected source labels
- [ ] Purchase fires once at $79
- [ ] cross-device restore succeeds
- [ ] Creative B captured/uploaded or deliberately deferred
- [ ] final preflight: destination, URL tags, translation, price, CTA, pixel

Only after gate: deliberately enable campaign/ad set and begin the ~$25/day information-buying test.

---

# B. Miami Run Development — live control

Campaign:
`FORM · Miami · Run · Test 01`

Do not rewrite the live control. It has already produced at least one genuine paid-social coaching inquiry.

Future challenger should be separate. Seed plain language such as:
- `Running coaching in Miami`
- `Want to get better at running?`

Let Meta generate alternatives, truth-filter them, and compare qualified inquiry / paid-client quality, not CTR alone.

Working target: 2 new Run Development starts/month; 3/month is stretch only while delivery quality stays high.

---

# C. Unbounce parked surfaces after RPD

Use trial for learning, not four simultaneous production builds.

Priority:
1. RPD — active
2. FORM app landing page — park ideas
3. Forge landing page — park ideas
4. coaching homepage challenger — park ideas

For each parked surface capture template/pattern names, mobile hierarchy, hero/CTA, proof/pricing sequence, copy worth testing, rejected ideas, and implementation notes. Do not claim unshipped app features.

---

# D. Queue for any future `continue`

Take the first unblocked item; move on when a human/tool blocker appears:

1. Retry Supabase management; when healthy read/deploy/read-back the attribution-aware webhook.
2. Capture/export Creative B into a Meta-ready static asset if tooling permits; otherwise leave the truthful live render board ready for manual capture.
3. Check Creative A review/status when Meta session/data exposes it; parents stay paused.
4. Run true phone-width/physical-device QA when an actual mobile viewport or Brice screenshot is available.
5. Verify pre-purchase Meta/GA events without inventing Purchase evidence.
6. If Unbounce is logged in, run authenticated RPD audit and implement only truthful/high-value improvements.
7. After Brice explicitly approves $79 acceptance, run payment → webhook → source → entitlement → unlock → event → restore.
8. Run final Meta preflight.
9. Enable Test 01 only when launch gate is green.
10. Then harvest/park Unbounce ideas for FORM, Forge and coaching challenger and continue watching Miami control.

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and the result do the sophisticated talking.**
