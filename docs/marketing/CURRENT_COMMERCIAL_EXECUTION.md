# Current Commercial Execution — one roadmap

**Updated:** September 15, 2026  
**Owner:** Brice / Speed & Form  
**Purpose:** This is the single current commercial execution checklist. Any agent or stream should start here before changing Meta, RPD, the coaching funnel, or the four-surface Unbounce exploration.

## Operating law

1. **RPD is the immediate build priority.** Get the $79 funnel trustworthy, coherent and testable before expanding execution elsewhere.
2. **The current Miami coaching campaign is already a live control.** Do not casually rewrite it while it is producing evidence. Challenger ideas should be separate.
3. **Think deeply backstage. Speak simply out front.** Do not assume a fit or fast runner knows coaching vocabulary.
4. **Proof carries sophistication.** Real athletes, real sessions and verified results beat clever doctrine in cold acquisition.
5. **Ad → landing page → checkout → delivery must feel like one story.** Do not optimize one surface in isolation.
6. **Unbounce is a research surface, not a required production host.** Borrow useful conversion patterns and implement the best ones in the existing Speed & Form stack unless evidence says otherwise.
7. **Do not scale because CTR looks good.** Scale only after delivery, page intent, purchase, access and economics are working.

---

# A. Race Pace Durability — active priority

## A1. Product truth — DONE

- 15-week half-marathon plan.
- Athlete-relative race pace; not a sub-1:30-only product.
- Published workload is still specific: about 45 → 60 miles/week, six days/week.
- Weeks 1–4 free/open preview.
- Full plan: one-time payment of $79.
- FORM app is separate and not required to complete RPD.
- No promised finish time, no invented personalization, no fake urgency.

Source-of-truth docs:
- `docs/marketing/RPD_OFFER_TRUTH_2026-09-15.md`
- `docs/RACE_PACE_DURABILITY_CANONICAL_v1.md`
- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`

## A2. Meta Test 01 — PUBLISHED INTO PAUSED PARENTS

Campaign:
- `FORM · RPD · Purchase Test 01`
- ID `52675684605200`
- Sales objective
- $25/day campaign budget
- Purchase optimization
- **explicitly paused after ad publication on Sep 15**

Ad set:
- `US · Advantage+ · Purchase`
- ID `52675686707200`
- US, website purchase, existing pixel
- **explicitly paused after ad publication on Sep 15**

Creative A:
- `Creative A · Can You Hold It? · v1`
- manually published in Ads Manager Sep 15; Meta showed `Processing` immediately after publish
- visual: real FORM athlete group photo, one of FORM's highest-engagement social images
- Meta visual touch-ups / crop / brightness changes are allowed if the same real people and scene are preserved
- Spanish translation enabled
- Meta text-generation variants allowed with truth filter
- reject wrong-distance copy (`marathon`), fake personalization, guarantees, invented urgency, `secret`, instant transformation, etc.
- URL tags should be:
  `utm_source=meta&utm_medium=paid_social&utm_campaign=rpd_purchase_test_01&utm_content=group_photo_v1`

**Do not enable the campaign or ad set until the launch gate below passes.**

## A3. Landing page story — ACTIVE

Current direction:

**Ad:** real FORM athletes + `Can you keep the pace?`  
**Landing:** same question → real FORM practice → here is the plan → here is what you do → here is proof → try it → buy it.

The first screen should remain extremely easy to understand:
- half marathon · 15 weeks
- `Can you keep the pace?`
- plain description: a 15-week plan used with FORM runners to help runners hold race pace longer
- 6 days/week
- roughly 45–60 miles/week
- primary cold CTA: `Try Weeks 1–4 free`
- secondary immediate action: full plan / $79
- one-time payment, no subscription required

### Exact group image — NEXT

The Meta group image should appear high on the RPD landing page so the page feels like the next frame of the ad.

Rules:
- use a clean site asset, not an Instagram UI screenshot if avoidable;
- caption truthfully as FORM runners / FORM practice;
- do not imply every person pictured is personally following RPD unless verified;
- safe copy territory: `This is FORM.` / `Real runners. Real training.` / `Race Pace Durability is one of the plans we use with FORM runners.`

## A4. English + Spanish parity — PARTIAL

Done:
- English $79 sales page.
- Spanish $79 sales page.
- browser-language handoff and EN/ES switch.
- same price and product truth.

Still open if Spanish traffic matters:
- Spanish Weeks 1–4 preview.
- Spanish checkout return / confirmation.
- Spanish purchase recovery.
- Spanish athlete workout instructions.

Rule: do not enable a paid ad language whose meaningful destination flow cannot support that language.

## A5. Stripe + ownership — CODED, MUST PROVE

Implemented:
- live $79 Stripe Payment Link.
- success return with Checkout Session ID.
- Stripe webhook → Supabase entitlement.
- paid-browser unlock.
- thanks page.
- cross-device restore flow by verified checkout email.
- refund/dispute handlers.

### Required test 1 — END-TO-END PURCHASE

Prove, not assume:
1. complete a controlled/live purchase;
2. Stripe records payment;
3. webhook arrives successfully;
4. entitlement is created;
5. buyer returns to thanks page;
6. Weeks 5–15 unlock;
7. refresh does not create duplicate Purchase reporting.

### Required test 2 — CROSS-DEVICE RESTORE

1. open a second browser/device without the local purchase state;
2. use Restore Access;
3. verify checkout email;
4. attach entitlement;
5. confirm Weeks 5–15 unlock without another charge.

## A6. Measurement — CLIENT SIDE BUILT, ACCEPTANCE OPEN

Implemented:
- RPD page view / Meta ViewContent
- checkout start / GA4 begin_checkout / Meta InitiateCheckout
- verified-return purchase / GA4 purchase / Meta Purchase
- refresh guard
- campaign UTMs

Must prove before meaningful spend:
- ViewContent appears in Meta Events Manager / GA4 DebugView.
- checkout event appears once.
- verified Purchase appears once with $79 value.
- URL tags survive ad → page → checkout context as expected.

Later, before scale:
- server-side Meta CAPI Purchase.
- browser/server event deduplication.

## A7. Landing-page conversion pass — ACTIVE

Priority source: authenticated Unbounce trial audit.

Research questions:
- hero/image/copy balance for a $79 fitness digital product;
- mobile first-screen hierarchy;
- CTA repetition;
- free-preview framing;
- social proof placement;
- price block pattern;
- qualification without making the page feel like an application;
- FAQ / objection order;
- sticky mobile CTA;
- long vs shorter page;
- ad-message → page-message match;
- useful AI/copy suggestions.

Unbounce browser connection exists, but the first audit run stopped because the browser profile was not authenticated to Unbounce. **Next human step when convenient:** Brice logs into Unbounce in the connected browser profile. Then rerun the read-only audit. Do not share password in chat.

Full exploration brief:
`docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

## A8. Creative B — NEXT AFTER A IS CLEAN

Hypothesis B is not another copy variant of A. It tests **product inspection / trust**:

`SEE THE FIRST FOUR WEEKS.`

Possible visual:
- actual readable Weeks 1–4 product surface / plan crop;
- simple statement that the beginning is free to try;
- same $79 full-plan offer;
- no fake scarcity.

Do not create six weak variants before we have learned from A and one materially different B.

## A9. RPD launch gate

Do not enable spend until all critical items are checked:

- [x] product truth reconciled
- [x] athlete-language / no-decoding rule documented
- [x] English $79 page simplified around the ad story
- [x] Spanish sales page exists
- [x] Stripe live checkout exists
- [x] webhook signing secret configured
- [x] entitlement + browser unlock code exists
- [x] restore-access code exists
- [x] Creative A published into Meta
- [x] RPD campaign explicitly paused after publication
- [x] RPD ad set explicitly paused after publication
- [ ] exact group image added high on landing page from a clean asset
- [ ] final phone + desktop visual QA of the RPD page
- [ ] controlled end-to-end purchase passes
- [ ] cross-device restore passes
- [ ] Meta + GA4 ViewContent / checkout / Purchase events visibly verified
- [ ] Creative A finishes Meta processing/review without a policy/config error
- [ ] Creative B built or deliberately deferred for first spend
- [ ] final preflight: destination URL, URL tags, Spanish translation, price, copy, CTA and pixel all reviewed

When gate passes:
- enable campaign/ad set deliberately;
- initial information-buying budget: about $25/day;
- do not call the channel profitable from CTR/CPC alone.

---

# B. Miami Run Development acquisition — live control

Current live campaign:
- `FORM · Miami · Run · Test 01`
- keep current live creative as the control while it is producing evidence.

Known learning:
- the paid-social funnel has produced at least one genuine coaching inquiry.
- do not overwrite the live control just because simpler copy may be better.

Next challenger concept, when useful:
- separate ad/creative, same offer/page/audience where possible;
- very plain seed language such as `Running coaching in Miami` / `Want to get better at running?`;
- let Meta generate conversion-oriented alternatives;
- keep truthful simple lines and reject invented claims;
- compare inquiry quality, not just CTR.

Operational target remains 2 new Run Development starts/month; 3/month is stretch only while service remains excellent.

---

# C. Unbounce trial — four-surface research plan

Use the trial aggressively for **learning**, not four simultaneous builds.

Priority:
1. **RPD landing page — active now**
2. **FORM app page — park design/copy ideas**
3. **Forge app page — park design/copy ideas**
4. **Alternative coaching homepage — park challenger ideas**

For every surface capture:
- template/pattern names worth revisiting;
- strongest section-order ideas;
- copy ideas worth testing;
- mobile-first hierarchy;
- CTA, proof and pricing sequence;
- ideas rejected and why;
- implementation notes for the existing repo.

Do not migrate production merely because Unbounce makes a template easy to publish.

---

# D. FORM app landing page — PARKED RESEARCH

Goal while trial is available:
- find simple ways to explain `what do I do today?` value;
- trial framing for future paid FORM;
- screenshot vs athlete-photo balance;
- App Store CTA patterns;
- subscription/pricing presentation;
- proof/result placement;
- distinction between FORM subscription and one-time RPD ownership.

No public claims for features not shipped and verified.

---

# E. Forge app landing page — PARKED RESEARCH

Goal:
- explain strength / physique / hypertrophy outcomes without coach jargon;
- product demo patterns;
- exercise visual treatment;
- progress/history proof;
- adherence / Today framing;
- trial / subscription structure;
- relationship between remote coaching and app execution.

Do not let this interrupt the RPD launch gate or Forge product acceptance work.

---

# F. Alternative coaching homepage — PARKED CHALLENGER

The current homepage is not presumed broken; it is a live control producing inquiries.

Use Unbounce to explore an alternative, not silently replace production.

Questions:
- proof-first vs service-first hero;
- `running coaching in Miami` plain positioning;
- whether group-athlete imagery creates stronger identity/trust;
- $1,200 Run and $1,800 Run + Strength presentation;
- complimentary track-assessment framing;
- local vs remote explanation;
- intake friction / length;
- Spanish local-acquisition opportunity later.

Build challenger only when we can compare it cleanly against the control.

---

# G. Working queue for any new agent

If Brice says only **continue**, take the first unblocked item below and do as much as possible without inventing facts:

1. Verify Meta Creative A processing/review state and parent pause state.
2. Add the exact clean group photo high on the RPD English + Spanish landing pages and QA responsive treatment.
3. Run the controlled Stripe purchase / entitlement / unlock test.
4. Run cross-device restore test.
5. Verify Meta + GA4 funnel events in test/debug tools.
6. If Brice has logged into Unbounce, run the RPD audit and implement the strongest evidence-consistent landing-page improvements.
7. Build/QA Creative B if still useful.
8. Run full preflight and only then prepare Test 01 to enable.
9. Once RPD is launch-ready, harvest and park Unbounce ideas for FORM, Forge, and the coaching challenger.
10. Continue monitoring the live Miami coaching control without rewriting it mid-test.

If a task requires Brice to log in, supply a secret, approve a charge, or perform a real-money test, mark it clearly and move to the next unblocked item rather than stalling the whole roadmap.

---

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and results do the sophisticated talking.**
