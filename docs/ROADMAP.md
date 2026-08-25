# ROADMAP

What is left to build, in the order that unblocks the most. Each step says what it
is for and what would prove it worked.

Companion documents: `FORM_MASTER.md` (the system), `ATHLETE_COACHING_SYSTEM.md` and
`VOICE_LAW.md` (the rules), `EVIDENCE_INFOGRAPHIC_BRIEF.md` (out for design input).

---

## The thing that unblocks the rest

Almost everything below waits on one piece of work: **reps and floats have to become
structured data.**

Today a session stores `rep_paces` as the string `"6:31 · 6:28 · 6:30 · 6:27"`. A
string cannot answer *did every mile sit inside the band*, and that question is the
gate on three separate things:

- the site cannot mark which rep missed, only colour the whole line;
- the app's race-pace progression is explicitly parked on it — `progression: .none`,
  because "distance-rep pace evidence can't classify every mile yet";
- and no verdict about a session can be computed, only typed by hand.

So step 1 is not a feature. It is the foundation the next four steps stand on.

---

## 1 · Structured reps and floats

Each rep and each float becomes a row: distance, duration, pace, and which band it
was measured against. The formatted string becomes a rendering of the rows, not the
record.

Also captures what the current model cannot: surface and conditions, which are the
decisive evidence for Marcus and cannot be inferred.

**Proof:** Hope's session can answer "which miles were inside 6:30 to 6:45" without a
human reading it. The answer is none of them, and the system can say so.

## 2 · The three verdicts

With rows in place, a session resolves on three axes rather than one:

- **Pace** — every rep inside the band, or not.
- **Float** — recoveries honest, or run as rest.
- **Effort** — logged RPE inside the prescribed band, or not.

A session that nails the pace at RPE 9 against a prescribed 7 to 8 resolves **outside**
on effort while inside on pace. That is the whole idea from the Hope conversation, made
mechanical: the correction stops being a text message after the fact.

**A verdict is computed against the band that was prescribed at the time**, never the
current one. Session versions are append-only for exactly this reason: the 6:30 to
6:45 band was set after 2026-08-25, and judging that session by it would be marking an
athlete against an instruction she was never given. The verdict reads the version that
was current when the session was filed.

This is not hypothetical. Measured against the new band, Jose's "best session to date"
comes back 2 of 4 reps inside, because 6:27 and 6:28 are faster than 6:30. Against the
band he was actually given that morning, 6:25 to 6:30, it is clean. Same numbers,
opposite reading.

Two rules that must survive implementation:
- **RPE is never a score.** It locates how a session felt against intent. Nobody wins
  by hitting exactly an 8, and it is never comparable between athletes.
- **A verdict states, it never grades.** "Asked for 7 to 8, felt like 9" is a fact.

**Done.** `public.session_verdicts` resolves all three. The float rule needed no
invented number: the athlete's own warm-up and cool-down define what easy means for
them that day, which is Brice's own standard said about Jose, *"the floats were
basically your warm up / easy pace, that's a really great sign."* A float more than
45 s/mi slower than that is rest. Jose's sat within 14 s; Hope's were 73 to 204 s
slower.

| | Reps | Pace | Floats | Effort |
|---|---|---|---|---|
| Hope | 0 of 4 | not prescribed | **0 of 3 honest** | **9 vs 7–8 · outside** |
| Jose | 0 of 4 | not prescribed | 3 of 3 honest | 8 vs 7–8 · inside |

Two findings fell out of building it.

**Pace resolves to "not prescribed" for both, and that is correct.** The record did
not carry a pace band that morning; 6:25 to 6:30 lived in Brice's texts. That is the
guardrail gap he identified, now visible in the data rather than in his memory of it.
The fix is not to backdate the band, it is to prescribe into the record going forward,
which the block now does.

**The append-only rule refused to let me fix it the easy way.** Backdating the version
that carried the real band would have made the verdict come out, and the trigger
blocked it. A system that lets history be adjusted so a verdict reads better is worth
nothing. The view falls back to the *original* version when none predates filing,
never the newest, because falling back to the newest is the retroactive-band trap
wearing a different hat.

## 3 · Key-session entry — DONE (2026-08-28)

Authoring, revising, and filing all happen from the desk. The `…` menu carries
**Add a session** and **File a run**; a session card carries revise and file.

The blocker was never the form. `planned_sessions` and `planned_session_versions`
carried read policies and **no write policies**, and the only completions insert
policy demanded `source = 'athlete'`. The browser was never permitted to author,
which is why every Tuesday cost a migration.
`20260828120000_coach_authoring.sql` opens those three doors and no others.

A revision appends a version. It cannot overwrite one: the immutability trigger
rejects updates, which is what kept the band Jose's verdict was judged against
intact when the band later moved.

## 4 · Unpark the app's progression

`half.familiar.racePaceMiles` carries `progression: .none` with the reason written in:
*"intentionally non-auto-progressing until distance-rep pace evidence can classify
every mile; variety must never manufacture an earned advance."*

Steps 1 and 2 produce exactly that evidence. This step consumes it, so the ladder
advances on proof rather than on a coach remembering. The guard in that comment stays:
an advance must be earned, never manufactured.

**Proof:** a clean rung at 6 miles advances the ladder to 8. A rung run at RPE 9 with
compressed floats does not advance anything.

## 5 · Gate A — close the seam

**Corrected 2026-08-28 after reading both codebases. The earlier description of
this step was wrong in three ways.**

It is not two records of one plan that might drift. They are **two different
Supabase projects**: the site is `pbgsjjegycacodiltbhn`, the app points at
`zlhxvzgublgtuxplcjjl`, which is paused. Separate databases, separate auth.

**The Forge bridge is not the mechanism.** Forge is a standalone app now and was
never used with these athletes. Everything Forge is sealed inside `FORM/Forge/`;
the Plan, Ledger, and Today surfaces never touch it. Rewiring it buys nothing.
The running side gets its own client instead.

**And the app's training record never leaves the phone.** Filed sessions live in
`FORM/Ledger/` and iCloud KVS. No table anywhere holds what an athlete actually
ran in the app.

So the seam is three jobs:

**5a — the running side gets a Supabase client** pointed at the live project,
reusing the deep-link token pattern rather than the Forge bridge itself.

**5b — the app files completions** to `session_completions` with `session_pieces`
for splits, in the shape step 3 already writes. A run logged on her phone appears
on the desk.

**5c — Postgres supplies the prescription; the app keeps composing the coaching.**
Not "the app reads its plan from Postgres." `planned_session_versions` holds a
prescription: title, distance, intent, details. `FORMDayPlan` holds a coached day:
purpose, what to watch for, what to fix, the evidence question, typed V3 work,
ghost overlays. Twenty-five fields of authorship that do not belong in a web form
and should not be rebuilt there. The site supplies what is prescribed; the app's
doctrine engine keeps composing everything around it.

**Order matters: 3 before 5c.** The entry form's fields *are* the contract for
what the app can receive. Building 5c first would mean guessing at that contract
and paying for it twice.

**Proof:** a session filed in FORM appears on the website under the right athlete,
and a Tuesday authored on the desk appears on her phone.

## 6 · Effort travels with the session in the app

A prescribed RPE band goes out with the session and the athlete logs effort at file
time. This is where the guardrail lands on the athlete's phone at the moment it
matters, instead of arriving as a text the next morning.

**Proof:** an athlete filing RPE 9 against 7 to 8 sees the excess stated as they file.

---

## Brice's manual items — ALL DONE (2026-08-25)

| | | |
|---|---|---|
| A | Sign in with Apple | Services ID `com.speedandform.web`, Team `L5VBZ7L4U2`, Key `CQ9529MR2K`. Supabase reports `apple` enabled; the doorway detects it with no deploy. |
| B | Custom SMTP | Resend on `send.speedandform.com`, 30 emails/hour. |
| C | Natalie's invite | `natalie.ramirez03@gmail.com`, claims on first verified sign-in. |
| D | Netlify deploy previews | Off. Only pushes to `main` cost a build. |

**One date to keep: 2027-02-24.** The Apple client secret is a JWT and Apple caps
it at six months. When it lapses, web sign-in stops with no warning. The signing
key is in `keys/` (gitignored, because `publish = "."` makes the repo root the web
root) and regenerating is one command:

```
node scripts/apple-client-secret.mjs keys/AuthKey_CQ9529MR2K.p8 | pbcopy
```

## Not now

Cross-app sync beyond Gate A · payments · notifications · video analysis ·
strength-coach login · anything that turns RPE into a leaderboard, streak or score.

## Working agreement

Local first: `python3 -m http.server 8000` from the repo root, port 8000 because that
is what the Supabase redirect allowlist carries. Review locally, then decide whether
to publish. **No Netlify deploys without asking**; they cost credits.
