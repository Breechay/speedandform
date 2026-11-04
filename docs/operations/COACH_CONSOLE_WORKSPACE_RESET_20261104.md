# FORM Coach Console · workspace reset

November 4, 2026 · design and implementation record

## Decision

The coach's tools should feel like one workspace, not a directory of applications.
Use light paper, white working surfaces, ink, quiet green selection, and one
sans-serif family. Reserve dramatic photographic presentation for the public
FORM brand and the athlete experience. The private coach surface prioritizes
scannability and consequence: what is happening, what needs the coach, and what
will change if the coach acts.

The existing systems retain their owners and permissions. A coherent menu
does **not** turn several separate databases into a new source of truth.

## Current IA and authority

| Main destination | Route | Task | Source of truth |
|---|---|---|---|
| Today | `/coach/ops/` | Owner priorities, waiting, runway, sources | Private operating console projection |
| Athletes | `/coach/labs/` | Search roster; examine an athlete's Week, evidence, notes, movement, observations | Canonical FORM athlete records |
| Programming | `/coach/console/` → `/coach/index.html` | Author, revise, file, coach, review, preview, publish decisions | Existing coach-authored sessions and versioned decisions |
| Group sessions | `/coach/miami/` | Thursday/Saturday shared practice, individual pace changes, week copy, delivery | Existing shared publication workflow |
| Runs | `/coach/runs/` | Host occurrences, attendees, photos and editorial media | Existing Collective/hosted-run records |

Do not call the Operating Console's Today view a coaching-attention queue:
it includes money, personal obligations and business work. The coaching queue
currently lives in Programming and the roster/brief. A future combined Today
should **link** to those records without duplicating them.

There are deliberately **five primary destinations**. Athlete-specific
subsections are inside the athlete context; methods and system settings
belong in secondary destinations rather than inflating the main menu.

## Read → act → verify

1. **Orient.** Today for the operating context, Athletes for the roster,
   Programming for coaching attention. Show actual staleness, not made-up zeroes.
2. **Open an athlete.** Athlete identity persists across evidence and programming.
   Show goal, current block, current Week, newest filing, relevant baselines,
   coach observations, notes, movement and published direction.
3. **Read the evidence.** Preserve date, source, actual completed dose,
   athlete-reported experience and the exact version performed.
4. **Author the plan.** Use FORM Method Bible as a coaching *decision rubric*:
   purpose; skill repetitions; training stimulus; recovery cost; position in
   the week; running plus Forge strength; glute priority; Yin/mobility;
   completed progression instead of a pending-review pause. Athlete-specific
   decisions remain Brice's, not auto-generated changes.
5. **Preview.** Compare coach editor, athlete Week, and filed/feed
   representation. Check session total, pace units, title, duplicated copy,
   individualized overrides, current and next week's story.
6. **Publish and verify.** Read the latest canonical version, access/consent,
   athlete-facing Week and feed. Distinguish a saved decision, actual published
   record, external delivery and released native build.

## Implemented first pass in the repository

- Consistent five-link navigation on all five coach destinations;
  contextual links on athlete Weeks deep-link into the correct Programming
  athlete using the already-supported `?athlete=slug` query.
- Athlete roster gains a search field; search only filters existing rendered
  coach-accessible entries. It makes no new data request or roster mutation.
- Shared scoped light/sans-serif stylesheet with source-specific overrides.
  The Ops screen's existing paper system is adapted, not rewritten.
- Desktop athlete case file groups the Week as a full-width context,
  then secondary evidence/notes in a two-column working area. Phone layout
  turns roster entries into an accessible horizontal selector.
- Existing sign-in, private notes, sessions, publishing dialogs, queue guards,
  and permissions stay wired to their original handlers.

## Important limits of this increment

- The older Labs **Full Plan / Week / Brief** renderers are still dark and
  editorial. They need their own measured accessibility/contrast and visual QA
  before conversion. The new light system covers the primary athlete dossier,
  Programming, Today, Group Sessions and Runs.
- No private rows, training doses, publication decisions, feed rows or backend
  schemas were touched by this presentation pass.
- This bullet described the initial source pass before release. **The first
  light workspace was subsequently deployed November 4** via production
  commit `0aea893`; the [release receipt](FORM_METHOD_CONSOLE_RELEASE_RECEIPT_20261104.md)
  distinguishes observed public entry screens from the outstanding signed-in,
  device and dark-to-light transition QA.
- Local visual capture was unavailable in the authoring session; screenshots
  must be checked before production release, especially fonts, low-contrast
  statuses, modals, narrow devices and long athlete names.

## Phase 2 · real organization, not more tabs

1. **Coach Home**: the top coaching questions and newest evidence in an
   attention queue that opens the exact athlete/session. Do not import
   personal money or Calendar tasks into the athlete queue.
2. **One athlete workspace**: within athlete context, stable secondary
   navigation `Week | Season | Evidence | Coaching | Strength & Mobility |
   History`. Preserve existing owner-specific data rather than filling
   unknown sections with placeholders.
3. **Method Library**: coach-authored plain-language doctrine, observation
   cards and cue bank versioned by effective date, athlete/application and
   superseding evidence. FORM's personal observation leads practice; formal
   external literature is optional comparison, not the only permitted origin.
   Cue claims should remain identified as coaching cues, not established
   universal biomechanics.
4. **Publication workbench**: an actual coach-to-athlete-to-feed preview with
   guarded queue state, current/new week-story check, and readback receipts.
5. **Plans & baseline table**: 200/400/600/800/1000m average and best
   observed marks per athlete, with provenance, date and no artificial
   verification requirement. Tie to effective plan, not a second truth.
6. **Coach operations**: calendar, athlete to-dos, group practice, media,
   subscriptions, delivery and recent changes grouped by task rather than
   by storage table. Track actual failures as failures, not empty lists.

## Release acceptance

- Source tests and syntax pass; link targets and active states are consistent.
- Signed-in coach sees a light, serif-free visual system across the five main
  destinations at desktop, iPhone width and large text.
- Search finds known roster entries and never displays inaccessible athletes.
- Navigation preserves athlete context where documented. Authoring's query
  parameter selects the intended athlete.
- No detached dialogs, clipped rail actions, hidden scroll areas, contrast
  failures or unreadable form controls.
- A real athlete record loads, a coach file/preview/publish flow succeeds,
  and the Week/feed readback is correct. Use non-destructive test records and
  never publish training merely to prove a cosmetic change.
- A coach/owner authorization check and sign-out flow still work.
- Production deployment is a separate explicit approval, followed by a real
  release receipt and device/browser screenshots.
