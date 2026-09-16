# RPD Landing Page Conversion Notes — public Unbounce research

**Date:** September 16, 2026  
**Status:** public research refreshed; authenticated workspace audit still pending connector login

This note records conversion patterns worth borrowing while the connected Unbounce browser profile is not yet authenticated. It does not replace the later in-account audit.

## Evidence behind the simpler copy rule

Unbounce's current healthcare / wellness benchmark says pages around a **5th–7th grade reading level** had the strongest median conversion rate in that category (**10.8%**). Their wider benchmark dataset covers more than **57 million conversions**.

References:
- `https://unbounce.com/conversion-benchmark-report/healthcare-wellness-conversion-rate/`
- `https://unbounce.com/conversion-benchmark-report/`

This is directional evidence, not a promise that FORM will convert at that rate. It reinforces the operating decision already supported by our own athletes: simplify the athlete-facing surface and let the training/result carry sophistication.

Unbounce also maintains current fitness landing-page and 2026 swipe-file examples. The useful pattern is not visual mimicry; it is disciplined campaign-page focus: one audience, one promise, obvious CTA, visible proof, and low decoding cost.

References:
- `https://unbounce.com/landing-page-examples/fitness/`
- `https://unbounce.com/landing-page-examples/best-landing-page-examples/`

## What survives the research

### 1. Message match is a launch rule

The ad question and the landing-page question should match. Creative A asks `Can you keep the pace?`; the RPD sales page should answer that same question immediately rather than opening with a different doctrine or product explanation.

### 2. Use the real athlete image as continuity and proof

The first paid ad uses a high-engagement FORM athlete group photo. Repeating that image directly after the hero creates a visual handoff from ad → page and gives the visitor evidence that FORM is a real practice with real runners.

Truth rule: caption it as FORM runners / FORM practice. Do not claim every pictured athlete personally uses Race Pace Durability unless verified.

### 3. Keep the first action obvious

For cold traffic, `Try Weeks 1–4 free` is the lowest-friction next step. Keep the full-plan $79 action visible, but do not force a first-time visitor to buy before they can see the product.

### 4. Social proof should reduce uncertainty, not decorate the page

Use proof close enough to the offer that it helps answer `Is this real?`:
- real FORM runners high on page;
- Hope/José as live RPD use, with results explicitly pending;
- Simon as broader verified FORM coaching evidence, clearly distinguished from the RPD study.

### 5. Price and product scope should be literal

Do not make the buyer decode packaging. State:
- 15 weeks;
- 6 days/week;
- roughly 45→60 miles/week;
- Weeks 1–4 free;
- one-time payment of $79;
- no subscription required for RPD;
- coaching separate.

### 6. Remove distractions before adding persuasion

A $79 product page does not need a long intellectual argument above the fold. Outcome → what it is → what they do → proof → fit → price is enough. Method can sit lower for the visitor who wants it.

## Current RPD page order to preserve/test

1. `Can you keep the pace?`
2. offer facts + free-preview CTA
3. FORM athlete photo / practice proof
4. `Run the pace. Hold it longer.`
5. simple 15-week progression
6. fit check
7. Hope/José live use
8. what the buyer receives
9. app/coaching distinction
10. price / checkout
11. final CTA

## Mobile acceptance recorded Sep 16

A deterministic **390px** render of the current sales composition was inspected and passed:
- hero stays legible;
- the FORM group image retains useful composition;
- CTAs stack cleanly;
- the four product facts remain readable;
- fit cards and $79 offer card do not overflow;
- the page keeps a clear visual hierarchy through the final CTA.

A production-equivalent 390px reconstruction of the free-preview Week 4 surface and Week 5 locked state also showed clean mobile hierarchy and no clipping. Live browser arrow QA confirmed Weeks 1–4 remain readable and Week 5+ never exposes prescription.

The remaining mobile-specific unknown is a physical-device/touch swipe gesture. It is a small interaction risk, not a sales-page visual blocker.

## Ideas to test later, not silently add now

- sticky mobile CTA after first scroll;
- shorter vs current page length;
- proof-first hero variant;
- CTA label test: `Try Weeks 1–4 free` vs `See the first four weeks`;
- moving one verified result closer to the first purchase CTA;
- concise FAQ only for objections that appear in actual traffic.

## Rejected patterns

Do not use:
- fake limited-time urgency;
- `secret`, `hack`, `transform in no time`;
- guaranteed finish time;
- personalized-plan claims for a fixed self-guided plan;
- wrong-distance marathon copy;
- needless jargon to make the product sound sophisticated.

## Authenticated Unbounce follow-up

When Brice logs into Unbounce in the connected browser profile, inspect the actual premium workspace for:
- relevant fitness/product templates;
- mobile layout patterns;
- CTA / social-proof / pricing blocks;
- AI copy suggestions using the truthful RPD offer;
- Smart Traffic/testing ideas;
- reusable patterns to park for FORM app, Forge, and a coaching-homepage challenger.

Production remains in the Speed & Form repo unless evidence supports a different choice.
