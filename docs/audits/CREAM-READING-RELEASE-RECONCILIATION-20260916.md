# Cream reading release reconciliation

September 16, 2026. This note qualifies the release state in CREAM-READING-20260916.md on this branch.

## Verified production, not this staging branch

When Brice approved making the cream redesign live, remote main already contained the parallel cream-reading release from PR #120. It uses scripts/build-cream-reading.cjs and css/cream-reading.css and covers 66 public reading pages. Its production receipt is docs/roadmap/CREAM-READING-20260916.md on main.

The current production deployment was read directly from Netlify:
- Site: f3914a6a-a9ce-465e-8212-f5f42597c469 (speedandform.com).
- Deploy: 6aaaf0aed76daa00098d6d0b.
- Source commit: bfb2803556d8c0abe46ea642579aff55ae41f613.
- Context: production; state: ready; published 2026-09-16T19:40:45.873Z.
- This is the newer homepage coaching-selector release, which explicitly preserves PR #120's cream-reading work.

Live browser acceptance was repeated after the approval in run 1b15a525-ff0a-4532-96fa-63f47267cb20, completed successfully. Library, Fueling and Split Calculator all showed warm cream backgrounds, dark serif headings and readable dark sans-serif text. Library navigation to the other two pages worked. Split Calculator with 5K / 20:00 returned 4:00/km, 6:26/mi and 1:36/400m. No clipping or broken links was observed in these tested views. This live check did not resize or measure the viewport; it is not a physical-phone/Safari test or a full-site accessibility claim.

## Preserve concurrent work

The 82-page source-migration implementation on work/cream-reading-20260916 is NOT the deployed release. It remains unmerged. In particular, both approaches write css/cream-reading.css but use different opt-in attributes and tokens; do not merge this branch blindly over main's build-time migration. Any future wider migration must explicitly reconcile both implementations and preserve the newer homepage selector and build command. No duplicate deployment or overwrite was initiated during this reconciliation.

The completed temporary self-modifying review workflow was removed in b29933511d6c704f1a6bab9f4431d2b7c91187cc. The earlier full-repository test result remains recorded for the staging implementation, but it must not be described as evidence that all 82 staged pages are live.
