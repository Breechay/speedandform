# Contact and Field Notes: Pass 6A

Owner: Brice. Single register: `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Current state

Implemented locally on `work/contact-notes-pass6`, based on main `780f409ed521f3c6290c19e0d80279331bf4eecc`. Not yet a production receipt. Record the tested revision, merge, actual deployment and live checks after they complete.

## The bounded decision

Pass 6 is split into independently useful releases. **6A owns Ask Brice, the existing Field Notes publication, a reader feed and their discovery routes.** 6B owns confirmed opt-in email and unsubscribe delivery. A sender being verified is not enough to show a working newsletter signup. No placeholder signup or success message is published here.

`/ask/` gives an ordinary question a lower-pressure route than the coaching intake. It shows the existing public `brice@speedandform.com` address, an optional local draft, Open email, and a copy fallback. A note can supply its title and public canonical URL through a fixed allowlist. No free-text message, email address or arbitrary referrer is accepted through the arrival URL. The draft is not sent to a website service, stored in the browser, put into analytics, or added to an audience. Opening an email app is not reported as sending or delivery. Long drafts are copied without truncation instead of relying on oversized mailto URLs. The visitor reviews and sends in their own email app. This is an intentional native handoff, not a newly deployed email relay or verified inbox-delivery claim.

`/field-notes` already existed. Its eight long opinion notes mixed useful principles with old schedule details and universal claims. Four short revised editions preserve the useful ideas: leaving margin in a session, repeating a week with judgment, valuing ordinary runs, and making group purpose clear. Each now has a permanent individual URL, distinct title/description, meaningful related reading and a question/share action. These are coaching reflections, not evidence from invented sessions or prescriptions for every reader. Provenance is recorded in `scripts/field-notes-content.cjs`, and the pre-edit version is retained in Git at the base commit. No original publication date is invented.

The separate existing photographed note at `/notes`, every Labs page, all eight prior revised guides, the homepage and coaching intake, both app landing pages and their José/Adrian illustrations, the training portal and the gallery remain unchanged. The index uses the existing approved album cover and identifies it as an earlier selection, not a new dated session. No new media permission is inferred for unpublished photos.

The RSS 2.0 feed at `/field-notes/feed.xml` contains the four published notes and the existing published album. It has canonical stable GUIDs, the required channel fields, a self link and the correct HTTP content type. The undated album does not get a made-up photograph/publication date. The feed is a working reader subscription method, **not an email newsletter**. The publication generator includes only `published: true` notes and gallery entries. No posting cadence or Saturday-run schedule is invented.

## Discovery and protection

Only four existing HTML files change: Field Notes, Library, search and 404. Five new HTML routes are added: Ask and the four essays. All 173 other existing HTML files are pinned unchanged. The Library keeps all 47 earlier entries unchanged and gains the Field Notes index, for 48. Its footer, search footer and 404 footer gain Field Notes and Ask Brice; the Library's existing coaching invitation also gains a clearly separate ordinary-question link. The sitemap keeps all 72 previous canonical addresses and adds five, for 77. No authenticated or purchase-confirmation routes are added.

`CONTACT-NOTES-MANIFEST-20260917.json` pins each reviewed HTML, local helper, feed and discovery integration artifact. Earlier release tests recognize these exact later snapshots instead of demanding obsolete Library/metadata bytes. New tests independently compare every preexisting catalog entry and all unchanged Library/search/404 content. This is not a wildcard test exclusion. Historical release receipts remain intact. No shared stylesheet, offer, price, membership, native source, athlete record, campaign or tracking implementation changes.

## Email foundation read, no mutation

Connected Resend read on September 17: `send.speedandform.com` verified, root `speedandform.com` failed verification, both with open/click tracking off. There is one existing segment, General. These reads did not establish consent for a new marketing publication. The active Supabase project exposes only the existing calendar and RPD checkout/access/webhook functions; no confirmed newsletter endpoint was present. No subscriber/contact data was read, imported, changed or deleted; no new sender, API key, DNS record, automation, template, Edge Function or database table was created.

The verified sending subdomain can support a later implementation. Root verification alone is not a blocker requiring a DNS overhaul. Before 6B goes live, verify the server-side credential path, explicit confirmation, abuse/rate limits, unsubscribe and suppression handling, appropriate public business mailing address, and actual successful/error delivery. Do not reuse the closed café or a private home address by assumption. Keep newsletter signup separate from questions, coaching inquiries, app access, purchases and downloads. Do not send a campaign under this site-edit authorization.

## Review and coverage

Initial in-memory Chromium review inspected Notes, an essay and Ask at 390 and 1440 pixels. This verifies appearance only, not served-page behavior. Complete served/browser and actual production checks belong in the release receipt below. Physical iPhone/iPad, native Safari, screen-reader output, third-party reader import and native email/share sheets are unverified unless later evidence is recorded. Automated email and share behavior is intercepted; no real message is sent. No ranking or numerical aesthetic score is claimed.

## Maintaining one publication

See `docs/publishing/FIELD-NOTES-AND-CONTACT.md`. Do not create a second newspaper brand, contact database or parallel content source.

Primary technical references checked September 17, 2026:
- RSS 2.0.11: https://www.rssboard.org/rss-specification
- Mailto URI behavior and encoding: https://www.rfc-editor.org/rfc/rfc6068.html
- Later marketing email requirements: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

The new essays are authored reflections based on existing site copy, not a new scientific literature review.
