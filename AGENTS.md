# Start here: Speed & Form

> **Current orientation:** after this file, read [Agent Orientation](docs/AGENT_ORIENTATION.md). It maps the current company, source-of-truth mesh, operating hats, October lanes, staleness rules and active cross-repo documents. Older dated sections below remain useful decision history but do not automatically outrank newer verified owner decisions.


## Operating console and daily operations
Before changing Brice's priorities, open loops, daily brief, calendar projections or cross-surface operating records, read [Operating Console contract](docs/operations/CONSOLE-CONTRACT.md). `/coach/ops/` and the scheduled daily brief share the same private `operating_console_read` projection. Current athlete decisions include both `published` and `delivered_externally`; do not resurrect old Calendar or automation prescriptions. Change the owning source, read it back and record the private receipt. Do not publish private financial, health or athlete operating facts in this repository. [Console release checklist](docs/operations/CONSOLE-ACCEPTANCE-20260930.md) separates tested code, actual publication and remaining checks. Existing athlete dossiers stay at `/coach/labs/`; Increments access is not yet an integration.

For public site, Plans, Labs, plan packaging, or app-to-coach work, read:
1. [FORM Run Development Manifesto](docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md) before describing FORM coaching philosophy, Run Development, movement/form work, athlete development, coaching voice or homepage identity.
2. [Current state and roadmap](docs/roadmap/FORM-ROADMAP.md).
3. [Current commercial execution](docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md) before touching Meta, RPD, the coaching funnel, or the Unbounce exploration.
4. **Before touching coaching acquisition, homepage service architecture, Meta coaching creative, running/form analysis, coaching pricing or intake:** read [FORM coaching offer vision](docs/marketing/FORM_COACHING_OFFER_VISION_2026-09-16.md) and [Referral + offer creative brief](docs/marketing/FORM_REFERRAL_CREATIVE_BRIEF_2026-09-16.md). The September 16 realization is ecosystem-level: Run Development and FORM Analysis are different jobs, not different quantities of the same package. The September 17 manifesto is the newer authority for coaching philosophy and voice.
5. [Existing guardrails](docs/DO_NOT_BUILD.md) and [project context](docs/CURSOR_CONTEXT.md).
6. For app work: [Plan app audit brief](docs/audits/PLAN-APP-AUDIT-BRIEF.md).
7. For UI work: [Surface audit brief](docs/audits/SURFACE-AUDIT-BRIEF.md).
8. For any athlete-facing writing, ads, landing pages or onboarding: [Athlete Language Rule](docs/marketing/ATHLETE_LANGUAGE_RULE.md).
9. Before creating or changing any prospect-, buyer-, athlete-, account- or customer-facing email: read [FORM Email Experience Standard](docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md) and [Email Execution Roadmap](docs/marketing/EMAIL_EXECUTION_ROADMAP_2026-09-16.md).

Active user instructions take precedence. Do not call a branch change live without checking production.
October 1 public identity decision: read [Brand authority](docs/BRAND.md). Speed & Form’s public homepage and services use forest and chalk, and the SF emblem appears alone in public headers and footers. Existing FORM app/study/Labs room styling stays distinct. Use Brice’s original track photograph for the personal homepage introduction; do not restore a lime headline dot or the rejected portrait backing/chamfer.
October 6 house signature decision: **the bend**. Before adding any background, texture, pattern, ornament or motion to a public surface, read “October 6 · The bend” in [Brand authority](docs/BRAND.md). It records the questions to ask in order, the measurements, and what was ruled out. The bend is generated from real track measurements by `scripts/sf-bend.cjs`; never redraw it, mirror it or hand-edit the SVG in `index.html`. The homepage practice fold comes from `scripts/public-study-preview.cjs`. Run `node tests/sf-bend.cjs` after touching either.
October 6 brand page: `/brand/` is the public form of [Brand authority](docs/BRAND.md), with the downloadable kit under `/assets/brand/kit/`. When a house rule changes, update `docs/BRAND.md` and `brand/index.html` together, then run `node scripts/build-brand-kit.cjs`, `node scripts/render-brand-kit.cjs` and `node tests/brand-kit.cjs`. Use the kit templates for any invite, story, email header or document cover instead of composing the bend by hand.
September 15 decision: Race Pace Durability is a paid 15-week plan with Weeks 1–4 open as the public preview and the complete plan priced at a one-time payment of $79. Moving beyond Week 4 routes to the purchase page. The old September 12 optional-support/free-full-plan model is retired. Live Stripe hosted checkout is connected. Stripe returns successful buyers to the RPD purchase confirmation flow, the Supabase webhook creates the paid entitlement, the same browser unlocks Weeks 5–15, and purchased access can be recovered on another device with the verified checkout email. Personal coaching retains its separate flow.
September 16 coaching decision: Run Development remains the flagship managed relationship at the current public 8-week / $1,200 structure. A bounded FORM Analysis offer is now an active product hypothesis for runners who have their own training structure or a specific running question. Its name, scope, artifact, one-vs-two-contact shape and price are not approved public facts. Do not publish them until the offer-vision gates are resolved. Analysis software such as Ochy is an instrument, not the authority; never present an aggregate software score as an objective grade of the runner. The current complimentary Run Development assessment must be distinguished from any paid Analysis before launch.
September 17 doctrine decision: Run Development is described from the actual coaching practice, not generic service language. The north star is **Reveal what wants to be set free.** Brice looks for ease, fluidity, rhythm and what is fighting the run; chooses the highest-value change rather than correcting everything; layers cues; uses repeated exposure to make better movement and habits belong to the athlete; and coaches internal state, choices and attitude alongside the physical work. Public surfaces should reveal this gradually rather than dump the full method at once. Read the manifesto for the canonical source language and evidence boundaries. Homepage identity stays sparse; `/the-method` is the deeper public explanation for the out-of-tune instrument, next-rep test, form multiplied by every step, frequency as exposure, internal state and athlete ownership. Do not send a general coaching-philosophy link to a specific Lab study when `/the-method` is the better destination.
September 27 terminology decision: **gait retraining** is approved technical language for the deliberate movement-change work inside Brice's coaching: useful changes to posture, rhythm, mechanics or movement strategy reinforced through cues, feedback, practice and repeated exposure. **Run Development** remains the umbrella and hero promise; **programming** names the authored training structure. Approved supporting descriptor: **RUN DEVELOPMENT · GAIT RETRAINING · PROGRAMMING**. Use it as quiet supporting identity copy, not as a replacement hero. Do not use `gait retraining` to imply a universal ideal form, diagnosis, injury treatment or guaranteed running-economy improvement.

### FORM selective-intervention rule
**Not everything needs fixing. Some things just cost you more.** FORM does not mean forcing athletes toward one visual ideal. For coaching, analysis, product logic and athlete-facing interpretation, do not label a movement difference as a problem merely because it differs from a textbook model or receives a low software score. Establish a meaningful cost in context first, then make the smallest useful intervention and retest. `Cost` may include unnecessary effort, tension, disrupted rhythm, reduced control/repeatability, discomfort or difficulty sustaining the work. Keep athlete report, observation, measurement, software interpretation and coach decision distinct. Do not turn this principle into unsupported medical or causal claims.

After relevant work update the roadmap: status, evidence, blocker, next action, tested commit and actual deployment state. Maintain one checklist.
Do not invent results, auto-publish private athlete data, silently change assignments, or promise unverified app features. Measured evidence, athlete reports, coach reads and decisions remain distinct.
Check remote main and concurrent work before release. Batch verified changes to conserve Netlify credits.

## Athlete language — no decoding
Do not assume an athlete knows training vocabulary because they are fast, experienced or high-volume. Fitness literacy and coaching literacy are different. The coach owns the complexity; the athlete gets a clear action and a clear reason to care.

For ads, landing pages, product pages, emails, onboarding and athlete-facing app copy:
- lead with the outcome or felt problem, then what they get and what they do;
- put methodology, physiology and FORM doctrine later;
- spell out abbreviations and prefer plain language over coaching shorthand;
- generic language is acceptable for utility when it is true and instantly understood; generic language is not acceptable as a substitute for FORM's identity or coaching philosophy;
- say the point once. Do not make a claim, explain the claim, reassure the reader about the explanation and then explain what happens next;
- reveal information when it becomes relevant instead of front-loading every reassurance and process detail;
- let verified results and execution proof carry sophistication instead of forcing clever copy;
- prefer `one-time payment of $79` over `$79 once`, `try Weeks 1–4 free` over `inspect the opening four weeks`, and `hold race pace longer` over internal phrases such as `race-pace ownership`;
- Meta copy generation may be used as an ideation source. Keep the clearest truthful lines and reject invented personalization, guarantees, features or claims.

Standing test: **could a fit runner with little coaching vocabulary understand the first sentence immediately?** If not, simplify it. Then ask: **would Brice actually say this, or could it sit unchanged on 500 other coaching websites?** Identity copy must pass both tests. Read the full [Athlete Language Rule](docs/marketing/ATHLETE_LANGUAGE_RULE.md).

## Visual rule — one divider per boundary
Brice's standing rule applies to app and site: no double dividers, stacked rules or two nearby lines separating the same content. Choose one owner for each boundary. Never combine a card's bottom border with the next card's top border, a disclosure border with its container border, or an input underline with a decorative result rule. Prefer spacing when the boundary is already clear. During every UI review inspect adjacent components, open/closed disclosures, forms and the footer at desktop and phone widths. Remove duplicate rules before calling the surface ready. Tables may retain one separator per row; this is not a ban on useful structure.

## Writing voice — do not sound like a robot trying to sound scientific

FORM copy should sound like a coach who understands the work, not a model trying to make simple ideas sound important.

For athlete pages, plans, Labs / Human Performance Studies, method copy and study interpretation:

- prefer the shortest natural sentence that says the real thing;
- use ordinary coaching words before abstract system words;
- one sentence should usually carry one idea;
- one phase name should usually name one job;
- do not stack three verbs or three concepts just to make a phase sound comprehensive;
- do not turn simple coaching decisions into pseudo-scientific abstractions;
- do not use clinical, academic or systems language merely to make the copy feel rigorous;
- never make the reader decode phrases such as `bounded by running response`, `confirm inside the rising run week`, `development needs`, `dose architecture`, or similar constructions when plain language works;
- avoid noun piles such as `useful tissue and force development` when the real point is simply `build muscle and get stronger`;
- do not narrate the methodology twice. State the action, then the reason only if the reason adds something;
- sophistication should come from the observation and the decision, not from vocabulary;
- if a line sounds like it was written for a white paper, rewrite it as something Brice could say to the athlete out loud.

Preferred:
- `Find the tolerable dose. Nothing is pushed while the body learns to be loaded at all.`
- `Move development toward chest, arms, upper back and medial thigh. Legs stay conservative.`
- `Running is the constraint, so the strength side yields.`

Avoid:
- `Learn the dose, redirect it toward the athlete's actual needs, then confirm it inside the rising run week.`
- `Build useful tissue and force while lower-body fatigue stays bounded by running response.`

Standing test: **Would a smart runner read this once and understand it without translating it? Would Brice actually say it out loud?** If either answer is no, rewrite it.

## Writing — American spelling
Use practice, practiced and practicing (never practise, practised or practising) in site/app copy and audit documents. Keep instructions plain and address the reader as “you.”

## Typography is an acceptance rule
Read [FORM typography standard](docs/FORM_TYPOGRAPHY_STANDARD.md) before any app or site surface work. Preserve readable hierarchy, line lengths, data alignment, responsive stacking and one divider per boundary. Do not trade readability for decorative scale or tiny labels. Use plain punctuation instead of em dashes. The standard is also installed in FORM-iOS; record actual device checks rather than assuming them.

## Connected surfaces
Before changing identity, plans, execution or records, read [FORM connected surfaces](docs/FORM_CONNECTED_SURFACES.md). FORM, Forge, speedandform.com and the Console must share a documented, versioned connection. Read [HYROX app brief](docs/HYROX_APP_BRIEF.md) for that extension; it does not replace the active Adrian release gate.

### Athlete coaching source-of-truth rule
For a coached athlete, the canonical future prescription is the athlete's authored assignment / published coach decision in the FORM Athlete System. The public study/site and the native app are projections of that same decision. Never fix drift by hand-editing one surface and leaving the others behind. If Brice changes an athlete-specific band, plan version, future session, recovery or instruction on the study/site, first or simultaneously update the canonical athlete record; FORM must receive it through the normal assignment/feed path. Completed/history evidence stays pinned to the version actually performed. A static public-study change that disagrees with the canonical athlete assignment is a bug, not a new authority.

## Simon / Study 003
Before any Simon plan, evidence or study edit, read [Study 003 protocol](docs/studies/SIMON-STUDY-003.md). R2 supersedes the earlier automatic Thursday escalation and October 27 continuous test. Preserve historical evidence, very easy recoveries, the separated Gate 01 window, and the approved-publication/app parity contract.
## Adrian nutrition: current release and timing
The blanket v1.5.2 website hold is superseded. Read [current release scope](docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md) and the current review-context JSON. Keep the companion available; do not recreate the blanket shutdown from historical notes. Do not reinsert pre-run snacks, between-session food, a lifting exemption, a fixed fasting interval or immediate post-exercise meals without individualized clinical guidance. No reported history is automatically a new incident or a plan-caused outcome. Keep private medical details off public surfaces. Native assignments are unchanged.

## Public study acquisition projections · October 1
Whenever Speed That Endures changes, review `data/public-studies/speed-that-endures.json`, the homepage preview and running-coaching example together. The projection contains only approved public evidence, never a private feed. Update the latest completed ask, coach conclusion, end-of-study state and verified race results when applicable; scheduled asks remain future. Prior race results are not automatically lifetime PRs. Build with `node scripts/build-commercial.cjs` and run `node tests/public-study-preview.cjs`. The study source hash is a review gate, not a result extractor. If a study edit does not change acquisition content, still record that review and refresh the hash.


<!-- FORM-OBSERVATION-CONTINUITY-20261006 -->
## Observation-led progression · October 6
Read [FORM observation-led progression](docs/FORM_OBSERVATION_LED_PROGRESSION.md) before interpreting cost, continuous versus broken work, threshold progressions or copying a study observation to another athlete. Success is controlled goal-relevant running and recovery, not suffering. José's current continuous-support branch is athlete-specific. Preserve existing clinical/coach holds. Archived Durability & Compression and Sustained Pressure are distinct programs, not current prescriptions. Coach/app feed readback and physical-device screenshots are separate claims.
