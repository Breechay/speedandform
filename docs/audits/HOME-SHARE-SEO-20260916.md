# Homepage share image and SEO

Date: September 16, 2026. Owner: Brice. Scope: homepage metadata and its dedicated social image only.

## Implementation

- Real existing film: `media/run-development.mp4`, 1080 x 1920, 20.5 seconds. Selected frame: 6.300 seconds.
- New JPEG: `og/homepage-run-development-20260916.jpg`, 1200 x 630, approximately 76 KB. The vertical source is cropped without stretching, converted to monochrome and set beside the homepage's editorial Run Development heading.
- No generated athletes, altered bodies, fabricated results, fake buttons or new claims. Existing `og/default.jpg` remains unchanged for other pages.
- Search title: Running Coach in Miami & Online | Speed & Form.
- Shared-link title: Run better. Get faster. Run farther. | FORM.
- Added explicit Twitter title/description/image/alt, image MIME/secure URL, locale, large-image preview permission and Organization/WebSite/WebPage/Service JSON-LD. Canonical remains the root homepage.
- Page CSS, body, original hero film, intake, pricing, offer, measurement, auth links and page scripts are byte-for-byte unchanged from the current main source.

## Verification

- Film inspected as a 20-frame contact sheet; six exact candidate timestamps compared; selected frame and full-size card inspected.
- Typography corrected to a common baseline; no duplicate dividers. Card checked at full resolution and small preview size.
- `node tests/homepage-metadata.cjs` verifies unique head tags, canonical, JSON parsing, image dimensions/MIME signature/size, original film and measurement reference.
- Build source: `bd727e6791c5599e4c8b1f8c0a2b73e9e8dc74ab`. The one-off review workflow is removed from the final tree. No hosting/build configuration is changed.

## Release checklist

- [x] Metadata/source checks and real-film render.
- [x] Existing page CSS/body/scripts preserved exactly.
- [ ] Verify production HTML and dedicated JPEG after release. Production was not yet verified at this implementation checkpoint.
- [ ] Fresh iMessage/WhatsApp native previews on a physical phone. Browser/metadata checks are not a native device test; previous sent cards and third-party caches can retain older metadata.

Reproduce: install ffmpeg, Pillow and fonts-croscore; run `python scripts/render_homepage_share.py`, then `node tests/homepage-metadata.cjs`. Do not distribute font files. Make a new image filename when artwork changes.

No search ranking or click-through uplift is claimed. Google determines its rendered search title/snippet and must recrawl changes.
