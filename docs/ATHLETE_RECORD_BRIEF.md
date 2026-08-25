# THE ATHLETE RECORD — BUILD BRIEF
speedandform.com · private coaching surface · Aug 2026

> **Visual authority update — Aug 24, 2026:** §9's original cream, serif-led direction
> is superseded by `docs/design/GRAPHITE_ATHLETE_SYSTEM_REFERENCE.html` for every
> private coaching surface. The product law, content model, ownership, security,
> Slice 1 scope, and all other sections remain authoritative.

---

## THE PRODUCT LAW

**The coach may need a desk. The athlete should only need one surface.**

For Natalie, that surface is the website. For Marcus, Jose and Hope, it is FORM.
Both read the same records. Neither copies data to the other.

**Every field has exactly one owner.** Sync is not a merge problem — each side writes
only what it owns. There is no conflict resolution to build, ever.

---

## 1. AUDIT FINDINGS — READ BEFORE PROPOSING ANYTHING

### Site (`Breechay/speedandform`, `bd2bee2`)

- Static HTML, Netlify, no framework, no build step for pages.
- Supabase project `zlhxvzgublgtuxplcjjl` already in use.
- `athletes/*.html` read Supabase **with the browser anon key, unauthenticated**.
  Correct for the public records that live there today. **Not extendable to private data.**
- `auth/apple/callback.html` exists but only closes a popup and returns to FORGE.
- Edge functions exist: `sync-accountability`, `sync-strength-session` — both FORGE,
  both correctly validate a user JWT before writing.
- Design tokens live in `home.css` / `notes.css`. Athlete pages use an older palette
  (Cormorant Garamond + Jost). The current site is Fraunces + JetBrains Mono on `--ink`.

### App (`Breechay/FORM-iOS`, `70884a6`) — THE DECISIVE FINDING

- **FORM has no Sign in with Apple.** `AuthenticationServices` appears only in `Strava/Strava.swift`.
- **Filed sessions are on-device only.** `Ledger/`, `Today/`, `Plan/` persist to `UserDefaults`.
  There is no server-side record of a filed run.
- Supabase is wired for **FORGE only** (`Forge/ForgeSupabaseBridge.swift`), with the access
  token written to Keychain from a `form://forge-auth` deep link after a web invite.
- The Field syncs through `https://form-strava-relay.vercel.app` keyed by **groupId**,
  not by an authenticated athlete identity.

**Consequence:** "my note surfaces on their filed run in FORM" cannot be built from the
website. It is blocked on a FORM-side project (Gate A). Nothing about Natalie is blocked.

> **Re-audited Aug 25, 2026 against `cursor/the-plan-binding-93e5` (`4db85cae`).**
> Two findings above have moved, and one materially lowers the cost of Gate A.
>
> - `AuthenticationServices` now also appears in `FORMApp.swift`, but only to revoke a
>   stored Apple credential on account deletion. There is still no Sign in with Apple,
>   and `form_apple_user_id` is a device-local `@AppStorage` value, not a session.
>   The conclusion holds; the evidence for it has changed.
> - Filing is still device-local (`UserDefaults` plus iCloud KVS). Unchanged.
> - **`FORM/Forge/ForgeSupabaseBridge.swift` is 298 lines and already implements the
>   whole A1/A3 mechanism:** Keychain token storage, a `form://forge-auth?access_token=`
>   deep link that carries a session from web to app after an invite, and offline
>   enqueue/flush queues. Gate A does not need Sign in with Apple in FORM. The athlete
>   signs in on the website — which now works — and the app receives the token by deep
>   link, exactly as FORGE already does in production.
> - The Field already posts real training to a server: `POST /api/field/entries` with
>   `{ groupId, entry }`, carrying session name, type, splits and completion date. It is
>   **unauthenticated** (group id only, no JWT), it is what the athlete chose to publish
>   rather than what they filed, and its identity is `form_apple_user_id`. Show it if
>   useful, clearly labelled as published-to-The-Field. Never write it into
>   `session_completions`: it would be exactly the duplicate completion source §11 forbids.

---

## 2. GATE A — THE ONE APP PROJECT THAT UNBLOCKS EVERYTHING

A separate FORM-iOS workstream, not part of this build. Five stages, shipped in order.
Do not attempt identity, historical migration, network persistence and new UI in one pass.

**A0 · Headroom (prerequisite).** FORM's root view body is at the SwiftUI type-check budget.
Extract it into composed subviews as its own commit before any coach-record UI is added.

**A1 · Identity.** Sign in with Apple in FORM → Supabase session → Keychain (reuse the FORGE
bridge pattern). Existing athletes linked to the correct account. Website and iOS resolve to
the same Supabase user. Account recovery and reauthentication.

**A2 · Stable plan identity.** Stable program id, week id, planned-session occurrence id.
Ids must not derive from a display title, date string, or array position.

**A3 · Server-backed filing.** Local-first file stays immediate. Upload queue, idempotent
retry, offline support, server acknowledgement. No duplicate runs after reinstall or retry.
Existing local Ledger imported exactly once.

**A4 · Coach records in FORM.** Direction on a planned-session occurrence; Read on one or
more completions; Decision on athlete, week or session. Athlete-safe retrieval only.

**A5 · Delivery.** New-from-Brice state, plan-amended state, seen/acknowledged state, deep
link into Session Details.

### Id model — planned and completed are not the same id

`planned_session_id` · `completion_id` · `completion.planned_session_id`

One planned session may produce a normal completion, a partial, a stopped attempt, a later
replacement attempt, or nothing. Direction references the planned session. A Read usually
references the completion, and may reference both. A Decision may reference either or several.

### Before Gate A — no interim delivery product

Author the structured Direction / Read / Decision on the Coach Desk. It becomes their coaching
history immediately. Send the athlete-facing wording through WhatsApp as you do now; the record
stores `delivered_externally` **with the wording actually sent**, so the history is true rather
than approximate. When FORM becomes the delivery surface, the underlying object does not change.

Do not build a link-delivered mini-inbox for Marcus, Jose and Hope. It is a disposable surface
they have already said should live in the app.

## 3. TWO ATHLETE PRODUCTS

| | Natalie | Marcus · Jose · Hope |
|---|---|---|
| Home surface | Website | FORM |
| Plan source | `coach_authored` | `form_program` |
| Goal | Finish Miami Half | Sub-1:30 half |
| Mark | Longest run → 13.1 | See §6 |
| Relationship | Private coaching, 8 weeks, paid | Founding Member |
| Website role | Her whole product | Optional archive |

Natalie is not the beginner tier of FORM. Her plan is authored directly. That judgment is
what she paid for. Do not route her through the FORM program generator.

---

## 4. THE THREE OBJECTS

Ship three. Not seven.

**DIRECTION** — before the run, attached to a planned session.
- what matters (the protected variable)
- what can move
- stop or change if
- priority order (1–4, when several targets exist)
- execution context (outdoor/treadmill/track · with Brice/independent · heat allowance)

**READ** — after the run, attached to one *or several* filed sessions.
- athlete-facing text
- coach-private text lives in a **separate coach-only table** (see §8), never as a column on the Read
- what this session was meant to learn / what it answered
- one row, many references. Never copy the text into each session.

**DECISION** — what changes, and why.
- e.g. `AUG 30 · HOLD AT 5 MILES — ran comfortably, left knee noticeable next morning.
  Three touches stay, repeat five before adding distance.`
- This is the case study. Over eight weeks the Decision Log is the proof that progression
  was chosen rather than preset.

Questions, scheduling and encouragement stay in WhatsApp for now. They are a relationship,
not a missing feature.

---

## 4b. THE DESK IS A QUEUE, NOT A SCREEN

Learned by shipping it wrong. The first Coach Desk stored its queue in `coach_tasks`
rows written once by the seed. Nothing created work when an athlete filed, so the desk
emptied after the first resolution and never refilled — while reporting "Nothing needed"
for an athlete who had a filed run nobody had answered and a session due with no Direction.

**Attention is derived, never stored.** `public.coach_attention` computes it from the
record on every read: an unsettled recovery, work filed and unanswered, a session due
without a Direction, a week left open, and coach-authored tasks that actually ask
something. A `security_invoker` view, so RLS still decides who sees whom, and no second
source of truth is created. A stored queue is always one event away from lying.

**The act follows the situation.** Filed work asks for a Read. A session with no
Direction asks for a Direction. A week left open asks for a Decision. The desk offers
that one act, not a standing row of buttons naming every object in the system. Naming
objects makes the coach translate their situation into the data model; the situation
should already know.

**Health outranks work.** A recovery that did not settle sorts above everything.

**One situation at a time.** The desk states who, what happened, the athlete's own words
as evidence, and the act. Anything else — the athlete's own page especially — is
reference and stays closed until asked for. Three documents at equal weight is why a
coach cannot tell what they are looking at.

---

## 5. NATALIE'S RECORD — FIVE BANDS, ONE COLUMN

Each band crops cleanly to a phone screenshot.

### NOW
Name · Miami Half · Finish · Block 01 · Week n of 8.
Three touches, each with one line of intent — authored, never generated from mileage.
Closes with **This week matters because:** one coach sentence.

### THE READ
Five markers. Four states: **Present · Available · Fades · Developing.**
Each carries Brice's cue in his words.

| Marker | Cue |
|---|---|
| Heel light | The shoe can kiss the floor; the heel stays off |
| Chest proud | Shoulders back without lifting the ribs |
| Wrist to hip | Let the arms move |
| Single-leg control | Own the knee over the foot |
| Running economy | Do not interfere with what already works |

Every athlete carries **KEEP** (qualities training must not disturb) above **DEVELOP**.
The record never opens with a list of deficiencies.

### SUPPORT
Grouped by purpose, not by muscle: *Own the single leg · Build the lower leg · Open the
upper frame.* Each movement carries reason, cue, dose, and a **shared with strength coach**
status. This is a prescription for her strength coach to implement, not a second program.

### THE MARK
Longest continuous distance, `3.0 of 13.1`. Checkpoints are proposals, not promises:
`3 → 5 → 6 → 7.5 → 9 → 10.5 → 13.1`. A repeat renders as a decision, never as a miss.

**What earns the next distance** — all four, not any one:
knee quiet during and after · normal movement by next day · single-leg control holds ·
easy effort still genuinely easy.

Week 8 default is **10 miles**. 13.1 together is an available week-8 decision, never a
countdown the page pressures her toward.

### THE RECORD
Chronological. Per week: planned · filed · her note · the Read · what changed · next decision.
Ends in a shareable recap card carrying only deliberately shareable fields.

**Week 0 is captured before anything else** — running history, longest run, current frequency,
constraints, initial movement read, existing strength schedule. Week 8 compares against a
real beginning.

**Natalie files her own sessions**, on her page: completed / partial / changed / skipped,
actual distance and time, how it felt, knee during, knee after, recovered by next day,
optional Strava screenshot or link. Without this, "planned · filed · her note" cannot work.

**Plan changes are never overwritten.** Keep original, actual, why, who, when.

---

## 6. THE MARK IS A TYPE, NOT A NUMBER

Each athlete: **one primary mark · up to two supporting signals · one current coaching question.**

| Athlete | Primary mark | Current question |
|---|---|---|
| Natalie | Longest continuous distance | Can five miles settle normally enough to progress without changing her movement? |
| Marcus | Goal-pace miles closed **outdoors**, conditions stamped | Is the 6:15 treadmill ability available when Miami changes the cost? |
| Hope | Race-pace miles established near 6:30 | Is the working pace controlled before the float is tightened? |
| Jose | Even repetitions held at target volume | Does quality survive the added load? |

For Marcus, `OUTDOOR` is not metadata — it is the purpose. A treadmill completion produces
the numbers without answering the question, and the record must show that.

Never a universal athlete score. Never streaks, badges or leaderboards.

---

## 7. OWNERSHIP

| Field | Owner |
|---|---|
| Weekly prescription | Coach |
| Session direction | Coach |
| Natalie's session actuals | Natalie, through her private website |
| FORM athletes' session actuals | FORM |
| Corrections to actuals | The athlete. Coach may annotate, never silently rewrite |
| Athlete note, pain report, how it felt | Athlete |
| Technical read, current question | Coach |
| Race goal | Athlete proposes, coach confirms |
| Support prescription | Coach |
| Decision | Coach |
| Payment / block status | Coach-admin |
| Public excerpt | Coach publishes only with athlete consent, frozen copy |

---

## 8. SECURITY — NON-NEGOTIABLE

- Authenticated sessions only. Apple + email magic link, one Supabase user per athlete.
- **An unlisted URL is not privacy.** No private row is readable by the anon key.
- RLS from the first migration: athlete reads own record; coach identity reads assigned athletes.
- **RLS gates rows, not columns.** Coach-private text and payment data live in coach-only tables
  (`coach_private_notes`, related by athlete / session / week / read / decision), or are exposed
  only through an athlete-safe projection. Never rely on the interface, an omitted JSON field,
  or row-level security to provide column-level privacy.
- Leave the existing public `athletes/*.html` alone. New private routes, new tables.
- Publishing to a public case study is an explicit workflow with athlete consent and a
  frozen excerpt that does not change when the private note is later edited.

---

## 9. VISUAL — GRAPHITE SYSTEM

`docs/design/GRAPHITE_ATHLETE_SYSTEM_REFERENCE.html` is the visual and behavioral authority
for the complete private coaching system. Layout density adapts to the job; the language does not.

- Field `#141718`; roster variation `#171A1C`; surface `#1D2123`; raised surface `#282D30`;
  edge `#3B4346`; text `#F1F2EF`; secondary `#A8B0B2`.
- Action lime `#D8FF68` is reserved for the current action or acknowledgement required.
  Attention coral `#FF8A70` marks something needing attention. Positive green `#76D3A4`
  marks established or complete.
- High-contrast sans typography throughout. Serif is limited to the FORM mark, if used.
- State is written plainly: Needs you · Waiting for run · Waiting for athlete · Ready to
  publish · Plan changed · On track · Nothing needed. Important state never relies on tint alone.
- Surfaces exist only to group an action or coherent object. No decorative outlines, nested
  depth, archival rulers, faint mono labels, oversized serif statements, or low-contrast cream.
- The first viewport answers: who needs Brice, what they need, what evidence exists, and what
  Brice can do now.
- Desktop may show roster, current decision, evidence, week, and recent coaching. Mobile shows
  selected athlete, current decision, and primary action first; supporting material follows.
- Natalie is calmer and more spacious, but inherits the same typography, contrast, state
  language, surfaces, and action logic.
- On desktop, the homepage split-screen questionnaire is the doorway into Graphite: the film
  stays public-facing while the intake uses Graphite typography, surfaces, states, and actions.
  On mobile, the public four-plate sequence remains intact and Graphite begins when intake opens.
- Motion communicates that the record advanced. It does not decorate.

---

## 10. SLICE 1 — WHAT TO BUILD

1. Auth: Sign in with Apple + email, Supabase, athlete membership, coach assignment, RLS.
2. Natalie's real record, five bands, real content — not placeholder dashboard data.
3. Her week authored by coach; her notes written by her; one Read; one Decision.
4. The Mark with coach-controlled checkpoints and the four-condition gate.
5. Coach Desk: roster of four, each showing current question + what needs Brice, ordered by
   what needs a decision — not by mileage. Opening an athlete shows *her page as she sees it*,
   plus a coach margin. One composition, not two.
6. Share card that excludes every private field by construction.

**Out of scope for slice 1:** app↔site sync, video analysis, third-party form-analysis
repackaging, strength-coach share links, notifications, pre-session confidence, exposure
counters, payments UI beyond a status line.

**Account band:** `Run Development · 8 weeks · Week 1 · Paid` for Natalie;
`Founding Member` for the other three. Dollar amount is coach-private.

---

## 10b. BUILD STATE — Aug 25, 2026

Live on speedandform.com. Branch `codex/private-athlete-system`, merged to `main`.

**Shipped.** Passwordless auth with RLS from the first migration (17 pgTAP checks);
Natalie's five-band record with filing and correction over immutable
`completion_revisions`; the Coach Desk on the derived queue; Direction, Read, Decision,
private notes; frozen consented share excerpts; Account with email change.

**Corrected in flight.** Direction was dropping `execution_context` entirely — surface is
the purpose for Marcus's mark (§6), not metadata. A Read hard-coded the most recent
completion instead of the sessions it was about (§4: one row, many references). Nothing
could write `delivered_externally`, so the three FORM athletes' history was recorded as
though published in-product rather than sent by hand (§2).

**Open, owner-dependent.**

1. Apple provider credentials. The doorway shows Apple only once the provider is enabled
   and falls back to email until then, so the record is never unreachable.
2. Custom SMTP. Supabase's free tier refuses email-template changes on its built-in
   provider and rate-limits sends to a handful per hour. `supabase/templates/magic_link.html`
   applies on the first `config push` afterwards. Verify the sender on a **subdomain** —
   speedandform.com receives through Cloudflare Email Routing, and a root SPF change
   breaks inbound mail.
3. Natalie's athlete invite. Every existing invite is a claimed coach invite.
4. **Marcus, Hope and Jose have a primary mark and a current question, and nothing else:
   zero checkpoints, zero gates, zero supporting signals.** §6 promises up to two
   supporting signals each. This is authored coaching judgment and must not be generated.
   Their zero planned sessions are correct, not missing — their plan source is
   `form_program` (§3) until Gate A.

---

## 11. WHAT TO RETURN BEFORE WRITING CODE

1. Current architecture + security findings against §1.
2. Proposed schema and RLS policies.
3. Field-ownership table mapped to columns.
4. Routes and component tree.
5. Natalie's content model.
6. Phased plan, slice 1 only.

Do not create duplicate profile, session, race or athlete tables because existing names are
inconvenient. Do not redesign the public homepage. Do not implement cross-app sync until
Gate A exists.
