# FORM: current state and next actions
Updated September 14, 2026. Owner: Brice. Maintainer: the agent completing relevant work.

## Current checkpoint — September 14, 2026
This checkpoint supersedes older release and next-action wording below. Earlier sections are retained as release history.

| Area | Status | Evidence / next action |
| --- | --- | --- |
| Website ad measurement | LIVE; Meta receipt OPEN | Pixel `147659485878240`; main `43e87f13bd855758e308cdf0a7fd16a97a5d5da7`, Netlify `6aa843d5db2f0800085b034a` published September 14 at 18:58 UTC. Production JS matches tested source; homepage/notice match apart from CDN email protection and clean URLs. PageView and Lead only after successful mail-relay response, no intake fields; production/GPC/DNT guards. `node tests/coaching-measurement.cjs` passes. Next: owner opens Meta Test Events and submits one inquiry to verify PageView/Lead receipt and inbox delivery. No live submission or Meta receipt claimed. |
| Homepage coaching flow | LIVE editorial refinement | Main `71e37450f3499bdb9ee648186f5c0f885fc3b889`; Netlify `6aa831c7a738ed0008d82e6d`, verified September 14. Hero label, navigation contrast, CTA and subject overlay refined. Compact footer, excerpted Simon quote, shorter scope copy, eight equal intake choices. Desktop visuals and mocked intake/UTM/fallback checks pass. Phone-width audit: 375/390/430 and 768px contained; five-step intake to review and mobile disclosure pass in Chrome preview. Physical Safari/Instagram, 200% and tagged inbox receipt remain open. See [homepage audit](../audits/HOME-COACHING-FLOW-AUDIT.md). |
| FORM HYROX course + tools | LIVE | PR104, main `330067fc8a4d88c6775c029de03dd7abc3821f1d`; Netlify `6aa77fa41cabd50008ad9e03`, ready at 05:01:39 UTC. Starting priorities, rules, weekly example, rehearsals and race-day guide published. |
| HYROX search/share | LIVE | PR105, main `4369e39a9b815c60b128c2aa164a92f1de00ef02`; Netlify `6aa78107fc312e0008b5d6df`, published 05:07:35 UTC. Metadata, dedicated share card and American spelling verified. |
| HYROX visual playbook | LIVE PR106 | Interactive cost comparison and race-budget bars; linked race map; gym alternatives, two strength sessions and three-week example. Arithmetic and ID preservation passed. Main `ba78f54a84e22dd19e7b9c4d0e1cf282b4c9e6ae`; Netlify `6aa7caa8dad55c00088bba45`, published 10:21:46 UTC; desktop interactions checked. See playbook audit. |
| HYROX editorial consolidation | LIVE PR107 | One hero navigation, merged racing doctrine, three primary metrics, station loads and standards, plain effort cues, first-three-weeks option, record-derived pair chart. Existing fields/bookmarks preserved; no record schema change. Main `d4cc2c79986c6972d70ef090a7904b0bbf96813c`; Netlify `6aa7d02b0023ec00080bb75b`, published 10:45:12 UTC. |
| HYROX typography | LIVE PR109 | Station distance/load rows and consistent guidance labels; calmer training hierarchy, readable week and library typography. No calculator or record changes. PR108: main `d99264707b152ac925c92ec14244285e8e33ae54`, Netlify `6aa7d1e7cf09b7000864b3bd`, published 10:52:36 UTC. Extended pass: main `22ec037613361ddd0eba95363b1cd46a7a2ce5a9`; Netlify `6aa7d2db210ca80008cdc60e`, published 10:56:39 UTC. Shared standard installed in web AGENTS and FORM-iOS PR19 (documentation only). |
| HYROX device acceptance | OPEN | Desktop navigation and budget checked. Complete physical iPhone/iPad review and real messaging-app preview; social caches may retain earlier cards. |
| HYROX field use | NEXT | Observe the planned simulation, record actual conditions and outcomes, then refine guidance. No completed study, paid onboarding or client identity inferred. |
| Netlify auto publishing | NEEDS CONFIRMATION | `netlify.toml` documents that auto publishing was deliberately stopped in the Netlify UI, so that "nothing reaches production until a person presses publish". Both merges on September 15 reached production within about a minute with nobody pressing publish, which indicates auto publishing is currently ON. At 15 of 300 monthly credits per production deploy, the two merges cost about 30. Next action: Brice confirms the setting in Site configuration, Build and deploy, Continuous deployment, and either re-disables it or updates the comment in `netlify.toml` so the file stops describing a state that is not true. No Netlify CLI or token is available in this workspace, so the deploy ids above are the response request ids rather than deploy records. |
| Workbench sync | OPEN | Browser-local records with JSON backup; no cross-device account sync yet. |
| FORM Track room | LIVE, reconciled to the master brief | `/labs/track/` live since September 15, 2026. **Reconciled against `FORM_TRACK_MASTER_BRIEF_v1.md`, which supersedes the ecosystem study the first version was built from.** All 26 sets verified set by set against brief section 6 and matching exactly. Every set carries the authored per-rep target plus a pace band per mile and per kilometer, on Brice's instruction, because athletes enter the pace into a watch and some use kilometers; brief 6.2 is satisfied because the rep time is the primary number and the band is described as a reading aid you are not scored on. Three bands were corrected to follow their own rep target, since under 6.2 the rep time is the standard and a contradicting equivalent is a bad derivation: the 800 m on both sheets that carry one, and the 150 m in Gauntlet. Every band now reconciles and the test carries no exception. Four brief rules the first version missed are now on the page: time trials are four and Yasso 800s is an authored session rather than a trial; faster than the target is also outside the standard, with the brief's worked example; ESTABLISHED requires the authored recovery and a modified attempt stays in history without establishing anything; and the threshold ordering states its own physiological claim, first extend the uninterrupted hold then add total volume. Two questions previously raised for Brice were **resolved by authority and should not be reopened**: the Nice and Easy denominator is 6, and the 800 m target is 2:25 to 2:30. Earlier correction, PR #115: the first live version wrote the study's design intent in the present tense and so claimed capability the app does not have. `node labs/track/track.test.cjs` covers all of the above and each check was proven to fail on a real regression. Open: whether the athlete attribution behind each standard name is surfaced on the page or stays held in `labs/track/README.md`, which is Brice's call and where the data is preserved per brief 6.1; the Death versus The Long One name collision across surfaces; physical-device review. |
| Track in the app | NOT BUILT | The app has no Track surface. The six standard names live in the iOS Speed Emergence session arc (`FORM/Ledger/Ledger.swift`) and the Speed Record room (`FORM/Ledger/FORMSpeedRecordRoom.swift`) already implements attempts, strike marks, best marks and session families against real ledger entries. What does not exist is the free, browsable Track room itself, the threshold ladder, the time trials or the standalone-versus-assigned provenance the study describes. Deliberately deprioritized behind Forge delivery and behind FORM-app coached delivery for Hope and Jose. No app work started. |
| Thursday page | LIVE | `/thursday.html` corrected and published September 15, 2026. PR #114 squashed to main `55e8271`. Production verified by fetch: the time reads 6:30 AM in all four places, and Hideout, Key Biscayne, the race-week and recovery states, the full-week block and "Tonight" return zero matches on the live page. The live script carries September 17 Speed Demons, September 24 Gauntlet and October 1 optional. Authored Thursdays now win over the rotation. An optional morning names no session and does not consume a rotation slot, so the session after Gauntlet is Speed Demons whichever Thursday it lands on. `node tests/thursday-schedule.cjs` runs the page's own script against given dates and was proven to fail on a wrong time, a session invented for the optional morning and a burned rotation slot. **Open:** the optional-morning line reads "This one is optional. Brice will confirm it." and is Brice's to overwrite; the sharing gate is still Brice confirming details before Thursday September 17. |
| Adrian web surfaces | AUDITED, gap open | SITE-001 read-only audit, September 15, 2026: [Adrian surfaces audit](../audits/ADRIAN-SURFACES-AUDIT.md). **All three surfaces the milestone names return 404 and are absent from the repo**: `/plans/adrian-runner-mass-phase-01/`, `/plans/adrian-nutrition-phase-01/`, `/labs/adrian-runner-mass/`. One Adrian surface is live, `/plans/adrian-hypertrophy-week-01/`, carrying the prescription only and no athlete evidence; it is unlisted but indexable with share cards, which the pilot document designates as public delivery, so no change is recommended to it. **The gap:** the milestone requires the athlete to have a usable path if the app is delayed. The web plan is Week 01 only while FORGE-002 delivers three app weeks, and Week 02 exists on the page solely as the instruction "Record every weight and rep. That becomes Week 02." There is no nutrition surface at all, so ADRIAN-001's site-first nutrition has no site. No consent record exists anywhere in the repo; this blocks nothing today because the clause governs the public study and the study does not exist, but it must not be assumed handled when that study is built. Three names for one block of work: Forge `adrian_runner_mass_phase1_v1`, the ledger's runner mass phase 01, the site's hypertrophy week 01. Next: Brice decides whether the web fallback needs to reach three weeks, which is coupled to how soon FORGE-002 device acceptance closes. Nothing was changed by the audit. |
| Strength direct path | LIVE | SITE-002. `/strength.html` is a method page titled Structural Work and had **no route to intake at all**: no contact link, no inquiry path, no mention that coached strength exists as a service. Someone arriving from search could read all of it and have no way to reach Brice. The milestone recorded a dependency on Brice confirming provisional pricing; that pricing is already live and already his on the homepage intake (Run $1,200 / 8 weeks, Run + Strength $1,800 / 8 weeks with four coached gym sessions, plus a remote option), so the gap was never pricing, it was that one page never pointed at the other. Added one block above the existing hub links in the page's own type, routing to `/#begin`, the same intake anchor the Labs index and Track page use. **No pricing or scope restated**, because duplicating it creates two places to keep true, and nothing about service boundaries was invented. Root remains Run Development: the copy frames structural work as built around the running week and routes to the single intake rather than creating a separate strength funnel. Audit at [strength path audit](../audits/STRENGTH-PATH-AUDIT.md). Open and genuinely Brice's: whether the strength offer deserves its own page with scope and pricing, and whether local versus remote needs explaining anywhere public. |
| Forge delivery | ACTIVE | Private FORM-iOS PR18 remains draft/open at `d7556e8dc8e23ef96da52d4ca1ea73420c35fed4`. App source `0e0abce4` passed 56 Mac tests and unsigned Release build in the prior checkpoint. Next: unlinked-identity recovery/deletion status, then device acceptance. App is not finished. |

See [HYROX search/share audit](../audits/HYROX-SEARCH-SHARE-AUDIT.md) for this release's scope and remaining checks. The owning app current-state document remains authoritative for Forge.

## Earlier checkpoints

## Current state — September 12 history
Seven established public routes: homepage, Plans, two plans, Labs and two studies. This release adds /plans/race-pace-durability/support/.

Race Pace Durability stays free. Optional support is available while the study runs: $79 suggested, any amount welcome. Free and supporting readers get the same current plan. Support is arranged by email with Brice; no card checkout or extra coaching entitlement.

**Release status: LIVE September 12, 2026, 13:39 UTC.** PR #91 merged as 2e1e41518e60a99472d323790caaf5956378fd44. Netlify production deploy 6aa55611d51fa8cad546ebac published successfully. The uploaded working tree matched merged main. Support-page desktop layout, awaiting-results copy, free links, support anchor and manual email destination were verified in the live browser. Phone visual verification and third-party share-cache testing remain open.

**Plan/app audit completed September 12.** `docs/audits/PLAN-APP-AUDIT-RESULTS.md` records the actual shipped FORM iOS compile unit, live Supabase ownership/RLS/RPC paths, rolled-back synthetic isolation/replay tests, and the smallest safe plan-guided release. The backend already has the authoritative plan feed and idempotent filing door; a version-aware native client now exists on iOS main e40b173. Athlete-facing integration, identity refresh and persistent filing remain unverified; see the September 13 follow-up.

**Evidence-integrity follow-up is now live.** `rpd_evidence_revision_integrity` fixes correction-reason stamping and prevents later prescription revisions from changing old mark evidence. `explicit_session_version_receipt` adds immutable `planned_session_version_id` to FORM filing receipts, requires it for new planned FORM filings, protects it as completion identity and makes mark/verdict reads prefer that exact version. A rolled-back acceptance test proved missing-version rejection, idempotent replay, version immutability and old-evidence stability after a later prescription revision. Hope and José retained the same established values and qualifying-segment counts after migration.

The previous “wait until race results to offer it” draft is superseded. Transparent unfinished development is deliberate. Delivery and claims must still be accurate.

## Earlier app next actions — September 12
1. App agent: wire the existing e40b173 client into a beta-gated assigned-session screen; preserve exact session/version identity and do not regenerate Race Pace Durability locally.
2. App agent: establish a safe FORM Athlete System identity handoff/token-refresh path in iOS, then prove exact assigned-version read → filing → Labs visibility in simulator/CI and on a physical device.
3. App agent: consume the versioned pacing source after the native journey works. Site tester: finish real phone screenshots; media is deferred to Brice.

## Ownership
| Surface | Role / source |
| --- | --- |
| Public plan | Published work; `plans/race-pace-durability/source.js` reads canonical public source |
| Pacing practice | Shared web/print/PDF editorial revision in `execution.js`; native delivery still open |
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
| PDF-01 | LIVE | Site agent | Five-page PDF includes shared pacing appendix; visually checked and training sheets preserved. Native pacing delivery remains APP-05. |
| APP-01 | LIVE | App agent | Plan/app audit completed. See `docs/audits/PLAN-APP-AUDIT-RESULTS.md`; exact repo/schema versions and unverified device scope are recorded. |
| APP-02 | VERIFY | App/backend agents | Synthetic isolation/replay tests and post-integrity version-receipt acceptance tests pass. Prove the real native bridge in CI/simulator and on another physical device. |
| APP-03 | BLOCKED | Brice + app agent | Approve bounded repeat/progress/change rules. Pacing error, W9 split state, W12 qualifying segment, missing-report, surface and absence policies remain product decisions; do not automate them by inference. |
| APP-04 | VERIFY | App agent | Backend mode boundary is strong: athletes cannot author work/judgments and support payment grants nothing. Native self-guided enrollment/unresolved-state UX is still missing. |
| APP-05 | VERIFY | App agent | Client source and contract tests exist at e40b173. Complete the athlete journey: shared identity → `athlete_plan_feed()` → exact assigned version → version-aware `record_session_from_form()` receipt → same evidence visible in Labs. No autonomous prescription changes in v1. |
| INTEGRITY-01 | LIVE | Backend agent | `rpd_evidence_revision_integrity` is applied. Coach correction reasons now land on the exact revisions they create; mark evidence is scoped to the effective filing version for legacy rows. Reverified after apply. |
| INTEGRITY-02 | LIVE | Backend/app agents | `explicit_session_version_receipt` is applied. New planned FORM filings require immutable `planned_session_version_id`; replay cannot switch prescriptions; identity guard protects it; mark/verdict reads prefer it. Rolled-back acceptance test passed and Hope/José values were unchanged. |
| MEDIA-01 | BLOCKED | Brice | Supply real 5–10s clip, session/date, observation, cue and sharing permission; attach to that exact note. |
| MEDIA-02 | OPEN | Brice | Capture comparable early/late footage during a repeat session; publish only if useful. |
| MEDIA-03 | OPEN | Brice | Optional Ceiling Thursday clip showing rhythm/recovery; no new plan hero video required. |
| SHARE-01 | OPEN | Site agent | Dated W3 decision card using actual evidence. Keep threshold separate from RP sessions. Generic progression OG card exists; decision card does not. |
| COPY-01 | LIVE | Site agent | Signal labels clarified in Ceiling. Shared Question/Prescription; individual Output/Cost/Read/Next; pace/effort/control/reserve/limiter are inputs. |
| COPY-02 | LIVE | Site agent | Removed remaining unsupported Ceiling numerical forecasts; race plan stays open. |
| COPY-03 | LIVE | Site agent | Homepage description now names coaching, plans and living studies; hero/photo unchanged. |
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

## September 13 follow-up
See [release checks and current app review](../audits/2026-09-13-RPD-FOLLOWUP.md). PDF/copy changes are LIVE: PR #94 merged as 1e3eaa12f2a105327813d62e2d4811b8935ef328; clean-export Netlify deploy 6aa5fdb6a06f6aaa582eeded published September 13 at 01:35 UTC. Live support description and exact downloaded PDF SHA-256 were verified. First attempt 6aa5fd72b05d020a919629b9 failed before build because an uploaded worktree pointer was not portable; deploy clean git exports, never worktree metadata. Six navigation tests passed. Phone visual gate remains open because this browser cannot set a phone viewport; do not mark it verified. Real media is deferred by Brice.

## September 14 homepage playback repair — STAGED
Base inspected: `46a9a6a499727b9d53699a76c620e132b8fc1811`. September 12/13 homepage diffs changed a Labs link and metadata, not video playback. Brice reports intermittent desktop playback (later recovered) and an unresponsive play overlay on iPhone and iPad Chrome. Source confirms no autoplay rejection recovery; the exact production/device trigger remains unknown.

The homepage now retains the poster until `playing`, invokes muted inline playback explicitly, and provides an independent 44px-minimum play/pause control above decorative layers. Reduced-motion preference prevents automatic playback; manual play remains available. Intake/auth and video asset are unchanged.

Validation: both inline scripts pass Node syntax checks; isolated playback checks pass rejected-autoplay retry, reduced-motion/manual play, playing/pause presentation and preference-change pause. Tested source: homepage blob in the commit containing this entry. This is not Safari decoding or visual/device acceptance. Next: review preview at phone/iPad/desktop widths, verify real media playback and reachable controls on iPhone and iPad Chrome, then publish and check production. Deployment: not deployed by this repair; no Netlify credits used.

## September 14 — video published; intake email formatting staged
Video repair 0834b45 was published via clean export to Netlify deploy 6aa75392f6f826e3b63f2353 at 01:53:35 UTC; Netlify reports ready. Brice subsequently said good to go. Direct automated homepage fetch returned 403; no independent iPad playback claim. PR96 remains unmerged, so preserve its runtime changes in the next main release.

Intake formatting is staged in this follow-up. The received email screenshot matches the existing raw-key mailto fallback; it does not prove relay success or persistence. Future fallback messages have contact, goal, training and offer sections; relay table fields have readable labels. Internal storage keys remain unchanged. Video attachments are explicitly described as needing manual attachment in email. Syntax checks and synthetic missing-field formatting pass; no real email sent, no new provider configured. Next: verify a real submission and relay configuration, then deploy in the next approved batch. No Console lead or payment inferred from an enquiry. No personal enquiry data committed.


## September 14 — combined homepage / HYROX candidate — STAGED
This candidate includes the homepage icon refinement (48f376b9), the intake formatting (373cb807), and the HYROX workbench originally at 48a1dfd9. It preserves the already-published video recovery. Main remains 46a9a6a pending review; no new deployment was performed.

| ID | Status | Evidence / next action |
| --- | --- | --- |
| VIDEO-UI-01 | STAGED | Rectangular text control replaced by an accessible icon with 44px target. Syntax and playback-state checks passed at 48f376b9. Device visual check and deployment remain open. |
| INTAKE-UI-01 | STAGED | Human labels and structured email fallback preserved from 373cb807. Real submission verification remains open. |
| HYROX-01 | STAGED | Local multi-record coaching notebook, JSON import/export, split chart, measured-distance pace/retention and trial comparison. Study-family typography, root background and stacked phone entry added in this commit. Calculation and static wiring checks pass on its workbench blobs; browser visual/interaction acceptance remains open after security rejected a local-file preview. No bypass attempted. |
| HYROX-02 | OPEN | Review desktop/iPad/phone save/reload, import/export and print with a disposable record, then approve one combined site deployment. No athlete case is embedded or publicly linked. |
| HYROX-03 | OPEN | Authenticated Console persistence and longitudinal comparison require a separate implementation. Current records remain local to the browser; exported JSON is the backup. |

The first private import remains identity-unconfirmed and screenshot-transcribed. Missing distances prevent threshold-retention output. Historical collegiate performances do not populate current benchmarks. A following-run gap is descriptive, not proof of station causality. Exact rulebook loads are not embedded.


## September 14 — FORM HYROX course + instrument release candidate
Brice approved publication of the revised supplied course. Canonical route is `/labs/hyrox/`; Labs links to it, and the earlier workbench URL redirects. The page teaches the model before data entry, uses the study mast with a mobile contents control, simplifies station guidance, and separates historical capacity from current benchmarks. Fixed 10K offsets and unverified current Elite cutoffs were removed.

HYROX-01 now includes the course, paired totals and distance-adjusted early/late pace. Existing JSON records and storage key are preserved. Calculation tests cover unknowns, invalid durations, totals, retention and early/late distance normalization; IDs, fragments and input wiring pass. Exact tested source: blobs in the commit containing this entry. Visual browser checks remain to be performed on the published URL because local file navigation was blocked.

HYROX-02: publication authorized; deployment receipt and live checks pending. Do not call this candidate live until the receipt below is recorded. VIDEO-UI-01 and INTAKE-UI-01 are included. HYROX-03 remains open: records do not sync to Console. Public course contains no athlete dossier or contact data.


### HYROX worked sessions — September 14, 2026
- Previous course release LIVE: main 601c957, Netlify 6aa7663260fee80008360de7. Live browser verified navigation, local save/reload retrieval and pair calculation (6:45 vs 6:35 saves 0:10).
- Session addition: READY FOR RELEASE. Reference threshold + reduced circuit, station/run comparison, editable full-race budget. Targets are supplied examples, not validated sub-60 benchmarks. Whiteboard burpee range takes precedence; missing loads/reps/recovery remain explicit.
- Evidence: Node workbench and session-budget tests, syntax and fragment/ID checks. No athlete information published. Existing record schema/storage preserved; budget edits deliberately temporary.
- Next: verify production commit and session UI after the single batched release; phone/device visual acceptance remains open.

### HYROX clarity and search pass — September 14
- Prior worked-session release LIVE: bf111b4; deploy 6aa769e44afe1300082bcede. Live budget 4:10/km + 24:00 + 4:00 = 1:01:20 verified; record unchanged.
- READY: smaller worked equations, structured rehearsal, controlled-effort cue, compact expandable split fields, clear scenario result, concise method/FAQ. Existing record IDs and schema preserved.
- Search: descriptive metadata and WebApplication schema, sitemap entry, Labs anchor and print URL. No invented search volumes, ability tiers, FAQ/HowTo rich-result promises or athlete data in URLs. Google documentation reviewed 2026-09-14: FAQ rich results retired May 2026; HowTo retired. HR context: Brandt et al. 2025 (11 recreational athletes); no claim that flat HR is optimal.
- Validation: workbench/budget tests, syntax, anchors, JSON-LD and storage-field preservation. Next: inspect production desktop interactions and verify release receipt; physical phone acceptance remains open.

### HYROX standalone station planning — September 14
- Prior clarity release LIVE: 035bfd8 / Netlify 6aa76c883c5fea0008c3ab31; desktop numbers, split detail toggle and exact-hour budget verified.
- READY: actionable station cues, separate running/strength development, optional weekly station–run practice and readiness-based final-four-week specificity. Does not equate leg burn with measured lactate, prescribe a flat HR trace or declare EMOM/AMRAP universally ineffective.
- New station planner: editable full-distance illustrative budgets (24:00 total), fresh measured comparison, signed allowance, explicit Apply total and Append to notes actions. No universal fresh-to-race conversion. Preserves record schema; scratch values only persist when appended and saved/exported.
- Tests: parsing, all-eight total, missing and invalid inputs, signed comparison; existing workbench and budget checks. Next: verify production receipt and planner actions. Actual phone/iPad acceptance remains open.


### HYROX plain-language decisions — September 14
- Previous station-planner release LIVE: main 928136a5, Netlify 6aa770caf05cd5000957f495.
- READY: Model now gives a question and one next action before expandable calculations. Includes 6:45 versus 6:35 pair comparison. Eight station cards speak directly to the reader with practical cues and an adjustment to test. Pacing uses “you can return to pace.”
- Validation: five calculation disclosures, eight station cards; existing IDs, inputs, script references and storage schema preserved. Workbench, session and station-budget checks pass. Copy changes only; physical phone/iPad visual acceptance remains open.
- Next: verify production release for this commit; use the guidance in practice before expanding the tool.

### HYROX whole-page critique — September 14
- Expanded the plain-language change before release: direct athlete voice across course, explicitly marked coach observation, smaller headings, clearer record workflow, quick workout/budget links, return-to-save link, readable station text, compact phone tables and corrected nested disclosure icon state.
- Pass 1 (production desktop + full source): 6.5/10 editorial assessment; jargon, repetition and weak next-action guidance were the main issues. Pass 2 fixes those findings. Final live visual review follows deployment; no physical-device acceptance claim.
- Preserved all original IDs, inputs, script references and record schema. Added race-budget anchor; all fragment links resolve. Workbench, budget and station tests passed in the preceding copy pass; this extension changes HTML/CSS only.


### HYROX divider and footer correction — September 14
- Prior release LIVE: 7d353c1c / Netlify 6aa777f74afe1300082d2a5d. User identified duplicate rules missed in the prior visual score; that score did not certify this boundary.
- Remove nested calculation borders, decorative result rule after input underlines, redundant table-wrapper rules and nested/final disclosure borders. Retain a single section boundary above the footer.
- Footer now uses readable FORM identity, useful workout/record/rules links and quiet revision metadata.
- Standing no-double-divider rule added directly to root AGENTS.md for visibility on every task; mirrored in FORM-iOS active branch. Original data fields/scripts preserved. Next: verify production correction and footer/disclosure appearance.


### HYROX hero redundancy — September 14
- Remove the small repeated FORM HYROX eyebrow above the main title, per Brice. Main title and mast remain.
- Exact string removal only; no layout rules, inputs or scripts changed. Prior divider/footer release verified live at 67c73e1e / Netlify 6aa77a4ed849ba0008514d5c.
- Next: verify deployment receipt and live absence of duplicate label. Independent review prompt requested for further evidence-based coaching improvements; no new training claims added here.


### HYROX review improvements — September 14
- READY: four starting priorities; dated Singles 26/27 rule reminders; adaptable five-day training example with recovery and mixed-work substitution; simpler rehearsal alongside the retained advanced threshold-first example; race-day preparation and fallback plan.
- Pair explanation now checks later work. Existing later-cost fields explained without pretending they establish causality. All original inputs, IDs and storage schema preserved.
- Direct links now open their target disclosures, including nested lessons; mobile contents includes starting focus, weekly plan and race day.
- Sources: official 26/27 Singles PDF (maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf), sections 7–12; Better Health Channel sporting-performance-and-food. Training prescriptions are labelled coaching examples, not validated HYROX programmes or sub-60 standards.
- Validation: original field/ID preservation, unique IDs, valid fragment targets, JS syntax, existing calculation suites passed. Desktop production review and deployment receipt to follow in release PR. Physical phone/iPad acceptance remains open. No private athlete information added.



## September 14: HYROX app integration brief

The [app brief](../HYROX_APP_BRIEF.md) specifies coached and self-coached plan assignment, execution, filing and review. The [connected surfaces rule](../FORM_CONNECTED_SURFACES.md) applies to FORM, Forge, the site and Console. This is a scoped extension and audit brief, not working account sync or a new active study. Bridge Season HYROX-004 records the brief; HYROX-005 queues implementation audit after FORGE-002. Adrian remains the active delivery priority. FORM-iOS PR18 is draft at `d7556e8d` at inspection, targeting `forge/ship`; 56-test/unsigned Release evidence belongs to `0e0abce4`. Unlinked-account recovery, server deletion status, email/privacy, history/Console and installed acceptance remain open. Do not infer Adrian readiness from public HYROX publication.
