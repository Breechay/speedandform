# FORM Plan Exchange: 100-athlete delivery contract

Date: October 25, 2026  
Status: Engineering standard. **Exchange upload, review, import, native distribution and notifications are not made live by this document.**

## The promise

An athlete can bring a plan, understand the resulting Week, and execute it without decoding a file or asking Brice to proofread the screen. A coached athlete receives their coach's actual published prescription. Imported personal plans must never masquerade as coach-written advice.

## Three separate lanes

1. **Coached plan.** Coach-owned prescriptions in the FORM Athlete System. A coached athlete may also choose or edit their own working plan. That choice is athlete-owned and does **not** imply Brice reviewed or endorsed the change. Coach suggestions are available without a mandatory proposal/approval queue. Never overwrite completed sessions.
2. **Personal import.** Athlete-owned draft, previewed and explicitly activated by its authenticated owner. Label provenance clearly. No FORM coaching claim or private coach notes.
3. **Exchange template.** Shared, reusable, optionally published with author permission. Copying a template creates a personal plan revision, never a live link that can rewrite another athlete's schedule later.

One athlete may have plans in multiple lanes but must have one unambiguous active Week source at a time. Switching is a dated, reversible assignment decision. Keep prior receipts and filings intact.

## Contract v1, constrained on purpose

`private/plan-import-standard.mjs` validates a schema-1 JSON document before any proposed persistence. The exchange document owns **no** `athlete_id`, user ID, membership, coach authority, completed run, attendance, authentication token, RLS policy, publication state, or assignment ID. Those come from the authenticated server and explicit selection, never the uploaded file.

Top-level fields: `schema_version: 1`, `name`, `unit_preference: mi|km`, and `sessions` (1 to 366 days). Each session has a calendar date, recognized type, short title, optional instructions, distance or duration, and optional explicit seconds-per-mile or seconds-per-kilometer pace bounds. A rest day has no distance, duration or pace. File size is capped at 256 KB, future and historical dates are preserved exactly, and the plan cannot span more than a year.

This handles straightforward easy, long, recovery, rest, race and cross-training entries, plus speed and threshold when `segments` are explicitly structured. A segment supplies `kind: warmup|work|recovery|strides|cooldown`, an `amount` with unit `mi|km|min`, optional repetition count, optional pace bounds, and optional work/strides recovery as `full` or an explicit duration in minutes. Repeated work must prescribe a recovery value, including `full` when no exact duration is intended. Speed and threshold require at least one work segment; prose never turns into invented intervals. Multi-session days and more advanced nested sets require a later schema version. These are clear errors, not silent omissions.

The validator is only a pure library. **It is not an authentication check, a server RPC, or a training-safety judgment.** It must be called again in the trusted receiving service even if the client already validated its preview.

## Publish transaction, once a receiver is built

1. Authenticate the real user, verify account and athlete membership in RLS. Resolve the athlete from the token and authorized relationship, not from JSON or email/name matching.
2. Parse, validate, scan payload, and store the upload as a *private draft* with its file hash, schema version, import attempt ID, source label, authored timestamp and validation findings. Idempotency key = `(authenticated owner, client import UUID)`; repeated retries return the original draft.
3. Render preview with actual units and exact dates, showing session count, start/end, conflicts, missing prescriptions, any rejected rows, and which active Week would be replaced. Nothing is discarded without explicit indication.
4. On explicit athlete confirmation, perform one atomic, versioned activation under a lock for that athlete. A coach approval step is **not** required merely because the athlete is coached. Detect concurrent edits; reject stale previews. Record previous active assignment for rollback and preserve completed work, filed receipts and original attribution. Never quietly relabel an athlete import as a coach-authored revision.
5. Read back the athlete's resolved Week under their own authorized session, not merely as service role. Compare day, title, intensity, volume, units, structured target, and provenance. Mark the published revision only after verification.
6. Queue at most one athlete notification for an actual active Week change. Notify by revision ID with idempotent delivery, opt-in policy and quiet hours. Never describe a local draft as live.

If any step fails, keep the previous published Week. A valid JSON file is not sufficient evidence of a safe or authorized plan.

## 100-athlete operational acceptance

- **Roster:** The Coach Console is for people Brice actually coaches or explicitly monitors. Self-service accounts never automatically join his coaching roster. Active, paused, and archived coaching states are explicit; no hidden preference makes an athlete appear inactive. Search, pagination, status and assignment filters work on server-backed queries. No new client should need 100 full plan payloads to show a roster.
- **Onboarding:** A self-service member can establish verified login, preferred name, email, units, optional portrait and optional Strava connection without receiving a coaching relationship. Each permission is explicit; photo and Strava records stay private unless separately published. Those integrations must use existing identity and consent pathways, not another login.
- **Identity:** One verified person and membership. Imported plans stay scoped to their owner, RLS tested for two unrelated real test identities. No public read of private weeks.
- **Coached publishing:** Every future session passes editorial and structured prescription checks, with one Week preview of affected dates. Existing session versions and completed files remain unchanged. Do not silently lift a recovery hold to satisfy a schema.
- **Shared practices:** Thursday is one explicitly dated authored occurrence with subscribed athletes and protected individual overrides. Saturday mileage is individual; a meetup exists only when Collective has a separate hosted occurrence. Revised shared work produces a subscriber preview and one versioned delivery per affected athlete.
- **Visuals:** Standardized easy + strides, complex intervals, long-run finishes, rest, filing and calendar descriptions. No `6 × 0 null`, empty cards, invisible units, contradictory session headers, generic system narration or em dashes. Light and dark modes, smallest supported iPhone, dynamic type and reduced motion are release checks.
- **Reliability:** Page and roster query budgets are measured, indexes reviewed against actual query plans, pagination and portrait cache in place, authenticated feed readback after publishes, retry deduplication and failure alerts. Load test with 100 synthetic athletes in isolated staging, not in production's real roster.
- **Observability:** Counts for draft parse failures, rejected publish attempts by reason, feed mismatch, import collisions, notification delivery and next-seven-day unresolved sessions. Provide a coach work queue, not a public grade or athlete engagement score.

## Current implementation boundary

The schema-1 parser and focused tests are the first reusable seam. This does **not** connect to Supabase or iOS yet. Before exposing import in the app, build the authenticated draft/preview/commit path, the corresponding canonical interval mapping, provenance and rollback, two-account RLS tests, and end-to-end device QA. Native Plan Exchange and shared-session notifications are being designed separately and must consume this contract rather than introduce a second source of training truth.
