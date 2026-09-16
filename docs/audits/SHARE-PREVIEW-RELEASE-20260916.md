# Share previews: Pass 1

Owner: Brice. Scope: the supplied Run Development image and static public-page link previews only. The single pass checklist remains `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Changes

84 public HTML sources are explicitly allowlisted in `scripts/share-metadata.cjs`. 73 receive the approved default; 11 retain their dedicated image URLs and original image bytes. The generated `SHARE-METADATA-MANIFEST-20260916.json` records each decision, previous/new URLs, titles, descriptions, image hashes and pre-edit body hashes. 91 excluded HTML files are hashed and remain unchanged, including private, athlete-specific delivery, Forge, previews and legal pages. Existing public seasonal pages retain their content and discovery rules; archiving is a later pass.

The owner-supplied image is resized to 1200 x 630, transferred as a checksum-verified WebP derivative and committed as an optimized progressive JPEG at `/og/form-share-20260916.jpg`. Original attachment: `FORM SEO.png`. No generated people or substitute photograph. Source derivative SHA-256: `bede66f42dfac48771fdc02bcaeed7d41752fef635a44f76697cef87a0122507`. Transfer fragments are deleted before the implementation commit. The old default asset remains available for older links and untouched surfaces.

One deliberate exception to retaining existing cards: `/plans/` used a card stating free to read/free to run, unsuitable as a blanket description after paid products launched. It now receives the approved image. Threshold, Long Run, Notes, HYROX, the study cards and the product-specific plan cards keep their own images.

Four Library preview descriptions were copied from the easy-days article despite different subjects. Only their Open Graph/Twitter descriptions are corrected. Article bodies and search descriptions are unchanged in this pass. Every other existing page-specific social title and description is retained, with missing social values filled from the page's existing search metadata. Existing canonical URLs and robots directives remain unchanged.

## Boundary proof

No layout, CSS, motion, navigation, sitemap, redirects, forms, newsletter, checkout, entitlement or athlete assignment changes. All page bytes from the closing head onward are hashed against their originals. Head scripts/styles are protected by the transformer; the homepage's existing WebPage image URL is the sole intentional JSON-LD change. The existing cream build pipeline remains unchanged. This is static served HTML, not client-side metadata injection.

## Checks

Local passes: share metadata; homepage metadata; homepage release; coaching measurement; cream-reading compatibility; Track standards; Thursday schedule. The GitHub workflow repeats these checks and attaches the exact tested commit, image and full replace/preserve manifest. It cannot push production: its source write is restricted to the isolated work branch. Release requires a separate reviewed merge.

The share tests check unique populated fields, image dimensions/MIME/bytes, title and image agreement, unchanged bodies, excluded-file hashes, retained dedicated URLs, idempotence, and fail-closed behavior for noindex or newly added dedicated images. Real iMessage/WhatsApp/Facebook previews are not tested by source validation. Source correctness is not a ranking or indexing guarantee.

## Deployment receipt

PENDING. The functional implementation is not live until the production deploy and representative served HTML/image are verified. Complete this section after release, not from the branch's existence.

## Maintenance

`node scripts/share-metadata.cjs` applies the explicit manifest; `node tests/share-metadata.cjs` verifies it. New pages and new dedicated images require an explicit review of the allowlist and preservation map. Do not apply a blind site-wide replacement or make this script change another stream's styles. Keep current image files versioned to distinguish revisions.

Primary references checked September 16, 2026: https://ogp.me/ (basic fields, structured image properties and alternative text). Native social cache refresh and app-specific presentation remain an external acceptance check.
