# FORM Races · Coach Editorial Workbench

October 29, 2026. Reviewable engineering candidate; **not deployed**.

## Purpose

Let Brice edit all canonical race presentation facts, sourced race copy and optional approved covers from a private coach page. A change to race content should reach V2 iOS clients on their next refresh with no subsequent App Store binary. The initial V2-capable native app still requires an iOS release; see FORM-iOS draft PRs #172 and #174. The established athlete race calendar remains the only public read; no parallel race registry is created.

## Implementation

- `/coach/races/` uses the current Supabase client, existing coach sign-in and active **coaching administrator** gate. No service-role key or new login exists in the browser.
- Private `coach_race_private.editorial_drafts` owns unpublished edits for one canonical `race_events.id`. Only **Publish saved draft** changes `public.race_events` and `coach_race_private.event_editorial`, in one transaction.
- `editorial_publication_history` stores the prior canonical event and editorial row, the exact published payload, admin and time. No attempt is made to rewrite athlete entries, event attendance, results, race-day intentions, program blocks, or Dossier history.
- An optimistic revision check protects drafts; a separate canonical event/editorial timestamp comparison rejects a draft if an agent or coach updated either live owner since the draft began. An error requires refreshing and reviewing, never blind overwrite.
- The admin read/save/publish RPCs reject any identity that does not pass `is_active_coaching_administrator(auth.uid())`. New private tables have RLS enabled and no authenticated or anonymous direct table rights. Only the narrow functions are callable by authenticated users.
- The existing `collective-media` public bucket receives **new**, versioned `races/<canonical-event-id>/<random-id>.<ext>` files. A new insert-only storage policy allows authorized administrators into that folder. The upload UI requires rights confirmation and alt text, and respects bucket MIME and 5MB limits. A pasted external image URL is not accepted. Photo absence is a finished first-class layout, not a placeholder. Uploaded-but-unpublished files are publicly retrievable by URL but not surfaced in app content.
- The workbench shows an **editorial preview**, not a claim of a signed-in native athlete mirror. Native portraits, spacing and device behavior remain a distinct acceptance test.
- Race introductions are capped at **240 characters**, with a live 15–25-word editorial target; the 14 current production introductions were read-only checked (longest: 142 characters, 25 words), so the limit does not invalidate their existing content. The editor warns before leaving a race or refreshing with unsaved changes.
- Race cover URLs must be exact versioned event-folder paths containing a unique UUID filename and an approved extension; the save RPC also checks the corresponding object actually exists in the expected Storage bucket. Path traversal, alternate hosts, query strings and unversioned assets are rejected. Publication rechecks the image exists.

## Deployment boundary

The SQL file `docs/next/FORM_RACE_EDITORIAL_COACH_WORKBENCH_CANDIDATE.sql` is a **migration candidate**, not a recorded database migration. Before execution, create the properly numbered migration with `supabase migration new race_editorial_coach_workbench` using the available Supabase CLI in the owning release environment, review current production drift, and port the exact approved SQL. Do not apply the candidate ad hoc or mistake this file for deployed schema.

The site is on a review branch. Do not merge into the auto-published site or advance `production` until the SQL is tested, authorization reviewed, and Brice explicitly authorizes a batched deploy.

## Acceptance checks

An isolated PostgreSQL 17.6 CI service, matched to the currently observed FORM
database version, now compiles the *unapplied candidate* SQL
against minimal fixture tables and checks anonymous/non-admin denial, direct
table isolation, stale draft revisions, external-source conflicts, atomic
photo-free publication, one publication-history row and versioned cover
requirements. This is a repeatable SQL contract test, **not** a substitute for
real Supabase Storage/Auth behavior or a production migration rehearsal.

1. Formal SQL migration in a controlled environment, inspect diff and run Supabase security/performance advisors.
2. Test unauthenticated and unrelated signed-in access to all three workbench RPCs; both must fail. An authorized coach can read all events, create a draft, save with the expected revision, and read back. A second editor's stale revision fails.
3. Change an event externally after the draft is saved. Publishing must fail and leave canonical `race_events` and editorial unchanged.
4. Publish a photo-free edit, confirm exactly one history row, read back canonical facts and the existing athlete V2 projection. Legacy `athlete_race_calendar()` must remain unchanged.
5. Upload one authorized JPEG/WebP/PNG into a unique event folder. Unauthorized users cannot upload or overwrite; the workbench cannot link a different event's media or a nonexistent object. Publish and confirm app image refresh; replace with a new path and verify old cache does not persist. Remove cover and confirm the typography-led fallback.
6. Test race switching, refresh, page exit and sign-out with unsaved edits; long titles, missing details, failed uploads, lost connection, 375/390/430 and 1440px, keyboard input, 200% zoom and reduced motion; then real iPhone V2 refresh, 0/1/many portraits and Dynamic Type. Reconfirm rights/withdrawal and public media access behavior.
7. Do not call the editor live until the matching database migration, site commit/Netlify deploy, and signed-in coach/device checks have actual receipts. Do not call race updates live on older native binaries until the V2 app release is shipped.

## Scope deliberately reserved

Considering / targeted / registered are separate athlete-intent states and must not be auto-promoted. Hosted race-weekend occurrences remain in Collective, not inferred from race entries. Result records and memory publications retain their separate evidence and consent; this workbench does not publish them. Per-event IANA time-zone handling, archive paging and the optional People / Places / Calendar doors remain later engineering tracks, not fake completed features.
