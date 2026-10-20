# Speed Demons: shared web and native album

Owner request: make the recovered eight-photo selection into a real Speed Demons album shared by the native app and mobile/desktop web. This is album publication work; it does not authorize publishing the separate homepage redesign in PR #326.

## Verified state · October 20, 2026

- All eight selected photographs are in `media/track-selection/`, `media/library/library.json`, `track/albums.json` and the generated `track/media-manifest.json`.
- The public website exposes them as the undated `/track/track-selection/` album, linked from `/photos/`.
- Live FORM Athlete System (`pbgsjjegycacodiltbhn`) has zero collective album drafts, states, revisions and gallery-media rows. No matching Speed Demons or September 24 run was found. Do not claim app publication or create duplicates without rechecking current state.
- Attached HTML is a simulation. Its Published label is not a publication receipt.
- Seven source images match the attachment byte-for-byte. Frame 5701 is the same photograph in a fuller 1000×666 repository frame; the supplied attachment crops it to 1000×520. Keep the fuller existing frame. These are recovered web images, not camera originals.

## Prepared selection

Use sibling `speed-demons-album-import.json` for paths, SHA-256, dimensions, alt text and exact order: **5728, 8046, 8045, 8058, 8044, 5701, 8057, 8080**. Cover: **5728**. Layout: `photo_essay`; appearance: `cream`. Keep 8069 (date unconfirmed) and 8097 (minors’ names) excluded. Do not add mockup captions or presentation narration.

## Fact to resolve before writing a run or publishing

The mockup labels the session September 24, 2026 at Flamingo Park. The recovered gallery intentionally asserts no date. Obtain Brice’s confirmation or authoritative capture/run evidence. Do not invent a start time or fabricate a historical run merely to satisfy a foreign key. Reuse the real occurrence if it exists; otherwise use the established historical-session workflow with confirmed details.

## Execute through the existing shared publisher

Web implementation: `coach/runs/runs.js`. Native contract: `FORM/Collective/FORMCollectiveAlbum.swift` in `Breechay/FORM-iOS`. Review current branches and existing backend functions before changing code.

1. Read the current run/album state, including conflict versions. Use the authenticated publisher path, not direct writes that bypass date/eligibility/version guards.
2. Import existing source JPEGs into `collective-gallery-drafts` at the server-approved paths and register matching `collective_roll_assets`. Preserve source identities/provenance; do not upscale or generate pixels. Confirm capture day through the publisher’s supported workflow only after factual confirmation.
3. Save the ordered eight items with `collective_album_save_draft(run, expected, items, layout, appearance)`.
4. Call `collective_album_stage_paths`, copy to the returned paths in `collective-media`, then call `collective_album_publish(run, expected)`. Do not manufacture a live revision or storage path.
5. Ensure website and native Archive read that same published run/revision. Retain or redirect `/track/track-selection/` so existing links work; avoid presenting duplicate albums.
6. Verify cover, eight-frame order, full heads, cream layout, viewer/swipe/download behavior, reduced motion and revoked-photo handling. Confirm on desktop/mobile web and a real signed-in native session. Never report a mock fixture or successful build as device publication.
7. Return the actual run ID, revision, public URL, native verification evidence and any release needed for the installed app.

## Scope and status

Prepared manifest only. No database rows, storage objects, gallery titles, live routes or app releases were changed by this handoff. Publication remains pending the run/date fact and authenticated import. Homepage PR #326 is separate and must not be merged incidentally.
