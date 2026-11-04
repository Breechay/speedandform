# FORM Coach Console · authorized agent operations

Read `coach/agent-map.json` for routes, owners and the short operational schema.
Read the public [Method Bible](../method-bible/method.md) when discussing FORM
training theory. Then read the existing coaching and publication standards in
`AGENTS.md`, `docs/operations/CONSOLE-CONTRACT.md`,
`docs/FORM_CONNECTED_SURFACES.md`, and the active athlete release/Week story
rules before any plan or filing changes.

## The console is an interface, not an all-access agent API

An agent with an authorized Supabase connector may use the established
athlete/coach data owners for relevant reads or explicitly authorized writes.
An agent with repository access alone has **no** right to athlete or owner
records. The owner-only operating projection needs its active-administrator
identity check. Never infer a user ID, scrape auth, or reuse someone else's
session to work around restrictions.

An agent can navigate the web Console by:

- `/coach/ops/?tab=sources`: source checks, staleness and conflicts.
- `/coach/labs/#/a/{authorized_slug}`: athlete case file.
- `/coach/console/?athlete={authorized_slug}`: correct person in Programming.
- `/coach/miami/`: shared session publisher, with preview/review gates.
- `/coach/runs/`: hosted runs and photographs.

Public metadata is not private access. These URLs retain the existing login
and Row Level Security boundaries.

## Agent read path

1. Confirm identity, project and scope before an athlete or owner read.
2. Read the current canonical plan, effective restrictions, filed results,
   reports and version, plus adjacent week and external strength when relevant.
3. Mark data fresh **only** if it was actually reread from its owner.
   Distinguish `read_at`, `observed_at`, `source_as_of`, `expires_at`
   and the athlete session's own date.
4. Surface exceptions with a concrete target: stale source, missing feed
   entry, different prescription version, unfiled session, stale Week story,
   incomplete total, or group override collision.
5. State explicitly whether an edit has been authored, saved, read back,
   published, delivered and seen in a released native application.

## Agent write path

Write only through the existing owning functions and permissions, using
version/revision matching. Do not manufacture missing baseline marks.
Preserve reported times as reported; never portray them as race-verified
without an appropriate source.

Athlete filing must read back into **both** the Week and feed under current
sharing settings, using idempotent writes and honoring opt-outs.
The intended onboarding default is sharing **on**, with an athlete-controlled
opt-out in Settings. Do not invent a second consent request for an eligible
coach-filed session, but verify the actual stored account setting before
publication. If defaults or feed policies disagree with this owner rule,
record a concrete bug and fix it in the owning backend only after testing;
never force-post against an effective opt-out.
Programming changes require the current weekly story to remain true and a
whole-week/recovery check. Cross-app FORM/Forge changes require the coupled
seven-day review. One surface changing does not prove the other updated.

Before claiming completion, report a readback receipt with the actual
authoritative record ID/version, time and the destination that was checked.
Avoid source timestamps in a public repository; record private receipts in
their authorized system.

## Freshness model

The browser may reread the private database after becoming visible again.
This does not magically recheck external Calendar, Gmail, wearable, financial
or app-store distribution sources. An agent should follow the source registry
and fetch those only through an approved provider connector. If a source fails
or expires, preserve its prior value and show the stale state. Never fill an
empty panel with invented current data.

## Future connection work

The next implementation should expose a single authenticated coach-oriented
read projection with per-entity IDs, changed_at, source, source_as_of,
version, pending changes, publication status and errors. The projection may
index existing owners, but should not create a shadow athlete-plan database.
A safe agent mutation path should support preview, explicit owner approval,
idempotent commit and readback, with audit history and role-scoped access.

This file is a documented contract, not a claim those integrations are live.

## Rule maintenance

Treat root `AGENTS.md` and the linked owning contracts as the current policy
sources. The public Method Bible is a coaching philosophy, not private
publishing authority. When Brice corrects a recurring mistake, record the
new decision with its date, owning source, superseded rule and an executable
test or QA receipt if possible. A future machine-readable rule registry should
**index** those authorities, not create a parallel set of stale rules. Never
turn an old archived study or plan into current guidance by keyword matching.
