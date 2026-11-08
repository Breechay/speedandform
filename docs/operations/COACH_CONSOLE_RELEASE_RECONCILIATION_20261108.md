# Coach Console release reconciliation · November 8, 2026

## Scope and source

- Console design candidate: `codex/console-week-density-20261108`, [PR #541](https://github.com/Breechay/speedandform/pull/541), initial GitHub tree `452171871a87da3d57b97a11c28c10463f2def50`.
- Production source at reconciliation: `759f0e1ba60287b37355ae619a6cddee586964b7`.
- Main source at reconciliation: `2f9c0a731eb84ffab7cb808b0e241fdf87cc24c4`.
- This reconciliation retains both histories and the production editorial-correction tools. It does **not** delete the 322 protected historical versions or make an athlete prescription change.

## Conflict resolution

1. Coach programming imports retain `scheduleTrainingBlock` from production and all console editor/view imports.
2. Coach header retains the production editorial-correction link. Combined CSS and script references are versioned anew for browser refresh.
3. Shared light workspace CSS retains the new measured editor, dense week and meetup hierarchy while preserving the production future-block picker.
4. The legacy vocabulary incident record keeps the later production incident and signed-in correction release alongside earlier historical audit language.
5. The Method Bible static page is regenerated from its current owning source so the published chapter includes the newer distance progression and does not fall behind its source.

## Local evidence

- Focused console/navigation, future-block, authenticated editorial-compensation, invitation and publish-queue tests: **31 passed**.
- Coach workspace/Method Bible, FORM Miami, editorial and copy tests: **13 passed**.
- Public study-preview and public-copy contract checks: passed.
- Configured Netlify build command completed (0 hard integrity errors; existing link/font warnings remain).
- Corrected two stale test assumptions: one truncated scheduler SQL before the cron registration, and the other demanded the old CSS cache version.
- GitHub's browser audit found Method Bible horizontal overflow at narrow widths. Initial reports listed offscreen shared-menu descendants; clipping and hiding the drawer did not change the overflow, and hiding it also disturbed the entrance transition. Investigation identified literal Markdown links to long internal coaching-document filenames in newly authored Method Bible paragraphs, which the deliberately restricted public renderer does not convert to links. The internal path references are now removed from public copy, the Method Bible is regenerated, and shared-menu CSS is restored to its original behavior. Browser recheck remains required before release.
- Existing `miami-community-schedule.cjs` `sf-brand-name` assertion fails against an unchanged public page; it is not a console regression.

## Release state and remaining acceptance

At authorship this is **source-ready, not deployed**. A GitHub integration PR, merge, prescribed production-branch release, exact Netlify receipt, and signed-in coach/browser visual inspection are still required. Do not close the design based on tests alone. Verify desktop and narrow-width athlete rail, 15-week index, group review, meetup selector, account actions, future-block picker and editorial-correction access. No athlete data should be published merely to exercise the UI.
