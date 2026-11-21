# FORM 44.8 · Remote athlete first fold — design brief

**Drafted:** November 5, 2026. **Status:** exploration / prototype requested, **not native shipped**. **Design owner:** Product & Release with Brice; **source owner:** Athlete Steward; **editorial:** Communications & Concierge. Existing mounted FORM, Week, Races and Speed remain available, with access controlled by real entitlements.

## The idea

When a remote athlete opens FORM, the first fold should **make their own athletic life feel present** before showing Miami's collective life. One purposeful personal feature, a compact authentic observation, and a clear action; below, the shared Miami practice as a window into the home base. It should not feel like the user opened somebody else's local club website.

**Proposed top-level hierarchy:**

1. **Hero / personal anchor** — next race if genuinely targeted, otherwise a compelling sourced record or next capability being developed.
2. **The Record** — one or two carefully chosen marks and a short coach-authored or accurately system-labeled observation, with `as of` and `source` available on tap; never an invented “readiness score.”
3. **Your next meaningful action** — open the upcoming Week session, review previous filed effort, or file the actual workout (state-aware). Avoid CTA clutter.
4. **From Miami / FORM home base** — next hosted Thursday, live collective photos or brief from the field, selected permissioned athlete activity, and optional join details if the athlete is in Miami. Make clear this is *happening there*, not an assumption that remote people are attending.
5. **Halo** — floating round ghost envelope, understated unread dot, quiet concierge notes and personal race candidates when eventually implemented.

## Three real example treatments (source checked Nov 5)

### Hope · the race ahead

- Hero: **Orlando Half Marathon · Dec 5** / `Target` (not `Registered`). `30 days to go` on Nov 5, recomputed in athlete-local date context. Goal **sub‑1:30**, clearly aspirational.
- Record: current working mark `2.00 mi continuous at race pace`, next question: *“How far can you hold 6:45–7:00 without it coming apart?”*—label as **working measure**, not a race forecast, and offer a real planned next session.
- Tone: confidence through clarity, not invented certainty; never translate a single marker into a predicted finish time.

### José · the race ahead, distinct record

- Hero: **Orlando Half Marathon · Dec 5** / `Target`, sub‑1:30 goal. The event may match Hope's but the story must not be copy-pasted.
- Record: current working mark `8.00 mi continuous at race pace` from authored `athlete_marks`; latest independent filed run summaries can be subordinate. Current coaching question: whether he sustains 6:40–6:45/mi at lower relative cost without group pacing. Do not label an authored mark as verified race result.
- Presentation: Season/segment geometry may live under the hero, preserving the approved graphite-mist bars and selective featured-performance blue.

### Sohel · the capability being built

- Hero: **A longer run, made repeatable.** No race target is presently in `race_entries`, so don't generate a race countdown.
- Record: documented coach-import `6.60 mi` longest-run baseline and `2 runs/week` frequency; explicit labels `Baseline` and `Coach-imported · Oct 28`. Optional recent-work comparison only after valid current-filed source/date reconciliation. `Nov 7` long-run record is currently marked partial with `5.22 mi` filed on Nov 5, *before* its scheduled date; the first fold must **not** turn this inconsistent timing into a new personal best without review.
- Invitation: `See this week's two runs` and, later, a personal race recommendation as a *candidate* if it genuinely fits his expressed interests. His coach-prescribed progressions are not replaced by generic “training tips.”

## Geographic usefulness without creepiness

- **Primary city context:** user-provided base/current training city with source and effective date. Sohel has been described by Brice as NY-based, but a current city cannot be inferred from app IP or older notes; Hope/José current cities are not verified here. Ship the non-geographic personalized hero for unknown cities.
- **Miami home-base module:** safe location independent. Label “FROM MIAMI” with exact meeting place/time from active public occurrence; if a practice is not published or is cancelled, show one honest recap or omit the card rather than a stale event.
- **Future remote utility candidates:** locally relevant race candidates with official sources; climate/terrain contextual note only if sourced and opted into; local run partner/group information only if real and reliable. No weather or exact-address requirement for 44.8.

## Interaction and aesthetic direction

Use editorial confidence and restraint: very light warm paper background above or intentionally deep graphite with restrained blue, high contrast typography, large spatial intervals, soft film/photo texture only where it adds meaning. Preserve Brice's preference for **graphite over an additional competing blue**, **Halo's circular ghost transparency**, rounded calm controls, minimal repeated explanations, motion with function. Personal data gets quiet, dignified composition; Miami collective imagery sits below the athlete's own story.

Prototype at least **race / record / no-data** states and compare the card height, top-left reading path and the transition into the Miami feed at small and large Dynamic Type. The first fold must not become a carrousel of generic suggestions or bury the next session.

## Data, privacy and product contract

- Read race target + status from `race_entries` and `race_events`; source `athlete_marks`, current Week/plan versions, legitimate filings and athlete-visible observations. Keep provenance and uncertainty.
- Athlete-private results never copied into public home feed, logs, image assets or static JSON. Coach-authored observations need publication intent and proper audience. Private study or injury notes do not appear automatically.
- If target unknown, show record; if record unknown, show next current session; if plan absent, show self-guided Week placeholder / `Upload your plan` from 44.8 issue #264. Never show a blank fold or import another athlete's plan.
- Distinguish signed-in *athlete view*, Coach Mirror and public marketing. Race `target` is not registration. App support/entitlements must be checked for each athlete; no fixed names in production UI logic.
- Halo note may link to upcoming Week or the relevant race if the user has access, with an unobtrusive dot and no new push permission.

## 44.8 design / QA checklist

- [ ] Source-aware mapping for Hope/José race targets and Sohel record plus empty, stale and disputed facts.
- [ ] Three interactive prototypes with measured hierarchy and responsive Dynamic Type; athlete/coach review before native build.
- [ ] Audit no-plan/independent athlete state; FORM and Races remain useful, Week offers own-plan upload without exposing coached plans.
- [ ] Test true location ignorance, a target changing or event cancellation, partial filing, and filing after landing page load.
- [ ] Keep ghost Halo component independently testable; reduced transparency, VoiceOver, hit targets, dismissal and 7-day lifecycle.
- [ ] Separate 44.8 candidate scope from 44.7 stability and Apple release acceptance; no assumption of Friday App Store approval.

## Open aesthetic questions for Brice

1. Does the race get a cinematic full-width countdown treatment, or a compact editorial race card leaving more room for The Record?
2. Should the first line of The Record be a coach-signed observation, or a neutral sourced development statement by default (with a coach note when available)?
3. Should “From Miami” show the next live session first or the latest permissioned film/photo story first for remote athletes?

**Recommended first mock:** one distinct race-led Hope screen, one José race screen with stronger depth-of-work mark, and Sohel's record-led screen. Keep all three on the same design system and let actual athlete data choose the variant.
