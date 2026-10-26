# FORM · cross-agent alignment and release evidence

**October 26, 2026 · for Brice, Claude, Codex and ChatGPT**  
Owner: Brice. This document is a readable cross-repository handoff, not a substitute for the code, production database or signed-in device evidence.

## The new concierge direction (Brice + Claude, October 26)

Brice supplied **FORM Arrival · The Concierge Flow** with a live member poster, verified account creation, progressive intake, an actual six-week starter, actual file activation/manual conversion, and Join the practice. He explicitly wants the operational side **inside the existing mobile Coach tab**, which presently includes the athlete inscription, round-portrait strip and coached athlete cards.

The build contract is `docs/product/FORM_ARRIVAL_CONCIERGE_IMPLEMENTATION_CONTRACT_20261026.md` on PR #378. Keep the shipped collage, use verified email OTP in the designed experience (with working legacy magic link retained), compose the member poster, preserve all three doors, and implement Brice's phone-based Arrivals / This morning / Plans to arrange / The week ahead queues. Intake is progressive per selected door: joining a gathering never requires injury history or weekly mileage. The manual plan queue shows a real ETA instead of a next-day promise without staffed capacity. Paid coaching provenance and privacy remain distinct.

Claude's audit of 44.1 revealed its no-record dead end, unreachable FORMStrangerOnboardingFlow and preview-only import. These are known gaps, not activated features. Its critical merge warning: **native Curated PR #117 predates 44.1/44.2 and reportedly replaces whole Week/Dossier files**. Do not merge as-is. Rebuild surgical Curated changes on the *verified* FORM 44.2 target, with Xcode/device regression for poster Dossier, Plan Exchange and filing. Target the coherent 44.3 account/three-door batch. Neither documentation nor draft PRs prove production capability.

## The latest product decision overrides a narrower review

**Brice explicitly rejected cutting the experience to an Apple-only / calendar-only front door.** Do not remove these from the authored design:

- One FORM account with a designed welcome and **three clear paths**: **Make a plan**, **Bring a plan**, **Join the practice**.
- A meaningful free six-week starter from FORM's existing generator, without an artificial six-week plan storage/paywall limit.
- A genuine imported-plan preview/activation path that works with ChatGPT, Claude or a coach. It must not overwrite a current coached Week.
- A first-class no-plan Week and Dossier so Curated-only people belong, with the full Run with FORM calendar and events.
- The approved Week to cream Dossier side-door interaction, invitations, event detail, RSVP, calendar and return to the original Week day.
- Apple, Google and verified email as the **design target**. An actual provider goes live only after auth configuration/linking/device QA. Existing coach-invited magic-link claim must remain intact.
- Optional broad city/area as a privacy-minded future input. This need not be required to enter Curated. No GPS/home address, no automatic public athlete discovery.
- The three managed editorial host identities FORM, iRUN Monday and ALO Wellness. `FORM Curated` is an internal product/workstream term. Keep already-approved **Run with FORM** customer-facing naming where that is the established door.

The fuller design and timings live at `docs/product/FORM_OPEN_ENTRY_EXPERIENCE_DESIGN_BRIEF_20261026.md`; roadmap, actual engineering status and 100-account metric are in `docs/product/FORM_MASTER_PRODUCT_BRIEF_20261026.md` (PR #378). The new design is additive to the José-collage opening and existing SF identity, not a directive to erase a shipped opening. Reconcile the actual arrival behavior in native mockups before changing root routing.

The product can ship in coherent stages, **without deleting the remaining product**:

1. Curated/event foundation and existing-athlete invitation loop once backend/native are genuinely verified.
2. Public account choice and the plan-free/self-service paths with verified identity; Make/Bring as complete features when their receiver and generator pass QA.
3. Training Together behind opt-in and explicit two-party permission; the database draft does not make it live.

## Backend finding and fixes on Curated PR #376

Source: [speedandform PR #376](https://github.com/Breechay/speedandform/pull/376), branch `codex/form-curated-backend-20261026`; migration `supabase/migrations/20261026120000_form_curated_hosts_invitations.sql`.

Claude identified PostgreSQL `42702`: `plpgsql.variable_conflict = error` makes unqualified `account_id` ambiguous against table column references in `form_curated_my()` and `form_curated_rsvp()`. These functions would fail on execution even when the migration itself compiles.

**Source fixed, not yet deployed:**

1. `account_id` local variables renamed `v_account_id` in both functions, with all relevant references qualified or renamed. The RSVP removal predicate now uses `ci.account_id = v_account_id`.
2. Further audit found that `form_curated_my()` returned empty hosts/events to any authenticated member without an active `athlete_memberships` row. This breaks the proposed free Curated-only lane. The early reject is now only for no authenticated subject. Actual event visibility is still controlled by `r.visibility`, `collective_is_member()` and athlete-scoped invitation permissions.
3. **Unresolved:** `form_curated_invite()` currently targets coached `athlete_id` values. A general free member may browse eligible events and RSVP but cannot yet receive a private Brice-targeted invitation without a distinct member-recipient/consent path. Do not claim otherwise.

Commit evidence: `57cb7375ba80a16adb13a106d0e72fcc959fca6d` (name collision), `ab21cec41e079f44dae01118d66a1eabc9ed1e3a` (Curated-only member reader). Production DB migration **not applied**. No claim of passing runtime RPC tests yet.

## What Claude can assess despite FORM-iOS access limitation

Native companion: [FORM-iOS PR #117](https://github.com/Breechay/FORM-iOS/pull/117), branch `codex/form-curated-native-20261026`, draft and source-only. Its only changed paths are:

- `FORM/Coaching/FORMDossier.swift` — Curated store/model, invitation/event list/detail, calendar share sheet, Dossier entrance and this-week commitments.
- `FORM/Today/FORMFieldTodayView.swift` — Week-side unread circle/entrance and separate joined-event row, preserving authored training and Filing.
- `docs/next/FORM_CURATED_MVP_20261026.md` — native contract/QA notes.

The source is **not Xcode-compiled or iPhone-tested** in the cloud work. The branch is not merged or distributed. No private iOS source is copied into a different repository by this handoff. Claude needs actual repository permission or a user-provided patch for independent line-level review; summary is not a substitute.

Native acceptance needs: valid account A/B + coach isolation, Week dot and Dossier navigation, invitation to exact event, RSVP join and leave, opted-in attendee privacy, cancellation and moved-time freshness, Apple/Google calendar contents/timezone, Dynamic Type/VoiceOver/Reduce Motion, dark Week/cream Dossier return, and regression proof that event overlays never rewrite or file a workout. Existing FORM 44.2 (15) Codex release line is separate and must not be overwritten.

## Signed-in runtime QA gate, not merely SQL compilation

Before applying the Curated migration to production or distributing native #117, run on a disposable Supabase project/branch with two unrelated signed-in subjects and coach authorization:

| Operation | Coached athlete | Free Collective-only member | Coach / unauthorized account |
| --- | --- | --- | --- |
| `form_curated_my()` | Own invitations, eligible events, accurate read state | Eligible public/member events, no fake athlete invites | No unrelated private invitations |
| `form_curated_rsvp(id,true)` | Joins own account | Joins own account | Cannot impersonate another subject |
| `form_curated_rsvp(id,false)` | Removes own RSVP only | Removes own RSVP only | Does not delete another RSVP |
| `form_curated_mark_read(id)` | Own invite only | No foreign effect | No cross-account read |
| `form_curated_attendees(id)` | Only permitted names | Same eligible scope | No roster leak |
| `form_curated_manage()` | Refused | Refused | Authorized curator only |

Also exercise `form_curated_invite()` and `form_curated_create_event()` under real coach permissions. A `BEGIN/ROLLBACK` DDL rehearsal is useful but **insufficient** if functions are never called. Test the exact deployed version; keep durable receipts (subject types, returned/error classes, branch ref, migration hash, mobile build, observed behavior) without leaking tokens or identifying unrelated athletes.

The fail-closed runner in PR #376 is `tests/curated-signed-in-rpc-smoke.mjs`. It requires a **non-production** Supabase URL, publishable key, QA event ID, two distinct member access tokens and a coach token (optional outsider). It rejects the production project and refuses to run with missing inputs. It exercises `my`, `manage`, `mark_read`, `attendees` and join/leave, then asserts one person's leave does not remove the other person's RSVP. The file passed `node --check`; **the live RPC test has not run** because a safe QA project/branch has not yet been provisioned.

**Branch test status:** No disposable branch existed in the FORM Athlete System at the last check. An attempted `supabase_create_branch` returned `INVALID_ARGUMENT`; no branch or production mutation resulted. Creating a Supabase branch may incur usage charges and requires the proper cost confirmation. Do not evade this by running side-effecting test RPCs on production.

## Publication and the first event

PR #376 backend and #117 native are **staged only**. PR #377 is a stacked private matching draft and remains off; PR #378 is account/Exchange/design groundwork and also not live. `FORM 44.2 (15)` belongs to Codex's separate release batch. Neither a source commit nor a Netlify build is proof of production publication.

PR #377's head was created before the latest #376 Curated SQL fixes. Because it is stacked, **rebase/update #377 from the corrected #376 head before any eventual merge**. Do not let a stale stacked branch reintroduce the ambiguous RPC or the empty-member calendar restriction. This is a branch hygiene requirement, not authorization to activate Phase 2.

The Curated calendar will legitimately be empty until confirmed future occurrences are authored. Claude proposed Thursday October 29 at Flamingo Park, meet 5:50 AM and run 6:00 AM. These times should be verified against the current actual FORM organizer notice before creating the authoritative event; older context contains different times. iRUN Monday's exact meet point remains to be confirmed before a dated calendar entry. ALO dates remain pending. Do not invent Saturday meetups or publish partner registrations as FORM-owned RSVPs.

**Next decisions are engineering, not aesthetic narrowing:** obtain safe branch/fixture runtime evidence; fix any additional RPC issues; compile and signed-in walk native #117 on the release base; reconcile the live event calendar; then publish a coherent release batch. Preserve all three doors in the design and subsequent implementation roadmap.
