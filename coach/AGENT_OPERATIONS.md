# FORM Coach Console · authorized agent operations

Read `coach/agent-map.json` for routes, owners and the short operational schema.
Read the public [Method Bible](../method-bible/method.md) when discussing FORM
training theory. Then read the existing coaching and publication standards in
`AGENTS.md`, `docs/operations/CONSOLE-CONTRACT.md`,
`docs/FORM_CONNECTED_SURFACES.md`, and the active athlete release/Week story
rules before any plan or filing changes.

Read [`rule-index.json`](rule-index.json) for durable rule identifiers and
[`agent-run-contract.json`](agent-run-contract.json) for specialist boundaries
and required action receipts. Both are indexes/contracts, not substitute
authorities or running background workers.

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

`coach_agent_athlete_brief(athlete_id)` is the owner-authorized, coach-scoped
index for one athlete's active block, current Week/story state, upcoming
prescription versions, recent filings, measurements, standing observations,
marks and Forge receipt references. Every row identifies its owning record
and date where available. It is a bounded read and does not prove a wearable
sync or an iPhone render. Use the existing full dossier for deeper history.

`coach_roster_story_audit()` is the roster-wide Week-story check, now shown in
Operations → Athlete intelligence. A story exception does **not** authorize an
agent to improvise an athlete's prescription or alter a paid coaching term.

The live `coach_filing_integrity_read(p_days)` RPC gives the authorized
operating owner a bounded source-level filing/post reconciliation. It does
**not** prove that a Week card or released native FORM feed rendered. Read
`feed_state` literally: `before_sharing_enabled` is historical work filed
before sharing was enabled, `sharing_not_enabled` is a missing setting
that is **not** a recorded opt-out, `opted_out` means do not post, and
`privacy_conflict` requires immediate attention if a post remains while
sharing is off. An agent must not silently convert these states into a
positive publication receipt.

An authorized coach can invoke `coach_reconcile_filing_post(completion_id)`
**only** for a specific known filing. It acquires locks, checks active
membership, current and filing-time sharing, and refuses to rewrite results.
`already_present`, `ineligible` and `no_contemporaneous_sharing` are not
successfully repaired cards. `source_post_repaired` is only a source receipt;
rendered feed and Week still require an independent consumer readback. Do
not batch-run it against historical pre-sharing records.

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

The shared `authorSession` and `reviseSession` data functions now apply the
copy and track-distance preflight used by the Console to **both** Console and
Labs. They return a persisted version readback receipt with
`sourceReadbackVerified=true`, `athleteFeedVerified=false` and
`nativeDeviceVerified=false`. The readback is deliberately not a whole-week
approval: reconfirm the Week story, paired Forge load and athlete-facing
feed independently. If a write succeeded but readback failed, reread first;
never retry the same author call blindly or it may create a duplicate.

`private/whole-week-guardian.mjs` provides an additional read-only triage of
the authorized athlete brief in Operations → Athlete intelligence. A stale
Week story is agent maintenance; same-day/consecutive high-effort running is
a coach judgment prompt, not an automatic cancellation. Missing paired Forge
prescriptions stay **unknown** even when recent Forge receipts exist. The
brief covers the next eight days, not all future block weeks. Do not use its
absence of findings as an all-clear publication certificate.
The source comparison now also reads the dated `coach_preview_strength_days`
under the same signed-in coach identity. It compares mirrored exercise names,
titles and emphasis against key running dates. This verifies the FORM mirror
and its Forge program digest as returned, not live Forge-native delivery or
unsynced edits. Those remain unknown until the owning Forge program is read.

**November 4 owner correction:** Existing glute strength days are intentional
and approved across the current roster. A same-day key run/lower-body strength
pair is background context, not an endless coach-review escalation or license
to move glute days. Keep the program in place. Reconsider when athletes report
new feedback, the running/strength prescriptions materially change, or an
actual restriction conflicts. Preserve the original observation and adjustment
history; do not manufacture a readiness problem from schedule geometry alone.

Feedback continuity in Operations → Athlete intelligence now rereads up to
12 historical `athlete_observations` under the logged-in coach's normal RLS.
It preserves `athlete_reported`, `coach_observed`, `system_detected`, observed
dates, supersession pointers and filing evidence IDs. A filing outside the
bounded brief stays `reference_not_loaded`, never falsely invalid. This is
historical readback, not automatic NLP ingestion of texts. Agents should use
the existing authorized `addObservation` owner after confirming athlete ID,
source wording and observation date; do not claim a screenshot was saved merely
because it appeared in chat. Never infer a program change from one comment.

The private Athlete Intelligence view now provides **Record sourced athlete
feedback**. It uses the same authenticated `addObservation` owner as Labs,
requires an athlete-scoped selection, an explicit source/facet/date and the
original observation, then returns an observation ID and rechecks history.
If the post-write history reload fails, retain the saved ID and investigate
before retrying; no duplicate insert, plan revision, or feed post is implied.

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
