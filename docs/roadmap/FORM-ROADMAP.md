# FORM: current state and next actions
Updated September 12, 2026. Owner: Brice. Maintainer: the agent completing relevant work.

## Current state
Seven established public routes: homepage, Plans, two plans, Labs and two studies. This release adds /plans/race-pace-durability/support/.

Race Pace Durability stays free. Optional support is available while the study runs: $79 suggested, any amount welcome. Free and supporting readers get the same current plan. Support is arranged by email with Brice; no card checkout or extra coaching entitlement.

**Release status: LIVE September 12, 2026, 13:39 UTC.** PR #91 merged as 2e1e41518e60a99472d323790caaf5956378fd44. Netlify production deploy 6aa55611d51fa8cad546ebac published successfully. The uploaded working tree matched merged main. Support-page desktop layout, awaiting-results copy, free links, support anchor and manual email destination were verified in the live browser. Phone visual verification and third-party share-cache testing remain open.

**Plan/app audit completed September 12.** `docs/audits/PLAN-APP-AUDIT-RESULTS.md` records the actual shipped FORM iOS compile unit, live Supabase ownership/RLS/RPC paths, rolled-back synthetic isolation/replay tests, and the smallest safe plan-guided release. The backend already has the authoritative plan feed and idempotent filing door; the shipped iOS app is not yet wired to them.

**Evidence-integrity follow-up is now live.** `rpd_evidence_revision_integrity` fixes correction-reason stamping and prevents later prescription revisions from changing old mark evidence. `explicit_session_version_receipt` adds immutable `planned_session_version_id` to FORM filing receipts, requires it for new planned FORM filings, protects it as completion identity and makes mark/verdict reads prefer that exact version. A rolled-back acceptance test proved missing-version rejection, idempotent replay, version immutability and old-evidence stability after a later prescription revision. Hope and José retained the same established values and qualifying-segment counts after migration.

The previous “wait until race results to offer it” draft is superseded. Transparent unfinished development is deliberate. Delivery and claims must still be accurate.

## Next three actions
1. App agent: build a beta-gated native FORM Athlete System client using the authoritative `athlete_plan_feed()` and version-aware `record_session_from_form()` contract; do not regenerate Race Pace Durability locally.
2. App agent: establish a safe FORM Athlete System identity handoff/token-refresh path in iOS, then prove exact assigned-version read → filing → Labs visibility in simulator/CI and on a physical device.
3. Site/app agents: align web pacing guidance with the printable/PDF edition and, after the native bridge exists, the app from the same versioned source.

## Ownership
| Surface | Role / source |
| --- | --- |
| Public plan | Published work; `plans/race-pace-durability/source.js` reads canonical public source |
| Pacing practice | Editorial web layer: `execution.js`; not yet canonical app/PDF content |
| Athlete assignment | Individual band/schedule/version in existing private model; do not create duplicate tables |
| Filing | Athlete identity + assigned session + exact immutable session version + dated measured evidence and athlete report; backend filing RPC is `record_session_from_form()` |
| Console | `/coach/labs/` + `/private/data.js`; active scripts verified in the plan/app audit |
| Study | `labs/speed-that-endures/index.html`; Brice selects and interprets public evidence |
| App | Active repo is `Breechay/FORM-iOS`; shipped target includes `FORMApp.swift` plus compiled modular files under `FORM/**`. Native RPD delivery is not yet wired to the FORM Athlete System |

Hope and José currently receive Brice's attention. Their successful use does not prove a stranger can run the plan without a coach watching.

## Work register
LIVE = published; stated validation limits still apply. STAGED = implemented, production unverified. OPEN = not done. VERIFY = code exists, end-to-end claim unproven. BLOCKED = named dependency. Complete items with dated evidence, not just a checkbox.

| ID | Status | Owner | Next action / done when |
| --- | --- | --- | --- |
| SITE-01 | LIVE | Site agent | Ceiling paging: six tests pass. Verify 390/650/720px and desktop in browser. |
| SITE-02 | LIVE | Site agent | Cost-lens specificity fix: verify screenshot defect at 375–430px and enlarged text. |
| SITE-03 | LIVE | Site agent | Six share images, metadata, dates, plan/assignment copy, links, removed unsupported centerpiece. Verify production assets and share caches. |
| SITE-04 | LIVE | Site agent | Pacing details + study interpretation. Check early reps, continuous and late sessions; preserve volumes and targets. |
| OFFER-01 | LIVE | Site agent | Support page + free access + manual email support. Verify all actions. |
| OFFER-02 | OPEN | Brice | Decide if manual support is enough. Card checkout needs verified account/link, receipt and terms. Never invent payment handles. |
| OFFER-03 | OPEN | Brice | Keep contribution records privately: contact, amount/date, receipt and promised version. Never commit customer details. |
| PDF-01 | OPEN | Site/app agents | Version web pacing notes into print/PDF and app from a common source; regenerate and visually verify. Current PDF is only the training sheet. |
| APP-01 | LIVE | App agent | Plan/app audit completed. See `docs/audits/PLAN-APP-AUDIT-RESULTS.md`; exact repo/schema versions and unverified device scope are recorded. |
| APP-02 | VERIFY | App/backend agents | Synthetic isolation/replay tests and post-integrity version-receipt acceptance tests pass. Prove the real native bridge in CI/simulator and on another physical device. |
| APP-03 | BLOCKED | Brice + app agent | Approve bounded repeat/progress/change rules. Pacing error, W9 split state, W12 qualifying segment, missing-report, surface and absence policies remain product decisions; do not automate them by inference. |
| APP-04 | VERIFY | App agent | Backend mode boundary is strong: athletes cannot author work/judgments and support payment grants nothing. Native self-guided enrollment/unresolved-state UX is still missing. |
| APP-05 | OPEN | App agent | Ship the smallest native beta bridge: shared identity → `athlete_plan_feed()` → exact assigned version → version-aware `record_session_from_form()` receipt → same evidence visible in Labs. No autonomous prescription changes in v1. |
| INTEGRITY-01 | LIVE | Backend agent | `rpd_evidence_revision_integrity` is applied. Coach correction reasons now land on the exact revisions they create; mark evidence is scoped to the effective filing version for legacy rows. Reverified after apply. |
| INTEGRITY-02 | LIVE | Backend/app agents | `explicit_session_version_receipt` is applied. New planned FORM filings require immutable `planned_session_version_id`; replay cannot switch prescriptions; identity guard protects it; mark/verdict reads prefer it. Rolled-back acceptance test passed and Hope/José values were unchanged. |
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
The account has five active reminders, so no new standalone task was created. The existing Tuesday Labs reminder now includes up to two roadmap/media/app actions. The existing late-run/race-day reminder includes post-race site, offer, PDF and app updates. Their original schedules were preserved.

Review next actions weekly. Limit reminders to three concrete tasks and suppress completed work. Post-race reminders request verification/publication, never auto-fill results.
After releases update statuses and actual deployment evidence here. Historical audit: `docs/audits/2026-09-12-ecosystem-audit.md`. Plan/app audit: `docs/audits/PLAN-APP-AUDIT-RESULTS.md`.
PR #91: public support release. PR #92: plan/app audit and first integrity repair.
Test: `node scripts/test-ceiling-navigation.mjs`.
The support page is an explicitly authorized exception to the original audit's “no new page yet.”
