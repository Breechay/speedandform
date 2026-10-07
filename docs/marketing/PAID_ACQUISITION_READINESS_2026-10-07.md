# Speed & Form: paid-acquisition learning and readiness report

**October 7, 2026 | Owner: Brice | Status: deliberate paid-launch hold.**

> Preserve the published work. Continue light evidence collection and preparation. Do not resume advertising because a date arrives or tracking turns green. The national free-plan proposal is withdrawn, not merely awaiting a technical checkbox. A later paid launch requires a new explicit owner decision.

## 1. Decision and scope

Brice asked to save everything learned, pause active advertising work for a while, and keep collecting information that will help determine what is actually good for Speed & Form. There is no replacement launch date, approved campaign, platform or budget.

The pause applies to paid-launch execution and unnecessary ad-related building. It does not close coaching, other live offers, free resources, current client delivery or creative practice. Broad offer availability is compatible with focused paid acquisition later.

Continuing work is read-only observation, preserving evidence, bounded research when existing access permits, and useful drafts. It does not authorize campaign creation even while paused, activation/resume, budget/bid/keyword changes, GA changes, organic posts, third-party sends, athlete referral messages, purchases, subscriptions, bookings, additional live test inquiries or production changes.

The detailed historical numbers are in [the evidence appendix](PAID_ACQUISITION_EVIDENCE_2026-10-07.md). Future account/customer evidence stays in the existing private Operating Console. This report is the stable decision baseline, not a second customer database.

## 2. Published work versus business readiness

The connected twelve-, six-, eight- and sixteen-week half-marathon resources, readiness guide, pace chart and faster-half guide are published. Run Development is available at `/coaching/miami/`; the homepage coaching door intentionally still uses `/#begin`. Free plans remain complete without an email/account gate. Eighty public pages received refreshed share cards and SEO metadata. The originating release recorded automated checks, browser-size phone review and Brice's actual iPhone/Safari acceptance. These facts establish release readiness, not demand or acquisition economics.

Canonical URLs:
- `/library/half-marathon-training-plan/`
- `/library/6-week-half-marathon-training-plan/`
- `/library/8-week-half-marathon-training-plan/`
- `/library/16-week-half-marathon-training-plan/`
- `/library/how-long-to-train-for-a-half-marathon/`
- `/library/half-marathon-pace-chart/`
- `/library/how-to-run-a-faster-half-marathon/`
- `/coaching/miami/`

Do not author more variants for this launch or reopen completed design absent a concrete defect or owner correction. Keep distinct starting requirements and the sixteen-week transition check. These are authored general templates, not personalized clearance. Existing coached athletes retain their assignments.

### Implementation continuity

PR #237 delivered the collection/coaching continuation; production verification was established in the originating stream. PR #248, merge `1970a6afdcee1263f71057f2e319b28d91229bff`, preserved an earlier state whose outstanding-gate and ad-proposal language is superseded here.

PR #253, merge `83347b9df49f5e621fb6b6082f5319ab706c9044`, moved lead tracking into the shared submission helper after backend acceptance, with a duplicate guard and homepage cache-bust. Its original production receipt was Netlify `6ac5a7b04f179a000836ba93`, published October 7 at 02:00:42 UTC. Tests and publication did not prove Google receipt or the original missing-event cause.

At archival, main was `7aab567c9c5705b0ede4847c6def88e7d3f1af54`, including reading-room PR #254. A fresh Netlify read returned that commit in ready production deploy `6ac60d27de5d80000850d8a3`, published October 7 at 09:13:26 UTC. This supersedes #254's older “Not deployed” wording, but does not establish a physical-device check after #254. Newer open Forge work was checked and left alone. Documentation is not authorization to deploy its unrelated changes.

## 3. What the paid evidence tells us

The completed October 7 Google Ads read for **RPTL Search Test 01, October 3–6**, returned **PAUSED**, **38 clicks**, **$53.01**, **1,067 impressions**, and **zero reported conversions**. This snapshot was not refreshed merely by archiving it. It does not establish every other campaign's state.

The query-level report contained 317 date/query rows. The preserved extract includes all **22 positive-click rows**, covering **21 queries**, **23 clicks** and **$32.62**. The **15 clicks/$20.39** difference is not attributable to named queries in this extract. The appendix explicitly omits 295 zero-click rows; it is not a complete 317-row raw export. Never invent the missing queries.

Named rows explain 60.5% of clicks and 61.5% of spend. Google withholds some terms for privacy, but that does not prove the explanation for every missing dollar in this account [G1].

Some paid clicks clearly had weak fit with the experienced-runner half-marathon product: `marathon pacing`, `3.45 marathon pace`, `sub 21 minute 5k`, `meal plan for half marathon training`, and `couch to half marathon in 4 months`. Other queries were broad half-marathon information/plan searches. This supports investigating intent and eligibility. It does not prove that every visitor was unsuitable or that those mismatches alone explain the outcome.

An earlier October 6 brief had already recorded a 256-row query-only read without per-query clicks/cost. “Nobody read the terms” overstated the gap. What was missing was reconciled spending analysis.

Historical CPC was **$1.395**, approximately $1.40. It is not a forecast for another offer, location, date or keyword set. Zero reported ad conversions is not independently verified zero actual sales. Reconcile actual payments, refunds, access and delivery separately.

A paused campaign will not generate fresh paid-traffic evidence merely because time passes. Observation can reveal delayed/revised reports, organic/referral activity, inquiries, delivery issues and better market information. It cannot validate an unexposed paid hypothesis.

## 4. Measurement findings and corrections

The public tag is `G-HKG3MXM668`. The historical Team Vinchay stream name/URL coexists with verified `speedandform.com` reporting. Do not create a duplicate property/tag to fix a label.

### Settings and access

Owner screenshots showed Enhanced Measurement on, Page views on, and Scrolls, Outbound clicks, Site search, Form interactions, Video engagement and File downloads off. Preserve that minimal configuration pending a specific decision. Automatic Form interactions is not a substitute for accepted-inquiry measurement. Collapsed Page views advanced settings were not inspected; the earlier blanket “exactly right” assessment was stronger than the evidence.

The reporting connection did not expose Admin settings or inherit Brice's Chrome cookies. A pasted URL did not supply a signed-in session. The separate browser sign-in was not completed. Do not repeat password recovery/setup requests; preserve any account-only gap and use a less burdensome route when available.

### What Google actually received

The October 6, 21:11 owner screenshot visibly showed `hm_resource_view` and a faster-half-guide page view. It did not show `hm_week_open`. Marking the whole half-marathon family complete was incorrect.

The preserved completed reporting read requested October 6–7 and returned fetch timestamp **2026-10-07T14:44:44 UTC**, 10:44:44 a.m. Miami time. It contained four `hm_resource_view` events: two on the sixteen-week page, one on readiness and one on faster-half. All were dated October 6. No `hm_week_open`, `generate_lead` or matching twelve-week-page row was returned. These are event counts, not four proven prospects.

A fetch timestamp is not a finalized reporting cutoff. Pending jobs, errors, cached reads and completed empty reports must remain different. Earlier handling that converted an absent data array in a pending response into “no events” was not valid evidence. Realtime is a recent-window, best-effort report, not a historical log or guaranteed immediate receipt [G2]. An old test disappearing from its window does not prove a code defect.

### The inquiry tests

Two labeled production test inquiries were submitted in the preceding launch stream, one before and one after PR #253. The browser reported the accepted success screen. They are QA, not customers. No further test is authorized by this report or the recurring watch.

The homepage accepts inquiries into the private Console/database. The success screen proves neither notification dispatch, email inbox delivery nor GA/Meta receipt. The earlier promise of an actual test email was not established. Source/backend acceptance, dispatch, inbox delivery and tracking must be checked separately.

PR #253 was a deployed code change, not a demonstrated root-cause fix. When resumed, inspect deployed/source parity, callback availability/timing, tracker exception isolation, outgoing request and Google receipt. In particular, a tracking exception must not convert an already accepted inquiry into apparent failure. These are diagnostic requirements, not an asserted diagnosis.

A later explicitly approved test should capture: normal form interaction; one accepted backend response; normal callback with allowlisted non-personal parameters; GA request to the correct measurement ID and its response/error; Google-side receipt; and separate private test classification. Never invoke `gtag`/`formTrackLead` directly, remove privacy protections, send raw answers, or keep submitting until a desired number appears. Duplicate/rejected requests must not create extra leads.

## 5. Why the national proposal was withdrawn

The former draft was a distinct Google Search test to the free twelve-week plan: US, English, Search only, tight exact/phrase plan terms, approximately $10 average daily budget, $60 intended total, review at $30, seven-day/$60 stop, and an early stop at $30 with zero deliberate week opens. Draft copy emphasized an established base, a complete free schedule, no email gate and four outings most weeks. It was never spend authorization.

**The metric was incomplete.** The full schedule is visible and printable. `hm_week_open` captures one control interaction, not all plan use. Zero selector events cannot establish that nobody used the plan. Do not hide useful content or add friction simply to force measurement.

**The business job was under-specified.** The proposed national free-resource audience did not have a sufficiently justified next commercial step. Run Development is strongly Miami-first, but explicitly includes a closing remote-coaching invitation and links to Analysis and Plans. Thus “national readers cannot buy” is too strong; audience-to-offer fit remains unproved.

**Small samples need a narrow purpose.** At unchanged historical CPC, $60 would produce roughly 43 clicks. That may expose gross relevance or technical faults; it cannot alone establish profitable, repeatable acquisition or no demand. There is no universal minimum independent of baseline and decision. A larger budget does not repair a poor outcome measure.

**The proposed cap was not an implemented control.** Google daily budgets are averages with possible overdelivery [G3]. A periodic check at $60 is not a hard $60 cap. Verify a suitable campaign-specific control, billing/reporting limitations and stop process before promising a limit. Do not assume a native total-budget feature exists for the actual campaign. A scheduled assistant is not a hard spending limiter.

**Negative themes cannot be copied blindly.** Broadly excluding the token `marathon` can also exclude wanted half-marathon queries. Inspect query, matched keyword, match type, network and destination; use precise exclusions for actual mismatch [G4]. Competitor or beginner intent is not automatically worthless outside the offer context.

**Independent review must stay independent.** “Change no live settings” is valid. “Do not challenge the strategy/destination/metric” is not. Reviewers can question any commercial assumption; Brice makes the final choice. The obsolete proposal, budget and week-open stop rule must not become defaults in future tasks.

## 6. Timing without artificial deadlines

Official organizer pages rechecked October 7 give **January 31, 2027** and **general registration sold out**. They also describe rolling selections from the previously closed waitlist, so do not equate general sellout with no possible organizer entry route [G5]. No race-entry availability or official partnership should be implied.

Counting complete Monday–Sunday weeks ending on race Sunday gives **October 12, 2026** for sixteen weeks and **November 9, 2026** for twelve weeks. November 2 is the preceding promotional week. These are calendar calculations, not personalized readiness or campaign dates. The reviewer’s nearly-20,000-runner figure is not independently established here as the reachable local half-marathon market.

The proposed organic route was the existing practice, Instagram and willing personal forwarding. It is a low-cash-cost candidate, not proof of a referral engine or permission to post/message. Existing athlete assignments remain unchanged. Drafts can be prepared; Brice decides whether to use them.

October 16 and the November local paid window were reviewer suggestions, not adopted restart dates. Miami-Dade/Broward targeting needs service-area, audience and economics evidence. County-specific Keyword Planner estimates were not obtained. A runner entering Miami from elsewhere is not necessarily a local weekly-coaching prospect.

## 7. What preparation should improve

**Working recommendation:** make the available work easier to trust, inquire about, buy, receive and continue. Paid traffic should amplify a plausible customer path, not compensate for an unproven one.

Keep all live doors available. Assess their jobs separately:

| Lane | Evidence that helps | Do not assume |
| --- | --- | --- |
| Local coaching | Real goals, qualified inquiries, fit conversations, capacity, paid starts and delivery time | Every plan reader wants coaching or can travel |
| Remote coaching / Analysis | Non-local questions, actual scope, credible sample and delivery | A small remote invitation proves national acquisition |
| Paid self-guided plan | Suitable previews, genuine purchases, access/restore/print and successful use | Payment, entitlement and customer success are identical |
| Free Library / practice | Reader questions, voluntary referrals, resource behavior and confirmed attendance | Selector action, RSVP or a tap proves use/revenue |
| Photography/content/other services | Named buyer/use, permissioned sample, paid scope, costs, hours and desire to repeat | Each offer needs its own campaign or must close until coaching sells |
| Hospitality/creative relationships | Real host/buyer interest, responsibilities, costs and rights | A prospect is a client, funder or confirmed venue |

Classify commercial threads as **brings money in**, **costs money**, or **learning**, with conditional/mixed roles explicit. Public asking prices are not realized sales. Include delivery, support and travel time in economics, not just headline revenue. Capacity and Brice's desire to repeat the work matter.

When Brice returns to hands-on preparation, one permission-cleared example of the coaching experience or one evidence-capturing buyer-path diagnostic is more useful than another plan page. Current weekly practice can supply proof and real questions without staging invented outcomes. Follow [Brand](../BRAND.md), real photography, plain voice and existing generators.

## 8. Light observation, not a new build sprint

The existing **Paid Test Gate** automation was repurposed into **Ads Readiness Watch**, with Monday/Thursday condition-based checks. It is not an hourly test loop or autonomous advertiser. The private evidence context is `paid-acquisition-readiness-evidence-20261007`; existing Daily Operating Brief and Weekly Company Review reuse it. Broad Opportunity Watch retains its own discovery remit.

The watch checks existing ad status/unexpected spend, actual GA receipt and relevant organic/referral activity, and genuinely new private inquiries/payment/access issues. It reuses completed receipts and records requested period, fetched time, filters, maturity, source and limitations. It does not re-pull an unchanged historical query list on every run.

Preparation is limited to at most one useful new finding or draft revision per run: a concrete mismatch, real objection, permission/proof gap, supported local estimate or delivery issue. For Keyword Planner, require the actual named counties, English, Google Search, displayed period and estimate type. National estimates are not local ones; top-of-page bids are not expected CPC; Search Console visibility is not market-wide demand [G6]. Record unavailable access once without buying a subscription.

Meaningful changes are saved privately with owner-scoped optimistic updates/readback. No current-day timestamp is substituted for an unknown source cutoff. Tests remain excluded from demand. No material change means silence, not another launch checklist. Scheduled future checks are not already completed work.

No standing permission to mutate Ads/GA, publish, send, recruit athletes, book, pay, submit tests, or edit/deploy code comes from this watch. A readiness alert can lead only to a later owner decision. The repository remains a stable report, not an automatically public customer log.

## 9. Conditions for a later decision

A new one-page decision sheet should establish:
1. **Business job:** one offer/outcome and why paid attention is warranted over current organic/referral routes.
2. **Audience/destination:** people who can use/buy the offer, a truthful message and a working next step.
3. **Delivery/capacity:** actual scope, ownership/support, permissions, available capacity and remaining unknowns.
4. **Measurement:** business-relevant primary outcome, separate diagnostic measures, privacy, test exclusion and verified receipt where needed.
5. **Economics/learning:** contribution after known costs/time, provisional acceptable acquisition cost, realistic exposure, and an explicit inconclusive outcome. Do not invent conversion rates to complete a model.
6. **Controls/approval:** fresh account read, exact platform/campaign/geography/dates, owner-approved total budget, verified limit/stop process, review owner and explicit Brice activation approval.

Coaching inquiries are intermediate: qualification and paid starts determine commercial value. Paid-plan purchases require access/use evidence. A free-resource/community experiment needs a defined business learning worth its cost, allowing for incomplete use measurement. A tap is not attendance and attendance is not a paying client.

**Open:** `hm_week_open` and `generate_lead` Google receipt; twelve-week collection; missing-event cause/account diagnostics; local estimates; paid audience/outcome/economics and enforceable cap; customer-delivery acceptance for any later advertised product. Do not close these to satisfy the old sprint.

**Next step now:** maintain the hold, collect only useful changes through the watch, and protect existing coaching/creative/customer work. Present evidence and a choice when renewed attention is justified. No launch date is owed.

## Sources and evidence ownership

- [Evidence appendix](PAID_ACQUISITION_EVIDENCE_2026-10-07.md): original artifact hash, all preserved positive-click rows, reconciliation, GA snapshot and exact deploy receipts. Owner screenshots remain private.
- [Half-marathon roadmap](../roadmap/HALF-MARATHON-LIBRARY-20261006.md), [Agent Orientation](../AGENT_ORIENTATION.md), [Console contract](../operations/CONSOLE-CONTRACT.md), [ecosystem plan](../SPEED_AND_FORM_ECOSYSTEM_OPERATING_PLAN_2026-10.md), [Brand](../BRAND.md).
- [PR #237](https://github.com/Breechay/speedandform/pull/237), [#248](https://github.com/Breechay/speedandform/pull/248), [#253](https://github.com/Breechay/speedandform/pull/253), [#254](https://github.com/Breechay/speedandform/pull/254).
- [Twelve-week source](../../library/half-marathon-training-plan/index.html) and [Run Development source](../../coaching/miami/index.html), checked in the preceding evidence review.
- **[G1]** [Google search terms insights](https://support.google.com/google-ads/answer/11386930?hl=en).
- **[G2]** [GA Realtime](https://support.google.com/analytics/answer/9271392?hl=en).
- **[G3]** [Daily budget/overdelivery](https://support.google.com/google-ads/answer/1704443?hl=en).
- **[G4]** [Negative keywords](https://support.google.com/google-ads/answer/2453972?hl=en).
- **[G5]** Organizer [Half Marathon](https://www.themiamimarathon.com/half-marathon/) and [Registration](https://www.themiamimarathon.com/registration/).
- **[G6]** [Keyword Planner metrics/forecasts](https://support.google.com/google-ads/answer/3022575?hl=en).

Official pages above were checked October 7; recheck time-sensitive claims before later action. This is the owner's requested business-level retrospective. No private contact records, medical/banking facts, credentials, cookies, raw intake answers or payment identifiers are published here.
