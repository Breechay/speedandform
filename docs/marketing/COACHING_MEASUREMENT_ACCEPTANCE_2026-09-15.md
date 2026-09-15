# Miami Run Development — Lead Measurement Acceptance

**Date:** September 15, 2026  
**Purpose:** Separate real funnel evidence from analytics attribution and give us one controlled way to diagnose the gap without touching the live campaign.

## Known real-world evidence

The live campaign `FORM · Miami · Run · Test 01` has produced a genuine coaching inquiry delivered to Brice's inbox. The inquiry carried `meta / paid_social` and the campaign label, so the real-world funnel completed:

**ad → site → intake → delivered inquiry**

Current reporting has not credited that conversion:
- Meta still reports 0 attributed leads;
- GA4 has not shown `generate_lead` from `meta / paid_social`;
- no newer coaching inquiry has appeared after the known inquiry.

Therefore do **not** interpret 0 platform leads as 0 real leads.

## Current live campaign snapshot

As reported September 15:
- spend: $12.90
- impressions: 679
- clicks: 20
- link clicks: 9
- landing-page views: 6
- real coaching inquiries: 1
- Meta attributed leads: 0

Do not change budget, audience, creative, or landing page from this discrepancy alone.

## Code-path inspection

`js/coaching-measurement.js` intentionally separates inquiry delivery from advertising measurement:

1. FormSubmit delivery stays active even when analytics is blocked.
2. The intake code calls `window.formTrackLead()` only after FormSubmit reports a successful send.
3. `formTrackLead()` emits:
   - Meta Pixel standard event `Lead`;
   - GA4 event `generate_lead` with `method=coaching_inquiry`.
4. Measurement is intentionally suppressed when the browser exposes Global Privacy Control or Do Not Track.

That means a genuine inbox conversion with no Meta/GA lead event can happen legitimately if that visitor had GPC/DNT, an ad/tracking blocker, or another client-side restriction. Reporting lag is another possibility.

Do not weaken the privacy behavior merely to improve attribution.

## Decision for September 15

**Hold the campaign unchanged.**

The current discrepancy is a measurement question, not a reason to edit acquisition.

## Controlled acceptance test — only if the lead is still absent tomorrow

Run one obvious test inquiry from a normal browser with tracking allowed.

Use a tagged URL such as:

`/?utm_source=meta&utm_medium=paid_social&utm_campaign=form_miami_run_test01&utm_content=measurement_acceptance`

Submission identity should be unmistakably non-prospect, for example:
- Name: `TEST — Measurement Acceptance`
- Message/goal: `Internal measurement test — ignore`

Then verify, in order:

1. FormSubmit email arrives once.
2. Meta Events Manager / Test Events shows browser `Lead` from pixel `147659485878240`.
3. GA4 Realtime/DebugView shows `generate_lead` with `method=coaching_inquiry`.
4. GA4 preserves the tagged source / medium / campaign for the session.
5. No duplicate Lead / generate_lead event fires.

### Important interpretation

A manually tagged test proves **event delivery**, not Meta campaign attribution, because a manual URL does not reproduce Meta's real ad click identifiers. If Test Events succeeds but the live inquiry remains unattributed, the remaining explanation is attribution/privacy/reporting rather than a broken success callback.

## If the controlled test fails

Diagnose in this order:

1. confirm the production page loads `js/coaching-measurement.js`;
2. confirm GPC/DNT is off in the test browser;
3. confirm FormSubmit returns success and the success pane appears;
4. inspect whether `formTrackLead()` exists and is called;
5. inspect Meta Pixel browser event delivery;
6. inspect GA4 request/event delivery;
7. only then change code.

Do not change the live ad while debugging measurement.

## If the controlled test passes

Keep the campaign unchanged. Record the known inquiry as a real lead in the operating notes even if Meta never backfills it. Use platform attribution as one evidence stream, not the source of truth for whether a human inquiry happened.
