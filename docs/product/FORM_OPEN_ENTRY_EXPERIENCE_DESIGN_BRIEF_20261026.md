# FORM · Open Entry / My FORM / Curated

**Experience design brief · October 26, 2026**  
Owner: Brice / FORM  
Companion: `docs/product/FORM_MASTER_PRODUCT_BRIEF_20261026.md`  
Status: design and implementation contract, not a claim of built or published screens.

**Brice's October 26 confirmation:** Keep the full design. The three doors, welcome, Apple/Google/email design intent, progressive preferences, free-plan and plan-import paths all remain in scope. A proposed reduction to Apple-only, Curated-only arrival with no three-door choice was explicitly declined. Phase and provider rollout can be staged for engineering truth; do not quietly delete the designed experience or claim an unconfigured provider is already live.

**Concierge flow implementation companion:** `docs/product/FORM_ARRIVAL_CONCIERGE_IMPLEMENTATION_CONTRACT_20261026.md` is the current screen/Coach-tab delivery contract informed by Brice's October 26 attached *FORM Arrival · The Concierge Flow* and actual Coach-tab screenshots. Where the earlier illustrative copy below differs (new hero vs shipped collage; magic link only vs verified email code; universal multi-step intake vs progressive selected-lane questions), the concierge contract and confirmed product decisions control. Do not treat its listed capabilities as already shipped.

## 1. The proposition

**One account. Several ways to belong.**

FORM is a beautiful, dependable home for purposeful training and the people and places that make it possible. Someone with a coach, someone writing their plan with AI, someone training toward a race, and someone who only wants Thursday track must all feel that the app is intentionally made for them.

The instrument is training. The hospitality is connection. Brice is the logistician and curator. Neither the visual hierarchy nor the account model should imply that the free Curated member is a failed coaching customer.

First launch audience: **100 distinct verified and claimed members who actually use one lane**, not downloads, fake athletes or 100 $500/month clients. The larger premium coaching relationship remains clearly distinct from self-service use.

## 2. Creative direction

**The private training folio meets a beautifully edited cultural calendar.** A precise watch face for today's session, an archival document for the athlete's direction, and a museum-style program for FORM's chosen gatherings. It must feel like one institution rather than three mini apps.

Visual vocabulary:

| Surface | Ground | Type emphasis | One focal detail |
| --- | --- | --- | --- |
| Arrival and account | Ink / dark charcoal with bone type | Brief display statement; plain-language explanation | Single fine registration line or restrained monogram |
| Choose your FORM | Bone or warm paper | One dominant question, three spacious editorial actions | Narrow accent rule beside current selection |
| Plan creation / input | Warm paper | Large meaningful inputs, sober number and unit alignment | Five instrument marks only when they convey a session |
| Import preview / Plan | Paper Spine, warm sheet with restrained tab | Weeks and actual changes as the jewel | One true spine, reduced drop shadow |
| The Week | Existing dark or chosen theme, **unchanged character** | Current race or clear purpose at top, prescription below | Existing date/day transition, no competing title stacks |
| Dossier / My FORM | Approved cream/ink reading treatment | Athlete, goal, upcoming events, then development | Small notice marker, never badge clutter |
| FORM Curated | Editorial dark-to-paper composition | Date, gathering, host and meeting facts | Actual camera photograph if approved; otherwise good typography |
| Invitation / Event | Warm paper detail sheet | Event title, exact date/time/place, participation state | One distinct RSVP action |

Preserve the existing SF logo and the approved Paper Spine language. Do not introduce the rejected red ribbon, ornamental corner flourishes, exaggerated page bend, thick layered cards, abundant blue, or conspicuous drop shadows. The page itself provides hierarchy. Restrained material depth comes from a slim edge, hairline and slight tonal separation. No forced white cards on cream.

Typography follows `docs/FORM_TYPOGRAPHY_STANDARD.md`: actual legibility takes precedence over decorative numbers. Use the current established fonts until a separately approved font migration. Semantic Dynamic Type, tabular figures for paces/dates, natural line wrapping and one divider per boundary. The Week is still the fast, dark athlete instrument. The Dossier is the slower, paper reading room. Navigating between them should preserve theme and return position.

Photography is authored and approved, not a guessed image of iRUN, ALO or an athlete. FORM-curated profiles are editorial references managed by Brice, not official partner-operated accounts. Where photography is absent, let date and copy lead.

## 3. Information architecture

| Member state | Default destination | Persistent access |
| --- | --- | --- |
| Existing coached athlete, connected | Their *actual* current Week | Dossier, Plan, Curated, My FORM invites |
| Self-guided athlete with active imported/generated plan | Their Week | Plan Exchange, Dossier, Curated |
| Member without a plan | FORM Curated, next confirmed gathering | Dossier, add/import plan; **no fake Week** |
| Returning member with a draft file but no activated plan | My FORM import draft and Curated | Finish import, create plan, dismiss draft |
| Guest, not signed in | Public approved Upcoming and Archive | Sign in only when taking an identity action |
| Coach/operator | Existing Coach console and own athlete context | Curated editing, private invitations, introductions |

Do not create another global tab bar merely to fit these modes. Reuse the Week-to-Dossier-to-Plan shell and the existing Collective/Curated door. Add contextual entry links. Avoid public athlete search, feed, leaderboard, follows and mandatory social graph.

## 4. Entry flow, screen by screen

### E00 · Existing team-collage arrival

**Visual:** Retain the already shipped José/team collage, brush reveal and low SF signature.  
**Actions after reveal:** `Join FORM` and `I'm already on the team`. Existing returning sessions go to their real resolved home. No second generic marketing hero or added slogans.

The member's own name/portrait poster later composes across identity, selection and delivery. A guest-safe future event preview may be offered without faking authentication or a published event. Never force returning invited athletes to repeat a stranger intake.

### E01 · Identity selection

One identity system, not separate Coach, Collective, Forge or Plan accounts.

- Primary: `Continue with Apple`.
- Secondary: `Continue with Google` once the configured provider and linking flow actually work.
- Secondary: `Continue with email` using a real six-digit one-time verification code with iOS paste/auto-fill and resend/expiry handling, once configured and tested. Preserve the existing coached magic-link claim path where needed; this is not permission to invent a working provider.
- Existing athlete: `Connect my FORM record` using verified coach-invited email.
- Copy: `Your training, events and invitations live under one FORM account.`

Provider-only members must survive with no `athlete_id`. A successful login is not proof of coached entitlement. Never auto-merge an Apple private relay, Google email or invited athlete by display name. On verification failure, preserve the original working session and offline filings. A deep link returns to the requested event or plan step after successful verification.

### E02 · Identity essentials

Ask for preferred first name (and optional last initial where required), optional photo, distance unit (mi/km) and broad **training city or area**. The person's poster composes with name and portrait behind the form, without showing other athletes' private images beyond already-approved team material. Do not ask for street address, constant device location, injury history or pace to join Curated. Show privacy defaults plainly: location private, training private, no athlete discoverability by default.

All choices are editable later. No invented demographic survey. Email comes from the verified account, not an extra unverifiable form field. A minimal progress marker is helpful; avoid a daunting wizard.

### E03 · Three doors

Title: `How will you use FORM?` Three substantial text-forward choices, each no more than two clear lines:

1. **Make a plan.** `Build a starting training week with FORM.`
2. **Bring a plan.** `Use a plan from your coach or AI assistant.`
3. **Join the practice.** `Find FORM's selected runs, sessions and gatherings.`

No visual pricing hierarchy, no “recommended” sale badge, no disabled Curated lane. Choice is a starting destination, not a permanent account category. A `Not sure? Explore events` escape is allowed.

Transition on selection: the selected line subtly advances, the other two recede, and the existing page reveals the next step. No full-screen whirl, bounce or confetti.

### E04A · Make a plan: honest intake

Reuse the production `FORMStrangerOnboardingFlow` and `formGenerateWeekPlans` engine, not a second plan writer. Organize the inputs into three calm beats:

1. `What are you training for?` Race and confirmed date **only where an authored distance-specific engine is ready**, or `Build consistency`.
2. `What are you running now?` Current weekly distance, recent long-run capacity, current run frequency, private limitations relevant to workload.
3. `When can you run?` Running days, protected days, preferred harder days and optional track access. The preview must explain conflicts without inventing availability.

The result is a **six-week suggested starter**, not a six-week hard paywall or an assertion of personalized Brice coaching. The current race-specific stranger engine is half-marathon-only until 5K/10K/marathon authorship exists. Do not display unavailable distance options as if they will produce valid bespoke plans. Show explicit units and plain-language pace/RPE rather than manufactured physiological precision.

### E05A · Starter reveal

A single clear week strip drawn from the *actual* generated sessions, then the week/day detail. Show `Six weeks to begin.` or the actual program context and a quiet `Made by FORM · Self-guided` provenance line.

Actions: `Use this plan`, `Edit days`, `Export to my assistant`. A plan is only activated after an explicit save; it is not a coached plan. If there is a conflicting protected day, make the conflict clear and return to selection rather than silently scheduling quality there.

### E04B · Bring a plan / Exchange

Two entry choices: `Choose a FORM file` and `Get the file format`. The second opens the website's `/plans/exchange/` download page or its in-app equivalent. Do not label an informational entrance `Import complete` when the signed-in publisher has not shipped.

Show a brief four-part path: Download format → Edit with ChatGPT/Claude/coach → Choose file → Review and activate. The screen describes supported `.json`, compatible schema version, distance unit and date span. External authorship remains `Your plan` or stated external source.

### E05B · File review / conflict handling

On import, show file summary, week count, start/end, units, number of quality/long sessions, protected-day conflicts, and **proposed changes**. Highlight invalid fields with line-level guidance. Never accept a file silently just because it parses. The canonical server validates, versions and authorizes. The preview is not publication.

Actions: `Activate this plan` after successful server preview; `Change file`; `Keep current plan`. Preserve prior plan, filed history and coach-authored Weeks. A coached athlete cannot replace their canonical prescription with an imported file without a separate explicitly authorized operation; present a personal draft rather than overwriting the coached block.

### E04C · Join the practice

Land directly on the next **confirmed dated** FORM Curated item. Editorial section order: `This week`, `Coming up`, then `The places we practice` (FORM, iRUN Monday, ALO Wellness). The host identity is attributed accurately: `Curated by FORM`, not `official iRUN account` or `ALO integrated schedule`.

Recurring iRUN Monday and FORM Thursday can show their pattern, but an actual RSVP or calendar file requires a verified occurrence with exact time and place. ALO events remain absent until Brice enters their dates. A Saturday workout in an athlete's plan is not evidence of a Saturday group meeting.

## 5. Primary in-app experiences

**Coach-tab concierge:** New-member Arrivals portraits, this-morning RSVP/first-timer roster, Plans to arrange, and Sunday week-ahead drafts must live on Brice's existing iPhone Coach tab, preserving the actual `The athletes.` inscription, athlete avatar strip and existing cards. See the implementation companion for operator states, permissions and release gates. Do not introduce a separate required desktop Labs desk.


### M01 · The Week, active plan

Keep the existing dark Week visual, swiping interaction, sticky race context, day strip and actual prescription. The top should have **one** interpreted title, prioritizing a dated upcoming race where appropriate. Do not stack race, program, philosophy/study, city and FORM Thursday as competing mastheads. Study/program identity belongs in Dossier or Plan.

Near the athlete's name, a tiny filled notice dot appears **only for unseen actionable My FORM information**: an invitation, material change or a coach message. It is not a perpetual unread badge for ordinary Curated listings. Tap the name/notice region to enter My FORM with the specific newest item in view; keep the adjacent `X` close target independent.

Calendar overlay for the same day: `Your training` and `With FORM` shown separately. An ALO 3-mile run can coexist with a 10-mile prescription without rewriting it, double-filing it or implying the athlete completed either. Only the user's action determines attendance/filing.

### M02 · The Week, no active plan

No fabricated rest days, no generic `Training unavailable` when the verified state is *no plan*. Instead show a composed, honest starting view:

`Your week is open.`  
`You can bring a plan, make one, or simply join us.`

Lead with the next confirmed Curated event and two quiet actions: `Add your plan` / `Explore the calendar`. Preserve a real Dossier for identity, accepted invitations and attended/RSVP history. Distinguish **no plan**, **loading/offline**, **permission refused** and **draft waiting for activation**.

### M03 · Dossier / My FORM

Use approved cream reading style. The page hierarchy should be:

1. Person and their own high-level goal if one exists (no invented race).
2. **Invitations** (unread first, only when present): short dated row with host and one action.
3. **This week with FORM**: only events this person has actually RSVP'd to, with date/time, state and direct event link.
4. **Upcoming events**: route to the full curated calendar, independent of a training plan.
5. Training plan / development if active, or a calm `Add a plan` route if not.
6. Account, privacy, unit, broad training area, optional Strava, interest in coaching.

This is not a social profile available to every other runner. The space between the portrait and close affordance is an intentional *notice/entry region*, never a mystery tap zone: give it a clear line such as `1 invitation` when available. No permanent empty invitation box when there is none.

### C01 · FORM Curated calendar

Three editorial identities initially: FORM, iRUN Monday, ALO Wellness. Sort by actual date, not host prestige; filters optional but restrained (`All`, `Runs`, `Strength`, `Yoga`, `Gatherings`). Expand later to Muscle Beach strength and socials without adding new app domains.

Show `Weekly` only for genuine current recurring series, `One date` for occasional events. Each occurrence has its own confirmed date, time, meeting point, source of truth, update timestamp and cancellation policy. Incomplete information means `Details coming` and disables RSVP/calendar, not a guess.

### C02 · Event detail

One full-bleed approved image where available, otherwise a typographic masthead. Exact start time, meet time if different, place, organizer/curator distinction, workout nature, distance if actually published, what to bring, and how to join.

`I'm in` confirms only after the server receives it. Display states: `Invitation`, `Going`, `Not going`, `Pending`, `Updated`, `Canceled`. Only consented/authorized names appear under `Who's going`. A partner event may require off-platform registration; distinguish `Interested` from `Registered with partner` if FORM cannot verify the latter.

Actions after confirmed RSVP: `Add to Apple Calendar`, `Add to Google Calendar`, `View in my Week`; cancellation removes stale future expectations without changing any separate training session. Use timezone-correct event start/end and location; don't add an undated recurring placeholder as a calendar event.

### C03 · My FORM invitation

Notification dot on Week → Dossier invitation or specific deep-linked invitation → event detail → RSVP → optional calendar add → back to **the same Week day** or Dossier scroll. Preserve context. A declined invite disappears from actionable unread but remains accessible in event history if needed. Changes to time/place show what changed, do not inflate unread count with every cosmetic edit.

### P01 · Plan / Paper Spine

Current Week should auto-scroll to the present week on first open. Keep the whole program legible in a scroll: week numbers in the spine, dates, key quality sessions and long runs; routine easies belong in the expanded week, not in the high-level `Key sessions` summary. Use normal contrast in both cream and dark appearances. Imported and starter plans have a quiet authorship line; coached plans remain visibly FORM-coached.

### T01 · Training Together, private future pilot

For the 100-member pilot, Brice's Console may show **private** suggestions based on optional self-declared broad area, overlapping day/window, run category and the actual invited training context. The athlete-facing UI is a bounded *introduction request*, not a roster browser:

`FORM thinks another athlete may be doing a compatible Saturday long run.`  
`Would you like an introduction?`

Only after both parties accept can an identity or contact route be shared. No public personal plans, GPS trails, home areas, unsolicited direct messages, auto-matched pace guarantees or invented friendship. Current backend drafts are not the release of this screen.

## 6. Motion grammar

Motion should make a document or instrument feel physically related across transitions. It should never become a show. Every flourish requires a reason.

| Transition | Motion | Suggested duration | Rule |
| --- | --- | --- | --- |
| Cold arrival | SF and masthead resolve, then one restrained line draws | 300–450 ms | Once per meaningful arrival, not every revisit |
| Three-door choice | Selected route advances ~6–10 pt; surrounding text fades slightly | 180–240 ms | No slide carousel of marketing panels |
| Input → plan reveal | Week baseline traces, real day nodes settle progressively | 350–600 ms total | Actual generated data only |
| Week day change | Content below stable header travels; numbers/date morph or crossfade in place | 200–320 ms | Race/athlete identity does **not** fly offscreen |
| Week → Dossier | A single page/pane handoff with reduced bend, slim edge and shallow shadow | 260–360 ms | Preserve page origin and return position |
| Dossier → invitation | Target invitation gently aligns under header | 200–280 ms | Direct deep link, not a forced full-list detour |
| Event RSVP | Button acknowledges committed server state with subtle fill/label transition | 160–240 ms | Never show `Going` before server confirmation |
| Add calendar | Native handoff opens without artificial success ceremony | Native timing | No false calendar-success state |
| Plan Exchange preview → activation | Diff rows settle into the paper folio; active tab changes after commit | 220–360 ms | Draft and active visually distinct |
| Returning to Week | Restore prior day and scroll, no second onboarding animation | 160–260 ms | Continuity is the luxury |

Transitions use restrained ease-out/spring with minimal overshoot; avoid rubbery bounce, parallax, spinning cards, fireworks, ribbon animations and excessive blur. Reduce the paper bend seen in prior experiments. A theme-tinted 1 pt edge may be explored, with the visible drop shadow reduced. Keep motion below the status-bar/close-target interaction layer.

**Reduced Motion:** no animated tracing, flips, pulsing notice dots or position movement. Use direct state changes or short opacity transitions. No functionality depends on an animation completing. High-contrast and large-text environments retain hit targets and labels.

## 7. Screen inventory and implementation ownership

| ID | Screen/overlay | First release disposition | Source of truth / primary dependency |
| --- | --- | --- | --- |
| E00 | Welcome/returning gate | Build | Native root identity routing |
| E01 | Apple/Google/email or existing claim | Build and provider QA | Supabase Auth and explicit claim flow |
| E02 | Basic identity/location/unit | Build | Account-scoped `form_member_journeys` |
| E03 | Three independent entry paths | Build | Account choice, not coached grant |
| E04A/E05A | Existing generator → six-week preview | Adapt | `formGenerateWeekPlans`; validated authoring |
| E04B/E05B | Exchange entrance, pick/preview/activate | Build in stages | Versioned private import service, schema-1 validator |
| E04C | Curated-first landing | Build | Confirmed event occurrence reader |
| M01/M02 | Plan and no-plan Week | Build and regression test | Canonical active block or verified no-plan state |
| M03 | Dossier / invitations / this week | Extend | Account, authorized events, actual active Week |
| C01/C02/C03 | Curated list, detail, invite | Finish staged feature | Phase 1 events + RSVP + notifications |
| P01 | Paper Spine plan | Preserve/refine | Current plan preview only, no duplicated workout data |
| T01 | Coach-mediated training introduction | Feature-gated pilot | Private Phase 2 consent and two-side acceptance |

Do not package everything as one monolithic App Store patch. Native route changes require an app release; event authoring, event date corrections and routine coaching changes belong in server-owned records. Keep authored design and released functionality status separate.

## 8. State, privacy and copy acceptance

The full design must include these actual variants, not only happy-path screenshots:

- Guest, returning coached athlete, fresh self-service account and Curated-only member.
- Apple relay address / Google address already tied to verified invited email; duplicate link refusal.
- Verification waiting, expired email link, offline retry, account changed with unsent filings.
- Zero plan by choice vs plan loading failure vs inactive draft vs coached unassigned state.
- Six-week sample with fewer available days, protected hard day and missing race-specific generator.
- Import valid, invalid, wrong unit, overlapping existing coached block, repeated submit and corrected revision.
- Dossier with no invitations and one unread invitation; event update and cancellation.
- Recurring Monday, one-off ALO with unknown date, partner registration, FORM Thursday, and no hosted Saturday.
- RSVP pending/offline, confirmed, declined, cancellation and partner-only registration.
- Location not supplied, preference opt-out, declined introduction, mutual acceptance, account deletion.

Microcopy stays simple. Examples: `Join the practice`, `Bring your plan`, `This is your training`, `With FORM this week`, `1 invitation`, `Details coming`, `Your week is open`, `Not added to your calendar yet`. Avoid `Connect with likeminded runners`, `Unlock your potential`, `Your community awaits`, sales banners and unexplained platform labels.

Use no tiny decorative type for instructions. Ensure normal 4.5:1 and large 3:1 contrast, touch targets at least 44 pt, VoiceOver labels for marks/RSVP, full keyboard navigation on web, text scale/200% web zoom, safe-area clearance and both supported iPhone size classes. Test light and dark Dossier/Week handoffs. Empty states must be intentional.

## 9. Visual review deliverables

**Make four full-context paired mockup studies before final styling decisions:**

1. **Arrival → choice:** E00, E01, E03 in the existing FORM shell, each at normal and large type.
2. **The two Week states:** active coached Week and Curated-only no-plan Week, then each opened to M03 Dossier. Show both dark and cream transition frames.
3. **Exchange:** file entry, invalid diff and activation confirmation, plus Paper Spine Plan at the current week.
4. **Curated:** one actual FORM Thursday, one iRUN Monday recurring occurrence, one upcoming ALO entry when dates exist, and a specific invitation/RSVP state. Do not fabricate an ALO date for visual polish.

For motion, deliver short 3–5-second device-sized sequences of: three-door selection, Week → Dossier → invite → return, weekday change with stable Week masthead, and import activation. Render a static first/last frame beside each sequence so the design works with Reduce Motion. Show the whole phone including real safe areas, not isolated cards floating on a blank artboard.

## 10. Shipping sequence and pilot test

**Release slice A, account door:** identity and verified account creation, existing-account claim, explicit three-way choice, true no-plan destination, read-only Curated. Test account switching and preservation of existing coached Week.

**Release slice B, use your own training:** six-week starter adapter, full file import draft and activation, active plan selection, Paper Spine, filing regression. The file starter on the website may ship earlier, with honest availability copy.

**Release slice C, practice and introductions:** confirmed Curated recurrence/invites, calendar, material-change notifications, coach-curated partner events; then private two-consent introductions after backend permission tests. No public people finder.

For the first 100 real accounts, capture only the activation and retention metrics in the master product brief. Test with a coached athlete (existing record), Ryan-style Curated-only runner, Adrian-style externally coached athlete, a first-time generator user and an importer. No test account counts toward the 100. No account or RSVP counts as actual attendance or filed training.

**Release gate:** production data RLS with two unrelated accounts, deep-link/auth restoration, correct older-build behavior, no-plan clarity, real signed-in Week+Filing regression, iPhone small/large screenshots, Dynamic Type, Reduce Motion, timezone/calendar readback, deployment check. No source-only screen may be reported as live.

## The criterion

In the first minute, the visitor should understand there is a FORM account for them whether they have a coach, a plan, or neither. In the first week, the app should help them carry out one real session or join one genuine gathering, without borrowing or rewriting their training truth. At 100 active people, the operator should be able to identify what they need without becoming a social-network moderator.
