# Training-support guides: Pass 4B

Owner: Brice. The single checklist is `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release receipt

**LIVE September 17, 2026 at 06:15:49.586 UTC.** PR #126 merged as `e997c3bd893fe673ba5ff49e01242ce3a59d80a2`. Netlify production deployment `6aab858981d20d0007a911c0` is ready on the existing site `f3914a6a-a9ce-465e-8212-f5f42597c469`, and its record names that exact release commit. The existing main-branch integration performed the deployment; no additional manual production deployment was triggered.

Read-only branch CI `35188730557` passed on `7aadb58811270b096e20dd8024539ae76de64941`. Final main verification `35189507008`, on test-only correction `3d4e41bcbabe0b6372aa2cd40a262f8dd1e5ed44`, passed **eleven source suites, 219 new guide browser checks, 188 foundation-guide checks, 110 gallery checks, 61 discovery checks and 17 homepage/intake/media checks**. The correction changed only the delivery verifier and did not redeploy or alter site content.

Actual production GET verification began at `2026-09-17T06:23:58.041Z`. The four revised guides, five exact public assets and the real privacy-link destination passed by `06:24:01.331Z`. All article HTML matches the released source after only the single inspected hosting rewrite described below. The original four guides and their three assets passed by `06:24:02.869Z`; all **72 canonical pages, six discovery assets and six route cases** passed by `06:24:08.821Z`; **19 page previews and ten image URLs** passed by `06:24:15.886Z`; and **two gallery pages and twenty resources**, including the film and photo ZIP, passed by `06:24:25.559Z`. None of these final verification stages required readiness retries.

The actual live Chromium suite then passed **37 checks** across 390- and 1440-pixel viewports: guide responses and version markers, contained layouts, working source disclosures, the calculator's 75 g / 50 g-per-hour example, invalid-input rejection and recovery, Library links and no runtime JavaScript errors. Screenshots were captured from the public site. Viewport checks are not physical iPhone or iPad tests.

Artifact `10483332919`, `training-guide-receipt`, from main run `35189507008`, contains the verification commit, editorial manifest, source-test results, browser reports, screenshots and five production reports. It has fourteen-day retention; this document preserves the permanent release facts. The final archive contains no source bundle or font files. No real inquiry, payment, signup, email or external share was sent. Physical-device, Safari, screen-reader and native share-sheet behavior remain unverified. No indexing, ranking or conversion gain is claimed.

## Four routes, four jobs

- `/training-week`: build a repeatable week. A seven-day diagram shows an established four-run example; native disclosures explain three/five days and starting/returning. Threshold is not a mandatory novice prescription. Easy running has its own training value. Strength and life demands count in the same week.
- `/strength`: strength training for runners, not merely “structural organization.” Four movement patterns, a small illustrative introduction, progressive load, and placement around running. Distinguishes research on heavy training from a novice circuit and avoids diagnosis from appearance. Existing routines and execution tools are preserved.
- `/recovery`: practical sleep, food, fluid and load priorities; keep/reduce/rest decisions; response-led return after racing. Removes a universal 48-hour adaptation deadline, mandatory recovery runs, and claims that all easy running accelerates repair. Urgent symptoms stay outside coaching self-tests.
- `/fueling`: before/during/after guidance, common carbohydrate ranges with limits, a worked example and local calculator. Gels/food and drinks count together. No fasting requirement, supplement purchase, dietary target, weight-loss calculator or aggressive hydration formula.

The calculator is arithmetic for chosen intake, not a prescription: 90 minutes, two 25 g portions and 25 g across drinks gives 75 g and 50 g/hour. It clears stale results on edits, accepts meaningful zero/decimal amounts, rejects blank/nonfinite/out-of-range inputs with linked errors, and distinguishes high results from recommended intake. Content and the example remain usable without JavaScript. No storage, analytics, accounts or network calls.

## Evidence and editorial limits

Published material inspected for this pass:

- Esteve-Lanao et al. 2007, PMID 17685689: small randomized low-intensity distribution study, not proof of this exact calendar.
- Støren et al. 2008, PMID 18460997: small randomized heavy-strength intervention in well-trained runners; measured running economy, not a universal injury-prevention claim.
- Doma and Deakin 2013, PMID 23724883: acute strength/endurance sequencing and next-day running, not a universal spacing rule.
- Walsh et al. 2021, PMID 33144349: athlete sleep consensus, individual needs and research limitations.
- Meeusen et al. 2013, PMID 23247672: ECSS/ACSM consensus; persistent fatigue is nonspecific, and assessment excludes other causes.
- Chen et al. 2008, PMID 17543583: daily running after experimental downhill-induced damage did not improve measured recovery. Not every real-world training situation.
- Thomas et al. 2016, PMID 26920240: joint nutrition position statement. Everyday food examples are coaching guidance, not a prescribed diet.
- Jeukendrup 2014, PMCID PMC4008807: author review, endurance carbohydrate amount/type/duration/tolerance. Common ranges are not universal minima or biological ceilings.
- Miall et al. 2018, PMID 28508559: small randomized gut-training study. Practice, not immediate adoption of high intake.
- Mountjoy et al. 2023, PMID 37752011: IOC REDs consensus. Underfueling concerns require appropriate professional assessment, not diagnosis from the guide.
- NATA 2017 official explanation of the fluid-replacement position statement: underdrinking and overdrinking both matter. Sodium does not cancel excessive water intake.
- London Ambulance Service official emergency guidance: severe symptoms are not a training-adjustment question; local emergency numbers apply.

References appear beside claims and expand into source context. No new athlete results, testimonials, medical credentials, commercial offers or research data are invented. The weekly arrangement, exercise dose and worked food example are labeled illustrative coaching guidance.

## Boundaries and acceptance

The established cream stylesheet and Pass 4A guide layout/script/content remain byte-identical. Four new guide bodies and their four Library entries are the only existing HTML changes. Source checks pin five new snapshots to `c1cf76da68a64e6b06e2f4fcd008f6c288b811c2`; 172 other HTML files, existing tools, homepage, gallery, Labs, paid-plan sources, redirects, headers and sitemap are preserved. Old editorial manifests remain immutable. Older tests accept the exact subsequent snapshots, not a broad bypass.

Browser acceptance covers six viewport widths (375, 390, 430, 768, 1024 and 1440), source disclosures, native details, keyboard access, 200% zoom with disclosures open, calculator results/validation/stale-state/zero/decimal/high-input behavior, and no-JavaScript reading. Existing foundation, gallery, discovery and homepage suites run again; forms are intercepted. Public GET verification checks exact HTML and five assets, followed by live Chromium interactions. Physical devices, Safari, screen-reader output and native share sheets remain open. No indexing, ranking or conversion improvement is claimed.

## Review corrections

The first browser review caught recovery priority text below the guide minimum; it was raised to 17 px with a scoped rule. The second caught the fueling equation and calculation control overflowing in a zoomed narrow column. Their intrinsic width now reflows rather than clipping or reducing type. The source and browser assertions were not weakened to conceal these defects.

The first exact production-HTML comparison detected an existing hosting transformation, not changed article content. Read-only inspection run `35189385578` captured all four delivered and expected HTML files: each differed only in the footer link `<a href="/privacy.html#website">Privacy</a>` becoming `<a href='/privacy#website'>Privacy</a>`. The verifier now requires exactly this single known rewrite and exact equality everywhere else, then checks the live privacy destination and its fragment. The test-only correction `3d4e41bcbabe0b6372aa2cd40a262f8dd1e5ed44` used `[skip netlify]` and did not change the deployed site. No broad whitespace, script or content normalization was introduced.

The final release workflow is read-only and does not publish or mutate source. Temporary source-transfer fragments are not on main. An earlier Actions source-transfer attempt respected the missing workflow-write permission: ordinary site files were transferred separately, and the already-authorized connector installed the final read-only workflow. No new permission or credential was added.

## Maintenance

Edit `scripts/training-guide-content.cjs`, deliberately run `node scripts/build-training-guides.cjs`, then `node scripts/build-discovery.cjs`. Review the exact diff and versioned manifest. `js/training-tools.js` is arithmetic only and is tested independently. Do not replace the historical Pass 4A manifest or introduce an automatic scan of private delivery folders. The original Netlify build is unchanged.
