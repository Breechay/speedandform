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

Windsor reporting does not return the unpublished/no-delivery RPD hierarchy, so it cannot currently confirm review state. The TinyFish browser is not authenticated to Meta Ads Manager. **Do not infer review approval from time elapsed.**

**Do not enable campaign/ad set until Creative A review status and the last mobile preview check are confirmed.**

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

### Mobile sales-page visual acceptance — PASSED at 390px

A deterministic 390px render of the current sales composition was inspected on Sep 16. It preserved:
- readable hero hierarchy;
- the real FORM group image without destructive cropping;
- stacked CTAs with clear primary/secondary priority;
- four offer facts in a legible 2×2 grid;
- `This is FORM` proof continuity;
- progression, fit/not-yet cards, deliverables, $79 offer card, and final CTA without overflow or clipping.

No mobile sales-page design change is required before launch.

This was a local 390px render of the current production-equivalent composition, not a physical-device network session. The remaining mobile launch check is the **live free-preview interaction on an actual phone-width/device**, especially horizontal paging/locks.

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

Paid delivery function:
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
- [x] 390px sales-page visual QA
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
- [ ] live phone-width/device free-preview paging + lock QA
- [ ] final Meta preflight: destination, URL tags, translation, price, CTA, pixel

**Launch rule:** when those three remaining checks are green, enable Creative A / ad set / campaign and begin the ~$25/day information-buying test. Do not wait for Unbounce or Creative B.

---

# B. Miami Run Development — LIVE CONTROL

Campaign:
`FORM · Miami · Run · Test 01`

### Latest connector snapshot — Sep 16

Windsor now reports:
- spend: **$25.52**
- impressions: **1,239**
- clicks: **42**
- link clicks: **22**
- reach: **879**
- frequency: **1.41**

Last known Meta landing-page views from the owner-provided checkpoint: **11**. Windsor's current field set did not expose LPV in the latest read, so do not invent a newer LPV number.

Real-world conversions:
- genuine paid-social coaching inquiries: **1** (Jorge)
- no newer genuine inquiry found in Gmail
- Meta attributed leads: still not accepted as reliable evidence
- GA4 `generate_lead`: still absent in the latest connector read

Traffic-side efficiency remains healthy enough to hold. Frequency is low, so there is no saturation signal.

**Decision: keep the campaign exactly as-is.** No budget, targeting, creative, or page changes now.

### Controlled measurement acceptance — RUN ONCE, INCONCLUSIVE

A clearly labeled internal submission was run once on Sep 16:
- name: `TEST — Measurement Acceptance`
- success state appeared;
- no duplicate submission occurred;
- intake chose Run · $1,200 / 8 weeks;
- the success UI proved the browser-side form flow completed.

Immediate post-test checks:
- GA4 still did **not** expose `generate_lead`;
- Gmail did **not** yet show a matching FormSubmit test email;
- therefore event/delivery acceptance is **not passed yet**.

Do **not** run repeated test submissions simply to force reporting. Recheck after provider/reporting delay. The known Jorge inquiry already proves the real production mail path can work.

Possible explanations remain:
- analytics suppressed in the automation browser by DNT/GPC or content blocking;
- GA4 reporting lag;
- FormSubmit/Gmail delivery/indexing lag;
- client-side analytics request not delivered.

Do not weaken privacy behavior or change acquisition from this test alone.

Protocol:
`docs/marketing/COACHING_MEASUREMENT_ACCEPTANCE_2026-09-15.md`

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
2. Get one actual phone/device check of the live RPD free-preview paging + Week 5 lock. Sales-page 390px visual QA is already accepted.
3. Run final Meta preflight: destination, URL tags, Spanish translation, price, CTA, pixel.
4. If all three are green, enable RPD Creative A / ad set / campaign at the existing ~$25/day test budget.
5. Continue watching Miami control unchanged; current spend is already inside the $25–30 checkpoint band, but the known 1 real inquiry and low frequency argue for holding rather than editing.
6. Recheck the single controlled coaching measurement submission after reporting/delivery delay; do not repeat it automatically.
7. On first genuine RPD purchase, monitor Stripe → webhook → entitlement → unlock closely and execute contingency if needed.
8. Add Creative B only as a deliberate second hypothesis; do not let it delay first spend.
9. If Unbounce connector authentication starts working, audit RPD first, then park FORM / Forge / coaching ideas.

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and the result do the sophisticated talking.**
