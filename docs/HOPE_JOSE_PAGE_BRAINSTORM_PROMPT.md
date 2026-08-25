# BRIEF — the page for Hope, Jose and Marcus

Self-contained. Assume no other context. **Read the constraints before proposing
anything** — they were paid for over many rounds of review, and proposals that
violate them get discarded unread.

---

## Why this is not Natalie's page

Brice coaches four runners. Natalie's page already exists and works: she opens it to
know what she is doing this week, and she files her own sessions on it.

**These three are a different product.** Their plan lives in the FORM iOS app, not
here. **Brice files their key sessions himself**, from their Garmin and Strava, because
he is the one studying their patterns. So this page is not "their plan, viewable."

It is **where a hypothesis is tested**. Each athlete carries one claim that would make
all the difference for them, and the page's job is to answer: *is it working, and
what is the evidence?*

| Athlete | Hypothesis | What settles it |
|---|---|---|
| **Hope** | Threshold at 6:20–6:30 converts to a sustainable half at goal pace. | Goal-pace work held at RPE 7–8 with floats run as floats. Not rep splits. |
| **Jose** | Quality survives added load. | Two sessions in a day, second one unimpaired; float pace stays at easy pace. |
| **Marcus** | Treadmill ability is available outdoors when conditions change the cost. | Goal-pace miles closed **outdoors**, conditions stamped. A treadmill completion cannot answer it. |

Race for Hope and Jose: **OUC Half Marathon, Orlando, December 5 2026** — 15 weeks out.

## The session that shows what matters

Both ran 4×1 mi at race pace with 3-minute floats on the same morning.

| | Hope | Jose |
|---|---|---|
| Reps | 6:29 · 6:20 · 6:22 · 6:19 | 6:31 · 6:28 · 6:30 · 6:27 |
| Floats | 3:00, run hard | 8:14 · 8:30 · 8:26 |
| Prescribed RPE | 7–8 | 7–8 |
| Logged RPE | **9** | **8** |
| Brice's verdict | "6:19 is too fast, recovered a bit too much" | "easily your best session to date" |

**Jose's reps are slower and his session is the better one.** The evidence is the
float pace and the effort, not the splits. His floats came back at easy pace, which
is the whole signal.

Hope's session is **confounded**: fast reps, but compressed floats and RPE 9 against
a 7–8 prescription. It does not tell you what her intended stimulus looks like, so it
is not evidence for her goal. Three weeks later a fast session and a good session look
identical unless the page says otherwise.

**A design that ranks these two sessions by pace ranks them backwards.** That is the
central problem to solve.

## Who reads it

**Brice, mostly.** He opens it to see whether the claim advanced. He needs to spot a
confounded session without re-reading a Garmin screenshot.

**The athlete, sometimes.** He may send it or they may sign in. It must not read as
surveillance or as a report card. Same voice and material as Natalie's page.

## What exists to build from

Live on Natalie's page, reusable: a header (name, goal, race date, weeks out); a week
of session cubes holding the instructions; a **ladder** of milestones with the reached
ones filled and the next one ringed; a movement read of four cues in three states; a
history column. Stored per session: distance, duration, status, RPE, prescribed RPE
band, free-text note, plus how it felt and recovery.

Not stored yet, and worth saying if you need them: rep splits and float paces as
structured data (they currently live in the note), conditions, and surface.

## Binding constraints

### Visual — "Graphite"
Field `#141718` · surface `#1D2123` · raised `#282D30` · edge `#3B4346` · text
`#F1F2EF` · secondary `#A8B0B2` · muted `#7F898C`.
**Lime `#D8FF68` means the current action — never decoration, and never two places at
once in one composition.** Coral `#FF8A70` is attention. Green `#76D3A4` is
established. High-contrast sans; **serif only on the FORM wordmark**.
**Rejected outright: cream/ivory, Fraunces, JetBrains Mono, mono labels.**
One flat field — **no cards, no nested fills**. Hierarchy from space, scale and
weight; a rule only at a real boundary. Motion says the record advanced; never
decorates.

### Voice
**Silence beats filler** — an empty region is correct. **Only Brice writes coaching**;
no seed, default or generated sentence, ever (fabricated coaching shipped once and was
retracted). **No definite article over an abstract noun** — "The mark", "The read",
"The record" are banned. No header explaining its own section. Acts are verbs, not
object names. **Nothing demands anything on arrival.** No robot speak.

### Structural
Graspable in seconds. **Any fact that can be a shape is a shape.** One screen holds
most of it. **No scores, streaks, badges, leaderboards, or a universal athlete
number.** RPE especially must never become a number anyone chases.

## Already rejected — do not propose again

Cream/serif palette · cards and nested panels · rules used as hierarchy · headline +
CTA on arrival · explanatory subtitles · a bar chart of three sessions across seven
days · empty day cells · coloured dots whose meaning must be learned · icons or gauge
tracks for a three-state read · week-number slabs that look like buttons · a connecting
line drawn between two sections · tap-to-preview navigation on a progress strip ·
character-count truncation with tap-to-expand · rest-day filler copy.

## The questions

1. **How does a page show that a hypothesis advanced, stalled, or was confounded?**
   Three states, not two. "Confounded" is the one nothing on the market shows and the
   one Brice most needs.
2. **How is a session displayed so the float pace and the effort read louder than the
   rep splits?** Jose's slower session must look better than Hope's faster one, without
   a paragraph explaining why.
3. **Prescribed RPE 7–8 against a logged 9.** How is that stated so it reads as an
   honest fact rather than a failing grade — given the athlete may read it?
4. **Fifteen weeks to a race, with a phase structure** (consolidate → extend →
   race-specific → taper). What, if anything, should show — without becoming a calendar
   or exposing week 12 to someone in week 1?
5. **What does Marcus's page look like when the answer is "no evidence yet"?** He has
   a hypothesis that only an outdoor close can settle, and he has not run one. Most of
   the page has nothing to say. What does an honest empty state look like here?
6. **Brice files their sessions.** Does the page acknowledge that, and how — without
   it reading as surveillance to the athlete?

## What a good answer looks like

Specific: actual layout, wording and behaviour, not philosophy. Inside the constraints
rather than around them. Willing to say what to remove — most proposals should
subtract. Honest about trade-offs, and about anything above you think is wrong, argued
rather than asserted.
