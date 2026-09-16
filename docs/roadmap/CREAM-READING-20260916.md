# Cream reading surfaces: September 16, 2026

Status: IMPLEMENTED AND LOCALLY TESTED. Hosted preview and production verification pending. Owner: Brice.

This is the release checklist and roadmap addendum for Brice's request to carry the homepage's cream material into Library and its older public reading pages. It does not reopen native app design or change the homepage, Labs, Plans, intake, checkout, private records or coaching prescriptions.

## The change

The old reading pages each have inline styles, Jost at weight 300, small labels, Cormorant headings and a pale secondary ink. `css/cream-reading.css` supplies the new shared material: homepage paper #ece6da and #f4efe7, ink #11100e, body #5f5a52, Georgia headings and native system body text. Secondary text uses #655f56 rather than the homepage's faintest muted token: 5.08:1 against the main cream. Body starts at 17px with 1.65 leading; labels start at 12px and notes at 14px. Library is a two-column index on wide screens and a stacked, full-row touch target on phones.

`node scripts/build-cream-reading.cjs` applies the theme before static publishing, with no runtime JavaScript or dependencies. It targets legacy cream reading pages with either `.content` or `.page` wrappers, explicitly excludes private and modern surfaces, preserves scripts byte-for-byte, and discovers linked legacy subpages. The original authored pages remain the content source; shared type corrections are applied during the build. For local site previews run the same command first. Do not edit the generated manifest or copy generated HTML back over the authored source. The legacy authenticated plan/ledger interfaces are not part of this reading migration.

The sole Netlify configuration change is the build command. Publish directory, headers, environment and every redirect are unchanged. Tests run before transformation. The generated `/css/cream-reading-manifest.json` records the exact selected page list and source commit. Current source selects 66 pages, including Library, its reading references, Thursday, public athlete articles and Ghost reading pages.

## One acceptance checklist

- [x] Read current homepage tokens and representative Library, Fueling, Training Map, Race Strategy and Split Calculator source.
- [x] Unit checks: exclusions, idempotence, contrast, script/ID/link/content preservation, head CSS order, no overflow concealment, reduced-motion and focus rules.
- [x] Actual source obtained through the successful source-review workflow at 9b3b932514296c77dc424c8de96b538dd3221b51. Its only difference from base main is the review workflow itself. All 66 actual selected repository pages passed preservation tests, then the build completed.
- [x] All 66 transformed source pages rendered in Chromium at 375, 768 and 1440px: 198 layout checks. Scripts and external requests disabled for this static layout sweep. The two initial overflows were corrected: Easy Run footer now wraps, and Cycles phase rail wraps rather than clipping its last phase. Final sweep reports zero horizontal page/element overflows.
- [x] Actual-source mobile/desktop screenshots reviewed for Library, Fueling and Race Strategy; additional screenshots captured for Training Map, Mechanics Map, Easy Run Standards, Running Form Errors and Split Calculator. This is not a claim that every article was individually visually audited or that external images were checked.
- [x] Original Split Calculator scripts executed at 320, 375, 390, 430, 768, 1024 and 1440px. Verified 5K at 20:00 gives 4:00/km, 6:26/mi and 1:36/400m; Half at 1:30:00 gives 4:16/km; custom 8km at 40:00 gives 5:00/km; invalid-input handling remains visible. Results fit all seven widths.
- [x] Keyboard focus visible on Library navigation; reduced-motion removes Library hover transitions.
- [x] Netlify source verified against original blob 9bec4ef34be0aa96f2ba9d8e0dd67d7a57f351cf before changing only the build command.
- [ ] Hosted build and browser: confirm manifest count/commit, Library to Fueling and Split Calculator, no broken shared CSS request.
- [ ] Production: confirm released commit/deploy, manifest and actual route styling.
- [ ] Physical iPhone/iPad Safari and 200% text/zoom acceptance. Browser-width emulation is not a physical-device check.

Base main reviewed: fd18f73494280c4c87e841850714c8db9bfea390. Tested final code blobs: script 67d3a2b3745793c1fff5e806de32ec948c88d079, CSS a925c53545fe733ae4563fc8e7a50f9a06f97564, tests 8b82056f06d23fbd4badbe1501db4ca1a14432f2. Next action: inspect the hosted preview before releasing. No live-state or full accessibility-conformance claim is made by this record.
