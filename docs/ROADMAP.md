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

Two rules that must survive implementation:
- **RPE is never a score.** It locates how a session felt against intent. Nobody wins
  by hitting exactly an 8, and it is never comparable between athletes.
- **A verdict states, it never grades.** "Asked for 7 to 8, felt like 9" is a fact.

**Proof:** Hope's 2026-08-25 renders outside on effort and float, inside on nothing.
Jose's renders inside on all three. Neither needed a sentence typed by hand.

## 3 · Key-session entry

Brice files these himself from Garmin and Strava. Today that is a SQL migration. It
needs to be a form: distance, duration, per-rep splits, float paces, RPE, surface,
conditions, and his sentence.

**Proof:** a session is entered in under a minute without touching the database.

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

Right now the app holds the ladder and the site holds the plan. **Two records of the
same thing, and they will drift the first time one changes.** That is the seam.

`FORM/Forge/ForgeSupabaseBridge.swift` is 298 lines and already does the whole
mechanism: Keychain token storage, a `form://forge-auth?access_token=` deep link that
carries a session from web to app after an invite, and offline enqueue/flush queues.

**Gate A does not need Sign in with Apple inside FORM.** The athlete signs in on the
website and the app receives the token by deep link, exactly as FORGE already does in
production.

**Proof:** a session filed in FORM appears on the website under the right athlete, and
the plan exists in one place rather than two.

## 6 · Effort travels with the session in the app

A prescribed RPE band goes out with the session and the athlete logs effort at file
time. This is where the guardrail lands on the athlete's phone at the moment it
matters, instead of arriving as a text the next morning.

**Proof:** an athlete filing RPE 9 against 7 to 8 sees the excess stated as they file.

---

## Brice's manual items

Not code, and each one blocks something. Worth doing in a window with energy for it,
since they are all account plumbing.

| | What | What it unblocks |
|---|---|---|
| **A** | Apple provider credentials in Supabase (Services ID, Team ID, Key ID, private key) | The doorway becomes Apple-only on its own. Email is the fallback until then, so nothing is broken meanwhile. |
| **B** | Custom SMTP, verified on a **subdomain** | Sign-in emails at scale, and the Graphite email template. Supabase's built-in mailer caps at a handful an hour, which four athletes signing in will hit. Verify on `send.speedandform.com`; a root SPF change breaks your Cloudflare inbound routing. |
| **C** | Natalie's athlete invite | Her page has never been seen by a signed-in athlete. Every existing invite is a claimed coach invite of yours. |
| **D** | Netlify billing | Production deploys. Local development does not need it. |

None of these block steps 1 to 4. **B** is the real one — it is the difference between
a demo and four people actually using this.

---

## Not now

Cross-app sync beyond Gate A · payments · notifications · video analysis ·
strength-coach login · anything that turns RPE into a leaderboard, streak or score.

## Working agreement

Local first: `python3 -m http.server 8000` from the repo root, port 8000 because that
is what the Supabase redirect allowlist carries. Review locally, then decide whether
to publish. **No Netlify deploys without asking**; they cost credits.
