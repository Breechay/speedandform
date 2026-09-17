# Site ecosystem: bounded release passes

Owner: Brice. Created September 16, 2026. Pass 3 production receipt updated September 17, 2026 UTC (September 16 in Miami).

## Decision

Brice approved breaking the whole-site project into multiple passes after the large continuation attempts failed to deliver functional changes. Keep the full ambition, but finish independently useful releases. Do not reopen the whole-site audit during every pass.

This document owns the checklist for this project. It supplements, rather than replaces, `FORM-ROADMAP.md` and the existing product and commercial authorities named in `AGENTS.md`. It changes execution order, not coaching doctrine, app behavior, prices, or access rules.

**Current delivery state: Passes 1, 2 and 3 are LIVE.** Pass 3: PR #124, main `41648a26a126fc333815bd093381af22ae3aeb74`, Netlify `6aab5fedc4ff640008146717`, published September 17 at 03:35:22.532 UTC. Nine Node suites plus thumbnail validation, 110 gallery browser checks, 61 discovery checks, 17 homepage checks and 15 actual live-gallery checks passed. Exact public media/downloads, all 72 canonical pages and existing sharing metadata were reverified. [Pass 3 release receipt](../audits/TRACK-GALLERY-RELEASE-20260917.md). [Pass 2 receipt](../audits/DISCOVERY-RELEASE-20260916.md) and [Pass 1 receipt](../audits/SHARE-PREVIEW-RELEASE-20260916.md) remain historical release records. Physical-device and native sharing-app checks remain open. Pass 4 is next; Passes 4–6 remain unstarted here. No background execution is implied.

## Boundaries that apply throughout

- Coordinate with the concurrent cream-typography stream. Do not overwrite its stylesheet or replace the approved reading typography with an older design system.
- Preserve the Labs dark-green/lime aesthetic and the distinct HYROX presentation. Fix a verified functional or factual defect without redesigning those worlds.
- Preserve the coaching intake, measurement, paid-plan checkout, entitlements, private athlete data, and session assignments. A public-site refresh is not permission to change athlete records or product access.
- Re-read current app authorities and check release status when reaching the app landing pages. A working branch or a design study is not proof of a shipping feature. Do not promise a permanent free FORM tier, invent subscription terms, or publish an unapproved Analysis offer.
- Write for athletes: immediate answer, practical explanation, then optional depth. Distinguish evidence, athlete report, coach interpretation, and recommendation. Do not invent testimonials or results.
- Keep one owner per visual divider. Use readable type, useful illustrations, accessible controls, and reduced-motion behavior. Do not self-certify a numerical design score as a test result.
- An unlisted page is not automatically an archive, and an archive is not automatically safe to delete. Inspect inbound routes and delivery use before changing discoverability.

## Release register: the single checklist

| Pass | Scope | State | Implementation / test / production receipt |
| --- | --- | --- | --- |
| 1 | Approved share image and link-preview metadata | LIVE; native-preview check open | PR122; main `c1b56e58`; Netlify `6aab1cbbc6fa6800086e6e3e`. 73 defaults, 11 dedicated cards, 91 excluded HTML files unchanged. Seven suites; Actions `35159434946` verified 19 production pages and 10 distinct image URLs at 22:48:55 UTC. [Receipt](../audits/SHARE-PREVIEW-RELEASE-20260916.md). |
| 2 | Public navigation, Library discovery, and technical SEO | LIVE; physical-device checks open | PR123; main `06b487cd`; Netlify `6aab454727ac1b000895ccc2`. Eight suites; 61 discovery and 17 homepage browser checks. Main Actions `35171527097` verified 70 canonical pages, six resources, six route cases, 19 shared-page previews and 10 image URLs by September 17 at 01:43:01 UTC. [Receipt](../audits/DISCOVERY-RELEASE-20260916.md). |
| 3 | Track photo and video gallery | LIVE; native-device checks open | PR124; main `41648a26`; Netlify `6aab5fedc4ff640008146717`. Main Actions `35178718009`: 110 gallery, 61 discovery, 17 homepage and 15 live-gallery checks; nine Node suites plus thumbnail validation. Two gallery pages and 20 public resources match tested bytes. [Receipt](../audits/TRACK-GALLERY-RELEASE-20260917.md); [publishing runbook](../publishing/TRACK-GALLERY.md). Starter is an undated earlier selection. New dated albums need real selected media. Timestamp/custom-thumbnail selection is implemented; a visual authoring picker remains later. |
| 4 | Educational pages, in small topic batches | NEXT | Begin with easy running, threshold training, the long run and running form. No article rewrite shipped in Pass 3. |
| 5 | FORM and Breechay Sculpt / Forge landing pages | QUEUED | None yet |
| 6 | Contact, Field Notes, opt-in updates, and final journey review | QUEUED | None yet |

### Pass 1: the image people share

**Outcome:** the supplied Run Development image is the deliberate default for public pages without a better dedicated image.

Inspect existing public-page metadata and produce an explicit replace/preserve manifest. Commit the optimized asset derived from the exact supplied image. Set consistent Open Graph and social-card fields in the served HTML, including image dimensions and descriptive alternative text. Preserve meaningful page-specific cards and page-specific titles. Do not copy the homepage title onto every guide.

**Excluded:** layout, navigation, article rewrites, sitemap, redirects, forms, apps, and newsletter work. A verified prerequisite that prevents the image being served is the only reason to expand this boundary, and must be recorded.

**Acceptance:** automated checks for expected metadata and preserved exceptions; public image response and dimensions verified; representative production HTML checked after deployment. Record actual native sharing-app checks separately. Unchecked third-party previews remain open and are not represented as confirmed.

### Pass 2: visitors can find their way

**Outcome:** four legible public starting paths: Learn, Train, Run with us, and Work with Brice. Final navigation labels may be refined without changing those jobs.

Improve Library discovery, related-page routes, and site search using the existing content. Review canonical URLs, titles/descriptions, robots directives, sitemap inclusion, and structured data against current primary documentation. Give missing URLs a useful 404 page and a real 404 response. Consolidate only verified duplicates with relevant redirects; retain delivery routes and valuable archives.

**Acceptance:** crawl and link checks, search and empty-result behavior, navigation by keyboard and touch, canonical/redirect checks without loops, no private or purchase-confirmation pages added to public discovery, and no coaching/checkout regression. Technical SEO work must not be reported as a ranking or indexing guarantee.

### Pass 3: people can find and save their track photos

**Outcome:** a mobile and desktop gallery with dated, shareable session albums, photographs, clips, and working downloads.

Use authentic supplied media with established publication permission. Keep downloads available without email signup. Include clear session context, descriptive media text, efficient loading, accessible viewing, and an easy route back to the album. Establish a small repeatable publishing workflow so the next album does not require rebuilding the site. Announce only confirmed runs; do not manufacture a standing Saturday schedule.

**Acceptance:** real media viewed and downloaded; touch and keyboard navigation checked; video does not autoplay with sound; correct album sharing card; media removal path documented. Missing new session media blocks publication of that album, not construction of the gallery. Never disguise fixtures or old selections as a new event.

This pass comes before a large article rewrite because the gathering and its media are an immediate distribution opportunity.

### Pass 4: teach clearly and earn trust

**Outcome:** visitors understand a useful concept quickly and can go deeper without being overwhelmed.

Start with a batch of four foundation guides: easy running, threshold training, the long run, and running form. Review the existing drafts rather than treating them as approved. Use an answer-first opening, a meaningful example or visual where useful, practical limits, related reading, and a contextual route to help from Brice. Check specific physiological and medical claims against primary sources. Preserve useful depth and working tools rather than reducing every page to generic marketing copy.

**Acceptance:** source review, reading-flow and responsive review, functioning links and tools, no unsupported diagnostic promises or guaranteed results, and clear distinction between general guidance and individual coaching. Ship and record each small topic batch before starting another. Remaining topics stay queued in this register's receipt cell rather than spawning competing checklists.

### Pass 5: app pages match the actual products

**Outcome:** each app has a clear role, a truthful promise, and a landing page belonging to its current visual world.

Implement FORM first and Breechay Sculpt / Forge second as separate bounded sub-releases. Read current source and authority documents before each. Use verified screenshots or label representations accurately. Explain who the product is for, what it does, and the supported next action. Confirm current store destination and commercial terms. A native-app redesign is outside this website pass.

**Acceptance:** each landing page reviewed independently at phone, tablet, and desktop widths; product claims checked against release evidence; screenshots match their labels; store and support links work. Do not let uncertainty about one app hold the other's completed page hostage.

### Pass 6: make it easy to ask, return, and stay in touch

**Outcome:** visitors can ask a simple question without applying for coaching, and can choose to receive useful updates.

Keep Field Notes as the editorial home rather than creating a second newspaper brand. Distinguish an ordinary contact message from coaching intake and from newsletter consent. Build newsletter signup only against a verified sending and subscriber-management path, including appropriate consent, unsubscribe, and failure behavior. Do not import existing contacts into marketing or send a campaign as an implied part of the redesign. Integrate gallery releases, useful notes, and confirmed runs without promising a publishing cadence Brice has not chosen.

Finish with an end-to-end review of social arrival, reading, related resources, asking a question, coaching inquiry, plan purchase, app discovery, and album download. This catches cross-pass inconsistencies; it does not replace testing during each pass.

**Acceptance:** verified contact destination; signup and unsubscribe tested without unsolicited sends; truthful success/error states; final broken-link, accessibility, metadata, responsiveness, and critical-journey checks. Leave a concise publishing runbook.

## How a pass closes

Read remote main and concurrent work before merging. Use small inspectable commits; batch verified changes into deliberate deployments rather than publishing every edit. Do not overwrite another stream's changes.

For each release, fill the register with changed routes, implementation commit, actual tests and viewport/device coverage, remaining blockers, production deploy identifier, and live verification. Distinguish PREPARED, COMMITTED, TESTED, and LIVE. A source check is not a browser check, and a browser viewport is not a physical iPhone.

If a blocker appears, save the completed work and name the exact blocker. Do not restart the entire audit. Broad implementation approval already exists; request input only for genuinely missing assets, consent, product facts, or authorization.

Work is performed in the active interaction. This roadmap does not create background execution, scheduled monitoring, or a promise that queued passes are already running.
