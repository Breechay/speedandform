# FORM email-to-app recovery and Apple linking: release gate

## Email handoff root cause

The email sender returns an implicit access/refresh-token fragment. The shared web client uses detectSessionInUrl:false and flowType:pkce. Before the email repair, record-callback called finishAuthCallback without restoring the returned session. A valid first verification could be shown as expired; a later tap then reused an already-consumed one-time token.

The published email repair restores the fragment with auth.setSession, confirms the user with auth.getUser, then uses verified-email claim and form://coaching-auth. The landing waits for explicit Continue, validates issuer/return destination, strips the source fragment from history and ignores double taps. The verified callback presents Open FORM and preserves recovery/Calendar/PKCE routes. No credential belongs in query strings or logs.

## September 25: Apple account connection

A missing Apple email is not permission to guess ownership or create another athlete. The new connection requires a verified invited-email session and fresh Apple authorization with a nonce. The athlete sees the verified record before approving Apple. A successful connection preserves the original athlete owner; an Apple Auth identity is an athlete-only alias. Return Apple logins resolve that same record without another email match.

The deployed endpoint independently validates both credentials through Auth, enforces rate limiting, calls a service-role-only writer and closes its temporary Apple session. The database getter is shared by identity resolution, athlete read permission and FORM filing. One-active-owner index, exact prescription/version checks, real filing actor, coach boundary and existing sync-pause wrappers are preserved. Revoked/deleted source membership disables the alias and reactivation does not silently relink it.

Native source is in FORM-iOS branch fix/apple-account-linking-20260925, commit d656aa50fbe1f36e53c546e59f4e942caead8c73. The actual compiled source files were edited directly after GitHub jobs stopped before executing steps. No installer/template is required at build time. Candidate sessions are resolved before adoption, failed/canceled login preserves saved work, and missing mapping opens one-time email setup followed by Apple consent. An unresolved stored session cannot fall through into an unrelated public plan.

This is an athlete-access bridge, not an Auth-user merge. It does not transfer coach, administrator, Forge or commerce roles. Web membership projection and deletion semantics must be reviewed before claiming full cross-surface account merging. Neither affected athlete's unidentified Apple login was assigned by inference, and no new athlete emails were sent.

## One operating checklist

- [x] Email callback root cause identified and fixed.
- [x] Email regression: 27 mocked Node cases; GitHub run 36085042069 succeeded.
- [x] Email source 91687a50fd784ba3d788f737f7ac14166f827467 published as Netlify production 6ab5d6a8d949000008703278 at 2026-09-25T02:04:38.511Z.
- [x] Affected canonical email memberships and backend identity/plan feed re-read in the email repair. This did not establish phone entry or verify an unconfirmed email.
- [x] Apple dual-proof endpoint and single-owner alias migrations deployed.
- [x] Apple database contract passed using synthetic fixtures in a rolled-back transaction: isolation, filing attribution/idempotency, source revocation/deletion, conflicting identity, rate limits and no automatic reactivation.
- [x] Apple handler: 24 mocked HTTP/Auth checks passed locally. Production request without authorization returned 401 sign_in_required.
- [x] Native source saved directly in the existing compiled client and arrival files; 19 exact extracted policy checks passed and Swift grammar parsing passed locally.
- [ ] Full Xcode build. GitHub runs 36129525205 and 36129762835 ended before any build step executed; they are NOT build passes. Use a working Mac runner or local Xcode. No signed app has been published.
- [ ] Review complete callback/refresh session-pair validation, refresh-in-flight account switching, and source/alias account-deletion behavior before release.
- [ ] Controlled physical iPhone: fresh email, Continue, Open FORM, verified record, Apple consent, correct Week Home, reopen, sign out, Apple-only return and correct filing identity. No affected-athlete retry until this gate passes.
- [ ] Web alias membership projection compatibility before claiming Apple sign-in works across all account surfaces. No commerce/admin merge is authorized.
- [ ] Read and verify actual hosted Auth link lifetime before claiming a one-hour change. No expiration setting has been modified.

Evidence: [email repair receipt](../audits/FORM-AUTH-RECOVERY-20260924-RELEASE.json) and [Apple implementation receipt](../audits/FORM-APPLE-LINKING-20260925.json). Receipts record evidence; this file owns the single checklist.

No more athlete troubleshooting loops. Do not claim background work between chat turns unless a real scheduled task or running CI job exists. Deployment, a passing mock test, a database-role test, a signed app build and a physical-phone pass are distinct facts.

## Rollback

Do not alter athlete prescriptions, history or canonical owner memberships to roll back auth. No actual Apple aliases were created by implementation, so the new endpoint can be withheld from client release while review/build gates remain open. Preserve migration history. Revert source behavior only with a reviewed forward migration; never drop shared tables/records casually. The earlier email web repair is separate and must not be rolled back merely because native Apple release is pending. Backend source and evidence-only commits use skip netlify.
