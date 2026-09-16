# Public cream reading surfaces
September 16, 2026. Owner: Brice. Scope: speedandform.com public cream pages.

## Direction and scope
The approved homepage cream sections are the reference, not the former pale
Cormorant/Jost treatment. `css/cream-reading.css` supplies the same Georgia /
native-system-sans / system-mono stack, #ece6da paper, #11100e ink and #5f5a52
body color. Quiet labels use #69635b, not reduced opacity. Body text is normally
16–18px; labels never fall below 12px in the checked layouts.

The explicit 82-file manifest in `scripts/migrate-cream-reading.py` includes
Library and every destination it links, the public reference/practice pages,
Ghost pages, existing public athlete profiles, the Plans index and legal/help
pages. `html[data-cream]` opts them in. Homepage, dark plans, Labs, private
Console/athlete app, auth, checkout, analytics, media, redirects and native apps
are not migrated. Existing public data stays public; no new data is published.

Library rows stack their descriptions on phones and keep the entire row as a
link. Text is not faded to indicate subordination or completion. Weekday
columns have room for Wednesday; long reference rows wrap rather than clip.
The footer and closing boundaries have one divider, not two. Form controls
retain native behavior and visible keyboard focus. No new webfonts are needed.

## Two interaction defects found during the typography pass
- Search previously called `.map` on comma-separated keyword strings already
  present in `search-index.json`, throwing before any results could render.
  The reader now accepts arrays and comma-separated strings. The index and
  scoring weights are unchanged. These two parsing expressions are the only
  JavaScript-logic changes in this migration.
- The calculator cleared an inline `display:none` on success, but its base
  `.results` rule was also `display:none`. The shared stylesheet reveals the
  panel once result rows exist; explicit invalid-input hiding still wins.
  No calculation, pace formula or input logic changed.

## Acceptance checklist
- [x] All 82 pages opt into the shared stylesheet; every Library destination is covered.
- [x] Migration is idempotent. Text, URLs, metadata, actions and script logic
      compare with the baseline, except the two declared search expressions.
- [x] Local Chromium: all 82 pages at 320, 375, 390, 430, 768, 1024 and 1440 CSS
      pixels. No document overflow; no rendered HTML text below 12px.
- [x] Automated initial-state HTML text contrast at 390px, including ancestor
      opacity: at least 4.5:1 for normal text and 3:1 for large text. This is not
      a claim of a full WCAG audit or every possible dynamic-data state.
- [x] Visual inspection: Library desktop/phone; easy-running reference, practice
      board, mechanics map, calculator, plan, interruptions and catalog samples.
- [x] Calculator: 5K, custom distance and invalid input at four widths. Search:
      actual checked-in index and empty results. Plan: open/read/close drawers.
      Routine: active/done/reset. Body map: select/clear. Library: keyboard focus,
      200% text enlargement and 720-CSS-pixel / 2x-scale desktop zoom equivalent.
- [x] Local coaching-measurement and Thursday schedule regression checks.
- [x] Full-repository GitHub Actions run, including original homepage media/metadata.
- [ ] Main merge and production HTML/CSS receipt.
- [ ] Physical iPhone/iPad Safari and Instagram in-app browser review.

## Test boundaries
`tests/cream-reading.py` inlines the exact source CSS into Chromium. All network
requests are blocked. Search reads the checked-in index; remote data uses empty
fixtures. All API mutations are intercepted, including legacy bootstrap writes
against empty fixtures. No real inquiry, email, athlete edit or checkout is
submitted. History URL mutation is stubbed for the about:blank harness. Browser
viewport checks are not physical-device checks; fonts use the available OS
fallback, not an emulated copy of SF Pro or Georgia. Remote records, every
hover/data combination and full assistive-technology acceptance are not claimed.

## Release receipt
Implementation is staged until the exact merged commit and Netlify production
deploy have been read back. The isolated audit workflow is temporary and must
not remain as a self-modifying deployment workflow on main.
