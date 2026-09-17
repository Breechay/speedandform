# Pass 1: account recognition and plan access

## Scope

The homepage account links and RPD viewer share one server-checked permission result. Verified owner/related-coach, active assigned-athlete, and paid-purchaser paths may read the published product. A guest's existing verified-checkout path remains supported. Unrelated sign-in never grants full content. No assignment, prescription, native-app feature, price, advertisement, email template, or athlete record is changed by this pass.

## Release state

**LIVE September 17, 2026.** PR #136 squashed to main `977fbf6db086ce8c3c27c0486b4ee219f69821c7`. Netlify production deploy `6aac3d827221730008e755da`, published at 19:20:58 UTC from that exact commit. The merge tree matches the green branch tree used for browser acceptance.

## Evidence

- New `public.rpd_account_access(boolean)` is deployed to FORM Athlete System. Explicit authenticated-only execution, verified database email, banned/deletion checks, current active relationships, fixed empty search path. The full underlying `public_plan(text)` remains service-role-only for direct callers.
- 24 database assertions passed under authenticated/anonymous roles and disposable fixtures. Owner Week 5, existing assignment through Week 15, preview redaction, forged user metadata, unrelated coach, inactive membership/athlete, draft/unidentified block, purchase ownership, changed email, refunded/disputed/revoked access, unverified/banned/deleting accounts. All synthetic rows rolled back; real account, athlete, completion and purchase counts unchanged. These are database authorization tests, not real browser sign-ins.
- `node tests/athlete-access.cjs`: 44 checks passed, plus the existing homepage metadata/release, coaching measurement and coaching-copy regression suites.
- Branch acceptance run `35264022529`: Chromium and WebKit both passed. The suite covers guest, coach, José, Hope, verified buyer, unrelated signed-in account and Lisa-as-non-RPD cases; Week 5 visibility/lock behavior; no purchase pitch for entitled paths; correct Console/My training/My plan destinations; known-account network failure; contradictory/partial access responses; guest purchase recovery; sign-out; account switching; no stale protected DOM; and 375/390/430/768/1024/1440 widths without horizontal overflow.
- Representative screenshots were inspected from the green artifact. Synthetic labels in those captures are fixtures by design, not athlete data.
- Main acceptance run `35264312146` passed the same Chromium/WebKit journey plus exact published assets, anonymous server boundaries and actual anonymous production browser journeys in both engines.
- Netlify reports production deploy `6aac3d827221730008e755da` ready on main commit `977fbf6d`, with no deploy error and no secret-scan matches.

## Design and security details

The data loader and gate no longer make conflicting purchase-only decisions. A known-account network failure shows recovery rather than silently becoming a buyer. Header/footer labels come from authoritative membership context, never editable user metadata. Sign-out/account switching clears protected DOM and previous purchase hints; old rendering handlers cannot repaint cleared content. Shared promises avoid duplicate account checks. The lock observer is idempotent. On narrow screens, account actions and 44px week controls use separate rows rather than overlapping.

The viewer is explicitly the published plan. An athlete's own paces, dates and revisions remain in the existing assigned-training route. No personal assignment is substituted with a newer product edition.

## Acceptance still open

Brice's real signed-in phone walk remains open because the automated signed-in browser roles use synthetic fixtures rather than his live session. That check should verify: homepage says Console while signed in as coach; Week 5 opens without checkout; signing out restores Sign in and preview lock; and José or another consenting athlete account resolves to My training rather than the public product. This open physical-account check does not block Pass 2 because production authorization, browser behavior and anonymous boundaries are already verified.

Sales-copy replacement, deliberate screenshot/share mode, roster provisioning and athlete workspace rebuilding belong to later passes.

## Security-advisor interpretation

The new account RPC is intentionally callable by authenticated users and performs explicit per-user checks. Supabase therefore lists the expected 0029 SECURITY DEFINER execution warning; the 24 authorization tests verify this boundary. It is not callable by anonymous users and has a fixed search path. This is not a clean bill of health for the whole database: older function/view, auth-hardening and protected-table advisories remain outside this repair. Do not broadly grant table reads or remove RLS to silence an advisory.

## Rollback

Restore the web files changed by main `977fbf6d` to their pre-pass versions if required. The additive RPC may remain dormant safely; to disable it, revoke EXECUTE on public.rpd_account_access(boolean) from authenticated and service_role after restoring the web. Do not reopen direct public_plan access or change RLS to work around a failed client.

## Primary implementation references

Supabase JavaScript auth state callbacks: https://supabase.com/docs/reference/javascript/auth-onauthstatechange . No awaited API call is made inside the callback.
Supabase database authorization: https://supabase.com/docs/guides/database/postgres/row-level-security . This deliberately exposed SECURITY DEFINER RPC performs explicit per-user authorization before returning full content.
Advisor rationale: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable . A deliberate exposed per-user operation must validate identity and constrain its effects.
