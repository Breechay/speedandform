# Race Pace Durability: offer and service decisions
Updated September 15, 2026. Supersedes the September 12 optional-support model.

## Now
Race Pace Durability is a paid plan with a free four-week preview.

- Weeks 1–4: open on the public web plan.
- Weeks 5–15: paid access.
- Price: **$79 one time**.
- No subscription.
- Individual coaching is separate.
- Public navigation should never reveal Week 5+ content; attempts to continue beyond the preview route to `/plans/race-pace-durability/support/`, which now functions as the purchase page.
- On wider screens, horizontal navigation should move by the number of weeks visible instead of shifting only one week at a time.

Live Stripe hosted checkout is active. The purchase page routes to the $79 one-time Payment Link. Stripe collects the buyer email and confirms payment; full-plan delivery is still manual until buyer-specific entitlement exists.

The public PDF is no longer promoted from the plan page. Do not describe the complete plan as free anywhere on the site.

Race results await December 5. Approximate PRs and forecasts remain absent. Publish both outcomes when verified.

## Two modes
| | Plan-guided | Coached by Brice |
| --- | --- | --- |
| Work | Complete 15-week versioned plan | Individual assignment |
| Entry | Weeks 1–4 preview, then $79 once | Run Development intake |
| Filing | Self-guided for now | Athlete evidence/report |
| Next step | Athlete follows the authored progression | Brice reviews and authors decisions |
| Responsibility | Self-guided, no implied human review | Explicit review scope and response expectations |
| Study | Separate opt-in editorial selection | Coaching also does not imply public disclosure |
| Today | $79 / 15 weeks after four-week preview | Existing Run Development: $1,200 / 8 weeks |

Full-block coaching remains a separate service. Do not imply that buying the plan includes adjustments, messaging, review or unlimited attention.

## Pricing
$79 is the live launch price for the complete self-guided block. Treat it as an experiment, not a validated optimum. Track:

- preview-to-purchase conversion
- purchase source
- support burden
- completion / adherence when observable
- useful feedback
- whether buyers later inquire about coaching

Do not add artificial feature tiers until demand shows a reason.

## Access and delivery
The current web gate is a commercial / UX gate, not a hardened entitlement system. The canonical training data still lives in Supabase and the current public page architecture was originally built for an open plan.

Live now:

1. live Stripe hosted Payment Link
2. Stripe checkout confirmation and buyer email capture
3. public Weeks 1–4 preview with Week 5+ locked
4. manual post-purchase delivery

Before automated paid delivery, implement and test:

1. an authenticated or tokenized paid-access path for Weeks 5–15
2. delivery and recovery if a buyer loses access
3. refund / support terms
4. web / PDF / app parity rules

Do not claim secure paid entitlement until those pieces are actually live.

## Current purchase flow
1. Athlete runs / reads Weeks 1–4.
2. Continuing beyond Week 4 routes to the purchase page.
3. Purchase page states `$79 one time`, no subscription and no coaching included.
4. CTA opens Stripe hosted checkout for a real $79 one-time payment.
5. Stripe records the payment and buyer email.
6. Speed & Form sends full-plan access manually until automated entitlement is built.
7. Keep transaction records privately.

Hosted Stripe checkout is intentionally used instead of custom card collection on the site.
