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
