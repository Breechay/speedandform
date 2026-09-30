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
- [ ] Full remote CI has not run because the source push is blocked. Historical editorial/share receipt checks are not claimed green: the unchanged `threshold-training.html` source already differs from its older Pass 4 receipt, and the shallow checkout lacks some historical baseline commits. The new commercial workflow has dedicated current source and browser checks.
- [ ] GitHub push and Netlify publication blocked by automatic approval review: the user authorized the build, but the review requires explicit authorization to publish source to `Breechay/speedandform`. No remote workaround was attempted. Existing production remains unchanged; no preview/deploy is claimed.
- [ ] WebKit/physical iPhone review is not claimed from Chromium emulation.

The new service pages are inquiry-first. No new service checkout is represented as working. Existing RPD checkout/entitlement is unchanged, and no purchase was made in testing. Google Search creative/settings are a documented draft, not an enabled campaign.

Current source checks were updated for the approved new headline and static hero. The older browser tests tied to the removed video or a prior four-question form are superseded in the coaching release workflow by `tests/commercial-release.cjs` and `tests/commercial-browser.cjs`. Existing measurement and doctrine checks remain. A pre-existing reading-theme ordering issue was repaired so a later authored style block cannot precede the shared reading theme incorrectly.

Rollback: revert the site release commit. To pause only new inquiry delivery, set the private `website-inquiries-v1` source state to unavailable; callers receive an error and can use email. Keep accepted operating items and their audit history. Removing the public RPC requires a separate non-destructive migration and should not delete inquiries.
