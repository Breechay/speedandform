# The Athletic Life: opportunity action wiring

October 29, 2026 · Proposed implementation contract · not a live service launch

## Purpose

The founding [Athletic Life brief](../../the-athletic-life/brief.md) asks what FORM could make possible in a person's life. The [research agent guide](../../the-athletic-life/research/agent-guide.md) provides strategic context, not an approved feature backlog. This contract gives Brice and authorized agents a small private workflow for exploring those opportunities without building a social network, duplicating athlete records or converting hypotheses into commitments.

**The missing operation is:** idea → named human benefit → smallest test → resource/permission review → owner approval → actual action in the owning system → evidence → continue, revise or park.

The register is intentionally distinct from a task list. It records an experiment's question, scope, approval and learning. The existing `operating_items` remain the source for next actions and the Daily Operating Brief. A button can create **one linked operating task**; nothing is added to today's four priorities automatically.

## Owning systems, not a new universe

| Real-world action | Owning record | What the opportunity register keeps |
| --- | --- | --- |
| Invite, introduction or conversation | Authorized communication thread, with explicit recipient permission as applicable | The reason to explore, link to the thread, result, next choice |
| Thursday or a special morning | Collective occurrence, RSVP and attendance | Why the gathering is being tested; never inferred attendance |
| Race or athletic challenge | Existing race event/entry and athlete choice | Opportunity hypothesis and link; never an inferred registration |
| Athlete program, season review or movement work | FORM Athlete System and coach decision | Optional learning note; no copied prescription or medical history |
| Strength execution | Forge | Context link only, no shadow filing |
| Film, photo, exhibition asset | Archive and documented subject/media rights | Creative question, effort/cost, evidence of use; no private media copy |
| Venue, host, date, travel | Host agreement and Calendar | Proposal and verification link, not a booking |
| Revenue, payment, expense | Actual offer, invoice and Finance source | Estimated direct cost only; no claim money moved |
| Task or follow-up | `operating_items` in the private Console | Stable link `athletic-life-<opportunity_id>` |
| Product idea | Roadmap, specification, tested code/PR | Experiment evidence; no automatic product authority |

Do not infer consent from a coached-athlete relationship, collective membership, a portrait, a previous event, or a message. Distinguish interest in an experience, permission for an introduction, attendance, photography consent, and rights for publication. Each requires the appropriate actual source and explicit action.

### How the twenty ideas can reach the real world

| Idea | First narrow action | Existing execution/evidence owner |
| --- | --- | --- |
| 01 · Race You Never Considered | Ask one willing runner which unfamiliar event genuinely appeals | Conversation → race event/entry only when confirmed |
| 02 · City Is the Course | Design one route and verify safe logistics before announcing | Collective occurrence and host/route details |
| 03 · Athletic Curiosity | Ask a specialist for scope and availability, without promising a date | Host agreement and Collective occurrence |
| 04 · 48-Hour Escape | Get an actual venue/transport cost and named decision-maker | Commercial/host agreement, Calendar and later Collective |
| 05 · One New Door | Discover one person's wanted outcome and one real barrier | Permissioned conversation and owning follow-up |
| 06 · Table After Practice | Test one small optional breakfast with a confirmed host | Collective hosted occurrence, real attendance |
| 07 · Right Running Partner | Verify both people's wishes before introducing them | Permissioned communication, not a matching feed |
| 08 · Athlete's Dinner | Test interest and a viable venue for six to eight invited people | Host/logistics, Calendar and explicit invitations |
| 09 · Skill Exchange | Find one requested skill and one willing person | Permissioned introduction and outcome follow-up |
| 10 · Support Crew | Ask a racing athlete what support they actually welcome | Race entry, participant agreement, event logistics |
| 11 · Season Conversation | Review one completed block with genuine evidence | Athlete Dossier and coach record |
| 12 · Race After Race | Offer a post-event debrief without inferring a next goal | Race result, athlete account, coach notes |
| 13 · Movement Portrait | Define the coaching question and secure media rights separately | Movement read plus Archive source and permissions |
| 14 · Year in Motion | Curate a permissioned year-end artifact from existing records | Filing/Study evidence and Archive publication state |
| 15 · Personal Athletic Question | Record one athlete-chosen question, with coach ownership | Athlete Study and canonical evidence |
| 16 · Ordinary Greatness | Write a one-person film brief and subject-permission plan | Creative proof brief, Archive, editorial approval |
| 17 · Athletic Life Exhibition | Identify a real display host and rights-cleared selection | Venue agreement and Archive media rights |
| 18 · Thursday Living Studio | Scope one shoot that will not disrupt Thursday practice | Collective occurrence + Archive/production record |
| 19 · Creative Residency | Find one collaborator, deliverable and rights agreement | Partner contract, creative deliverables, Archive |
| 20 · Athletic Life Festival | Validate one host, cost, audience and operational plan before booking | Venue/partner agreement, Calendar, Collective |

These are routing examples, not instructions to create twenty records. Any proposed physical space must be verified; Hideout is not an available default venue.

## The private register

Migration: `supabase/migrations/20261029152310_athletic_life_opportunities_v1.sql`.

The `public.athletic_opportunities` record owns a question, category, optional idea number, beneficiary context, smallest test, time and direct-cost estimates, next action, owner approval scope, state, evidence, learning, source references and a review date. It contains **no seeded athletes, contacts or opportunities**.

- `candidate`: a possibility to consider. No active commitment.
- `ready`: Brice has approved the specifically documented small test, after time and cost estimates. This does **not** approve sending messages, paying, booking, changing a program or publishing media.
- `active`: the experiment is underway; no more than two can be active per owner, enforced transactionally on the server.
- `completed`: evidence and learning are entered, even if the result was disappointing.
- `parked`: retained without consuming an active slot. Reopening returns to an unapproved candidate.

Approved scope changes require returning to candidate. An optimistic `revision` check prevents overwriting another editor. Existing private operating audit history records changes. The owner can review rather than delete completed work.

Privacy: owner-scoped RLS and the existing active coaching-administrator check; no anonymous access, delete permission, public projection or athlete-facing API. The shared reader is `athletic_opportunities_read(p_owner_id uuid DEFAULT auth.uid())`; it is a private versioned response. Browsers omit the argument. Authorized server agents resolve the existing verified coaching-administrator identity and pass its ID, just as the current Operating Console reader does; they must never guess or enumerate owners. A failed read must be shown as unavailable, **never as an empty register**. Do not expose a service-role key to the browser.

## What the UI does

The private `/coach/ops/` gains an **Opportunities** tab. Brice can:

1. Start from any of the 20 brainstormed idea names or create a new candidate. Selecting an idea only pre-fills a label and category; it does not seed a project.
2. Edit the hypothesis, actual possible beneficiary, smallest test, estimated hours, estimated direct costs and review date.
3. Record a narrowly worded approval, then start a test if one of the two active slots is free.
4. Add a source link and later record observed evidence and what was learned.
5. Park, reopen or complete the experiment, with its history preserved.
6. Explicitly create one existing Console next-action task, without automatic prioritization or execution.

The tab performs **no** email, calendar, Collective, Archive, invoice, plan or publication mutation. A task marked Done is not proof a real-world action happened. Create/read back the owning record first, then link its receipt and update the opportunity.

## Example: One New Door

Candidate hypothesis: A willing person may pursue an athletic or creative ambition if FORM removes one specific practical barrier.

- Small test: ask one willing athlete what opportunity they actually want; this is a private discovery proposal, not permission to contact someone automatically.
- Scope: identify barrier, named action owner, hours and direct costs; confirm channel and permission before any invitation or introduction.
- Approval: Brice explicitly approves the bounded test.
- Action: use the existing communication/Calendar/Collective source when authorized. No duplicate RSVP or athlete row.
- Evidence: what the person said or did, dated and linked to the real record; distinguish account of events from FORM's interpretation.
- Decision: continue, revise or park. A memorable outcome need not raise adherence to matter, but a single success does not establish demand.

Do not create this candidate in production merely because it appears in the example. Existing October experiments retain their two slots until Brice chooses otherwise.

## Agent operating rule

Before advancing an opportunity:

1. Read `AGENTS.md`, the current company doctrine/Console, the relevant [research guide](../../the-athletic-life/research/agent-guide.md), and the owning source's current state.
2. Confirm the person wants the outcome rather than assuming it. Record actual permission at the point where it matters.
3. Give one small, testable next action with an owner, scope, time estimate, direct cost and potential downside. Do not turn a portfolio of twenty ideas into twenty live workstreams.
4. For a commitment, send, booking, purchase, public release or training change, use the separate existing owner authorization and source-specific verification. Register approval alone is not authority.
5. Read back the destination, attach an attributable source reference, distinguish evidence from inference, and close with a specific decision or uncertainty.
6. Preserve the original founding brief and source reports. Research informs decisions; it never becomes an automatic implementation requirement or blocks already approved repairs.

## Release and acceptance

This repository change is a **reviewable implementation candidate**. It is not a deployed schema, public site update, native app change or verified account behavior.

The safe release order is:

1. Review the migration and run it in the FORM Athlete System through the controlled database release process. Test active-admin read/write, unrelated-user denial, revision conflict, invalid transitions, simultaneous third-active attempt and append-only audit history. Do not run it as an ad-hoc production SQL experiment.
2. Run Node model/Console tests, verify the source/build for the exact commit, then test the authenticated Console at phone and desktop widths. The old Console must remain usable if the new read fails.
3. Only after the owner authorizes the website release, merge in a coherent batch and verify the matching Netlify deploy and real signed-in behavior. The private Console is not an App Store release.
4. Add the first *real* candidate only when Brice chooses it after reviewing currently active experiments; record the actual owner/approval and readback.

Status as authored: SQL and browser code prepared; Node checks are recorded in the PR. Database migration, actual RLS behavior, hosted authenticated UX, production deploy and human participation are **not verified**.
