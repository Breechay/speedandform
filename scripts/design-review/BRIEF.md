# FORM Labs — what this is, where it goes, what is hard

Written for a designer opening this package cold. Everything here is true as of
5 September 2026. Nothing in it is aspiration dressed as fact; where something
is unbuilt it says so.

---

## 1. The one-paragraph version

Brice coaches distance runners. FORM Labs is the surface he coaches *from* — not
a dashboard that reports on training, but the instrument where he reads what an
athlete has actually established, decides what to ask of them next, and hands
that to them in a form they can run without deciphering. The screen you are
looking at is a real coach's real five athletes, mid-block, seven weeks from a
half marathon. The design problem is not "make training data look good." It is:
**what should a coach see, and what should an athlete be given, so that the work
is obvious and the reasoning is honest?**

## 2. The idea the whole thing is built on

Most training software tells an athlete what to do today and how much they did.
FORM is built on a different claim: an athlete does not have a number, they have
a **question**, and the plan exists to answer it.

José's question is on every screen in this package:

> **How far can you hold 6:30–6:45 without it coming apart?**

Underneath it are two facts and nothing else:

- **`2 MI YOU OWN`** — the longest single uninterrupted piece he has actually run
  at that pace, on the record, filed.
- **`NEXT ASK · 5 MI`** — the next rung. Not a target, not a goal, not a
  projection. The next thing the block will ask him to prove.

Everything else on the surface exists to serve those three lines. That is the
editorial spine. A design decision that makes the week legible but buries the
question has made the product worse, however good it looks.

### Ownership is the hard idea, and it is frozen

The distinction the entire system turns on, and the one most likely to be
accidentally broken by a visual change:

- `3 × 2 mi` at race pace is **6 miles of race-pace volume** and
  **2 miles of continuous ownership.** It establishes 2. It never establishes 6.
- **Eligibility ≠ establishment.** A prescription's component declares what mark
  it can answer. Filed evidence decides what was answered. Pace alone never
  establishes anything.
- A cancelled session cannot establish. Its evidence remains historical fact.

**Lime means one thing: this can establish something.** `CAN ESTABLISH · 8 mi`,
the lime edge on Saturday, `MOVES → 8 MI`. It is not "highlight", not "important",
not a brand accent. If lime appears on something that cannot establish a mark,
the surface is lying. This constraint is not negotiable and is the single most
common way a design pass goes wrong here.

## 3. Notation over prose

Sessions are written in a compact grammar, not sentences:

```
WU 20 · 3 × 2 MI @ 6:30–6:45 / 3 MIN FLOAT · CD 10
→  progression      ×  repetitions      /  recovery
@  target           WU / CD  bookends   EASY  easy running
```

Prose is reserved for what notation cannot carry — perception, restraint,
technique. *"Settle at 6:45. Do not chase faster. Finish wanting another rep."*

Two standing voice laws: **silence beats filler**, and **the athlete must never
have to decipher the work.** If a line does not earn its place, it is deleted
rather than softened.

## 4. The three surfaces, and the two lenses

```
PLAN  ──▶  WEEK  ──▶  SESSION
15-week    seven      a drawer over the week:
matrix     days       anatomy, bands, filed evidence
```

One renderer draws all three, and one renderer draws them for **both** the coach
and the athlete. `viewAs` changes capabilities and peripheral coaching material.
It must never fork prescription rendering — verified byte-identical, and that
diff is the test if it is ever in doubt.

| | Coach | Athlete |
| --- | --- | --- |
| The prescription, anatomy, bands | ✓ | ✓ identical |
| Their own filed evidence and notes | ✓ | ✓ |
| Revise · File evidence | ✓ | — |
| Revision history, audit lines, refusal reasons | ✓ | — |
| Bench · Brief · Console · Photo Lab · private observations | ✓ | — |

The athlete's mode is **prescription read-only, not read-only**. They cannot
author or alter the work. Reporting back — RPE, a note, an answer to the week's
question, evidence — is a write this mode is expected to grow into. Do not design
the athlete view as a passive document.

The Coach/Athlete toggle is Brice's preview instrument. A signed-in athlete's
identity decides their lens; they never get a control offering them the coach's
eyes.

## 5. Where this is going

**Near.** The athlete surface ships to the phone and to speedandform.com at two
scales — `THIS WEEK` and `FULL PLAN`. The server already sends the mark and the
question; until recently it could not, and the question physically could not
reach an athlete. That gap is closed. The app build that consumes it has not
shipped.

**Then.** Athlete-owned reporting — the athlete answers the week's question, files
their own evidence, says what happened. This is what turns the athlete view from
a document into half of a conversation.

**Later, and this is the business.** *Race Pace Durability* is a **method**, and
José's and Hope's blocks are its first two instances. The method is the thing
that might eventually be sold; the blocks never are. A lesson learned on Hope
gets promoted to the next method version by a coach pressing a button — never
automatically, never retroactively. Filed history is append-only everywhere.

**The scaling question underneath all of it.** Brice coaches five athletes. The
surface has to hold at twenty without becoming a queue of alerts demanding
attention. That is a design problem long before it is an engineering one.

## 6. What is genuinely hard

These were the open problems when this brief was written. **Design pass V2
shipped on 5 September and closed 1, 2, 3, 5 and 6**; they are kept because the
reasoning still governs, and because a later pass that reopens one should know
what it is reopening. `SPEC_V2.md` describes what replaced them.

1. **The instrument is mostly empty and nobody has decided whether that is
   right.** At 1600px the week uses about 60% of the width. Some of that restraint
   is correct — this is not a dashboard, and cramming it would be a betrayal.
   But the current amount is where the layout landed, not where it was aimed.
   V1 removed the right rail to give the days the width, and the emptiness moved
   into the rows rather than leaving: every row is now 1440px wide holding text
   that ends at 1106.

2. **Uniform density in a non-uniform week.** A 9-mile easy Monday and a Saturday
   carrying anatomy, a band and a rung occupy rows of almost identical presence.
   The shape of the week lives in the content and not yet in the layout. Making
   Saturday louder is easy; making it louder *without* turning the week into a
   dashboard of importance-ranked cards is the actual problem.

3. **Today is marked but not felt.** It gets a chip and a border tint. A coach
   scanning should land on it without looking for it.

4. **Two lenses, one product.** The athlete must not get a lesser version and must
   not get a different one. The temptation to make the athlete view "friendlier"
   is exactly the failure mode — it would fork the renderer and drift within a
   fortnight.

5. **Phone is where this actually gets used, and it is the least resolved.**
   Portrait works; landscape has almost no vertical room and the hero and the
   summary both want it. V1's landscape composition is the most interesting idea
   in the pass and also the one that broke — see `FINDINGS_V1.md`.

6. **Five facts of different weight, drawn identically.** `TOTAL`, `EASY`,
   `KEY SESSIONS`, `LONGEST DAY`, `CAN ESTABLISH` are a five-cell strip. Only the
   lime distinguishes the one that carries the block's whole argument.

## 7. Rulings — settled, do not reopen

Litigated already; a pass that reintroduces one will be rejected.

- No sidebar duplication of the day grid.
- No fabricated week intent. A week gets an authored question only when the
  coaching argument changes; most weeks correctly have none.
- No percent-progress bar. No empty weekly-note box.
- No serif inside session content. Newsreader is for identity and the question.
- Lime means *this can establish something*, and nothing else.
- The prescription renders identically for coach and athlete.
- Never expose authorship mechanics to the athlete — including refusal reasons
  like *"Filed — history is not revised"*, which answer a question they were
  never asked.

## 8. What is real in here, and what is not

**Real:** five athletes, their blocks, weeks, sessions, prescription components,
pace bands, marks, checkpoints, filed completions and splits — production data in
the exact shape the signed-in surface receives. José's Tuesday in week 2 is the
Tuesday he ran, at the paces he ran it.

**Empty, because the plan dump does not carry them:** standing observations,
coach reads, directions, decisions, private notes. The visible consequence is
that the Week View's *What helps* rail never appears in this package.

**Deliberately unfinished, not defects:** Simon has one session — his eight-week
HYROX cycle is unauthored, and the surface correctly shows almost nothing rather
than inventing filler. Marcus and Natalie have no portraits. Week 2's easy days
are filed receipts rather than prescriptions, because they predate authored easy
days; weeks 3 onward carry the correct model.

**Impossible:** filing, revising, recording an observation and saving a portrait
all throw. A Revise button that appears to work and changes nothing is how a
design review ends up reviewing a lie.

## 9. How to work in here

`README.md` has routes, viewports and the run command. `COMPROMISES.md` is the
list of what was seen and deliberately left alone. `FINDINGS_V1.md` audits the
first design pass.

Edit `assets/css/labs.css` directly, or add `assets/css/design-<name>.css` and
load it with `?css=<name>` — layered on top, so your variant stays comparable to
production instead of forking from it.

Two things worth knowing before you trust a screenshot: **Chrome headless clamps
its layout viewport to 500px**, so a `--window-size=390` capture is a cropped
tablet unless it goes through `frame.html`; and the **`viewAs` state is not in the
URL** except via the package's own `?as=athlete`.

Change CSS. The renderer, the data and the routing are not yours to move — and
you should not need to. If a design decision requires markup that does not exist,
say so and it gets built properly rather than faked in the review copy.
