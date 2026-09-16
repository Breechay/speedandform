# Share previews: Pass 1

Owner: Brice. Scope: the supplied Run Development image and static public-page link previews only. The single pass checklist remains `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release receipt

**LIVE September 16, 2026 at 22:48:39 UTC.** PR #122 merged as `c1b56e58f35aaee6b8b3447c5fb2d5fcaba6b116`. Netlify production deploy `6aab1cbbc6fa6800086e6e3e` is ready on the existing site `f3914a6a-a9ce-465e-8212-f5f42597c469`. The Netlify deploy record names that exact commit. No second production deployment was manually triggered.

Actions run `35159434946` passed all seven source suites and the read-only production check. The HTTP verification began at 22:48:42.093 UTC and finished at 22:48:55.383 UTC, with **19 representative public pages and all 10 distinct image URLs passing**. All returned HTTP 200; the image content types and SHA-256 values matched the tested files exactly. No retry was needed. Artifact `10472446341`, named `share-preview-receipt`, contains the source commit, test output, complete decision manifest, approved JPEG and detailed `production.json`. Artifact retention is 14 days; the facts below are the permanent release record.

The final JPEG is 1200 x 630, 94,050 bytes, `image/jpeg`, SHA-256 `49188782d245c067988e1a3944ca2529896a5faab8e355f25cae0ad28ccbbf9d`. Its public path is `/og/form-share-20260916.jpg`.

Production pages checked: `/`, `/library`, `/easy-run`, `/threshold`, `/long-run`, `/notes`, `/plans/`, `/plans/race-pace-durability/`, `/plans/race-pace-durability/support/`, `/plans/raise-the-ceiling/`, `/labs/`, `/labs/hyrox/`, `/labs/track/`, `/form/`, `/es/plans/race-pace-durability/`, and the Library articles `/library/first-half-marathon-goal/`, `/library/the-two-paces/`, `/library/when-a-week-goes-wrong/`, `/library/why-phases/`. Fourteen fields per page were compared with the committed source, including singleton OG/Twitter images, titles, descriptions, alternative text, dimensions, MIME and OG URL.

**Remaining acceptance:** actual iMessage, WhatsApp and Facebook rendering/cache behavior has not been checked in those native products. HTTP/source checks are not a claim about a physical device or a third-party cache. No search-ranking or indexing result is claimed.

## Changes

84 public HTML sources are explicitly allowlisted in `scripts/share-metadata.cjs`. **73 receive the approved default; 11 retain their dedicated image URLs and original image bytes.** The generated `SHARE-METADATA-MANIFEST-20260916.json` records each decision, previous/new URLs, titles, descriptions, image hashes and pre-edit body hashes. **91 excluded HTML files remain unchanged**, including private, athlete-specific delivery, Forge, previews and legal pages. Existing public seasonal pages retain their content and discovery rules; archiving belongs to a later pass.

The owner-supplied image was resized to 1200 x 630, transferred as a checksum-verified WebP derivative, and committed as an optimized progressive JPEG. Original attachment: `FORM SEO.png`. No generated people or substitute photograph. Transfer derivative SHA-256: `bede66f42dfac48771fdc02bcaeed7d41752fef635a44f76697cef87a0122507`. Temporary transfer fragments and the one-off source-writing workflow were removed before release. The final CI workflow has read-only permissions and never commits, deploys, or rewrites files.

One deliberate exception to retaining existing cards: `/plans/` used a card stating free to read/free to run, unsuitable as a blanket description after paid products launched. It now receives the approved image. Threshold, Long Run, Notes, HYROX, the study cards and the product-specific plan cards keep their own images.

Four Library preview descriptions were copied from the easy-days article despite different subjects. Only their Open Graph/Twitter descriptions were corrected. Article bodies and search descriptions are unchanged in this pass. Every other existing page-specific social title and description was retained, with missing social values filled from the page's existing search metadata. Existing canonical URLs and robots directives remain unchanged.

## Boundary proof

No layout, CSS, motion, navigation, sitemap, redirects, forms, newsletter, checkout, entitlement or athlete-assignment changes. All page bytes from the closing head onward were hashed against their originals. Head scripts/styles are protected by the transformer; the homepage's existing WebPage image URL is the sole intentional JSON-LD change. The existing cream build pipeline is unchanged. This is static served HTML, not client-side metadata injection.

## Source checks

These passed locally, on the isolated branch and on merged main:

```
node tests/share-metadata.cjs
node tests/homepage-metadata.cjs
node tests/homepage-release.cjs
node tests/coaching-measurement.cjs
node tests/cream-reading.cjs
node labs/track/track.test.cjs
node tests/thursday-schedule.cjs
```

The share tests check unique populated fields, image dimensions/MIME/bytes, title and image agreement, unchanged bodies, excluded-file hashes, retained dedicated URLs, idempotence, and fail-closed behavior for noindex or newly added dedicated images. Cream compatibility checks cover 66 repository pages. Track checks cover six standards and 26 sets. No live inquiry, marketing email, analytics test event or payment was submitted.

## Maintenance

`node scripts/share-metadata.cjs` deliberately regenerates the explicit manifest and source metadata. Run it only as an intentional authoring action, not as a validation shortcut. `node tests/share-metadata.cjs` validates the committed baseline without rewriting it. `node scripts/verify-share-production.cjs /tmp/production.json` performs the unauthenticated, read-only live check. It submits nothing and executes no page JavaScript.

New pages and dedicated images require review of the allowlist, preserve map and tests. A later authorized content pass must explicitly rebaseline the corresponding body hashes after reviewing its changes. Do not hide a regression by regenerating the baseline before testing. Do not apply blind site-wide replacements or touch another stream's styles. Keep image filenames versioned to distinguish revisions.

References checked September 16, 2026: https://ogp.me/ for basic fields, image properties and alternative text; https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/ for a documentation-only follow-up commit marked `[skip netlify]` to avoid a redundant production deployment.
