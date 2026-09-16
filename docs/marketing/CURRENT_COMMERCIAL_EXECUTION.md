# Current Commercial Execution — canonical roadmap

**Updated:** September 16, 2026  
**Owner:** Brice / Speed & Form  
**Instruction:** if Brice says only `continue`, take the first unblocked item below, execute it, record evidence, then keep moving. Do not wait on a human-only blocker if another useful item is available.

## Operating law

1. **RPD is the active commercial priority.** Make the $79 funnel understandable, trustworthy, secure enough for sale, and operationally recoverable before spend.
2. **Miami Run Development is a live control.** Do not rewrite the live campaign mid-test.
3. **Think deeply backstage. Speak simply out front.** A fit or fast runner may know almost no coaching vocabulary.
4. **Proof carries sophistication.** Real athletes, sessions, and verified results beat clever doctrine.
5. **Ad → landing page → preview → checkout → delivery is one story.** Message match is a launch requirement.
6. **Unbounce is research, not the production stack by default.** Borrow conversion patterns; implement winners in speedandform.com.
7. **Real-world conversions outrank platform reporting.** Meta/GA are measurement systems, not the definition of whether a human inquiry happened.

---

# A. Race Pace Durability — active priority

## Product truth — LOCKED

- 15-week half-marathon plan.
- Shared progression, athlete-relative race pace; not a sub-1:30-only product.
- Roughly 45 → 60 miles/week, six days/week.
- Weeks 1–4 free/open preview.
- Complete plan: **one-time payment of $79**.
- Web plan is complete; FORM app is separate and not required.
- Individual coaching is separate.
- No guaranteed finish time, fake personalization, fake scarcity, invented urgency, or secret/hack language.

Read:
- `docs/marketing/RPD_OFFER_TRUTH_2026-09-15.md`
- `docs/RACE_PACE_DURABILITY_CANONICAL_v1.md`
- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`

## Meta Test 01 — published, spend still paused

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
- last human-visible state after publication: processing/review

Reject generated copy that says/implies marathon, individualized programming, guaranteed outcome, false urgency, secret/hack, instant transformation, or false training mechanics.

**Do not enable campaign/ad set until Creative A review status and mobile QA are confirmed.**

## Landing page continuity — LIVE + pre-purchase QA passed

English sales page:
`/plans/race-pace-durability/support/`

Spanish sales page:
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
- RPD is truthfully described as **one of** the plans used with FORM runners.

Live browser pre-purchase QA on Sep 16 passed:
- landing page loads;
- hero/offer copy present;
- group image loads;
- Weeks 1–4 CTA routes to free preview;
- $79 CTA opens Stripe;
- Stripe shows `Race Pace Durability` at **$79.00**;
- no broken destination links or price mismatch found;
- no purchase entered.

True phone-width / physical-device acceptance remains open.

## Weeks 1–4 preview — HARDENED + QA PASSED

Route:
`/plans/race-pace-durability/`

Plain language:
- `Run the pace. Hold it longer.`
- `Try Weeks 1–4 free.`
- `Pick a pace you can run now.`

### Important Sep 16 security change

The earlier gate was only a commercial UI gate: the browser could still call the public plan RPC and receive Weeks 5–15. That is no longer true.

Database migration:
`supabase/migrations/20260916033000_rpd_paid_plan_server_only.sql`

Current behavior:
- `public.public_plan(text)` is no longer executable by `anon` or `authenticated`; only `service_role` can call the complete published plan.
- public browser uses `public.public_plan_preview(text)`.
- preview payload still contains 15 week placeholders so the UI can show the full structure/locks.
- Weeks 1–4 include real prescription.
- Weeks 5–15 return no sessions, no phase/intent, and no weekly volume.
- paid browser requests the complete plan through `rpd-entitlement` only after a paid entitlement is verified.

Client source:
`plans/race-pace-durability/source.js`

Paid delivery function now source-controlled:
`supabase/functions/rpd-entitlement/index.ts`

Deployed function:
- `rpd-entitlement` **v8**, ACTIVE
- action `plan` returns the full `public_plan` only after the supplied Checkout Session resolves to a paid RPD entitlement.

Acceptance evidence:
- anon role can call `public_plan_preview`;
- Week 5 preview sessions are empty;
- anon direct call to `public_plan` returns permission denied;
- live browser QA after deployment confirmed Weeks 1–4 readable, Week 5+ locked, no paid prescription visible, 15-week structure intact, and upgrade CTA functioning.

This materially upgrades the $79 offer from a frontend-only gate to server-authorized delivery of paid weeks.

## Stripe checkout + entitlement — READY, internal paid test waived

Live Payment Link:
`https://buy.stripe.com/bJeaEX1YvfNwgMX3Doffy00`

Checkout facts:
- Race Pace Durability
- $79 USD
- one-time payment
- no subscription
- no phone collection
- success return carries Checkout Session ID

Attribution preflight already accepted without payment:
- campaign UTMs are preserved;
- sanitized `client_reference_id` reaches the Stripe Checkout Session;
- success return preserves source UTMs.

Webhook:
- `stripe-rpd-webhook` ACTIVE v5
- Stripe endpoint enabled
- listens for checkout completion/async success/refund/dispute
- writes campaign source into `product_entitlements.source`

Entitlement store:
- current count remains 0 paid rows before launch
- RLS enabled
- browser does not directly read the entitlement table

### Owner decision
Brice explicitly declined the controlled $79 internal acceptance charge.

**Do not ask to run or charge a $79 test again unless Brice explicitly reverses this decision.**

Residual risk accepted:
- first genuine customer becomes the first full production proof of payment → webhook → entitlement → unlock → purchase-event → restore.

First-buyer contingency:
- monitor Stripe + entitlement + support inbox;
- if payment succeeds but access fails, pause RPD spend immediately;
- repair/restore access without another charge;
- resume only after the path is repaired.

## Measurement — code present; visible pre-purchase acceptance still partial

Client-side events:
- Meta `ViewContent`
- GA4 `rpd_view`
- GA4 `begin_checkout`
- GA4 `rpd_checkout_start`
- Meta `InitiateCheckout`
- GA4 `purchase`
- GA4 `rpd_purchase`
- Meta `Purchase`
- refresh guard on Purchase

Privacy:
- DNT/GPC intentionally suppresses Meta/GA scripts/events;
- first-party checkout source continuity still works when analytics is suppressed;
- no email/card/health/private athlete data is sent into campaign attribution.

A tagged Sep 16 browser preflight successfully completed landing → Stripe with no payment. Windsor/GA4 has not yet surfaced the corresponding RPD custom events; this remains inconclusive because automation browsers may expose privacy controls and GA reporting can lag.

Do not invent Purchase evidence. First genuine purchase will be the first post-purchase measurement acceptance.

## Creative B — READY, intentionally not first launch blocker

Hypothesis: **product inspection / trust**, distinct from Creative A's athlete/social-proof hook.

Message:
- `See the first four weeks.`
- `Run them before you decide.`
- real RPD Week 4 prescription
- `Weeks 1–4 free`
- `Full plan · one-time payment of $79`

Static candidate exported:
`rpd_creative_b_static_v2.png` (1080 × 1350)

Uses canonical Week 4 facts, not generated workout content.

Decision for first spend: **Creative B may be deferred.** Do not let manual upload delay Creative A launch. Launch A cleanly first if the remaining gate is green; add B as the second hypothesis after initial delivery or when Brice wants the comparison.

## English / Spanish parity — sales page done, execution partial

Done:
- EN + ES sales pages
- language switch/handoff
- same offer, price, and group-photo proof

Open before Spanish is scaled materially:
- Spanish Weeks 1–4 interface
- Spanish confirmation
- Spanish restore-access
- Spanish workout instructions

## Unbounce research — still blocked by connector authentication

Research docs:
- `docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`
- `docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

TinyFish connector repeatedly reaches the Unbounce login wall even after Brice logs in in his normal browser; the session is not persisting into the connector browser profile.

Do not block RPD launch on Unbounce.

When authenticated access works:
1. audit RPD first;
2. park FORM app ideas;
3. park Forge ideas;
4. park alternative coaching-homepage ideas.

## RPD launch gate

- [x] product truth reconciled
- [x] no-decoding athlete-language rule
- [x] EN $79 page
- [x] ES $79 page
- [x] real FORM group image continuity
- [x] desktop landing-page QA
- [x] pre-purchase landing → Stripe QA
- [x] Weeks 1–4 preview
- [x] Weeks 5–15 server-side prescription redaction for public users
- [x] full paid plan callable only through verified entitlement path
- [x] preview/paywall browser QA after hardening
- [x] Stripe Payment Link / price accepted
- [x] campaign source → Stripe Checkout Session accepted pre-payment
- [x] Stripe webhook ACTIVE + read back
- [x] `rpd-entitlement` v8 ACTIVE
- [x] Creative A published
- [x] campaign paused
- [x] ad set paused
- [x] Creative B asset ready but not required for first launch
- [x] controlled $79 test explicitly waived by owner
- [ ] Creative A review completes without policy/config error
- [ ] phone-width / physical-device sales + preview QA
- [ ] final Meta preflight: destination, URL tags, translation, price, CTA, pixel

**Launch rule:** when those three remaining checks are green, enable Creative A / ad set / campaign and begin the ~$25/day information-buying test. Do not wait for Unbounce or Creative B.

---

# B. Miami Run Development — LIVE CONTROL

Campaign:
`FORM · Miami · Run · Test 01`

Latest owner-provided snapshot Sep 15:
- spend: **$20.62**
- impressions: **1,047**
- clicks: **37**
- link clicks: **17**
- Meta landing-page views: **11**
- GA4 `meta / paid_social` sessions across Sep 14–15: **13**
- genuine paid-social coaching inquiries: **1** (Jorge)
- Meta attributed leads: **0**
- GA4 `generate_lead`: **0**
- no newer coaching inquiry beyond Jorge

Traffic reconciliation improved materially: GA4 caught up from 5 to 13 paid-social sessions, so ad → site measurement now looks credible.

The unresolved problem is only the conversion event attribution. One genuine inquiry exists even though Meta/GA have not credited `Lead` / `generate_lead`.

**Decision: keep the campaign exactly as-is.** No budget, targeting, creative, or page changes now.

Next decision point:
- ~15–20 Meta landing-page views, or
- roughly $25–30 spend,
- unless another genuine inquiry or technical problem occurs first.

If `Lead` / `generate_lead` is still missing at the next measurement checkpoint, run the documented controlled tagged submission while watching Meta Test Events + GA4 Realtime/DebugView before changing acquisition.

Protocol:
`docs/marketing/COACHING_MEASUREMENT_ACCEPTANCE_2026-09-15.md`

Do not weaken GPC/DNT behavior just to improve attribution.

Working target: 2 new Run Development starts/month; 3/month stretch only while delivery quality stays high.

---

# C. Parked Unbounce surfaces

Use the free trial to harvest patterns, not to create four simultaneous production projects.

Priority when authenticated:
1. RPD conversion audit
2. FORM app landing-page ideas
3. Forge landing-page ideas
4. alternative coaching homepage

Capture for each:
- template/pattern names
- mobile hierarchy
- hero/CTA structure
- proof/pricing sequence
- useful AI copy variants
- rejected hype/false claims
- implementation notes for speedandform.com

---

# D. Queue for any future `continue`

1. Check Creative A Meta review/status when available. Keep RPD parents paused until accepted.
2. Obtain true phone-width / physical-device RPD sales + preview QA; fix only material issues.
3. Run final Meta preflight: destination, URL tags, Spanish translation, price, CTA, pixel.
4. If all three are green, enable RPD Creative A / ad set / campaign at the existing ~$25/day test budget.
5. Continue watching Miami control unchanged until ~15–20 LPVs / $25–30 or a new inquiry.
6. If Miami `Lead` / `generate_lead` remains absent at checkpoint, run the controlled measurement acceptance test.
7. On first genuine RPD purchase, monitor Stripe → webhook → entitlement → unlock closely and execute contingency if needed.
8. Add Creative B only as a deliberate second hypothesis; do not let it delay first spend.
9. If Unbounce connector authentication starts working, audit RPD first, then park FORM / Forge / coaching ideas.

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and the result do the sophisticated talking.**
