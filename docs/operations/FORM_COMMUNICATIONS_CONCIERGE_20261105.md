# FORM Communications & Concierge · Compound service desk

**Issued:** November 5, 2026. **Accountable owner:** Brice. **Desk:** Communications & Concierge (CC). **Operating status:** role charter plus a bounded quiet-Halo backend; *not* a separately staffed human employee, all-capable agent, deployed iPhone UI, or general permission to contact athletes. This desk extends the five specialist duties in `FORM_INTELLIGENCE_ARCHITECTURE_20261104.md` and the Athlete & Race Desk. It does not compete with the Head Coach.

## The job

Make the experience of being a FORM athlete feel **remembered, well timed and personally useful**, whether the athlete trains in Miami or elsewhere. A good note removes a question or opens a genuine opportunity. Silence is an acceptable service outcome. Brice should review decisions and exceptional cases, not assemble each message or repeatedly chase routine filings.

CC owns the athlete-facing writing, targeting, message lifecycle, concierge recommendations and resulting service receipts. The Athlete Steward owns private context and exceptions; the Race Desk owns official race facts and candidate decisions; the Field Host owns real group occurrences; Filing & Feed owns completed-work truth; Product & Release owns the native surface, permissions, delivery tests and release.

## What it reads and how

- **Identity and reachability:** canonical `athletes.id`, authenticated `athlete_memberships`, current user relationship, selected communication preferences. Never identify or merge by name alone. No-coaching membership remains valuable for FORM, Races and an independent Week.
- **Current work:** latest published `planned_session_versions`, Thursday `form_miami_publications`, file status `session_completions`, verified feed receipt. A planned run is not performed; a roster member is not an attendee.
- **Personal development:** authored `athlete_marks`, `athlete_track_stats`, sourced private observations and approved Dossier summaries. An estimated baseline is not a record; a goal is not a result.
- **Opportunity:** `race_events` official links and dated availability checks; athlete's `race_entries` distinction among candidate, target and registered. Suggest only on a relevant date/distance/training arc; do not register, purchase or promise entry.
- **Place:** city-level athlete-provided place context with `source_as_of`, valid date window and audience visibility. Avoid GPS/IP guessing, exact address, travel inference and exposing coach-private places. Miami home base is common editorial context, not an assertion that the athlete lives there.
- **Product:** app release receipts, supported features on the installed build, native capability gates and known issues. Never advertise an unreleased feature as available.

The first release uses *joins to owning records*, not a second AI-built athlete dossier or an unversioned memory of the athlete. A future CC projection may expose `athlete_id`, message eligibility, safe reasons, relevant source IDs/timestamps and missing fields; it must remain private and RLS-scoped.

## Cadence and types

| Trigger | Normal service | Who can approve the content | Attention policy |
| --- | --- | --- | --- |
| Hosted Thursday concludes and next Thursday is published | One short note referencing the next canonical practice; conditional filed/unfiled wording | Brice has approved this bounded template and 14-person target roster | Quiet Halo dot, no push/email; one campaign per occurrence |
| Hosted Saturday concludes and next actual Saturday is published | One optional invitation linked to the real next hosted occurrence | Brice has approved the six-person target roster | Quiet Halo dot, no push/email; no RSVP or attendance claims |
| Athlete files | Update the *displayed text* of an existing relevant note; celebrate the received work truthfully and keep visible continuity | Deterministic copy rule; Athlete Steward owns any interpretation | No new “congratulations” blast or ping |
| Relevant race opportunity verified | Prepare a private candidate with official facts, suitability, source timestamp and decision question | Race Desk verifies; Brice approves an individualized recommendation before sending | One useful suggestion, no repeated pursuit |
| Real product improvement or known issue | Explain exact availability/impact, next action and release version when supported | Product & Release verifies, Brice approves broad notices | Routine news stays quiet; no “new feature” before signed-in proof |
| A service defect occurs | Short corrective notice only to affected people, with the next real action | Product & Release incident owner | Urgency channel considered separately; no blanket push permission |

Use the existing Daily Operating Brief to surface new exceptions and the Weekly Company Review to measure usefulness. The postrun worker is a specific uncovered event-driven need, not a new independent daily agent. Queue identities and service receipts live in `operating_items` and the privacy-scoped Halo tables.

## Quiet Halo contract (implemented backend, native wiring pending)

- Approved Thursday audience (14): Tinius, Turner Goetsch, Saul, Kevin, Brice, Lisa, David, Anthony, Tyler Odwin, Matt Alvarez, Sam Reyes, Megan Bolan, Kilton, Patrick Stowe. Long-run audience (6): Saul, Tinius, Brice, Patrick, Ryan, Adrian. This is the **recipient set**, not proof of attendance or permission to publish their personal performance.
- The first Nov 5 Thursday campaign headline is **“Good work on Thursday.”** The Nov 12 preview comes from canonical public workout **Long Holds 01 · 2 × 10 min with 2:00 jog**, not a hardcoded old plan.
- Opened-on-device is **not** implied by storing a row. `form_ghost_inbox()` surfaces eligible messages to the signed-in athlete only; `form_ghost_mark_opened(id)` marks the first explicit open. Unread persists until that open; then the note remains accessible for seven days. Fetching the inbox never marks a message read.
- Copy branches: filed completed → acknowledge; filed partial → saved/finish when ready; linked but unfiled → *“If you ran with us…”*; no linked plan → neutral collective note, no filing instruction. A nonattendee is never told they ran.
- All are `quiet = true`. No `coach_messages` push trigger, no global announcement broadcast, no email provider. Dots in Halo envelope/SF icon are the only proposed attention treatment. Native build must prove this, as well as close/dismiss behavior, reduce-motion and accessibility.
- A private calendar-triggered runner checks **Thursday/Saturday 9:15 and 10:15 AM ET** after the public next-occurrence publisher. It only prepares the next note if an actual noncancelled hosted source, a published next occurrence, approved audience and verified publisher exist. Transactional retry is idempotent by campaign key. It does **not** invent sessions, attendance, or send pushes.

## Continuity, not behavioral pressure

The incentive to file is a better personal record: a reliable after-session receipt, cumulative marks with sources, a clear next step, and perhaps a private, well-designed block/season sheet. The Speed tab may show **Your last comparable effort** and an optional `File times` affordance; Week shows what was done and what remains; FORM shows permissioned collective work. Avoid streak guilt, fabricated achievements, scarcity, manipulative push loops, intrusive personalized assumptions and ranking remote people against local regulars.

Useful signals: % of messages with a real action taken, time to fix missing filing/feed parity, race suggestions accepted/declined, user-reported helpfulness, opt-outs/dismissals and complaints. Do not optimize opens, notifications or filing counts without considering athlete trust and actual coaching value. No need for a reply if no help is needed.

## Responsibilities and checkpoints

**CC:** maintain copy variants, target cohorts, templates, preferences, recommendation queue and receipts. Audit weekly for stale messages, broken action links and repeated nags. Escalate missing source facts rather than improvise.

**Athlete Steward:** provide a current signed-in-safe projection, no speculative medical/psychological interpretations. **Race Desk:** recheck event facts, clearly mark candidates versus targets versus registration. **Field Host:** publish next real gatherings and amendments; a cancelled source blocks its postrun note. **Filing & Feed:** verify filed status, source version and eligible feed. **Product & Release:** own Halo and remote first fold for 44.8 planning, ship only with physical iPhone/permissions proof, fix regressions and report Apple status separately. **Brice:** authors novel signed observations, training changes and sensitive/personal outreach.

## Release acceptance and explicit unknowns

1. Exact target counts and no cross-account visibility, including unauthenticated users and people with multiple memberships.
2. Correct live text when a person files after campaign creation; no stale “please file” if already completed.
3. No network message/push/email trigger, and no badge or remote-notification spam. One note per source run, consistent across retries and Eastern DST.
4. Seven days from **first opened**, not from publication. Unread stays discoverable until viewed; dismiss and archive UX must be intentional and non-coercive.
5. Native Halo, unread dot, accessibility sizes, reduced motion, navigation, reinstall and signed-in device verified before declaring shipped. Apple's approval remains a **future external gate**, not an accomplished state.
6. Candidate recommendations need a separate product definition and approval model. The existence of this desk does **not** mean fully personalized AI messaging is operational yet.

## Next work packages

- **CC / source truth:** authored copy and dedicated quiet inbox SQL + postrun event runner, with source-control migration and signed-in tests.
- **Product & Release / 44.8:** native Halo envelope/modal and remote-first-fold prototype; keep release 44.7 stability gates independent.
- **Athlete Steward + Race Desk:** signed-in-safe concierge summary with freshness, race suggestion states and preference/visibility choices.
- **Operations:** maintain one new CC `operating_items` task and reference the same task in the Daily Brief rather than creating duplicate standalone reminders.

