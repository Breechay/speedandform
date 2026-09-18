# FORM Landing Page Test 02 — Master Brief
**Date:** September 18, 2026  
**Owner:** Brice / FORM  
**Status:** Strategy brief for independent agent review before implementation  
**Canonical doctrine:** `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`

---

# 1. Why this exists

Meta Test 01 proved that the ad can generate traffic. The larger opportunity is the landing experience after arrival.

The campaign was paused September 18 at:

- Campaign: `FORM · Miami · Run · Test 01`
- Meta campaign ID: `52675461137200`
- Spend: **$70.62**
- Impressions: **2,424**
- Link clicks: **51**
- Meta-reported landing-page views: **43**
- Campaign-tagged GA4 sessions from the latest read: **70**
- Engaged campaign-tagged GA4 sessions: **11**
- Known real paid-social coaching inquiry: **1** (Jorge)
- September 16 FORM Test Lead remains excluded from real-inquiry reasoning.

Derived directional metrics:

- Cost per link click: ~**$1.38**
- Cost per Meta LPV: ~**$1.64**
- Link click → Meta LPV: ~**84%**
- GA4 tagged engagement rate: ~**16%**
- Observed spend per known real inquiry: ~**$70.62**, not a stable CPA because n=1 and lead instrumentation remains imperfect.

## Critical interpretation

The new Run Development homepage work had **not reached Netlify production during Test 01**. Visitors continued seeing the older production landing experience.

Therefore:

> **Test 01 is a clean baseline for the old live landing page.**

Do not describe September 17 repo changes as visitor exposure unless a production deploy record proves otherwise.

Test 02 begins only after the new landing experience is verifiably live. Record the exact deploy ID, commit, and publication time.

---

# 2. What Test 01 taught us

## Acquisition is not the first problem

The ad earned clicks at a reasonable cost and frequency remained low enough that fatigue was not the obvious constraint.

The weak signal appeared after arrival:

**click → loaded page was healthy enough; loaded page → meaningful engagement / inquiry was weak.**

Do not change audience, ad concept, placements, offer, and landing experience all at once. We want the next test to isolate the page as much as possible.

## The old page over-explained

Repeated owner reactions during review:

- too many words;
- too many reassurances;
- too many labels;
- too many sentences explaining what another sentence already communicated;
- too much generic coaching language;
- too much service narration before a visitor had earned or requested the detail;
- proof shown too early;
- mobile first fold felt like a wall of copy.

The recurring failure pattern:

> **make the point → explain the point → reassure the point → explain what happens next.**

The correction:

> **say it once, then move on.**

Use progressive disclosure.

---

# 3. Non-negotiable brand doctrine

Read `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md` before proposing copy.

The homepage is not allowed to collapse back into:
- personalized coaching;
- custom plans;
- accountability and support;
- unlock your potential;
- train smarter;
- tailored to your lifestyle;
- achieve your goals;
- generic “evidence-based” positioning;
- five-feature service stacks in the hero.

The identity comes from Brice's actual coaching practice:

- **I develop runners.**
- **I look for ease.**
- Running should click: fluid, connected, almost meditative.
- Look for what is fighting the run.
- Hear the out-of-tune note.
- Change what matters most, not five things at once.
- The same visible trait may matter in one runner and not another.
- Watch the next rep and see whether the cue earns its place.
- Frequency teaches the body.
- Ten minutes counts.
- A cue becomes a habit. A habit becomes the way you run.
- **Form is multiplied by every step.**
- Ease does not mean easy; hard work can still be organized and confident.
- Internal state, choices, thoughts and attitude are part of the coaching.
- The work should stay with the runner.
- **Like a kite upon the wind.**
- **Reveal what wants to be set free.**

Public copy must preserve the evidence boundary. Do not publish universal claims such as “fixing form makes everyone faster” or injury-prevention guarantees.

---

# 4. Page architecture for Test 02

## First screen

The first screen must remain extremely sparse.

Preferred current structure:

**Run Development**  
**Run better.**  
**8 weeks · $1,200**  
**Work with Brice →**

No:
- “Running coaching with Brice” kicker;
- free-assessment reassurance;
- “start with a conversation” reassurance;
- explanatory body paragraph;
- stacked location/service labels unless testing proves they are necessary.

The visual should do substantial communication.

## Position 2

Go directly into:

# I develop runners.

No Simon result before this.

The visitor should understand Brice's way of seeing running before seeing proof.

## Philosophy / method layer

Homepage = felt philosophy, not the entire manifesto.

Possible beats:

1. **Running should click.**  
   Fluid. Connected. Almost meditative. When it does not, I look for what is getting in the way.

2. **Change what matters most.**  
   The same movement can matter in one runner and not another. Change the thing that will free the most.

3. **Repeat until it belongs to you.**  
   Ten minutes counts. A cue becomes a habit. A habit becomes the way you run.

Visual pause:

> **Like a kite upon the wind.**

Small supporting line only if it improves comprehension:
> Ease. Confidence. Nothing fighting what wants to move.

## Coaching / observation layer

Use specific coaching behavior, not service copy.

Material to preserve:
- out-of-tune note;
- cue one thing;
- watch next rep;
- listen to internal state;
- pace and HR do not tell the whole story;
- form multiplied by every step;
- strength supports control/capacity when needed.

The homepage should link to `/the-method` for depth rather than carrying every explanation.

## Proof

Proof comes after the visitor understands the philosophy.

Simon or another athlete can appear here.

Do not make the athlete result the entire case. Prefer:
- what Brice noticed;
- what was practiced;
- what the athlete learned or owned;
- then the result.

Never invent details that were not observed or documented.

## Offer

Keep the offer mechanically clear and short.

**Individual running coaching**  
**$1,200 / 8 weeks · Miami**

Possible scope:
- **Plan — Your week**
- **Practice — Weekly track**
- **Adjust — As you develop**

One CTA.

No paragraph explaining the CTA unless testing shows confusion.

Remote and Run + Strength should be revealed when relevant rather than forcing all pathways into the first offer block.

## Intake

Remove unnecessary framing.

Do not display:
- “I read every inquiry myself.”
- visible “Coaching you’re interested in” heading if the control works without it;
- “An inquiry only. No payment or booking yet.”
- repeated explanations about what happens after submission.

The questionnaire itself should carry the interaction.

---

# 5. Visual direction

The landing experience must feel like FORM, not like a SaaS landing-page template.

## Desired qualities
- cinematic;
- highly edited;
- restrained;
- B&W photography / motion where appropriate;
- warm cream reading surfaces;
- dark, high-contrast ink;
- strong Georgia-style serif moments;
- system sans body;
- mono used sparingly for labels/data;
- substantial whitespace;
- one thought per fold;
- mobile-first hierarchy;
- no decorative clutter added merely to “improve conversion.”

## Current preferred coaching visual

Use the existing black-and-white track coaching photograph rather than the analysis-overlay video as the primary coaching image.

The image should imply:
- this is real;
- this is observed;
- this is practiced;
- Brice is present.

---

# 6. What Test 02 should actually test

Do not make five strategic changes and call it an A/B test.

## Control
Test 01 visitor experience:
- current/old live page at the time of the $70 baseline.

## Test 02
Keep acquisition machinery as close as possible:
- same ad concept;
- same audience;
- same placements;
- same $1,200 offer;
- same campaign objective unless instrumentation forces a documented change.

Change:
- landing experience.

Use a new campaign/content identifier so GA4 can separate it cleanly.

Recommended naming:
- Campaign: `FORM · Miami · Run · Test 02`
- UTM content: `landing_method_v1`
- internal page marker: explicit version string.

## Primary outcomes

1. qualified coaching inquiries;
2. completed inquiries;
3. intake starts;
4. engaged campaign-tagged sessions.

Secondary:
- CTA interaction;
- scroll depth / meaningful method exposure if measured honestly;
- LPV rate;
- bounce / engagement;
- mobile vs desktop differences.

Do not optimize around CTR if the ad remains unchanged.

---

# 7. Questions independent agents must answer

Each reviewer should work independently before seeing other reviewers' conclusions.

## Agent A — Conversion strategist
Evaluate:
- Does the page preserve the ad promise immediately?
- What is the minimum information required before the first CTA?
- Where is uncertainty useful vs harmful?
- What is the single highest-friction point?
- What should be removed, not added?
- What would you test first with only 50–100 paid visits?

## Agent B — Mobile UX critic
Review 320 / 375 / 390 / 430 widths.
Evaluate:
- first 3 seconds;
- text density;
- thumb path;
- visual hierarchy;
- scroll rhythm;
- CTA visibility;
- whether any fold feels like “work” to read;
- whether each section earns the next scroll.

## Agent C — Editorial / brand critic
Reject any sentence that could belong to hundreds of running coaches.
Check:
- voice;
- specificity;
- restraint;
- redundancy;
- whether poetic lines are over-explained;
- whether “ease” is being confused with “easy.”

## Agent D — Skeptical prospective athlete
Assume the visitor:
- came from Instagram;
- has seen fragments of FORM;
- may have watched Hope/José content;
- does not know the internal coaching doctrine;
- is interested but not yet convinced.

Answer:
- What do I think this is after 5 seconds?
- Why should I keep scrolling?
- What am I still confused about before clicking?
- What feels self-important or overwritten?
- What gives me confidence that this is real?

## Agent E — Evidence / claims reviewer
Check every performance or form claim.
Separate:
- observed coaching belief;
- documented athlete evidence;
- research-backed claim;
- marketing inference.
Remove anything presented more strongly than the evidence supports.

## Agent F — Visual / art-direction critic
Evaluate whether the page feels:
- expensive;
- authored;
- calm;
- coherent;
- recognizably FORM;
- unlike a landing-page template.

Return specific layout/crop/type/spacing changes, not adjectives alone.

## Agent G — Measurement / experiment reviewer
Audit:
- UTM continuity;
- GA4 campaign sessions;
- engaged session definition;
- form start/completion;
- Meta events;
- deduplication;
- test contamination;
- production publication boundary.

---

# 8. AI / landing-page platforms to evaluate

This is a shortlist for experimentation, not a migration decision.

## Unbounce

Best fit if the goal is:
**a dedicated paid-traffic landing-page laboratory.**

Current strengths:
- purpose-built landing-page builder;
- custom code/scripts/pixels;
- multi-step forms;
- AI copy;
- unlimited A/B testing on Experiment plan;
- Smart Traffic on higher tiers;
- Smart Traffic uses contextual multi-armed-bandit routing;
- Unbounce says optimization can begin after roughly 50 visits.

Current published monthly pricing, September 2026:
- Starter: $29
- Build: $99
- Experiment: $149
- Optimize: $249

What to test:
- build an isolated Test 02 page;
- maintain FORM design manually;
- preserve GA4 + Meta UTMs/events;
- run conventional A/B first;
- do not rely on Smart Traffic until conversion volume justifies routing complexity.

Risk:
- easy to become “landing-page-template FORM”;
- separate hosting/design system can drift from the actual site;
- another subscription and another source of truth.

Official references:
- https://unbounce.com/pricing/
- https://documentation.unbounce.com/hc/en-us/articles/360036411591-What-is-Smart-Traffic
- https://unbounce.com/product/smart-traffic/

## Framer

Best fit if the goal is:
**rapid high-taste exploration with AI assistance.**

Current strengths:
- AI agents generate and edit pages/sections/copy;
- visual canvas is much closer to Brice's design sensibility than most CRO builders;
- built-in A/B testing through Convert;
- variants stay visually editable;
- staging/branching on Pro.

Current published pricing:
- Pro: $30/month;
- Convert A/B testing add-on: $50 per 500,000 events.

Important experiment limitation:
- Framer's current A/B testing uses a same-day anonymous assignment model; longer cross-day conversion windows are not yet cookie-based.

What to test:
- recreate only the paid landing page, not the whole site;
- use AI to generate alternative compositions from this brief;
- retain Brice's visual judgment;
- test 2–3 meaningfully different continuations.

Risk:
- migration/hosting split;
- may be excellent for design exploration but unnecessary if final implementation stays in the repo.

Official references:
- https://www.framer.com/solutions/ai-landing-pages/
- https://www.framer.com/help/articles/how-to-run-an-a-b-test-on-your-framer-site/
- https://www.framer.com/pricing

## Webflow Optimize

Best fit if the goal is:
**experiment on the existing site without rebuilding it in another platform.**

Current strengths:
- A/B testing;
- personalization;
- AI-optimized experiments;
- AI suggestions for variants;
- can work on non-Webflow sites through a lightweight JS snippet;
- can dynamically route variants based on performance/audience.

Pricing for Optimize on non-Webflow sites is currently sales-led.

What to test:
- keep speedandform.com in the existing repo/Netlify stack;
- add Optimize only to the paid landing experience;
- test copy, visual, section ordering and CTA variants.

Risk:
- enterprise-ish tooling may be overkill for current traffic;
- extra runtime layer;
- implementation/privacy review required before adding any visitor-level optimization script.

Official references:
- https://webflow.com/feature/optimize
- https://help.webflow.com/hc/en-us/articles/41435724828179-AI-optimized-optimizations-overview
- https://webflow.com/pricing

## Instapage

Best fit if the goal is:
**a more formal performance-marketing landing-page operation.**

Current strengths:
- dedicated landing-page platform;
- A/B experiments;
- AI Experiments;
- dynamic traffic allocation to better-performing variants.

Risk:
- likely more platform than this funnel needs right now;
- another design/runtime stack;
- feature availability depends on subscription.

Official reference:
- https://help.instapage.com/hc/en-us/articles/14497156277271-AI-Experiments

---

# 9. Platform decision rubric

Score each candidate only after building a real FORM sample page.

Criteria:

1. **Can Brice make it beautiful without fighting the tool?**
2. **Can it preserve the existing FORM visual language?**
3. **Can it preserve UTMs and current GA4/Meta measurement?**
4. **Can it run a clean test at our traffic level?**
5. **Can it avoid slowing the page?**
6. **Can it use the existing domain cleanly?**
7. **Can we export / retain ownership of the work?**
8. **Does it create another source-of-truth problem?**
9. **Can we learn something we cannot learn with the current repo?**
10. **Does the monthly cost make sense relative to a $70–100 test budget?**

A tool does not win because it has more AI.

It wins only if it helps us learn faster without degrading the brand.

---

# 10. Recommended workflow before Test 02

## Pass 1 — independent critique
Give this brief plus current source screenshots to Agents A–G.

No agent sees another agent's recommendation first.

## Pass 2 — synthesis
Create one findings ledger:
- keep;
- remove;
- unresolved;
- experiment;
- evidence needed.

Do not average opinions. Resolve contradictions against:
1. observed Test 01 behavior;
2. Brice's stated reaction;
3. doctrine;
4. mobile readability;
5. measurable hypothesis.

## Pass 3 — three page concepts

Create only three concepts:

### Concept A — Current doctrine, compressed
Our existing new homepage direction, edited further for conversion.

### Concept B — Coaching-first
Hero remains sparse, but the next screen immediately shows Brice coaching / observing before philosophy copy.

### Concept C — Outcome-to-method
Hero → one clear runner problem / desired state → immediate method → offer.

All concepts retain:
- Run Development;
- $1,200 / 8 weeks;
- FORM visual identity;
- no generic coaching copy;
- no proof-first Simon block.

## Pass 4 — visual prototypes
Prototype at:
- 390 × 844;
- 1440 desktop.

Judge phone first.

## Pass 5 — user review
Brice should react quickly:
- what do I glance at?
- what do I skip?
- where do I want to keep going?
- where do I feel marketed to?
- what feels like me?

His “I would skip this” response is a useful editorial signal.

## Pass 6 — implementation
Only after the concept is selected.

## Pass 7 — production verification
Record:
- commit;
- deploy ID;
- publish timestamp;
- exact page marker;
- live screenshot;
- GA4/Meta transport verification.

That timestamp starts Test 02.

---

# 11. Test 02 operating rules

- Do not restart paid traffic before production verification.
- Do not silently edit the page mid-test.
- If a page edit is necessary, create a new version marker and timestamp.
- Do not change ad creative and landing concept simultaneously unless explicitly creating a new test cell.
- Do not scale from clicks alone.
- Do not declare a winner from one inquiry.
- Do not call a tooling algorithm “AI optimization success” without enough actual conversion events.
- Keep the decision grounded in qualified inquiries.

---

# 12. Current recommendation

Do **not** migrate the whole website.

First:

1. refine the existing landing architecture using this brief;
2. ask multiple independent agents;
3. prototype three concepts;
4. optionally reproduce the strongest concept in **Framer** and **Unbounce** as design/CRO challengers;
5. compare the actual outputs, not feature lists;
6. implement the winning direction either in the repo or in a dedicated campaign page;
7. launch Test 02 only after production verification.

The default durable source remains the Speed & Form repo unless a platform proves it can materially improve the test without damaging brand ownership.

---

# 13. One-sentence assignment for every reviewer

> **Make a visitor who clicked a FORM running ad understand what Brice does, feel why it is different, and want to tell him about their running — with the fewest necessary words and without turning FORM into a generic conversion template.**
