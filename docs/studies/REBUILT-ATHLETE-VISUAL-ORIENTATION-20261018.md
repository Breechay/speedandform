# The Rebuilt Athlete · Visual Orientation Contract

**Editorial and UI quality review, October 18, 2026.** Companion to the public [study](https://speedandform.com/labs/rebuilt-athlete/), [strength field guide](https://speedandform.com/labs/rebuilt-athlete/strength-and-speed/) and [speed workbench](https://speedandform.com/labs/rebuilt-athlete/speed-exposure/).

## Revised editorial hierarchy · October 18

The public main study now opens with a single thesis and Phase 00, followed by one current six-part status dashboard, the five systems, readiness phases, one developing-signals table, concise dated field log, and direct links to the strength and speed workbenches. Earlier October checkpoint charts, detailed long-run tables, ambitions and the complete evidence protocol are preserved in an expandable archive below the front narrative.

**Source chapter:** the April tibial-fracture / pre-injury-training illustrated chapter, including the original two embedded evidence images and the product-safety follow-up, was moved without cutting source content to [The Interruption](../../labs/rebuilt-athlete/archive/interruption/index.html). The main study retains a brief dated introduction and the link. This change reduced the main HTML from around 1.33 MB to roughly 240 KB, an approximately 82% reduction. Do not re-embed the original chapter into the main page.

**One authority for current status:** the six current fields are body, running, engine, tibial/recovery, movement, and life practice; each has a date or defined evidence state. Older numbers remain labeled historical rather than appearing in a second current-state panel.

**Signal table:** five lines (Running, Tibia, Strength, Fuel, Life) have state, observed evidence and one open question. States are descriptions of evidence maturity, never numeric grades or motivational scores. No system is called settled while the evidence is still emerging.

**Archive navigation:** public deep links into the original October notes open their enclosing native details element on hash navigation. The generated Study Index lists only the top-level editorial sections rather than each archived note. The archive and images must remain accessible with minimal JavaScript.

**Preservation rule:** keep cinematic type, archival textures, dramatic composition and the physical-source images. Reducing reading friction does not mean stripping decoration, smoothing everything into generic cards, or losing the filmic study identity.

**Acceptance checks:** Netlify main deploy ready; the illustrated archive route published and verified; TinyFish visual desktop and 390px mobile audit passed section rendering, content fit, mobile menu, index navigation and collapsed archive. The main HTML still needs periodic human reading in Safari/iPhone after future content changes. This is a published structural improvement, not a native FORM/Forge release.

## First glance, no deciphering

The first current-content view on Study 002, after its visual masthead, must answer:
- **What is this week's intention?** Oct 19–25 is recovery-first and dynamically chosen, not a rigid day-by-day commitment. iRun optional, speed not owed, 7–10 outdoor miles a preference not a requirement. Elastic impact work belongs to a later phase.
- **What was actually recorded?** 37.52 mi week ending Oct 18; Oct 18 track had 17:04.9 of eight timed work reps averaging 5:57–6:12/mi.
- **What is an estimate?** Garmin VO₂ max 52 on Oct 17, not laboratory VO₂ measurement; one reported 190-lb weigh-in is not a trend.
- **What is the weekly practice target?** 300 minutes yin/deep-stretch yoga Oct 19–25; actual completed time from Garmin Yoga activities when retrieved. A blank or zero-import chart is **not** evidence of no session performed.
- **Where do I go?** Direct links to week, A/B/C workouts, yoga log and speed graphs within one screenful of current overview on mobile where feasible.

Preserve FORM's theatrical/intentional art direction: parchment/ink, burgundy and muted blue on main study; charcoal/bone on the workbench. Decorative flourish is welcome where it supports identity. Do not flatten into generic cards and generic sports motivational copy.

## Six questions, one graph/task per question

| Question | Track | Source and epistemic state | Visual answer |
| --- | --- | --- | --- |
| How much faster running? | Work duration in 15-second *lap-average* pace bins for the Oct 10 onward observation period. Eventually second-by-second duration and 400/800/1mi/2mi stretches | Oct 10/13/17 lap screenshots, Oct 18 Garmin interval screens; original FIT files still pending | Bar chart with minutes, explicit date/source and type of measurement |
| Does a pace cost less? | Matched pace–HR comparisons, perceived effort, Garmin VO₂ estimate | VO₂ is device-estimated and HR sensor can transition. Comparable trials still pending | Aerobic tab; never equate a configured HR zone to verified LT1 |
| Is movement organized? | Cadence, stride length, ground contact time at comparable speeds | Garmin dynamics; different shoes/surfaces/pace confound | Mechanics tab with axis and unit; no ungrounded 'more efficient' conclusion |
| Does it last? | Repeat versus continuous duration, late-run drift, 24–48-hour recovery and tibial response | Current 400/800 laps and Oct 10 continuous 3-mile baseline; full FIT traces pending | Durability tab, no arbitrary cumulative-minute cutoff |
| Is strength progressing? | Load/reps/RIR for pull-ups, pressing, rows, front squats, hinges, glutes | Forge logs after native program is released and selected; PR #66 still draft and not device-proven | Strength A/B/C session menu now, trend chart only when logged |
| Can training be repeated? | Garmin Yoga minutes, sleep/HRV, lower-leg response, bodyweight trend | Garmin activity two-day window; no live site sync; one October 18 weight datum, not bodyweight trend | Weekly yoga completion bar (retrieved entries only) plus dated context |

## Page order and navigation

- **Main study:** visual masthead → CURRENT orientation (October 18) → old October 13 checkpoint explicitly historic → full chronological evidence and archival research. Current overview links directly to workouts, yoga and graphs. The old 'Now' label must not falsely suggest the page was last updated Oct 13.
- **Strength guide:** visible fast paths in hero; first week as flexible choice menu, not an invented attendance calendar; A Frame / B Chassis / C Detail executable prescriptions; yoga goal and Garmin logging; elastic archived later; running menu; measurement six-question legend; FORM/Forge release truth. Mobile TOC scrolls horizontally rather than taking a full screen, with active location state. Workout tables must fit phone width.
- **Speed graph:** always-visible speed/aerobic/mechanics/durability summary and development corridor note; initial 15-sec band histogram visible even without JavaScript; mobile bins legible; default graph aggregates documented segments (not entire FIT recordings). Tabs support anchored deep links.

## Honesty and freshness rules

Every salient figure carries a date and definition; never mix session-average, interval-average and second-by-second duration. Never count an absent Yoga session as a completed zero. Never infer one day's 190-lb weigh-in implies body-fat increase. Don't say the strength bank is in a user's installed app while Forge PR #66 remains a draft. The FORM support prescription for yoga exists, but the website is not automatically synced to Garmin. Activity connector provides only two-day lookback as of this review; explicit updates/backfills are required.

## Verification, October 18

- Netlify's current deploy reported ready; fetched public URLs showed the current study orientation, recovery-choice week, six measurement questions and nine pace-band bars.
- Repository checks: strength guide has nine opening/closing sections, no duplicate IDs, all local href anchors resolve, and inline scripts parse; speed page has five matched sections, no duplicate IDs, all local anchors resolve, and its scripts parse.
- Visual audit of the previous guide version found the need for easier table-of-contents navigation and no side-scrolling of workout sets on mobile. A horizontal sticky mobile TOC, anchor highlighting and fixed-width two-column workout tables were implemented afterward.
- **Quality judgment, not a user-test certification:** target at least 9/10 for information clarity and navigation. Real device reading, tap targets and performance still deserve a final human pass. The original main article's 1.3 MB media-heavy version has since been refactored. The new standalone illustrated interruption chapter owns its preserved source media, while the current main page is approximately 240 KB. See the revised editorial hierarchy above.

## Next evidence events

Original Garmin FIT files would replace interval-average approximation with actual time distributions. Once workouts are logged in Forge, introduce strength trends rather than decorative empty charts. Yoga updates should use unique Garmin activity IDs, deduplicate sessions, preserve exact duration and avoid treating old entries outside the two-day connector window as absent.
