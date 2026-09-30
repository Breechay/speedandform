# Commercial release verification · September 30, 2026

Source branch: `work/commercial-home-20260930`, based on `06a6c82664814d0f9a4d2f5f50aecde2edebe8fe`.

- [x] Homepage first fold rebuilt with a shorter promise, personal introduction, original SF vector and real practice photography.
- [x] Six separate commercial pages with complete scope, prices, contact flow, canonical metadata, schema, sitemap and on-site search entries.
- [x] Original SF house mark applied at build time across the public catalog; application identities and private data unchanged. Older guide and plan HTML sources are retained; the shared identity transformation runs last during deployment.
- [x] Existing Run Development $1,200, Run + Strength $1,800 and RPD $79 purchase path retained.
- [x] New inquiries file to existing private operating items, with next-day follow-up; no duplicate CRM.
- [x] Migration applied to the existing FORM Athlete System. Route configured for the existing authorized console owner.
- [x] Transaction-only anonymous submission and retry accepted; one row created; rollback left zero QA rows. Anonymous direct SELECT and INSERT privileges remain false.
- [x] Chromium: 42 route/width views across 375, 390, 430, 768, 1024 and 1440 pixels without horizontal overflow. Homepage primary CTA stays above the mobile fold. Screenshots visually reviewed at 390 and 1440.
- [x] Enlarged text, receipt rejection, retained answers, prefilled email fallback, accepted retry with identical UUID, single lead event, original running intake, GPC and explicit QA write blocking tested offline with intercepted traffic. No live test emails or paid purchases.
- [x] Static commercial contracts, homepage metadata/copy/release checks, measurement tests, doctrine test, 44 account-access checks and reading-theme tests passed.
- [x] The exact Netlify build command completed locally. Its generated output passed the browser inquiry suite plus shared SF-mark checks on Library, strength guide, RPD plan and FORM landing page at 390 and 1440 pixels. Generated guide styling/branding is build output, not an unrelated rewrite of the authored guide sources.
- [x] Remote PR #182 Chromium source/browser checks and athlete ecosystem closure passed. Coaching workflow run `36779972714`; ecosystem run `36779972683`.
- [x] User explicitly authorized GitHub publication and Netlify deployment. PR #182 merged at `2c2e8c1f4305ee2b671bc5247408a2d1e88dcec8`. The connected GitHub upload tree exactly matched the locally tested source tree `8c11b15fe4b04e1faf490bcaa2ac7865a473a240`.
- [x] Netlify production deploy `6abd817a8a5d7f56db4cba49` is ready and published at `2026-09-30T21:39:19.275Z` on https://speedandform.com/. This was an API source upload from the merged main checkout; Netlify commit_ref is therefore null.
- [x] Live browser verified the new homepage first fold, SF identity, primary coaching navigation, all six commercial page headings and all five service inquiry forms. No broken images reported on the service/directory pages. No production test inquiry or purchase was submitted.
- [x] Evening repair: diagnostics isolated the WebKit 200% overflow to the native package dropdown. PR #183 replaces short package menus with wrapping radio choices and preserves offer routing. Chromium and WebKit both passed run `36789074719` on head `18a8ccb8428991f89d918fa36d232f26257e8ade`, including 42 views, 200% text and first-session/remote routing. Merged main: `865c2023593f557d5a9cc20921a05ab652f6f7f9`.
- [x] Repair published in Netlify production deploy `6abd95f9720ef10dcc94287c`; live running and strength package choices inspected and selected without submitting inquiries.
- [ ] Physical iPhone review remains open.
- [ ] Historical editorial/share receipt checks are not claimed green: the unchanged `threshold-training.html` source already differs from its older Pass 4 receipt, and the shallow checkout lacks some historical baseline commits. The dedicated commercial source/browser checks passed in Chromium.

The new service pages are inquiry-first. No new service checkout is represented as working. Existing RPD checkout/entitlement is unchanged, and no purchase was made in testing. Google Search creative/settings are a documented draft, not an enabled campaign.

Current source checks were updated for the approved new headline and static hero. The older browser tests tied to the removed video or a prior four-question form are superseded in the coaching release workflow by `tests/commercial-release.cjs` and `tests/commercial-browser.cjs`. Existing measurement and doctrine checks remain. A pre-existing reading-theme ordering issue was repaired so a later authored style block cannot precede the shared reading theme incorrectly.

Rollback: revert the site release commit. To pause only new inquiry delivery, set the private `website-inquiries-v1` source state to unavailable; callers receive an error and can use email. Keep accepted operating items and their audit history. Removing the public RPC requires a separate non-destructive migration and should not delete inquiries.


## Independent-review repairs, September 30 evening

Source/live reproduction confirmed that Run + Strength and strength first-session CTAs did not select their corresponding form options. The repair selects and focuses the chosen radio and brings its group into view, while neutral CTAs preserve manual choices. Hero secondary links stay within the current service decision. Plans now presents the existing product cards before the methodology, with the same prerequisites, four-week RPD preview and $79 price.

The reported free/full-plan contradiction was not present in current source or live page. Share metadata is also present. Brice explicitly approved eight private Miami running sessions during this review. Homepage and running page now state one each week, with programming and adjustments; remote delivery remains separately agreed. No new pricing, proof claim, discount, outreach or ad spend was introduced. Browser regression now follows the actual package buttons through intercepted receipt payloads, checks visibility/focus and manual overrides, and checks plan order/reflow. CI and production receipt to be appended after verification.

Owner follow-up: session duration is 45–60 minutes. Complimentary Miami running assessment is now the inquiry entry point, arranged by email and separate from the eight paid sessions. The public representative sample remains a different, unfinished proof asset.

Brice requested current-athlete examples. Three running-page cards cover Natalie’s half-marathon goal, Valerie’s outdoor 5K goal and Hope/José’s already-public September 29 six-mile study. Homepage links to the examples. Goals and recorded outcomes remain distinct; no private health details or new athlete imagery are included.

Owner clarified whole-week delivery: running assignments, cues, targeted exercises, video feedback, long-term programming context and adjustment of training load/recovery. Homepage scope and running page now describe that relationship; Hope and José are identified as remote coaching examples. No guaranteed efficiency/speed claim was added.
