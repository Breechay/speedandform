# Training-support guides: Pass 4B

Owner: Brice. The single checklist is `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## State

Implemented on `work/guide-training-pass4b`; not yet a production receipt. Source acceptance passes locally. Container Chromium cannot access localhost (ERR_BLOCKED_BY_ADMINISTRATOR), so real browser acceptance runs in the existing GitHub Actions environment. Do not call this live until the final branch checks, merge, hosting record and actual production checks are recorded.

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

Browser acceptance covers six widths, source disclosures, native details, keyboard access, 200% zoom with disclosures open, calculator results/validation/stale-state/zero/decimal/high-input behavior, and no-JavaScript reading. Existing foundation, gallery, discovery and homepage suites run again; forms are intercepted. Public GET verification checks exact HTML and five assets, followed by live Chromium interactions. Physical devices, Safari, screen-reader output and native share sheets remain open. No indexing, ranking or conversion improvement is claimed.

## Maintenance

Edit `scripts/training-guide-content.cjs`, deliberately run `node scripts/build-training-guides.cjs`, then `node scripts/build-discovery.cjs`. Review the exact diff and versioned manifest. `js/training-tools.js` is arithmetic only and is tested independently. Do not replace the historical Pass 4A manifest or introduce an automatic scan of private delivery folders. The original Netlify build is unchanged.
