# Claude handoff · Website conversion entry

**Review date:** October 26, 2026  
**Repository:** `Breechay/speedandform`  
**Scope:** Homepage, short-phone opening, `/coaching/apply/`, the conversion roadmap. This is a review assignment, not permission for a second routine production deploy.

## Why this changed

A visitor arriving without a referral should meet Brice, understand the offers, find verifiable training evidence and choose the appropriate inquiry without discovering a hidden dropdown. Keep the site's photographic theater, real athlete records and sparse first-person voice. See [the roadmap](../roadmap/WEBSITE-CONVERSION-ENTRY-2026-10-25.md).

## Inspect in this order

1. Check production SHA and actual Netlify deploy receipt; do not infer publication from a PR merge. Compare the live site with the release branch.
2. On 320×568, 375×667 and 390×844, verify `Work with me` is fully readable, tappable and above the entering track bend on the initial viewport. Also inspect 1024 and 1440 and the quiet/reduced-motion state. The nine-lane bend must remain continuous.
3. Inspect the cream introduction and training paths for composition, photographic headroom (at least 8% and 40px), readable ink/bone typography, no duplicate dividers and no horizontal overflow at 200% zoom. The existing portrait is reused on mobile; decide if that repetition is visually satisfying.
4. Open `/coaching/apply/` on phone and desktop: both Miami and remote routes visible simultaneously, keyboard/radio access, no-JavaScript native select fallback, accurate submitted offer on the review screen, no real inquiry submission during QA. Preserve accepted-only receipt, spam/privacy and attribution behavior.
5. Compare each homepage destination with its actual current contents and terms. In particular, remote fee is currently discussed before starting. An obsolete commercial generator describes it differently; do not publish that old generator's promise.
6. Recheck `/athletes/` links and José's published study; describe reproducible failures only. No testimonials, quotes or results were fabricated. Permissioned athlete stories remain the next release.
7. Review whether the new copy and hierarchy actually help an unfamiliar search visitor while satisfying public copy law. Avoid generic sales-page additions or another URL duplicated as a promo door.

## Evidence and focused tests

- Source contract: `node tests/home-conversion.cjs`.
- Responsive interception suite: `tests/public-entry-browser.cjs` now checks short-phone hero clearance and both application choices; `site-menu.yml` runs it on Chromium and WebKit for pull requests.
- Full Netlify build command in `netlify.toml`; the October 25 local run passed. Builders regenerate many unrelated pages, so do not commit that incidental output without separate review.
- Existing `tests/commercial-release.cjs` is stale: it expects a homepage form removed before this change. Do not label that baseline assertion a new regression.

## What to report

Return a short **ship / fix / defer** verdict for each changed surface. Name the exact SHA checked, browser dimensions, first paint and interactions observed, failed selectors with evidence, and the production deploy receipt if published. Make small, coherent fixes in the owning source and one review PR if needed. Do not silently add a second production deploy.
