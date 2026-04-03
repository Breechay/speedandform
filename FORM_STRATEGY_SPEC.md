# FORM Strategy Spec
**Version 1.0 · April 2026**
**Authority: This document is the strategic source of truth for FORM — the product, the business, the trajectory. It is written for AI agents and collaborators working on any part of the system. Read this before touching anything.**

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
**Key file:** `FORM/Today/Today.swift` (~39,000 lines, monolith being split by Chris)

The app is the primary product. Everything else points to it. It contains:
- **Ghost Protocol** — 6-week entry program. Free. The onboarding experience.
- **Speed Emergence** — Active cycle. Tue threshold + Thu speed (6 sessions cycling) + Sat long run. Free.
- **Intelligence layers** — `FORMThresholdIntelligence`, `FORMLongRunIntelligence`, `FORMSpeedIntelligence`. Each provides a `duringLine` shown during sessions.
- **Ledger** — Session log. Records rep times, paces, completion.
- **Ghost Protocol tabs** — TODAY / AHEAD / CUES / ARC
- **Coach console** — Brice can write notes visible to athletes

**Current app state (April 2026):**
- Ghost Protocol: live, App Store approved
- Speed Emergence: live in app, 6 Thursday sessions (Nice and Easy, Pyramid Intervals, Gauntlet, Speed Demons, Death, Resurrection) cycling indefinitely
- FORMRaceIntelligence.swift: built, needs drop-in by Chris
- Open code issues: `durationWeeks: 6` conflict with open-ended spec, session rotation must be session-indexed not week-indexed

**What the app must never do:**
- Gamify (no streaks, no badges, no leaderboards)
- Coach (no "great job", no "stay strong", no motivational language)
- Interpret ledger data back as outcome
- Add a second friction line per session

### 2.2 The Site — `speedandform.com`
**Repo:** https://github.com/Breechay/speedandform.git
**Deploy:** Netlify, auto-deploy from main branch
**Backend:** Supabase (`zlhxvzgublgtuxplcjjl`)

The site serves two audiences simultaneously:
1. **Strangers** — people who find FORM via a shared session link, Google, or social. They need to understand what FORM is and have a clear path to participate.
2. **Existing athletes** — people who train with the group. They need quick operational info: what's this week, where do we meet.

**The right resolution:** Athletes use the app. The site is for strangers and acquisition. The site should stop trying to be the athlete dashboard — that's the app's job. Every athlete operational touchpoint on the site should have a quiet "→ in the app" nudge.

**Key pages:**
- `/` — homepage. Time-aware: taper (now–Apr 11), race day (Apr 12), Speed Emergence (Apr 13+)
- `/thursday` — the acquisition door. This Thursday's session, Flamingo Park, 5:50 AM, "Show up in running shoes." Share this, not individual session links.
- `/speed` — the 6 Thursday sessions as reference. Spec-locked language. No friction lines. Share buttons on each session.
- `/practice` — athlete week dashboard. Dynamic schedule. App nudge.
- `/plan-speed-emergence` — active cycle page: all 3 sessions, locations, times, session rotation
- `/race-strategy` — permanent race framework (doctrine)
- `/races/key-biscayne-2026` — April 12 event page (Brice, Simon, Hope splits, three-day countdown)
- `/app` — app page with App Store link and protocol ladder
- `/start` — how to join. Thursday listed first as easiest entry.
- `/ghost` — Ghost Protocol entry program

**Design system (locked, do not change):**
```
--cream: #f5f2ec
--ink: #2a2620
--ink-l: #6b6459
--ink-f: #a09890
--accent: #c4593a
--line: #d8d2c8
--line-l: #e8e3dc
Fonts: Cormorant Garamond (serif/display) + Jost (sans/body)
Voice: calm authority, restraint over effort, finish neutral
Never: gamification, streaks, engagement mechanics, celebration language
```

### 2.3 The Coach Console — `coach.html`
Supabase-authenticated. Brice uses this to write session notes visible to athletes in the app. PIN: 1234 (not sensitive, known to Brice). Lives at `/coach.html` — not publicly linked but accessible.

---

## 3. Speed Emergence Spec (Current Cycle)

**Authority document:** `form_program_spec_speed_emergence.html` v3.0. This overrides everything.

**The six Thursday sessions (locked, do not rename):**
| # | Name | Key structure |
|---|------|--------------|
| 01 | Nice and Easy | 3×200m · 2×800m · 1×400m |
| 02 | Pyramid Intervals | 300s up to 600m and back down |
| 03 | Gauntlet | 600s+400s+300s+200s+150s descending |
| 04 | Speed Demons | 4×300m · 6×200m · 8×100m |
| 05 | Death | 600s+400s+300s+200s+800+400 |
| 06 | Resurrection | Same as Death with compressed rest |

**Friction lines (app-only, never on site):**
- 01: "The first rep won't feel like enough."
- 02: "The middle will feel longer than it is."
- 03: "The last reps arrive before you're ready."
- 04: "It will feel repetitive."
- 05: "You'll want it to end earlier than it does."
- 06: "The rest won't feel like enough." (provisional)

**Intelligence layer duringLine (always-on, separate from friction lines):**
"The rep ends when the form ends — not when the distance does."

**Locked program close surfaces:**
- Mirror line: "You learned to move faster without letting your shape break."
- Continuation bridge: "Continue what you built."
- Archive closing line: behavior-derived (race + threshold ≥4 → "Built cleanly. Closed cleanly." etc.)

**Surface rules:**
- Site: structure only. No friction lines.
- App drawer: structure + one friction line.
- Plan tab Thursday rows: session name only. No subtitle.
- Today card Thursday: `greetingContext` = "Light contact. Do not chase sharpness."
- Notification: "Thursday is ready." (fires Thu 5:15 AM)
- Completion line: "Finished."

**Acquisition sentence (locked, spec-authority):**
"If you want to run like this again, it's in FORM."
This is used on the site at the bottom of `/speed` and `/thursday`. Do not modify.

---

## 4. Product History

The progression tells the strategy:

**PDF era** — Brice coaching individual athletes via PDF training plans. Personal, manual, not scalable.

**Site era** — `speedandform.com` built to replace PDFs. Athletes check the site for the weekly schedule. The site became the operational dashboard.

**App era** — FORM Practice app built and shipped to App Store. App Store approved April 2026. The app should now take over the operational dashboard role from the site. The site should shift from "athlete tool" to "acquisition surface."

**Next era** — Monetization. The free base has been earned over years. The paying tier is the natural next layer.

This matters for agents: decisions about where content lives (site vs. app) should always bias toward the app now. The site's job going forward is to get people into the app or to Thursday at Flamingo Park.

---

## 5. Athlete Roster (Current Group)

Athletes with pages at `/athletes/[name]`:
Simon, Hope (coached by Jose), Bobby, Marcus, Kyle, Megan, Lisa, Ryan, Sam P., Sam V., Tinius, Mike, Jose, Brice (Breech).

Athlete pages track: threshold session history, race history, coach notes. Supabase-backed. Coach-editable. Athletes can view their own.

**Notable facts for agent context:**
- Simon: Key Biscayne target ~1:23–1:24 half marathon
- Hope: paced by Jose, target sub-1:30 half marathon
- Brice: target ~1:21–1:22 half marathon
- Session names in Speed Emergence spec are named after origin athletes (Bobby = Nice and Easy, Tinius = Pyramid Intervals, Sam = Gauntlet, Erik = Speed Demons, Breechay = Death, Brice = Resurrection)

---

## 6. Current State Snapshot (April 3, 2026)

**Immediate context:**
- Key Biscayne Half Marathon: April 12, 2026
- Taper active: April 3–11
- Speed Emergence begins: April 13 (first Thursday track: April 17)
- App: live on App Store, Speed Emergence active

**Site state:**
- Homepage: time-aware (taper / race day / SE states), 3-session board
- `/thursday`: live, acquisition door, session auto-populates
- `/speed`: spec-compliant, 6 sessions, share buttons, acquisition block
- `/race-strategy`: permanent framework
- `/races/key-biscayne-2026`: April 12 event page with Brice/Simon/Hope splits
- `/plan-speed-emergence`: active cycle page
- `/plan`: Spring Cycle archive, links to SE

**Recent commits (newest first):**
- `789a864` — acquisition model: /thursday + homepage rebuilt + start updated
- `0874017` — homepage time-aware phase switching + 3-session SE layout
- `c713895` — speed emergence cycle transition + App Store URL live
- `135514f` — speed emergence acquisition layer + site coherence pass
- `499c7cf` — split race-strategy into framework + event pages
- `80e6472` — add /race-strategy permanent resource

---

## 7. Monetization Path

**The principle:** Brice has built trust with a large free audience over years. The transition to paid should be earned, not extracted. The first paying customers are already in the group.

### Tier 0 — Free Forever
- Ghost Protocol (6-week entry program in app)
- The group sessions (Thursday track at Flamingo Park)
- The site

**Why:** Ghost Protocol is the proof of concept. If someone can finish 6 weeks, they trust the system. The group sessions are the community — charging for them now would shrink the network before it's strong enough. The site is acquisition.

### Tier 1 — Remote Athlete ($15–25/month)
**First paid product. Build this next.**

The remote athlete already exists. Hope trains remotely from Gainesville. She uses the app, gets the session, has no access to the group. She represents the first paying customer archetype: no local group, no coach, wants structure that works.

What a remote tier includes:
- Full app access with cycle updates
- Occasional coach notes written to their athlete page
- Race strategy access when they have a race
- No live coaching (async only, via coach console notes)

The infrastructure exists: athlete pages, coach console, the app. The only missing piece is a payment gate and a clear onboarding flow for remote athletes.

**How to build it:**
1. Add a `remote_athlete` flag to Supabase athlete records
2. Build a `/join-remote` page: what you get, price, Apple Pay / Stripe
3. Gate certain app features behind this flag (race intelligence, coach notes)
4. Brice manually onboards first cohort (5–10 people) before automating

### Tier 2 — Premium Cycles (next after Tier 1)
Speed Emergence is currently free. The next cycle after Speed Emergence — whatever follows — is the first paid cycle.

The pattern: Ghost Protocol proves the system → Speed Emergence deepens it → next cycle costs money. Athletes who've completed two free cycles are the most qualified buyers of a third.

**What makes a paid cycle feel worth it:**
- Personalized pace targets (derived from ledger history)
- Race Intelligence layer wired to their specific goal race
- Closer coaching loop (more frequent notes, structured check-ins)
- Priority access to new sessions before they go to the group

### Tier 3 — Thursday at Scale (not yet)
Thursday track is currently the acquisition engine. Charging for it would slow growth. Hold until the group consistently self-organizes — the spec's north star: "One Thursday happens without the founder, and no one tells them about it."

When Thursday is self-sustaining (guest coaches, group regulars who know the sessions, no Brice required), a small session fee ($5–10) creates commitment signal and covers track costs. This is 12–24 months out.

### What Not to Do
- Don't put a paywall on Ghost Protocol — it's the trust-builder
- Don't charge for the website
- Don't add subscriptions before there's a human coaching loop behind them
- Don't rush to monetize before the app usage data from Speed Emergence is clear
- Don't add features for paid tiers that don't already exist in some form

---

## 8. App ↔ Site Coherence Rules

These rules exist to ensure the app and site feel like one product, not two separate things.

**Rule 1: Session names are identical everywhere.**
"Nice and Easy" on the site, "Nice and Easy" in the app, "Nice and Easy" in athlete pages. No abbreviations, no variations. The name is the product.

**Rule 2: The site never competes with the app.**
If the app does something, the site should point to it, not replicate it. The site's session schedule is a preview; the full coaching detail is in the app.

**Rule 3: Every site surface has an app nudge.**
`/practice` has "Full detail in app →". `/speed` has "If you want to run like this again, it's in FORM." `/thursday` has the App Store download link. The nudge is always quiet, never pushy.

**Rule 4: Schedule data is maintained in both.**
When the cycle changes, both the site SCHEDULE arrays and the app's `speedEmergenceDayPlans` must be updated. They must match. The site's SCHEDULE in `practice.html` and `index.html` is the human-readable source of truth for session dates. The app is the authoritative coaching source.

**Rule 5: The Thursday share link points to `/thursday`, not `/speed#session-0X`.**
`/thursday` is the door. `/speed#session-05` is the reference. Sharing the door gets people into the community. Sharing the reference gets people a workout.

---

## 9. What Agents Should Know Before Starting Work

### Before touching the site:
1. Clone `https://github.com/Breechay/speedandform.git`
2. Read `FORM_STRATEGY_SPEC.md` (this document)
3. Read `form_program_spec_speed_emergence.html` before touching anything in `/speed` or session content
4. Check the FORM console (latest version in memory or conversation) for open gaps and build queue
5. The design system is locked. Do not introduce new colors, fonts, or layout patterns.
6. Commit messages should be descriptive. Every significant change gets a commit. Push after committing.

### Before touching the app:
1. Clone `https://github.com/Breechay/FORM-iOS.git`
2. The primary file is `FORM/Today/Today.swift` (~39K lines). It is a monolith being refactored by Chris.
3. Read the Speed Emergence spec before touching any Speed Emergence content.
4. Never add coaching language to session drawers.
5. The session rotation is session-indexed (mod 6), not week-indexed. Do not revert this.
6. `duringLine` in intelligence layers is a separate surface from session friction lines. Do not merge them.

### Key locked strings (never modify without spec authority):
- Acquisition sentence: "If you want to run like this again, it's in FORM."
- duringLine: "The rep ends when the form ends — not when the distance does."
- Mirror line: "You learned to move faster without letting your shape break."
- Continuation bridge: "Continue what you built."
- Thursday notification: "Thursday is ready."
- Completion line: "Finished."
- Site closing note on `/speed`: "These sessions belong to a different phase of the practice. Speed is a tool the system returns to when the time is right."

### Infrastructure:
- **Supabase project:** `zlhxvzgublgtuxplcjjl` (speedandform.com backend)
- **Netlify:** auto-deploy from `Breechay/speedandform` main branch
- **App Store:** `id6761313085`
- **GitHub repos:** `Breechay/speedandform` (site), `Breechay/FORM-iOS` (app)

---

## 10. Open Work Queue

### Immediate (post-race, April 13+)
- [ ] Verify app session rotation is session-indexed not week-indexed (for Chris)
- [ ] Verify `durationWeeks: 6` conflict is resolved in app (for Chris)
- [ ] Drop `FORMRaceIntelligence.swift` into `FORM/Today/` (for Chris)
- [ ] One-line change in Today.swift: `FORMTodayRaceModeView()` → `FORMTodayRaceModeViewV2()`
- [ ] Wire Thursday track session results into athlete pages after first SE session (Apr 17)
- [ ] Add Key Biscayne race results to athlete pages after April 12

### Site — Next cycle
- [ ] Archive Spring Cycle properly in `cycles.html`
- [ ] Update `the-field.html` — add Thursday to session locations
- [ ] Update structured data (schema.org) on `index.html` for three sessions
- [ ] Update meta description on `index.html` for Speed Emergence
- [ ] `start.html` closing line update: "Start Thursday. Everything else follows." ✓ (done)

### App — Open spec gaps
- [ ] `FORMSpeedIntelligence` — define Speed Emergence-specific secondary close lines (3–5 words, observational, tag-derived)
- [ ] Decide: lock Resurrection friction line or keep provisional after first cycle
- [ ] Decide: `durationWeeks` — open-ended or extended container
- [ ] Decide: readiness gate for Thursday (after 4–6 sessions)
- [ ] Speed ledger signature layer — "Even finish" / "Closed fast" etc. (deferred)

### Monetization — Build order
- [ ] Define remote athlete flow (what they get, price, onboarding)
- [ ] Build `/join-remote` page
- [ ] Add `remote_athlete` flag to Supabase schema
- [ ] Gate race intelligence + coach notes behind remote flag
- [ ] Manually onboard first 5–10 remote athletes (no automation yet)
- [ ] Decide second paid cycle content before Speed Emergence closes

### Social / Distribution (not yet started)
- [ ] Thursday session shares: use `/thursday` not `/speed#session-0X`
- [ ] Instagram bio link → `/thursday`
- [ ] Consider a "Thursday regulars" concept — share card for athletes who've attended 4+ consecutive Thursdays
- [ ] PERDRIX brand documentation (separate but related — Alberto Perdrix music curator at Hideout)

---

## 11. Doctrine (Non-Negotiable)

These principles govern every decision across every surface. Agents should check work against these before shipping anything.

**No gamification.** No streaks, no badges, no completion percentages shown as achievement, no leaderboards, no "you're in the top 10%" messages. These are incompatible with the voice.

**Restraint over effort.** The work is about doing enough, not doing everything. Session language communicates what the session is, not how hard you should try.

**Finish neutral.** Nothing in the product should celebrate completion excessively. The mirror line is recognition, not praise. "Finished." is the close, not "Crushed it."

**The session is the product.** The app is where it lives. The site points to the app. The coach is not the product. The structure is the product.

**Silence as authority.** Empty space, short sentences, minimal copy. Restraint in language signals that the work doesn't need explaining. When in doubt, remove a word.

**The Thursday north star.** "One Thursday happens without the founder — and no one tells them about it. That's when FORM is real." Every decision about scale, monetization, and product should be tested against this.

---

## 12. RunCards (Separate Product)

Brice also manages **RunCards** — a run club discovery app. Engineer: Chris Radler. Recent work includes V3 card redesign, city consolidation, MongoDB live backend. This is a separate product with its own codebase and doesn't intersect with FORM except that Chris works on both. Do not conflate the two products.

---

## 13. PERDRIX (Brand Context)

Alberto Perdrix is a music curator who plays at Hideout (the FORM Saturday long run location). Brice manages the Alberto Perdrix brand. The brand strategy: document the music, don't promote the artist. Bilingual EN/ES. Print-ready assets built. This is unrelated to FORM's training content but shares physical space (Hideout) and brand philosophy (restraint, documentation over promotion).

---

*FORM Strategy Spec v1.0 · Written April 3, 2026 · Next review: post-Speed Emergence cycle 1 close*
