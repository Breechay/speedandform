# Coaching selector refinement

September 16, 2026. Scope: the homepage's existing coaching selector only.

## Release state

**LIVE; production deployment and desktop interaction verified.** Release commit
`bfb2803556d8c0abe46ea642579aff55ae41f613`, merged through PR #121. Baseline main:
`fd18f73494280c4c87e841850714c8db9bfea390`. Work branch:
`work/coaching-selector-20260916`. Concurrent reading-page work from PR #120 was
inspected and preserved; its build explicitly excludes the homepage.

Netlify production receipt: project `zingy-speculoos-16852a`, site
`f3914a6a-a9ce-465e-8212-f5f42597c469`, deploy `6aaaf0aed76daa00098d6d0b`, state
`ready`, commit ref matching the release, published `2026-09-16T19:40:45.873Z`.
The receipt was read from the deployment service, not inferred from the merge.

GitHub Actions run `35141629782` passed the selector suite, all 17 existing
homepage browser checks, and static regression tests before merge. The temporary
verification workflow was removed before release. Seven intended files changed.
The independent live desktop smoke test confirmed the cream popup, all three
service selections updating the trigger, Escape dismissal and no visible clipping.
No new offer, price, form step or analytics event. No real inquiry email sent.

## Change

The user requested replacing the dark operating-system popup and heavy double
outline shown in their screenshots. The enhanced field now uses the homepage's
paper and ink tokens, a single frame, service names above fee/duration, a quiet
checkmark, larger option rows and a matching popup. The running option is named
Run Development on this visual surface. Original select values, fees and email
payloads remain unchanged. Existing coaching links dispatch the same change event
as a direct selection, keeping the trigger and inquiry review synchronized.

The native select remains the source of truth and a fallback when the enhancement
is unavailable. It is hidden only after the replacement is ready. Keyboard:
Enter/Space, arrows, Home/End, type-ahead, Escape to cancel, Tab to commit and leave.
Outside clicks dismiss. A single-edge focus indicator remains visible. The popup
fits available viewport space and can open upward. Reduced motion is respected.

Reference: WAI-ARIA APG select-only combobox pattern:
https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
This implementation is not a claim of screen-reader certification.

## One acceptance checklist

- [x] Open/closed layout at 320, 390, 430, 768, 1024 and 1440 CSS pixels in Chromium.
- [x] Popup within viewport, no horizontal overflow; selected name/price synchronized.
- [x] Keyboard navigation, cancellation, Tab, type-ahead and outside dismissal.
- [x] All three existing coaching links update the visible selection.
- [x] Review and intercepted submission preserve the selected service and price.
- [x] Emulated touch selection; native select fallback without enhancement.
- [x] Existing metadata, measurement and release-invariant Node tests.
- [x] Verify published deploy, exact release and live desktop selector interaction.
- [ ] Physical iPhone/iPad Safari and VoiceOver. Emulation is not a physical test.

Tests: `python tests/coaching-choice-browser.py`, `python tests/homepage-browser.py`,
`node tests/homepage-release.cjs`, `node tests/homepage-metadata.cjs`,
`node tests/coaching-measurement.cjs`. Browser tests intercept all requests;
no real inquiry email is sent. Test artifacts stay in `.homepage-qa/`.
