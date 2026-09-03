# The schema keeps arriving ahead of the surfaces

One deliberate pass, 2 September, prompted by four instances found the expensive
way — each one by someone trying to do real work and hitting a wall.

**Method.** Two questions, asked of the live database rather than the repo.
Which tables and columns can no surface write? And which guards assume rows that
do not exist? "Surface" means reachable by an authenticated client: a direct
write in `private/*.js`, or a function granted `execute` to `authenticated`.
Rows written by a migration do not count — that is SQL, not a surface.

---

## 1. Nineteen tables no surface can write

56 tables. 39 are reachable. These are not:

**Deliberately closed, no action:** `field_groups`, `field_access_log` — the
Field relay is closed on purpose. `effort_defaults` is configuration.

**The container of everything:** `athletes`, `training_blocks`,
`training_weeks`. An athlete cannot be created or edited from any surface, and
neither can a block or a week. The component editor made *sessions* authorable
this afternoon; the thing a session lives inside is still SQL. Authoring a new
campaign is still a migration.

**Whole coaching primitives with no door:**

| Table | What is unreachable |
|---|---|
| `athlete_baselines` | intake — history, longest run, constraints, strength schedule |
| `support_prescriptions`, `support_items` | the entire strength prescription |
| `movement_reads` | the five movement markers, their state and cue |
| `mark_gate_conditions`, `mark_signals` | two of the four parts of a mark |
| `planned_session_moves` | the record of a session moving date — Hope's 12-miler is in there, put there by SQL |
| `decision_completions` | a decision naming the evidence it rests on |
| `coach_task_actions`, `coach_task_evidence` | the options and evidence on a task |
| `coach_admin_status` | administrator state |
| `mark_confidence_proposals`, `mark_confidence_proposal_supersessions` | what confidence.v1 proposes |

`decision_completions` is the one worth noticing. `read_completions` has a
writer, `mark_judgment_completions` has a writer — a read and a judgment can
both name their evidence. A decision cannot. Three tables built to the same
pattern and one of them was never wired.

## 2. The same thing happened inside today's work

`athletes.portrait_path` was added this morning, the bucket is live, four
policies are in place, and **nothing can set the pointer.** `athletes` is one of
the nineteen. Uploading a portrait would put a file in storage that no row
refers to.

The migration is not wrong and the bucket is not wasted. It is one more instance
of the same crack, produced this afternoon by the same habit — write the schema,
reach the surface later — and it is the reason this pass is worth doing before
more Labs surface rather than after.

## 3. Six columns on `session_completions` have never held a value

In 5 filings: `recovered_next_day`, `strava_url`, `conditions`, `temperature_f`,
`evidence_id`, `symptoms`. Two of those need separating from the others.

**`symptoms` is writable, but only through the door that has never opened.**
`record_session_from_form` — the app door — writes it. `file_session`, the coach
door, does not, and neither does `correct_session`. So a symptom the athlete
reports in FORM has a home, and a symptom the coach hears about has nowhere to
go except prose in `athlete_note`. The column is empty because the only path to
it is behind Gate A. That is a sharper diagnosis than "no surface writes it", and
it means the fix is one column on the coach door, not a new primitive.

**`recovered_next_day` is written by neither filing door** — and
`coach_attention` unions a whole attention kind, `recovery_flag`, off
`recovered_next_day = false`. A queue item that can never fire, because nothing
on the coaching path can set the column it reads. The athlete web door can set
it; nobody has used that door either.

That is the pattern reaching a *derived* surface. The view believes in a column
that the writers do not fill, and it fails silently by producing nothing.

## 4. The guard side, which is the same crack from the other face

One instance found and fixed today: `write_session_version` required a non-blank
intent while 284 of 329 versions have none, making 86% of the block unrevisable
and pushing a coach toward typing filler that would reach the athlete's phone.
Fixed in `20260902160000` — blank means unchanged.

No other guard of that shape was found in the reachable functions. The place to
keep looking is any new `raise exception` on a field that legacy rows are allowed
to leave empty; the test is always the same one question, asked of the rows
rather than the schema: **how many existing rows would this refuse?**

---

## What one pass should close, in order

1. **`athletes.portrait_path`.** Smallest, and it unblocks the design. A portrait
   upload with no pointer is a file nobody can find.
2. **`recovered_next_day` on the coach door**, which switches on an attention kind
   that has never been able to fire.
3. **`symptoms` on the coach door**, so a symptom heard in conversation files
   where a symptom reported in the app files.
4. **`planned_sessions.state`** — a cancel with a reason. The block draws
   cancelled sessions and only SQL can produce one.
5. **`decision_completions`**, so a decision can name its evidence the way a read
   and a judgment already can.
6. **`training_blocks` and `training_weeks`**, which is the larger job: authoring
   a campaign without a migration.

`athlete_baselines`, `support_*`, `movement_reads` and the mark's gate conditions
and signals are each a surface of their own and belong to whatever screen is
built to hold them, not to this pass.

---

## The pattern itself

Every one of these was written correctly. The schema is not wrong anywhere in
this list — it is ahead. The columns, the constraints and the policies describe a
system more complete than the one that can be operated, and the gap only becomes
visible when someone tries to do the work and finds there is no door.

Which means the audit that catches it is not a schema review. It is this one:
**for every column the schema believes in, name the surface that writes it.**
