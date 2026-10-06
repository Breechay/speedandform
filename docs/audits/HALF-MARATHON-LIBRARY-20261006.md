# Half-marathon Library build receipt

October 6, 2026. Review branch based on `8ebea0f1b93899058e2fd64dd4d0428d43319ab6`.

## Implemented

- Three complete public-resource candidates: `/library/half-marathon-training-plan/`, `/library/how-long-to-train-for-a-half-marathon/`, `/library/half-marathon-pace-chart/`.
- The reviewed 12-week all-easy source is version `2026-10-06.1`. One JSON source drives the desktop table, all 84 mobile day entries, mile/kilometer display and print. No coached-athlete assignment is created or changed.
- Library typography uses local Inter Tight and system sans, preserving cream surfaces and numeric monospace. The reading migration includes nested Library articles; legacy serif token names resolve to the sans display family.
- Existing split calculator uses one canonical-meter math core. It rejects malformed/incomplete inputs, carries rounded seconds correctly, converts custom units exactly, and no longer derives threshold training from a goal time.
- Three routes added to the existing Library, Plans link, search index, schema and sitemap. `node scripts/build-discovery.cjs --half-marathon` preserves existing discovery records and content. Do not use the older unsuffixed discovery rebuild for this release: its source catalog has unrelated drift from the current site.
- Resource interactions emit allowlisted `hm_resource_view`, `hm_week_open`, `hm_units_change`, `hm_print_request`, and `hm_next_step` events. DNT/GPC suppress them. Collection uses an existing `gtag` only when present; these pages do not install a new analytics SDK. This is **not** evidence of production collection or a configured ad conversion.

## Verification

- `node tests/pace-math.cjs`: 25 chart rows / 100 numeric cells, original 44 fixtures included, parse grammar, carry, exact conversion, round trips, ordered/deduplicated checkpoints and browser export.
- `node tests/half-marathon-library.cjs`: exact weekly totals and long outings, rest/taper spacing, 84 days, all weeks, canonical metadata, internal anchors and print fallback.
- `node tests/cream-reading.cjs`: 75 reading pages, content/script/ID preservation, exclusions, idempotence and text contrast.
- Chromium 153: six widths (375, 390, 430, 768, 1024, 1440) across three resources, calculator, Library and an existing nested article. No horizontal overflow or JavaScript exceptions. Unit switching, week selection and deep links, malformed calculator fields, no-JavaScript week access, and 200% zoom checked.
- Three-page A4 plan print generated and visually reviewed, including every week and necessary instructions. No-JavaScript print also includes every week.
- Non-charging existing checks: 65 purchase-state cases, 32 attribution/privacy cases, purchase-access email/outbox synthetic fixtures. No live charge, account mutation or message send.
- Configured static build completed. Its pre-existing commercial/brand generators also rewrite unrelated source surfaces; those generated-only unrelated changes were excluded from this commit.

## Release state and next gate

Source candidate only until a deployment receipt is added. Physical phone and Safari/WebKit are not tested here. Legacy discovery/share tests contain immutable September snapshot comparisons that do not represent this new release; they are not claimed as passed. The current release uses focused schedule, numerical, reading-preservation, browser and paid-flow checks.

Before advertising: inspect the actual deployed destination, verify event collection and source attribution, choose one audience/promise/destination experiment and a concrete spending scope. Resource use is not a lead or purchase. The six-week and faster-half candidates remain outside the deployable root for the next coaching/content pass; eight- and sixteen-week variants remain in the owning roadmap.
