# Contact and Field Notes: Pass 6A

Owner: Brice. Single register: `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release state

**LIVE and verified September 17, 2026.** Netlify deployment **`6aabf54cf4147d0008d86eb2`**, published **14:12:49.443 UTC**, serves the release on existing site `f3914a6a-a9ce-465e-8212-f5f42597c469`, speedandform.com. Its production commit is **`33aa3c3a066246620af05a6dc224d0ec05134cd7`**. PR #131 delivered the publication and contact page; PR #132 completed the scoped Ask delivery repair. PR #133 changes only the browser acceptance test and merged as `c1152481422aa3bdd94d56d4a4b2207fab5d56ad` with `[skip netlify]`. Hosting was re-read after that merge and still serves the verified runtime deployment. No manual production deployment was executed.

Field Notes now opens with **“From the practice.”** Four revised essays have permanent shareable addresses and related reading. **Ask Brice** provides a separate ordinary-question route with an optional local draft, email handoff and copy recovery. The **RSS reader feed** contains the four notes and the published track album. Library, search and 404 expose these destinations. **Email newsletter confirmation, delivery and unsubscribe remain Pass 6B, not delivered by this release.**

## Final acceptance

**Consolidated main run `35234336351` passed** at test-only main `c1152481422aa3bdd94d56d4a4b2207fab5d56ad`. Downloaded final artifact **`10503441287`**, `contact-notes-receipt`, records that exact commit. It contains fifteen source-suite results, deterministic publishing checks, **240 Notes/Ask browser checks in Chromium and 240 in WebKit**, plus **865 existing-page browser checks**. These are **1,345 served-page browser checks**, not physical-device tests.

The same main run passed **108 actual live checks in each engine**, including the plain email route with JavaScript disabled, draft/copy/recovery behavior, four note addresses, the reader feed and its real destinations, keyboard access, text reflow and safe sharing. No submission requests were attempted. Fourteen automatically injected hosting-script GETs on reading pages were blocked in each live suite; none originated from Ask. The test did not allow the collector to load or execute.

All **eight production verification reports passed**, from **14:37:35.857 through 14:38:36.977 UTC**, without retries. They cover nine reviewed publication/discovery HTML files and six publication resources, both app pages and their assets, eight revised guides, **all 77 canonical URLs**, six discovery resources and six route cases, **19 sharing-page previews and ten distinct image URLs**, and **two gallery pages with twenty media/download resources**. The photo ZIP and original film remain intact. The RSS response has its correct content type. Ask has the required no-transform header and no injected email decoder. Exact HTML is checked after only the specifically documented privacy-link rewrite below.

The final artifact includes source/served/live reports, exact revision, manifests and screenshots, **no font files, credentials or repository source bundle**. Actions retention is fourteen days; this receipt and the manifest preserve the permanent record. Test-only PR #133 and this documentation closure do not require another public deployment.

Source acceptance independently verifies **173 other pre-existing HTML files**, current app identities and gallery media, guide tools, and protected purchase/private routes. The exact Ask-header repair separately compares **210 public HTML, style, script and routing sources** against its baseline and proves that only the specified response-header block was appended to TOML. No wildcard test exclusion replaces those comparisons.

Notes/Ask browser coverage includes 375, 390, 430, 768, 1024 and 1440 pixel widths, text enlargement, keyboard navigation, native disclosures, no-JavaScript reading, public note/feed destinations, UTF-8 draft encoding, safe article context, denied-clipboard manual recovery, long drafts, reload privacy, canceled sharing and canonical-only sharing. Actual public screenshots from Chromium and WebKit were downloaded and visually reviewed at 390 and 1440 pixels; the final main screenshots match the inspected live screenshots exactly.

**Limits:** a browser viewport is not a physical iPhone/iPad. Physical-device Safari, screen-reader output, native email/share sheets, actual inbox delivery and importing the feed into a third-party reader remain unverified. No real message, lead, signup, subscriber import, campaign, payment or athlete record was created by the tests. No conversion, ranking, indexing improvement or numerical design-quality score is claimed. Existing-page tests and public GET checks are not a completed payment transaction or a fresh editorial rewrite of every Library page.

## The bounded decision

**6A owns Ask Brice, the existing Field Notes publication, a reader feed and their discovery routes.** 6B owns confirmed opt-in email and unsubscribe delivery. A verified sender is not enough to publish a working newsletter signup. No placeholder signup or email-subscription success message is published here.

`/ask/` gives an ordinary question a lower-pressure route than coaching intake. It shows the existing public `brice@speedandform.com` address and lets visitors draft a question, open email or copy the text. Public article context comes only from a fixed allowlist. No free-text message, arbitrary referrer or personal email address is accepted through the arrival URL. The draft is not submitted to a website service, saved in browser storage, placed in analytics or added to an audience. Opening an email app is not reported as sending or delivery. Long drafts can be copied without truncation rather than depending on oversized mailto URLs. Visitors review and send in their own mail app. This is an intentional handoff, not a newly deployed relay or inbox-delivery claim.

`/field-notes` already existed. Eight longer opinion notes mixed useful principles with old schedule details and universal claims. Four short revised editions retain the useful ideas: leaving margin in a session, repeating a week with judgment, valuing ordinary runs and making group purpose clear. Each has a distinct title/description, related reading and question/share actions. They are coaching reflections, not evidence from invented sessions or prescriptions for every reader. Provenance is in `scripts/field-notes-content.cjs`; pre-edit copy remains in Git at `780f409ed521f3c6290c19e0d80279331bf4eecc`. No original publication date is invented.

The existing photographed note at `/notes`, Labs, eight revised guides, independently updated coaching homepage/intake, both app landing pages with José/Adrian illustrations, training portal and gallery remain unchanged by this pass. Field Notes uses the approved gallery cover and labels it an earlier selection, not a new dated session. No unpublished media was introduced.

The RSS 2.0 feed at `/field-notes/feed.xml` has four notes and the published album, stable canonical GUIDs, channel metadata, a self link and the correct HTTP content type. The undated album gets no made-up publication date. This is a **reader feed, not email delivery**. The generator includes only entries marked `published: true`. No posting cadence or Saturday schedule was invented.

## Discovery and concurrent work

Four existing HTML files changed: Field Notes, Library, search and 404. Five new HTML routes were added: Ask and four essays. The Library retains all **47 earlier entries** and gains Field Notes, for **48**. Its footer, search footer and 404 footer gain Ask and Field Notes; the Library coaching invitation gains a separate ordinary-question link. The sitemap retains its **72 previous canonical addresses** and adds five, for **77**. No authenticated or purchase-confirmation page was added.

`CONTACT-NOTES-MANIFEST-20260917.json` pins reviewed HTML, helpers, feed and discovery integration. Earlier source tests recognize exact subsequent snapshots, not arbitrary changes. Historical receipts retain their original results.

Concurrent PR #130 independently published homepage copy as `4554f3acb0dd67060b916e662d11a9d115ecc633`. All five files were merged unchanged. The homepage remains blob `84a82b0631debcfff9ed6bf7581b8425665792a5`, pinned in `scripts/protected-site-baseline.cjs`; PR #128 measurement remains unchanged. Homepage/intake and measurement acceptance passed on the combined source. This pass changed no campaign, offer, price, membership, checkout, native source or private athlete record.

## What production verification caught

PR #131 first published the pages at **12:44:49.374 UTC**, commit `73da85f7326ba4ed73dc4de6b7e6efb7a291e869`, deploy `6aabe0b16b51ef000990703e`. Source and served-browser checks passed, but delivery inspection found email rewriting and existing Pretty URLs conversion. That earlier deployment was not reported as fully verified.

An initial attempt added `no-transform` to `_headers` in `4ee97b910d6f2e7498b3ebb748fe4bce4310bdb4`, deployed **13:02:32.632 UTC**. Inspection `35225213025` showed the value absent from the actual response: global TOML Cache-Control superseded it. PR #132 appended an **Ask-only** rule to authoritative TOML. Every earlier build, redirect and header setting was preserved; parsed configuration equality and exact-source tests prove this. The actual Ask response now carries `no-cache,no-store,must-revalidate,no-transform`, and plain mail links remain available without JavaScript. No global Cloudflare setting or unrelated response policy changed.

The public-byte verifier accepts only the independently observed privacy-link rewrite: `href="/privacy.html#website"` becomes `href='/privacy#website'`, twice on Ask and once on each other reviewed page. It verifies the real privacy fragment and rejects altered content, even an extra byte, wrong fragments, email-protection links or decoder injection. It does not normalize arbitrary HTML or whitespace.

Main run `35232028487` then passed fifteen source suites, all served-browser checks and **all eight production reports**, from **14:16:58.420 to 14:17:48.232 UTC**. Its overall result remained failed because the final live test counted an **aborted hosting-script GET** as sent analytics. Read-only diagnosis `35232904590` identified fourteen blocked Cloudflare script requests on reading pages, no POSTs and none from Ask. PR #133 keeps every external request blocked, records decisions, rejects submissions and unknown destinations, and separately requires no injected analytics script on Ask. No collector was allowed through to obtain a passing result. Ordinary reading-page hosting analytics were not disabled site-wide.

Corrected candidate `3d855371acf765f27e673bf3edc760107caada4d` passed run `35233452821`, artifact `10503100337`: fifteen source suites, 240 Notes/Ask checks per engine and 865 earlier-page checks. Independently pinned live run `35233599042` passed 108 checks per engine; artifacts `10501279962` (Chromium) and `10502234045` (WebKit) name that exact candidate in `tested-commit.txt`. Reports and screenshots were inspected. The later consolidated main receipt above closes verification; historical failed runs are not relabeled successful.

## Email foundation: read, not mutation

Connected September 17 reads found `send.speedandform.com` verified, root `speedandform.com` failed verification, both with open/click tracking off, and one segment named General. That does not establish marketing consent. Active Supabase functions covered calendar and RPD checkout/access/webhook, not a confirmed newsletter endpoint. No subscriber/contact records, sender, API key, DNS record, automation, template, Edge Function or database table was created or changed for 6A.

The verified subdomain is a possible path for 6B; root verification alone is not a reason to overhaul DNS. Before publication, establish server-side credentials, explicit confirmation, abuse/rate controls, unsubscribe/suppression handling, an approved public business mailing address and real success/failure handling. Do not reuse the closed café or a private home address by assumption. Keep subscription consent separate from questions, inquiries, purchases, app access and downloads. A mailing campaign is not authorized by site implementation alone.

## Maintenance

See `docs/publishing/FIELD-NOTES-AND-CONTACT.md`. Keep one publication and one content source. Edit the generator/content files, deliberately regenerate pages and feed, and refresh explicit snapshots after review. Do not publish drafts or date old photo collections as new events.

Keep the Ask-only response policy in authoritative `netlify.toml`; a value in `_headers` alone does not prove delivery. The verifier checks the actual response. Browser tests must continue blocking collectors and failing on unexpected destinations or submissions. The released acceptance workflow is read-only; temporary source-transfer/write steps are absent.

Primary references checked September 17, 2026:
- RSS 2.0.11: https://www.rssboard.org/rss-specification
- Mailto encoding: https://www.rfc-editor.org/rfc/rfc6068.html
- Netlify headers: https://docs.netlify.com/manage/routing/headers/
- Cloudflare email obfuscation: https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
- Cloudflare analytics injection: https://developers.cloudflare.com/web-analytics/faq/
- Later marketing email requirements: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

The essays are authored reflections based on existing site copy, not a scientific literature review. Remaining educational topics and the final email-enabled journey review remain separately queued.
