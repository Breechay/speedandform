# HYROX search and share audit
Reviewed September 14, 2026. Route: `/labs/hyrox/`.

## Findings and changes
- Canonical URL, index directive, sitemap entry dated September 14 and Labs internal link already exist.
- Missing dedicated Open Graph image and Twitter card metadata: add a versioned 1200×630 PNG with title, description, dimensions, MIME type and alternative text.
- Description lagged behind training and race-day additions: align title, search description, social copy and existing WebApplication description with the actual page.
- Preserve the existing calculator schema without promising enhanced search results or inventing ratings.
- Use American practice/practiced/practicing throughout the page and audit notes; standing rule added to AGENTS.md.
- Roadmap now opens with a current checkpoint rather than historical September 12 status.

## Verification
Static checks: one canonical/title/description/image/card; JSON-LD parses; original body unchanged except spelling; share image dimensions 1200×630. Render inspected before publication. Production receipt and deployed metadata/image verification recorded in the release PR.

## Remaining
Physical phone/iPad visual acceptance; real messaging-app cached preview; search indexing/ranking not proven by metadata changes. No Search Console submission or indexing guarantee. Saved records remain browser-local. Next content iteration should use actual observed training evidence.

## Sources
- https://ogp.me/ — Open Graph image metadata and alternative text.
- https://developers.google.com/search/docs/appearance/title-link — clear descriptive titles.

## Share card source
`scripts/render-hyrox-share.py` renders `og/hyrox-v1.png` from the site's Inter font. Requires Pillow, fonttools and Brotli. Change the image filename when artwork changes so old social caches have a new asset URL.
