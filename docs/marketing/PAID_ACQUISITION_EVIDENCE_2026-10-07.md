# Speed & Form: paid-acquisition evidence snapshot

**Snapshot:** October 7, 2026. This is historical evidence, not current campaign authorization. Read [the decision report](PAID_ACQUISITION_READINESS_2026-10-07.md) first. Private account access, inquiry identities and raw customer records remain in the Operating Console.

## Source and limits

Source artifact: `Speed-and-Form-Read-Only-Launch-Evidence-2026-10-07.md`, read in full in the originating conversation. Original SHA-256: `9f8576806bf04663a0772d7ecf60308c15dedd96785b61d998ad0bb3c3c51848`.

The numbers below came from completed Windsor.ai Google Ads/GA4 reads in the October 7 review. They were not refreshed merely by archiving this report. Totals, coverage and calendar dates were recalculated during archival. Account IDs and report-job identifiers are retained in the private evidence context rather than duplicated here.

## 1. RPTL Search Test 01: October 3–6, inclusive

The completed campaign report returned state **PAUSED**. This is the state observed in that report, not a claim about every campaign or later account activity.

| Date | Clicks | Cost, USD | Impressions | Reported conversions |
| --- | ---: | ---: | ---: | ---: |
| 2026-10-03 | 5 | 7.36 | 149 | 0 |
| 2026-10-04 | 15 | 20.41 | 509 | 0 |
| 2026-10-05 | 13 | 17.95 | 339 | 0 |
| 2026-10-06 | 5 | 7.29 | 70 | 0 |
| **Total** | **38** | **53.01** | **1,067** | **0** |

Calculated average CPC: **$1.395**, approximately $1.40. This is not a forecast for another campaign, destination, period or geography. Zero reported advertising conversions is not independently verified zero actual revenue.

## 2. Every disclosed positive-click row in the preserved extract

The completed search-term report returned **317 date/query rows**. This appendix preserves all **22 positive-click rows**, covering **21 distinct queries**. The **295 zero-click rows are not reproduced**. All rows below have zero reported conversions. Impressions belong to the displayed day/query row, not necessarily its full-period query total. Do not reconstruct missing rows or describe this as the complete 317-row raw export.

| Date | Search query | Clicks | Cost, USD | Impressions |
| --- | --- | ---: | ---: | ---: |
| 2026-10-03 | marathon pacing | 1 | 1.50 | 11 |
| 2026-10-04 | 3.45 marathon pace | 1 | 1.49 | 2 |
| 2026-10-04 | couch to half marathon in 4 months | 1 | 1.40 | 1 |
| 2026-10-04 | hal higdon half marathon training | 1 | 1.49 | 5 |
| 2026-10-04 | marathon pacing | 1 | 1.50 | 5 |
| 2026-10-04 | meal plan for half marathon training | 1 | 1.47 | 1 |
| 2026-10-04 | sub 21 minute 5k | 1 | 1.49 | 2 |
| 2026-10-04 | train for half marathon | 1 | 1.40 | 1 |
| 2026-10-04 | training program for half marathon | 1 | 1.47 | 4 |
| 2026-10-05 | half marathon running plan | 1 | 1.48 | 1 |
| 2026-10-05 | half marathon training | 2 | 2.96 | 23 |
| 2026-10-05 | half marathon training 12 weeks | 1 | 1.50 | 1 |
| 2026-10-05 | half marathon training schedule | 1 | 1.39 | 4 |
| 2026-10-05 | how to train for a half marathon | 1 | 1.43 | 23 |
| 2026-10-05 | how to train for half marathon | 1 | 1.41 | 7 |
| 2026-10-05 | running a half marathon for the first time | 1 | 1.50 | 1 |
| 2026-10-05 | running half marathon with little training | 1 | 0.36 | 1 |
| 2026-10-05 | training for half marathon | 1 | 1.45 | 6 |
| 2026-10-06 | 3 month running plan for half marathon | 1 | 1.46 | 1 |
| 2026-10-06 | 4 month half marathon training schedule | 1 | 1.49 | 1 |
| 2026-10-06 | training for a half marathon | 1 | 1.49 | 2 |
| 2026-10-06 | training guide half marathon | 1 | 1.49 | 1 |

### Reconciliation

| Scope | Clicks | Cost, USD |
| --- | ---: | ---: |
| Campaign total | 38 | 53.01 |
| Disclosed positive-click terms | 23 | 32.62 |
| Difference not attributable to named queries in this extract | 15 | 20.39 |

Named terms account for **60.5% of clicks** and **61.5% of cost**. Google documents that some terms are withheld for privacy. This does not establish the cause of every dollar of this extract's gap, and does not justify classifying all undisclosed spend as irrelevant. [Google: search terms insights](https://support.google.com/google-ads/answer/11386930?hl=en).

An earlier October 6 Half-Marathon Agent Brief recorded a **256-row query-only read**, without established per-query clicks/cost. “No one read the terms” overstated the gap. Reconciled query-level spend analysis was missing; this extract addresses part of that gap.

## 3. GA4 reporting snapshot

The preserved completed report requested October 6–7, 2026 and the events `hm_resource_view`, `hm_week_open`, `generate_lead`. Returned fetch timestamp: **2026-10-07T14:44:44 UTC**, or **10:44:44 a.m. Miami time**. All returned rows have hostname `speedandform.com` and event date October 6.

| Page path | Event | Count |
| --- | --- | ---: |
| `/library/16-week-half-marathon-training-plan/` | `hm_resource_view` | 2 |
| `/library/how-long-to-train-for-a-half-marathon/` | `hm_resource_view` | 1 |
| `/library/how-to-run-a-faster-half-marathon/` | `hm_resource_view` | 1 |

No `hm_week_open` or `generate_lead` row was returned. No matching twelve-week landing-page row was returned. These are four events, not four proven distinct prospects. A fetch timestamp is not a finalized data cutoff. Current-day processing, filters, browser transport and collector receipt remain distinct.

The owner screenshot at October 6, 21:11 visibly showed `hm_resource_view`, a faster-half-guide page view, `page_view` and `user_engagement`. It did not show `hm_week_open`. Screenshots with account imagery remain private; the report records only relevant observations.

This snapshot is not a direct Realtime/DebugView inspection. Pending jobs, errors and cached reads are not completed zero-result reports. Known labeled test inquiries are not customers.

## 4. Live-page evidence from the preceding review

The [twelve-week plan](https://speedandform.com/library/half-marathon-training-plan/) contains its complete schedule in a table and offers print functionality. A week-selector interaction is unnecessary to read that table. Missing `hm_week_open` alone cannot establish no plan use.

The [Run Development page](https://speedandform.com/coaching/miami/) leads with eight weeks, $1,200, and one private Miami session per week. Its closing section explicitly invites people outside Miami to ask about remote coaching in the same form. Analysis and Plans are linked. The accurate description is **local-first with a remote option**, not no commercial path for non-local readers.

## 5. Calendar and organizer facts

Official [half-marathon](https://www.themiamimarathon.com/half-marathon/) and [registration](https://www.themiamimarathon.com/registration/) pages were checked again during October 7 archival. Race date: **January 31, 2027**. **General registration is sold out**. The organizer also describes rolling selections from the previously closed waitlist; do not claim that all possible organizer entry routes are closed.

For full Monday–Sunday weeks ending on race Sunday:
- 16-week start: **October 12, 2026**.
- 12-week start: **November 9, 2026**.
- November 2 is the preceding promotional week, not the twelve-week start.

Calendar alignment is not individualized readiness. The [sixteen-week path](https://speedandform.com/library/16-week-half-marathon-training-plan/) retains its transition check. No campaign date or athlete reassignment follows automatically. The reviewer's nearly-20,000-runner figure is not independently established here as the reachable local half-marathon market.

## 6. Repository and production read during archival

Main: `7aab567c9c5705b0ede4847c6def88e7d3f1af54`, containing PR #254. Netlify returned the same commit in production deploy `6ac60d27de5d80000850d8a3`, state `ready`, published **2026-10-07T09:13:26.191Z**. This supersedes #254's older “Not deployed” text but does not establish physical-device acceptance after that revision.

Accepted-inquiry code change: [PR #253](https://github.com/Breechay/speedandform/pull/253), merge `83347b9df49f5e621fb6b6082f5319ab706c9044`. Its originating production receipt was `6ac5a7b04f179a000836ba93`, published **2026-10-07T02:00:42.189Z**. CI and publication are not Google receipt or proof of the missing-event root cause.

## 7. Still unverified

`hm_week_open` and `generate_lead` receipt; the twelve-week destination's collection path; root cause of the missing events; exact account-only diagnostics; Miami-Dade/Broward Keyword Planner estimates; justified paid audience/outcome/economics; enforceable spend controls; and separate customer-delivery acceptance for any later advertised product.

No local keyword forecast was obtained. Do not substitute national figures. This archival pass did not create ads, change settings, submit another inquiry or make a purchase.
