# Homepage: one runner, one coherent coaching path

Date: September 16, 2026. Owner: Brice. Scope: public homepage only.

## Release state

**IMPLEMENTED AND TESTED; production verification pending.** The deployment receipt will be recorded here after the actual production check. Source baseline: `996b879d7ae2b8a4538feaa9e1d8d14e021efe71`. Working branch: `work/homepage-single-runner-20260916`.

## Decisions

The user approved the square single-runner review and authorized homepage editorial, visual, motion and acquisition refinements. Keep the original hero film; replace the Coaching photograph, not the hero, with the approved 512 x 512 / 6.7-second clip. No new Analysis product, subscription, price, result claim or medical promise is published.

The page now follows: outcome and coaching scope, existing published result, method, observed running, an optional readable week example, the managed coaching offer, inquiry. Recognition comes from plain running language and concrete coaching actions rather than invented psychological claims or scarcity. The available inquiry sample is too small to validate conversion claims; the known internal test lead was excluded from reasoning. No private inquiry contents or contact details were added to the public page or this audit.

Run Development remains $1,200 for eight weeks of Miami coaching. Run + Strength remains $1,800 with the existing scope, disclosed when relevant. Remote coaching routes to a fee discussion. The complimentary Miami assessment is part of discussing an ongoing relationship, not a new paid-analysis deliverable. Existing published Simon evidence retains its moving-time provenance and direct source link.

## Execution

- Native result HTML and stylesheet replace the presentation mutation formerly inside analytics JavaScript. Measurement retains the production/privacy guards, accepted-relay conversion gate and no-intake-fields rule.
- Square review preserves full-body context. It has a poster and explicit Play/Pause control. Both films pause offscreen and when the tab is hidden. Automatic motion is suppressed for reduced-motion and data-saving preferences; manual playback remains available.
- Coaching has desktop side-by-side composition and phone heading, review, explanation order. Tablet widths keep useful columns where they fit. Typography, offer hierarchy, form controls and footer use one consistent spacing and divider system.
- The training disclosure is an explicitly illustrative week, not an invented app feature or a generic prescription. Simulated phone chrome and tiny screenshot text are removed.
- The nonfunctional attachment prompt and disabled Netlify backup POST are removed. The confirmed opaque FormSubmit delivery endpoint, compact notification, athlete Reply-To and email fallback are preserved. Sending has a timeout, clear state, valid-email check and retry. No real test email was sent.
- Search metadata, share card, plan purchases, auth, private athlete pages, Meta campaigns and budgets remain unchanged.

## One acceptance checklist

- [x] Inspect homepage and all section layouts at 320, 375, 390, 430, 768, 820, 1024 and 1440 CSS pixels in local Chromium rendering.
- [x] Open training and strength disclosures at every width; no horizontal page overflow.
- [x] Check a 720-CSS-pixel layout corresponding to a 1440-pixel desktop at 200% zoom. This is a responsive-layout equivalent, not a physical browser zoom certification.
- [x] Complete all five inquiry steps, invalid email, multi-choice exclusion, change-answer loop and offer switching.
- [x] Mock accepted, rejected, network-failed and timed-out delivery. Confirm success only after acceptance, one request, failed-send recovery and no lead on failure.
- [x] Confirm user-entered markup remains text in the review; no executable image is inserted.
- [x] Decode and play the actual 512-square MP4. Confirm manual playback under reduced motion, user pause across scrolling, offscreen pause and preference-change stop.
- [x] Check no-JavaScript contact fallback and keyboard skip-link focus.
- [x] Run `node tests/coaching-measurement.cjs`, `node tests/homepage-metadata.cjs`, `node tests/homepage-release.cjs`.
- [ ] Verify production release, homepage markers and first-party media URLs after merge.
- [ ] Physical Safari/iPhone/iPad and Instagram in-app inspection. Local Chromium viewport checks do not close this item.
- [ ] Observe real post-release inquiry and conversion quality. No uplift or quality score claimed from these tests.

Browser checks: `python tests/homepage-browser.py` (requires Python Playwright and Chromium; `CHROMIUM_PATH` may select an installed executable). The test renderer inlines local public assets and intercepts submissions. It does not require production access or send email. The generated `.homepage-qa/` directory is local test output, not part of the website release.

Approved MP4 SHA-256: `fa59a9cfb605b8cf68ac5eee6362e479c75a0739b29b8af3c0ba9ad9280698a1`.
