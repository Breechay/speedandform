# FORM coach-filed workout publication rule

Status: CANONICAL / LIVE — November 4, 2026
Owner: FORM coaching system

## Product invariant

- Work sharing defaults **ON** for every active FORM coached athlete at roster addition, including athletes who have not yet claimed their app account.
- A verified athlete can switch sharing **OFF** in Settings at any time. OFF immediately withdraws prior community work posts and suppresses future ones. The OFF preference persists until explicitly changed.
- Only authenticated FORM roster members can read the community work feed; this is not a public web feed.
- A coach-filed completion is first an athlete evidence record. Publication mirrors that record and never changes it.

## Filing acceptance test

Every request to file on an athlete's behalf follows these steps:

1. Resolve the correct existing athlete identity; never create a replacement athlete.
2. Match the dated planned session. If absent, author a clearly retrospective session/version. Preserve historical planned versions.
3. File actual execution with source = coach_import and coach provenance. Save timed pieces when available; label unknown distances/splits as unknown, never invent them.
4. For interval sessions, keep the whole-run total separate from work distance. Verify the units and rep arithmetic.
5. Confirm the coach/athlete feed reads the completion, including its correct dated session version.
6. Confirm `collective_work_posts` contains one active post sourced from the completion and a signed-in roster view of `collective_work_feed()` returns it.
7. If sharing is explicitly OFF, treat that as the intended exception, not a publication failure. Otherwise a missing post is an incident to repair, not a successful filing.

No reply may call a coach-filed workout 'live in the FORM feed' until both the completion and community feed are read back.

## Scheduling after surprise quality work

Do not retain consecutive-day quality merely because a group workout already exists. Preserve shared Thursday work for the rest of the group; apply an individual exception where evidence warrants it.

## Implementation

Production migration `20261104171818_collective_work_default_on_opt_out_20261104.sql` aligns run, Forge strength, and coach duration publishers with default-on sharing. The athlete's OFF row overrides the default. Server publication is idempotent by source receipt. No consent check should be added to the coach workflow beyond respecting a deliberate Settings OFF.

## Owner-requested connected-agent filing fallback — November 16, 2026

A direct request from Brice to file his own workout (including a Strava/Garmin screenshot) is authorization to record that workout in his **existing** FORM athlete account. Do not ask him to authorize the same filing a second time.

If the browser/Console is not signed in but the agent has authorized, owner-scoped FORM database access, do not stop solely at a Console authentication failure. Verify Brice's canonical athlete identity and current coach-owner membership, use a scoped maintenance session that invokes FORM's canonical filing function, and record the actual user/coach provenance. Do not create raw completion rows or bypass the canonical validation, completion triggers, sharing preference, or evidence rules. Never substitute another person's identity or create a duplicate athlete.

If this is an unplanned run, add a clearly retrospective dated session/version so the proper workout label appears in the athlete record and work feed, while leaving the already prescribed sessions intact. Deduplicate by athlete, local date, distance, and duration. Record only observed measurements; missing tempo splits, RPE, and other diagnostics stay unknown. Confirm both the saved completion and the signed-in `collective_work_feed()` readback before reporting success.

Data-only filing does **not** authorize a routine production deployment. If verified owner-scoped access or the canonical filing path is actually unavailable, say precisely what prevented the write instead of claiming it was filed.
