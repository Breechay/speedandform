# Public discovery: Pass 2

Owner: Brice. Scope: navigation, Library discovery, local search, canonical URLs, sitemap, crawl directives and the missing-page experience. The single checklist remains `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release receipt

**LIVE September 17, 2026 at 01:41:38.556 UTC (September 16 at 9:41 PM in Miami).** PR #123 merged as `06b487cd7776813fbf139b2665028bdcfa086595`. Netlify production deploy `6aab454727ac1b000895ccc2` is ready on existing site `f3914a6a-a9ce-465e-8212-f5f42597c469`, and its deploy record names that exact commit. The existing main-branch publish performed the release. No additional manual deployment was triggered.

Final read-only branch CI `35171404323` passed on `b7123bb9af141e61932b6a4055b63dddea4e57c4`. Merged-main CI `35171527097` passed eight source suites, 61 discovery browser checks and 17 existing homepage/intake/media checks, then verified the actual public site. The discovery HTTP run began at `2026-09-17T01:42:44.519Z` and completed at `01:42:52.862Z`: **70 public canonical pages, six exact public resources and six route checks passed, with no readiness retries.** The sharing recheck then verified 19 public pages and all 10 distinct image URLs, finishing at `01:43:01.765Z`, also with no retries. Artifact `10476259524`, `discovery-receipt`, contains the source commit, manifest, source-test output, browser results, screenshots, `production.json` and `share-production.json`. Retention is 14 days; this document preserves the release facts.

The six live resources matched committed SHA-256 values: `robots.txt`, `sitemap.xml`, `search-index.json`, `css/discovery.css`, `js/discovery-search.js` and the unchanged `css/cream-reading.css`. Every sitemap page returned HTTP 200, had exactly one explicit canonical element matching its sitemap address, and retained its intended indexing eligibility and page-specific sharing metadata. The live Library contained all 46 static catalog links.

The two deliberately missing paths, `/page-does-not-exist-pass2-20260916` and `/library/no-such-page-pass2`, returned **HTTP 404** with the new page. `/app` and `/app.html` returned **HTTP 301** to `/form/`. `/search?q=hyrox` returned the new search surface with `noindex,follow`; `/plan-spring-2026` returned its original record with the historical-context note. These are actual production response checks, separate from local route emulation in the browser suite.

**51 HTML sources have scoped edits; 124 HTML sources remain byte-identical.** Source comparisons protect the original article content, functional scripts, cream styling/build, homepage media and measurement, plan source and deployment configuration. All Pass 1 sharing images remain unchanged. No real inquiry, email, payment or analytics event was submitted. Physical iPhone/iPad, Safari, screen-reader operation and native social-card rendering remain unverified. No indexing, ranking or conversion gain is asserted.

## What changed

The Library opens with an athlete's question, not the site's internal taxonomy. Six sections link to 46 reviewed public resources: starting questions; pace and training; running form and strength; race preparation; recovery; plans, studies and the practice. A single reviewed catalog supplies the static Library links, search index and structured ItemList. The final mobile navigation uses Library, Plans, Run with us and Work with Brice; the compact topic grid brings the first useful guide onto a 390-pixel phone-width screen. These are browser viewport observations, not physical-device claims.

Search uses page-specific descriptions and keywords rather than the older mixed page/fragment index. It supports query URLs, small typing errors, keyboard use, clear and browser history. Search strings enter the DOM through textContent, not innerHTML. Network failure is visibly different from no matching results, with retry and a Library fallback. The full Library remains navigable without JavaScript. No third-party search or search-query analytics were introduced.

The homepage receives a visible Library link on mobile and a current track link in the footer. Reviewed guide pages receive the same four public routes without removing their existing navigation, article content, anchors or scripts. The new 404 page offers search and useful destinations; it no longer says all plans are free. Netlify's real 404 responses passed the production checks above.

Nine missing canonical tags are supplied: eight newer Library articles and the existing Forge landing page. Forge's body, imagery, styling and product claims are unchanged. Four Library search descriptions are aligned to the corrected, already-approved social descriptions. The two-paces catalog entry describes the actual article: threshold and an easy-effort ceiling, not threshold and race pace.

The sitemap uses 70 distinct, reviewed canonical URLs. It adds the current plans, Labs and newer Library material, and omits search results, private/delivery paths and old seasonal instructions. It does not invent last-modified dates. Ten historical pages remain at their original URLs with a clear context note and paths to current track details and published plans. No historical page was deleted. Removing a sitemap entry is not an indexing-removal claim.

The old `/app` and `/app.html` entry points explicitly redirect to `/form/` rather than allowing an obsolete static page to shadow the destination. No other duplicate consolidation is inferred merely from similar titles. Rendering assets are no longer blocked in robots.txt. Search and error pages carry noindex; operational source directories carry noindex headers. These directives are not access control and do not replace authentication.

## Acceptance and boundaries

Eight source suites cover discovery, shared images, homepage metadata/release, measurement, cream reading, Track standards and Thursday scheduling. A versioned manifest records before/after hashes for the scoped HTML edits and untouched HTML. Article content is compared with the stable published baseline after removing only the documented navigation and historical-context additions. Functional scripts and protected styling, measurement, prescription and deployment files are compared byte for byte. Pass 1's historical receipt is not rewritten; later approved snapshots are checked independently.

The browser suite covers six discovery widths (375, 390, 430, 768, 1024 and 1440), 200% zoom on the new pages, keyboard movement, query navigation, typo/no-result/error/retry states, safe rendering and no-JavaScript fallback. The existing homepage suite separately exercises eight widths, film motion controls, disclosures and the complete intake with intercepted success, rejection, network failure and timeout responses. No real inquiry, email, payment or analytics event is submitted.

Screenshots from the first pass revealed oversized mobile navigation/topic space; those were refined and rechecked. Source tests require explicit canonical elements rather than accepting a helper's fallback URL as evidence that a tag exists. Final CI is read-only and was verified on the branch before merge and again on merged main. The temporary branch-only source-writing bootstrap is not a production build dependency.

Article rewrites, gallery publishing, app redesigns and newsletter delivery are not part of this pass. The next bounded scope is Pass 3, the track gallery, not yet implemented.

## Maintenance

Edit `scripts/discovery-catalog.cjs`, then deliberately regenerate with `node scripts/build-discovery.cjs`, review the exact diff and run the acceptance suite. Do not automatically sweep folders: unlisted athlete delivery is not public discovery. The catalog and generated sources are committed; the existing Netlify cream build is unchanged. Later editorial passes should preserve the release receipts and record their own reviewed content changes instead of weakening the historical checks.

## Technical references

- Google Search Central, robots meta tags and X-Robots-Tag: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google Search Central, noindex requires crawl access: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google Search Central, sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Search Central, canonical URL consolidation: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Netlify redirect options, file shadowing and custom 404 pages: https://docs.netlify.com/manage/routing/redirects/redirect-options/

The existing sitemap address is already registered in the connected Search Console property. Its reported last download predates this release; no recrawl, indexing receipt or new submission is claimed.
