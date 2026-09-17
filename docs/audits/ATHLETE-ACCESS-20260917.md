# Pass 1: account recognition and plan access

## Scope

The homepage account links and RPD viewer share one server-checked permission result. Verified owner/related-coach, active assigned-athlete, and paid-purchaser paths may read the published product. A guest's existing verified-checkout path remains supported. Unrelated sign-in never grants full content. No assignment, prescription, native-app feature, price, advertisement, email template, or athlete record is changed by this pass.

## Evidence so far

- New `public.rpd_account_access(boolean)` is deployed to FORM Athlete System. Explicit authenticated-only execution, verified database email, banned/deletion checks, current active relationships, fixed empty search path. The full underlying `public_plan(text)` remains service-role-only for direct callers.
- 24 database assertions passed under authenticated/anonymous roles and disposable fixtures. Owner Week 5, existing assignment through Week 15, preview redaction, forged user metadata, unrelated coach, inactive membership/athlete, draft/unidentified block, purchase ownership, changed email, refunded/disputed/revoked access, unverified/banned/deleting accounts. All synthetic rows rolled back; real account, athlete, completion and purchase counts unchanged. These are database authorization tests, not real browser sign-ins.
- `node tests/athlete-access.cjs`: 44 local checks passed.
- Local Chromium navigation was blocked by the environment before page loading. No local visual acceptance claimed. Browser tests are prepared for GitHub Actions in Chromium and WebKit.
- Web changes are NOT yet merged or production verified. No numerical design score is claimed.

## Design and security details

The data loader and gate no longer make conflicting purchase-only decisions. A known-account network failure shows recovery rather than silently becoming a buyer. Header/footer labels come from authoritative membership context, never editable user metadata. Sign-out/account switching clears protected DOM and previous purchase hints; old rendering handlers cannot repaint cleared content. Shared promises avoid duplicate account checks. The lock observer is idempotent. On narrow screens, account actions and 44px week controls use separate rows rather than overlapping.

The viewer is explicitly the published plan. An athlete's own paces, dates and revisions remain in the existing assigned-training route. No personal assignment is substituted with a newer product edition.

## Acceptance still open

Run current-source Chromium/WebKit checks, inspect representative screenshots, verify unchanged acquisition paths, merge with concurrent work preserved, inspect exact production bytes and anonymous API denial. Brice's real signed-in phone walk remains a distinct final check. Sales-copy replacement, new screenshot mode, roster provisioning and athlete workspace rebuilding belong to later passes.

## Security-advisor interpretation

The new account RPC is intentionally callable by authenticated users and performs explicit per-user checks. Supabase therefore lists the expected 0029 SECURITY DEFINER execution warning; the 24 authorization tests verify this boundary. It is not callable by anonymous users and has a fixed search path. This is not a clean bill of health for the whole database: older function/view, auth-hardening and protected-table advisories remain outside this repair. Do not broadly grant table reads or remove RLS to silence an advisory.

## Rollback

Restore this pass's web files to their pre-pass versions if required. The additive RPC may remain dormant safely; to disable it, revoke EXECUTE on public.rpd_account_access(boolean) from authenticated and service_role after restoring the web. Do not reopen direct public_plan access or change RLS to work around a failed client.

## Primary implementation references

Supabase JavaScript auth state callbacks: https://supabase.com/docs/reference/javascript/auth-onauthstatechange . No awaited API call is made inside the callback.
Supabase database authorization: https://supabase.com/docs/guides/database/postgres/row-level-security . This deliberately exposed SECURITY DEFINER RPC performs explicit per-user authorization before returning full content.
Advisor rationale: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable . A deliberate exposed per-user operation must validate identity and constrain its effects.
