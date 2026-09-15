# Race Pace Durability — Distribution Execution Roadmap

**Date:** September 15, 2026  
**Owner:** Speed & Form / FORM  
**Product:** Race Pace Durability  
**Offer:** 15 weeks · Weeks 1–4 open · $79 once  
**Purpose:** Turn the independent reviews into one ordered execution plan. This document is the operating checklist for the first clean paid-acquisition test.

---

## 0. The call

We are not going to keep debating seven versions of the funnel. The reviews converge strongly enough to make a decision.

The launch thesis is:

> **You can hit the pace. Can you hold it?**

Race Pace Durability is not sold as 15 weeks of workouts. It is sold as a deliberately authored progression around one specific race problem: **keeping an already-available pace available as the half marathon gets long.**

The first experiment is meant to answer:

1. Does the right runner recognize this as their problem?
2. Does seeing the actual progression and work make $79 feel justified?
3. Can we move qualified cold traffic from product inspection to verified purchase at workable economics?
4. Can a buyer start and use the product without Brice becoming the hidden delivery system?

We do **not** need to prove scale in the first test. We need a clean enough system that the market can teach us something.

---

# 1. Decisions locked for Test 01

These remain fixed through the first clean paid read unless there is a technical, safety, or truth failure.

## Product / price

- [x] Product: Race Pace Durability.
- [x] Price: **$79 one time**.
- [x] Weeks 1–4 remain openly inspectable.
- [x] Individual coaching is separate.
- [x] Live Stripe checkout exists.
- [ ] Refund / product-fit policy is explicitly decided and published.

Do not test another price during Test 01.

## FORM app commercial model — corrected September 15

The old brief premise that FORM is permanently free is retired.

Current direction:

- **RPD:** one-time owned specialist block.
- **FORM:** moving toward a separately priced ongoing product with a free trial / trial-like entry rather than an indefinite free tier.
- An RPD buyer must be able to complete the purchased RPD block without being forced into a second subscription.
- If RPD later executes inside FORM, purchased RPD rights should survive FORM trial expiry or cancellation of the broader FORM subscription.
- Do not advertise “FORM included” until that entitlement is actually implemented and tested.
- If the broader FORM subscription ultimately includes the exact same RPD material, disclose one-time ownership vs subscription access honestly rather than creating a cosmetic double charge.

**Test 01 decision:** keep the app out of the cold purchase funnel. Web must be complete. Native RPD execution is a later adherence / packaging experiment.

## Audience

- [x] US first.
- [x] Miles / mile pace first.
- [x] Experienced runners only.
- [x] Current product expects roughly 45+ mpw at entry and builds toward ~60 mpw.
- [x] Six running days / existing long-run base remain meaningful requirements unless the actual authored plan changes.
- [x] Sub-1:30 is the first specific wedge, not a promise.

Do not widen eligibility just to make the Meta audience larger.

## Creative hypotheses

Test **two different buying reasons**, not two visual variants of the same idea.

### Creative A — problem recognition

**SUB-1:30 HALF MARATHON**  
**YOU CAN HIT THE PACE.**  
**CAN YOU HOLD IT?**

15-second vertical video. Real controlled running footage. The mechanism appears after the hook.

### Creative B — product inspection

**SEE THE FIRST FOUR WEEKS.**

Static / restrained motion built from a real readable excerpt of the authored plan. It tests whether transparency and product inspection reduce purchase risk.

**Not in the first two:** a bare ladder static. The ladder remains an important mechanism asset on-page and inside Creative A once the canonical sequence is verified, but it is too similar to the problem video to be our second hypothesis.

## Landing-page philosophy

One coherent public buying journey.

The ad and page should feel like the same argument:

**problem recognition → fit → real work → progression → evidence → ownership → purchase**

Cold traffic does not go to the homepage or App Store.

## Campaign optimization call

**Default Test 01:** Sales campaign optimized for **Purchase**, but only after Purchase is server-verified and trustworthy.

Why:
- Purchase is the actual objective.
- Optimizing for a cheaper upstream event can teach Meta to find checkout starters who do not buy.
- Low purchase volume means uncertainty; it does not automatically make a lower-quality event the correct objective.

`InitiateCheckout` remains a primary diagnostic event.

If Test 01 produces too little Purchase signal for useful delivery, run a **separate follow-up experiment** optimizing for InitiateCheckout. Do not change the optimization event mid-test and pretend the result is comparable.

---

# 2. Launch gates — no meaningful paid spend until these pass

## Gate A — training truth

Owner: Brice + training source of truth.

- [ ] Confirm the exact race target pace language. A 1:30 half is ~6:52/mi; the published 6:30–6:45/mi is a faster working band. Explain the relationship and do not call them the same thing casually.
- [ ] Confirm the canonical progression. Resolve `5 → 6 → 8 → 12`, `2 → 5 → 6 → 8 → 12`, and exactly what “12 late” means.
- [ ] Confirm the final 12-mile session: total distance, earlier miles, assigned band, recovery context and intended athlete-relative demand.
- [ ] Confirm weekly stress architecture: specificity / threshold / long-run work must not be described as three separate hard days if the authored plan does not actually operate that way.
- [ ] Define the valid calendar / start window for a fixed 15-week block. No implication that someone with 12 weeks to race should compress the plan.
- [ ] Confirm starting-volume and long-run prerequisites from the real prescription.

**Pass condition:** every number shown in ads and the sales page matches the authored plan and has one meaning.

## Gate B — ownership / offer clarity

Owner: Brice + product copy.

A buyer must be able to answer in ten seconds:

- [ ] What do I own for $79?
- [ ] Do I need another subscription? **No for completing RPD.**
- [ ] Is coaching included? **No.**
- [ ] What happens immediately after payment?
- [ ] How do I recover access?
- [ ] What support is included?
- [ ] What is the refund / product-fit policy?
- [ ] What happens if I am not ready for the starting workload?

Working ownership sentence:

> **$79 buys the complete Race Pace Durability block. No FORM subscription is required to finish the plan. Coaching is separate.**

Use only when the delivered product truly honors it.

## Gate C — fulfillment

Current state: live payment works; full buyer-specific delivery is not yet the scaled experience.

Minimum before meaningful paid traffic:

- [ ] Stripe payment is verified server-side.
- [ ] A successful buyer receives access without Brice having to notice the payment manually.
- [ ] Access email / recovery path works.
- [ ] Failed / canceled payments do not receive access.
- [ ] Duplicate webhook / refresh does not create duplicate ownership.
- [ ] Buyer can open the full product cross-platform.
- [ ] Week 1 / start instructions are directly usable.

Preferred minimal implementation:

**Stripe webhook → entitlement record → immediate web access + email recovery.**

Do not make a thank-you-page view the source of truth for payment or fulfillment.

## Gate D — measurement

- [ ] Meta Pixel verified on RPD conversion page.
- [ ] GA4 verified on RPD conversion page.
- [ ] UTMs identify campaign / ad set / creative.
- [ ] Meta `ViewContent` on actual RPD product view.
- [ ] GA4 `rpd_view` or equivalent diagnostic event.
- [ ] Preview interaction event fires only when preview is actually inspected.
- [ ] Checkout CTA click is tracked separately from successful checkout initiation.
- [ ] Meta `InitiateCheckout` fires on a real initiated Stripe checkout where technically possible / verified.
- [ ] Stripe webhook verifies successful payment.
- [ ] Meta server-side `Purchase` fires from verified payment.
- [ ] GA4 standard `purchase` fires with a unique transaction ID.
- [ ] Browser/server Meta purchase events are deduplicated by stable event ID if both fire.
- [ ] Test / friend / organic orders can be separated from paid-acquisition buyers.
- [ ] Refund and support-contact states are observable.

**Pass condition:** one test purchase can be traced from UTM → site → Stripe → verified Purchase without duplicate revenue.

## Gate E — conversion page

The public decision page should contain, in this order:

1. **Hero** — target, duration, starting workload, price, purchase CTA, preview.
2. **Starting fit** — qualification before payment.
3. **Real work** — one readable representative week / key session.
4. **Progression** — canonical broken → continuous → later-run logic.
5. **What you own** — deliverables, access, no surprise subscription, coaching boundary.
6. **Evidence / seller** — real process evidence; results pending where pending.
7. **Weeks 1–4 preview** — open, no forced email gate.
8. **Practical questions** — pace interpretation, missed work, race date, support, refund, app.
9. **Final purchase** — same offer, no new condition.

Required copy principles:

- Lead with **hold the pace / fade late** language, not physiological jargon.
- “Durability” can explain the method after the problem is recognized.
- Show the product. Do not make someone buy an abstraction.
- Proof-in-progress is labeled as process evidence, not outcome validation.
- Do not bury the starting requirements.

## Gate F — proof asset

Before running meaningful cold traffic, surface at least one real artifact:

- [ ] a verified key session / filed workout;
- [ ] current living-study progression;
- [ ] actual plan excerpt;
- [ ] clearly pending Dec 5 result;
- [ ] permission confirmed for any athlete image / data used in paid media.

Do not manufacture an outcome. The proof can be **real work happening now**.

## Gate G — creative QA

Creative A and B must each pass:

- [ ] 9:16 native composition for Reels / Stories.
- [ ] 4:5 feed derivative intentionally recomposed.
- [ ] Critical text inside current safe zones.
- [ ] Understandable muted.
- [ ] Audio licensed for paid advertising if used.
- [ ] No generic sprint footage implying a finish-line outcome.
- [ ] No generated athlete presented as evidence.
- [ ] Exact product price and qualification visible.
- [ ] Destination is the RPD product page.

---

# 3. Build order

Do the work in this sequence because later items depend on earlier truth.

## Phase 0 — reconcile the product (FIRST)

**Goal:** no marketing build on ambiguous training facts.

1. Resolve target pace vs working band.
2. Freeze canonical progression.
3. Freeze start prerequisites / race-calendar rule.
4. Define missed-session / interrupted-week rules.
5. Decide refund / product-fit policy.
6. Freeze RPD ownership vs paid FORM subscription language.

**Deliverable:** `RPD_OFFER_TRUTH.md` or equivalent product source-of-truth section.

**No ad production before 1–3 are done.**

## Phase 1 — make purchase complete

**Goal:** payment creates a real usable product without Brice as middleware.

1. Audit existing auth / Supabase / static-plan architecture.
2. Choose smallest reliable entitlement method.
3. Implement verified Stripe webhook.
4. Create entitlement on paid order.
5. Create immediate access / recovery path.
6. Build success / thanks state.
7. Add Week 0 / Start Here instructions.
8. Test success, failure, duplicate, no-browser-return and access recovery.

**Exit:** a stranger can buy, receive, recover and begin without messaging Brice.

## Phase 2 — instrument the funnel

**Goal:** know exactly where paid traffic stops.

1. Standard Meta commerce events.
2. Standard GA4 purchase event.
3. Custom diagnostic events for preview / gate / access / activation.
4. CAPI / server-side Purchase from Stripe webhook.
5. UTM persistence and reconciliation.
6. Test-event QA.

**Exit:** one test purchase is visible correctly in Stripe, GA4 and Meta without duplicate revenue.

## Phase 3 — build the conversion page

**Goal:** answer the sophisticated buyer’s objections before checkout.

1. Hero + qualification.
2. Real plan artifact.
3. Canonical progression visual.
4. Ownership contract.
5. Process evidence.
6. Inline Weeks 1–4 preview.
7. FAQ / support / refund.
8. Final CTA.

Then run a **five-runner comprehension test** before paid traffic. Without explaining anything, ask:

- Who is this for?
- What does it cost?
- What exactly do you own?
- Is another subscription required?
- What would you do first after buying?
- What would stop you from buying?

This is usability evidence, not willingness-to-pay proof.

## Phase 4 — produce the two creatives

### A. Problem-led video

First frame:

**SUB-1:30 HALF MARATHON**  
**YOU CAN HIT THE PACE.**  
**CAN YOU HOLD IT?**

Then show the verified mechanism and one real product artifact.

Working primary text:

> You can run goal pace in repeats. The question is whether you can sustain it when the half marathon gets long.  
>  
> Race Pace Durability is a 15-week sub-1:30 block for experienced runners already running around 45 miles per week and prepared for six running days.  
>  
> Preview Weeks 1–4. Full plan: $79 once. Individual coaching is separate.

Headline: **Train to hold the pace.**  
CTA: **Learn More**

### B. Product-inspection static

**SUB-1:30 HALF MARATHON PLAN**  
**SEE THE FIRST FOUR WEEKS.**

Use an actual readable plan excerpt.

Headline: **See the work before you buy.**  
CTA: **Learn More**

## Phase 5 — launch Test 01

**Campaign:** one US prospecting Sales campaign.  
**Ad set:** one broad adult / Advantage+ audience.  
**Creatives:** A + B.  
**Price:** $79.  
**Landing page:** one.  
**Optimization:** Purchase.  
**Budget:** target **$25/day for up to 10 days = $250**.  
**Absolute ceiling without deliberate review:** **$400**.

Do not split a $250 test across multiple interest stacks, ages, landing pages, prices and retargeting cells.

## Phase 6 — read the funnel, not the emotion

### Around $100 verified spend

Do not call the product good or bad.

Ask:
- Are real people seeing it?
- Does either concept earn qualified attention?
- Are link clicks becoming actual LPVs?
- Are the visitors obviously wrong for the product?
- Is any technical path broken?

Only kill a creative early for strong evidence: technical failure, materially misleading response, or enough exposure with clearly poor qualified behavior.

### Around $200 verified spend

Ask:
- Are qualified visitors inspecting the preview / real work?
- Are they reaching price / checkout?
- Is checkout initiation at least occurring?

If qualified traffic engages but almost nobody approaches checkout, stop buying more traffic and fix **fit / proof / value / page**.

### Around $250

Primary review point.

Interpret by stage:

- clicks without real arrivals → technical / click-quality issue;
- arrivals without product inspection → ad/page mismatch;
- inspection without checkout → offer / proof / ownership / price problem;
- checkout starts without purchase → checkout / trust / price problem;
- purchase without access/use → fulfillment/onboarding problem.

A few purchases justify another bounded test, not automatic scale.

### At $400 with zero verified purchases

Do not continue the same direct-purchase hypothesis automatically.

Reconstruct the evidence and choose one:
- change the creative hypothesis;
- change the conversion argument / proof;
- test a higher-intent entry such as an email follow-up at the paywall;
- reconsider price only after evidence points to price rather than confusion or trust.

Do not declare “RPD has no market” from one $400 test.

---

# 4. Economics we will use for the first read

These are operating thresholds, not industry benchmarks.

Current $79 revenue leaves little room for sloppy acquisition.

Provisional interpretation:

- **≤ $35 CAC:** promising.
- **$35–50 CAC:** potentially workable; inspect refunds, support and activation.
- **$50–60-ish CAC:** thin standalone economics.
- **Above standalone contribution:** do not rationalize with hypothetical coaching / app LTV.

Any downstream value must be measured as **incremental contribution after delivery cost**, not gross future revenue.

Track separately:
- RPD purchase;
- FORM trial start;
- FORM paid subscription;
- RPD → coaching inquiry;
- RPD → coaching client;
- referral.

Do not subsidize RPD acquisition based on those until real conversion probabilities exist.

---

# 5. Execution / outcome roadmap after the sale

Acquisition is only useful if the runner can use what they bought.

## Before purchase

Show suitability:
- current weekly volume;
- recent long-run capability;
- training-day commitment;
- race-date fit;
- pace / performance prerequisites as actually authored.

Do not collect $79 and reveal a disqualifying rule afterward if we already knew the rule.

## Immediately after verified purchase

1. Full owned access.
2. Access email / recovery.
3. Supported start date.
4. Week 1 visible.
5. First assignment directly usable.

## Week 0 / Start Here

Must explain:
- race target vs working band;
- how to interpret effort;
- easy-day purpose;
- missed-session rule;
- interrupted-week rule;
- race-too-close rule;
- repeated inability to complete key work;
- stop / review conditions for pain, illness or adverse conditions;
- fueling / weather guidance only where appropriately authored.

## Milestones

Low-burden evidence only:
- intended work completed? yes / no;
- RPE / reserve;
- reported limiter / context;
- optional note.

Missing data remains unknown. Do not render absence as failure.

## Outcome

When voluntarily available:
- adherence;
- key-session progression;
- race result;
- what limited the runner;
- whether they would recommend the product;
- whether they inquire about coaching / remain in FORM.

---

# 6. What we explicitly are NOT building before Test 01

- [ ] No app-required RPD purchase.
- [ ] No full native RPD entitlement project as a launch dependency.
- [ ] No Android app solely for this pilot.
- [ ] No beginner / lower-mileage RPD edition merely to widen targeting.
- [ ] No heavy human support tier.
- [ ] No giant adaptive pace engine.
- [ ] No community obligation.
- [ ] No affiliate / influencer program.
- [ ] No multiple simultaneous price tiers.
- [ ] No urgency timers / fake scarcity.
- [ ] No six micro-copy variants.
- [ ] No retargeting campaign until a meaningful high-intent pool exists.
- [ ] No scientific encyclopedia on the sales page.

---

# 7. Retargeting — only after the pool exists

Eligible high-intent groups may include:
- real product-page visitors;
- preview users;
- paywall / price viewers;
- genuine checkout starters;
- meaningful video viewers if the pool is large enough.

Exclude buyers.

Retargeting should answer objections:
- exactly what is included;
- who should not buy;
- what a real week looks like;
- no required extra subscription;
- what happens after payment;
- process evidence / latest study state.

Do not create a retargeting budget merely because ten people visited the page.

---

# 8. December evidence plan

Hope / José remain process evidence until verified race outcomes exist.

Before December 5:
- use real filed work;
- use verified progression;
- label results as pending;
- do not imply validation.

After December 5:
- publish both outcomes honestly;
- update landing page / proof section;
- create outcome creative only from verified facts;
- compare Test 01 pre-result economics with post-result acquisition.

A negative or mixed result is information. Do not hide it or retrofit the claim.

---

# 9. Current status board

## Already done

- [x] Product has a live $79 Stripe checkout.
- [x] Weeks 1–4 are the open public preview.
- [x] Week 5+ routes toward purchase.
- [x] Public free-plan language has been corrected on primary related surfaces.
- [x] Initial Meta distribution master brief exists.
- [x] Multiple independent reviews have been collected.
- [x] FORM-paid direction is now recognized: FORM will not remain an indefinite free product.

## Next — do now

1. [ ] **Product truth pass** — pace band, ladder, final session, stress days, calendar.
2. [ ] **Ownership policy** — $79 rights, paid FORM relationship, support / refund.
3. [ ] **Fulfillment architecture audit** — choose the smallest immediate entitlement path.
4. [ ] **Implement verified Stripe fulfillment.**
5. [ ] **Implement Purchase / CAPI / GA4 reconciliation.**
6. [ ] **Build unified RPD conversion page.**
7. [ ] **Select / verify one real proof asset.**
8. [ ] **Five-runner comprehension test.**
9. [ ] **Produce Creative A + Creative B.**
10. [ ] **QA mobile / feed / checkout / events / access.**
11. [ ] **Launch Test 01 at $25/day.**
12. [ ] **Read at ~$100 / ~$200 / ~$250, hard review by $400.**

---

# 10. Decision rule for the team / future agents

When a proposed task appears, ask:

**Does this increase our ability to learn one of these four things?**

1. Does the right runner recognize the problem?
2. Does the product feel worth $79?
3. Can we acquire a buyer at workable contribution economics?
4. Can that buyer execute without hidden coaching?

If not, park it until after Test 01.

---

# 11. North star

Not CTR. Not installs. Not likes.

The first real product success is:

> **A qualified runner sees the offer, understands exactly what it is, buys it, gets immediate access, starts at the correct time, and says: “This is exactly what I needed.”**

Then we ask whether enough of those people exist at an acquisition cost the business can sustain.
