# Track photographs and films: publishing

The public room is `/track/`. Its album pages are static HTML with progressive enhancement for viewing and sharing. `track/albums.json` is the selected-media authority. Never sweep the media directory or automatically publish athlete deliveries.

## Add a real session

Create an album with a stable slug, `kind: "session"`, the actual ISO date, title, description, a brief contextual note, a cover media ID and `publicationBasis`. Set `published: false` until reviewed. An undated cross-session selection uses `kind: "selection"` and `date: null`; never invent a session date. List each selected file, SHA-256, existing source page or provenance, descriptive alternative text and download approval. Preserve original source files. The current starter is an earlier collection, not a September 17 session.

## Choose a film thumbnail

For a frame from the actual film, set `posterTime` to seconds, for example `6.3`. Remove `posterSource` when using a timestamp. For an independently selected image, set `posterSource` to a reviewed local `media/` or `assets/` path and `posterSha256` to its SHA-256; omit `posterTime`. The preparer rejects missing/ambiguous choices, invalid times, and unverified custom images rather than silently choosing the first frame. The selected image is used in the album and video player. Source film bytes remain unchanged.

This is an implemented publishing setting, not an on-site thumbnail-picker interface. A visual frame picker remains a later authoring enhancement. Use an authentic representative image with heads and movement legible at phone size. The current clip uses 6.3 seconds and retains its complete portrait frame.

## Prepare, review, release

Use Python with Pillow 11.3.0, ffmpeg/ffprobe and Node. Run:

```sh
python scripts/prepare-track-media.py
node scripts/build-track-gallery.cjs
node scripts/build-discovery.cjs
python tests/track-poster.py
node tests/track-gallery.cjs
node tests/discovery.cjs
python tests/track-gallery-browser.py
python tests/discovery-browser.py
python tests/homepage-browser.py
```

Review the diff, contact sheet/thumbnail, phone and desktop album/viewer screenshots, and actual downloads before committing. Preview images are small; a film is not fetched until opened and does not autoplay. Individual photographs, a photo ZIP and the film remain available without email collection. Do not label exported site media as camera originals. That internal fact does not need a permanent public disclaimer.

Public copy stays quiet: no signup reassurance, no technical download disclaimer, no “Silent film. Play to watch.” instruction. Retain useful titles, file types/sizes, playback affordances, and meaningful accessibility descriptions. Never require newsletter signup for downloads.

The current media preparer accepts silent clips only. Audio-bearing videos need reviewed captions/transcripts and a captioned-video integration; do not simply bypass the guard.

## Removal and correction

The album footer has a photo-removal email link including album context. Remove the selected item or set the album unpublished, then regenerate media, gallery and discovery together. Preparation removes known stale generated editions/ZIPs from the next deploy without deleting originals. A public download already saved by someone cannot be recalled. A cache purge may also be necessary; versioned images are not an access-control mechanism. Verify obsolete public paths after a removal release.

## Release evidence

The single checklist is `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`; the Pass 3 receipt is `docs/audits/TRACK-GALLERY-RELEASE-20260917.md`. Do not call source changes live. Record exact tested commit, production deploy, response checks, actual download hashes and remaining native-device limitations. No email or payment submissions belong in this workflow.
