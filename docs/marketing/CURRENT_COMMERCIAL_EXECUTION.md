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
- Published workload is specific: about 45 → 60 miles/week, six days/week.
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
**Landing:** same question → same athlete image / FORM practice → here is the plan → here is what you do → here is proof → try it → buy it.

First-screen rule:
- half marathon · 15 weeks
- `Can you keep the pace?`
- plain description: a 15-week plan used with FORM runners to help runners hold race pace longer
- 6 days/week
- roughly 45–60 miles/week
- primary cold CTA: `Try Weeks 1–4 free`
- secondary immediate action: full plan / $79
- one-time payment, no subscription required

### Exact group image — ASSET READY, PAGE PLACEMENT NEXT

The clean athlete photo supplied by Brice has been optimized for web and should appear high on the RPD landing page so the click feels like the next frame of the ad.

Target asset path:
`assets/rpd/form-runners-miami.webp`

Rules:
- caption truthfully as FORM runners / FORM practice;
- do not imply every person pictured is personally following RPD unless verified;
- safe language: `This is FORM.` / `Real runners. Real training.` / `Race Pace Durability is one of the plans we use with FORM runners.`

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

Rule: do not scale a paid language until its meaningful destination flow is understandable in that language.

## A5. Stripe + ownership — CODED, MUST PROVE

Implemented:
- live $79 Stripe Payment Link.
- checkout microcopy states one-time payment for the complete 15-week half-marathon plan.
- success return with Checkout Session ID.
- Stripe webhook → Supabase entitlement.
- paid-browser unlock.
- thanks page with short webhook-confirmation retry behavior.
- cross-device restore flow by verified checkout email.
- refund/dispute handlers.

Current acceptance evidence:
- live Payment Link is active at $79 and redirects to the RPD thanks route.
- `product_entitlements` currently contains zero rows, so no successful purchase has yet been proven.
- RLS is enabled on the entitlement table; service-role Edge Functions are the access path.

### Required test 1 — END-TO-END PURCHASE

**Human approval required before a real $79 charge. Do not run silently.**

Prove:
1. complete a controlled/live purchase;
2. Stripe records payment;
3. webhook arrives successfully;
4. entitlement is created;
5. buyer returns to thanks page;
6. Weeks 5–15 unlock;
7. refresh does not create duplicate Purchase reporting.

### Required test 2 — CROSS-DEVICE RESTORE

After a real entitlement exists:
1. open a second browser/device without local purchase state;
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

Current Windsor GA4 read on Sep 15 showed only generic `page_view`, `first_visit`, and `session_start` events, not yet an accepted RPD conversion sequence.

Later, before scale:
- server-side Meta CAPI Purchase.
- browser/server event deduplication.

## A7. Landing-page conversion pass — ACTIVE

Priority source: authenticated Unbounce trial audit.

Authenticated workspace status:
- TinyFish/Unbounce connector exists.
- first browser audit stopped because the browser profile was not logged into Unbounce.
- **Human step when convenient:** Brice logs into Unbounce in the connected browser profile. Never paste the password into chat.

Public Unbounce research already supports our current direction:
- message match between ad and landing page;
- plain, strong headline and visible CTA;
- use social proof to build trust;
- remove unnecessary distractions;
- use the page to guide one primary action;
- product pages should make value, price and next step obvious.

Public sources reviewed include Unbounce fitness landing-page examples, product landing-page examples, CTA guidance, copywriting guidance, 2026 landing-page examples, and benchmark material derived from tens of millions of conversions.

Research questions once authenticated:
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

Full exploration brief:
`docs/marketing/UNBOUNCE_SURFACE_EXPLORATION_2026-09-15.md`

## A8. Creative B — SPEC READY

Hypothesis B tests **product inspection / trust**, not another social-proof copy variant:

`SEE THE FIRST FOUR WEEKS.`

Use an actual readable Weeks 1–4 product surface / plan crop, the free-preview fact, and the same $79 full-plan offer. No fake scarcity. See the committed Creative B build spec before production.

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
- [x] clean optimized group-photo asset prepared for site placement
- [ ] exact group image placed high on English + Spanish landing pages
- [ ] final phone + desktop visual QA of the RPD page
- [ ] controlled end-to-end purchase passes
- [ ] cross-device restore passes
- [ ] Meta + GA4 ViewContent / checkout / Purchase events visibly verified
- [ ] Creative A finishes Meta processing/review without a policy/config error
- [x] Creative B concept/spec documented
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
- paid social has produced at least one genuine coaching inquiry.
- do not overwrite the live control merely because simpler copy may test better.

Next challenger concept, when useful:
- separate ad/creative, same offer/page/audience where possible;
- seed with plain language such as `Running coaching in Miami` / `Want to get better at running?`;
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
- explain `what do I do today?` simply;
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

1. Finish the exact group-photo integration on English + Spanish RPD sales pages; remove any temporary asset-upload artifacts; verify production and mobile/desktop rendering.
2. Simplify remaining coaching-jargon copy on the Weeks 1–4 preview without changing prescription or product truth.
3. Verify Meta Creative A processing/review state when a connected source can read it; keep parents paused meanwhile.
4. Verify Meta + GA4 pre-purchase events with test/debug tools where possible.
5. If Brice has logged into Unbounce, run the authenticated RPD audit and implement only evidence-consistent improvements.
6. Build/QA Creative B if still useful.
7. Ask for explicit approval before the real $79 purchase test; after approval, prove purchase → webhook → entitlement → unlock, then cross-device restore.
8. Run final preflight and only then prepare Test 01 to enable.
9. Once RPD is launch-ready, harvest and park Unbounce ideas for FORM, Forge, and the coaching challenger.
10. Continue monitoring the live Miami coaching control without rewriting it mid-test.

If a task requires Brice to log in, approve a charge, or perform another human-only action, mark it clearly and move to the next unblocked item rather than stalling the roadmap.

---

## North star

**Make it easy to understand, easy to buy, easy to start, and easy to keep going. Let the training and results do the sophisticated talking.**
