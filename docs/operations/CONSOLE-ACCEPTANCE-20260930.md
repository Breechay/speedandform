# Operating Console acceptance, September 30, 2026

## Delivered scope

Private operating records and shared reader in the existing FORM database. New `/coach/ops/` web shell; existing `/coach/labs/` preserved with an owner-only My day entry. Today, areas, waiting, source health, capture/edit/done/priority controls and optimistic updates. No native app build, financial action, message sending or public athlete-data publishing.

## Verified before repository release

- Ten Node tests pass: top-four eligibility, future dates, carryover, source freshness, safe rendering/links, strict response shape, local date labels, revision-checked writes, private schema and appointment filtering.
- Syntax checks pass for the browser module.
- Actual database tests pass under `authenticated`: owner read/write; externally delivered decisions included; stale revision cannot overwrite; audit records appended. Test records were rolled back.
- Anonymous table/RPC access denied. Unrelated authenticated accounts read no owned items; spoofed owner RPC/insert rejected. No authenticated delete or audit-insert grant.
- Offline Chromium rendering with synthetic source/auth fixtures passed at 375, 390, 430, 768, 1024 and 1440 pixels across Today, All areas, Waiting and Sources. No horizontal overflow or script errors observed.
- Offline interaction checks passed: edit, required waiting input, revision-conflict message, done, quick capture, failed refresh preserving the prior view, sign-out clearing private content, and a 200% root-font-size check at 768 pixels.

Offline browser tests used the real page markup, CSS and application functions with controlled auth/data stubs, without network-loaded fonts or modules. These are not production sign-in, network-import or physical-iPhone tests. Database authorization was tested separately against the real schema.

## Operational reconciliation

The private owner workspace carries the current verified athlete decisions and schedule agreements, current appointment projections, source health, owner actions and separate unresolved agent work. Scheduled brief/calendar-sync prompts were updated to read current sources rather than frozen training recipes. Corrections and external read-back details remain private in the operating records, not in this public document.

## Release gate / remaining evidence

- Source commit and PR: fill from the actual repository receipt, not a predicted SHA.
- Production publish: pending a verified Netlify receipt. A main-branch merge does not prove production published.
- Live authenticated owner sign-in and network imports: not exercised by the offline harness.
- Physical iPhone: not tested.
- Other site's metadata, workout pace labels and athlete schedule projections: independently tracked operating tasks; this console release does not claim those were fixed.
- Calendar and financial snapshots require future real connector refreshes. The browser refresh reads the shared workspace only.
- Next scheduled brief execution and email delivery have not yet been observed.

One checklist is maintained here for this console release. Current tasks and source checks live in the private operating workspace. No generic “everything is connected” claim is justified.
