# The Athletic Life: research publication

October 28, 2026. Owner explicitly authorized publishing the reports and improving their presentation for future agent audits and opportunity work.

## Scope

- Eleven new static reading pages: the research index, edited companion, editorial assessment, agent guide and seven source reports.
- Original source downloads plus Markdown reading editions. `reports.json` records original filenames, SHA-256 checksums and each report's limitations. The DOCX originals remain available; their reading editions preserve paragraphs and tables with simplified styling. The pasted institution report gains headings and table formatting; detached citation labels remain as supplied.
- The founding `the-athletic-life/brief.md` remains byte-for-byte unchanged. Its generator adds companion links outside the original text.
- Public reference pages enter the sitemap. Source report pages are reachable but use `noindex,follow` so speculative arguments do not become current offer search results.
- The agent guide distinguishes historical research from current owner decisions, owning records and implementation authority. No app code, athlete records, training, invitations or service commitments change.

## Presentation

Black photographic entrance and bone reading room; original approved group photograph at its natural aspect ratio, without a new crop. Inter Tight headings and system sans-serif body. Desktop contents index, phone disclosure, keyboard skip link, explicit citation links, scrollable tables and original/Markdown downloads. Reuses the shared site menu.

Source selectors: `.ar-opening`, `.ar-collection-nav`, `.ar-reading`, `.ar-prose`, `.ar-reference`, `.ar-report`, `.ar-source-note`, `.ar-table` and `.ar-footer`. New stylesheet is scoped to these pages. No new photographic asset or animation.

## Verification and release checklist

- [x] All seven original file checksums match their supplied files; the original brief has no diff.
- [x] Static checks: original brief integrity, source labels, safe Markdown rendering, source downloads, local links, section anchors, editorial contract and copy law.
- [x] The complete configured production build passes. It includes the existing house-integrity, shared-menu and brand checks. Existing unrelated link/font warnings remain warnings.
- [x] Chromium: six representative pages at 320, 390, 768, 1024 and 1440px; 200% body text, reduced motion, keyboard skip link, contents and shared menu. Desktop/phone screenshots inspected. The existing shared-menu suite also passes 1,212 Chromium checks. WebKit runs in hosted CI because local system libraries are unavailable. Browser emulation is not a physical-device check.
- [ ] Commit and CI verification. The PR head identifies the exact tested source; no self-referential commit hash is embedded here.
- [ ] Merge the reviewed publication batch and verify the matching Netlify deployment and live routes.

Netlify's dashboard was inspected during this work: auto publishing was ON and published commit was `47d0304c745cf8cbf56bce0b20507aadcfc45f4b`. This is observed state, despite older `netlify.toml` comments describing a publishing lock. Do not toggle site settings or merge the separate deployment-control PR as part of this content release. One authorized production release follows merge.

## Maintenance

`node scripts/build-athletic-research.cjs` generates the collection using vendored, MIT-licensed Marked 17.0.5. It runs during the production build; raw HTML is escaped and unsafe link protocols are rejected. `node tests/athletic-research.cjs` checks integrity and links. The shared-menu CI runs `tests/athletic-research-browser.cjs` in Chromium and WebKit. Reports remain dated perspectives; future findings belong in a new companion or an explicitly updated assessment, never a silent rewrite of the founding brief.
