# Public house integrity

This guard protects the public Speed & Form site from quiet drift as the house grows.

Run it locally with:

```sh
node scripts/check-house-integrity.cjs
```

It also runs on relevant pull requests, on pushes to `main`, and at the end of the Netlify build.

## Hard failures

The check blocks a change when it finds:

- a sitemap route that does not resolve;
- duplicate sitemap routes;
- a searchable page that is missing from the sitemap or does not resolve;
- duplicate search URLs or titles;
- a sitemap page marked `noindex`;
- missing title, description, canonical or required share metadata on an indexable page;
- a public Open Graph site name that has drifted back to `FORM` instead of `Speed & Form`;
- canonical and Open Graph URL disagreement;
- a broken internal link from an audited public page;
- a public-share manifest entry whose page or committed share image is missing.

## Advisories

The report also calls out issues worth reviewing without blocking a release:

- legacy text wordmarks or old wordmark classes;
- external Google Fonts on audited public pages;
- canonical routes that do not line up cleanly with sitemap routes;
- share images that use a different origin or differ between Open Graph and Twitter;
- broken static fragment targets;
- indexable pages with no inbound link and no search entry.

These advisories are deliberately visible rather than silently grandfathered. Some special product or study surfaces may keep a distinct visual world, but any exception should remain intentional.

## Scope

The sitemap is the authority for indexable public pages. Search adds a second contract: every search result must be real and sitemap-backed. A small set of public non-index pages, including Search, 404, Support and FORM House, is also audited for basic identity drift and links.

Private athlete, coach, auth and application surfaces are not pulled into this public-house guard. They have their own release checks.
