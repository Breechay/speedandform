# Race Pace Durability — plan/app audit results

**Audited:** September 12, 2026  
**Scope:** public/web repo, active FORM iOS repo, live FORM Athlete System schema/RLS/RPCs.  
**No Hope/José records were written or altered.** Runtime verification used synthetic rows inside transactions that were rolled back.

## Versions inspected

- `Breechay/speedandform` main: `712043fb6f07cad9292597c0e5ec415a3aa447d5`
- `Breechay/FORM-iOS` main: `70884a657963a59e2a794d397a2604022711fe09`
- Supabase project: `pbgsjjegycacodiltbhn` (`FORM Athlete System`), live schema as of this audit
- Public RPD pacing layer: `plans/race-pace-durability/execution.js`
- Public canonical plan reader: `plans/race-pace-durability/source.js` → `public_plan()`

**Not verified here:** an installed App Store/TestFlight build on a physical phone, iOS UI screenshots, offline device behavior, Apple-sign-in-to-Supabase identity handoff, or cross-device native filing. Those remain device/integration work rather than inferred claims.

---

# Executive finding

The backend is materially farther along than the shipped iOS app integration.

The FORM Athlete System already has an athlete-isolated, versioned plan feed (`athlete_plan_feed`), an idempotent athlete filing door (`record_session_from_form`), immutable authored session versions, audited completion history, coach-only corrections and judgments, and explicit editorial publication tables. The coach console reads that system today.

The shipped iOS compile unit does **not** consume that plan feed or filing door. `FORMApp.swift` contains a substantial local/native running product, including generic half-marathon planning, race execution, closure, Ledger, Strava/Garmin and iCloud-backed continuity, but no compiled `Race Pace Durability` plan identity, no Supabase project reference, and no compiled `The Withhold`, `Embedded Miles`, or `Blind Effort` sessions. Those named race-demand sessions exist in the repo's reference/catalog tree, not in the shipped compile unit.

Therefore the accurate current claim is:

> FORM already has useful running intelligence and local execution surfaces, while Race Pace Durability's authoritative plan assignment, filing and coach-decision loop currently lives in the web/backend system. Native app-guided delivery of this exact plan is **not yet verified**.

That is a bridge problem, not a reason to invent a second coaching engine.

---

# Tested / implemented / missing matrix

| Capability | Status | Evidence / finding |
| --- | --- | --- |
| Athlete isolation | **TESTED** | Rolled-back synthetic transaction: signed-in athlete saw only own synthetic athlete; cross-athlete plan feed and direct completion insert were blocked. |
| Own plan feed | **TESTED** | `athlete_plan_feed()` returned the synthetic athlete's active block, published session and immutable current version. |
| Cross-athlete session filing | **TESTED** | `record_session_from_form()` rejected filing against another synthetic athlete's planned session. |
| Idempotent athlete filing | **TESTED** | Same `evidence_id` replay returned the same completion and did not duplicate it. An allowed RPE update was applied. |
| Filed pieces | **TESTED** | Athlete filing RPC wrote structured `session_pieces` through its security-definer path. |
| Athlete cannot coach-correct | **TESTED** | Synthetic athlete invocation of `correct_session()` was rejected. |
| Coach correction audit reason | **DEFECT CONFIRMED / FIX STAGED** | Live function successfully changes data but failed to stamp its reason onto the revision rows because `clock_timestamp()` was compared with revision rows defaulted with `now()`. Candidate migration passed a rolled-back synthetic correction test. |
| RLS for prescription writes | **SOURCE + POLICY VERIFIED** | Blocks/weeks/sessions/versions/components are member-readable; authoring is coach-only. Session versions are immutable. |
| Coach judgment ownership | **SOURCE + POLICY VERIFIED** | Mark judgments/confidence and prescription authoring are coach-only; `resolve_coach_task()` writes a published decision authored by the coach. |
| Public editorial separation | **SOURCE VERIFIED** | `public_plan()` exposes only a published non-revoked plan and explicitly published non-revoked result rows. Private filing is not an automatic study publication path. |
| Support payment changes mode | **ABSENT BY DESIGN** | No paid entitlement is wired to plan assignment, coach membership or review. Supporting the free plan grants no hidden review path. |
| Native RPD plan identity | **MISSING** | Compiled `FORMApp.swift` contains zero `Race Pace Durability` / `race-pace-durability` literals. |
| Native authoritative plan-version feed | **MISSING** | No compiled Supabase project/API bridge was found. The app has local/native plan systems instead. |
| Native RPD filing to FORM Athlete System | **MISSING** | Native network paths found are Strava, Garmin, Field/relay and related services; no native call to `record_session_from_form`. |
| Explicit filed prescription version | **MISSING / RELEASE BLOCKER** | `session_completions` stores `planned_session_id` but not the immutable `planned_session_version_id`. A later revision can make a late filing ambiguous. |
| Plan-guided adaptive next-step engine | **MISSING INTENTIONALLY** | No approved RPD repeat/progress/change policy exists. Current backend correctly keeps decisions coach-authored. |
| New independent runner self-provision | **MISSING** | Current `/athlete/` requires an existing athlete membership; otherwise the reader is told the record is not linked yet. |
| RPD pacing parity web/PDF/app | **MISSING** | Web execution notes are newer. Current PDF is the training sheet; reference iOS catalog has related pacing ideas but they are not compiled. |
| Native cross-device profile continuity | **IMPLEMENTED, NOT RPD SERVER IDENTITY** | Native app uses iCloud KVS/UserDefaults for profile/program continuity. This is not proof of authoritative RPD assignment sync. |
| Native return-after-absence behavior | **IMPLEMENTED LOCALLY, NOT SERVER-POLICY VERIFIED** | Local setting supports resume/compress/key-only behavior; no RPD plan-guided server rule is approved. |

---

# What is real today

## 1. Authoritative backend plan feed

`athlete_plan_feed(athlete_id)` is already the right read-side primitive for an assigned athlete:

- requires the athlete to be reading their own record;
- returns athlete identity, active block, weeks and published sessions;
- returns the latest immutable session version including `id`, version number, title, shape, intent/details, distance/duration, pace/RPE and coach note;
- returns typed components including repeat/recovery/pace/RPE and mark eligibility;
- exposes plan-authority state and sync timestamp.

Do not create a parallel RPD JSON plan store inside the app.

## 2. Athlete filing door

`record_session_from_form()` is stronger than the current browser filing helper:

- derives athlete identity from the authenticated membership;
- refuses ambiguous accounts with more than one active athlete identity;
- requires a receipt/evidence id;
- validates status and RPE range;
- validates the planned session belongs to that athlete;
- refuses future evidence;
- is idempotent by athlete + evidence id;
- writes structured pieces;
- permits bounded replay updates without creating a second completion.

The native RPD bridge should use this path rather than inventing a new filing table or posting directly to `session_completions`.

## 3. Coach console / judgment

`/coach/labs/` is the active console. Its own source states the division clearly: prescription rendering is shared, athlete reporting can grow, but authorship mechanics and judgment stay coach-owned. The console loads real athlete records, filed pieces, verdicts, exceptions, reads, judgments and tasks. It can revise sessions and author reads without giving the athlete prescription-write power.

That is the coached mode. Preserve it.

## 4. Native FORM already has useful execution primitives

The shipped `FORMApp.swift` has:

- a three-layer execution doctrine: **Intended → Perceived → Observed**;
- a `FORMClosure` linked to a session, with required perceived execution and optional observed/device execution;
- Ledger and completion flows;
- Strava/Garmin ingestion paths;
- local/iCloud continuity;
- generic half-marathon race execution copy: controlled opening, hold through the middle, spend what remains late.

Those are assets for the RPD bridge. They are not proof that this exact 15-week plan is delivered natively.

---

# Confirmed defects / gaps

## P0 — completion does not explicitly carry the prescription version

A completion is attached to a `planned_session_id`, while prescription anatomy lives on immutable `planned_session_versions`.

`session_verdicts` partially protects history by selecting the newest version created no later than `filed_at`. The previous `mark_established_value` did not: it joined the completion to every version of that session, creating a future risk that a later prescription revision could change what old evidence appears to establish.

A staged migration scopes ownership to the effective version at filing time. A preflight comparison showed the candidate query produces the **same current ownership values and qualifying-segment counts for Hope and José** as production today.

That repair is still inference. Before native plan-guided filing is called reliable, the filing receipt should explicitly persist the immutable `planned_session_version_id` the athlete saw.

**Acceptance test:** file against version 1, author version 2 with a different band after the run, then prove the completion continues to be interpreted against version 1 on every surface and derived view.

## P0 — coach correction reason stamping is broken in production

The current `correct_session()` records revision rows through triggers, but its timestamp filter fails to attach the supplied reason to those rows. The defect was reproduced with rolled-back synthetic data.

`20260912143000_rpd_evidence_revision_integrity.sql` is staged with a fix that snapshots existing revision IDs and reason-stamps only revisions created by that correction. The candidate passed the same rolled-back synthetic correction test.

**Acceptance test:** correction updates summary + pieces, keeps completion identity fixed, preserves previous rows, and every newly-created revision has the coach's reason.

## P0 — shipped native app is not using the authoritative RPD backend

The active iOS repo has a 51k-line shipped `FORMApp.swift` compile unit. Source indexing found:

- zero RPD plan identity literals;
- zero compiled plan-version concept matching the backend assignment/version model;
- zero compiled `The Withhold`, `Embedded Miles`, `Blind Effort` names;
- no Supabase project reference or athlete-plan-feed/filer call.

The named Half race-demand catalog is valuable reference material, but the repo README says the `FORM/**` split tree is not currently in Compile Sources.

**Acceptance test:** a fresh assigned synthetic athlete signs in on device, sees the exact server version of RPD Week 1, files it, and the same completion appears in coach Labs without manual database setup.

## P1 — current browser athlete filing does not use the stronger filing RPC

`/athlete/` currently inserts/updates completions through `private/data.js`. It captures useful fields but does not use the idempotent evidence receipt + structured-pieces RPC and does not carry an immutable prescription-version receipt.

Do not silently replace this live path until parity and correction behavior are tested; it remains a useful coached-athlete surface.

## P1 — independent acquisition is not self-service

A new signed-in user with no athlete membership reaches a clean “record is not linked yet” state. That is correct for coached athletes and insufficient for a stranger starting the free plan independently.

The self-guided release needs an explicit enrollment action that creates only the minimum plan-guided identity/assignment. It must not create a coach membership, coaching task promise, or public-study consent.

## P1 — adaptive plan-guided coaching is not approved

The database has enough evidence objects to support bounded rules, but no approved RPD policy says when an unwatched athlete should repeat, advance, change a band or pause the progression.

Do not turn the existing coach queue into a hidden self-guided service. Until rules are approved, plan-guided mode should deliver the authored plan and collect evidence while unresolved cases remain unresolved.

---

# Required scenario result

| # | Scenario | Result |
| --- | --- | --- |
| 1 | New independent runner, no manual setup | **MISSING.** Membership/assignment provisioning is not self-service. |
| 2 | Existing coached athlete, correct band across devices | **BACKEND IMPLEMENTED; NATIVE NOT VERIFIED.** Server feed is athlete-specific; native RPD bridge absent. |
| 3 | W1 good averages conceal aggressive entry | **NOT DECIDABLE WITH SUMMARY ALONE.** Must preserve opening/middle/finish or rep-level evidence; do not auto-pass. |
| 4 | W4 five continuous vs five broken total | **MODEL SUPPORTS DISTINCTION** when pieces are filed: ownership takes longest qualifying piece, not sum. Native RPD filer absent. |
| 5 | W9 eight continuous + Saturday fatigue context | **MODEL SUPPORTS TWO FILINGS; POLICY NOT AUTOMATED.** They remain separate evidence questions. |
| 6 | W12 four easy + twelve RP | **MODEL SUPPORTS COMPONENT/PIECE SEPARATION.** Only the qualifying RP piece should move the mark. |
| 7 | Blind segment attempted / not attempted | **REFERENCE-AUTHORED, NOT COMPILED.** `Blind Effort` exists in catalog only; filing field/policy missing. |
| 8 | Missing effort, mixed units, interrupted upload, duplicate, correction | **PARTIAL.** Missing RPE stays null; units typed; duplicate receipt tested; correction audit defect found/fix staged; native retry/offline not tested. |
| 9 | Coach revision after filing | **PARTIAL / P0.** Session versions immutable and historical verdict infers effective version, but completion lacks explicit version receipt. |
| 10 | Return after absence | **LOCAL NATIVE SUPPORT EXISTS; RPD POLICY UNAPPROVED.** No automatic catch-up should be claimed. |
| 11 | Self-guided case needs human judgment | **BOUNDARY AVAILABLE.** No support payment/review entitlement exists; unresolved state/presentation still needs product implementation. |
| 12 | Private filing reaches console, not public study | **SOURCE/POLICY VERIFIED.** Private evidence and editorial publication are separate. |

---

# Actual ownership diagram

```text
TRAINING METHOD
training_plans → training_plan_versions → training_plan_weeks/sessions/components
                         |
                         v
INDIVIDUAL DELIVERY
plan_assignments → training_block → training_weeks → planned_sessions
                                             |
                                             v
                                  planned_session_versions (immutable)
                                             |
                                             v
                                  planned_session_components

ATHLETE EVIDENCE
signed-in athlete
   → record_session_from_form(receipt, planned_session, report, pieces)
   → session_completions
   → session_pieces / completion_evidence
   → completion_revisions on change

INTERPRETATION / DECISION
filed evidence → exceptions / verdicts / mark evidence
               → coach Labs
               → reads / judgments / decisions / prescription revisions

PUBLICATION
private filing ─X→ public study
coach editorial selection + explicit publication/consent
               → plan_result_publications / authored study HTML
```

The missing native bridge is between **signed-in FORM iOS** and the existing `athlete_plan_feed` / `record_session_from_form` doors.

---

# Short reporting prototype

The app should not ask the full questionnaire after every run.

## Easy work

Autofill athlete, assignment/session/version, date and units. Ask only:

- completed / changed / skipped;
- actual distance or time if not imported;
- optional short note when something changed.

## Broken race-pace work

Autofill prescription, band and recovery. Preserve:

- rep splits;
- recovery/float when it is part of the question;
- RPE (unknown remains null);
- limiter in athlete words;
- reserve in athlete words when relevant;
- entry/drift/correction only when the session is explicitly practicing pacing.

## Continuous / late race-pace asks

Preserve the qualifying segment separately from the host run:

- total run;
- qualifying RP segment;
- opening / middle / finish splits when available;
- RPE;
- surface/conditions;
- limiter/reserve;
- whether pace was entered restrained, chased, corrected or held evenly.

W12 must remain “4 easy + 12 RP,” not a sixteen-mile average. W9 Tuesday and Saturday remain separate evidence receipts.

## Blind work

Only show the blind/calibration fields when the prescription asked for them. “Not attempted” is not failure; it means there is no calibration evidence from that session.

---

# Smallest viable plan-guided release

Do **not** start by making FORM autonomously rewrite Race Pace Durability.

### Release 1 — exact plan + exact filing

1. Same account identity as FORM Athlete System.
2. Explicit self-guided RPD enrollment creates athlete + assignment without coach membership.
3. Native app reads `athlete_plan_feed()`; it does not regenerate RPD locally.
4. Today/Plan render the exact immutable assigned session/version.
5. Filing goes through `record_session_from_form()` with a stable receipt id and typed pieces.
6. Filing receipt explicitly stores the immutable session-version id.
7. After filing, show what was recorded. Do not invent an adaptive decision.
8. Coach mode continues to use Labs and authored decisions.
9. Supporting the free plan changes none of these permissions.

That is already a useful beta: the plan is alive digitally, evidence is durable, and the same record can later support bounded intelligence.

### Release 2 — bounded rules only after approval

Add repeat/progress/change logic one rule at a time. Every rule must carry:

- rule/version id;
- plan/session scope;
- required evidence;
- unavailable/unknown handling;
- reason shown to athlete;
- author/approval;
- override/undo history;
- replay idempotency.

No rule may turn symptoms, missing data, treadmill context, interrupted weeks or an aggressive-start fade into automatic intensification.

---

# Policy choices for Brice before adaptive release

These are product/training decisions, not engineering guesses:

1. **Ownership qualification:** confirm the exact minimum evidence for each continuous rung. A single uninterrupted qualifying piece is the current semantic; broken distance never sums into the same rung.
2. **Pacing error:** decide when an aggressive opening + late fade means “repeat / execution unresolved” even if the whole-segment average lands in band.
3. **W9:** define whether Tuesday ownership and Saturday durability can ever advance different states independently in self-guided mode.
4. **W12:** confirm only the twelve-mile RP segment is the qualifying ownership evidence; the four easy miles are context.
5. **Missing athlete report:** missing effort/reserve remains unknown. Decide whether pace-only evidence can advance anything beyond measured execution.
6. **Surface/context:** define which asks require outdoor evidence, if any, by plan/version rather than athlete folklore.
7. **Absence:** choose the default bounded return behavior. Do not compress missed quality into catch-up overload.
8. **Human-needed state:** define the athlete-facing wording when the rule cannot decide. It must not imply Brice will review a self-guided runner.

Until these are approved, “the next authored session remains available; no adaptive change was made” is safer than a hidden coach imitation.

---

# Rollback / release boundaries

- Native RPD integration should be feature-gated until synthetic account → feed → filing → console is green on device.
- Server filing/identity remains authoritative; local app state may cache but must not create a second assignment truth.
- If sync is paused, native app should explain that current plan sync is unavailable rather than silently generating a substitute plan.
- A filing receipt can be retried; the same receipt must never advance twice.
- Public-study publication remains an explicit separate action owned by Brice.

---

# Public claims supported now

Safe:

- The Race Pace Durability plan is free and can be supported optionally.
- FORM is in beta and can be included without a separate app subscription.
- The backend already supports athlete-specific versioned prescriptions, evidence filing and coach review.
- Hope/José are coached athletes; their use does not prove stranger/autonomous delivery.

Not safe yet:

- “FORM coaches this plan for you.”
- “The app automatically adjusts the plan from your results.”
- “Any new runner can start the plan in the app without setup.”
- “Your app filing is guaranteed to preserve the exact viewed prescription version.”
- Any race-outcome/causality claim before verified December 5 evidence.

---

# Audit conclusion

The architecture does not need another intelligence engine. It needs the shipped app connected to the intelligence and evidence system that already exists, plus one explicit prescription-version receipt and a small set of approved decision laws.

The order is:

**integrity → identity → exact plan sync → exact filing → device proof → bounded rules.**

That keeps plan-guided and coached modes genuinely different without duplicating FORM.
