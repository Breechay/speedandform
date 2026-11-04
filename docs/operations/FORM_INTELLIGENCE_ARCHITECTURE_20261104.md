# FORM intelligence architecture · a working company and training system

November 4, 2026 · Owner direction: **train to win**, build superior athletes,
reduce operating friction, and make agent work observable rather than magical.

This extends [Agent Orientation](../AGENT_ORIENTATION.md), the
[Operating Console contract](CONSOLE-CONTRACT.md) and the new
[Coach Console agent guide](../../coach/AGENT_OPERATIONS.md). It does not
replace the existing owners, schedules, permissions or source documentation.

## The operating thesis

Speed & Form is a coaching practice, creative studio, group practice, two
training products and a company. The person and the athlete are the center.
The technology's job is to preserve judgment, make execution legible, catch
mistakes early, and remember what happened.

There is one human authority for meaningful coaching decisions: Brice.
Agents can gather, compare, detect, draft, propose and verify. Reversible
presentation/source hygiene may be automatically fixed within authorized
scope. Prescriptions, medical restriction changes, external messages, cash
transactions and production releases need their own authorization and
readback.

**Train to win is not racing the workout.** Following the plan, doing the
intended effort, glute and other strength, mobility, sleep, nourishment and
rest makes successive sessions possible. The decisive session or competition
is where that accumulated capacity should be expressed.

## One orchestrator, five specialist duties

Do **not** start with five independent bots all writing the same plans.
Use the existing Daily Operating Brief as the coordinating output. Specialists
are bounded lanes, not competing coaches.

| Lane | Watches / reads | Produces | Can change autonomously | Requires Brice |
|---|---|---|---|---|
| **Athlete Steward** | Current plans, recent filings, athlete accounts, adjacent week, known Forge work | Coaching attention, evidence summary, complete plan proposal, PURPOSE / DOSE / COST | No athlete dose changes | New or revised prescription, restrictions, athlete-facing direction |
| **Filing & Feed Reconciler** | New athlete/coach filing, latest canonical version, Week and feed projection | One receipt: performed → Week → feed, plus discrepancies | Safe idempotent read/recheck; cosmetic representation repair in approved code workflow | Changing performed measurements, overriding sharing/consent, unverified completion |
| **Method & Evidence Curator** | Brice's observations, athlete reports, longitudinal marks, public studies, Method Bible | Versioned observation cards; adopted/proposed method revisions | Organize/source private notes without rewriting them; draft comparisons | Adopted doctrine, new cue as standard, public named case |
| **Product & Release Guardian** | Code, QA, versioned publication, native build, actual user surfaces | Reproducible tests, preview, display audit, deployment receipt | Focused code fixes on branch, tests, non-destructive diagnostics | Production publishing, entitlement/permission changes, destructive migrations |
| **Practice & Company Operator** | Collective, runs, attendance, Calendar, commercial threads, source freshness, current cash | Brief, waiting items, event logistics, evidence-backed opportunities | Update authorized internal task receipts, refresh read-only sources | Money, bookings, external sends, sensitive invitations, new experiments |

Later: Creative Studio and Relationships can become explicit lanes when there
is real volume. Do not create one agent per idea or one dashboard per agent.

The existing scheduled Daily Operating Brief, Weekly Company Review,
Opportunity Watch, FORM Labs Evidence and price watch already cover recurring
cadence. A new scheduler should be added **only** for a verified uncovered
event or gap, and should reuse existing tasks when possible. No additional
automation is activated by this document.

## What should be event-driven

| Event | Immediate check | Desired receipt |
|---|---|---|
| Athlete or coach files a run | Match performed work to intended session/version; verify Week and feed under sharing settings; update reported baseline history | Filing ID, actual work, Week version, feed state, errors |
| Coach publishes/revises a session | Validate exact dose/pace/title; check whole week, next week story, other-app strength, existing filings, individual overrides | Version ID, athlete-facing readback, delivery and native status |
| Shared Thursday revision | Preview every subscribed Week; preserve individualized pace and already-filed work | Revision, affected athletes, stories, delivery receipt |
| Athletic observation | Preserve athlete words separately from coach inference, link to session, suggest method note | Observation source, date, proposed cue, adoption state |
| Run attendance closeout | Compare RSVP vs attendance vs completion; link approved photos | Real occurrence ID and closeout status |
| Code or content change | Static quality gates, source-owned checks, rendered review, PR/release | Tested hash, review artifacts, deploy/build and production URL |
| Source expiry or discrepancy | Recheck the real owning source, or label unavailable and notify appropriate lane | Freshness receipt and resolved/unresolved state |

Event handling should use a stable idempotency key. Retries may reread or safely
repair a partial projection but must not create duplicate filing, feed,
attendance, payment or publication rows.

## Source mesh, not shadow databases

The current authoritative mapping remains in Agent Orientation. The ideal
**read-only coach projection** joins references to those records with:

- `entity_type`, `entity_id`, `owner`, `source_version`;
- `occurred_at`, `observed_at`, `source_as_of`, `expires_at`;
- `state`: live, snapshot, stale, conflict, unavailable, pending or unchecked;
- `attention_reason`, `blocking_source`, `next_safe_action`;
- `projection_version` and last successful readback receipt.

The projection should link, not copy, the athlete's canonical plan. It must
never silently choose the newest timestamp over an explicit more recent coach
restriction. Athlete studies are interpretations; the plan is an assignment.

The Console should make the provenance legible to an ordinary human.
Agents get a stable machine-readable orientation at
`/coach/agent-map.json` and the public doctrine in
`/method-bible/method.md`. The map conveys **where**, not **permission**.
Private data comes only through already-authorized connectors/sessions.

### Decision and rule memory

A prolific coaching system can become inconsistent simply because an older
document still sounds authoritative. The next knowledge layer is a compact
**rule index**: rule ID; owner and canonical file; effective date; scope;
superseded decision; whether it is enforced by code, tested manually or only
documented; and last verification. Index existing authority instead of
copying its text into another competing Bible. A new Brice correction should
update that index, the owning rule and the relevant regression test together.

Agents should search both the current policy and directly relevant athlete
history. An old study observation is evidence that can inform a decision;
it is not automatically a current prescription or universal doctrine.

## Freshness is a first-class product state

There are two clocks: when we checked and when the original fact was true.
A successful database read today cannot make last week's bank balance, watch
data or Calendar snapshot current.

Proposed default budgets, to tune by source rather than declare as facts:

| Domain | Suggested check | What can expire |
|---|---|---|
| Athlete filing → Week/feed | At mutation, immediate readback; retry bounded until state known | Projection parity within minutes |
| Published athlete prescription | At author/publish and opening a coach workspace; recheck on return | Version, story_current, access, delivery |
| Group practice/hosted occurrence | At publish and before the actual event | Time, place, RSVP, cancellation |
| Operating Console | On page return after five minutes, without overwriting drafts | Internal projection |
| Calendar availability | Immediately before booking/sending time confirmation | Actual open slot |
| Money | Provider read at brief time and before any financial decision | Balance age, due dates, posted/pending |
| Inbox/replies | At actual outreach decisions, with thread ID | Human reply state |
| Build and app distribution | At release/readback, from source and store | Build availability, installed version |

Expiry creates a visible **needs recheck** state. It must not delete historical
facts or trigger a speculative rewrite. A failed refresh stays visible with
its previous `source_as_of` and error. When connectors are unavailable,
the honest result is a blocked read, not a zero-value or proof nothing happened.

## Four autonomy levels

1. **Observe:** permitted reads, calculations, detection and drafting.
   Always on within the current authenticated scope.
2. **Repair presentation:** reversible text/layout/source-code changes within
   an approved task, with tests and review. No dose change.
3. **Write canonical records:** file only real authorized evidence and
   versioned coaching decisions within the exact delegated scope; reread
   after save. Coach retains program authority.
4. **Act externally:** send, book, pay, change access/consent, run irreversible
   data migration, merge/release or publicly feature an identifiable athlete.
   Requires the separate authorization appropriate to that act.

Approval is attached to the **specific action and target**, not an eternal
blanket approval to an agent persona.

## Method and competitive development guardrails

- The public [Method Bible](/method-bible/) and internal master express the
  **train to win** philosophy. It includes restraint and not racing workouts.
- Running plans are fully authored, not a chain of pending weekly approvals.
- Glute development is a standing priority with individual dose and safety
  exceptions; Yin/mobility is a meaningful tool, not a universal quota.
- Every key session identifies skill learning, physical stimulus, recovery
  cost and its position in the week. Some long runs are genuine workouts.
- Athlete reports and coach observations matter without a sample-size gate.
  Preserve what happened vs what was reported vs inferred vs adopted.
- Versioned 200/400/600/800/1000m average and personal bests may be reported,
  but never manufactured from planned work.
- Every filed result that should be shared must be checked against the feed.
  Onboarding intends sharing on by default and athlete Settings permit
  opt-out. Verify the effective setting and fix mismatched backend defaults;
  no second invented permission prompt, no posting after an actual opt-out.
- Public studies are permissioned curation, not exposure of private athlete
  study files or a new database of medical histories.

## Quality scorecard: measure instead of promising perfection

Measure these from actual production receipts, not from a generated report:

1. Filing-to-Week parity: number of successful readbacks / eligible filings.
2. Filing-to-feed parity: eligible shareable filings with a verified card.
3. Published plans whose Week story is current.
4. Pace, unit, duplicated-title and whole-session-total presentation defects.
5. Plan authoring with an explicit glute priority or documented exception.
6. Relevant training changes checked across both FORM and Forge.
7. External source checks within their validity budget; stale/conflict count.
8. User-visible incidents with cause, owner, correction and recurrence guard.
9. Successful publication receipts for site, shared practice and native app.

Targets can become 100% where an exact invariant is enforceable. Reality may
still fail because an API, device, credential or human input is unavailable.
Show unresolved counts and time-to-repair instead of reporting perfection.

## Execution order

**Now:** public Method Bible, agent map, consistent Console navigation, light
surfaces, basic foreground freshness, and tests. Keep older Labs Full Plan/Week
visual conversion marked pending real screenshots.

**Next:** one authenticated coach read projection that exposes freshness,
publication and filing/feed receipts to both humans and agents. Build the
event-driven Filing & Feed Reconciler first because it prevents daily repeat
requests. Add structured but private observation-to-method proposals.

**Then:** enable bounded specialist runners only where existing schedules
cannot serve, with idempotent actions, a run trace, a visible approval queue,
and an explicit error budget. Do not launch five independent agents or add
another daily briefing task.

**Finally:** connect the mobile FORM/Forge release verification and public
study curation with their existing permissions and evidence contracts.

## Definition of done for any agent action

Every meaningful action returns:

- **Request:** what Brice asked and the exact authorization scope.
- **Owning record:** actual source, ID and version.
- **Change:** before and after without overwriting the reported past.
- **Verification:** source readback plus affected consumer surfaces.
- **Status:** drafted / saved / published / delivered / visible / released.
- **Uncertainty:** missing input, stale external source, failure, or untested
  device state, with next safe step.

An agent that cannot produce the receipt says so. This is what makes the
system trustworthy enough to become more autonomous later.
