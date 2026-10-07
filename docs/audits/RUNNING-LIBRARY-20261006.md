# Running lessons, routines and discovery · October 6, 2026

Owner request: make older resources clear, memorable, visually useful and shareable for a sharp fifteen-year-old. The later house instruction distinguishes Lesson (understand), Routine (do) and Shelf (curated links). `docs/BRAND.md` records the current format and paper-room rules.

## Published source scope

Nine connected basics lessons retain their URLs: choosing effort, easy running, threshold, long-run pace, session types, the training week, running form, training principles and the glossary. Five movement lessons cover strength, cue selection, the mechanics map, volume and phases. Four routines cover anti-rotation, a first strength session, pre-run preparation and mobility. Ghost receives shared family wayfinding; its authored six-week assignments are retained.

Every rebuilt article has a direct answer, linked sections, a written memory cue, context, a practical example, recap and check question. The routines have facts, numbered moves, dose/cue/feel, conditional progress, stop guidance, temporary checkboxes, real-demonstration spaces and a print action. No generated people or unmeasured physiological diagrams were added. The threshold timeline uses its actual stated 6/2-minute work/recovery example.

`running-lessons-content.cjs`, `movement-lessons-content.cjs`, the strength entry in `training-guide-content.cjs` and `lesson-use.cjs` own copy. `build-running-lessons.cjs` projects eighteen pages; the existing foundation/training builders reuse that source. The shared movement path owns eleven destinations. The selected eighteen share cards use the committed house fonts/emblem and updated titles.

## Search audit and repair

The previous catalog generator could replace newer public entries with older rows. `discovery-records.cjs` now preserves the complete reviewed public catalog; published Field Notes come from their owning source. `build-discovery.cjs` projects only Library, Search, the public JSON index and canonical sitemap additions. Every record is checked against its existing canonical and public-indexing state. Historical deliveries and private athlete material stay outside this curated catalog.

Search matches whole normalized words, relevant question coverage and authored questions. It supports Unicode VO₂max, common synonyms, a small typo tolerance, and numeric plan lengths. A generic word such as running no longer turns an unrelated question into dozens of loose matches. Search has format filters, grouped results, clear/retry/no-result behavior and working URL history. All eighty-six catalog links exist in the static no-JavaScript site index. The movement family separates lessons and routines.

## Validation

| Pass | Evidence |
| --- | --- |
| Content and coaching | Plain direct answers; bounded examples; purpose and context; one change at a time. Primary research supports the stated principles. Metaphors are explicitly memory aids. |
| Evidence integrity | Talk test is approximate; threshold definitions vary; lactate can be fuel; intervals describe a format; race pace and training pace differ; no universal 180 cadence or guaranteed injury prevention. |
| Search and SEO | `tests/running-library.cjs`: fourteen real questions, exact public catalog/canonical continuity, whole-word behavior, safe no-results, unique fragments/schema, complete no-JS index and deterministic rendering. Existing half-marathon SEO and public-share checks pass. |
| Build and boundaries | Full Netlify command passes. Pace math, all existing half-marathon data/measurement checks, cream reading, public previews and house hard checks pass. Build-only changes to unrelated pages were excluded from this commit. |
| Browser and print | The PR workflow checks 390/768/1440 widths, actual 450 type/bone palette, routine anchors, search filters/history/escaping, print disclosure restoration, the metronome and no-JS access. Its screenshots and receipt are saved as CI artifacts. Record the actual result before claiming browser acceptance. |

Browser acceptance passed in [Running library run 37557302192](https://github.com/Breechay/speedandform/actions/runs/37557302192) at source head `5e79e7b`: twenty-one route/width checks, no horizontal overflow, actual house type/color, search behavior, direct steps, white-paper print and no-JS access. Screenshots were inspected. [PR #251](https://github.com/Breechay/speedandform/pull/251) owns the combined review and final release status. A date-sensitive existing privacy fixture was fixed by freezing its synthetic clock; production measurement code was not changed.

Managed local browser preview was unavailable; no unapproved browser runtime or local preview server was installed. Safari and physical-device review remain separate from automated Chromium acceptance.

## Editorial handoff

This is the foundation and Strength & movement pass, not a claim that every legacy page has been reviewed. Claude can review the merged PR against the owner's standing-next-to-the-athlete voice and phone usability. Priority follow-up: pain-map and the older Ghost week pages still need an evidence/copy review; older pain-to-mechanical-cause shortcuts and sound/nasal-breathing claims must not become diagnoses. Recovery, fueling and race guides retain their existing reviewed instruction in this pass.

Shelf support and the catalog label are in place. The first external-video shelf needs Brice's actual Achilles/yin/stretch links, plus his intended sending context and known lengths. Those selections and endorsements were not invented.
