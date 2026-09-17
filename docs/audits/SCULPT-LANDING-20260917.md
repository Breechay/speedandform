# Breechay Sculpt / Forge: Pass 5B

Owner: Brice. Single register: `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release state

**LIVE September 17, 2026 at 10:34:05.160 UTC.** PR #129 merged the exact tested head `bb14256303fa9ec68dcfba77f0b40050042b60e3` as main `8596f831b438e2fa35e3462b90e47a9d2b48cab1`. Netlify deployment **`6aabc20f904ed700087b9ed0`** is ready and current on the existing production site `f3914a6a-a9ce-465e-8212-f5f42597c469`, speedandform.com. The deployment record names the exact release commit. The existing main integration published it; no manual production deployment was executed.

The live website illustrations now show **JOSÉ. in FORM** and **ADRIAN. in Breechay Sculpt**, as explicitly requested by Brice. These remain labeled example/design illustrations, not actual athlete records or evidence that native app identities were edited. The FORM page differs from its previous release only by the exact `RUNNER` to `JOSÉ` replacement.

Read-only branch acceptance **`35210557949` passed** at `bb142563`; artifact `10492205057` records that exact revision. Main acceptance **`35211142899` passed** at the actual release commit. Both runs passed **13 source/critical-flow suites**, **129 Sculpt browser checks**, **126 FORM browser checks** including José, 219 training-guide, 188 foundation-guide, 110 gallery, 61 discovery, 17 homepage and 15 current coaching-funnel browser checks. The 865 served-page checks are Chromium tests, not physical-device tests. Six widths from 375 through 1440 pixels, keyboard navigation, open disclosures, input validation, sample completion/reset, 200% reflow, no-JavaScript reading and reduced motion were covered where recorded in each report.

Actual production verification ran from **10:37:06.080 to 10:37:37.675 UTC**. The Sculpt and FORM HTML and all **eight Sculpt-referenced media/style/font assets** matched their exact reviewed SHA-256 hashes by 10:37:09.962 UTC. FORM's three assets, the eight revised guides, all **72 canonical pages**, six discovery resources and six route cases, 19 shared-page previews and ten image URLs, and the two gallery pages with twenty media/download resources were reverified. No retries were required. The photo ZIP and original film remain intact.

The actual public-page browser suite then passed **52 live checks** at 390 and 1440 pixels. It checked both requested identities, real image loading, all twelve phase names, sample values, keyboard completion, validation and focus recovery, reset and reload behavior, preview navigation, removed launch form, readable text, reduced motion, contained layouts and absence of JavaScript runtime errors. Production screenshots of José, Adrian and both page sizes were downloaded and visually reviewed. The official screenshot and Adrian illustration remain separately labeled.

Permanent evidence: this document and `SCULPT-LANDING-MANIFEST-20260917.json`. Downloaded main artifact **`10492675364`**, `sculpt-landing-receipt`, contains the exact release commit, source results, seven production reports, served/live browser reports and screenshots. Fourteen-day Actions retention applies. The final review ZIP contains no font files, source bundle or credentials. The documentation-only closure does not alter public page source.

**Coverage limits:** physical iPhone/iPad, Safari, screen-reader output, App Store purchase dialogs and native sharing sheets remain unverified. No real inquiry, email, signup, social post, payment, subscription or athlete record was sent or created during testing. No conversion, indexing, ranking or numerical design-quality score is claimed.

## Explicit owner interruption

Brice requested José rather than Runner inside the FORM website illustration and Adrian in an equivalent Sculpt illustration. `/form/` changes only `RUNNER` to `JOSÉ` in the existing illustrative identity. A regression compares the entire page with its previous release and allows that exact single replacement only. The existing FORM design-preview and example-session labels remain. `/forge-sculpt/` uses `ADRIAN.` in its app illustration, labeled sample training. No real athlete profile, program, session, assignment, receipt, native source or account was read or changed to make these illustrations.

## Bounded product release

One product landing page, `/forge-sculpt/`, is rebuilt in its own warm-black, bone and bronze world, with stronger Jost body text and locally hosted existing fonts. FORM's native-sans dark field remains distinct. The reading-page cream stylesheet, Labs, homepage, purchase flow, native apps, training portal and private interfaces are unchanged by this pass. **175 other HTML sources** are held byte-for-byte against base `7eb2106a4ab2ef29fa26b98bbc062dfed900c192`; the second HTML change is the exact owner-requested José substitution. The independent coaching update described below is preserved.

The page leads with “Look like you train on purpose.” It explains how the emphasis moves, makes all twelve phase names inspectable in three campaigns, shows an actual App Store image, presents the gym/time/experience commitment, and routes directly to the current Breechay app.

The old launch-notification form is removed, not rewired or replaced by an unverified email collector. `#notify` remains a compatibility anchor at the current start section. Other meaningful section bookmarks remain. No subscriber data was queried, erased, imported or sent. Existing legal/support URLs and authenticated training routes remain intact.

The sample-set concept is retained as an explicit, ephemeral website demonstration: adjust weight and repetitions, complete the sample, inspect exactly those values, reset. It does not save, sync, upload or file a real session. Invalid and blank values receive errors with focus recovery. No-JavaScript readers get the example and working App Store links instead of inert controls.

The old dedicated sharing image says “four-phase,” contradicting the twelve-phase program. The landing page now uses `assets/forge/og-sculpt-20260917.jpg`, a **1200 × 630** capture of authored HTML using the existing approved anatomy illustration. It contains no price, countdown, review or athlete result. SHA-256: `cf228e40062e7c7820133d8d4c624d0454cf91310bb32b14b4cb297101673296`. The previous image file is retained for compatibility; unrelated page cards were not replaced.

## Product and design evidence

Primary availability and public purchase description: Apple's live lookup for app ID `6790569283`, captured by read-only Actions `35206426281` and `35207088651` on September 17. It reports **Breechay 3.4**, released September 15 at 01:25:38 UTC, minimum iOS 17. The description states twelve phases, week one free to train, and U.S. **$199.99/year, automatically renewing**, managed through Apple. The page discloses annual renewal/cancellation and refers local pricing to Apple. A free first training week is not relabeled a seven-day subscription trial. No StoreKit, app listing, subscription product or price was edited.

The web-search snapshot still reported version 2.1, and the older `forge/ship` branch is an August 11 / 2.1 submission. Neither was used to identify the current downloadable release. The direct Apple lookup is the release evidence. The actual **600 × 1299 App Store image**, copied without pixel editing, has SHA-256 `8e5c5392188de4a8498fe05ca69889a6e5bfaf560daa89b94225128d5afd913f`. Later fetches of the same Apple URL returned different bytes, so the exact inspected original was recovered from pinned review artifact `10490645192` / run `35207088651`, verified against that hash and committed. The check was not weakened to accept the changed response.

Visual and behavioral sources read:
- Website `docs/FORGE_DESIGN_NORTHSTAR.md`, `docs/FORM_TYPOGRAPHY_STANDARD.md`, `forge-sculpt/FORGE_WEBSITE_APP_CONTINUITY_BRIEF_20260730.md`, and athlete-language rules.
- Native `docs/FORGE_START_HERE.md`, `docs/FORGE_CANON.md` Book I, and `docs/FORGE_LEDGER.md` on older `forge/ship`, interpreted as historical where newer owner rules supersede them.
- Current native `codex/forge-adrian-access-reconciliation` at `66f7ddaa1b840519dbca1c78e70e44b196826512`: `AGENTS.md`, `docs/FORGE_ADRIAN_CURRENT_STATE.md`, and the Forge aesthetic gate. The September rule permits self-directed placement in accessible authored content; July's “no phase picker” must not be repeated. A working branch is not proof that every native change is publicly available.

Three-campaign phase names remain from the authored continuity brief. Exact 49-week/267-session/Hold-implementation claims, a universal six-day requirement for every phase, Sunday conversion language, invented allocation percentages and unverified completion/access gates are absent. The opening week has six sessions; later weeks depend on their phase. Requirements are for experienced lifters with a full commercial gym, not a beginner's course or home-dumbbell plan.

## Concurrent release preserved

PR #128 independently shipped coaching instrumentation as `a8a778a0ce30d8eca12f7ac43efcd84583164bec` during this review. Its four files were merged unchanged: `.github/workflows/coaching-funnel.yml`, `docs/roadmap/COACHING-FUNNEL-MEASUREMENT-20260917.md`, `js/coaching-measurement.js`, and `tests/coaching-funnel-browser.py`.

Earlier page-protection tests correctly flagged changed measurement bytes, but their old baseline was no longer current. `scripts/protected-site-baseline.cjs` now pins that one file to the exact independently released commit instead of excluding it or reverting it. Its SHA-256 remains `19ca72554ebbcfbb382922ddc45a2116662e66759672de7a77a8ca24e7aeb26b`. All other file baselines retain their original authority. Both existing homepage acceptance and the fifteen current coaching-funnel checks passed on the combined release, with transports intercepted. No campaign, budget, offer, intake or tracking implementation was changed by the Sculpt pass.

## Review and maintenance

Initial in-memory Chromium review covered six widths and open content at 200% zoom. It caught genuine narrow-column overflow in navigation, allocation rows, sample controls and the decorative numeral; container reflow now stacks them rather than concealing overflow. A contrast guard also caught the paper identity dot below its target; it now uses the darker paper bronze. Complete served and live acceptance ran in the existing Actions environment because the local browser's administrator policy blocks localhost navigation. That restriction was respected.

The final workflow is read-only. Temporary transfer chunks, decoding and write-permission steps are absent from the final tree. Only the reviewed source and its repeatable checks remain.

Edit `forge-sculpt/index.html`, `css/sculpt-landing.css`, `js/sculpt-landing.js`. The demonstration is not a second training engine. Keep private data and program access outside it, preserve image provenance and refresh deliberate changes in the manifest. `SCULPT-LANDING-MANIFEST-20260917.json` pins the page, eight assets and exact José-only change. Older FORM/discovery manifests advance only the reviewed checksums; tests do not allow arbitrary later changes. No fonts belong in downloadable review artifacts.

**Next: Pass 6**, contact, Field Notes, optional updates and final journey review. Remaining educational topics remain queued separately. This release does not change the native apps or Adrian's coaching-pilot delivery state.
