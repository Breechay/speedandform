# Public discovery: Pass 2

Owner: Brice. Scope: navigation, Library discovery, local search, canonical URLs, sitemap, crawl directives and the missing-page experience. The single checklist remains `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release receipt

IMPLEMENTED ON THE ISOLATED BRANCH; production verification pending. Do not interpret these source changes or screenshots as a production receipt. Final commit, pull request, deployment and live verification will be recorded here after release.

## What changed

The Library opens with an athlete's question, not the site's internal taxonomy. Six sections link to 46 reviewed public resources: starting questions; pace and training; running form and strength; race preparation; recovery; plans, studies and the practice. A single reviewed catalog supplies the static Library links, search index and structured ItemList. The final mobile navigation uses Library, Plans, Run with us and Work with Brice; the compact topic grid brings the first useful guide onto a 390-pixel phone-width screen. These are browser viewport observations, not physical-device claims.

Search uses page-specific descriptions and keywords rather than the older mixed page/fragment index. It supports query URLs, small typing errors, keyboard use, clear and browser history. Search strings enter the DOM through textContent, not innerHTML. Network failure is visibly different from no matching results, with retry and a Library fallback. The full Library remains navigable without JavaScript. No third-party search or search-query analytics were introduced.

The homepage receives a visible Library link on mobile and a current track link in the footer. Reviewed guide pages receive the same four public routes without removing their existing navigation, article content, anchors or scripts. The new 404 page offers search and useful destinations; it no longer says all plans are free. Netlify's real 404 response is a separate production acceptance check.

Nine missing canonical tags are supplied: eight newer Library articles and the existing Forge landing page. Forge's body, imagery, styling and product claims are unchanged. Four Library search descriptions are aligned to the corrected, already-approved social descriptions. The two-paces catalog entry describes the actual article: threshold and an easy-effort ceiling, not threshold and race pace.

The sitemap uses 70 distinct, reviewed canonical URLs. It adds the current plans, Labs and newer Library material, and omits search results, private/delivery paths and old seasonal instructions. It does not invent last-modified dates. Ten historical pages remain at their original URLs with a clear context note and paths to current track details and published plans. No historical page was deleted. Removing a sitemap entry is not an indexing-removal claim.

The old `/app` and `/app.html` entry points explicitly redirect to `/form/` rather than allowing an obsolete static page to shadow the destination. No other duplicate consolidation is inferred merely from similar titles. Rendering assets are no longer blocked in robots.txt. Search and error pages carry noindex; operational source directories carry noindex headers. These directives are not access control and do not replace authentication.

## Acceptance and boundaries

Eight source suites cover discovery, shared images, homepage metadata/release, measurement, cream reading, Track standards and Thursday scheduling. A versioned manifest records before/after hashes for the scoped HTML edits and untouched HTML. Article content is compared with the stable published baseline after removing only the documented navigation and historical-context additions. Functional scripts and protected styling, measurement, prescription and deployment files are compared byte for byte. Pass 1's historical receipt is not rewritten; later approved snapshots are checked independently.

The browser suite covers six discovery widths (375, 390, 430, 768, 1024 and 1440), 200% zoom on the new pages, keyboard movement, query navigation, typo/no-result/error/retry states, safe rendering and no-JavaScript fallback. The existing homepage suite separately exercises eight widths, film motion controls, disclosures and the complete intake with intercepted success, rejection, network failure and timeout responses. No real inquiry, email, payment or analytics event is submitted.

Screenshots from the first pass revealed oversized mobile navigation/topic space; those were refined and rechecked. Source tests also require explicit canonical elements rather than accepting a helper's fallback URL as evidence that a tag exists. Final CI is to be read-only before merge. The temporary branch-only source-writing bootstrap is not a production build dependency.

Physical iPhone/iPad, Safari, screen-reader operation and native social-card rendering remain unverified. Article rewrites, gallery publishing, app redesigns and newsletter delivery are not part of this pass. Ranking, indexing or conversion gains are not asserted.

## Maintenance

Edit `scripts/discovery-catalog.cjs`, then deliberately regenerate with `node scripts/build-discovery.cjs`, review the exact diff and run the acceptance suite. Do not automatically sweep folders: unlisted athlete delivery is not public discovery. The catalog and generated sources are committed; the existing Netlify cream build is unchanged. Later editorial passes should preserve the release receipts and record their own reviewed content changes instead of weakening the historical checks.

## Technical references

- Google Search Central, robots meta tags and X-Robots-Tag: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google Search Central, noindex requires crawl access: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google Search Central, sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Search Central, canonical URL consolidation: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Netlify redirect options, file shadowing and custom 404 pages: https://docs.netlify.com/manage/routing/redirects/redirect-options/

The existing sitemap address is already registered in the connected Search Console property. Its reported last download predates this release; no recrawl, indexing receipt or new submission is claimed.
