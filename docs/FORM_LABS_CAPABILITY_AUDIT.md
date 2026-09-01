# FORM Labs — current capability audit

Evidence gathering only. No code written, no migrations, no redesign.

**Scope and limit.** This audits two repositories: `speedandform` (Coach Console,
athlete web door, Supabase migrations) and `FORM-iOS`. It reads the repo, not the
live database. The handoff of 30 August records git as matching production, so the
migration set is treated as the schema. Anything described as *live state* below is
flagged as needing a read against production before it is relied on.

---

## 0. One correction to the premise, before anything else

The instruction says: *"the athlete-facing FORM plan and Coach Console are now
synchronized around the same source of truth. Do not redo Gate A."*

I did not redo Gate A. But the audit cannot report that premise as true, so it says
what it found instead.

**Gate A is built in both directions and wired in one.**

| Direction | Transport | Wired to a surface? |
|---|---|---|
| FORM → Console (evidence) | `record_session_from_form` RPC, `FORMSessionUpload`, offline queue | **Yes.** `FORM/Ledger/FORMLogSheet.swift:1199,1245` enqueue on filing. |
| Console → FORM (the plan) | `athlete_plan_feed` RPC, `FORMPlanFeed`, `FORMPlanCache` | **No.** |

The plan is fetched, decoded, validated and written to disk. Nothing then reads it.
Outside `FORM/Coaching/`, the only two references to the cache in the entire app are
`FORMApp.swift:34103` (refresh on foreground) and `FORMApp.swift:47144` (clear on
sign-out). No view, resolver or authority consumes `FORMPlanFeed`.

Two details make this look deliberate rather than accidental, and worth knowing
before the brief is written:

- `FORMPlanSync.reportRenderedGeneratedDespiteCampaign` exists specifically to
  report *"a cached campaign exists and Today is still drawing a generated
  session."* Its own comment calls this "the most deceptive of the three." **It is
  never called.** So is `reportStale`.
- The athlete's screen is still drawn by FORM's own V3 engine
  (`formV3RoutedDayPlans` → `FORMSequenceResolutionCoordinator`), which authors
  sessions from the athlete's objective independently of anything the coach wrote.

So today there are **two plan authorities**, and the one the athlete runs is the
phone's. The bridge that would collapse them is complete up to the last mile.

This is not a Gate A failure — the hard parts (auth, RLS, the feed contract, the
wire contract, idempotency, the offline queue) are all done and tested. It is one
unwired seam. But the Labs brief should be written against what is true: **the
single source of truth exists on the server and has not yet displaced the phone's.**

**Second thing to verify live, not from the repo:** the 30 August handoff records
`coaching_sync_state.enabled = false` ("Paused until the 39.4 (7) end-to-end athlete
walk passes") and **0 active athlete memberships**. Both doors are thin wrappers
that raise `coaching_sync_paused` when that switch is off. If that is still the live
state, the bridge is closed at the server as well. Read it before designing on it.

---

## 1. Source of truth

**Where prescribed sessions live.** `training_blocks` → `training_weeks` →
`planned_sessions` → `planned_session_versions` → `planned_session_components`.
Five levels, all rows, all `athlete_id`-scoped.

**Prescription is versioned and append-only in practice.** A session is a stable
identity (`planned_sessions`); what it asks for is a numbered version
(`planned_session_versions`, unique on `(planned_session_id, version_number)`) with
`change_reason` and `authored_by`. Editing future work appends a version; it does not
mutate. `reviseSession()` in `private/data.js:416` is the coach path.

**Typed dose exists.** `planned_session_components` is the real prescription: `role`
(warm_up/work/recovery/cool_down), `shape` (continuous/repetitions), `repeat_count`
plus a full progression quartet (`repeat_minimum`/`target`/`progression`/`ceiling`),
distance or duration, `recovery_seconds` + `recovery_kind` (float/easy/jog/standing),
pace band, RPE band. Constraints enforce that a repetition count matches the shape,
that something is measured, and that a recovery is named if it has a duration.

**When an athlete files.** `record_session_from_form` (app) or `file_session`
(coach). Both write `session_completions` + `session_pieces`. The app door is
idempotent on `evidence_id` — a retry attaches, a later RPE call amends only effort
and notes, and objective evidence is never quietly restated. Corrections go through
`correct_piece_measurement`, which writes a `session_piece_corrections` row per field
with a required `source` and `reason`.

**Where data can still drift or duplicate:**

1. **The unwired plan feed** (§0). This is the drift.
2. **`planned_session_versions.details` and `.shape` are stored prose** duplicating
   what `planned_session_components` now says in types. Item 73 of the ship list
   already names these for deletion. Until then, a session can say two things.
3. **Free-text measurement columns on `session_completions`**: `rep_paces`,
   `float_paces` (text) overlap `session_pieces` (typed, per-rep, with
   `duration_seconds_exact numeric(7,2)`). The typed table is authoritative; the
   text columns are legacy and comparable across athletes only by parsing.
4. **`athletes.goal_pace_seconds` is derived and stored**, from `goal_seconds ÷
   13.1094` — with the divisor hardcoded and gated on `target_event ~* 'half'`.
   Nothing recomputes it if the goal moves.

---

## 2. Athlete model

`athletes`: `slug`, `display_name`, `first_name`, `home_surface`
(**check: 'website' | 'form'**), `target_event`, `goal_label`, `program_name`
(**not null**), `account_label`, `active`. Later columns: `goal_seconds`,
`training_target_seconds`, `goal_pace_seconds`.

Identity is `athlete_memberships (athlete_id, user_id, role)` — an athlete row is
not a user, which is what lets a coach file on an athlete's behalf and what makes
`is_athlete_member` / `is_coach_member` the whole authorization model.

**Can an athlete exist without a race?** Structurally yes — `target_event`,
`goal_label`, `training_blocks.race_on` and `starts_on` are all nullable.
Practically no: `program_name` is `not null`, `training_blocks.total_weeks` is
`not null > 0`, and `athlete_marks` assume a numeric target.

**What assumes a runner:**

- `distance_unit` is checked to `('mi','km')` on versions and components,
  `('mi','km','m')` on pieces. There is no rep/set/load vocabulary anywhere.
- `session_pieces.kind` is checked to `('warmup','rep','float','cooldown')` and
  `pace_seconds` is documented as seconds per mile.
- `movement_reads.marker` is a **hardcoded five-value enum**: heel_light,
  chest_proud, wrist_to_hip, single_leg_control, running_economy.
- `effort_defaults.session_family` is checked to
  `('interval','threshold','race_pace')`.
- `athletes.goal_pace_seconds` carries a half-marathon constant.
- `session_verdicts` computes float honesty as *pace within 45 s/mi of easy pace*.

**What would already serve a FORGE athlete (Rod, Devin):** the block/week/session
/version skeleton, memberships and RLS, `directions`, `reads`, `decisions`,
`coach_private_notes`, `coach_tasks`, `session_exceptions`, `completion_evidence`,
`support_prescriptions` + `support_items` (purpose/movement/reason/cue/**dose as
text**), and `athlete_marks` if the mark is numeric. The dose vocabulary is the gap:
strength work has no typed representation, only `support_items.dose text`.

---

## 3. Training / block model

**Arbitrary block length is data-driven.** `total_weeks smallint not null > 0`;
weeks are rows with `week_number >= 0` (zero allowed, so a lead-in week is
expressible). 8, 11, 16, 17 all work today with no code change.
`training_blocks.week_starts_on smallint` declares the ISO opening day per block —
Natalie opens Sunday, the half builds open Monday — and the app decodes it rather
than assuming.

**Planned vs completed** are separate tables joined by
`session_completions.planned_session_id`, which is nullable — an ad-hoc run files
without a prescription, and the Console has a distinct `adHocInspectorHtml` for it.

**Progressions** are typed on the component:
`repeat_minimum → repeat_target → repeat_progression → repeat_ceiling`, all carried
through the plan feed to the app.

**Runway** is `runwayHtml()` in `coach/coach.js:438` — a per-week strip derived
entirely from existing rows, plus `campaign_ladder(slug)`, a SQL function returning
`(week_number, title, race_pace_volume, reach, role, volume_carried,
duration_carried, precondition)`. It reports and never repairs, and it was already
corrected once to count volume by **week** rather than by session.

**Is the whole block queryable as one object?** Yes.
`loadAthleteRecord(athleteId)` (`private/data.js:55`) issues 26 queries (31 for a
coach) and returns one record containing `weeks`, `sessions`, `sessionsByWeek`,
`currentWeek`, `nextWeek`, versions with components nested, completions, pieces,
verdicts, marks with checkpoints and gates, judgments, confidence, evidence files.
`blockShapeHtml()` already renders the entire block as a grid from it.

**This is the finding that matters for the brief: whole-block visualisation is
almost entirely a presentation problem. The data is assembled today.**

---

## 4. Evidence

Stored per filing (`session_completions`): status, `actual_distance` + unit,
`duration_seconds`, `rpe`, `rpe_source`, `rpe_default_version`, `easy_minutes`,
`continuous`, `floats_easy`, `surface`, `conditions`, `temperature_f`, `felt`,
`knee_during`, `knee_after`, `recovered_next_day`, `athlete_note`, `symptoms`,
`limiting`, `strava_url`, `unreadable_because`, `evidence_id`, `source`
(athlete/coach_import/**form**), `filed_by`, `filed_at`.

Per piece (`session_pieces`): position, kind, distance + unit, `duration_seconds`,
`duration_seconds_exact numeric(7,2)`, `pace_seconds`, `source`. Pace is **stored,
not derived**, so a watch measurement is never recomputed from a rounded distance.

Attachments: `completion_evidence` (storage path **or** external URL, enforced
exactly one), private bucket `session-evidence`, signed URLs at read time.

History: `completion_revisions` (whole previous row as jsonb + `reason`) written by
`audit_completion_change`; `session_piece_corrections` (one row per field, required
source and reason); `prevent_immutable_change` triggers; `protect_completion_identity`.

**Structured vs freeform.** Structured: pieces, RPE, surface, conditions,
temperature, recovery booleans, verdicts. Freeform: `felt`, `athlete_note`,
`symptoms`, `limiting`, `unreadable_because`, `conditions`.

**Can a qualitative observation be stored apart from raw evidence?** Yes, three
ways: `session_exceptions` (source ∈ athlete_reported/coach_observed/system_detected;
kind ∈ symptom/stopped_early/context/evidence_gap; immutable detail; open/reviewed/
closed), `coach_private_notes`, and `reads` linked through `read_completions`.
`session_exceptions` is the strongest primitive in the schema for this — it keeps an
athlete's report and a rule's finding as different kinds of fact and never flattens
them.

**Inspector primitives** in `coach/coach.js`: `sessionInspectorHtml`,
`adHocInspectorHtml`, `evidenceFactsHtml`, `railSvg`, `paceRunSvg`, `doseOf`,
`structureOf`, `qualifyingWords`, `titleAlreadySays`.

---

## 5. Coach interpretation

| Concept | Table | Versioned? | Points at evidence? |
|---|---|---|---|
| Observation | `reads` | supersede via `delivery_state` | **yes**, `read_completions` |
| Instruction | `directions` | `delivery_state`, per session | via `planned_session_id` |
| Decision | `decisions` | `delivery_state` + `effective_on` | **yes**, `decision_completions` |
| Judgment | `mark_judgments` | **yes**, `supersedes` self-FK | **yes**, `mark_judgment_completions` |
| Claim | `athlete_marks.claim/claim_state/claim_note` | **no — overwritten** | no |
| Confidence proposal | `mark_confidence_proposals` | rule_id + rule_version + factors jsonb | **yes**, `evidence_completion_ids uuid[]` |
| Confidence decision | `mark_confidence_decisions` | accept/hold/override | via proposal |
| Attention (WATCH) | `coach_attention` **view** | derived, not stored | yes, `subject_id`/`subject_kind` |
| Verdict | `session_verdicts` **view** | derived | computed from pieces |
| Private note | `coach_private_notes` | no | optional FK to session/completion/read/decision |

**Nearly every interpretation can already name the evidence that produced it.** The
two that cannot are `athlete_marks.claim*` (overwritten in place) and
`movement_reads` (unique per `(athlete_id, marker)` — one standing row per marker,
so the previous reading is lost on update, though it does carry a nullable `read_id`).

`mark_judgments` is the model to copy: direction, a **required** non-empty reason in
Brice's own words, and amendment by writing a new row that names the one it replaces.

---

## 6. Ownership and athlete-specific instruments

Ownership lives in four places:

- `athletes.goal_seconds`, `training_target_seconds`, `goal_pace_seconds` —
  **columns on the athlete row**, race-athlete-specific and half-marathon-shaped.
- `athlete_marks` + `mark_checkpoints` (the ladder: value, label, position, state ∈
  reached/current/proposed/repeated/retired) + `mark_gate_conditions` +
  `mark_signals` + `mark_proof_state_changes` + `mark_checkpoint_movements`
  (`moved_by`, `moved_at`, `granted_reason`, `revoked_*`).
- `campaign_ladder(slug)` — the derived rung table.
- The confidence stack (§5).

**Optional or baked in?** `athlete_marks.active` and `is_primary` make marks
optional as rows, and `mark_type`/`unit` are free text, so a non-running mark is
expressible. But the three `*_seconds` columns are on `athletes` itself, and
`campaign_ladder` is written in terms of race-pace volume and reach. An athlete on a
different evidence model would carry three null columns and be invisible to the
ladder — degraded, not broken.

---

## 7. Cohorts and cross-athlete querying

`loadCoachRoster` is the only cross-athlete query: `coach_attention`, primary
`athlete_marks`, `mark_checkpoints` and `mark_standing_confidence`, each `.in(athlete_ids)`.
RLS permits any `.in()` across athletes the coach holds, so **arbitrary cross-athlete
queries already work**; the Console simply does not issue them.

`field_groups` + `field_group_memberships` exist but are a **different axis** —
authenticated Field relay membership keyed on `auth.users`, not coaching cohorts. Do
not overload them.

**No arbitrary athlete-group primitive exists on the coaching side.** A cohort today
is "the athletes this coach has memberships for."

**Longitudinal comparison of Simon, Hope and José:** the good news is
`session_pieces.pace_seconds` is normalised to seconds per mile and stored, and
`filed_at` is a timestamp — so pace-over-time across athletes is queryable now. The
normalisation problems that would block it:

1. `actual_distance` carries a per-row `distance_unit` (mi | km), never normalised.
2. `session_pieces.distance_unit` additionally allows `m`.
3. `pace_low`/`pace_high` on versions and components are **text** (`"6:52"`);
   `pace_text_to_seconds()` exists server-side but the columns stay text, and there
   are also `pace_low_seconds`/`pace_high_seconds`/`target_pace_seconds` integer
   columns — two representations of one fact.
4. Weeks are per-athlete rows; a shared x-axis has to be *weeks-to-race*, computed
   from `training_blocks.race_on` and `training_weeks.starts_on`. **Compute it from
   the week start, never from the session date** — keying on the session date puts a
   Saturday long run and a Sunday long run in the same week into different buckets.
   That artifact produced a false "missing long runs" finding earlier today.
5. `rpe_source` and `rpe_default_version` mean an RPE 7 may be reported or defaulted;
   they are not interchangeable in a chart.

---

## 8. Athlete-specific knowledge

**This is the genuine gap.** There is no table for a persistent athlete-level fact.

What exists and why each falls short for *"José reports performing better with
increased calories/carbohydrates"*:

| Candidate | Why it does not hold the fact |
|---|---|
| `coach_private_notes` | Right shape — athlete-scoped, `authored_by`, optional FK to the session it came from. But coach-only, free text, **no kind, no source, no state, no supersession**. Retrievable only by reading every note. |
| `athlete_baselines.constraints` | Intake-time, snapshot, `source ∈ athlete \| coach_import`. Not a growing set. |
| `movement_reads` | Closest *structurally* — one standing row per athlete per marker, with `state`, `cue`, `rating`, `support_purpose` and a nullable `read_id` back to the read. But the marker list is a hardcoded five-value movement enum and updates overwrite. |
| `session_exceptions` | Per-session by design and constrained to name one. A tendency is not an exception. |
| `reads` | Published prose delivered to the athlete. Not a queryable fact. |

**Provenance requirement.** The brief asks that such a fact retain provenance back to
athlete / session / evidence, and distinguish ATHLETE / FORM / PATTERN as its source.
`session_exceptions.source` already models exactly that trichotomy
(`athlete_reported` / `coach_observed` / `system_detected`), and
`mark_confidence_proposals.evidence_completion_ids uuid[]` already models
"the evidence this was computed from." **Both patterns exist; neither is applied to a
standing athlete fact.**

So "What Helps José" is small on screen and genuinely new underneath — which is the
inverse of the block visualisation, and worth saying plainly in the brief.

---

## 9. Coaching operations

**No calendar or event primitive.** The only dates are `scheduled_on`,
`training_weeks.starts_on/ends_on`, `training_blocks.race_on/starts_on/ends_on`,
`decisions.effective_on`, `coach_tasks.due_on`. Nothing represents a meeting, a
scheduled call, or a remote-versus-in-person session.

**No key-session designation.** The phrase appears in migration prose
(`20260826140000_rpe_and_key_sessions.sql`) but no column was ever added. Today "key"
is inferred from a session having components with a pace band, or from
`athlete_marks.evidence_surface_requirement`.

**Review / evidence-due state does exist,** derived rather than stored:
`coach_attention` unions five kinds — `athlete_report` (open athlete-reported
exception), `recovery_flag` (`recovered_next_day = false`), `authored` (open
`coach_tasks`), `unread_session` (a filing with no published read against it), and
`missing_direction` (a published session inside two days with no direction).
`coach_tasks` carries `waiting_for_run` / `waiting_for_athlete` states,
`resolve_coach_task`, `coach_task_evidence`, `coach_task_actions`.

`missing_direction` fires at `scheduled_on <= current_date + 2`, which is the closest
thing to a Sunday-brief trigger the system has. **A Sunday athlete brief is
assemblable from `coach_attention` + `nextSessions` today with no new table.**

---

## 10. Media

| Asset | Where it lives | Reachable by the Console? |
|---|---|---|
| Session screenshot / file | `completion_evidence` → private bucket `session-evidence`, signed 1 h | **yes** |
| External evidence link | `completion_evidence.external_url` | yes |
| Athlete profile image | **device-local only** — `FORMProfilePhotoStore`, `~/Documents/form_avatars/*.jpg` + `index.json`, downscaled to 1024 px | **no** |
| Video | nothing | — |

`athletes` has **no image column**, and there is no avatar bucket. The Console renders
`initials(name)` (`coach/coach.js:72`); FORM renders a monogram from the first letter
when the local library is empty.

**A large portrait-driven Labs athlete experience needs, minimally:** a public-read or
signed avatar bucket, a column or table pointing at it, and a decision about whether
the phone's local library uploads or the coach supplies the portrait. Consent is
already modelled for one case only — `record_publications.consent_recorded_at` +
`consent_note` — and a portrait shown in a shared surface is the same question.

---

## 11. FORM Notes / knowledge

`reads` is the editorial primitive: `athlete_text`, `question_answered`,
`delivery_state`, `delivered_wording`, `published_at`, linked to the evidence via
`read_completions`. `record_publications` is the publish-outward primitive, with
`revision`, consent fields, and `revoked_at` — one athlete, one excerpt, versioned.

A broader FORM Note **retaining provenance is reachable**: an observation already
knows its athlete, its evidence and its author. What is missing is any notion of a
note that is not athlete-scoped — every editorial table is `athlete_id not null`. A
FORM Note spanning three athletes has no home, and `record_publications` is
single-athlete by construction.

---

## 12. Existing Console — what is reusable

**Keep as infrastructure:**

- `private/supabase-client.js`, `private/auth.js` (doorway, access context,
  `bindAccountSecurity`, email change) — 310 lines, surface-independent.
- `private/data.js` (735 lines) — `loadAthleteRecord`, `loadCoachRoster`,
  `authorSession`, `reviseSession`, `fileForAthlete`, `editFiledSession`,
  `judgeClaim`, `moveCheckpoint`, `setConfidence`, `decideConfidence`,
  `setEstablishedProofState`, `createDirection`, `createRead`, `addPrivateNote`,
  `publishRecordExcerpt`, `resolveCoachTask`, `proofCoverage`, `signEvidence`.
  **This layer is the asset. It is already surface-independent and should survive a
  Labs redesign unchanged.**
- `private/record.js` — `renderAthleteRecord`, `directionWords`, `formatDate`,
  shared by the coach and athlete doors.
- The whole schema, RLS model and every derived view.
- Pure renderers worth lifting: `structureOf` (typed components → prose, the thing
  that replaces two stored strings), `doseOf`, `railSvg`, `paceRunSvg`,
  `blockShapeHtml`, `titleAlreadySays`, `qualifyingWords`.

**Free to replace (information architecture, not capability):** `deskHtml`,
`heroHtml`, `rosterHtml`, `athleteMenuHtml`, `workbenchHtml`, tab navigation, the
eleven `<dialog>` elements and their bindings, `attentionKinds` labelling,
`paintRails`/`paintSquad`/`revealShownWeek`.

**One live constraint on any redesign:** `_headers` sets `style-src 'self'`, so
inline `style=` attributes are blocked. Geometry must travel as SVG attributes or
through CSSOM. This has already bitten the block-shape view once.

---

## 13. Missing primitives — the smallest honest set

Every other item in the brief maps onto something that exists.

1. **A standing athlete fact.** Athlete-scoped, typed, provenance-carrying,
   superseded rather than overwritten. Model it on `mark_judgments` (supersedes
   self-FK, required reason) + `session_exceptions.source` (athlete_reported /
   coach_observed / system_detected → ATHLETE / FORM / PATTERN) +
   `mark_confidence_proposals.evidence_completion_ids` (the evidence it came from).
   Fixes §8, and gives `movement_reads` somewhere to stop being a special case.

2. **An athlete portrait that leaves the phone.** A bucket, a pointer, and a consent
   decision. Fixes §10. Genuinely new only because storage is device-local today.

3. **A cohort.** A named athlete group and its memberships, on the coaching axis —
   distinct from `field_groups`, which is Field relay membership. Needed only if
   Labs groups athletes by something other than "this coach's roster"; if not,
   **this is not a missing primitive** and `loadCoachRoster` already covers it.

4. **A normalised comparison axis.** Not necessarily a table — a view exposing
   `(athlete_id, weeks_to_race, filed_at, distance_mi, pace_seconds, rpe, rpe_source)`
   keyed on **week start**. Fixes §7 without new storage.

Explicitly **not** missing, despite new words in the brief: whole-block
visualisation, WATCH items, verdicts, evidence inspection, runway, judgments,
confidence, Sunday briefs, evidence-due state, arbitrary block lengths, weeks-to-race
alignment, progressions, per-rep evidence.

---

## 14. Four buckets

### ALREADY EXISTS — supports Labs essentially as-is

- The whole block as one queryable object (`loadAthleteRecord`, `sessionsByWeek`)
- Block-shape rendering across all weeks (`blockShapeHtml`)
- Arbitrary block length; week zero; per-block week-opening day
- Runway and the rung ladder (`runwayHtml`, `campaign_ladder`)
- Versioned prescription with typed components and typed progressions
- Per-rep evidence with stored pace, exact durations, audited corrections
- Mechanical verdicts (`session_verdicts`) and the derived coach queue (`coach_attention`)
- Judgments and confidence, both able to name their evidence
- Evidence attachments with a private bucket and signed URLs
- Cross-athlete querying (RLS already permits it; only the Console declines to use it)
- Auth, memberships, invites, RLS, the whole `private/` service layer
- Sunday-brief inputs (`coach_attention` + `nextSessions` + `missing_direction`)

### EXISTS BUT NEEDS EXTENSION — right primitive, insufficient capability

- `coach_private_notes` → needs kind, source, state, supersession to become a
  standing fact (or is superseded by primitive 1)
- `movement_reads` → hardcoded five-marker enum; overwrites rather than supersedes
- `athlete_marks.claim*` → the only interpretation with **no** history
- `athletes.goal_seconds` / `training_target_seconds` / `goal_pace_seconds` →
  race-athlete columns on the athlete row, with a half-marathon constant baked in
- `distance_unit` (mi | km | m) → never normalised; blocks cross-athlete charts
- `pace_low`/`pace_high` text alongside `*_seconds` integers → two representations
- `session_pieces.kind` and `effort_defaults.session_family` → running-only enums
- `support_items.dose text` → the only strength vocabulary; no typed dose for FORGE
- `record_publications` and every editorial table → single-athlete by construction

### DOES NOT EXIST — genuine architectural gap

- A standing, typed, provenance-carrying athlete fact (§8)
- Server-side athlete portraits (§10)
- Any calendar or event primitive (§9)
- Key-session designation (§9) — language only, never a column
- A typed non-running dose vocabulary (sets, reps, load) (§2)
- A cohort that is not "this coach's roster" (§7) — *only if Labs needs one*

### DESIGN-ONLY CHANGE — the data is already there

- Whole-block visualisation
- Weeks-to-race alignment across athletes (compute from **week start**)
- Longitudinal pace charts (`session_pieces.pace_seconds` is already sec/mi)
- The Sunday athlete brief
- Post-session evidence review as a named state
- Any reordering, renaming or reframing of the coach queue
- Deleting `planned_session_versions.details` and `.shape` in favour of
  `structureOf` over typed components (already scheduled as item 73)

---

## Conflicts with the proposed direction

1. **The one that matters.** Anything in Labs that shows the athlete "their plan"
   will be showing the *phone's* plan until `FORMPlanFeed` is rendered. Until that
   seam is closed, a Labs surface asserting one source of truth would be asserting
   something the app does not do. This is not a reason to change the brief — it is a
   reason to state it as a dependency.

2. **Portraits before consent.** `record_publications` is the only place consent is
   modelled, and only for a published excerpt. A portrait-driven surface shared with
   a group is the same question and currently has no answer.

3. **A cohort table risks a second grouping axis.** `field_groups` already exists on
   a different axis. Two group concepts will be confused within a month; decide which
   one owns "who is in this cohort" before either is built.

4. **`athlete_marks.claim*` is the one interpretation that overwrites.** If Labs
   surfaces claims prominently, it will be showing the only coaching judgment in the
   system with no history behind it.

5. **A standing athlete fact must not become a second evidence store.** It should
   *point at* completions, never restate their numbers — the same discipline
   `mark_confidence_proposals.evidence_completion_ids` already keeps.

