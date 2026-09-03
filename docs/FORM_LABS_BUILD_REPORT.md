# FORM Labs — routes, queries, call sites

Answer to the build brief. **No code written.** Design read from
`form-labs-pass21.html` (pass 21); schema read from `supabase/migrations`;
existing surface read from `coach/`, `private/`. Evidence base is
`docs/FORM_LABS_CAPABILITY_AUDIT.md`, which this does not repeat.

---

## 1. Routes

**One document, three views.** The bench, the athlete page and the block are
hash routes inside a single page, not three pages. One auth boot, one roster
load, and navigation costs nothing.

| Route | View | Loads |
|---|---|---|
| `/coach/labs/` → `#/bench` | Bench | `loadCoachBench` |
| `#/a/:slug` | Athlete page | `loadAthleteRecord(id, {coach:true})` + `loadAttentionFor(id)` |
| `#/a/:slug/block` | Block | nothing new — same record |

Files: `coach/labs/index.html`, `coach/labs/labs.js`, `coach/labs/labs.css`.

- `/coach/` is untouched. Nothing routes away from it until Labs has the verbs.
- **No `_redirects` entry needed.** Netlify serves `coach/labs/index.html` at
  `/coach/labs/`. Add `/coach/labs  /coach/labs/index.html  200` only if the
  slashless form has to work.
- **No `_headers` entry needed.** The `/coach/*` block already covers
  `/coach/labs/*`: `noindex`, `DENY`, and the CSP. See finding 5 — the CSP has a
  real cost here.
- Keep `?athlete=<slug>` working; the Console already uses it and links between
  the two surfaces should not break.

---

## 2. Queries

### A. Bench — one new loader, `loadCoachBench(coachMemberships)`

The bench must not call `loadAthleteRecord` per athlete. That is 26 queries each,
**182 for seven columns.** The bench loader is **11** — four from
`loadCoachRoster`, seven added — and RLS already permits `.in()` across a
coach's athletes (audit §7). (The report first said seven; seven is the number
added, not the total.)

Everything `loadCoachRoster` returns today is kept — `coach_attention` (the note
line), primary `athlete_marks` + `mark_checkpoints` + `mark_standing_confidence`
(the instrument figure). Added, all `.in(athlete_ids)` and all in one
`Promise.all`:

1. `training_blocks` — `status = 'active'` → race, `race_on`, `total_weeks`,
   `week_starts_on`. Gives *"OUC Half · Orlando · 5 Dec"* and the *of 15*.
2. `training_weeks` → current week per athlete. **Compute from `starts_on` /
   `ends_on`, never from a session date** (audit §7.4 — the Saturday/Sunday long
   run artifact). Gives *"Week 2 of 15"*.
3. `planned_sessions` `.in('week_id', currentWeekIds)` → TODAY and NEXT.
4. `planned_session_versions` `.in('planned_session_id', …)` ordered
   `version_number desc` → the current version.
5. `planned_session_components` `.in('version_id', …)` → `structureOf` renders
   *"3 × 2 mi @ 6:30–6:45"*. The typed components are the prescription; the
   version's prose is not (item 73).
6. `session_completions` `.in(athlete_ids)` ordered `filed_at desc` → the LAST
   line.
7. `session_pieces` `.in('completion_id', latestIds)` → the splits inside it
   (*"2 × 10 min @ 5:59 / 6:01"*).

The TODAY-versus-LAST label is derived, not stored: a session scheduled today in
the current week renders TODAY; otherwise the most recent filing renders
`LAST · <date>`.

### B. Athlete page — the existing record, plus two reads

`loadAthleteRecord(athleteId, {coach:true})` already returns the ladder
(`marks` + `checkpoints`), the evidence (`completions`, `pieces`, `verdicts`),
the reads, judgments, confidence and private notes. Two additions:

8. **`session_exception_state`** — `.eq('athlete_id', …)`. This table is queried
   **nowhere in the codebase today.** It is José's SYMPTOM fact, and it is the
   only place the exception's own `id` exists (finding 3).
9. `coach_attention` for the selected athlete via the existing
   `loadAttentionFor(athleteId)`. Labs should call it directly rather than
   picking the athlete's slice out of the roster, the way `refreshSelected` does.

### C. Block — no new queries at all

`weeks`, `sessionsByWeek`, `versions.components`, `planned_sessions.state`
(`'cancelled'` is a real value → the `.canx` chip), `planned_session_versions.intent`
(→ the `<q>` line under a chip). Weekly totals and the shape-strip bar heights are
client-side sums over the same rows.

The block is a **presentation** problem end to end. That is the reason not to
build it first, not only that it is less urgent.

---

## 3. Call sites

New, in `private/data.js`:

1. `loadCoachBench(coachMemberships)` — §2A.
2. `session_exception_state` inside `loadAthleteRecord`, returned as
   `record.exceptions`.
3. `setExceptionStatus(exceptionId, status, reason)` → `rpc('set_exception_status')`.
   **The RPC exists and has no caller anywhere.** This is what makes a Read
   actually clear an item.
4. `signPortraits(rows)` beside the existing `signEvidence` — only once the
   bucket exists.

New, in `coach/labs/labs.js`:

5. Boot: `getAccessContext()` → `loadCoachBench` → bench. Athlete selection →
   `loadAthleteRecord` + `loadAttentionFor`.
6. Verb bindings, one drawer:
   - **Read** → `createRead({athleteId, athleteText, questionAnswered, completionIds})`
     **+** `setExceptionStatus(...)` when the item cleared is an `athlete_report`.
   - **Judge** → `createRead` with `completionIds` (see finding 4).
   - **Revise** → `reviseSession(plannedSessionId, payload)` — title, intent and
     date only until finding 1 is resolved.
   - **Author** → `authorSession(payload)`.
   - **File evidence** → `fileForAthlete(payload, pieces)`. The paste parser stays
     thin, as briefed.

Moved, not copied:

7. Lift `structureOf`, `doseOf`, `titleAlreadySays`, `qualifyingWords`,
   `initials` out of `coach/coach.js` into `private/render.js` and import them in
   both surfaces. Copying them forks what a session says, and the two surfaces
   would drift within a week.

`private/auth.js`, `private/supabase-client.js`, RLS and every write function are
untouched.

---

## 4. Findings that change the build

### 1. Revise and Author cannot write structure today — the top risk

`writeVersion` (`private/data.js:436`) inserts a `planned_session_versions` row
and nothing else. **`planned_session_components` has no insert path in any
JavaScript in this repository** — all fourteen inserts live in migrations. The
Console's own session form (`coach/coach.js:1495`) writes `details` prose, never
components.

So a Labs revise that changes reps, distance or band writes a new version and
leaves the typed structure untouched — and the chip, drawn by `structureOf` over
components, would show the **old** structure under the **new** title. Silently.

This is not a Labs regression. It is why authoring a block is 150 hand-written
SQL sessions, and it is the strongest argument for the Labs/Console split.

Two ways out. Either Revise ships restricted to title, intent and date in
tranche 1, or an RPC — `revise_session(version + components)`, one transaction —
lands before the Revise verb does. **Recommend the RPC**, and note it also fixes
the Console.

### 2. The ladder has no join to the sessions that move it

`mark_checkpoints` carries value, label, position, state. **No date, no session
reference.** But José's rungs carry dates (SEP 8, OCT 18, OCT 25, NOV 8) and the
block outlines five chips in lime. Those are the same missing edge, twice.

This is where the carried key-ness ruling lands, and it should not be a boolean.
`planned_sessions.establishes_checkpoint_id uuid null references mark_checkpoints`
gives all three at once: the lime outline, the rung dates, and the drawer's fifth
verb ("the session that moves this"). A boolean gives none of them.

### 3. Clearing an item needs an id the view does not expose

`coach_attention` selects
`coalesce(e.completion_id, e.planned_session_id) as subject_id` and drops the
exception's own id. `set_exception_status` needs that id. So either query
`session_exception_state` alongside (query 8, recommended — it is wanted for the
SYMPTOM fact anyway) or add `exception_id` to the view.

### 4. Judge, as drawn, has no table

The form is verdict + required reason + source ∈ FORM / ATHLETE / PATTERN,
against a session's evidence. `judgeClaim` writes `mark_judgments`, which is
mark-scoped and takes a *direction*, not a verdict. `session_verdicts` is a
derived view and not writable.

The honest mapping for tranche 2 is `createRead` with `completionIds` — which is
exactly what clears the `unread_session` item, the daily loop. The
FORM / PATTERN rows are the standing-fact primitive and wait with it. Worth
saying out loud: **"Add read", "Read it" and "Judge" are three labels over two
writes** in the mock, and they should be two labels.

### 5. The CSP blocks the file's geometry

`/coach/*` sets `style-src 'self'`. The mock carries inline `style=` in roughly
sixty places, including the load-bearing ones: `--n` on `.rail`, `.stripGrid`
and `.swkGrid`, and `height:` on every shape bar.

`element.style.setProperty(...)` from JS is fine — the Photo Lab already works
that way. Literal `style="…"` attributes in the HTML are not. Every geometry
value has to be applied after render, or travel as an SVG attribute. Budget for
it; it has already bitten the block-shape view once.

### 6. The AS RUN number leaks into two places that are not AS RUN

WEEK 1 AS RUN is out of scope, as briefed. But its total is quoted twice
elsewhere: José's **LOAD** line ("45.1 mi run last week. 17 authored.") and the
block footer's **WHAT IS AUTHORED** ("The plan holds 17 miles. He ran 45.").
Both are Strava, not filings.

Build those two as authored-only — the 17 is real — and hold the comparison
until laps ingest. Otherwise the count of hand-written things is six, not four.

### 7. Two more unbacked lines, beyond the four named

- The plate line under each name — *"Half 1:40:23 · Key Biscayne, April 12 ·
  7:39/mi"*. There is no PR field on `athletes`; the nearest home is
  `athlete_baselines.running_history`, which is prose.
- The GOAL elaboration paragraph on every athlete page.

Both belong to the standing-fact primitive. Neither changes the ruling; they
change its size.

---

## 5. Portraits — the smallest version

Blocking, as the brief says. The smallest thing that ships:

- Bucket `athlete-portraits`, following `session-evidence` exactly.
- `athletes.portrait_path text`, plus the crop values.
- `signPortraits` beside `signEvidence`; `loadCoachBench` and
  `loadAthleteRecord` both return `athlete.portrait`.
- **No CSP change.** `img-src` already allows `'self' data: blob:` and the
  Supabase origin.

Two decisions I need before writing the migration:

1. **Four values or six?** The brief says four (`--px`, `--py`, `--pz`, `--exp`).
   The file's Copy CSS emits six — it adds `--con` and `--grade`, and the Photo
   Lab's COLOUR slider drives `--grade` live. Four columns lose the grade
   control. My read is that six is what the design actually uses.
2. **Public-read or signed?** Signed URLs expire in an hour, and the bench is a
   tab that stays open all day — it would need re-signing on focus. A portrait is
   less sensitive than session evidence but it is still an athlete's face, and
   consent is modelled nowhere except `record_publications`. My recommendation is
   a private bucket with signed URLs and a refresh on visibility change, which is
   one more call site and no new consent question.

---

## 6. Build order

As briefed, and not the block first:

1. Bench + athlete page, read-only, against real rows. Portraits land whenever
   they are ready; everything else degrades to an empty section.
2. Read (and with it: `session_exception_state`, `setExceptionStatus`). This is
   the loop that changes the week.
3. The block. Presentation only.
4. Revise and Author — behind the components RPC (finding 1).

Standing facts, AS RUN, and Rod and Devin's vocabulary are out of all four.


---

## 7. What shipped, 2 September

Tranches 1 to 3 of §6 are built. Read is wired. Revise and Author are not, and
wait behind the RPC in finding 1.

**New files**

- `private/render.js` — `structureOf`, `titleAlreadySays`, `initials`,
  `dayLabel`, `rangeLabel`, `MONTHS`, and a new `authoredMiles`. Moved out of
  `coach/coach.js`, which now imports them; not copied. `doseOf` and
  `qualifyingWords` stayed behind because they read the selected athlete's mark
  out of module state, and Labs does not need them yet.
- `coach/labs/index.html`, `coach/labs/labs.css`, `coach/labs/labs.js`.
- `supabase/migrations/20260902100000_a_portrait_leaves_the_phone.sql` —
  **written, not applied.** Six values and a signed bucket, per the ruling.

**Changed**

- `private/data.js` — `loadCoachBench`, `setExceptionStatus`, `signPortraits`,
  and `session_exception_state` inside `loadAthleteRecord` (returned as
  `record.exceptions`).
- `coach/coach.js` — imports the moved renderers. No behaviour change.

**Three things found while building**

1. **Pass 21 has a CSS defect.** A dangling `.pane ` sits on its own line
   (source line 93), which turns the comment after it into whitespace and the
   next rule into `.pane .stage`. The two-column athlete composition therefore
   never applies above 1100px — the portrait pane collapses to zero height and
   the page renders as one column. Fixed in `labs.css` with a note where it was.
   Worth knowing because it means the athlete page in pass 21 only ever composed
   correctly on a narrow window.
2. **Every chip would carry a quote.** `planned_session_versions.intent` is
   `not null`, so rendering it on each chip printed the same sentence
   twenty-nine times out of thirty. The quote is now shown only when a block
   says that sentence once — the session with something of its own to say gets a
   voice, and the boilerplate stays quiet.
3. **The instrument caption said the unit twice.** A mark labelled "miles owned"
   already carries its unit and read `MI MILES OWNED`; one labelled "owned" does
   not. The caption now decides from the words, reusing `titleAlreadySays`.

**One correction to the plan, made while writing it.** The bench first read the
120 most recent filings across the roster. A flat cap lets one athlete filing
heavily hide another's last session, and the column would say "nothing filed"
about someone who ran on Tuesday. It is a sixty-day window now, plus one exact
query per athlete who has been silent longer than that.

**Verified**

Against fixture rows shaped like the real tables, through the real modules, with
`private/data.js` and `private/auth.js` swapped by an import map: the bench
composes seven columns; the athlete page composes portrait-left with the ladder,
the evidence and its facts; the block renders fifteen weeks, the shape strip, the
holes and the cancelled sessions; and the Read verb writes, clears the open
report, and re-reads the record. Also checked at the phone breakpoint, where the
nav pill overlapped the instrument row and now does not.

**Not verified, and it needs saying:** none of this has run against Supabase.
Signing in is not something I do, so every query in `loadCoachBench` is proven by
shape and not by response. The first real load is the test.

**Also open**

- The design names Newsreader and Inter. `style-src 'self'` blocks the Google
  Fonts stylesheet, so the page falls back to Georgia and the system sans until
  those two woff2 files are served from `/assets/`. The stack is named already,
  so it upgrades the day they land.
- `.claude/launch.json` gained a `labs-preview` entry pointing at the scratch
  harness. It is a local preview server, not part of the site.


---

## 8. Second pass, 2 September

Brice's three, in order. All done.

### 1. Migration applied, loaders replayed against production

`supabase migration list` showed **two** pending, not one:
`20260901110000_plan_authority_switch.sql` was also unapplied. Brice chose to
push both. Applied clean; the switch is additive and both its columns default
false, so nothing changed behaviour.

Verified on the remote: seven `portrait_*` columns with the right defaults, the
`athlete-portraits` bucket private at 8 MB, four policies (member read, coach
insert/update/delete).

**Signing in is still not something I do**, so instead the production rows were
dumped and replayed through the real `private/data.js` behind a stub Supabase
client — the actual `loadCoachBench` and `loadAthleteRecord` code, real rows, no
RLS. That found one real bug and several facts worth having.

**THE BUG — the calendar lost to a stale label.** Both loaders picked the current
week by `state = 'in_progress'` first and the date range second. Nothing in the
app has ever written `training_weeks.state`; it is set by migrations, three rows
carry it, and all three are week 1. On 2 September every athlete's week 1 still
said `in_progress` three days after it ended — so the bench, the athlete page and
**the Console** all called week 1 current and drew last week's sessions as this
week's work. Dates now outrank the stored state in both loaders. This fixes
`/coach/` as well, which is a change to the Console I made deliberately: leaving
it would have shipped a bench that disagreed with its own athlete page.

**What production actually holds**, which the design should know:

- **Four athletes, not seven.** Hope, José, Marcus, Natalie. Simon, Rod and Devin
  have no rows at all — so three of the seven bench columns have nothing behind
  them, including the one carrying the HYROX instrument.
- `target_event` is *"Half marathon"*, not *"OUC Half · Orlando"*. The race line
  renders thinner than the design.
- `goal_label` is *"Sub-1:30"* and *"Finish"* — not the design's sentence. The
  sentence is a standing fact and waits with them.
- Mark labels are sentences: *"Longest continuous run at race pace"*, where the
  mock had *"owned"*. The instrument caption wraps to two lines now rather than
  being cut.
- Nobody has a session scheduled today, so every column is on the `LAST · date`
  branch — which is the branch the mock never drew.
- José's top attention item is the open `athlete_report`, as designed. Marcus has
  none and no filings: the "nothing established" empty state, verified before any
  photograph exists to hide it.
- One filing has zero pieces (Natalie's), so the splits line falls back to
  distance. Real data exercised that path on the first pass.

### 2. Newsreader and Inter self-hosted

`/assets/labs/fonts/`, four woff2 — latin and latin-ext for each family, both
variable, 352 KB total. latin-ext is the extra pair beyond the two asked for: a
roster is people's names, and it is 170 KB that stops a name rendering in the
wrong face.

`@font-face` sits at the top of `labs.css`; latin is preloaded in the head.
**No CSP change** — `font-src` is not named in the `/coach/*` policy, so it
inherits `default-src 'self'` and same-origin fonts load. `/assets/*` is already
`immutable` in `_headers`.

### 3. `revise_session`, written for the Console

Three migrations, all applied:

- `20260902110000_a_revision_carries_its_anatomy.sql` — `component_wire_keys()`,
  `write_session_version`, and the two doors `revise_session` / `author_session`.
- `20260902120000_the_pace_message_was_unreachable.sql` — the specific pace
  refusal was dead code behind the generic unknown-key check. Reordered.
- `20260902130000_the_console_types_into_details.sql` — the first cut dropped
  `planned_session_versions.details`, which the Console's form fills in. Passed
  through now, and it goes when item 73 goes.

The shape, and the four decisions inside it:

- **Version and components in one transaction.** This is the whole point.
- **The version number is assigned server-side.** The old client read
  `max(version_number)` and incremented it, which loses a race to a concurrent
  revision and surfaces as "saving failed".
- **Components omitted means "I did not touch the structure"** and the previous
  version's anatomy is carried forward. An explicit `[]` means the session has no
  typed structure. Different statements, kept apart — without this, fixing a typo
  in a title would strip a session's anatomy.
- **Pace travels in seconds.** `pace_low` / `pace_high` text is derived in the
  database, so the two representations cannot disagree, and sending the strings
  is refused by name.

Proven against production inside rolled-back transactions, as a real coach via
`request.jwt.claims`: carry-forward keeps three components across a title-only
revision; a typed write lands positions from array order and derives `6:30` /
`6:45` from 390 / 405; and four refusals fire with legible messages — unknown
key, pace as a string, empty intent, and a stranger claiming to be the coach.
Row counts before and after are identical (329 versions, 461 components, 150
sessions), so nothing was left behind.

`authorSession` and `reviseSession` in `private/data.js` now call the RPCs;
`writeVersion` is gone. The Console's session form works unchanged — same
payload, same call sites.

**What is still not built:** a component editor. The RPC can write anatomy, and
neither surface has fields to author it with yet. The Console sends
`components: null` and carries structure forward, which is correct and is not the
same as being able to change it. That editor is what turns a hundred and fifty
hand-written sessions into a Sunday.


---

## 9. Third pass, 2 September

### The wrong-week audit — clean

`console/ladder` is pushed; `origin/console/ladder` = `38c1bca`, verified byte for
byte. Production's schema record is no longer only on one laptop.

The question was whether anything prescribed in the last few days was authored
against the stale week. **It was not.**

- The Console showed the wrong week from **31 August** (30 August for Natalie,
  whose week 1 ended a day earlier) until the fix today.
- **Nothing has been authored at all since 31 August**, and every version written
  on the 31st came from a migration — 324 of the 329 versions in the database
  have `authored_by` null. Migrations name their week by number in SQL; none of
  them can be misled by a display.
- All 40 versions written on the 31st landed in **weeks 5 to 14** (21 Sep to 29
  Nov). Nothing touched week 1 or week 2.
- The only five versions ever authored by a person through the Console were
  written on **26, 28 and 29 August**, all into week 1 — while week 1 genuinely
  *was* the current week. Natalie's, on the 29th, was the last day of her week 1.
- Zero sessions created since 31 August.

So the display was wrong for two days and nothing was decided against it. The
exposure was real and the window happened to be empty.

### The race is a row now

`training_blocks.race_name` and `race_place`, with `athletes.target_event` as the
fallback it should always have been — it holds a distance, "Half marathon", in a
field the surfaces read as an event.

Backfilled: Hope and José to *OUC Half · Orlando*, which existed only in the
design file; Marcus and Natalie take their `target_event` as the name, with no
place invented. The bench now renders **OUC Half · Orlando · Dec 05** from rows.

### The captions are captions

`Longest continuous run at race pace` → **`continuous at race pace`**, and
`Longest continuous distance` → **`continuous`**. The instrument reads
`1 MI CONTINUOUS AT RACE PACE`, one line. The full sentence was never lost: it
is already on the mark as `current_question` — *"How far can he hold 6:30–6:45
without it coming apart?"*

### The component editor — the Console can author anatomy

In the Console, where authoring belongs. A repeating list of pieces inside the
session dialog: role, shape, reps, distance or minutes, band, recovery and kind,
floor and ceiling. It loads what a session already has, so a revision is an edit
rather than a retype.

Three decisions inside it:

1. **Untouched sends nothing.** Open the dialog, change the title, save — the
   component field is omitted entirely, `revise_session` reads that as "I did not
   touch the structure", and the previous anatomy carries forward whole. Sending
   back what is on screen would not be equivalent: the screen holds what this
   form knows how to say, and the row knows more.
2. **Provenance the form cannot show travels invisibly.** Two components carry
   `rpe_source = 'inherited'` with `rpe_default_version = 'v1'` — an RPE that came
   from `effort_defaults`, not from anyone typing. `rpeDefaultVersion` was missing
   from the wire and from the explicit insert, so a coach changing the reps would
   have silently reclassified an inherited default as no default. Migration
   `20260902150000` closes it; the editor carries both fields per row without
   showing them.
3. **The form complains in words, before the database does.** Unmeasured piece,
   repetitions with no rep count, a recovery with no name, a band written
   backwards. Four sentences a coach can act on instead of a rejected save.

Verified in a harness against the real editor code: a three-piece session
round-trips unchanged, including the inherited RPE; editing marks it edited and
`repeat_target` follows `repeat_count`, which is what the database's
`components_target_is_the_count` constraint requires; switching a piece from
repetitions to continuous keeps its distance and band and drops the reps and
recovery a continuous piece cannot carry; add and remove shift the carried
provenance with the row. All four complaints fire.

Then end to end: the editor's exact JSON through the real `revise_session` on
production, inside a rolled-back transaction. Two typed components landed,
positions from array order, `6:30` / `6:45` derived from 390 / 405 — and
`structureOf` renders it back as **4 × 1 mi @ 6:30–6:45 / 3 min float**, or in
plain form *"4 × 1 mi at race pace, 3 min float between"*. Row counts unchanged
before and after.

### Still open

- **`main` is behind production.** Merging waits on one signed-in load of Labs,
  which is the one step I cannot perform.
- The ladder changes — 6 by week 4, 8 by week 6, 10 by week 9, 12 by week 11 —
  are now authorable through the form rather than through SQL.
