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

Card checkout is not live yet because the connected Stripe account is currently sandbox-only. Until live checkout exists, purchase is arranged directly with Brice at `brice@speedandform.com`.

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
The current web gate is a commercial / UX gate, not a hardened entitlement system. The canonical training data still lives in Supabase and the current public page architecture was originally built for an open plan. Before automated paid delivery, implement and test:

1. live Stripe checkout or Payment Link
2. receipt / purchase confirmation
3. an authenticated or tokenized paid-access path for Weeks 5–15
4. delivery and recovery if a buyer loses access
5. refund / support terms
6. web / PDF / app parity rules

Do not claim secure paid entitlement until those pieces are actually live.

## Current purchase flow
1. Athlete runs / reads Weeks 1–4.
2. Continuing beyond Week 4 routes to the purchase page.
3. Purchase page states `$79 one time`, no subscription and no coaching included.
4. Until live Stripe is connected, the CTA opens an email to Brice to arrange purchase manually.
5. Keep transaction records privately.

When live Stripe becomes available, replace the email CTA with hosted checkout rather than building custom card collection on the site.
