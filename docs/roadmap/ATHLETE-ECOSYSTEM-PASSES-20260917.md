# Athlete ecosystem: twelve bounded passes

Owner: Brice. Approved in the September 17 conversation. This is the implementation checklist for the private athlete/account work, not a replacement for Bridge Season milestone authority or the earlier public-site release register.

## Release register

| Pass | Deliverable | State |
| --- | --- | --- |
| 1 | Account recognition and verified plan access | LIVE; real signed-in owner phone walk OPEN. Main `977fbf6d`; Netlify production deploy `6aac3d827221730008e755da`, published September 17 at 19:20:58 UTC from that exact commit. Additive account-access RPC deployed; 24 database authorization checks passed with synthetic fixtures rolled back. Source suite: 44 new access checks plus acquisition regressions. Branch and main acceptance passed Chromium and WebKit, including coach/assigned athlete/verified buyer access, stranger preview lock, guest purchase recovery, failure states, account switching/sign-out, six responsive widths, and actual anonymous production lock/API checks. No real purchase, workout, invitation, assignment or athlete result was created. [Receipt](../audits/ATHLETE-ACCESS-20260917.md). |
| 2 | RPD explanation in English/Spanish and week-sharing view | MERGED + ACCEPTED; PRODUCTION HELD BY OWNER. PR #137 merged as `85482d368471b83036173fc0b3f41a2864f4b4c9`. English/Spanish product story, checkout editorial cleanup and access-safe `?week=` presentation passed source checks plus Chromium/WebKit guest-lock and entitled-week journeys. Netlify auto publishing is deliberately stopped and Brice said there is no rush to deploy, so production remains on the prior release. Pricing, assignments and native subscription state were not changed. |
| 3 | Read-only athlete website: Today, Plan, History, Account | MERGED + ACCEPTED; PRODUCTION HELD WITH PASS 2. PR #141 merged as `ed13379d57f7bf5e73512454ffcaa6fa0e648636`. Athlete web filing/editing and duplicate navigation were removed; Today / Plan / History / Account now own the signed-in web experience while FORM/Forge remain the recording surfaces. Running and strength states passed source/account regressions plus Chromium/WebKit at 390 / 768 / 1440 with no overflow, filing controls or uncaught errors. Adrian's current `Runner Mass · Phase 1` and `Strength & Physique` vocabulary classify as strength without claiming native receipt delivery. |
| 4 | Remote strength athlete web experience and usable fallback | MERGED + ACCEPTED; PRODUCTION HELD WITH PASSES 2–3. PR #145 merged as `dec6289dd6a501df34c41f3d4fa881bbf7407a39`. Adrian's signed-in workspace now reads the existing canonical `adrian_runner_mass_phase1_v1` three-week fallback rather than creating another plan. All three weeks and four weekly strength sessions remain available; Week 2/3 inherit the stable exercise menu and progression rules. The web never infers Adrian's current Forge week/day, never creates or implies a Forge receipt for past web work, never shows positive Connected/Synced status, and never exposes Adrian's fallback to unrelated strength athletes. Truth/source checks plus Chromium/WebKit journeys at 390 and 1440 passed, including Week 3 rendering and no filing controls. Installed-device Forge acceptance remains separately required before switching Adrian away from the web fallback. |
| 5 | Four-runner identity and assignment reconciliation | MERGED + ACCEPTED; PRODUCTION HELD. PR #146 merged as `1378bb012e80716a1f26a9819d4f21497e8d9baa`. Live reconciliation preserved Hope/José canonical UUIDs, RPD blocks, assignment/version boundary and history; September 17 resolves to Week 4 by calendar despite stale stored Week-1 state. Hope retains her existing unclaimed athlete invite rather than receiving a duplicate identity; José remains on his claimed athlete membership. Lisa exists only in the legacy/public athlete surface plus the authored Raise the Ceiling manifest in this environment; Anthony has no canonical private row or authored repo source. Neither was fabricated. A real athlete-page defect was fixed: cancelled/withdrawn superseded current-week occurrences can no longer win the weekday prescription while remaining available as historical truth. Source/account regression acceptance is green. [Receipt](../audits/FOUR-RUNNER-RECONCILIATION-20260917.md). |
| 6 | Console access/delivery overview and coach-owned preview | ACTIVE NEXT. Show, from the coach side, which athlete has an account link, pending invite, authored plan/web fallback and proven recording channel. Preview must render the athlete-facing read-only workspace as coach-owned inspection, not impersonation or a synthetic sign-in. |
| 7 | Evidence, review and published next instruction | QUEUED. Preserve original evidence and prescription history. |
| 8 | Installed Forge remote-strength delivery acceptance | QUEUED. Actual device and authenticated receipt required. |
| 9 | Extend appropriate running/strength experiences across roster | QUEUED. No copied demo assignments or fabricated progress. |
| 10 | FORM native assignment, filing and correction acceptance | QUEUED. Reconcile existing native work, not a parallel implementation. |
| 11 | Cross-surface visual, accessibility, privacy and failure-state review | QUEUED. Critique also occurs within each earlier pass. |
| 12 | Production journeys, operating runbook and master-roadmap closure | QUEUED. Record actual deployed source and outstanding device gates. |

Four useful releases: Passes 1–2, 3–6, 7–10, 11–12. The access repair may ship independently. Reserve up to two repair passes for real onboarding defects, not feature expansion. A material missing capability requires an explicit scope/estimate revision.

One active pass at a time. Read current remote refs and concurrent work, implement, test, critique, repair, then record exact status. Do not repeat the whole audit when continuing. Work occurs in the active conversation; queued passes are not background jobs.

## Boundaries

- Verified sign-in is identity, not blanket access to every paid product.
- Public product and coach assignment remain different objects. Product access never rewrites an assignment or grants a native subscription.
- Account failures, revoked permissions, unclaimed invitations and absent prescriptions are different states.
- No real workout, invitation, purchase or athlete result is manufactured for acceptance.
- Public technical receipts never contain private account tokens, athlete histories or the private Bridge Season contents.
- Physical-device checks and native delivery retain their original acceptance requirements.
