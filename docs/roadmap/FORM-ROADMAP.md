# FORM: current state and next actions
Updated September 12, 2026. Owner: Brice. Maintainer: the agent completing relevant work.

## Current state
Seven established public routes: homepage, Plans, two plans, Labs and two studies. This release adds /plans/race-pace-durability/support/.

Race Pace Durability stays free. Optional support is available while the study runs: $79 suggested, any amount welcome. Free and supporting readers get the same current plan. Support is arranged by email with Brice; no card checkout or extra coaching entitlement.

**Release status: PR #91 prepared; production verification pending.** Check GitHub and the live routes before updating this claim. The date of a document is not deployment evidence.

The previous “wait until race results to offer it” draft is superseded. Transparent unfinished development is deliberate. Delivery and claims must still be accurate.

## Next three actions
1. Brice: capture one useful movement clip, its cue/date and permission to share (MEDIA-01).
2. App agent: run the plan-app audit in this repo AND the actual FORM app repo/build. Identify manual judgment currently supplied by Brice.
3. Site agent: complete phone verification, then align web pacing guidance with the printable/PDF edition.

## Ownership
| Surface | Role / source |
| --- | --- |
| Public plan | Published work; plans/race-pace-durability/source.js reads canonical source |
| Pacing practice | Editorial web layer: execution.js; not yet canonical app/PDF content |
| Athlete assignment | Individual band/schedule/version in existing private model; do not create duplicate tables |
| Filing | Athlete identity + assigned session/version + dated measured evidence and athlete report |
| Console | coach/labs/ and private/data.js; actual active paths must be verified |
| Study | labs/speed-that-endures/index.html; Brice selects and interprets public evidence |
| App | Locate real iOS repo/build; web source is not proof of app capability |

Hope and José currently receive Brice's attention. Their successful use does not prove a stranger can run the plan without a coach watching.

## Work register
STAGED = implemented, production unverified. OPEN = not done. VERIFY = code exists, end-to-end claim unproven. BLOCKED = named dependency. Complete items with dated evidence, not just a checkbox.

| ID | Status | Owner | Next action / done when |
| --- | --- | --- | --- |
| SITE-01 | STAGED | Site agent | Ceiling paging: six tests pass. Verify 390/650/720px and desktop in browser. |
| SITE-02 | STAGED | Site agent | Cost-lens specificity fix: verify screenshot defect at 375–430px and enlarged text. |
| SITE-03 | STAGED | Site agent | Six share images, metadata, dates, plan/assignment copy, links, removed unsupported centerpiece. Verify production assets and share caches. |
| SITE-04 | STAGED | Site agent | Pacing details + study interpretation. Check early reps, continuous and late sessions; preserve volumes and targets. |
| OFFER-01 | STAGED | Site agent | Support page + free access + manual email support. Verify all actions. |
| OFFER-02 | OPEN | Brice | Decide if manual support is enough. Card checkout needs verified account/link, receipt and terms. Never invent payment handles. |
| OFFER-03 | OPEN | Brice | Keep contribution records privately: contact, amount/date, receipt and promised version. Never commit customer details. |
| PDF-01 | OPEN | Site/app agents | Version web pacing notes into print/PDF and app from a common source; regenerate and visually verify. Current PDF is only the training sheet. |
| APP-01 | OPEN | App agent | Execute PLAN-APP-AUDIT-BRIEF.md; map acquisition to filing, next work, console and editorial publication. |
| APP-02 | VERIFY | App agent | Prove existing filing/console path with synthetic accounts, isolation, retries and corrections. |
| APP-03 | OPEN | Brice + app agent | Approve bounded repeat/progress/change rules with versions, evidence, reasons, override and unresolved states. |
| APP-04 | OPEN | App agent | Prove plan-guided versus coached boundaries; support payment never implies human review. |
| MEDIA-01 | BLOCKED | Brice | Supply real 5–10s clip, session/date, observation, cue and sharing permission; attach to that exact note. |
| MEDIA-02 | OPEN | Brice | Capture comparable early/late footage during a repeat session; publish only if useful. |
| MEDIA-03 | OPEN | Brice | Optional Ceiling Thursday clip showing rhythm/recovery; no new plan hero video required. |
| SHARE-01 | OPEN | Site agent | Dated W3 decision card using actual evidence. Keep threshold separate from RP sessions. Generic progression OG card exists; decision card does not. |
| COPY-01 | OPEN | Site agent | Finish signal-label audit. Shared Question/Prescription; individual Output/Cost/Read/Next; pace/effort/control/reserve/limiter are inputs. |
| COPY-02 | OPEN | Site agent | Ceiling numerical projections need derivation or removal; deleting the 30s claim did not establish them. |
| COPY-03 | OPEN | Site agent | Improve homepage metadata description without changing hero/photo. |
| UI-01 | OPEN | Site agent | Navigation/folios/focus/footers, tiny Ceiling notation, lime hierarchy, Bridge title scale. Diagnose with screenshots; preserve distinct compositions. |
| RESEARCH-01 | OPEN | Research agent | Verify citations and claim scope. Original audit did not do this. |
| LIBRARY-01 | OPEN | Site agent | Scoped review of existing articles, mechanical language and stale schedules before adding educational pages. |
| SHARE-02 | OPEN | Site agent | Week links only if readers need them; selected week never replaces actual current week. |
| RACE-01 | OPEN | Brice | Verify both previous PRs. Approximate 1:39 is not publication-ready. |
| RACE-02 | OPEN | Brice | File official December 5 results, splits, conditions and athlete accounts for BOTH athletes. |
| RACE-03 | OPEN | Site agent | Apply post-race checklist after verified evidence, not merely the date. |

## Media checklist
One useful piece is enough. Capture athlete/date/session, early or late point, cue and what changed or did not. Keep original footage and confirm permission. Export a compressed short clip with poster and meaningful caption, no autoplay audio. Movement footage cannot by itself establish physiological cost.
Short athlete reactions can explain what splits cannot. Preserve their words and obtain permission for promotion.

## Post-race checklist
Trigger: official results and athlete accounts available.
- [ ] Verify previous PR source/date and official chip result/distance for each athlete.
- [ ] Preserve intermediate splits, opening/closing behavior, conditions, deviations and athlete account.
- [ ] Publish both outcomes in Speed That Endures; retain historical assignments and uncertainty.
- [ ] Replace support-page awaiting text with verified result/source and study link; no unsupported causal claim.
- [ ] Update Plans/Labs summaries, study dates, metadata and share cards consistently.
- [ ] Decide what changes in final plan v1 and publish version notes. Preserve existing free-access promises.
- [ ] Align web/PDF/app delivery; test as a new reader.
- [ ] Revisit fixed purchase pricing only after reliable delivery and mode audit; no silent subscriptions.
- [ ] Publish conclusion, then athlete-approved share cards, with full evidence public.

## Maintenance
Review next actions weekly. Limit reminders to three concrete tasks and suppress completed work. Post-race reminders request verification/publication, never auto-fill results.
After releases update statuses and actual deployment evidence here. Historical audit: docs/audits/2026-09-12-ecosystem-audit.md.
PR: https://github.com/Breechay/speedandform/pull/91
Test: node scripts/test-ceiling-navigation.mjs.
The support page is an explicitly authorized exception to the original audit's “no new page yet.”
