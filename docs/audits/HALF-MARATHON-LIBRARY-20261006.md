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

Source candidate only until a deployment receipt is added. The source commit `d865d97a31d086bec5bf748aa1f44a13d102ce27` is available in [draft PR #226](https://github.com/Breechay/speedandform/pull/226); its tree is `242a0fe8e6e9125bb53144ceb909eecb28a4be55`. GitHub closure and existing Chromium/WebKit regression checks passed. Final local keyboard and bounded visual corrections passed. Physical-phone and on-device Safari acceptance remain separate. Legacy discovery/share tests contain immutable September snapshot comparisons that do not represent this new release; they are not claimed as passed. The current release uses focused schedule, numerical, reading-preservation, browser and paid-flow checks.

Before advertising: inspect the actual deployed destination, verify event collection and source attribution, choose one audience/promise/destination experiment and a concrete spending scope. Resource use is not a lead or purchase. The six-week and faster-half candidates remain outside the deployable root for the next coaching/content pass; eight- and sixteen-week variants remain in the owning roadmap.


## October 6 SEO/share and measurement follow-up

First group was published in merge `6952a1c48751caebd66fdb2ec3ce9be53cc3fb04`, production deploy `6ac54c5e25b74d0008f25716`. This follow-up replaces generic cards with four deterministic 1200×630 JPEGs for the three resources and calculator. Metadata now includes image dimensions/type/alt, locale, large-preview permission and Article image/date/canonical identity. Sitemap dates reflect the actual October 6 publication. The existing share builder preserves the calculator's dedicated card.

A resource-only GA collector uses the existing public web stream. It suppresses collection for GPC/DNT and private access URLs, validates campaign labels, strips unrelated query/hash/referrer details, and counts only trusted week-opening actions. The collector emits no Meta, lead or purchase events and receives no calculator input or private training data. The public privacy description is updated. Functional first-party campaign-label continuity remains separate from external collection under GPC/DNT.

Acceptance: four-card SEO/image/sitemap checks; 61 measurement/privacy/interaction checks; exact schedule checks; existing 25-row/100-cell pace checks; 75-page typography checks; 36 responsive browser checks and no-JS/zoom/print behavior passed. Actual GA collection and Enhanced Measurement settings still require account verification. The connected GSC Wizard service returned payment_required for property discovery, so Search Console submission and Google-side collector verification are not claimed complete. The release PR and private Console own the final deployment/readback receipt.
