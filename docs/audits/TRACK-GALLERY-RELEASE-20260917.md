# Track gallery: Pass 3

Owner: Brice. Scope: public photo/film gallery and its bounded discovery integration. The single release register is `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release receipt

**LIVE September 17, 2026 at 03:35:22.532 UTC.** PR #124 merged as `41648a26a126fc333815bd093381af22ae3aeb74`. Netlify production deploy `6aab5fedc4ff640008146717` is ready on the existing site `f3914a6a-a9ce-465e-8212-f5f42597c469`; the deploy record names that exact commit. The existing main-branch deployment performed the release. No additional manual production deployment was triggered.

Final read-only branch CI `35178586077` passed on `805e48bddc4876a850564e55dd28ff88aaba99de`. Merged-main CI `35178718009` passed nine Node source/regression suites plus thumbnail-selection validation, **110 gallery browser checks**, **61 discovery checks**, and **17 existing homepage/intake/media checks**, then successfully verified the actual public site.

Production HTTP verification started at `2026-09-17T03:36:51.479Z`. Both gallery pages and **20 distinct public resources**, including the film and photo ZIP, passed exact hash and response checks by `03:37:05.090Z`. The discovery check then passed **72 canonical pages, six public resources and six route cases** by `03:37:11.265Z`. Existing share metadata was reverified across **19 pages and all 10 image URLs**, ending at `03:37:19.550Z`. None of these verification stages needed readiness retries.

The live Chromium test subsequently passed **15 checks**: the actual album at 390 and 1440 pixels, all lazy-loaded images decoded, removed copy absent, complete thumbnail composition, working viewer, selected player poster, no autoplay, successful real film playback, exact photo ZIP download, and no runtime JavaScript errors. Live screenshots were captured after walking and decoding the images, not by mistaking offscreen lazy-loading placeholders for the finished page.

Artifact `10479149887`, `gallery-receipt`, from run `35178718009` contains the exact source commit, source-test output, media manifest, browser reports, screenshots and production reports. It has 14-day retention; this file preserves the permanent release facts. The final workflow is read-only, does not commit or deploy, and contains no temporary conversion step. Source archives and font files are not included in the final review artifact.

## What shipped

`/track/` introduces selected albums. `/track/from-practice/` is the initial, clearly undated selection, with four existing public photographs and one existing silent clip. It is not presented as a newly photographed session. Existing source media remain unchanged; the gallery creates reviewed JPEG editions and a photo ZIP. Reuse authority is the owner's original gallery request and the existing public placements, not an invented individual model-release record.

The album offers individual photo/film downloads, a photo ZIP, native-share/copy/manual-copy paths, shareable frame hashes, a full-screen dialog, previous/next and keyboard/touch navigation, loading-failure recovery, browser history and focus restoration. Film bytes are requested only when the film is opened and playback is not automatic. Closing a film removes and stops its media element. Real file links and downloads remain usable without JavaScript. No signup, email list, account, analytics or comment layer was introduced. A photo-removal contact is included.

The owner's final refinement removes the public signup reassurance, technical download disclaimer and the “Silent film. Play to watch.” instruction. The “Running, in motion” title, useful save action and simple play/duration affordance remain. The thumbnail is an authentic **6.3-second film frame**, selected after reviewing samples. The whole portrait composition is preserved rather than cropped, and the player uses the same selected thumbnail. Generated editions are versioned under `/media/track/from-practice/5a3a58977d72/`; the original film remains `/media/run-development.mp4` with unchanged SHA-256 `66f80e694521f15cf794097ac4725eacaeeaaa2c11baf952be2b1900d69a791c`.

`posterTime` and checksum-verified `posterSource` are implemented publishing settings. They allow a chosen film timestamp or a reviewed custom image. **There is no on-site visual thumbnail picker yet.** That is a later authoring enhancement, not an unfinished public viewing feature.

The catalog adds one gallery entry (47 resources) and two canonical pages (72 sitemap URLs). Only the Library catalog entry and Thursday's gallery wayfinding change existing page bodies. No homepage, article content, cream/Labs/app styling, coaching intake, payment or athlete-record changes are included. Historical Pass 1 and Pass 2 release receipts remain intact.

## Acceptance details and limitations

The earlier fixed 46-link Library assertion was replaced with exact equality against the reviewed catalog URLs, not loosened to accept any count. Missing, ambiguous, nonfinite and out-of-range thumbnail selections are rejected. Custom images require their reviewed checksum. The missing ffprobe dependency in the first refinement run was corrected by explicitly installing ffmpeg; the final branch and main runs both passed afterward.

Actual ZIP, JPEG and MP4 downloads were checked against their reviewed hashes. Browser tests exercised keyboard focus, history, simulated touch, media cleanup, error/retry paths and no-JavaScript access. Existing homepage submissions were intercepted. **No real inquiry, email, payment, marketing signup or external share message was sent.**

Physical iPhone/iPad, Safari, screen-reader operation and external native share-sheet/cache behavior remain unverified. Viewport checks and simulated touch are not physical-device tests. A new dated album still requires the owner's actual selected media and publication authority. No ranking, indexing or conversion improvement is asserted. The educational, app-landing-page and newsletter passes remain separate and unstarted here.

## Maintenance

See `docs/publishing/TRACK-GALLERY.md` for selected media, timestamp/custom thumbnail choices, regeneration, publication and removal. The existing Netlify build is unchanged; generated pages and media are committed deliberately. Public downloads already saved by someone cannot be recalled. Cache checks are required when removing a published file.

Technical reference for selected poster behavior: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
