# Track gallery: Pass 3

Owner: Brice. Scope: public photo/film gallery and its bounded discovery integration. The single release register is `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release state

Implemented on `work/track-gallery-pass3`. Not yet merged or production-verified. Final read-only CI, visual review and production receipts must close before this is called LIVE. This record supersedes earlier chat status, not the Pass 1 or Pass 2 historical evidence.

## What is implemented

`/track/` introduces the selected albums. `/track/from-practice/` is the initial, clearly undated selection, with four existing public photographs and one existing silent clip. It is not presented as a newly photographed session. Existing source media remain unchanged; the gallery creates reviewed JPEG editions and a photo ZIP. Reuse authority is the owner's original gallery request and the existing public placements, not an invented individual model-release record.

The album offers individual photo/film downloads, a photo ZIP, native-share/copy/manual-copy paths, shareable frame hashes, a full-screen dialog, previous/next and keyboard/touch navigation, loading-failure recovery, browser history and focus restoration. Film bytes are requested only when the film is opened and playback is not automatic. Opening/closing a film removes and stops its media element. Real file links and downloads remain without JavaScript. No signup, email list, account, analytics or comment layer was introduced. Photo-removal contact is included.

The owner's final refinement removes the public signup reassurance, technical download disclaimer and the “Silent film. Play to watch.” instruction. The “Running, in motion” title, useful save action and simple play/duration affordance remain. The thumbnail is an authentic 6.3-second frame chosen after reviewing film samples; the whole portrait composition is preserved instead of cropping away heads or feet. The selected thumbnail is also used in the player. `posterTime` and checksum-verified `posterSource` are publishing settings; there is no on-site visual thumbnail picker yet.

The catalog adds one gallery entry (47 resources) and two canonical pages (72 sitemap URLs). Only the Library catalog link and Thursday's gallery wayfinding change existing page bodies. No homepage, article, cream/Labs/app styling, coaching intake, payment or athlete-record changes are included. Historical Pass 1/2 receipts remain intact.

## Acceptance

Nine existing/source suites plus thumbnail-selection validation; gallery, discovery and homepage browser regressions; before/after source boundaries; no-JavaScript access; actual ZIP/JPEG/MP4 bytes; keyboard focus/history and media cleanup. The earlier fixed 46-link Library assertion is replaced with exact equality against the reviewed catalog URLs, not loosened to accept any count. Missing, ambiguous, nonfinite and out-of-range thumbnail selections are rejected. Custom images require their reviewed checksum.

CI is read-only before release. The temporary branch-only conversion script and source-writing step are removed. The existing Netlify build remains unchanged; generated pages and media are committed deliberately. Production verification checks exact deployed media/resource hashes and page metadata, then exercises the real gallery in Chromium. Do not equate simulated touch/viewport tests with physical iPhone/iPad or native share-sheet acceptance.

Physical Safari/iPhone/iPad, screen-reader operation and external native sharing/cache rendering remain unverified. New dated albums still require the owner's actual selected media and publication authority. No ranking, indexing or conversion improvement is asserted.

## Maintain

See `docs/publishing/TRACK-GALLERY.md` for selected media, timestamp/custom thumbnail choices, regeneration, publication and removal. Public downloads already saved by someone cannot be recalled. Cache checks are required when removing a published file.

Technical reference checked for the selected poster behavior: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
