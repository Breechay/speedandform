# FORM app landing: Pass 5A

Owner: Brice. Single release register: `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release state

**LIVE September 17, 2026 at 09:28:49.462 UTC.** PR #127 merged the tested page as `6990f39cc6c07050f396de4b6c13334b6a256be5`. Netlify deployment `6aabb2c4b9f8d90008d38b92` is the ready, current production deployment of the existing site `f3914a6a-a9ce-465e-8212-f5f42597c469` at speedandform.com. Its deployment record names that exact release commit. The existing main-branch integration published it; no additional manual production deployment was executed.

Read-only branch CI `35198064646` passed at `4565b35ac49c84270b7fa73b23a8c59f2e6d8a8f`. The downloaded acceptance artifact `10486617328` records that same revision. Main CI **`35205320031` passed on the actual release commit**, including twelve source/critical-flow suites and **120 FORM page browser checks** at 375, 390, 430, 768, 1024 and 1440 pixels. Keyboard tabs, Home/End/wrapping, direct fragments, 200% text reflow, no-JavaScript reading, reduced motion, click hooks and runtime errors were checked. Regression coverage passed 219 training-guide, 188 foundation-guide, 110 gallery, 61 discovery and 17 homepage/intake/media checks. Together these are 715 served test-page browser checks, not 715 physical-device tests.

Actual production GET verification started at `2026-09-17T09:30:50.276Z`. The new `/form/` HTML and all three page assets matched the exact reviewed SHA-256 hashes by `09:30:51.160Z`. No retry or HTML normalization was needed for this page. The eight prior guides and their assets, all **72 canonical pages**, six discovery assets, six route cases, **19 shared-page previews and ten image URLs**, and **two gallery pages with twenty resources** were reverified successfully by `09:31:06.235Z`. Gallery checks included the downloadable photo ZIP and the original film.

The actual public-page Chromium suite then passed **29 live browser checks** at 390 and 1440 pixels: real HTTP response and release marker, contained layout, current App Store destination, visible preview label, loaded official screenshot, all five interactive session panels, direct fragments, keyboard navigation, appearance and coaching distinctions, retained help routes, and no runtime JavaScript errors. Public-site screenshots were downloaded and visually reviewed alongside the accepted desktop and phone screenshots.

Main artifact `10489936687`, `form-landing-receipt`, preserves the source commit, exact manifest, source results, browser reports, screenshots, six production reports and live browser report. It has fourteen-day retention; this document preserves the permanent release facts. No source bundle, credentials or font files are included in that final artifact. The documentation-only closure commit does not alter or redeploy the released site.

**Coverage limits:** physical iPhone/iPad, Safari, screen-reader output and native App Store/share-sheet behavior remain unverified. No actual inquiry, payment, signup, email or external share was sent. No conversion, indexing or ranking improvement is claimed. Pass 5B and Pass 6 remain separate.

## One public route

`/form/` now opens with “Know today’s run.” The page explains the daily session, the week and the record without demanding that a visitor understand internal coaching vocabulary. It connects to the eight already-published explanatory guides where useful rather than duplicating their whole contents.

The product page adopts the current native material law: dark field, native sans, bright readable ink, restrained lime and one divider per boundary. The paper record illustration belongs to the deliberately different document material. No new global theme, external fonts, visual library, image generation, native-app code or homepage rewrite is included.

The source-based Today preview is anonymous (`RUNNER.`) and explicitly labeled “Design preview” / “Example session.” It retains the actual source-study work of 4 × 2 mi and the authored example pace and purpose. Its three links navigate to real explanatory sections on this website. This is not represented as a live workout, athlete record, app emulator or current-release screenshot.

Five progressively enhanced session explanations support buttons, arrow keys, Home/End, focusable panels and direct explanation fragments. All five explanations remain readable without JavaScript. Questions use native disclosures. Original public section bookmarks are retained. Existing provider-agnostic App Store click hooks remain; no analytics provider, network call, account, storage, email form or payment path is introduced.

## Product evidence and the shipping distinction

The source material was read in `Breechay/FORM-iOS`, branch `work/today-field`, observed at `efc1f8c83c6b31ac4e0d39d7cb42874da6e14a9a`. Authority: `docs/FORM_MATERIAL_LAW_v1.md`; implementation: `FORM/Today/FORMFieldTodayView.swift` blob `8f00cba65860cc55d659b3dd6679b472bc6c5e9d`; handoff: `docs/HANDOFF_FORM_APP_2026-09-16.md`. The material law owns the visual direction; the handoff does not prove public release or completed new-user/purchased-plan wiring. No private athlete data was queried, used or published.

The official public Apple lookup was fetched in read-only Actions run `35195610964` on September 17 at 07:39:21 UTC. It identifies **FORM: Running Plans**, ID **6761313085**, version **40**, released September 1, 2026 at 16:23:39 UTC, minimum iOS 17. The current description explicitly describes sessions, paces, a week and filing, and names half-marathon, marathon and HYROX running. Those public capabilities are the basis for the page's promise, not an inferred new feature from an unfinished branch.

The current Apple screenshots still show the earlier paper/dial interface. A real 600 × 1299 session-details screenshot from that listing is copied without pixel changes and served locally, with source caption. Its SHA-256 is `239f02dc88c2b9b292354bfc1df0876c31bcce5be6bcc79762fbf77a48d0f918`. The new dark illustration is explicitly separate. No store screenshots, app version, app listing or app binary were edited by this pass.

Current store download pricing is not a permanent free-product commitment. The owner has already said FORM is moving toward paid access with a possible trial. The website does not invent subscription price, trial length, indefinite free tier, bundled plan entitlement, a watch app, Garmin/Strava synchronization or unapproved Analysis/coaching terms. Published plans, app use and personal coaching are clearly different kinds of support. The app's own store and support destinations remain the source for current access/compatibility.

Primary public references:
- https://apps.apple.com/us/app/form-running-plans/id6761313085
- https://itunes.apple.com/lookup?id=6761313085&country=us
- https://developer.apple.com/app-store/product-page/
- https://developers.google.com/search/docs/appearance/structured-data/software-app

The SoftwareApplication schema carries truthful identity and platform metadata without fabricated reviews, permanent-free offers or a rich-result eligibility claim. The approved site sharing image is preserved; title, description, card fields and canonical are specific to this page.

## Bounded change and review

One existing HTML page changes. **176 other HTML files**, the Library/catalog/search index, all 72 sitemap addresses, shared cream/Labs/app styles, the eight guides, gallery, original media, coaching/checkout and private systems stay unchanged. The old discovery manifest refreshes only this page's exact source checksum; historical narrative release receipts remain intact. Earlier regression tests accept exactly the pinned product snapshot, not an unbounded exception.

Local source acceptance passed twelve suites. In-memory Chromium rendering was used for initial design critique; it was not a served-page or production test. The local browser's administrator policy blocks localhost navigation, so complete HTTP/browser acceptance ran in the repository's existing GitHub Actions environment. The review shortened repeated hero copy, brought the mobile title into two lines and corrected genuine 200% narrow-column reflow rather than concealing overflow.

The first served-browser review caught a session-tab accessible name including the visual selection marker. Explicit accessible names now remain stable while the selected appearance changes; the test was not weakened. Revision `4565b35` passed the repaired case and the full regression suite. Final release verification is recorded above rather than inferred from the working branch.

## Maintenance

Edit `form/index.html`, `css/form-landing.css` and `js/form-landing.js`. Refresh exact hashes in `FORM-LANDING-MANIFEST-20260917.json` after deliberate edits, then run source/browser checks. The locally hosted screenshot must remain the reviewed official file, with provenance. Replace the preview label only after independently checking that the corresponding native appearance is publicly available. Do not change pricing or promise plan access by implication.

Pass 5B (Breechay Sculpt / Forge), remaining guide batches and contact/newsletter work stay separate.
