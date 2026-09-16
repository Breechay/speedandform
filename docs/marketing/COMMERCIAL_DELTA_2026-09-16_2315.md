# Commercial Delta — September 16, 2026 · 23:15 ET

Read together with `docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md`.

## Miami Run Development

Fresh Windsor read after the prior $20.62 checkpoint:
- spend: **$25.52**
- impressions: **1,239**
- reach: **879**
- frequency: **1.41**
- clicks: **42**
- link clicks: **22**
- genuine coaching inquiries: still **1 known real inquiry** (Jorge)

Interpretation:
- the campaign has crossed the planned ~$25 spend checkpoint;
- traffic efficiency remains acceptable and the one real inquiry makes a pause unjustified;
- **keep the live control unchanged** rather than editing budget, audience, creative, or page.

Next read should focus on whether a second genuine inquiry appears and on landing-page-view volume rather than chasing CTR.

## Coaching measurement acceptance attempt

A clearly labeled QA submission was sent once from:
`?utm_source=meta&utm_medium=paid_social&utm_campaign=form_miami_run_test01&utm_content=measurement_acceptance`

Test identity:
- `TEST — Measurement Acceptance`
- message included `Internal measurement test — ignore`
- program shown: Run · $1,200 / 8 weeks

Browser result:
- submission succeeded;
- success state appeared;
- no duplicate submission occurred.

Immediate downstream checks:
- Windsor GA4 had **not yet surfaced `generate_lead`** after the test;
- Gmail search had **not yet surfaced the FormSubmit test email** at the immediate follow-up checks.

Therefore the controlled measurement test is **not yet accepted**. Do not change acquisition from this alone. Possible explanations still include reporting/delivery lag or the automation browser's privacy behavior. Re-check GA4 and Gmail later before touching code.

## Race Pace Durability

Access hardening completed after the canonical roadmap's earlier frontend-only gate:
- complete `public_plan` is now service-role-only;
- public users receive `public_plan_preview` with real Weeks 1–4 and redacted Weeks 5–15;
- `rpd-entitlement` v8 serves the full plan only after a paid entitlement is verified;
- live browser QA confirmed Weeks 1–4 readable, Weeks 5+ locked, no paid prescription leakage, and the 15-week structure intact;
- live sales page → Stripe $79 pre-purchase QA passed.

RPD paid campaign remains **paused**.

Do not enable until:
1. Creative A review status is visibly accepted in Meta;
2. true phone-width/physical-device sales + preview QA passes;
3. final Meta destination / URL tags / translation / price / CTA / pixel preflight passes.

Creative B is ready but deliberately not allowed to delay Creative A's first spend.
