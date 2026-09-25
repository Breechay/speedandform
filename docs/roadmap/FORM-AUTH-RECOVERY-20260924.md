# FORM email-to-app recovery: release gate

## Scope and root cause

The hosted email sender generates Supabase action links that return an implicit access/refresh-token fragment. The shared web client uses detectSessionInUrl:false and flowType:pkce. Before this repair, record-callback called finishAuthCallback without restoring the returned session. A valid first verification could therefore be shown as expired; a later tap then really reused an already-consumed one-time token.

This repair restores the fragment with auth.setSession, confirms the user with auth.getUser, then uses the existing verified-email claim and native form://coaching-auth contract. It does not bypass authentication, grant membership based on an unverified email string, guess an anonymous Apple identity, or change training.

Email landing now waits for an explicit Continue tap rather than consuming a one-time link on page load. It validates the issuer and return destination, strips the source fragment from history, and ignores double taps. The verified callback shows an explicit Open FORM button, retains the app marker until that tap, and preserves recovery/Calendar/PKCE routes. No secret is added to query parameters, console logs or this repository.

## One checklist for this repair

- [x] Root cause identified in the actual sender/client/callback contract.
- [x] Node regression suite: 27 passing cases with mocked Auth/DOM dependencies. Run: node --test tests/form-email-handoff.test.mjs.
- [x] Both affected canonical email-account memberships re-read as active and bound to the intended athlete invitation. One account is still awaiting email verification; membership alone is not successful login.
- [x] Authenticated-role backend checks: each account resolves its intended athlete and returns a plan feed; the first account also checked for nonempty block/weeks/sessions.
- [ ] Verify this source commit is the published Netlify deploy, not merely a branch or queued build.
- [ ] Real iPhone check: fresh email, Continue, Signed in, Open FORM, then correct athlete Week Home on the installed app. Browser runtime navigation was blocked in the local test environment; no real-browser or physical-device pass is claimed.
- [ ] Confirm repeat app launch and correct filing identity without reinstalling.
- [ ] Permanent Apple enrollment: explicit verified linking of an authenticated Apple identity to the athlete account. Do not infer ownership from timestamps or a screenshot of an Apple email.
- [ ] Read and verify the actual hosted Auth link lifetime before claiming a one-hour change. No expiration setting was modified here.

Do not send more athlete retries until the applicable verification gate is complete. Do not claim that work continues between chat turns unless an actual scheduled task or running CI job exists. The website repair is not a native app release, and it is not the permanent Apple enrollment repair.

## Deployment and rollback

Prepared against main d982480a3c2d1dc9b66e03e80b3801fc4c945ec2. Previously published deploy: 6ab57cdf7586f20008c46ae6, source 318b20b22a824ef3d309c3bcd0c167d428a2bc45. The intervening main change was an unrelated release receipt only. Publish these changes atomically; preserve concurrent changes. Record actual production proof separately after deployment. Roll back only this repair's auth assets/helper if necessary; do not reverse canonical memberships or modify athlete training.
