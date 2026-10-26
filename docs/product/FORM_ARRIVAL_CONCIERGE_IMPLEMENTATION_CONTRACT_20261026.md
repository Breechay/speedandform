# FORM Arrival and Concierge

**Implementation and design contract · October 26, 2026**  
**Owner:** Brice / Speed & Form  
**Sources:** Brice's product direction, the attached *FORM Arrival · The Concierge Flow* document from Claude, the shipped Coach-tab screenshots, `FORM_MASTER_PRODUCT_BRIEF_20261026.md`, `FORM_OPEN_ENTRY_EXPERIENCE_DESIGN_BRIEF_20261026.md`, and the cross-agent release audit.  
**Status:** accepted direction for design and engineering. No screen, authentication provider, migration, manual plan service, message, or release is implied live by this contract.

## The decision

FORM is one membership with **three equally legitimate doors**:

1. **Make a plan** — a real six-week FORM-generated self-guided starting block.
2. **Bring a plan** — activate a valid FORM file, or privately submit another plan format for assistance.
3. **Join the practice** — access genuinely dated FORM, iRUN Monday, ALO Wellness, and other Brice-curated gatherings without adopting a training program.

Keep the existing José/team collage arrival, SF mark, Week, cream Dossier side door, Paper Spine and Coach tab. Do not replace them with an unrelated onboarding brand, a generic SaaS wizard, a permanent activity feed, or a narrower Apple-only calendar product. The member's own poster is the continuous visual object from account setup through the selected door and delivery. **The operator workflow is inside Brice's existing Coach tab on the phone; desktop is optional, not required.**

The standard is that every person is recognized, oriented and given a useful result. Paid FORM coaching adds individually authored training, calibration, review and real coach accountability. Free use must never masquerade as $500-per-month coached service. Attention is the design ethic, not permission to make unstaffed promises.

## Canonical journey and screens

| ID | Screen | Concrete behavior | Source or new work |
| --- | --- | --- | --- |
| A00 | Existing collage | On first arrival, reveal `Join FORM` and `I'm already on the team`. Returning authenticated member goes to their resolved home. | Reuse shipped opening; add two action affordances, not a new hero slogan. |
| A01 | Account choice | Apple, Google and verified email code, plus existing coached record claim. A provider is shown only when fully configured and tested. | Extend canonical Supabase Auth and linking; preserve invite/magic-link recovery. |
| A02 | Who you are | Preferred name, optional portrait, broad training city/area and mi/km. Poster composes with their typed name and optional portrait as they answer. | Private `form_member_journeys`, avatar upload; reuse approved athlete poster typography. |
| A03 | Three doors | Equal editorial choices with one-line explanations, chosen item advances ~8 pt, others recede. All three remain available in Dossier later. | New first-use route, persistent entry choice. |
| A04 | Direction | Race/distance/date if supported; consistency, comeback or company. | Existing generator goal state + private journey. |
| A05 | Running now | Frequency, weekly distance in selected units, recent long-run capacity, optional recent race result. | Existing generator adapter, no invented physiology. |
| A06 | Body | Voluntary limitations/injury history, private explanation and consent. **Not required for Join the practice or merely importing a plan.** | Separate access-controlled health-adjacent intake; never public or attendee-visible. |
| A07 | Strength | Current habit, optionally included for starter training. | Starter engine only; no automatic hard strength load without valid progression. |
| A08 | Your week | Available running days, protected days, possible harder days, time preference, track access where relevant. Join the practice sees only event availability/interests. | Reuse intake; protected-day conflict checks. |
| A09 | Last line | Optional `Anything else Brice should know?` (280 characters); clear indication it is private to the member and authorized FORM coach. | Private Coach arrival card. |
| D01 | Make plan delivery | Name-led folio: real six-week sessions animate into Week. `Start this week`, `Change my days`, `Take it to my AI`. Label `Made by FORM · Self-guided`. | Connect unreachable `FORMStrangerOnboardingFlow`; server persistence and active-plan routing. |
| D02 | Bring plan delivery | Two choices: validated `.formplan.json` preview → **actual** activate, or submit PDF/image/export/coach document to a private conversion queue. | New trusted publisher and separate manual conversion workflow. |
| D03 | Join delivery | Next **confirmed** event with accurate host, date/time/place, RSVP, calendar choice, `See all mornings`. Home is Run with FORM and member Dossier. | Fixed Curated backend + native app on current release base. |
| M00 | No-plan Week | `Your week is open.` plus invitation/calendar and `Make a plan`/`Bring a plan`, without fabricated rest days. Loading, permission errors and pending imports are separate states. | New root route/state. |

### Intake routing without making a social attendee fill a medical questionnaire

The attached five-page intake is a strong **design system**, not five compulsory gates for everybody. The app reveals the data only when it benefits the chosen use:

- **Make a plan:** A04, A05, optional A06, A07, A08 and optional A09. Show why private physical limitations matter to plan creation. If no limitations are shared, don't infer absence of injury.
- **Bring a plan:** A04 is optional context; choose file/manual submission immediately. Ask units and author/provenance; optional A06 only when requesting FORM workload advice, not for storage.
- **Join the practice:** A04 may offer `Running with people`, then **event availability and interests only**. First useful gathering must be accessible without disclosing mileage, injuries or race data.

City/area is self-declared, editable and private. A device's region may suggest Miami, but cannot silently store a precise location or publish an athlete's training area. Training Together requires **later, separate opt-in**, including bilateral acceptance before an identity introduction.

## Delivery must be real

### Make a plan

The shipped native plan generator exists but is not routed into open onboarding. Activate it through A03, adapt its output to a six-week starter, persist a versioned personal plan and load real Week sessions. Protect days and recently resumed runners. The known race-specific generator is half-marathon-oriented: for other race distances, plainly label an appropriate foundational program rather than pretending it is a validated race-specific marathon/5K/10K plan. Do not force two strength sessions on an already overloaded athlete. Users can later export, edit with Claude/ChatGPT, and reactivate a new validated personal revision without touching completed filings or a coached prescription.

### Bring a plan

The existing file picker and preview **do not currently activate**. Acceptance requires signed-in server validation, sanitized import, ownership/RLS, versioned preview and explicit commit/rollback to a personal active Week. Keep external-coach authorship honest. A `Send it to us` upload is a separate service: private file storage; upload/virus/type/size controls; conversion queue; uncertain fields flagged; coach review/edit; explicit athlete confirmation of the resulting plan where appropriate; then publication and notification. Upload is not proof that an editable plan exists. Show an honest receipt and current queue ETA; **never promise `by tomorrow` without an operational service level Brice can honor**. At 100 members, cap submissions or distinguish included concierge service from optional personal assistance if needed; don't surprise users after upload.

### Join the practice

The event is separate from a training prescription. A verified occurrence supplies exact meet point, timezone and start/end. `I'm in` is confirmed only by the server. If ALO requires its own booking, `Interested` and `Registered with ALO` are distinct states. Add to Apple/Google Calendar only after a real dated occurrence; cancel or move notifications must reconcile existing RSVPs. No invented iRUN meeting location, ALO dates, automatic Saturday meetings, or implication FORM operates partner accounts.

## The phone-based Coach desk

Respect the **actual current Coach tab**: SF wordmark, `The athletes.` editorial masthead and inscription, round athlete portraits, then large serif athlete cards and a fixed bottom tab bar. New operational regions should belong to this composition, not impose a second dashboard or permanently shove the active athlete list away. Each section appears only when actionable, with one-tap access to a full queue.

1. **This morning:** confirmed upcoming/active session and portraits of attendees; `First time` indicated quietly. After the session, authorized photo review and tagging. Only show on session days.
2. **Arrivals:** compact row of new portraits with quiet unread dots. Tap to view one full-screen arrival card, swipe through new arrivals, send/record welcome, defer, or resolve an account claim. Arrivals is not a duplicate coached-athlete roster.
3. **Plans to arrange:** queue only for actual uploaded documents, with received timestamp, source preview, conversion state, uncertainty, ETA, review and publish; never force a desktop.
4. **The week ahead:** Sunday workbench for optional composed notes, real session/event content, review/edit/send and batch release. Indicate whether a note was actually delivered. No invented coach voice or unattended automatic personal promise.
5. **The athletes:** existing coached cards intact, with a secondary `MEMBERS` section for self-guided/practice-only accounts, not mixed as fictitious coached training blocks.

The arrival card is a compact, private fact sheet: poster, door, direction, actual running inputs if supplied, verbatim voluntarily shared body/note, strength, availability, broad area, exact welcome-draft provenance and actions. Link a missed coached record by **verified identity/entitlement procedure**, not because a photo or name looks similar. Apple private relay must not cause an arbitrary match.

### A credible concierge cadence at 100

- **Day 0:** notify Brice of arrival; draft a short, factually grounded welcome using only that member's consented answers. The message stays **draft** until Brice sends. Track queue age and replies.
- **First filed run:** Brice can see a first-filing receipt and reply; this is not promised as clinical or automatic training evaluation.
- **First gathering:** the Coach tab shows new faces/names only where RSVP and visibility consent allow; accurate meet point, route/warmup and any partner check-in details.
- **Post-event photos:** use already-consented/tagged imagery, with opt-out/unpublish controls; no automatic face recognition or public photo use inferred from RSVP.
- **Sunday:** generate an informative personal week/events summary that the member can use even when Brice hasn't reviewed it. Reserve *signed Brice-written notes* for actual review and send; support coach batch editing instead of asserting 100 bespoke Sunday letters occur automatically.
- **Week 2 and week 5:** small check-in and plan-continuation suggestion from real filings/goal, without locked Week, fake paywall, unrequested medical advice, or a false promise of coaching access.

No messages during configured quiet hours. Pushes are deduplicated, deep-link to the actual Coach card, and reflect delivery/seen state. Free accounts remain useful without receiving individualized replies immediately; premium coaching retains an explicitly higher level of human availability, once actually offered.

## Data and authorization seams

| Domain | Canonical boundary | Required protection |
| --- | --- | --- |
| Identity/claim | One verified Supabase account; coached entitlement separately claimed | No duplicate coached athlete, no name-only claim, test Apple private relay and provider linking. |
| Journey/poster | Owner-scoped `form_member_journeys`, private upload | Consent, owner read/write, coach review only with explicit role, deletion. |
| Sensitive body notes | Separate minimal private intake fields/table with explicit consent | Narrow RLS and coach access, purpose/retention/deletion, no event RSVP/public profile leakage. |
| Starter/import | Versioned personal plan and active selector distinct from coach's blocks | Server schema validation, ownership, idempotency, preview/change diff, file safety, audit trail. |
| Submitted plan | Private object and conversion task | Encrypted storage, signed URLs, limited type/size, virus scan, access expiry and coach queue. |
| Curated | Host, occurrence, invite, RSVP, attendee visibility | Real dated events, coach publish rights, no partner impersonation, cancellation and privacy states. |
| Coach desk | Authorized member arrival, messaging, plan approval and media | Paged queue, recipient resolution, audit who published/sent, no bulk message mis-target. |
| 100-member measurement | Verified, claimed, activated, returning members | Aggregate metrics; exclude QA; no ad identity or private-location tracking. |

### Exact rollout integration

**Target FORM 44.3 on top of Codex's verified 44.2**, not on obsolete 44.1 source. Complete, test and release all three doors as working exits; a door cannot lead to a preview-only or `Nothing here yet` dead end. The native Curated PR #117 was made before newer Week/Dossier changes and **must be rebuilt/cherry-picked surgically on the 44.2 tree** to preserve Paper Spine Exchange and poster Dossier. Never merge the stale whole-file replacements. Corrected backend PR #376 is still source-only; run genuine signed-in staging RPC tests before production. PR #377 Phase 2 private matching remains parked; its future branch must pick up #376's fixes.

Native engineering order within the 44.3 release batch:

1. Route existing collage + multi-provider account/claim resolver to A02 and A03 for **non-coached** accounts; protect existing coached Week and filing.
2. Persist progressive answers, restore interrupted intake and compose poster on-device, with Reduce Motion and accessible typography.
3. Rebuild Curated to present a real Join experience and invited event overlay with the Coach/Week/Dossier shell preserved.
4. Wire the generator to produce/save/load a real starter Week, with safe day/load constraints.
5. Implement trusted import activate and accurate manual-plan queue; permit plan-free filing where a member chooses to use it, but never conflate attendance with completed mileage.
6. Add phone-only Coach Arrivals and `This morning`/`Plans to arrange` action queues; then Sunday note composer and photo delivery as capacity and actual backend support permit.

**QA release stories** must run on real signed-in iPhone accounts, as distinct coached, self-guided, import, Curated-only and coach roles: sign in/out and resume; email code expiration; Apple private relay; new account's three working exits; canceled onboarding; protected-day generation; import activate and rollback; file upload receipt and ETA; no-plan filing; Coach Arrivals card access isolation; event RSVP join/leave and calendar correct timezone; offline/retry; privacy deletion; full existing athlete Week, Dossier poster, Plan Exchange, Coach list and filing regression; dark/light, Dynamic Type, VoiceOver and Reduced Motion. Document signed-in staging migrations/RPCs, Xcode build and in-device results before any production release.

## Design studies to complete in parallel

1. **Poster composition:** blank identity, typing a name, portrait placement, finished poster; preserve the existing Dossier portrait language.
2. **Three-door editorial layout:** all equal and selected transition; regular iPhone and large text.
3. **Folio reveal:** actual six-week sessions arrive from the generator; compare dark Week and Paper Spine and make protected days obvious.
4. **Join and event:** confirmed FORM Thursday / iRUN Monday plus a sample invitation and RSVP in Dossier, using only confirmed dates for live data.
5. **Bring plan:** schema upload preview vs human conversion submission + honest waiting Week.
6. **Coach tab integration:** actual current inscription and athlete strip retained; show `This morning`, Arrivals row, full arrival card and conversion queue both full and empty.
7. **Five-form grammar:** one question per page when applicable, good day-picker states, progress, interruption and return.

Motion rule: use one continuous poster-to-folio/member-card handoff, approximately 200–400 ms for ordinary transitions. Week → Dossier stays the existing left-side door with a sliver of Week visible and no aggressive paper bend. No red ribbon, noisy colors, heavy shadows, moving status bar, or confetti. Reduced Motion removes the moving poster but never hides a control or result.

## Explicit unknowns before live promises

- Current 44.2 Swift baseline and provider configuration, signed-in app build and distribution status must be verified; read-only 44.1 claims are not proof of 44.2 behavior.
- The Oct 29 Thursday track time quoted in drafts differs across notes. Confirm the organizer-approved meet/run times and meeting point before a real RSVP/card; iRUN exact meeting location and ALO dates remain pending.
- Choose actual capacity and terms for `Send it to us` manual conversion, coach reply timing and Sunday letters before publishing time-bound copy. Maintain the user-visible experience regardless of whether a particular concierge tier is monetized.
- Confirm source-of-truth for member portrait, coached membership linking, coach messages and photo tagging before reusing code paths for all free members.
- QA Supabase branch/environment, seeded identities/events and signed-in RPC evidence are still missing; no production schema update is justified by a compile-only rehearsal.
