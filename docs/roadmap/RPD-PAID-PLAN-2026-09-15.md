# Race Pace Durability paid-plan transition

**Decision date:** September 15, 2026  
**Status:** LIVE, with manual purchase flow  
**Offer:** Weeks 1–4 open preview → full 15-week plan **$79 one time**

This note supersedes the September 12 Race Pace Durability "free full plan + optional support" decision wherever the older roadmap text still appears.

## What is live

- Public plan remains at `/plans/race-pace-durability/`.
- Weeks 1–4 are the open preview.
- Week 5+ is visually locked on the public plan.
- Moving forward beyond the preview routes to `/plans/race-pace-durability/support/`, now functioning as the full-plan purchase page.
- Horizontal paging moves by the number of weeks visible on the current device instead of one week at a time.
- Desktop/iPad can therefore turn 2/3/4/5/6-week sheets as one movement; the paid boundary still wins over paging.
- The old public full-plan PDF was removed and the public print route now points to the purchase page.
- `/plans/` no longer describes every FORM plan as free.
- Public metadata/schema now describes the $79 full plan and four-week preview.

## Current purchase flow

Stripe access connected to ChatGPT is sandbox-only as of September 15. No live card checkout is claimed.

For now:

1. Athlete previews Weeks 1–4.
2. Athlete attempts to continue.
3. Purchase page states `$79 once`, no subscription, coaching separate.
4. CTA opens an email to `brice@speedandform.com` to arrange purchase manually.

## Important limitation

The current web gate is a commercial UX gate, not a hardened entitlement system. The public page still reads canonical plan data through the existing Supabase publication RPC, which was designed for an open plan. Do not describe Weeks 5–15 as cryptographically/private-access protected until an authenticated/tokenized paid path exists.

## Next build, only when useful

1. Connect a live Stripe account.
2. Use hosted Checkout / Payment Link rather than custom card handling.
3. Add receipt + purchase confirmation.
4. Add paid-access delivery for Weeks 5–15 (authenticated or tokenized).
5. Define refund/support terms.
6. Decide whether paid delivery should live on web, in FORM, as a buyer-specific PDF, or in more than one surface.
7. Track preview → purchase conversion before changing price.

## Do not conflate with coaching

- Self-guided Race Pace Durability: `$79 / 15 weeks`, after four-week preview.
- Run Development: `$1,200 / 8 weeks`.
- Run + Strength: `$1,800 / 8 weeks`.

Buying the plan does not include individual review, changes, messaging, strength work or access to Brice's coached athlete roster.
