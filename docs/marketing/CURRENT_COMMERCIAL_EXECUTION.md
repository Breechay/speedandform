# Current Commercial Execution — canonical roadmap

**Updated:** September 15, 2026, after RPD webhook v5 deployment/read-back and Creative B static export  
**Owner:** Brice / Speed & Form  
**Instruction:** if Brice says only `continue`, take the first unblocked item in the queue, execute it, record evidence, then keep moving. Do not wait on a human-only blocker if another useful item is available.

## Operating law

1. **RPD is the active commercial priority.** Make the $79 funnel understandable, trustworthy and operationally recoverable before spend.
2. **Miami Run Development is a live control.** Do not rewrite the live campaign mid-test; build challengers separately.
3. **Think deeply backstage. Speak simply out front.** A fit or fast runner may still know very little coaching vocabulary.
4. **Proof carries sophistication.** Real athletes, sessions and verified outcomes beat clever doctrine.
5. **Ad → landing page → checkout → delivery is one story.** Message match is a launch requirement.
6. **Unbounce is research, not the production stack by default.** Borrow conversion patterns; implement winners in speedandform.com.
7. **Real-world conversions outrank platform reporting.** Meta/GA are measurement systems, not the definition of whether a human inquiry happened.

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

**Do not enable the known parent IDs until review/preflight is confirmed.** The connected automation browser is not authenticated to Meta, and Windsor reporting still does not expose this paused/no-delivery hierarchy reliably.

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

Desktop browser QA passed in English and Spanish. True phone-width / physical-device acceptance remains open because the connected browser cannot resize its viewport.

## Weeks 1–4 preview — LIVE + gate QA passed

Route:
`/plans/race-pace-durability/`

Plain athlete-facing language:
- `Run the pace. Hold it longer.`
- `Try Weeks 1–4 free.`
- `Pick a pace you can run now.`
- shorter efforts → 5 → 6 → 8 → 12 late → race.

Live gate QA passed Sep 15:
- Weeks 1–4 readable for non-buyers;
- Week 5+ remains locked;
- no paid prescription leakage found;
- next-arrow / lock CTA / Full Plan button route non-buyers to the $79 sales page.

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

Production checkout anchors prewrite supported UTM parameters plus a sanitized non-sensitive Stripe `client_reference_id`.

Accepted production QA session:
- `cs_live_a1MwavR7AwNwYXKIOl7lltlBlhhEEH94zTh5MfMrjQArKfU2zkQHh2DVbx`
- amount: 7900 cents
- unpaid
- source/client reference preserved
- success redirect preserved source UTMs
- no personal/payment data submitted

Read:
`docs/marketing/RPD_ATTRIBUTION_ACCEPTANCE_2026-09-15.md`

## Stripe webhook / entitlement — DEPLOYED + READ BACK

Source of truth:
`supabase/functions/stripe-rpd-webhook/index.ts`

Supabase management recovered on Sep 15. Actions completed:
1. read existing deployed `stripe-rpd-webhook` v4;
2. compared it with source-controlled attribution-aware version;
3. deployed the source-controlled version;
4. read the deployed function back successfully.

Current deployed function:
- slug: `stripe-rpd-webhook`
- status: ACTIVE
- version: **5**
- `verify_jwt=false` because Stripe signature verification is the custom authentication boundary.
- parses Stripe `client_reference_id` into `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`;
- merges those labels into `product_entitlements.source`;
- handles completed/async-success checkout, refunds and disputes.

Stripe live webhook endpoint read-back:
- endpoint ID `we_1UG0dvHGsg6qTR3LFZTgoyvM`
- status: enabled
- URL: `https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/stripe-rpd-webhook`
- events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`.

Database read after deployment:
- `product_entitlements`: **0 rows**
- paid rows: **0**
- `source` column exists as non-null `jsonb`.

No fake/synthetic paid entitlement was created.

## Real purchase acceptance — WAIVED BY OWNER

Brice explicitly declined the controlled $79 acceptance charge on September 15, 2026.

**Do not ask to run or charge a $79 test again unless Brice explicitly changes this decision.**

The prepared checklist remains archived at:
`docs/marketing/RPD_REAL_PURCHASE_ACCEPTANCE_CHECKLIST_2026-09-15.md`

Residual risk accepted by owner:
- first genuine customer becomes the first complete production proof of payment → webhook → entitlement → unlock → purchase-event → restore behavior.

First-buyer mitigation:
- watch Stripe + entitlement state + support inbox closely;
- if payment succeeds but access fails, pause RPD spend immediately;
- repair/restore access without asking the buyer to pay again;
- resume only after the path is repaired.

The internal paid test is **not** a launch-gate requirement.

## Measurement — built; pre-purchase acceptance partial

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

GA4 has not yet shown an accepted RPD custom-event sequence. QA browser privacy settings make missing analytics events inconclusive. Verify pre-purchase events where possible before first spend; post-purchase measurement will be observed on the first genuine purchase.

CAPI + browser/server dedupe remain later-before-scale work.

## Creative B — STATIC CANDIDATE READY

Hypothesis: **product inspection / trust**, materially different from Creative A's athlete/identity hook.

Hidden live render board:
`/ads/rpd/preview/`

Message:
- `See the first four weeks.`
- `Run them before you decide.`
- real RPD prescription detail
- `Weeks 1–4 free`
- `Full plan · one-time payment of $79`

A 1080 × 1350 static candidate was exported in the current ChatGPT conversation as:
`rpd_creative_b_static_v2.png`

It uses exact Week 4 plan facts from the canonical plan:
- Mon Easy 6 mi
- Tue Race pace 5 mi continuous
- Wed Easy 6 mi
- Thu Recovery + strides 6 mi
- Fri Easy 7 mi
- Sat Long run 12 mi
- Week 5 shown locked at $79

No generated/fake workout imagery is used. Manual Meta upload is still required because ad-level API mutation remains unreliable.

## Unbounce research — blocked only by login

Public research:
`docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`

Four-surface brief:
`docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

Authenticated browser still reaches Unbounce's login wall. Human step when convenient: Brice logs into Unbounce in the connected browser profile. Never send password in chat.

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
- [x] attribution-aware Stripe webhook deployed as Supabase v5 and read back
- [x] live Stripe webhook endpoint enabled with required event set
- [x] entitlement/restore code exists
- [x] Creative A published
- [x] campaign paused
- [x] ad set paused
- [x] Creative B live render board built + QA passed
- [x] Creative B static 4:5 candidate exported
- [x] controlled $79 test explicitly waived by owner; residual risk documented
- [ ] phone-width / physical-device landing-page visual QA
- [ ] Creative A review completes without policy/config error
- [ ] RPD pre-purchase Meta/GA4 events visibly accepted where privacy settings allow
- [ ] Creative B manually uploaded or deliberately deferred from first spend
- [ ] final preflight: destination, URL tags, translation, price, CTA, pixel

Only after the remaining gate is green: deliberately enable campaign/ad set and begin the ~$25/day information-buying test.

---

# B. Miami Run Development — live control + measurement discrepancy

Campaign:
`FORM · Miami · Run · Test 01`

Latest reported snapshot Sep 15:
- spend: $12.90
- impressions: 679
- clicks: 20
- link clicks: 9
- landing-page views: 6
- genuine coaching inquiries: 1
- Meta attributed leads: 0
- GA4 `generate_lead` from `meta / paid_social`: 0
- GA4 paid-social sessions across Sep 14–15: 5
- no newer coaching inquiry beyond the known one

**Decision: do not change the campaign.** No budget, targeting, creative, or page change from this discrepancy alone.

The real-world funnel completed because the inquiry reached the inbox with paid-social campaign source. Platform lead reporting has not credited it.

Code-path inspection confirms:
- FormSubmit delivery is independent of analytics;
- `formTrackLead()` runs only after FormSubmit reports success;
- it sends Meta `Lead` + GA4 `generate_lead`;
- GPC/DNT deliberately suppress those analytics events while allowing the inquiry to deliver.

Plausible explanations:
- reporting lag;
- GPC/DNT or tracking/ad blocking on the actual lead's browser;
- client-side event delivery issue.

Do not weaken privacy behavior to improve attribution.

If the lead is still absent tomorrow, run one controlled tagged inquiry while watching Meta Test Events + GA4 Realtime/DebugView. Protocol:
`docs/marketing/COACHING_MEASUREMENT_ACCEPTANCE_2026-09-15.md`

A manual tagged test proves event delivery, not true Meta campaign attribution, because it does not reproduce a real Meta click ID.

Search Console signal reported Sep 15:
- Sep 14: 2 clicks from 6 impressions.

Encouraging, but too little volume for SEO action.

Working target remains 2 new Run Development starts/month; 3/month is stretch only while delivery quality stays high.

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

1. Check Creative A review/status when Meta session/data exposes it; parents stay paused.
2. Run true phone-width / physical-device RPD sales + preview QA when an actual mobile viewport or Brice screenshots are available.
3. Verify RPD pre-purchase Meta/GA events without inventing Purchase evidence.
4. Decide whether Creative B joins first spend; if yes, manually upload `rpd_creative_b_static_v2.png`, otherwise record deliberate deferral.
5. If Unbounce is logged in, run authenticated RPD audit and implement only truthful/high-value improvements.
6. Run final RPD Meta preflight; enable only when the remaining gate is green.
7. If Miami coaching Lead / `generate_lead` is still missing tomorrow, run the documented controlled measurement test before changing acquisition.
8. Continue watching the Miami control without rewriting it.
9. After RPD launch, harvest/park Unbounce ideas for FORM, Forge and coaching challenger.
10. On first genuine RPD purchase, monitor Stripe/webhook/entitlement/access closely and execute contingency if access fails.

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and the result do the sophisticated talking.**
