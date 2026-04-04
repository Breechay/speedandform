# FORM Strategy Spec
**Version 1.2 · April 3, 2026**

**Authority: This document is the strategic source of truth for FORM — the product, the business, the trajectory. It is written for AI agents and collaborators working on any part of the system. Read this before touching anything.**

---

## Changelog — v1.2 (from v1.1)

- Speed Emergence cycle close protocol added (Section 3 + Section 10)
- "Indefinitely" language removed and corrected throughout — sessions cycle via mod 6 rotation but the cycle closes at 6 weeks
- Monetization framing revised: paid tier = future cycle content (content-gated), not "remote athlete" as persona (person-gated)
- /ghost 404 confirmed resolved — ghost/ directory and _redirects both in place
- durationWeeks projected end date bug elevated from "verify resolved" to specific fix required
- FORMRaceIntelligence.swift status clarified — file exists at FORM/Today/, awaiting Chris drop-in (add to Compile Sources + one-line swap Today.swift line 11248)
- Console version sync note added. Console is currently v55b.
- Solo vs. Miami question resolved at spec level
- Section 6 current state updated to April 3, 2026
- Infrastructure risk clarification: Xcode 26 status unconfirmed — not "deadline passed"
- Stripe not wired added to infrastructure risks
- Site changes applied Apr 3: "indefinitely" removed, first rep permission added, /next CTA fixed

---

## 1. What FORM Is

FORM is a structured distance running practice based in Miami. It began as PDFs sent to individual athletes, became a website, then a mobile app. The progression matters: each layer was built only when the previous one was real.

**The founder is Brice.** He is the sole developer and coach. He works with Claude and Cursor as primary tools, and an engineer named Chris on the iOS app.

**The group trains three days a week during Speed Emergence:**
- Tuesday · Threshold · Flamingo Park Track · 5:50 AM
- Thursday · Speed · Flamingo Park Track · 5:50 AM
- Saturday · Long Run · Hideout, Edgewater · 5:30 AM

**The current athlete group is ~75 people.** They range from serious runners (sub-6:00 threshold pace) to newer athletes (8:00+ easy pace). The group self-selects for consistency over speed.

---

## 2. The Three Products

### 2.1 The App — `FORM Practice` (iOS)
**App Store:** https://apps.apple.com/us/app/form-practice/id6761313085  
**Repo:** https://github.com/Breechay/FORM-iOS.git  
**Key file:** `FORMApp.swift` (44,408 lines as of v7.1 — monolith being split by Chris)

The app is the primary product. Everything else points to it.

**Current app state (April 2026)**
- Ghost Protocol: live, App Store approved
- Speed Emergence: live in app, 6 Thursday sessions rotating via mod 6. Cycle closes at 6 weeks — session rotation is open but the program container is not
- FORMRaceIntelligence.swift: built and in repo at `FORM/Today/`. Awaiting Chris drop-in (add to Compile Sources + one-line swap Today.swift line 11248) before April 9
- App version: v7.1
- Monolith split underway: 7 feature files extracted to `FORM/` subdirectories (reference-only, not in Compile Sources yet)

**Open code issues**
- Bug — `durationWeeks: 6` generates a projected end date for Speed Emergence that should not exist. When `isOpenEndedCycling` is true, suppress projected end date computation and display entirely. Code fix, not a verification pass. Chris.

**What the app must never do**
- Gamify (no streaks, no badges, no leaderboards)
- Coach (no "great job", no motivational language)
- Interpret ledger data back as outcome
- Add a second friction line per session

### 2.2 The Site — speedandform.com
**Repo:** https://github.com/Breechay/speedandform.git · Netlify auto-deploy from main  
**Backend:** Supabase (`zlhxvzgublgtuxplcjjl`)

The site serves two audiences: strangers (acquisition) and existing athletes (operational reference). Athletes should migrate to the app for operational detail — the site's job is acquisition and trust.

**Design system (locked — do not change)**
- `--cream: #f5f2ec`
- `--ink: #2a2620`
- `--ink-l: #6b6459`
- `--ink-f: #a09890`
- `--accent: #c4593a`
- `--line: #d8d2c8`
- Fonts: Cormorant Garamond (serif) + Jost (sans)
- Voice: calm authority, restraint over effort, finish neutral

### 2.3 The Coach Console — coach.html
Supabase-authenticated. Brice uses this to write session notes visible to athletes in the app. Currently at v55b.

**Console version sync rule:** when the console is updated for a strategic change, update the spec in the same pass. They should never diverge by more than one working session.

---

## 3. Speed Emergence Spec (Current Cycle)

**Authority document:** `form_program_spec_speed_emergence.html v3.0`. This overrides everything.

**The six Thursday sessions (locked — do not rename)**

| # | Name | Key structure |
|---|------|--------------|
| 01 | Nice and Easy | 3×200m · 2×800m · 1×400m |
| 02 | Pyramid Intervals | 300s up to 600m and back down |
| 03 | Gauntlet | 600s+400s+300s+200s+150s descending |
| 04 | Speed Demons | 4×300m · 6×200m · 8×100m |
| 05 | Death | 600s+400s+300s+200s+800+400 |
| 06 | Resurrection | Same as Death with compressed rest |

**Locked program close surfaces**
- Mirror line: "You learned to move faster without letting your shape break."
- Continuation bridge: "Continue what you built."
- Intelligence duringLine: "The rep ends when the form ends — not when the distance does."

**Speed Emergence Cycle Close Protocol**

*Critical distinction:* The cycle closes at 6 weeks. Session rotation is mod 6 (open) — athletes cycle through all six sessions without hitting a hard stop per session. But the program container closes after 6 weeks. This is not "indefinitely." The sessions are the tools; the cycle is the shape.

*Timeline*
- Start: April 13, 2026
- First Thursday track: April 17, 2026
- Projected close: ~May 24, 2026 (6 weeks from start)

*Trigger conditions*
- 6 weeks elapsed from April 13
- Group has completed at least one rotation of all six sessions

*What changes at close*
1. Update homepage state from "Speed Emergence active" → "between cycles"
2. Archive /plan-speed-emergence
3. Write cycle close console note for athletes
4. Fire continuation bridge: "Continue what you built." + next cycle offer → speedandform.com/next
5. Update console status to "Cycle closed — [date]"

*Between-cycles Thursday:* Open group run. No structured intervals. Carrier holds it. Brice runs. High acquisition moment — note any new faces. No mention of payment in-person. The product handles that.

---

## 4. Product History

- **PDF era** — Brice coaching individual athletes via PDF training plans
- **Site era** — speedandform.com built to replace PDFs. Site became the operational dashboard
- **App era** — FORM Practice app built and shipped. App Store approved April 2026. The app now takes over the operational dashboard role from the site. The site shifts to acquisition surface
- **Next era** — Monetization. The free base has been earned. The paying tier is the natural next layer

**Agent decision rule:** Decisions about where content lives (site vs. app) should always bias toward the app now. The site's job is to get people into the app or to Thursday at Flamingo Park.

---

## 5. Athlete Roster

Athletes with pages at /athletes/[name]: Simon, Hope, Bobby, Marcus, Kyle, Megan, Lisa, Ryan, Sam P., Sam V., Tinius, Mike, Jose, Brice (Breech).

Notable: Simon (Key Biscayne target ~1:23–1:24 HM) · Hope (paced by Jose, sub-1:30 HM, trains remotely from Gainesville) · Brice (target ~1:21–1:22 HM) · Kyle (from Miami, now in NY)

Session names origin: Bobby = Nice and Easy · Tinius = Pyramid Intervals · Sam = Gauntlet · Erik = Speed Demons · Breechay = Death · Brice = Resurrection

---

## 6. Current State Snapshot (April 3, 2026)

**Immediate context**
- Key Biscayne Half Marathon: April 12, 2026
- Taper active: April 3–11
- Speed Emergence begins: April 13 (first Thursday track: April 17)
- App: live on App Store, v7.1 shipped
- FORMRaceIntelligence.swift: built and in repo — needs Chris drop-in before April 9

**Site state**
- Homepage: time-aware (taper / race day / SE states), 3-session board ✓
- /thursday: taper state live, SE Apr 17 preview correct, first rep permission added ✓
- /speed: spec-compliant, 6 sessions, share buttons ✓
- /races/key-biscayne-2026: April 12 event page with pace strategy ✓
- /taper-key-biscayne: 14-day taper plan ✓
- /ghost: live — ghost/ directory with index + 6 week pages + cues. _redirects correct ✓
- /next: built Apr 3, content-complete, mailto notify CTA (Stripe not yet wired) ✓

**Known open issues**
- durationWeeks projected end date bug — suppress when isOpenEndedCycling is true (Chris)
- Xcode 26 / iOS 18.5 SDK upgrade status — unconfirmed (Chris)
- Session 05 Death structure: site vs. SE spec v3.0 — needs reconciliation
- Stripe: not wired. No webhook, no entitlement unlock, no production test

---

## 7. Monetization Path

**Tier 0 — Free Forever**
- Ghost Protocol (6-week entry program)
- Speed Emergence (current cycle — free for the founding cohort)
- The group sessions (Thursday track)
- The site

**Tier 1 — Next Cycle ($15–25/month or one-time cycle purchase)**

*Strategy — Resolved · v1.2:* The paid tier is content-gated, not person-gated. The first paid product is not "remote athlete access" — it is the next cycle after Speed Emergence. The /join-remote page framing is retired.

*Current status:* Stripe chosen over Apple IAP. Flow understood: external payment → webhook → entitlement unlock. No webhook implemented, no entitlement unlock, no production test. /next is built with mailto notify fallback CTA.

*Build order*
1. Define next cycle content — prerequisite for everything
2. Define price ($15–25/month or one-time)
3. Wire Stripe webhook + entitlement unlock + `paid_cycle` flag in Supabase
4. Replace /next mailto CTA with real Stripe checkout link
5. Manually confirm first cohort (5–10 athletes) before automating payment

*What not to do:* No paywall on Ghost Protocol · No charging for the website · No subscriptions before a coaching loop exists · No rushing before SE usage data is clear

**Distribution — first rep permission**
"You can leave after the first rep." — Added to /thursday Apr 3, 2026 ✓

**Tier 3 — Thursday at Scale (not yet)**
Thursday track is currently the acquisition engine. Charging for it would slow growth. Hold until the group consistently self-organizes.

---

## 8. App ↔ Site Coherence Rules

1. Session names are identical everywhere. No abbreviations, no variations.
2. The site never competes with the app. If the app does something, the site points to it.
3. Every site surface has an app nudge. Always quiet, never pushy.
4. Schedule data is maintained in both. They must match.
5. The Thursday share link points to /thursday, not /speed#session-0X.

---

## 8.5 Non-Founder Carrier

Right now FORM doctrine lives in three places: in Brice, in the app, and in the site. The Thursday north star — one session happening without the founder — cannot be reached by product work alone. It requires the protocol to transfer into the field through at least one other human who holds it without performance.

**What a carrier is:** One or two athletes who can hold the warm-up shape, start the session on time, preserve session language, and close with "Finished." Not assistant coaches. Not captains. Quiet carriers of sequence.

**How to establish it:** No announcement. No new title. No ceremony. Brice tells them directly. On Thursday, Brice begins showing up operationally silent — not absent, just not leading. The carrier takes the warm-up. Brice runs.

---

## 9. What Agents Should Know Before Starting Work

**Before touching the site**
- Clone https://github.com/Breechay/speedandform.git
- Read this document (FORM_STRATEGY_SPEC.md v1.2)
- Read form_program_spec_speed_emergence.html before touching /speed or session content
- Check the console (v55b) for open gaps and build queue
- The design system is locked. Do not introduce new colors, fonts, or layout patterns.
- Commit messages descriptive. Every significant change gets a commit. Push after committing.

**Before touching the app**
- Clone https://github.com/Breechay/FORM-iOS.git
- The primary compile unit is FORMApp.swift (44,408 lines). Feature files in FORM/ are reference-only.
- Read the Speed Emergence spec before touching any Speed Emergence content
- Never add coaching language to session drawers
- Session rotation is session-indexed (mod 6), not week-indexed. Do not revert this.
- When isOpenEndedCycling is true, do not compute or display a projected end date.

**Key locked strings (never modify without spec authority)**
- Acquisition sentence: "If you want to run like this again, it's in FORM."
- Intelligence duringLine: "The rep ends when the form ends — not when the distance does."
- Mirror line: "You learned to move faster without letting your shape break."
- Continuation bridge: "Continue what you built."
- Thursday notification: "Thursday is ready."
- Completion: "Finished."

**Infrastructure**
- Supabase: `zlhxvzgublgtuxplcjjl`
- Netlify: auto-deploy from Breechay/speedandform main
- App Store: id6761313085
- Repos: Breechay/speedandform (site) · Breechay/FORM-iOS (app)

---

## 10. Open Work Queue

**Pre-race (before April 12)**
- [ ] Verify Key Biscayne athletes have raceDate and goalTime in FORMCycleRecord (Brice / Chris)
- [ ] Drop FORMRaceIntelligence.swift into Compile Sources (Chris) — before April 9
- [ ] One-line change in Today.swift line 11248: `FORMTodayRaceModeView()` → `FORMTodayRaceModeViewV2()` (Chris) — before April 9

**Immediate (post-race, April 13+)**
- [ ] Fix durationWeeks projected end date bug — when isOpenEndedCycling is true, suppress projected end date. Chris.
- [ ] Confirm Xcode 26 / iOS 18.5 SDK upgrade status — must resolve before any new App Store submissions
- [ ] Reconcile Session 05 (Death) structure: site speed.html vs. form_program_spec_speed_emergence.html v3.0

**Monetization — Build order**
- [ ] Define next cycle content — prerequisite for everything in monetization
- [ ] Define paid cycle price ($15–25/month or one-time)
- [ ] Wire Stripe webhook + entitlement unlock
- [ ] Add `paid_cycle` flag to Supabase athlete records
- [ ] Replace /next mailto CTA with real Stripe checkout link
- [ ] Manually confirm first cohort (5–10 athletes) before automating payment

**Cycle Close Protocol (needed before ~May 24)**
- [ ] Define exactly what changes on the site at SE close
- [ ] Define what the console shows between cycles
- [ ] Draft continuation bridge copy pointing toward paid next cycle
- [ ] Define between-cycles Thursday app state (what Today shows when SE is closed)

**Site — completed Apr 3, 2026**
- ✓ "Cycling indefinitely" removed from thursday.html, plan-speed-emergence.html (body + meta)
- ✓ "You can leave after the first rep." added to thursday.html
- ✓ /next CTA replaced: dead #checkout → mailto notify fallback
- ✓ FORM_STRATEGY_SPEC.md updated to v1.2
- ✓ form_console_v55b.html added to repo
- ✓ coach.html Part B link updated to v55b

---

## 11. Doctrine (Non-Negotiable)

- **No gamification.** No streaks, no badges, no leaderboards, no "you're in the top 10%" messages.
- **Restraint over effort.** Session language communicates what the session is, not how hard you should try.
- **Finish neutral.** The mirror line is recognition, not praise. "Finished." is the close, not "Crushed it."
- **The session is the product.** The app is where it lives. The site points to the app.
- **The coach is not the product.**
- **Silence as authority.** Empty space, short sentences, minimal copy. When in doubt, remove a word.
- **The Thursday north star.** "One Thursday happens without the founder — and no one tells them about it. That's when FORM is real."

---

## 12. RunCards (Separate Product)

Brice also manages RunCards — a run club discovery app. Engineer: Chris Radler. Recent work includes V3 card redesign, city consolidation, MongoDB live backend. Separate product. Do not conflate with FORM.

---

## 13. PERDRIX (Brand Context)

Alberto Perdrix is a music curator who plays at Hideout (the FORM Saturday long run location). Brice manages the Alberto Perdrix brand. Brand strategy: document the music, don't promote the artist. Bilingual EN/ES. Unrelated to FORM training content but shares physical space and brand philosophy. Do not apply FORM session language conventions to PERDRIX content without Brice's direction.

---

## 14. How the Spec Gets Updated

This document changes only when one of three conditions is met:
1. A gate breach in the console triggers a finding that invalidates a strategic assumption. Console updated first; spec updated to reflect the revision.
2. A cycle close is the natural review point. Sections 6, 7, and 10 are most likely to need updates.
3. A spec-level decision is settled. Open strategic questions are listed explicitly. When Brice settles one, the spec is updated.

**Console–spec sync rule:** When the console is updated for a strategic change, update the spec in the same session. They should never diverge by more than one working session.

Agents may not update this spec based on field signals or inferred preference without Brice's direction.

---

## 15. Infrastructure Risks (Known)

**iOS SDK / Xcode 26 — Status Unconfirmed**  
Build 2 was submitted with the iOS 18.5 SDK. Any future App Store submission may be blocked until the Xcode 26 upgrade is confirmed complete. Must confirm with Chris before planning any new app feature work.

**Strava production approval — pending**  
Ticket 13267, submitted Mar 24. The `.production` flip is in code. While waiting: verify callback domain = `strava-oauth`, relay at form-strava-relay.vercel.app responds, URL scheme `form` in Xcode target. Gate: do not build additional Strava-dependent features until approved.

**Garmin — scaffolding only**  
FORMObservationSource includes `.garmin` and deduplication logic exists. The actual Garmin polling/integration is unbuilt. Gate: Strava live and validated first.

**Stripe — not wired**  
Chosen over Apple IAP. Flow understood: external payment → webhook → entitlement unlock. No webhook built, no entitlement unlock, no production test. /next has mailto notify fallback CTA. Gate: define next cycle content first.

---

*FORM Strategy Spec v1.2 · April 3, 2026*  
*Next review: Speed Emergence cycle close (~May 24, 2026)*
