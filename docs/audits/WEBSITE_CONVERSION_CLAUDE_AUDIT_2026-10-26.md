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
- The older `tests/public-finish-browser.cjs` likewise expected `#coachingChoiceTrigger`. This release updates its keyboard/receipt test to the two radios. Confirm the updated CI result rather than citing the initial failed run.
- First Chromium screenshots confirmed button clearance at the three short-phone sizes. A double selected-card focus border shown after pointer selection prompted a CSS focus-visible refinement; check the final version, not just the first artifact.

## What to report

Return a short **ship / fix / defer** verdict for each changed surface. Name the exact SHA checked, browser dimensions, first paint and interactions observed, failed selectors with evidence, and the production deploy receipt if published. Make small, coherent fixes in the owning source and one review PR if needed. Do not silently add a second production deploy.

## Claude audit result · October 26, 2026

Checked `782f4b8` (main; no website-file diff from release `b8e2a49`). Live homepage copy read back matches the release. Netlify deploy receipt not independently readable from the audit session.

| Surface | Verdict | Evidence |
|---|---|---|
| Short-phone hero | Ship | Work with me ends above the first lane at 320×568 (361 < 395), 375×667 (441 < 494), 390×844 (581 < 650); also 1024 and 1440, reduced motion identical. Tap target hit-tests to the link. |
| Introduction portrait | Fixed | The 40px ink pad read as a letterbox above the photograph. A top gradient now carries the ink into the night sky; headroom unchanged. Mobile repeats the hero file; kept, because the film replaces the hero photograph after load. |
| Ways to train | Fixed | Plans implied Race Pace That Lasts was free; now shows $79. Thursday matches the menu and page: Thursday sprints, Flamingo Park, 6:00 AM. |
| Application | Ship | Both routes visible at 390 and 1440; arrow keys move selection and the select follows; pointer selection leaves no focus ring; keyboard ring is the intended focus indicator. No-JS shows the email fallback. Remote fee wording matches the review screen. |
| Athletes / José | Partial | Static links on /athletes/ and José's study pages resolve. Live roster is loaded from the database and was not reachable from the audit session. |

Pre-existing, not from this release: `tests/sf-bend.cjs` fails on main (counts two bends); not in the Netlify build chain.
