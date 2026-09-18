# Four-runner identity and assignment reconciliation — September 17, 2026

Scope: Anthony, Lisa, Hope and José. This is a truth/reconciliation pass before athlete-facing expansion. It does not fabricate accounts, invites, assignments or training evidence.

## Canonical system findings

### Hope
- Canonical private athlete exists: `hope`.
- Active Race Pace Durability block exists through December 5.
- Calendar dates place September 17 in **Week 4**, even though legacy stored week state/current-week fields still say Week 1. The private loader already treats calendar dates as authoritative.
- Current RPD plan assignment exists and preserves the revision boundary: W1–W3 history remains historical; the later plan revision applies from W4.
- Coach membership is active.
- Athlete access invite exists but is still unclaimed. There is no active athlete membership yet. This is an onboarding state, not a reason to create another Hope.
- Earlier current-week planned occurrences remain in the database as cancelled/withdrawn historical rows. The live W4 occurrences are separate published rows.

### José
- Canonical private athlete exists: `jose`.
- Active Race Pace Durability block exists through December 5.
- September 17 is **Week 4** by calendar, regardless of stale stored Week-1 state.
- The same current RPD plan revision boundary is preserved.
- Athlete membership is active and the athlete invite has been claimed.
- Historical superseded current-week occurrences remain cancelled/withdrawn; the active W4 prescription is represented by later published occurrences.

## Athlete-facing defect found and repaired

The private record loader intentionally retains superseded occurrences because they are historical facts. The new athlete workspace originally selected the first occurrence it found for a weekday. In Hope/José Week 4 that could surface cancelled pre-assignment work (for example the older Tuesday/Thursday prescription) instead of the live published occurrence.

The athlete renderer now excludes `state = cancelled` and rows carrying `withdrawn_at` before choosing the weekday prescription. Historical rows stay in the database and remain available to coach/evidence surfaces; only the athlete-facing prescription is filtered.

## Lisa
- No canonical Lisa row currently exists in the private `athletes` table.
- A legacy/public `/athletes/lisa` page exists in the repository.
- The current public Raise the Ceiling manifest explicitly authors Lisa as one of two athletes, starts the six-week block September 15, gives her an individual Tuesday band, and keeps the shared Thursday standard separate.
- No private membership, private training block, private plan assignment, or private evidence history can be truthfully attributed to Lisa in this environment yet.
- Do **not** create a duplicate “Lisa” merely from the public page. The next safe step is to create/link one canonical private identity when her actual account/email link is available, then materialize her authored assignment without rewriting the public plan or inventing past receipts.

## Anthony
- No canonical Anthony row exists in the private athlete system.
- No Anthony-authored training source was found in the current repository.
- Therefore there is nothing safe to materialize or assign in this pass.
- When Anthony's actual identity/source is available, create or link one canonical athlete and preserve the authored plan/version rather than cloning Hope/José or a demo assignment.

## Result

- Hope and José keep their existing UUIDs, blocks, plan assignments, revisions and evidence history.
- Hope's unclaimed invite remains the correct pending access mechanism; sign-in claiming should resolve that invite rather than create a new athlete.
- José remains linked to his existing athlete membership.
- Lisa and Anthony remain explicitly unresolved rather than being fabricated.
- Athlete-facing session selection now shows only live, non-withdrawn occurrences while retaining cancelled rows as historical truth.
