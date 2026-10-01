# October 1, 2026: public house refresh and audit

Owner authorization: publish the approved forest-and-chalk direction and improved Brice portrait crop, with the SF emblem alone in public headers and footers. The offset backing and clipped-corner experiments were rejected. Stronger photographic art direction remains open.

Source base: `be9422c` on `origin/main`, including the concurrent October 1 Adrian and Speed That Endures publications. Release branch: `work/forest-chalk-20261001`. This report records local verification; the release receipt below must be completed after production is inspected.

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

Physical iPhone/Android use is not claimed. Purchases, production inquiry delivery, private Console and native-app flows were not exercised. Public-data schedule behavior was checked with controlled fixtures, not used to invent a current gathering. Photo-edge drama remains a creative follow-up; the rejected treatments are not in this release.

## Release receipt

Pending merge, cross-browser CI and production inspection. Source and screenshots alone are not evidence of publication.
