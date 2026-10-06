# Half-marathon Library: build and release roadmap

**Owner direction:** October 6, 2026. Build the connected set, replace Library serif typography with sans serif, work through deliberate visual passes, and release complete groups as they become ready. This supersedes the supplied handoff's no-build status and its recommendation to retain serif headings. It does not establish that a page has shipped or that an ad is running.

**Target, reaffirmed by Brice October 6:** first group live October 6; two focused build days October 7–8; full-system launch-readiness review October 9. Dates are work targets, not a publication promise. The existing Console owns next actions and daily selection. This document owns the technical release checklist; it does not replace the company roadmap.

## One connected collection

Keep the existing Library and static publishing system. Readiness explains the choice; each plan owns its complete schedule; the pace chart and existing calculator answer the numerical question. Free plans remain complete without an email or account gate. Run Development and the existing Race Pace Durability plan are relevant choices for different needs, not required upgrades from a deliberately weakened free plan.

| Resource | Reader's job | Release order and dependency |
| --- | --- | --- |
| Twelve-week plan | Prepare to finish from an established running or run/walk base | First group. Build the reviewed all-easy candidate as one internally consistent version, with its actual entry requirements, recovery, disruption and race-week directions. |
| How long to prepare | Choose from current running, available weeks and practical readiness | First group. Match the actual plans; do not select from the race date alone or invent automatic clearance. |
| Half-marathon pace chart | See the pace and splits associated with a finish time | First group. Canonical distance, shared math and repaired existing calculator; goal arithmetic is not a fitness assessment. |
| Six-week plan | Organize an existing substantial base when the race is close | Second group. Separate complete resource with clear prerequisites, all days, recoveries, disruption rules and taper. Do not compress the twelve-week plan into six. |
| Sixteen-week foundation path | Build the missing preparation before entering the main plan | Author and review as a distinct version. Verify the whole transition, including the fourth outing and weekly load. It must not promise a half from zero in sixteen weeks. |
| Eight-week plan | Serve an established runner with a different runway | Author and review as a distinct version. Demonstrate who it suits and why it differs from six and twelve weeks. No duration-only selector or automatic cut-down schedule. |
| Faster-half guide | Understand what to investigate and which training path fits | Author after the plan choices are clear. Explain several possible priorities; do not diagnose one limiter from a single race comparison. |
| Existing Race Pace Durability | Follow the existing performance-focused paid program when qualified | Preserve the existing preview, purchase, entitlement and study relationship. Link contextually; no new checkout or silent athlete reassignment. |

New-runner preparation stays useful even before a distinct FORM starting program is complete. Any new six-week run/walk starter requires its own complete schedule and review; it is not silently substituted for the distance-based plan. General starting, ordinary return after a break and return after injury remain distinct situations.

No unreviewed schedule, disabled future-plan tab or advertised unfinished route is needed to make the collection feel connected. The readiness guide can describe what to establish before choosing an available plan. Keep raw reviews and unapproved prescriptions outside the deployable site root.

## Five passes, each with a stopping point

| Pass | Deliverable | Finish condition |
| --- | --- | --- |
| 1. Structure | Route map, one plan data source, reusable week/overview/print rendering, sans serif Library shell | A reader can reach the correct resource, identify its starting point and find the schedule. No duplicate calculator or Library index. |
| 2. Content | Complete schedules and instructions, coherent prerequisites and handoffs | Each release candidate has every day, effort, recovery, total, race week, missed-session rule and non-fit path checked. Training changes are explicit and versioned. |
| 3. Design | Typography, spacing, mobile flow, useful visuals and print layout | Review the first phone screen, schedule selection, one busy week, the final week, chart and next step. No decorative work that hides the schedule. One divider per boundary. |
| 4. Verification | Functional, numerical, accessibility and journey evidence | Miles/kilometers, all weeks, no-JavaScript content, keyboard focus, enlarged text, print, links, metadata and existing paid-access behavior pass on the exact candidate. |
| 5. Release and learning | Bounded publication, production readback and a concrete distribution experiment | Record exact commit, deploy and live checks. Prepare an ad experiment only for a ready destination with a defined objective and approved spending scope. |

One structural pass and one content pass establish the bones. The design pass may have two short review cycles: hierarchy/flow, then visual finish. Repeat a completed pass only for a specific defect or owner correction. A numerical, content or access defect returns to its owning pass; it is not hidden by another design round.

## Working sequence

| Work block | Main output | End-of-block review |
| --- | --- | --- |
| Tuesday, October 6 afternoon | Build the first three resources, common schedule structure and sans serif treatment; repair the existing calculator | Working desktop/phone preview, exact content differences, remaining blockers. Inspect the bones before extending the template. |
| Wednesday, October 7: build day 1 | Complete first-group content and design; author the full six-week resource; reconcile the sixteen- and eight-week candidates | First group passes its release checks. Every later plan has either a complete reviewed candidate or a named missing decision. |
| Thursday, October 8: build day 2 | Finish eligible later plans and faster-half guidance; complete cross-links, print and release QA; prepare ad assets and message match | Review complete resources as one reader journey. Keep ready groups releasable; name any unfinished variant without exposing it as available. |
| Friday, October 9 | Final launch-readiness review and sequential publication/verification where authorized | Actual shipped list, remaining blockers, verified share links and one concrete first advertising test. |

These are build blocks, not calendar bookings. Coaching delivery and the existing daily operating commitments stay with their owning records. Publishing the first complete group need not wait for the last variant.

## Release checklist

### Group 1: twelve-week plan, readiness and chart

- [x] Local Inter Tight sans serif implemented across all 75 reading pages; representative phone and desktop views reviewed.
- [x] One complete twelve-week source drives overview, week view, units and print; all 84 days pass the schedule check.
- [x] All-easy candidate's prerequisites, run/walk interpretation, recovery, disruption and race-week rules retained together.
- [x] Readiness guide points only to available, compatible resources; scoped discovery check preserves the 60 existing search entries.
- [x] Chart uses 21,097.5 meters and 1,609.344 meters per mile; shared math passes 25 rows / 100 chart cells and regression checks.
- [x] Calculator rejects incomplete/malformed input and formats second/minute rollover correctly.
- [x] Local resource events use allowlisted non-personal parameters, remain separate from inquiries/purchases and respect GPC/DNT.
- [x] Chromium 153 checked at 375, 390, 430, 768, 1024 and 1440 pixels: all three resources, calculator, Library and a sample nested article. Miles/kilometers, week/hash navigation, no-JavaScript content, 200% text and malformed calculator input passed.
- [x] Three-page print output visually reviewed.
- [x] Small visual corrections, print cleanup and keyboard focus checks completed.
- [ ] Complete physical-phone and on-device Safari acceptance separately.
- [x] Established synthetic purchase (65), attribution (32) and email-outbox checks passed; no external messages sent and no live payment made.
- [ ] Verify production analytics collector receipt; local event emission is not delivery evidence.
- [x] First group released: merge `6952a1c48751caebd66fdb2ec3ce9be53cc3fb04`, Netlify production deploy `6ac54c5e25b74d0008f25716`, published October 6 at 19:30:52 UTC. Live browser verified all three routes, calculator and kilometer switching.
- [x] Four dedicated share cards and complete SEO metadata built and scoped checks passed.
- [ ] Publish/read back the new cards and metadata on the four resource/tool destinations.
- [x] Resource-only GA collector implemented with GPC/DNT suppression, campaign-label sanitization and trusted week-open tracking; 61 focused checks pass.
- [ ] Publish/read back resource measurement; verify actual GA collector receipt and Enhanced Measurement settings separately from local tests. Connected GSC Wizard currently returns payment_required, so Google-side account checks are not complete.

### Later resources

Six-week and faster-half candidates have been authored outside the deployable root for review. They are not published resources. Eight- and sixteen-week variants remain the next authoring backlog, with the same completion gates below.

- [ ] Six-week plan has a complete prescription, reviewed entry requirements and its own taper.
- [ ] Sixteen-week path has a reviewed beginning and explicit transition, not four generic added weeks.
- [ ] Eight-week plan has a distinct starting point and full reviewed schedule.
- [ ] Faster-half guide preserves uncertainty and offers appropriate next choices.
- [ ] New starting-program proposal, if pursued, is reviewed independently before availability is advertised.
- [ ] Completed later resources pass the same content, design and release gates; none are automatically published because their date arrived.

## Advertising and learning

Prepare the whole collection for discovery, then learn from one clearly scoped paid question at a time. Sequential tests are the proposed operating choice; they reduce ambiguity about which offer, message or destination changed. They are not a claim that a particular platform or budget has been approved.

For each proposed test record the audience need, destination/version, claim, creative, primary outcome, allowed spend, review point and stop condition before activation. A free-resource visit, week open or print request is resource use; it is not a lead or purchase. Observe progression to the appropriate next step separately. A purchase test requires the existing access/delivery path to be ready for that test.

Review actual exposure, resource use, accepted inquiries and purchases separately. Mark insufficient exposure as insufficient exposure. Keep destination revisions in the record. Search reviews at 7, 28 and 56 days after actual publication are observation points, not ranking deadlines. Reuse the existing Daily Brief and weekly commercial review; do not add overlapping automations.

## Evidence and current state

- Supplied consolidated handoff and original/review evidence read October 6. Owner's current build instruction takes precedence over its earlier no-build state and serif preference.
- Repository baseline: `8ebea0f1b93899058e2fd64dd4d0428d43319ab6`; remote `main` confirmed October 6 before this scoped roadmap edit.
- Source implementation: all three core resources are implemented and ready for owner review on `work/half-marathon-library-20261006`; review source commit `d865d97a31d086bec5bf748aa1f44a13d102ce27`, [draft PR #226](https://github.com/Breechay/speedandform/pull/226). This candidate was subsequently merged and published in the first release recorded above.
- Browser, schedule, pace, discovery, print and synthetic commercial evidence is summarized in the checklist above. Final bounded polish and keyboard checks passed. GitHub closure and existing Chromium/WebKit regression checks passed on the recorded source commit. They do not establish physical-device acceptance or production collection.
- Validation caveat: preexisting frozen discovery/share snapshots are not the current scoped acceptance suite. The three-resource discovery check passed while preserving 60 existing search entries; do not label the entire historical snapshot suite green from that result.
- Production publication: first group live as recorded above. Owner accepts physical-phone/on-device Safari as a follow-up. Analytics collector receipt remains unverified.
- Advertising: preparation only, pending the production destination, collector verification and concrete spending scope. No account, budget, campaign or delivery state changed.
- Next action: close the SEO/share and resource-measurement pass, verify GA receipt, then finish the separate six-week/faster-half candidates and author the eight-/sixteen-week paths.


## October 6 distribution pass and first-ad decision

The owner reconfirmed October 9 as the full-system readiness target. Keep the five passes, with two short design looks inside pass 3. Every new resource needs its own search title/description, canonical URL, representative share image and alt text, correct structured data, sitemap entry, internal discovery links, and a live browser readback. Native-message preview appearance and search indexing are observations after publication, not guaranteed by valid metadata.

**Today:** replace the generic card on the three resources and calculator with four dedicated 1200×630 cards, complete metadata, and add a dedicated public-resource collector. Source implementation and request emission do not establish GA receipt.

**October 7:** review and build the six-week plan and faster-half guide; author complete eight-/sixteen-week schedules with distinct prerequisites and transitions. Begin content checks before duplicating the design.

**October 8:** finish content, design, cross-links, print and QA for eligible plans. Each completed group can ship. Prepare one advertising package and verify collection on its exact destination.

**October 9:** review the complete system, shipped list and any named remaining blockers. Use this as the readiness target, not permission to publish an incomplete schedule.

**First experiment:** direct one clear message to the complete free twelve-week plan, naming its established-running starting point. Primary resource-use readout: measured landing sessions with at least one deliberate week open. Report that as schedule exploration, not adherence, a lead or a purchase. Print requests and onward visits are secondary; accepted inquiries and verified purchases stay distinct. Opening an incoming week hash must not count as deliberate engagement.

Prepare the test now. Activate before October 9 only if the destination, share cards, production collector receipt, actual account state, and an explicit platform/spending cap/review point/stop condition are confirmed. Keep existing paid-plan and Run Development acquisition tests distinct. The owner has not selected a new budget or platform in this instruction; no ads or spending changes are authorized by this roadmap.

## October 6 · Collection and standalone coaching continuation

Current source supersedes the earlier unwritten/draft-only status above:

- Complete six-week prepared-base plan: 42 day entries, four optional familiar steady sessions, 20/23/20/25/19/5 training miles; final race distance separate.
- Complete eight-week easy finish plan: 56 day entries, 19/20/16/20/21/22/16/4 training miles, distinct established-running entry.
- Complete sixteen-week foundation path: 112 day entries; first four totals 10/11/11/14, then exact twelve-week schedule parity. Fourth-run and recovery gate precedes transition; repeat preparation and move the date if needed. Not a half-from-zero promise.
- Faster-half guide connects observations, pacing, session purpose and recovery to the right next resource. All seven resources are in the Library, search index and sitemap.
- Run Development stands alone at `/coaching/miami/`; homepage coaching and both new page inquiry buttons keep the existing `/#begin` intake.
- 80 public pages receive current-house cards and normalized descriptive metadata. Four new half-marathon cards join the four already released. Dedicated product/study art outside the reviewed allowlist stays unchanged.

Verification: full Netlify build chain, exact schedule totals/rest/race placement, 16-week transition parity, metadata/canonical/image checks, existing measurement privacy checks plus new plan bounds. Chromium: 28 checks across 375/390/768/1440, unit switching, final-week selection, three print PDFs and no-JavaScript access. Physical iPhone and on-device Safari remain untested. The schedules are authored coaching templates, not clinically validated individual prescriptions.

Google readback: Windsor reports hostname `speedandform.com`, property 371147428, stream 5092063526 and matching measurement ID `G-HKG3MXM668`. October 6 report includes page views and coaching_intake_view/coaching_step_view. It does not yet show hm_resource_view or accepted-inquiry events. Enhanced Measurement settings are not exposed by this reporting connector. Do not equate configuration, form viewing or synthetic local events with accepted lead receipt. No test inquiry was submitted and no ads or budgets were changed.

Publication: prepared on `work/run-development-library-20261006` from `9e4d1e1`; merge/deployment receipt will be recorded after publication. Next: verify production routes and card URLs, obtain the new resource collector receipt, then owner aesthetic/coaching pass and bounded ad-test decision. October 9 remains the readiness target.
