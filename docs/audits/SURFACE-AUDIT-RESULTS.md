# October 1, 2026: public house refresh and audit

Owner authorization: publish the approved forest-and-chalk direction and improved Brice portrait crop, with the SF emblem alone in public headers and footers. The offset backing and clipped-corner experiments were rejected. Before publication, Brice supplied a track background and asked to borrow the mockup’s treatment with a curved left edge while preserving the original photograph. This is now the first-fold treatment.

Source base: `be9422c` on `origin/main`, including the concurrent October 1 Adrian and Speed That Endures publications. Release branch: `work/forest-chalk-20261001`. This report records source, browser and actual production verification; the release receipt below identifies the published source and remaining limits.

## Findings and fixes

| Route / surface | Severity | Finding | Fix and recheck |
|---|---|---|---|
| Home, first fold | High, identity | “I’m Brice” accompanied Marcus and Saul’s photograph. | Brice’s original hands-on-hips photo now occupies a fixed portrait window. Both hands and cap remain visible. No generated person, image retouch, backing or chamfer. Marcus and Saul appear in the practice section. Desktop and phone crops reviewed. |
| Public header and footer | Medium, design | Emblem still had a neighboring name; brand build would restore it. | Emblem-only links in source and the public build, with accessible names. Existing FORM product/study room styling remains. Checked built Library, strength guide, RPD and FORM pages at 390 and 1440 px. |
| Home, contact and six service pages | Medium, design | Older almost-black/lime identity conflicted with approved direction. | Forest `#283c32`, chalk `#f2ecdd`, warm chalk actions `#e7e3c9`; ordinary headline punctuation. Existing copy, prices and inquiry routes retained. |
| Home / strength coaching | Medium, content | Strength-photo alt text incorrectly identified Brice. | Neutral athlete description, including the owning generator. Track-group alt text describes the people beside the track without inventing an action. |
| Home at 390 px / 200% text | High, accessibility | Grid minimum widths and long type pushed content outside the viewport. | Grid children can shrink; text and controls wrap without page-level clipping. All eight house pages pass 200% text reflow. |
| Home practice section | Medium, accessibility | Four small labels measured 4.24:1 contrast. | Darker muted ink. Automated color-contrast checks now pass. |
| Contact | Medium, accessibility | Faint placeholders and invisible topic-radio focus. | Readable sage placeholders and a visible outline on the associated topic label. Browser focus check passes. Local Inter Tight replaces the external font dependency. |
| Home and service link previews | Medium, identity | Previous card retained a lime dot and emblem/name lockup. | Versioned 1200×630 JPEG rendered from exact house typography and original vector seal. Metadata and schema reference the new card; image-integrity checks pass. Authored study/product share cards remain. |

## Verification evidence

- Exact Netlify build ran in a separate copy: cream-reading invariants, cream-reading build, commercial build and house-brand build. The brand build updates 83 public files; generated guide output is not committed as a rewrite of its sources.
- Ten source suites passed: commercial release, homepage metadata, homepage release, coaching copy, coaching measurement, Run Development method, athlete access, cream reading, Thursday schedule and Miami schedule/share receipts.
- Chromium 153: seven commercial routes at 375, 390, 430, 768, 1024 and 1440 px (42 views), plus six contact views. No horizontal overflow. Homepage primary action remains in the first phone fold.
- Existing inquiry journeys passed with every request intercepted: program selection and keyboard focus, first-session and remote choices, failed submission with retained answers, accepted retry with the same ID, accepted-only measurement, running intake, privacy and QA write blocking. No live message or record was sent.
- An additional rendered audit covered home, contact, method, Library, Plans, Labs, Speed That Endures, FORM landing, privacy, terms, RPD, RPD support and 404 at 390 and 1440 px. No horizontal overflow or broken images in those views.
- All eight house pages reflow at 200% text. Reduced-motion mode uses automatic scrolling; homepage keyboard entry reaches “Skip to content.” Contact radio focus is visibly outlined.
- axe-core WCAG A/AA checks at 390 px report zero violations on home, contact and six service pages after fixes. This is automated evidence, not a claim of full accessibility certification.
- Visual review: [desktop homepage](20261001-house/home-desktop.jpg), [phone portrait](20261001-house/portrait-phone.jpg), [phone contact](20261001-house/contact-phone.jpg). Practice photograph and footer were also inspected. Page boundaries retain one dividing rule.
- CI now tests the generated production output and shared public emblems, rather than only authored source. Cross-browser result and tested commit are recorded in the release receipt.

## Limits and next action

Physical iPhone/Android use is not claimed. Purchases, production inquiry delivery, private Console and native-app flows were not exercised. Public-data schedule behavior was checked with controlled fixtures, not used to invent a current gathering. The owner’s subsequent track background and CSS curve provide the first-fold treatment. The rejected backing/chamfer and generated portrait are not used.

## First-fold follow-up

Brice’s 9:54 AM New York follow-up supplies the background and asks for a curved left photo edge. The background is optimized from a 2.93 MB PNG to a 105 KB WebP at the same 1448×1086 dimensions. No track content is redrawn; the original portrait remains byte-for-byte unchanged. Header and hero share the background, with a dark overlay behind text. Existing copy, calls to action, account navigation and page order remain. Only the fine kicker rule and curved framing are borrowed from the mockup; extra slogans and the regenerated person are excluded.

The initial phone crop put the bright mist behind the text. A stronger mobile-only overlay fixes that without darkening the desktop composition. Rendered-background sampling under text at 390/1440 px measured minimum contrast of 5.75:1 / 8.07:1 after the fix. Chromium’s complete responsive/inquiry suite passes on the combined build, including 200% text. [Phone first fold](20261001-house/home-phone.jpg) shows the mobile treatment.

## Release receipt

Base refresh: PR #190 merged as `564e2ed860fd3ac0efad520199a4b5319bc1fc0b`. Tested head `e31d03b1b7a09016166fe026c73cc346bfc0de4c` and tree `2d653744b6a5700c6cb5aa17e95c97e783344eed`; Chromium/WebKit workflow `36871882955`, ecosystem closure and RPD source-truth checks all passed. Publication was held to incorporate the owner’s first-fold follow-up. The final production receipt below records the combined release; a merge alone is not publication.


The combined refresh was first published as Netlify deploy `6abe69c2d3f1b32cbe3efc45` at `2026-10-01T14:10:27.440Z`, from the clean source export of merged main `34bc1d2cb22f7f7298d766db601c3fced706b82f`. Live visual inspection confirmed the supplied background, CSS curve and original photo. That inspection also found the wrapper crossing the main landmark boundary: later sections rendered outside main. The correction places the complete opening inside main and positions the global header over it; visual geometry is retained. Browser assertions now require the coaching and inquiry sections inside the single main landmark. Final corrected publication is recorded below.

Deployment note: export the verified commit with `git archive` before using the Netlify MCP uploader. A Git worktree’s `.git` pointer is not portable; first attempt `6abe6974a5810d3172797530` failed during repository preparation. The source-export upload completed normally.

## Final production verification

- Published source: `8bbb3e43b78376b75dac5aa713def263b2b1034b` (PR #192); tree `d946cd04a4987ce97581df1472745f6ce3eea489`. The clean source export exactly matches the verified merged tree.
- Netlify deploy `6abe6b9d354d73267b15133b` is **ready and published** at `2026-10-01T14:18:18.519Z` (October 1, 10:18 AM New York), on https://speedandform.com/. This is a source-archive upload, so Netlify `commit_ref` is null.
- Tested head `80650ac0d23a054b46bc583dd9a526cfc8f2303c` passed Chromium and WebKit in workflow `36874815875`. The prior background head `fcc76cc7ae3187936e7b352d8a551d579b8a2555` passed workflow `36873241764` and ecosystem closure.
- Actual production browser verification confirmed the versioned `home-commercial.css?v=20261001-track-main`, supplied track asset, original `coaching-track.webp`, `42% 50%` left curve, two emblem-only home links, one main containing both coaching and inquiry, and the global header outside main.
- Live running, strength, analysis, work, photography, AI setup and contact routes rendered the forest palette and emblem-only links. Plans, Labs and FORM public routes also opened without horizontal overflow in the inspected desktop view. Existing product/room identity remains; no private app or physical-device claim is made.
- No production inquiry or purchase was submitted. The audit’s simulated delivery, privacy and retry evidence remains distinct from live delivery testing.

The post-publication documentation commit uses `[skip netlify]` to avoid paying for another unchanged-site deploy solely to record this receipt.


## October 1 follow-up: owner-approved portrait corner

Brice rejected the sweeping SVG mask and approved a larger top-left-only curve from his marked screenshot. The original crop remains, with 160px corner on desktop and 100px on phone; the other three corners are square. The track stays green. Neutral charcoal gradient overlays quiet its desktop haze and reduce color intensity, preserving the photograph pixels and stronger mobile contrast treatment.

Homepage source/metadata suites and the configured Netlify build passed. Chromium renders at 375, 390, 430, 768, 1024 and 1440px had no horizontal overflow; 200% text and reduced motion passed the same check. Desktop and phone screenshots: `20261001-house/corner-desktop.jpg` and `corner-phone.jpg`. Sampled text contrast was at least 5.75:1 on phone and 9.10:1 on desktop. Physical-device review remains separate. No live inquiry was sent. Publication verification is pending; stylesheet version `20261001-track-corner`.
