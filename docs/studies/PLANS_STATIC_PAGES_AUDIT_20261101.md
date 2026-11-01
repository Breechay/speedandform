# Static `plans/*` pages: read-only audit (Nov 1 2026)

Scope: every directory under `plans/` (23). Evidence: page `<meta robots>`, sitemap/search-index membership, inbound links, `docs/studies/ATHLETE-STUDY-REGISTRY-20261006.md`, and read-only queries of production `plan_publications`, `strength_study_publications`, `record_publications`. **Nothing was changed except `plans/elijah-nov-11` (route blocked).** No page was removed for being static.

Rule used: a page is **Intentionally public** only with a positive authority: an unrevoked database publication/consent row, an editorial page in the sitemap/library, or Brice's own self-study. A registry listing alone is **not** treated as consent (the registry says who is studied, not that a plan page was approved for the open web). A `noindex` tag is not access control.

Database facts: `plan_publications` unrevoked: `race-pace-durability`, `elijah-palm-beaches-half-2026`, `simon-ceiling-durability-01`. Revoked: `elijah-nov11-half` (2026-10-18). `strength_study_publications`: one row, Adrian (consent 2026-10-13, scope per its note: volunteered information, photos, Strength app records, display name "Adrian"). `record_publications`: one row (Natalie, unrelated to `plans/`).

## 1. Intentionally public, with publication authority
| Page | Authority | Note |
|---|---|---|
| `race-pace-durability` | Unrevoked `plan_publications` row; sitemap; Netlify rewrite; tested | Preview allowlist (#428) preserves it |
| `marathon-durability` | Editorial plan: sitemap, search index, library, public-share data | Not an athlete's prescription |
| `rebuilt-athlete-phase-00` + `-monday…-sunday` (8 pages) | Brice's own self-study (registry: "feature / self-study") | indexable; Brice's own data |
| `adrian-developed-runner-2026`, `adrian-hypertrophy-week-01/02/03`, `adrian-runner-mass-phase-01` | Adrian `strength_study_publications` consent (strength records) | **Scope to confirm:** consent covers Strength records for the study; Brice should confirm it covers these plan pages and `program.json`. `adrian-hypertrophy-week-01` is `index,follow` while its siblings are noindex |

## 2. Withdrawn or superseded and still publicly accessible
| Page | State | Action |
|---|---|---|
| `elijah-nov-11` | **Withdrawn** (slug revoked Oct 18). Contained the Savannah prescription and `program.json` | **Blocked in this PR**: force-404 on every route; source kept in git. Not live until deployed |
| `raise-the-ceiling` | **Superseded** ("Archived · Paused Sep 23 · Simon continues in Study 003"). Public, noindex, still shows the old six-week plan, linked from `labs/raise-the-ceiling` | **Not changed.** Simon consented to public plans, but this is an older version he was moved off. Brice to decide: keep as archive, strip plan detail, or block |
| `elijah-savannah-half` | Superseded race. Plan content is now gated (#427: no prescription is served), but the static narrative still says "Savannah remains the currently authored plan" next to an Oct 18 "race selection under review" update | Not changed. Copy decision for Brice (page is also titled for Savannah while gating shows whichever plan is live) |

## 3. Unknown, requires Brice's decision
| Page | Why unknown |
|---|---|
| `devin-week-01` | noindex; nutrition/body-composition prescription ("Cut without shrinking"); registry says "mini… unlisted simple page"; **no consent or publication row found** |
| `jose-strength-support` | noindex; coach-prepared strength alternative for the Orlando half; José is a registry feature athlete but **no consent row found** |
| `tinius-durable-frame-phase-01` | noindex; 6-week strength program (121 KB) plus `program.json`; Tinius is a registry feature athlete; **no consent row found** |
| `adrian-nutrition-phase-01` | No robots tag at all (indexable by default); nutrition plan with clinician-guidance language; Adrian's recorded consent names Strength records, not nutrition; also served: `review-context.json` |

These are not served differently by this PR. If Brice withdraws any, add that directory to `WITHDRAWN` in `tests/revoked-plan-routes-not-served.cjs` and add its force-404 rules to `_redirects` (copy the Elijah block). Caveat for every page: removing it from the site does not remove it from git history, forks, existing deploys, or third-party caches.

## Limits of this audit
Reads only the tables named above; consent might exist in a place not queried (messages, files). "No consent row found" means exactly that. Linked-page content (e.g. `labs/*` studies that quote these plans) was not audited here.
