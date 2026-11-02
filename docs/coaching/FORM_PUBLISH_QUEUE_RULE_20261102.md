# FORM · Publish queue and release receipts

**Decision:** 2026-11-02 · Owner: Brice · Applies to Coach Console, strength, running, yoga, athlete access and races.

## Non-negotiable rule

A saved plan is not a published plan. A published plan is not a verified athlete experience.

Every authenticated coach write should end in one of four explicit states: **draft**, **ready to publish**, **published · verification pending**, or **live · verified**. The Coach Console must surface every unresolved item on the roster without making the coach open each athlete. Approved work should be published in the same work pass whenever safety checks allow; do not create indefinite silent drafts.

## The console queue

- A visible **Publish queue** total on the console, always loaded with the roster, refreshed after session and program writes.
- A small per-athlete **Draft N** indicator, and a single queue listing full athlete names and what remains. One click navigates to the affected athlete.
- Separate actionable release work from **held intake**, archived/retired drafts, and externally authored programs. Do not count the same athlete twice because a newer Sculpt 02 cohort supersedes an older group.
- The current first slice detects relevant strength-group activation, future draft training blocks, and unpublished direction drafts. It is a detection surface; **it does not pretend to publish** or infer native strength delivery from a group label.
- Subsequent slices should add schedule conflicts, missing source digests, unsigned invitations, stale weekly stories, FORM Thursday link issues and athlete-device verification receipts to a single audited release ledger.

## Publish sequence

1. Resolve exact athlete identity and intended cohort, verify current source revision and permissions.
2. Validate dates, overlapping sessions, running/strength coupling, copy visibility, clinical safety boundaries, exact sets/digest and group link synchronization.
3. Publish through the authenticated coach workflow with append-only revision evidence; refused protected transitions remain visible with a reason.
4. Read back canonical athlete feed and effective dates for the specific athlete, then verify native 44.5 category and filing support. **Do not mark group active on metadata alone.**
5. Invite only the identified athlete through a scoped access reservation. Send email only after its athlete/email pairing is confirmed. Record sent, delivered, claimed and signed-in phone acceptance separately.
6. Remove the queue item only after the expected delivery stage is actually verified. Failed publish and missing phone evidence do not silently become success.

## Urgency and distinction

Approved training work should not be left as 'planned' without a visible blocker. A future draft that needs coaching judgment may remain draft, but appears in the queue with its intended date. Empty/unassigned intake is a review hold, not an automatic order to invent sessions. A withdrawn session or incompatible shared FORM Thursday subscription needs an explicit correction path rather than a bypass.

## Existing 2026-11-02 conditions

- Sculpt 02 v2 Full Split cohort requires source digest/native validation and publication across all approved members. Sam's 12-week v2 coach strength projection is already present; others are not equivalent to his v2 rollout.
- Glute Priority observed cohort has five athletes with six matching live v1 strength days each, while the roster group's lifecycle metadata remains draft/planned. Distinguish those two facts until native verification and authenticated activation.
- Coach session revision does not move scheduled dates. Until a dedicated authorized reschedule flow exists, reject date-edit attempts rather than falsely reporting success.
- There is no coach invite UI on main. The secured invite dialog in this PR is a prerequisite for the explicit Sam invitation; email delivery is separate.

## Release acceptance

The default healthy state is **zero unexplained pending publications**. A nonzero queue tells Brice exactly which people, program instances and blockers are left. The next action must be explicit; the coach never discovers an unshipped plan only by opening an athlete's Week.
