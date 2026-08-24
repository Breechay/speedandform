# ATHLETE RECORD — SLICE 1 ARCHITECTURE

Status: accepted foundation; implementation in progress
Scope: authentication, Natalie’s private record, coach desk, share excerpt  
Visual and behavioral authority: `docs/design/GRAPHITE_ATHLETE_SYSTEM_REFERENCE.html`<br>
Content and information reference: `docs/mocks/natalie-record.html`

This package answers §11 of `ATHLETE_RECORD_BRIEF.md` for all of Slice 1. On Aug 24, 2026, a clean project named `FORM Athlete System` (`pbgsjjegycacodiltbhn`, North Virginia) was created and linked. Its migration catalog is empty. The paused `Training Phases` project remains an untouched archive, so Slice 1 can implement the canonical model below without transforming or duplicating the legacy athlete schema.

## 1. Current architecture and security findings

### What is usable

- The public site is static HTML on Netlify. New private routes can follow the same zero-build model with shared ES modules.
- Supabase remains the identity and persistence boundary, now in a clean project dedicated to the private coaching product.
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

### Live-catalog gate — complete

The linked project reports zero migrations and contains no legacy application tables. The gate is therefore satisfied without importing private rows. Before every production push, the migration dry run and RLS tests remain mandatory.

The archived project was not unpaused or modified. Its previous risks remain useful constraints for the new design:

1. never expose invitation or private-record tables to `anon`;
2. never use a slug as a domain foreign key;
3. never maintain two writable athlete/profile/session concepts;
4. never mix public and private coaching rows in one table;
5. never treat a `service_role` policy as a security boundary.

## 2. Canonical data model

### Identity rule

`auth.users.id` is an account identifier, not the athlete domain identifier.

Keep one canonical `athletes` row with a stable UUID primary key. Add or normalize a nullable, unique `auth_user_id` foreign key for sign-in. This permits a coach to author a record before the athlete accepts an invite and avoids changing every domain foreign key if an account is recovered or relinked.

Migrate the useful fields from `athlete_profiles` into `athletes`; then replace `athlete_profiles` with a compatibility view only if a deployed consumer still requires the name. Do not leave two writable athlete profiles.

`athlete_memberships` references `athletes.id` only. Slugs are presentation identifiers and never foreign keys.

### Canonical tables implemented in the clean project

| Table | Slice 1 role | Contract |
|---|---|---|
| `profiles` | Auth identity extension | One row per `auth.users` identity; not a source of authorization. |
| `athletes` | Canonical athlete record | Stable UUID PK; account links live on memberships; private and public routing remain separate. |
| `athlete_memberships` | Assignment and authorization edge | UUID athlete and user keys; explicit `athlete` or `coach` role; unique active relationship. |
| `access_invites` | Membership bootstrap | Confirmed email plus role; unreadable to anonymous clients; claimed only through the constrained RPC. |
| `training_blocks` | Coach-authored training block | Owns source, goal, event, week count, and lifecycle. |
| `training_weeks` | Week within a block | Stable week identity and explicit state. |
| `planned_sessions` | Planned occurrence | Stable UUID and ordering; status never stands in for an actual. |
| `planned_session_versions` | Immutable prescription history | Original and replacement wording remain auditable. |
| `session_completions` | Athlete-filed actual | Optional planned-session link; preserves partial, changed, and skipped semantics. |
| `completion_revisions` | Immutable athlete correction history | Captures the previous and replacement actual when an athlete updates a completion. |

### New tables: only concepts the current model does not own

These concept tables were created in the foundation migration after the empty-catalog gate passed.

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

- one `athletes` row that can exist before she claims access;
- one athlete `athlete_memberships` row created when her confirmed email signs in, plus Brice’s coach membership;
- one `training_blocks` row with `source = coach_authored`, eight weeks, Miami Half / Finish;
- Week 0 baseline stored as a versioned baseline record: running history, longest run, frequency, constraints, initial movement read, strength schedule;
- three `planned_sessions` and immutable prescription versions for the current week;
- zero or more Natalie-owned `session_completions`, each retaining status, actual distance/time, feeling, knee during/after, next-day recovery, and optional Strava URL or uploaded asset reference;
- one active primary `athlete_marks` row with checkpoints and four authored progression conditions;
- current movement markers, support prescription, Direction, Read, and Decision rows;
- chronological Record assembled from immutable publication/version events, not overwritten plan text;
- one `coach_admin_status` row (`Run Development · 8 weeks · Week 1 · Paid`).

The page query returns an athlete-safe aggregate assembled by an RPC or explicit safe views. It never selects a broad table and deletes private keys in JavaScript.

## 3. RLS model

### Authorization primitives

Create small `security definer` helpers owned by a non-login role, with `search_path` fixed to trusted schemas and execute grants limited to authenticated users:

- `is_athlete_member(athlete_id)` — active athlete membership for `auth.uid()`.
- `is_coach_member(athlete_id)` — active coach membership for `auth.uid()`.
- `can_read_athlete(athlete_id)` — either of the two membership checks above.

Do not trust a role string in client-editable user metadata. Authorization comes only from the server-owned membership edge.

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
3. The callback invokes `claim_access()` after authentication.
4. The RPC reads the email and `email_confirmed_at` directly from the server-owned `auth.users` row, compares that verified email with an active, unexpired `access_invites` row, creates exactly one membership, and marks the invitation accepted. Auth-row creation alone never consumes an invitation.
5. Reclaiming with the same account is idempotent. A different account cannot claim the row, and the public client never reads the invitation catalog.

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
| Weekly prescription | Coach | `training_blocks` + versioned `planned_sessions` |
| Session Direction | Coach | `directions.*` |
| Natalie session status/actual distance/time | Natalie | `session_completions.status`, `actual_distance`, `duration_seconds` |
| Natalie feeling and knee response | Natalie | athlete-owned actual fields on `session_completions` |
| Natalie next-day recovery | Natalie | `session_completions.recovered_next_day` + athlete note |
| Optional Strava proof | Natalie | `session_completions.strava_url` or private asset reference |
| FORM athletes’ actuals | FORM after Gate A | existing completion model; no Slice 1 website write path |
| Corrections to actuals | Athlete | immutable `completion_revisions` tied to `session_completions.id` |
| Coach annotation on actual | Coach | `coach_private_notes` or published Read, never actual columns |
| Athlete note | Athlete | completion-owned athlete note field/table |
| Technical Read | Coach | `reads`, `read_completions`, `movement_reads` |
| Current coaching question | Coach | `athlete_marks.current_question` |
| Race goal proposal | Athlete | proposal event/field, pending |
| Race goal confirmation | Coach | confirmed fields on `training_blocks` with audit event |
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
private/
  auth-session.js
  supabase-client.js
  route-guard.js
  record-format.js
  graphite.css
athlete/
  index.html
  athlete.js
    AthleteChrome
    NowBand
    MarkBand
    ReadBand
    SupportBand
    RecordBand
    SessionFilingSheet
coach/
  index.html
  coach.js
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

## 6. Graphite composition and motion contract

`docs/design/GRAPHITE_ATHLETE_SYSTEM_REFERENCE.html` is binding for the private system’s
visual and behavioral language. The earlier cream coach-desk composition is retired.

- desktop Coach Desk is roster-led: the active athlete and explicit state are visibly selected;
- the current Decision is the dominant surface, followed by its evidence and immediate action;
- This Week and Recent Coaching are supporting surfaces, not equal-priority dashboard cards;
- lime marks only the required action or acknowledgement; coral marks attention; green marks established/complete;
- the first viewport answers who needs Brice, what they need, what evidence exists, and what Brice can do now;
- labels use plain states rather than coded or institutional language;
- Natalie’s record keeps its five-band content and calmer pacing, but the cream, serif-heavy,
  archival styling in `docs/mocks/natalie-record.html` is not implementation authority;
- mobile leads with the selected athlete, current Decision, and primary action. Other athletes
  and supporting information follow rather than shrinking the desktop rail and density.

Motion communicates one state change:

- publishing fades the changed line down/up and resolves the new athlete-safe wording over roughly 600 ms using `--ease`;
- the queue may reorder only after the server confirms publication, using a short positional transition/crossfade;
- switching athletes uses a restrained 600 ms content resolve, not a page entrance spectacle;
- no parallax, count-up, confetti, looping decoration, or delayed access to controls;
- `prefers-reduced-motion` removes positional and opacity choreography.

Claude Browser (or another visual critic) is useful only after a deploy preview carries this real state and motion. Its job is to identify hierarchy, contrast, explicit state, and motion defects against Graphite—not to invent a new visual system.

## 7. Phased Slice 1 plan

### Phase 0 — accept the foundation

- Review the Graphite system reference, Natalie content reference, and this package.
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
