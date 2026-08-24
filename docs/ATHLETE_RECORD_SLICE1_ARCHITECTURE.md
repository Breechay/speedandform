# ATHLETE RECORD — SLICE 1 ARCHITECTURE

Status: pre-code decision package  
Scope: authentication, Natalie’s private record, coach desk, share excerpt  
Binding visual references: `docs/mocks/natalie-record.html`, `docs/mocks/coach-desk.html`

This package answers §11 of `ATHLETE_RECORD_BRIEF.md` for all of Slice 1. No production schema or application code should be written until the live Supabase catalog is compared with the checked-in SQL and the decisions below are accepted.

## 1. Current architecture and security findings

### What is usable

- The public site is static HTML on Netlify. New private routes can follow the same zero-build model with shared ES modules.
- Supabase is already the identity and persistence boundary for FORGE.
- `coach_profiles`, `athletes`, `coach_athletes`, `program_assignments`, `session_instances`, and `running_sessions` express most of the nouns Slice 1 needs.
- Existing Edge Functions correctly establish the pattern that a user JWT is verified before a write.
- The public `athletes/*.html` records can remain unchanged and isolated from the private record.

### What must be corrected before extension

The checked-in SQL is not a trustworthy description of the live database. It contains mutually incompatible generations of the athlete model:

- `supabase-schema.sql` defines `athletes.id` as a UUID referencing `auth.users(id)`.
- `supabase-athlete-invite.sql` later treats `athletes` as a slug-keyed public record, adds a second `auth_user_id`, and creates `athlete_profiles` as another identity-bearing athlete table.
- `coach_athletes.athlete_id` is treated as both a UUID foreign key and a slug/text value across those files.
- `session_instances` references the first athlete shape while later roster SQL compares its athlete key with slugs.
- The invite table grants anonymous `select` with `using (true)`. A client-side code filter does not prevent enumeration of the table.
- Several policies describe a `service_role` insert. The service role bypasses RLS; such policies neither secure nor enable it and create false confidence.
- Public field policies and private coaching policies currently share adjacent athlete/session concepts. A public projection must never be able to grow into private fields accidentally.
- The existing Apple callback is FORGE-popup behavior, not a durable website authorization-code callback.

The FORM audit still supports Gate A in the brief. FORM’s filed sessions are local-first in `UserDefaults`; website-to-app delivery must not be represented as working in Slice 1. The current FORM worktree also contains unrelated uncommitted work, so this website package does not touch it.

### Mandatory live-catalog gate

Before migration 001 is authored, export and review:

1. table columns, primary keys, foreign keys, indexes, and views for every table named in this document;
2. all RLS enablement and policies;
3. functions, triggers, and grants, especially invite acceptance and public-field access;
4. row counts and null/key-shape checks, without exporting private row contents;
5. all deployed Edge Functions and their environment dependencies.

The migration plan is then written as a transformation from the live catalog—not as a replay of the repository SQL.

## 2. Canonical data model

### Identity rule

`auth.users.id` is an account identifier, not the athlete domain identifier.

Keep one canonical `athletes` row with a stable UUID primary key. Add or normalize a nullable, unique `auth_user_id` foreign key for sign-in. This permits a coach to author a record before the athlete accepts an invite and avoids changing every domain foreign key if an account is recovered or relinked.

Migrate the useful fields from `athlete_profiles` into `athletes`; then replace `athlete_profiles` with a compatibility view only if a deployed consumer still requires the name. Do not leave two writable athlete profiles.

`coach_athletes` references `athletes.id` only. Slugs are presentation identifiers and never foreign keys.

### Existing tables to normalize, not duplicate

| Existing table | Slice 1 role | Required normalization |
|---|---|---|
| `coach_profiles` | Coach identity extension | Add explicit active/status metadata only if live catalog lacks it. |
| `athletes` | Canonical athlete and membership row | Stable UUID PK; nullable unique `auth_user_id`; private/public routing slugs separated; no duplicate identity table. |
| `coach_athletes` | Assignment and authorization edge | UUID `athlete_id`; unique coach/athlete; active dates/status. |
| `program_assignments` | Training block | Extend with `source`, `goal_label`, `target_event`, `week_count`, and lifecycle; do not add `training_blocks`. |
| `session_instances` | Planned session occurrence | Stable UUID `planned_session_id`; author-owned prescription and version metadata; status does not stand in for an actual. |
| `running_sessions` | Athlete-filed completion | Stable UUID `completion_id`; nullable `planned_session_id`; athlete-owned actuals; preserve partial/changed/skipped semantics. |
| `coach_judgments` | Legacy FORGE judgment | Migrate compatible history into Decisions, or preserve as a compatibility view; do not run two writable judgment systems. |
| `coach_notes` | Legacy notes | Classify and migrate to athlete-visible Read text or `coach_private_notes`; never expose mixed-visibility rows. |
| `athlete_invites` | Membership bootstrap | Make table unreadable to anon; accept through a constrained RPC. |

### New tables: only concepts the current model does not own

Names are provisional until the live-catalog gate confirms they are unused.

#### `directions`

- `id uuid primary key`
- `athlete_id uuid not null`
- `coach_id uuid not null`
- `planned_session_id uuid not null`
- `protected_variable text not null`
- `movable_variable text`
- `stop_or_change_if text`
- `priority_targets jsonb not null` — ordered, validated array of 1–4 short targets
- `execution_context jsonb not null`
- `athlete_text text not null`
- `delivery_state text not null` — `draft | published | delivered_externally | superseded`
- `delivered_wording text` — exact wording sent outside the product
- `published_at`, `created_at`, `updated_at`, `superseded_by`

#### `reads`

- `id uuid primary key`
- `athlete_id uuid not null`
- `coach_id uuid not null`
- `athlete_text text not null`
- `question_answered text not null`
- `delivery_state`, `delivered_wording`, timestamps, `superseded_by`

#### `read_completions`

- `read_id uuid not null`
- `completion_id uuid not null`
- composite primary key

One Read may interpret several completions without copying its text.

#### `decisions`

- `id uuid primary key`
- `athlete_id uuid not null`
- `coach_id uuid not null`
- optional `assignment_id`, `planned_session_id`
- `decision_type text not null`
- `athlete_text text not null`
- `rationale text not null`
- `effective_on date not null`
- `delivery_state`, `delivered_wording`, timestamps, `superseded_by`

If a Decision relies on several completions, use `decision_completions(decision_id, completion_id)` rather than JSON IDs or copied text.

#### `coach_private_notes`

- `id uuid primary key`
- `coach_id uuid not null`
- `athlete_id uuid not null`
- optional `planned_session_id`, `completion_id`, `read_id`, `decision_id`
- `body text not null`
- timestamps

There is no athlete policy and no athlete-safe view containing this table.

#### `athlete_marks`

- `id uuid primary key`
- `athlete_id uuid not null`
- `assignment_id uuid not null`
- `mark_type text not null`
- `label text not null`
- `current_value numeric`, `target_value numeric`, `unit text`
- `current_question text not null`
- `coach_id uuid not null`, timestamps
- unique active primary mark per assignment, enforced with a partial index

`mark_signals` holds zero to two supporting signals. `mark_checkpoints` holds coach-authored proposals with position, label, and state. Neither awards points or computes a universal score.

#### `movement_reads`

Five rows per read set, not five fixed columns:

- `athlete_id`, `coach_id`, optional `read_id`
- `marker` constrained to the five approved marker types
- `state` constrained to `present | available | fades | developing`
- `cue text`
- `position smallint`

#### `support_prescriptions`

A coach-owned prescription header plus `support_items` grouped by purpose. Items own `movement`, `reason`, `cue`, `dose`, position, and a boolean/status indicating that the prescription is shared with the strength coach. Slice 1 does not create a strength-coach login or share link.

#### `record_publications`

- `id`, `athlete_id`, `coach_id`
- `consent_recorded_at`, `consent_note`
- `excerpt jsonb not null` validated to an allowlisted public schema
- `published_at`, `revoked_at`, immutable revision number

The public share card reads only this frozen excerpt. It never projects the live private record.

#### `coach_admin_status`

Coach-only athlete relationship metadata including block label, weeks, payment status, and optional private payment reference. Dollar amounts never live on an athlete-readable row.

### Natalie content model

Natalie is represented by the same normalized model, not a custom page-shaped JSON blob:

- one `athletes` row linked to her Supabase account;
- one `coach_athletes` assignment;
- one `program_assignments` row with `source = coach_authored`, eight weeks, Miami Half / Finish;
- Week 0 baseline stored as a versioned baseline record: running history, longest run, frequency, constraints, initial movement read, strength schedule;
- three `session_instances` for the current week;
- zero or more Natalie-owned `running_sessions`, each retaining status, actual distance/time, feeling, knee during/after, next-day recovery, and optional Strava URL or uploaded asset reference;
- one active primary `athlete_marks` row with checkpoints and four authored progression conditions;
- current movement markers, support prescription, Direction, Read, and Decision rows;
- chronological Record assembled from immutable publication/version events, not overwritten plan text;
- one `coach_admin_status` row (`Run Development · 8 weeks · Week 1 · Paid`).

The page query returns an athlete-safe aggregate assembled by an RPC or explicit safe views. It never selects a broad table and deletes private keys in JavaScript.

## 3. RLS model

### Authorization primitives

Create small `security definer` helpers owned by a non-login role, with `search_path` fixed to trusted schemas and execute grants limited to authenticated users:

- `is_self_athlete(athlete_id)` — canonical athlete’s `auth_user_id = auth.uid()`.
- `is_assigned_coach(athlete_id)` — active `coach_athletes` edge for `auth.uid()`.

Do not trust a role string in client-editable user metadata. Coach status comes from `coach_profiles` plus the assignment edge.

### Policy matrix

| Data | Athlete | Assigned coach | Anon |
|---|---|---|---|
| Athlete identity/account-safe fields | Read/update allowlisted self fields | Read assigned | None |
| Assignment and plan | Read own published rows | CRUD assigned | None |
| Planned sessions | Read own published rows | CRUD assigned | None |
| Completion/session actuals | Insert/read/update own; immutable audit columns protected by trigger | Read and annotate, never silently rewrite | None |
| Direction / Read / Decision | Read own published athlete-safe rows | CRUD assigned | None |
| Movement Read / support / mark | Read own published rows | CRUD assigned | None |
| Coach private notes / admin status | None | CRUD assigned | None |
| Invites | Accept only through RPC | Manage own | Execute narrow accept/start RPC only |
| Record publications | None unless separately surfaced to self | Create/revoke with consent | Read only published, unrevoked frozen excerpt |

Every table has RLS enabled in the same migration that creates or changes it. Default is no policy. Update policies include both `using` and `with check`. Referential membership is rechecked server-side; client-supplied `coach_id` and `athlete_id` do not grant access.

### Invite and auth flow

1. `/athlete/` offers Apple and email magic link.
2. `/auth/record-callback/` exchanges the authorization code for a Supabase session and validates the intended local return path.
3. An authenticated athlete accepts a single-use invite through `accept_athlete_invite(code)`.
4. The RPC hashes/normalizes the code, locks the invite, checks expiry and unused state, links exactly one canonical athlete to `auth.uid()`, creates the coach assignment if required, marks the invite used, and returns only the destination.
5. Reaccepting with the same account is idempotent; accepting an athlete already linked to a different account fails without leaking that account.

Apple account recovery, magic-link reauthentication, sign-out, and expired-link states are part of Slice 1—not follow-up polish.

### Audit and immutability

- Plan prescription changes create a version/event retaining original, replacement, reason, author, and timestamp.
- Published Direction/Read/Decision wording is superseded, not overwritten.
- Athlete actual corrections retain previous values and correction time. A coach annotation is separate.
- Public excerpts are frozen revisions.
- Storage buckets for an optional screenshot are private; signed URLs are short-lived and authorization follows the owning completion.

## 4. Field ownership mapped to storage

| Field | Owner | Canonical storage |
|---|---|---|
| Weekly prescription | Coach | `program_assignments` + versioned `session_instances` |
| Session Direction | Coach | `directions.*` |
| Natalie session status/actual distance/time | Natalie | `running_sessions.status`, `distance`, `duration_seconds` |
| Natalie feeling and knee response | Natalie | athlete-owned actual fields on `running_sessions` |
| Natalie next-day recovery | Natalie | `running_sessions.recovered_next_day` + athlete note |
| Optional Strava proof | Natalie | `running_sessions.strava_url` or private asset reference |
| FORM athletes’ actuals | FORM after Gate A | existing completion model; no Slice 1 website write path |
| Corrections to actuals | Athlete | versioned correction/event tied to `running_sessions.id` |
| Coach annotation on actual | Coach | `coach_private_notes` or published Read, never actual columns |
| Athlete note | Athlete | completion-owned athlete note field/table |
| Technical Read | Coach | `reads`, `read_completions`, `movement_reads` |
| Current coaching question | Coach | `athlete_marks.current_question` |
| Race goal proposal | Athlete | proposal event/field, pending |
| Race goal confirmation | Coach | confirmed fields on `program_assignments` with audit event |
| Support prescription | Coach | `support_prescriptions`, `support_items` |
| Decision | Coach | `decisions`, optional join references |
| Private note | Coach | `coach_private_notes` only |
| Block/payment status | Coach-admin | `coach_admin_status`; athlete projection exposes label/status, never amount |
| Public excerpt | Coach after consent | immutable `record_publications.excerpt` |

## 5. Routes and component tree

### Routes

- `/athlete/` — authentication gateway or the signed-in athlete’s single record surface.
- `/auth/record-callback/` — Supabase authorization-code callback.
- `/athlete/invite/` — post-auth invite acceptance and account-linking states.
- `/coach/` — authenticated decision queue and selected athlete record with coach margin.
- `/record/:publication_slug` — deliberately public, frozen share excerpt only.

Existing `/athletes/*.html`, FORGE routes, and the homepage remain unchanged. Redirects are added explicitly so `/coach/` never collides with the legacy `coach.html` during cutover.

### Static component tree

```text
shared/
  auth-session.js
  supabase-client.js
  route-guard.js
  record-format.js
  record-tokens.css
athlete/
  index.html
  athlete-record.js
    AthleteChrome
    NowBand
    MarkBand
    ReadBand
    SupportBand
    RecordBand
    SessionFilingSheet
coach/
  index.html
  coach-desk.js
    DecisionQueue
    AthleteRecordProjection   ← same athlete-safe renderer/data shape
    CoachMargin
      DirectionEditor
      ReadEditor
      DecisionEditor
      PrivateNoteEditor
record/
  index.html
  public-excerpt.js           ← frozen allowlisted payload only
auth/record-callback/
  index.html
```

The implementation stays framework-free for Slice 1. Components are small ES-module renderers/custom elements with semantic HTML. The athlete projection is shared; the coach desk does not maintain a second handcrafted version of Natalie’s record.

## 6. Coach desk composition and motion contract

`docs/mocks/coach-desk.html` is binding for hierarchy and proportion:

- a horizontal four-athlete decision queue, ordered by what needs Brice;
- the selected athlete’s own record is the dominant surface;
- one attached coach margin contains the current question, need, Direction, Read, Decision, and a physically separate private note;
- no sidebar navigation, statistic cards, activity feed, mileage ranking, or universal score;
- on narrow screens the queue scrolls horizontally and the coach margin follows the athlete record.

Motion communicates one state change:

- publishing fades the changed line down/up and resolves the new athlete-safe wording over roughly 600 ms using `--ease`;
- the queue may reorder only after the server confirms publication, using a short positional transition/crossfade;
- switching athletes uses a restrained 600 ms content resolve, not a page entrance spectacle;
- no parallax, count-up, confetti, looping decoration, or delayed access to controls;
- `prefers-reduced-motion` removes positional and opacity choreography.

Claude Browser (or another visual critic) is useful only after a deploy preview carries this real state and motion. Its job is to identify hierarchy, rhythm, and motion defects against the binding mocks—not to invent a new desk composition.

## 7. Phased Slice 1 plan

### Phase 0 — accept the foundation

- Review the two binding mocks and this package.
- Run the live-catalog gate.
- Turn this proposed schema into a migration diff against reality.
- Write RLS tests before application writes exist.

Exit: canonical athlete/session identity is proven; no duplicate writable profile or session concepts remain.

### Phase 1 — identity and access

- Website Apple + magic-link auth, durable callback, sign-out, recovery, expiry states.
- Invite RPC and canonical athlete linking.
- Coach assignment authorization helpers and RLS policy tests.
- Private storage policy for optional athlete evidence.

Exit: Natalie can authenticate and see only her empty private record; Brice can see only assigned athletes; anon sees neither.

### Phase 2 — Natalie’s record and filing

- Seed real Week 0, assignment, current week, Mark, movement Read, and support prescription.
- Build the five-band responsive athlete surface from the Natalie mock.
- Add Natalie-owned completed/partial/changed/skipped filing and next-day response.
- Preserve prescription and correction history.

Exit: the record tells the truthful Week 0 → current story and survives direct API authorization tests.

### Phase 3 — coaching objects

- Direction, Read, and Decision authoring with athlete-safe publication states.
- One Read linked to one or more completions.
- Exact `delivered_externally` wording for pre–Gate A FORM athletes.
- Separate coach-private notes.

Exit: published wording appears in the athlete projection; private text is impossible to select as Natalie.

### Phase 4 — coach desk

- Decision queue with explicit unresolved/needs-Brice ordering.
- Shared athlete projection plus coach margin.
- Server-confirmed publish motion and reduced-motion behavior.
- Four real athlete questions/marks; no fabricated performance data.

Exit: Brice can move from evidence to Direction/Read/Decision without entering a second product model.

### Phase 5 — frozen share excerpt and hardening

- Consent capture, allowlisted excerpt creation, immutable revisions, revoke path.
- Auth/RLS/storage adversarial tests and cross-athlete isolation tests.
- Mobile/desktop accessibility, keyboard, empty/error/offline states.
- Deploy preview motion and hierarchy critique; adjust within the binding composition.

Exit: Slice 1 is production-ready. FORM delivery and app↔site sync remain blocked behind Gate A.

## Decisions deliberately deferred

- The exact migration SQL, until the live catalog is audited.
- FORM identity, historical upload, app delivery, and acknowledgements, until Gate A.
- Payments UI, messaging, notifications, video analysis, and strength-coach sharing.
- Any schema convenience that would create a second athlete, profile, race, planned-session, or completion source of truth.
