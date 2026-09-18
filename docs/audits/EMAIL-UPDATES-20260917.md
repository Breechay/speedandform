# Email updates: Pass 6B

Owner: Brice. Single register: `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## State: BACKEND INSTALLED, SIGNUP STILL CLOSED

Draft **PR #135**, branch **`work/email-updates-pass6b`**, contains the public interface and tracked implementation. Accepted functional revision: **`cb4c079f6e8c813318b203f93967bebc21591e55`**. Read-only Actions **`35261273275` passed** on that exact revision. Downloaded artifact **`10513839364`**, `email-updates-receipt`, records the same commit. Later commits record documentation or deployment preparation; they do not turn the public signup on.

**This is not yet a live newsletter signup.** The branch remains unmerged and no public site entry point has been published. No newsletter audience, contact import, campaign, or real confirmation email has been created or sent.

The owner explicitly approved this public footer address on September 17, 2026:

**Vinchay Labs LLC**  
**425 NE 22nd St #2601**  
**Miami, FL 33137**

This clears the mailing-address gate. No different home, former café, or inferred address should be substituted.

The isolated production database migration **has now been applied** to Supabase project `pbgsjjegycacodiltbhn`, and the `email-updates` Edge Function is deployed as version 1 with custom token/webhook authorization and platform JWT verification disabled only for this function. It remains **fail-closed** because live newsletter environment values are not configured. Its status endpoint cannot present an active signup until every required value is present.

A restricted Resend sending API key scoped to the already-verified `send.speedandform.com` domain has been created for this flow, and a Resend lifecycle webhook has been created for the deployed `/webhook` endpoint covering sent, delivered, delayed, bounced, complained, failed, and suppressed events. Their credentials are not committed to this repository. The existing root `speedandform.com` Resend domain remains failed; no DNS was changed.

Cloudflare Turnstile remains the live activation blocker. An authenticated Cloudflare session was unavailable to the connected browser workflow, so no Turnstile widget or secret was created. The signup therefore stays closed rather than weakening the server-verified challenge requirement.

## Reader experience built

The staged `/updates/` page opens with **“A little closer to the practice.”** Its promise is **“A useful note. A new track album. Or the next run together.”** It collects an email address only, with a separate unchecked consent choice. It does not request a name, create an athlete account, or connect marketing consent to coaching or photo downloads.

Signup remains pending until the reader confirms. The email is a short, table-based, inline-styled HTML message with a plain-text equivalent, the round FORM mark, one confirmation action, an ignore/cancel route and Brice's existing public Reply-To. It has no image tracking.

Confirmation links expire after 24 hours. Opening a link does not itself subscribe the reader. The explicit confirmation screen, confirmed result, unsubscribe screen, expired-link recovery and provider-failure retry are implemented. A link opened in a tab already displaying the page is handled correctly. Token fragments are cleared from the address bar; email addresses and drafts are not stored in browser persistence or arrival URLs.

The visible unsubscribe flow requires no account, payment or CAPTCHA. A separate RFC 8058 endpoint accepts an authorized one-click POST. Unsubscribe works even when new sending is disabled, and an old confirmation cannot revive consent. Rejoining requires a new affirmative signup and confirmation. This is subscription infrastructure; **no automatic newsletter-issue dispatcher is included**, and publishing a note never silently sends it to contacts.

## What passed

The accepted run used an **empty disposable PostgreSQL 17 database**, the actual migration and handler, and controlled substitutes for the external Resend and Turnstile providers. It did not use production credentials or send an actual message.

**15 database/integration test groups passed:** existing-source protection; address validation; disabled configuration; anonymous/authenticated access denial; consent/origin/challenge validation; pending signup; deliberate confirmation and token-purpose separation; unsubscribe with sending disabled; expiry and fresh rejoin; exact provider retry/idempotency; concurrent admission quotas; request-ID recipient conflicts; signed/reordered/replayed delivery events and suppression; stale-pending cleanup; and consistent HTML/plain-text email actions.

**92 browser checks passed, 46 each in Chromium and WebKit.** Six widths from 375 through 1440 pixels cover ready-only presentation, unchecked consent, email input readability, contained layouts, focus recovery, pending/confirmed/unsubscribed states, existing-tab links, token removal, absence of browser storage, expired/malformed links, readiness retry, failed challenge-script recovery, provider failure, keyboard navigation, enlarged text, and the honest no-JavaScript fallback. The confirmation email was rendered in browser at phone width. These are not Apple Mail/Gmail/Outlook inbox tests.

All **16 earlier source/regression suites passed**. The new guard additionally compares **496 pre-existing public/app/style/script/media/metadata/config files byte-for-byte** against the reviewed main baseline. No previous test is disabled or relaxed for this pass.

Signup layouts, confirmation and unsubscribe screens, and the email were downloaded for visual review. Two genuine implementation defects were corrected before acceptance: the PL/pgSQL quota conditional and same-document email-link navigation. The email's circular mark was refined after rendered review. Failed intermediate jobs remain failed historical evidence; they are not relabeled successful.

Artifact contents include exact commit, database/browser reports, earlier-source results, synthetic HTML/plain-text email previews and screenshots. **No font files, real recipients, production credentials or private athlete records** are included. Actions retention is fourteen days; this receipt preserves the permanent result.

## Data and operational boundaries

The isolated `newsletter_private` schema has row-level security and no anonymous or athlete-client grants. Runtime operations are explicit service-only RPCs. This is not another athlete or workout store. Token hashes are used for lookup; queued email payloads temporarily contain the raw links so a retry is identical, then those payloads are cleared after acceptance, cancellation or expiry cleanup. No stronger never-stored claim is made.

Atomic hourly/daily window quotas, per-address limits, cooldowns, request leases and provider idempotency are implemented. Signup requires a server-verified challenge. Signed delivery events suppress bounced or complaining addresses without allowing reordered delivery events to undo suppression. Cleanup is implemented but **its production schedule is not installed**.

## Remaining activation work

The operating procedure is `docs/publishing/EMAIL-UPDATES.md`. The mailing-address decision and fail-closed database/function deployment are complete. Remaining activation work is:

1. create a real Cloudflare Turnstile widget limited to `speedandform.com`;
2. store the approved mailing address and dedicated Resend, webhook, and Turnstile values as Supabase Edge Function secrets, then switch `NEWSLETTER_MODE=live` and `NEWSLETTER_ADDRESS_APPROVED=true`;
3. install the daily cleanup call;
4. update the public privacy disclosure and apply the scoped hosting headers;
5. verify one authorized real inbox end-to-end, including authentic challenge behavior, signed delivery events, visible and one-click unsubscribe, and a fresh rejoin;
6. only after those checks, merge/publish `/updates/` and add the restrained Field Notes entry point.

The new function's custom authorization must not change authentication on existing functions. No keys belong in public Git or browser source. Physical-device Safari, native email clients, genuine CAPTCHA, inbox delivery and production unsubscribe remain unverified. No ranking, conversion, compliance certification or numerical aesthetic score is claimed.
