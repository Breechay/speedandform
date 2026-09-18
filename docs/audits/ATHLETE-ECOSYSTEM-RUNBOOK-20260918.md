# Athlete ecosystem release + operating runbook — September 18, 2026

Owner: Brice  
Scope: bounded athlete/account passes 1–12  
Release posture: **SOURCE COMPLETE · SCHEMA LIVE · WEB PRODUCTION LIVE · ANONYMOUS PROD ACCEPTED · OWNER/ATHLETE AUTH WALKS + TWO NATIVE DEVICE GATES OPEN**

This is the closure receipt for the September 17–18 athlete ecosystem work. It records what is built, what is live, what is deliberately held, and the exact order to release or operate the system without re-auditing the whole project.

## 1 · Current source and production truth

### Final production receipt — September 18, 2026
- GitHub `main`: `926c743df6406b6958f2602dc878768b23140c50`.
- Netlify production deploy: `6aad080a1a0f12000885ea38`.
- Published: 2026-09-18 09:44:55 UTC.
- Production commit: `926c743df6406b6958f2602dc878768b23140c50`.
- State: ready.
- The production deploy therefore matches exact current `main`, including the RPD v5 Week-5 coached-athlete cutover.
- Strict anonymous production walk: **8/8 PASS** — homepage, RPD Weeks 1–4 preview, Week-5 lock, beyond-preview access routing, no protected-content leak after failed validation, no false “no purchase” state observed, and no tested phone-width horizontal overflow.
- Brice signed-in production walk: **OPEN**. The available browser profile has no active Speed & Form session or stored credentials; no login was attempted and no data was changed.
- One consenting-athlete production walk: **OPEN** and still requires that athlete's real authenticated session/consent.


### Website repository
- Accepted main after Pass 11: `7875919a71e99a3ed801b1b25780b16188f2b76c`.
- Passes 2–7, 9 and 11 are merged and accepted in source.
- Pass 10 backend exact-retry repair is merged in source.
- No Pass 12 action deploys the website or applies a held migration.

### Current Netlify production
Netlify project: `f3914a6a-a9ce-465e-8212-f5f42597c469` / `speedandform.com`.

At closure, the current production deploy is:
- deploy: `6aac3e68f243b00008917eea`
- published: 2026-09-17 19:24:40 UTC
- commit: `dd8cfef0fb8348290b4ccd79ff681f141b6e4f1e`
- state: ready
- manual deploy: false

Historical note: at Pass 12 closure production was intentionally behind accepted main. That hold has now cleared: production deploy `6aad080a1a0f12000885ea38` serves exact current `main` `926c743d…`.

The post-merge main acceptance on `7875919a…` confirms this boundary mechanically: all source tests plus Chromium/WebKit synthetic account journeys passed, then the production asset verifier stopped on an exact SHA mismatch for `plans/race-pace-durability/gate.js`. The live anonymous journey was therefore skipped rather than testing the wrong source. That failure is a **release hold signal**, not a source regression.

A separate concurrent main commit, `5ca47fd0fea3a6a81c58cafe8eb4ad8fea068d5a`, was created to retrigger the existing Netlify Git integration for the Run Development release. At the Pass 12 closure check, Netlify still reported `6aac3e68f243b00008917eea` as the current ready production deploy, so that retry had not yet changed production. Pass 12 itself does not call the Netlify deploy API.

## 2 · Held database work

The two additive migrations are now **applied live** in the FORM Athlete System:

### A. Evidence → review → next instruction
`supabase/migrations/20260918002500_evidence_review_instruction_chain.sql`

Purpose:
- links a coach review to exact completions;
- links the next direction to the review via `based_on_read_id`;
- requires the next session to be live and owned by the same athlete;
- publishes review + evidence links + instruction atomically.

Acceptance:
- syntax/source contracts green;
- rollback-only authenticated chain accepted;
- no live athlete review was fabricated.

### B. Exact FORM native retry is a true no-op
`supabase/migrations/20260918011500_form_native_exact_retry_noop.sql`

Purpose:
- exact duplicate `record_session_from_form` retry must not manufacture an audit revision;
- a genuinely later RPE / symptoms / athlete-note amendment remains allowed;
- objective evidence and immutable prescription identity remain frozen.

Acceptance:
- live-schema rollback-only chain accepted;
- older frozen session version filed after a newer authored version existed;
- exact replay returned the same receipt and zero revisions with the fix;
- coach correction preserved prior completion + prior split with reason;
- fixture fully rolled back;
- source CI green.

### Applied migration receipt
Applied successfully, in order, after the Pass 12 closure:
1. `evidence_review_instruction_chain` — migration history version `20260918090830`
2. `form_native_exact_retry_noop` — migration history version `20260918090839`

Both were applied through the FORM Athlete System migration API from the exact SQL committed on main. No data backfill was required and no real athlete completion was created merely to prove them.

## 3 · Web release order

When Brice decides to release the held athlete ecosystem:

### Gate 0 — owner decision
Confirm:
- release is intentional;
- Netlify production deployment is allowed;
- the two held schema migrations may be applied.

Do not infer this from a merge to main.

### Gate 1 — schema
**Complete.** Both accepted migrations are live. Do not reapply them.

### Gate 2 — deploy accepted main
Deploy the then-current main only after comparing it to this closure receipt. If unrelated main work landed afterward, run its own release checks rather than assuming this receipt accepts it.

For this closure, accepted web source is:
`7875919a71e99a3ed801b1b25780b16188f2b76c`.

### Gate 3 — anonymous production journey
Run both Chromium and WebKit against production:
- homepage loads;
- RPD Weeks 1–4 remain readable;
- Week 5 does not expose prescription without entitlement;
- ordinary preview navigation beyond Week 4 routes to the offer;
- no protected content survives a failed access check;
- purchase restore outage is not rendered as “no purchase”;
- no horizontal overflow at phone widths.

### Gate 4 — Brice signed-in journey
Using Brice's real account:
- Home says **Console**;
- Console opens;
- no athlete identity is substituted for Brice;
- RPD full plan access opens without checkout;
- Account / sign-out returns to the expected anonymous state.

Do not create a workout or athlete result during this check.

### Gate 5 — one consenting athlete journey
Using an existing consenting athlete account:
- Home says **My training**;
- Athlete Today / Plan / History / Account open;
- delivery channel matches canonical roster truth;
- coach-managed athletes are not told to file in FORM/Forge;
- app-delivered athlete is told the correct app;
- no coach controls are present;
- sign-out removes the private workspace.

Do not use another athlete's credentials merely for acceptance.

### Gate 6 — release receipt
Record:
- actual production deploy ID;
- actual production commit SHA;
- schema migration status;
- production journey results;
- any open physical-device limitation.

Only then change a pass from **PRODUCTION HELD** to **LIVE**.

## 4 · Operating model after release

### Identity
One Speed & Form account can have:
- coach membership;
- athlete membership;
- both.

The account resolver, not the page URL, decides whether the user lands in:
- Console;
- My training;
- My plan;
- Account.

A public product purchase never creates a coaching assignment.

### Athlete website
Authority:
- **read-only coaching reference**.

Owns:
- Today;
- Plan;
- History;
- Account;
- published review / next instruction.

Does not own:
- workout filing;
- coach judgment;
- prescription editing;
- Forge/FORM connection claims.

### Coach Console
Authority:
- coaching authoring + interpretation.

Owns:
- athlete roster;
- authored work;
- correction of filed evidence;
- claim judgment;
- review;
- next instruction;
- private notes;
- explicitly approved frozen public excerpts.

### FORM native
Authority:
- assigned running execution + athlete filing, once the device gate closes.

Contract:
`identity → athlete membership → authoritative feed → exact immutable session/version → frozen measured payload → canonical FORM receipt`.

Athlete filing is not rewritten in place. A deliberate correction is coach-owned and append-only.

### Forge native
Authority:
- remote strength execution + filing only through the explicit Coach Pilot path until broader product rules are approved.

The public App Store Forge remains cloud-off.

## 5 · Failure-state grammar

Every connected surface should use the same sequence:

1. State what is known.
2. Do not turn **unavailable** into **denied**.
3. State what was not changed.
4. Offer the smallest recovery action.
5. Never require a new purchase/account/filing merely to escape an error.

Examples:
- access service unavailable → “Your training has not changed. Try again.”
- purchase lookup unavailable → “Nothing was charged or changed.”
- signed in, no athlete membership → “Your training is not linked yet.”
- coach-managed athlete, no published web block → “Your training is coach-managed.”
- native uncertain send → keep the frozen payload and retry it; do not create another filing.

## 6 · Current roster delivery rules

The roster must never infer delivery from discipline.

- `delivery = app` + running → FORM is the recording channel.
- `delivery = app` + strength → Forge only when a real accepted Forge path exists.
- `delivery = coach` → completed work is managed with Brice, whether the athlete runs or lifts.

Current accepted examples:
- Natalie: app-delivered running → FORM.
- Rod: coach-managed strength.
- Devin: coach-managed strength.
- Marisa: coach-managed strength.
- Valerie: coach-managed running.
- Simon: coach-managed running even with an authored block.
- Adrian: coach-managed website fallback until Forge device acceptance closes.

No plan title may silently upgrade an athlete to a connected app.

## 7 · Native gate A — Adrian / Forge

Status: **device-blocked after source/backend prep**.

Source:
- draft PR #25: `work/forge-adrian-device-acceptance-20260917`
- parent reconciliation remains under PR #18.

Accepted before device:
- explicit internal `CoachPilot` identity;
- Debug/Release remain App-Store/cloud-off;
- static guards prevent pilot leakage;
- canonical strength receiver accepted rollback-only idempotency;
- Adrian's reported W1D1 Upper A + W1D2 Lower/Core map to expected next slot **W1D3 Upper B**, unless a later real session is surfaced.

Still required:
1. Adrian's real invite email/account decision;
2. Mac compile on current head;
3. install Coach Pilot on device;
4. sign in as Adrian;
5. confirm consent / remote-coaching status;
6. confirm W1D3 Upper B is the native position, or reconcile later real work;
7. complete one designated pilot strength session;
8. verify one canonical `forge_strength_receipts` row;
9. relaunch/retry and prove no duplicate;
10. confirm Console visibility.

Until all ten land, Adrian's three-week web fallback stays authoritative.

## 8 · Native gate B — FORM assigned-plan filing

Status: **source/backend accepted; current-head Mac/device proof open**.

Source:
- draft PR #26: `work/form-native-assignment-acceptance-20260917`.

Reconciliation:
- true two-parent merge of current FORM main + existing assigned-plan PR #17;
- no second native plan/filer was built.

Accepted contract:
- account-scoped identity;
- authoritative athlete feed;
- exact version frozen when opened;
- actual inputs blank, never copied from targets;
- payload frozen before first send;
- response-lost retry reuses the same evidence/version/payload;
- filed state requires UUID acknowledgement;
- backend correction keeps original evidence legible.

Open:
1. current-head Mac compile (GitHub iOS workflows currently fail before runner allocation);
2. installed-device Today / Plan / Record review;
3. real designated test athlete identity;
4. native filing → canonical receipt → Console visibility;
5. interrupted-send/relaunch/retry;
6. token refresh and revoked-session recovery;
7. account switch isolation;
8. deploy the exact-retry migration before calling replay acceptance complete.

Do not distribute the native assigned-plan beta before this gate closes.

## 9 · Pass closure status

Passes 1–12 have now produced the intended source, evidence and operating rules.

The ecosystem source/schema/web release is now live, but **full authenticated/device acceptance is not yet closed**:
- anonymous web production acceptance is complete;
- Brice signed-in production acceptance remains open because no authenticated browser session was available;
- one consenting-athlete production acceptance remains open;
- Forge device acceptance is open;
- FORM assigned-plan device acceptance is open.

That distinction is intentional. “Finished” here means the bounded implementation/reconciliation program is complete and the remaining work is release/device acceptance, not another architecture/design pass.

## 10 · Things not to reopen without new evidence

Do not restart these questions merely because a new agent/session begins:
- web Athlete is read-only;
- FORM/Forge recording is based on canonical delivery, not training discipline;
- product purchase is separate from coaching assignment;
- native filings carry exact immutable prescription version;
- coach correction preserves prior evidence;
- review + next instruction are separate from claim judgment;
- app success is not inferred from source or simulator state;
- public evidence is never copied from private athlete records without explicit approval.

A real onboarding/device failure may reopen the smallest affected rule. It does not reopen the whole ecosystem.

## 11 · Smallest next actions

There are only three meaningful next moves:

1. **Close Brice + consenting-athlete authenticated production walks** — web and schema are already live; this requires real authenticated sessions only.
2. **Close Adrian Forge device gate** — needs Adrian's actual account + physical device.
3. **Close FORM assigned-plan device gate** — needs Mac/current-head + designated real test account/device.

Everything else is ordinary coaching/product operation, not unfinished Pass 1–12 implementation.

## 12 · September 18 web-release attempt

Brice delegated the next move; the selected path was **web release first**.

Completed:
- both held Supabase migrations were applied successfully and verified in migration history;
- current GitHub main was checked for concurrent work. Relative to the Pass 12 closure, the only later main change is a documentation-only Test 02 landing-page master brief;
- Netlify production was re-read and still serves deploy `6aac3e68f243b00008917eea`, commit `dd8cfef0fb8348290b4ccd79ff681f141b6e4f1e`.

Blocked:
- the Netlify deploy connector requires an authenticated local-source upload;
- the available runtime cannot resolve GitHub directly;
- the visible Netlify browser profile is signed out and has no stored credentials;
- a strict browser automation attempt stopped without making changes.

Therefore **schema is live, web source is still held**. No production publication claim is made.

## 13 · Final September 18 closeout receipt

After the earlier blocked deployment attempt, Netlify's Git integration published exact current `main` automatically.

Closed:
- web production now matches GitHub `main` `926c743d…`;
- schema migrations `20260918090830`, `20260918090839`, and `20260918094221` are present in FORM Athlete System migration history;
- anonymous production acceptance passed 8/8 without purchase, sign-in, form submission, or protected-data mutation;
- RPD v5 is canonical from Week 5 for the coached assignments covered by the cutover.

Still physical/authenticated evidence, not implementation work:
- Brice signed-in owner walk;
- one consenting-athlete signed-in walk;
- Adrian / Forge Coach Pilot physical-device acceptance;
- FORM assigned-plan physical-device acceptance.

Do not create a Pass 13 for these. Record them as acceptance receipts when the real authenticated/device evidence exists.
