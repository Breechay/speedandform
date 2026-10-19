# FORM · Public-site editorial and rules audit
**October 19, 2026 · Source audit on main · Not a production visual signoff**

## Scope and method

The automated publication gate scans public HTML routes resolved from the sitemap, the primary public entrances and every `labs/*/index.html`, including SEO/social descriptions and page titles. The first completed full run inspected **109 pages**. A separate manual source-copy pass covered Home, Labs index and active studies, Plans, Brand, coaching, Runs, People, Thursday, FORM House, Library, Contact, Method and selected secondary pages. Live URL text was consulted but cached web extraction may not reflect the current source. This is not a full image/film, accessibility or athlete-database review.

**Central rule:** **Present the evidence. Don't narrate the presentation.**

## Shipped source corrections

| Issue | Source correction | Status |
|---|---|---|
| Interface commentary explaining that records are clickable | Direct link labels in Speed That Endures and The Developed Runner; no "one click away" commentary | Committed |
| Self-referential "Follow the study as it happens" footer | Replaced on The Developed Runner and The Rebuilt Athlete with "Study updates" and useful specific context | Committed |
| Internal publishing status on Labs shelf | Removed Marathon Durability from Labs promotional shelf; kept its reference page reachable but relabeled the edition | Committed |
| Retired marathon reference in Plans SEO/share description | Corrected Plans HTML and canonical `data/public-share.json` source | Committed |
| Conditional coaching language in Labs introduction to Simon | Replaced descriptive "if the week can absorb it" with the actual three-part study approach; Simon's study and assignments left unchanged | Committed |
| Projected homepage evidence blocked by a stale study checksum | Reviewed last completed milestone (Sep 29 six continuous miles), Oct 13 support read, Oct 20 proposed ask and preserved source notes; updated approved public projection checksum | Committed |
| Sitemap refresh dates not backed by actual refresh proof | Removed twelve `lastmod` declarations | Committed |
| Public track gallery present in sitemap but absent from manifest | Added canonical `track/track-selection/` route to discovery manifest | Committed |

## Permanent protections

- `docs/editorial/PUBLICATION_CONTRACT.md` is the single editorial authority for public work, including studies, apps, metadata, galleries and generated outputs.
- The contract is linked from `AGENTS.md`, `.cursor/rules/form-speedandform-context.mdc`, `docs/AGENT_ORIENTATION.md`, `docs/BRAND.md`, `docs/marketing/ATHLETE_LANGUAGE_RULE.md` and represented on the public Brand voice page.
- `scripts/check-editorial-contract.cjs` fails on selected high-confidence self-narration and internal labels in public HTML and SEO/share metadata. `tests/editorial-contract.cjs` checks source doctrine, scanner fixtures, current study coverage and rejected retired-plan copy.
- `.github/workflows/public-editorial-guard.yml` checks pushes and PRs; `netlify.toml` adds the same check after content generation in the configured build.
- A textual scan cannot determine image consent, correctness of a claimed workout, aesthetic quality or whether a sentence is generically dull. Editors still perform the human checks in the publication contract. This guard is intentionally narrow to avoid deleting useful safety and source qualifications.

## Source integrity and interpretation

- Speed That Endures: the homepage's Sep 29 six-mile milestone remains the last confirmed race-pace rung. Oct 13 Jose's 20-minute 6:06/mi effort is a different, faster session. The snapshot now distinguishes what happened from what was proposed later.
- Older "if recovered" / "if absorbed" prescriptions persist in dated study records as historical material, not current FORM assignments. Do not strip them from an evidence archive or use them to deliver new workouts. The coach owns any actual athlete-facing assignment.
- Simon's Study 003 remains outside this editorial rewrite at the owner's direction. Its dated session material and any current app plan should be reconciled against owning athlete sources before substantive future changes.
- No invented performance result, medical readiness claim, athlete receipt or race finish was introduced as part of this pass.

## Release and further checks

- The new **FORM public editorial contract** GitHub Action has recorded a passing run against the 109-page source scan. House integrity has also passed on the relevant source changes. Each later change must pass again.
- The shared-menu/production-build check exposed a required source-hash refresh and then a canonical share-metadata mismatch; both were corrected in their owning sources. Final post-correction full-build status must be read separately.
- The older Discovery release workflow flagged invented sitemap modification dates and then an out-of-sync route count; both underlying source issues were corrected. This workflow has older protected-baseline assumptions and needs separate review if it still fails after the fixes.
- **No new production deployment, desktop/mobile visual audit, photo-permission audit, actual device app receipt audit or complete WCAG test is asserted by this document.** Do not equate committed code or source tests with a live release.
- Preserve cinematic treatment, photographic layers, proper contrast, silence/reduced motion and real-athlete consent. These are required human/visual release gates, not reasons to reduce the site to plain cards.

This audit is a receipt, not audience-facing page copy. Do not quote its process instructions on public studies.
