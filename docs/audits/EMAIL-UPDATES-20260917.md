# Email updates: Pass 6B

Owner: Brice. Single register: `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## State: STAGED, TESTED, NOT ACTIVATED

Draft **PR #135**, branch **`work/email-updates-pass6b`**, contains the implementation. Accepted functional revision: **`cb4c079f6e8c813318b203f93967bebc21591e55`**. Read-only Actions **`35261273275` passed** on that exact revision. Downloaded artifact **`10513839364`**, `email-updates-receipt`, records the same commit. A subsequent documentation-only commit records this evidence; it does not change the accepted implementation.

**This is not a live newsletter signup.** The branch is not merged. No production migration, function, sender, challenge widget, webhook, newsletter audience, contact import, email or campaign was created. Netlify was re-read and still serves **`6aac0dc24b457e0008092497`**, the previously verified app-preview correction. Main was unchanged at `3b3e27e7cf6e48ea3160ed7b197c90ae105034d4` during the comparison. The existing public site remains intact.

The owner has not yet supplied the current public business mailing address for email footers. The question was asked explicitly. No home or former café address is substituted. Activation also needs secure live configuration and real delivery verification, not only the address. The single register records those gates; this receipt is evidence, not another competing checklist.

## Reader experience built

The staged `/updates/` page opens with **“A little closer to the practice.”** Its promise is **“A useful note. A new track album. Or the next run together.”** It collects an email address only, with a separate unchecked consent choice. It does not request a name, create an athlete account, or connect marketing consent to coaching or photo downloads.

Signup remains pending until the reader confirms. The email is a short, table-based, inline-styled HTML message with a plain-text equivalent, the round FORM mark, one confirmation action, an ignore/cancel route and Brice's existing public Reply-To. It has no image tracking. The address shown in test previews is visibly a synthetic fixture, not a proposed business address.

Confirmation links expire after 24 hours. Opening a link does not itself subscribe the reader. The explicit confirmation screen, confirmed result, unsubscribe screen, expired-link recovery and provider-failure retry are implemented. A link opened in a tab already displaying the page is handled correctly. Token fragments are cleared from the address bar; email addresses and drafts are not stored in browser persistence or arrival URLs.

The visible unsubscribe flow requires no account, payment or CAPTCHA. A separate RFC 8058 endpoint accepts an authorized one-click POST. Unsubscribe works even when new sending is disabled, and an old confirmation cannot revive consent. Rejoining requires a new affirmative signup and confirmation. This is subscription infrastructure; **no automatic newsletter-issue dispatcher is included**, and publishing a note never silently sends it to contacts.

## What passed

The accepted run used an **empty disposable PostgreSQL 17 database**, the actual migration and handler, and controlled substitutes for the external Resend and Turnstile providers. It did not use production credentials or send an actual message.

**15 database/integration test groups passed:** existing-source protection; address validation; disabled configuration; anonymous/authenticated access denial; consent/origin/challenge validation; pending signup; deliberate confirmation and token-purpose separation; unsubscribe with sending disabled; expiry and fresh rejoin; exact provider retry/idempotency; concurrent admission quotas; request-ID recipient conflicts; signed/reordered/replayed delivery events and suppression; stale-pending cleanup; and consistent HTML/plain-text email actions.

**92 browser checks passed, 46 each in Chromium and WebKit.** Six widths from 375 through 1440 pixels cover ready-only presentation, unchecked consent, email input readability, contained layouts, focus recovery, pending/confirmed/unsubscribed states, existing-tab links, token removal, absence of browser storage, expired/malformed links, readiness retry, failed challenge-script recovery, provider failure, keyboard navigation, enlarged text, and the honest no-JavaScript fallback. The confirmation email was rendered in browser at phone width. These are not Apple Mail/Gmail/Outlook inbox tests.

All **16 earlier source/regression suites passed**. The new guard additionally compares **496 pre-existing public/app/style/script/media/metadata/config files byte-for-byte** against the reviewed main baseline. No previous test is disabled or relaxed for this pass. Browser checks for older journeys were not rerun as new device tests; their source is unchanged.

Signup layouts, confirmation and unsubscribe screens, and the email were downloaded for visual review. Two genuine implementation defects were corrected before acceptance: the PL/pgSQL quota conditional and same-document email-link navigation. The email's circular mark was refined after rendered review. Failed intermediate jobs remain failed historical evidence; they are not relabeled successful.

Artifact contents include exact commit, database/browser reports, earlier-source results, synthetic HTML/plain-text email previews and screenshots. **No font files, real recipients, production credentials or private athlete records** are included. Actions retention is fourteen days; this receipt preserves the permanent result.

## Data and operational boundaries

The isolated `newsletter_private` schema has row-level security and no anonymous or athlete-client grants. Runtime operations are explicit service-only RPCs. This is not another athlete or workout store. Token hashes are used for lookup; queued email payloads temporarily contain the raw links so a retry is identical, then those payloads are cleared after acceptance, cancellation or expiry cleanup. No stronger never-stored claim is made.

Atomic hourly/daily window quotas, per-address limits, cooldowns, request leases and provider idempotency are implemented. Signup requires a server-verified challenge. Signed delivery events suppress bounced or complaining addresses without allowing reordered delivery events to undo suppression. Cleanup is implemented but **its production schedule is not installed**.

Read-only connected checks reconfirmed the active FORM Athlete System project and its four existing Edge Functions. A metadata-only query found no existing newsletter/subscriber/email tables. Resend reports `send.speedandform.com` verified with open/click tracking off; the root sending domain still reports failed. No DNS or existing transactional path was changed.

## Activation remains a separate release

The operating procedure is `docs/publishing/EMAIL-UPDATES.md`. Before activation, obtain Brice's explicit current public mailing address; provision the dedicated server credentials and genuine challenge/webhook configuration; apply and verify the isolated backend; install cleanup; update the privacy disclosure and scoped hosting headers; and verify an authorized real inbox, real provider events, visible/one-click unsubscribe and fresh rejoin. Only then add the email-update entry point to the public site and close the production receipt.

The new function's custom authorization is documented; it must not change authentication on existing functions. No keys are requested in public Git or embedded in the browser. Physical-device Safari, native email clients, real CAPTCHA, inbox delivery and production unsubscribe remain unverified. No ranking, conversion, compliance certification or numerical aesthetic score is claimed.
