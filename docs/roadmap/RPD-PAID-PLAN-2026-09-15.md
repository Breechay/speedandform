# Race Pace Durability paid-plan transition

**Decision date:** September 15, 2026  
**Status:** LIVE, with live Stripe checkout + manual delivery  
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
- Live Stripe hosted checkout is active for the $79 one-time purchase.
- Buyer email is collected at checkout and Stripe shows a purchase confirmation.

## Current purchase flow

Live Stripe is connected to the `Form.Practice` account in livemode.

1. Athlete previews Weeks 1–4.
2. Athlete attempts to continue.
3. Purchase page states `$79 once`, no subscription, coaching separate.
4. CTA opens Stripe hosted checkout.
5. Stripe records the real $79 payment and buyer email.
6. Full-plan access is sent manually for now.

## Important limitation

The current web gate is a commercial UX gate, not a hardened entitlement system. The public page still reads canonical plan data through the existing Supabase publication RPC, which was designed for an open plan. Do not describe Weeks 5–15 as cryptographically/private-access protected until an authenticated/tokenized paid path exists.

## Next build, only when useful

1. Add buyer-specific paid-access delivery for Weeks 5–15 (authenticated or tokenized).
2. Add recovery if a buyer loses access.
3. Define refund/support terms.
4. Decide whether paid delivery should live on web, in FORM, as a buyer-specific PDF, or in more than one surface.
5. Track preview → purchase conversion before changing price.
6. Only automate further after real purchase/support behavior gives a reason.

## Do not conflate with coaching

- Self-guided Race Pace Durability: `$79 / 15 weeks`, after four-week preview.
- Run Development: `$1,200 / 8 weeks`.
- Run + Strength: `$1,800 / 8 weeks`.

Buying the plan does not include individual review, changes, messaging, strength work or access to Brice's coached athlete roster.
