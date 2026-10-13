# Adrian: Strength records on the study

Owner authorization: October 13, 2026. Brice confirmed consent for photos and volunteered information and requested automatic publication of completed Strength records for coach and agent review. He then requested the public name **Adrian**. This supersedes the generic no-automatic-publication rule for this scoped projection only.

## What is connected

The existing authenticated Strength upload writes `forge_strength_receipts`. The new `public-strength-study` Edge Function reads only the allowlisted study's completed native receipts through the service-only `published_strength_study` RPC. It returns explicit set fields, an opaque record ID, recorded/received timestamps, and the linked prescription version. It does not return account IDs, device keys, free-text feedback, private coach notes, or the original payload. No new workout store or interpretation pipeline is introduced.

The study's Strength tab shows this feed above the separate message-based reports. The footer count comes from the feed. Initial load, Refresh and visible-page refresh every 60 seconds check the server; a page showing more than 50 sessions waits for explicit Refresh to avoid collapsing an ongoing review. Failed reads show Unavailable, never zero. Unknown or revoked publications reveal no records. A failed refresh clears previously displayed data. Successful refreshes preserve expanded records.

## Review as an agent

The same JSON is available through the page's Download JSON button. It includes the displayed records, `total_sessions` and `exported_sessions`; load more before exporting when those differ. This is athlete-recorded execution, not independent verification of technique, range of motion, hypertrophy, or reserve reps.

For a direct read, GET:

`https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/public-strength-study?study=adrian-runner-mass&offset=0`

Use the public `ANON` value in `js/strength-study-evidence.js` as the `Authorization: Bearer …` and `apikey` headers. The gateway validates that public JWT; it grants no private athlete access. Responses use `Cache-Control: no-store`. Pages contain up to 50 sessions; request offsets 50, 100, etc. Deduplicate by the opaque record ID if uploads arrive while paging. Never use a service key in an agent-facing document or browser.

Weights without an explicit supported unit remain labeled **unit not recorded**. Missing weight is not silently interpreted as bodyweight. The current receipt contract does not guarantee a weight-unit field. Do not infer units from the previous coach UI's `lb` suffix; native contract confirmation remains open.

## Verification and release

- Production database migration and Edge Function v2 deployed on October 13. First-name publication authorization is recorded separately from the schema migrations.
- Actual HTTP read: Adrian returns published with **0 sessions**; an unknown slug returns 404; negative offset returns 400. Revocation tested inside a rolled-back transaction and returns not_published. Raw registry/RPC deny anon and authenticated roles.
- Isolated PostgreSQL fixtures: athlete isolation, explicit-field projection, legacy/backfilled exclusion, unknown/revoked states, pagination, and anonymous access denial pass. No fake receipts were written to Adrian or production.
- Browser fixtures at 375/390/430/768/1024/1440: empty, populated, error, revoked, escaping, missing units, download and count pass. Current study tests, coach receipt test and full configured Netlify build pass; existing unrelated external-font warnings remain.
- Website source release and actual production publication are recorded in the PR. No phone upload or installed-app acceptance is established by these checks.

## Still needed from the app

An in-place update, Adrian signing into his own connected athlete account, and workout sharing on. Verify a completed native receipt reaches the coach record and study; compare every set with the phone. Previously local sessions are not assumed to backfill. The test email identity is separate and must never be used to impersonate Adrian.

## Maintenance

Service-role administrators can revoke this study by setting `strength_study_publications.revoked_at`, or restore it only with applicable consent. Existing coach sharing is not publication consent for any other athlete. No other athlete is enabled by this change. Deleting a source receipt removes it from subsequent reads. Downloaded copies cannot be remotely recalled.

Re-run browser checks with Playwright 1.55.0. Run the SQL test with `PGLITE_MODULE` pointing to `@electric-sql/pglite` 0.3.14's `dist/index.js`; fixtures run in isolated memory. The production security advisor reports no findings for these new objects after the explicit service-only registry policy.
