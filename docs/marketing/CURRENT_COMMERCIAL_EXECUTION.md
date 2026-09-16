# Current Commercial Execution — canonical roadmap

**Updated:** September 16, 2026  
**Owner:** Brice / Speed & Form  
**Instruction:** if Brice says only `continue`, take the first unblocked item below, execute it, record evidence here, then keep moving. Do not wait on a human-only blocker if another useful item is available.

## Operating law

1. **RPD is the active commercial priority.** Make the $79 funnel easy to understand, easy to buy, secure enough to sell, and recoverable if the first buyer hits a problem.
2. **Miami Run Development is the live control.** Do not rewrite a campaign that is attracting traffic and has already produced a genuine inquiry.
3. **Think deeply backstage. Speak simply out front.** A fit runner may know very little coaching vocabulary.
4. **Proof carries sophistication.** Real athletes, real sessions, and verified outcomes beat clever doctrine.
5. **Ad → landing → preview → checkout → access is one story.** Message match is required.
6. **Unbounce is research, not the production stack by default.** Borrow useful patterns; implement winners in `speedandform.com`.
7. **Real-world conversions outrank platform attribution.** Meta/GA are measurement systems, not the definition of whether a person converted.

Read first:
- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`
- `docs/marketing/RPD_OFFER_TRUTH_2026-09-15.md`
- `docs/RACE_PACE_DURABILITY_CANONICAL_v1.md`
- `docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`
- `docs/marketing/UNBOUNCE_PUBLIC_SWIPE_2026-09-16.md`

---

# A. Race Pace Durability — active priority

## Product truth — LOCKED

- 15-week half-marathon plan.
- Shared progression; athlete-relative race pace. **Not** a sub-1:30-only product.
- Roughly 45 → 60 miles/week, six days/week.
- Weeks 1–4 free/open preview.
- Weeks 5–15: **one-time payment of $79**.
- Web plan is complete; FORM app is separate and not required.
- Individual coaching is separate.
- No guaranteed finish time, fake personalization, fake scarcity, invented urgency, `secret`, or `hack` language.

## Meta Test 01 — PUBLISHED, SPEND PAUSED

Campaign:
- `FORM · RPD · Purchase Test 01`
- ID `52675684605200`
- Sales objective
- approximately $25/day
- Purchase optimization
- **paused**

Ad set:
- `US · Advantage+ · Purchase`
- ID `52675686707200`
- website / US / Purchase
- pixel `147659485878240`
- **paused**

Creative A:
- `Creative A · Can You Hold It? · v1`
- real FORM runners group photo
- Spanish translation enabled in the published draft
- Meta text generation allowed with truth filter
- intended URL tags:
  `utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=group_photo_v1`
- last human-visible state: processing/review

Reject generated variants that imply marathon, individualized programming, guaranteed outcomes, false urgency, secret/hack language, instant transformation, or false training mechanics.

### Current Meta blocker

Windsor still returns no RPD rows while the campaign has no delivery, and the connected automation browser is not authenticated to Ads Manager. Therefore review status and the final ad-level readback cannot be verified programmatically yet.

**Do not infer approval from time elapsed. Do not enable the parent campaign/ad set until Creative A is visibly accepted and the final ad settings are read back.**

## Landing page — LIVE + QA PASSED

English:
`/plans/race-pace-durability/support/`

Spanish:
`/es/plans/race-pace-durability/`

Story:
**Ad:** real FORM athletes + `Can you keep the pace?`  
**Landing:** same question → same FORM image → what this is → what you do → proof → try → buy.

Live proof asset:
`/assets/rpd/form-runners-miami.webp`

Current proof language:
- `FORM runners · Miami`
- `Real runners. Real training.`
- `This is FORM.`
- RPD is described truthfully as **one of** the plans used with FORM runners.

Accepted checks:
- hero and offer load;
- group image loads;
- free-preview CTA works;
- $79 CTA opens Stripe;
- Stripe shows `Race Pace Durability` at **$79.00**;
- no broken destination links found;
- 390px sales-page render passed with no clipping/overflow;
- latest `checkout.js` selector regression QA passed: the proof section receives the FORM photo, while the later App/Coaching section remains intact;
- purchase CTAs still point to the correct $79 Stripe checkout.

Latest proof-selector production commit:
`b2109537e51fd0c508f0afee9f0c1b97fac8bc9b`

Netlify deployed it successfully to production.

## Weeks 1–4 preview — HARDENED + QA PASSED

Route:
`/plans/race-pace-durability/`

Athlete-facing language:
- `Run the pace. Hold it longer.`
- `Try Weeks 1–4 free.`
- `Pick a pace you can run now.`

### Paid prescription security

The original frontend-only commercial gate is gone.

Current architecture:
- `public.public_plan(text)` is not executable by `anon` or `authenticated`;
- `public.public_plan_preview(text)` is the public door;
- Weeks 1–4 contain real prescription;
- Weeks 5–15 contain only week placeholders: no sessions, phase, intent, or volume;
- a paid browser gets the complete plan only through `rpd-entitlement` after a paid Checkout Session is verified.

Files:
- `plans/race-pace-durability/source.js`
- `supabase/functions/rpd-entitlement/index.ts`

Backend:
- `rpd-entitlement` ACTIVE v8
- `action=plan` serves the complete published plan only after entitlement verification.

Accepted evidence:
- public preview returns 15 week positions but Week 5+ prescription is empty;
- direct public `public_plan` access is denied;
- live browser QA confirms Weeks 1–4 readable and Week 5+ locked;
- live arrow navigation works;
- attempting to move past the free window routes toward the full-plan offer instead of revealing Week 5;
- no paid workout detail leaked;
- deterministic 390px mobile preview/locked-state render showed clean hierarchy and no clipping.

### Mobile residual

Literal finger-swipe behavior on a physical phone has not been reproduced by the automation browser. This is now treated as a **small interaction residual, not a launch blocker**, because:
- the phone-width visual state is accepted;
- the navigation controls work;
- the server never returns paid prescription to a nonbuyer;
- the same paywall outcome is available by arrow/tap.

Fix immediately if real traffic reports touch paging trouble.

## Stripe checkout + entitlement — READY; internal paid test waived

Live Payment Link:
`https://buy.stripe.com/bJeaEX1YvfNwgMX3Doffy00`

Facts:
- Race Pace Durability
- $79 USD
- one-time payment
- no subscription
- no phone collection
- success return carries Checkout Session ID

Attribution preflight passed without payment:
- landing UTMs persist into checkout;
- sanitized `client_reference_id` reaches the Stripe Checkout Session;
- success return preserves source labels.

Webhook:
- `stripe-rpd-webhook` ACTIVE v5
- live Stripe webhook endpoint enabled
- handles checkout completed / async success / refund / dispute
- writes campaign source into `product_entitlements.source`.

Entitlement store:
- 0 genuine paid rows before launch
- RLS enabled
- browser does not directly read the table.

### Owner decision

Brice explicitly declined the controlled $79 internal acceptance charge.

**Do not ask for that test again unless Brice explicitly reverses the decision.**

Residual risk accepted: the first genuine buyer will be the first full payment → webhook → entitlement → unlock → Purchase-event → restore proof.

First-buyer contingency:
1. monitor Stripe + entitlement + support inbox;
2. if payment succeeds but access fails, pause RPD spend immediately;
3. restore/repair access without another charge;
4. resume only after the path is repaired.

## RPD measurement — code present; pre-purchase event visibility incomplete

Implemented:
- Meta `ViewContent`
- GA4 `rpd_view`
- GA4 `begin_checkout`
- GA4 `rpd_checkout_start`
- Meta `InitiateCheckout`
- GA4 `purchase`
- GA4 `rpd_purchase`
- Meta `Purchase`
- browser refresh guard.

Privacy:
- DNT/GPC intentionally suppresses Meta/GA scripts/events;
- first-party campaign continuity still works;
- no email, card, health, or private athlete data is sent into ad attribution.

A tagged no-payment browser preflight reached Stripe successfully. GA4 has not yet surfaced the RPD custom events through Windsor. Treat that as incomplete measurement acceptance, not proof that the funnel is broken. Do not fabricate Purchase evidence.

The first genuine purchase will be the first post-purchase measurement acceptance.

## Creative B — READY, NOT A FIRST-LAUNCH BLOCKER

Hypothesis: product inspection / trust, distinct from Creative A's athlete/social-proof hook.

Static:
`rpd_creative_b_static_v2.png` · 1080×1350

Message:
- `See the first four weeks.`
- `Run them before you decide.`
- actual Week 4 prescription
- Week 5 locked
- one-time payment of $79.

Do not let manual upload delay the first Creative A test. Add B deliberately as the second hypothesis after A begins delivering, unless Brice explicitly wants both from day one.

## Spanish — first paid surface localized; execution remains partial

Done:
- Spanish sales page;
- language switch/handoff;
- same offer, price, proof, and group image.

Still English after the first sales surface:
- Weeks 1–4 preview;
- purchase confirmation;
- restore-access flow;
- workout instructions.

Do not claim a fully bilingual product yet. Before Spanish is intentionally scaled as its own acquisition strategy, localize the complete execution path. For this first broad test, monitor Spanish traffic rather than building a second product before evidence exists.

## Unbounce — public research captured; authenticated workspace still blocked

The TinyFish browser profile still reaches the Unbounce login wall even after Brice signs in in his normal browser.

Do not block RPD launch on this.

Public research is now parked in:
- `docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`
- `docs/marketing/UNBOUNCE_PUBLIC_SWIPE_2026-09-16.md`
- `docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

Unbounce health/wellness benchmark supports the simple-language direction: roughly 5th–7th grade copy had the strongest median conversion rate in that category. Treat as directional evidence, not a target guarantee.

Parked public ideas now exist for:
1. RPD tests after initial traffic;
2. FORM app;
3. Forge;
4. coaching homepage challenger.

## RPD launch gate — NOW DOWN TO META READBACK

Accepted:
- [x] product truth
- [x] no-decoding language rule
- [x] EN sales page
- [x] ES first sales surface
- [x] real athlete image continuity
- [x] desktop + 390px sales-page visual QA
- [x] free preview
- [x] server-side paid-week protection
- [x] live preview lock / arrow QA
- [x] 390px preview/locked-state visual QA
- [x] Stripe $79 checkout
- [x] attribution into Checkout Session
- [x] live webhook
- [x] paid entitlement delivery function
- [x] Creative A published
- [x] campaign + ad set paused
- [x] Creative B ready but not required
- [x] controlled $79 test waived with contingency documented

Remaining hard gate:
- [ ] **Creative A review/readback in Meta:** accepted/no policy error, correct destination, correct URL tags, Spanish translation setting, $79 offer/copy, CTA, and pixel `147659485878240`.

**Launch rule:** once that single Meta readback is green, deliberately enable Creative A / ad set / campaign at the existing approximately $25/day test budget. Do not wait for Unbounce, Creative B, or a paid internal test.

---

# B. Miami Run Development — LIVE CONTROL

Campaign:
`FORM · Miami · Run · Test 01`

Latest Windsor snapshot:
- spend: **$25.52**
- impressions: **1,239**
- clicks: **42**
- link clicks: **22**
- reach: **879**
- frequency: **1.41**

Last owner-reported Meta LPVs: **11**. Do not invent a newer LPV value when the current Windsor field set does not return it.

Real conversions:
- **1 genuine paid-social coaching inquiry: Jorge**
- no newer genuine inquiry found in Gmail.

Interpretation:
- traffic is still healthy;
- frequency is low, so there is no saturation signal;
- one real inquiry exists at roughly the $25-spend checkpoint;
- missing Meta `Lead` / GA4 `generate_lead` remains a measurement issue, not evidence of funnel failure.

**Decision: keep the campaign exactly as-is.** No budget, audience, creative, or page change now.

## Controlled measurement submission — RUN ONCE, still inconclusive

One unmistakable internal submission was completed:
- `TEST — Measurement Acceptance`
- success UI appeared;
- no duplicate submission occurred;
- Run · $1,200 / 8 weeks was selected.

The production code only shows success after FormSubmit returns `success=true`, then calls `window.formTrackLead()`.

Later checks still show:
- no GA4 `generate_lead` through Windsor;
- no matching test FormSubmit email in Gmail.

Do not repeat the test merely to force reporting.

Possible explanations:
- automation-browser GPC/DNT/content blocking;
- GA reporting lag;
- FormSubmit/Gmail delivery/indexing behavior;
- client analytics request did not reach provider.

Known Jorge delivery proves the production email path can work. Keep privacy behavior intact.

Protocol:
`docs/marketing/COACHING_MEASUREMENT_ACCEPTANCE_2026-09-15.md`

Working acquisition target remains 2 new Run Development starts/month; 3/month is stretch while delivery quality stays high.

---

# C. Queue for future `continue`

1. **Meta readback:** get Creative A review + tracking/settings confirmation. This is the only hard RPD launch gate left.
2. If readback is green, deliberately enable RPD Creative A / ad set / campaign at the existing ~$25/day budget.
3. Monitor first RPD traffic: LPV → preview interaction → checkout → purchase. Do not over-read the first handful of visits.
4. On first genuine RPD purchase, monitor Stripe → webhook → entitlement → unlock and execute contingency immediately if needed.
5. Continue Miami control unchanged; look for a second genuine inquiry before changing the offer or page.
6. Recheck coaching `Lead` / `generate_lead` later without repeating the test submission automatically.
7. Add Creative B as the second RPD hypothesis after initial A delivery, unless Brice explicitly wants both immediately.
8. If authenticated Unbounce access finally works, audit RPD first and then deepen the parked FORM / Forge / coaching ideas.
9. Localize the full Spanish RPD execution path only when Spanish traffic or purchase intent justifies the work, or earlier if Brice chooses bilingual completeness as a product requirement.

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and the result do the sophisticated talking.**
