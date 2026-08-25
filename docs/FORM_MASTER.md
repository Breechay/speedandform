# FORM — MASTER

**One document.** Coaching system, product, research method, and build sequence for
both the app and the website. Written because the alternative was ten Signal Layer
files, an athlete brief, a voice law and a coaching-system doc, none of which could
be handed to an agent whole.

Companions that stay separate because they are *law*, not plan:
`VOICE_LAW.md` · `ATHLETE_COACHING_SYSTEM.md` · `design/GRAPHITE_ATHLETE_SYSTEM_REFERENCE.html`

Superseded as reading material: `ATHLETE_RECORD_BRIEF.md` §1–2 audit (re-audited
here), and the FORM-iOS `docs/FORM_SIGNAL_LAYER_*` suite (its ideas are folded in
below; the files remain as implementation history).

---

## PART I — HOW BRICE COACHES

Written from what he actually does, not from what a product would like to be true.

### The loop

**Plan → run → read → decide.** He gives the work, they do it, he reads how it went,
and that read decides whether the next thing opens. The read is the product. Anything
that automates it is building a different company.

### What he actually looks at

From the Hope and Jose sessions of 2026-08-25, both 4×1 mi at race pace with 3-minute
floats — the same session, two different truths:

| | Hope | Jose |
|---|---|---|
| Reps | 6:29 · 6:20 · 6:22 · 6:19 | 6:31 · 6:28 · 6:30 · 6:27 |
| Floats | 3:00, run hard | 8:14 · 8:30 · 8:26 |
| RPE | **9** | **8** |
| His verdict | "6:19 is too fast, recovered a bit too much" | "easily your best session to date" |

Jose's reps are *slower* and his session is the better one. The evidence is the
**float pace** and the **RPE**, not the rep splits. A product that ranks these
sessions by pace ranks them backwards.

His own words for why: *"we don't need to get faster, we need to make this feel
easy"* and *"how you feel matters probably more than how the workout was executed —
because we want it repeatable."*

### The corrections he makes by hand

Every one of these is currently a WhatsApp message, and every one is a candidate for
the product to state instead:

1. **Effort excess.** "Let's get more 8s in RPE, save the 9s and 10s for the
   sharpening phase." Hope hit the paces and beat them, at a cost he did not
   prescribe.
2. **Pace ceiling.** "Stay around 6:25–6:30 for your half pace." Faster is not better.
3. **Recovery discipline.** Floats run as floats. Jose's 8:14–8:30 floats are the
   thing that made his session good.
4. **Benchmark naming.** "This is a new benchmark and checkpoint. Add the 4×1 mi
   average and floats avg to your description."

### Standing coaching positions

- Frequency and repeatability over intensity. Make being an athlete ordinary.
- RPE 7–8 is the working range. 9s and 10s belong to sharpening and VO2max phases.
- A pace is a band, not a target to beat.
- Structure over motivation. Proof over encouragement.
- Silence when there is nothing earned to say.

---

## PART I.5 — THE APP IS NOT LAW

**Brice's coaching is the authority. The app is its current draft.**

`FORMV3Programming.swift` and the doctrine documents were written fast, at a high
level, before any of it had been run against real athletes over a real block. They
are a good first pass, not scripture. Where live coaching and the app disagree, the
app is behind.

So a difference between what Brice prescribes and what the app authored is **an
amendment, not a conflict**. The correct response is to update the app, the docs and
the rules to match the coaching, and to record why.

Two consequences worth stating, because both were nearly got wrong:

- **Do not treat an authored constraint as binding just because it is written down.**
  The "hard-day budget is TWO (Settle + Long) at every frequency" line reads like
  doctrine and is not: it was generated, never Brice's, and his athletes train three
  quality days. A rule with no coach behind it is a draft with confidence.
- **Live athlete data is what promotes a draft into doctrine.** Working through these
  three athletes in detail is how the app gets specific. Building the presentation
  surface is part of that: designing how a session must read forces the question of
  what the session actually is.

When amending, say what changed and what the evidence was. The record of *why* the
app moved is worth as much as the move.

---

## PART II — THE RESEARCH FRAME

He is not running a training log. He is testing whether a small number of specific
claims are true, per athlete, with evidence he can point at.

### The rule

**Every athlete carries one live hypothesis.** It is the thing that would make all
the difference for them. It is falsifiable, it has named evidence, and it either
advanced this week or it did not.

This is the honest version of what the record is already half doing: the mark, the
current question and the movement read are all evidence about one claim.

### The four, as of 2026-08-25

| Athlete | Hypothesis | Evidence that settles it | Status |
|---|---|---|---|
| **Natalie** | Distance can be added without changing how she moves. | Knee quiet during and after · normal by next day · single-leg control holds at the end · easy still genuinely easy. All four, not any one. | Live · single leg not yet |
| **Hope** | Threshold at 6:20–6:30 converts to a sustainable half at goal pace. | Goal-pace work held at RPE 7–8 with floats run as floats. Not rep splits. | **Confounded** — see below |
| **Jose** | Quality survives added load. | Two sessions in a day, second session unimpaired; float pace stays at easy pace. | Live · supported 2026-08-25 |
| **Marcus** | Treadmill ability is available outdoors when conditions change the cost. | Goal-pace miles closed **outdoors**, conditions stamped. A treadmill completion cannot answer it. | Live · no outdoor close yet |

### Whose failure a session was

A session that cannot be read has two very different causes, and only one of them
belongs to the athlete:

- **execution** — the athlete deviated from what was asked;
- **prescription** — the work was left too loose to produce a readable answer.

Hope's 2026-08-25 is the second. Brice's read: she is in better shape than the
session showed, and it went the way it did because there were no guardrails on it,
not because she is behind. So she progresses to 6–8 miles at race pace alongside
Jose rather than repeating the session.

Recording which cause applies is the point. If sessions keep coming back unreadable
because of the prescription, that is a pattern in the prescribing — the kind of thing
only a record can show, and the kind of thing a coach cannot see from inside it.

### Hope's session is confounded, and that matters

Her reps were fast, but the floats were compressed and she logged RPE 9 against a
7–8 prescription. So the session does not tell you what her intended stimulus looks
like — the reps may be faster than her control state supports.

**It is not evidence for the goal change.** The threshold history is; this session
is not. All three athletes are now going for sub-1:30. The next block has to isolate the variable: same structure, floats run as
floats, and see whether goal pace sits at RPE 7–8 with real recovery.

Recording that distinction is the entire reason the research frame exists. Without
it, a fast session and a good session look identical three weeks later.

### Open question for Brice

Hope's goal is recorded as **sub-1:30** (his stated adjustment). Jose reported her as
going for **1:35**, and himself for **1:25** while the record says sub-1:30 for both.
Two of the three numbers cannot be right. Unresolved on purpose — goals are his.

---

## PART III — THE IDEA THIS SESSION PRODUCED

### RPE as a coordinate, not a decoration

Pace already resolves against a band: inside, outside, or unmeasurable. Effort does
not resolve against anything, so an athlete can hit the pace, beat it, and "succeed"
by the only thing the system checks — which is exactly what happened to Hope.

**The proposal:** a session carries a prescribed effort band. The athlete logs actual
effort. The verdict considers both. Nailing the pace at RPE 9 against a prescribed
7–8 resolves **outside**, not inside.

Not punitive. Honest — the same spine as everywhere else: no partial credit, and
athlete input is never silently smoothed away.

It also moves the correction from Brice's thumbs into the product. He is currently
the correction mechanism, texting "let's get more 8s" after the fact.

**The trap:** RPE must never become a number athletes chase. Nobody wins by hitting
exactly an 8. It locates how the session felt relative to intent; it scores nothing.

**Already built:** `session_completions.rpe`, `planned_session_versions.rpe_low/high`
(migration `20260826140000`). Stored, not yet judged — the verdict is Part V.

---

## PART IV — WHAT THE SURFACES ARE FOR

| | Natalie | Hope · Jose · Marcus |
|---|---|---|
| Home | The website | FORM |
| Plan source | `coach_authored` | `form_program` |
| Who files | She does | **Brice does**, from Garmin and Strava |
| The website is | Her whole product | His research surface on them |

That last row is new and it changes the athlete page. For the three FORM athletes the
page is not "her plan, viewable" — it is **where a hypothesis is tested**, and Brice
is both author and filer. It should show whether the claim advanced, not whether the
week was completed.

Their pages therefore need a different top than Natalie's. Hers answers *what am I
doing*. Theirs answers *is this working, and what is the evidence*.

---

## PART V — SEQUENCE

Ordered by what unblocks the next thing. Each step states what would prove it worked.

### 1 · Effort verdict (website, small)
Show prescribed band against logged RPE on a filed session, and resolve it —
inside / outside / not prescribed. Nothing else changes.
*Proof: Hope's 2026-08-25 renders outside on effort while inside on pace.*

### 2 · Hope, Jose and Marcus's page (website, design)
A page built around the hypothesis rather than the week. See the agent prompt in
`HOPE_JOSE_PAGE_BRAINSTORM_PROMPT.md`.
*Proof: Brice can answer "is sub-1:30 real yet" from one screen.*

### 3 · Key-session entry (website, coach-facing)
He files their sessions from Garmin. Today that is a migration. It needs to be a
form: distance, duration, rep splits, float paces, RPE.
*Proof: he enters a session in under a minute without touching SQL.*

### 4 · Effort in the app (FORM-iOS, Gate A adjacent)
A prescribed RPE band travels with a session, and the athlete logs effort at file
time. This is where the correction stops being a text message.
*Proof: an athlete filing RPE 9 against 7–8 sees the excess stated at file time.*

### 5 · Gate A (FORM-iOS)
Identity and server-backed filing, reusing `ForgeSupabaseBridge` — 298 lines that
already do Keychain tokens, the `form://forge-auth` deep link, and offline queues.
**Gate A does not need Sign in with Apple in FORM.** The athlete signs in on the
website and the app receives the token by deep link, as FORGE already does.
*Proof: a session filed in FORM appears on the website under the right athlete.*

### 6 · The Field, read-only (optional)
`POST /api/field/entries` already carries session name, type, splits and date to a
server. It is **unauthenticated** (group id, no JWT), it is what they chose to
publish rather than what they filed, and its identity is `form_apple_user_id`.
Show it clearly labelled; never write it into `session_completions`.

### Not now
Cross-app sync beyond Gate A · payments · notifications · video analysis ·
strength-coach login · any RPE leaderboard, streak or score.

---

## PART VI — STANDING CONSTRAINTS

Full text in `VOICE_LAW.md` and `ATHLETE_COACHING_SYSTEM.md`. The short version,
because most proposals die on these:

- **Only Brice writes coaching.** No seed, default or generated sentence, ever.
- **Silence beats filler.** An empty region is correct.
- Graphite is binding. Lime means current action, spent once per composition.
- No definite article over an abstract noun. No header that explains its section.
- Any fact that can be a shape is a shape.
- No scores, streaks, badges or leaderboards.
- Nothing demands anything simply because a surface opened.

## Working agreement

Local first. `python3 -m http.server 8000` from the repo root — port 8000 because
that is what the Supabase redirect allowlist carries. Review locally, then decide
whether to push. **No Netlify deploys without asking**; they cost credits.
