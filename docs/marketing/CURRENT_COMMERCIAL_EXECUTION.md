# Current Commercial Execution — one roadmap

**Updated:** September 15, 2026, after live landing-page → Stripe attribution acceptance  
**Owner:** Brice / Speed & Form  
**Purpose:** Single current commercial execution checklist. If Brice says only `continue`, start with the first unblocked item in the queue below.

## Operating law

1. **RPD is the immediate execution priority.** Make the $79 funnel trustworthy before expanding active execution elsewhere.
2. **Miami Run Development is a live control.** Do not rewrite its current ad/page mid-test. Build challengers separately.
3. **Think deeply backstage. Speak simply out front.** Do not assume a fit runner knows coaching language.
4. **Proof carries sophistication.** Real athletes, sessions, and verified outcomes beat clever doctrine in cold acquisition.
5. **Ad → landing page → checkout → delivery is one story.** Message match is a launch requirement.
6. **Unbounce is a research surface, not the production stack by default.** Borrow useful conversion patterns; implement winners in speedandform.com.
7. **Do not call paid acquisition successful from CTR/CPC.** Purchase, execution, outcome, and economics matter.

---

# A. Race Pace Durability — ACTIVE PRIORITY

## A1. Product truth — DONE

- 15-week half-marathon plan.
- Athlete-relative race pace: not a sub-1:30-only product.
- Shared progression; athlete pace comes from current fitness.
- Published workload: roughly 45 → 60 miles/week, six days/week.
- Weeks 1–4 free/open preview.
- Complete plan: **one-time payment of $79**.
- RPD is complete on the web; FORM app is separate and not required.
- Individual coaching is separate.
- No guaranteed finish time, fake personalization, fake scarcity, or invented urgency.

Read:
- `docs/marketing/RPD_OFFER_TRUTH_2026-09-15.md`
- `docs/RACE_PACE_DURABILITY_CANONICAL_v1.md`
- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`

## A2. Meta Test 01 — CREATIVE A PUBLISHED; SPEND PAUSED

Campaign:
- `FORM · RPD · Purchase Test 01`
- ID `52675684605200`
- Sales objective
- $25/day campaign budget
- Purchase optimization
- **explicitly paused after Creative A was published**

Ad set:
- `US · Advantage+ · Purchase`
- ID `52675686707200`
- US / website / Purchase / existing pixel `147659485878240`
- **explicitly paused after Creative A was published**

Creative A:
- `Creative A · Can You Hold It? · v1`
- manually published in Ads Manager Sep 15
- last human-visible state: `Processing`
- visual: real FORM runners group photo
- Spanish translation enabled
- Meta visual touch-ups/crop/brightness allowed when real people/scene are preserved
- Meta text generation allowed with truth filter
- intended URL tags:
  `utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=group_photo_v1`

Reject generated copy that says/implies:
- marathon instead of half marathon;
- personalized/tailored individual programming;
- guaranteed outcome;
- limited-time offer when none exists;
- secret/hack/instant transformation;
- false training mechanics.

**Do not enable campaign or ad set until the launch gate passes.**

Meta browser review is currently a human/session blocker: the connected automation browser is not authenticated to Meta. Windsor reporting does not yet surface the unpublished/no-delivery RPD hierarchy. Keep the known parent IDs paused until Brice or connected data confirms review status.

## A3. Ad → landing-page continuity — LIVE + DESKTOP QA PASSED

Current story:

**Ad:** real FORM athletes + `Can you keep the pace?`  
**Landing:** same question → same real FORM image → what this is → what you do → proof → try → buy.

Live English sales page:
`/plans/race-pace-durability/support/`

Live Spanish sales page:
`/es/plans/race-pace-durability/`

The exact group photo is now a clean optimized web asset:
`/assets/rpd/form-runners-miami.webp`

It appears immediately after the hero on both English and Spanish sales pages.

English proof block:
- `FORM runners · Miami`
- `Real runners. Real training.`
- `This is FORM.`
- clearly says RPD is **one of** the plans used with FORM runners, avoiding the false claim that every pictured runner personally uses RPD.

Spanish proof block mirrors the same claim truthfully.

Read-only live browser QA on Sep 15 confirmed:
- image loads;
- correct placement directly after hero;
- captions/copy present in EN/ES;
- no obvious desktop layout breakage;
- no missing image;
- no duplicate restore link after follow-up cleanup.

True 390px/physical-device visual acceptance is still open because the connected browser cannot resize its viewport. Do not mark mobile QA passed from desktop inspection.

## A4. Weeks 1–4 preview — PLAIN-LANGUAGE PASS LIVE

Route:
`/plans/race-pace-durability/`

The plan prescription is unchanged. The explanatory copy below the plan was simplified:
- `Run the pace. Hold it longer.`
- `Try Weeks 1–4 free.`
- literal fit requirements;
- `Pick a pace you can run now` instead of athlete/coaching jargon;
- simple progression: shorter efforts → 5 → 6 → 8 → 12 late → race.

Do not reintroduce internal terms such as `race-pace ownership` or make athletes decode the method before they can run it.

## A5. English / Spanish parity — PARTIAL

Done:
- English sales page.
- Spanish sales page.
- EN/ES switch + browser-language handoff.
- same offer and price.
- same group-photo proof block.

Open if Spanish acquisition continues:
- Spanish Weeks 1–4 plan interface.
- Spanish thanks/purchase confirmation.
- Spanish restore-access surface.
- Spanish workout instructions.

Rule: do not scale a paid language until the meaningful destination flow is understandable in that language.

## A6. Stripe / ownership — CHECKOUT ACCEPTED; REAL-MONEY ACCEPTANCE OPEN

Live Payment Link:
- `https://buy.stripe.com/bJeaEX1YvfNwgMX3Doffy00`
- product: Race Pace Durability
- $79 USD one-time payment
- active
- no subscription
- no phone collection
- checkout message: `One-time payment for the complete 15-week Race Pace Durability half-marathon plan. Individual coaching is separate.`
- redirect: `/plans/race-pace-durability/thanks/?session_id={CHECKOUT_SESSION_ID}` plus supported UTM values when they entered the Payment Link.

Implemented:
- Stripe webhook → Supabase `product_entitlements`.
- entitlement verify endpoint.
- same-browser paid unlock.
- thanks page with webhook catch-up retry behavior.
- cross-device restore by verified checkout email.
- refund/dispute status handling.

### Pre-payment checkout acceptance — PASSED

The actual production RPD landing page now prewrites its checkout CTA with:
- supported UTM parameters;
- a compact non-sensitive `client_reference_id`.

A live QA visit through the actual page created Stripe Checkout Session:
`cs_live_a1MwavR7AwNwYXKIOl7lltlBlhhEEH94zTh5MfMrjQArKfU2zkQHh2DVbx`

Stripe API verified:
- amount `7900` cents;
- payment status `unpaid`;
- `client_reference_id=rpd__s_qa5__m_internal__c_rpd_prewrite_acceptance__x_group_photo_codepath`;
- success redirect contains the QA UTM source/medium/campaign/content.

No personal or payment data was submitted during acceptance.

Read `docs/marketing/RPD_ATTRIBUTION_ACCEPTANCE_2026-09-15.md`.

### Server-side attribution — SOURCE READY, DEPLOYMENT BLOCKED

Source-controlled target exists at:
`supabase/functions/stripe-rpd-webhook/index.ts`

It parses the compact Stripe `client_reference_id` and stores campaign labels in `product_entitlements.source`.

However, Supabase management calls are repeatedly returning upstream HTTP `502`, including Edge Function reads/listing. **Do not blindly deploy while management access is degraded.**

When Supabase recovers:
1. read back current deployed webhook;
2. deploy attribution-aware source-controlled version;
3. read back deployed version;
4. prove source JSON with the paid acceptance purchase.

Current database evidence before the outage:
- `product_entitlements` had **0 rows** when checked Sep 15.
- therefore a real successful purchase has **not** been proven yet.
- RLS is enabled on the entitlement table; direct browser table access is not the delivery path.

### Human gate: real $79 purchase

Do **not** charge Brice without explicit approval.

After approval prove:
1. checkout completes;
2. Stripe records payment;
3. webhook succeeds;
4. entitlement row appears;
5. entitlement source contains expected campaign labels;
6. thanks page verifies it;
7. Weeks 5–15 unlock;
8. refresh does not duplicate Purchase measurement.

Then test restore on a clean second browser/device.

## A7. Measurement — BUILT; PRE-PURCHASE PATH PARTIALLY ACCEPTED

Client-side implementation:
- page view / Meta `ViewContent`
- `rpd_view`
- checkout start / GA4 `begin_checkout`
- `rpd_checkout_start`
- Meta `InitiateCheckout`
- verified return / GA4 `purchase`
- `rpd_purchase`
- Meta `Purchase`
- browser refresh guard
- campaign-source persistence

Privacy behavior:
- first-party UTM/source continuity is independent of the analytics runtime;
- DNT/GPC still prevents GA/Meta scripts/events;
- source labels contain no email, payment, health, or private athlete data.

Current GA4 connector read on Sep 15 showed only generic `page_view`, `first_visit`, and `session_start`; reporting/acceptance for RPD custom events is still open. The browser used for several QA flows is privacy-respecting, so absence in GA4 from those runs is not evidence of a broken implementation.

Before meaningful spend verify where possible:
- ViewContent;
- begin checkout / InitiateCheckout;
- campaign source labels;
- after paid acceptance, Purchase exactly once with $79.

Before scale later:
- Meta CAPI Purchase;
- client/server dedupe.

## A8. Landing-page conversion research — ACTIVE

Public Unbounce research note:
`docs/marketing/RPD_LANDING_PAGE_CONVERSION_NOTES_2026-09-15.md`

Public Unbounce guidance currently supports:
- strong ad/page message match;
- simple headline and clear CTA;
- social proof near the offer;
- visible value/price/next step;
- removing distractions rather than adding persuasive clutter.

Full four-surface exploration brief:
`docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

Authenticated Unbounce audit remains blocked by browser login. A fresh read-only attempt on Sep 15 again reached the login wall; no credentials are stored in the browser connector.

**Human step when convenient:** Brice logs into Unbounce in the connected browser profile. Never send password in chat.

After login:
1. RPD audit + implement best evidence-consistent ideas.
2. Park FORM app ideas.
3. Park Forge ideas.
4. Park coaching-homepage challenger ideas.

## A9. Creative B — SPEC READY; BUILD IF IT EARNS THE TEST SLOT

Creative B tests product transparency, not another identity/social-proof hook:

`SEE THE FIRST FOUR WEEKS.`

Use the actual product/preview surface, free-preview fact, and same $79 complete-plan offer. Do not build six weak variants before learning from A + one genuinely different B.

Decision rule:
- If we can produce B from the real plan surface without delaying launch acceptance, include it in Test 01.
- If B requires invented imagery or weak mockups, launch A after the gate and build B from real product screenshots afterward.

## A10. RPD launch gate

- [x] product truth reconciled
- [x] athlete-language/no-decoding rule documented
- [x] English $79 sales page simplified
- [x] Spanish $79 sales page exists
- [x] exact Meta athlete photo added high on EN + ES pages
- [x] desktop live QA passed for image/proof block
- [x] Weeks 1–4 explanatory copy simplified
- [x] Stripe live Payment Link active
- [x] production landing-page → Stripe $79 checkout path accepted
- [x] production landing-page source → Stripe Checkout Session attribution accepted pre-payment
- [x] webhook signing secret configured
- [x] entitlement code exists
- [x] restore-access code exists
- [x] Creative A published
- [x] campaign explicitly paused after publication
- [x] ad set explicitly paused after publication
- [x] Creative B concept/spec documented
- [ ] phone-width / physical-device landing-page visual QA
- [ ] Creative A review completes without policy/config error
- [ ] Meta/GA4 pre-purchase events visibly accepted where privacy settings allow
- [ ] Supabase attribution-aware webhook deploys and is read back
- [ ] controlled real purchase succeeds
- [ ] paid entitlement contains expected source labels
- [ ] Purchase event fires once at $79
- [ ] cross-device restore succeeds
- [ ] decide whether Creative B ships in first spend or follows A
- [ ] final preflight of URL, UTM tags, translations, price, CTA, pixel

Only after gate: deliberately enable campaign/ad set and begin the ~$25/day information-buying test.

---

# B. Miami Run Development — LIVE CONTROL

Campaign:
`FORM · Miami · Run · Test 01`

Do not rewrite the live control. It has already produced at least one genuine paid-social coaching inquiry.

Future challenger should be separate and can seed very plain language such as:
- `Running coaching in Miami`
- `Want to get better at running?`

Let Meta generate alternatives, truth-filter them, and compare **qualified inquiry / paid-client quality**, not CTR alone.

Working acquisition target remains 2 new Run Development starts/month; 3/month is stretch only while delivery quality stays high.

---

# C. Unbounce trial — PARKED SURFACES AFTER RPD

Use the trial for learning, not four simultaneous production builds.

Priority:
1. RPD — ACTIVE
2. FORM app landing-page ideas — PARK
3. Forge landing-page ideas — PARK
4. Alternative coaching homepage — PARK

For each parked surface capture:
- template/pattern names;
- mobile hierarchy;
- hero + CTA ideas;
- proof/pricing sequence;
- copy worth testing;
- rejected ideas and why;
- implementation note for existing repo.

Do not publicly claim unshipped app features.

---

# D. Queue for any future `continue`

Take the first unblocked item and move on if a human-only/tool-only blocker appears:

1. Retry Supabase management access; when healthy, read/deploy/read-back the attribution-aware RPD Stripe webhook.
2. Build Creative B from the real plan surface only if the asset can stay truthful and visually strong.
3. Prepare the exact real-purchase acceptance checklist; do not charge until Brice explicitly approves the $79 test.
4. Check Creative A review/status when Meta session/data exposes it; parents stay paused.
5. Run true phone-width/physical-device visual QA when an actual mobile viewport or Brice screenshot is available.
6. Verify pre-purchase Meta/GA events where possible without generating fake purchase evidence.
7. If Unbounce is logged in, run authenticated RPD audit and implement only truthful/high-value improvements.
8. After explicit purchase approval, test payment → webhook → source → entitlement → unlock → event → restore.
9. Run final Meta preflight.
10. Enable Test 01 only when launch gate is green.
11. Then park Unbounce ideas for FORM, Forge, and coaching challenger and continue watching the Miami control.

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and the result do the sophisticated talking.**
