# BRIEF — make the evidence page visual

Self-contained. Assume no other context. Read the constraints before proposing
anything; proposals that violate them get discarded unread.

---

## What this page is

Brice coaches four runners. One of them, Natalie, has a plan and reads her own
page. **The other three have a claim under examination**, and Brice files their key
sessions himself from Garmin and Strava, because he is the one studying the patterns.

Their page is not a training log. It answers four questions, and it has to answer
them **in about a second**:

1. **Where are we?**
2. **Where are we going?**
3. **What do we need to work on?**
4. **How do we raise confidence that we get there?**

The current version answers them in words and it works, but it reads flat. What is
wanted is something **visual, dynamic, and immediately graspable** — an instrument,
not a paragraph.

## The three athletes

| | Hope | Jose | Marcus |
|---|---|---|---|
| Race | OUC Half, Orlando | OUC Half, Orlando | West Palm Beach Half |
| Date | Dec 5 2026 | Dec 5 2026 | Dec 13 2026 |
| Goal | ~1:30 (unsettled, see below) | 1:25 | 1:30 |
| What we are finding out | Whether she can hold 6:25–6:30 for the whole half | Whether he can go hard and still be fine for the next session | Whether the treadmill speed shows up outside |
| State | Can't tell yet | Working | Nothing to go on yet |

Hope's goal number is genuinely unresolved between 1:30 and 1:35. Do not design
around a number that may move.

## The session that defines the problem

Hope and Jose ran the same thing on 2026-08-25: **20 minutes easy, then 4 × 1 mile
with 3-minute recoveries, then a cool-down — continuous, no stopping.** The
continuity is the point; it is a durability session, not a rep session. The easy
portion will grow to 30–60 minutes in later weeks.

| | Hope | Jose |
|---|---|---|
| Miles | 6:29 · 6:20 · 6:22 · 6:19 | 6:31 · 6:28 · 6:30 · 6:27 |
| Recoveries | 3:00 each, run hard | 8:14 · 8:30 · 8:26 |
| Asked for | RPE 7–8 | RPE 7–8 |
| Felt like | **9** | **8** |
| Brice | "6:19 is too fast — recovered a bit too much." | "Easily your best session to date." |

**Jose's miles are slower and his session is the better one.** The evidence is the
recoveries and the effort, not the splits. Any design that ranks these by pace ranks
them backwards. That is the acceptance test: someone glancing at both must see Jose's
as the better session without reading a word of explanation.

Hope's cannot answer her question at all — fast miles bought by compressing the
recoveries. Not a bad session. An **unreadable** one. Those are different and the
design has to keep them different.

## The confidence question — read this before proposing one

Brice wants to see confidence rise. But there is a standing rule against scores,
streaks, badges and any universal athlete number, and it exists because a visible
number gets chased.

The resolution: **confidence belongs to the claim, not to the athlete.** "How sure
are we that 6:25–6:30 holds for 13.1 miles" is a statement about evidence. "Hope is
at 72%" is a grade. The first is honest; the second is the banned thing wearing a
new coat.

So any confidence treatment must:

- be **derived from named evidence** — which sessions, how recent, how close to race
  demand — and never from a feeling or a formula nobody can inspect;
- be able to **go down**, and visibly do so when a session comes back unreadable;
- **not move at all** on an unreadable session, because no news is not progress;
- never be framed as the athlete's number, and never be comparable between athletes.

If your answer is that a single confidence figure cannot be made honest, say so and
propose what replaces it. That is a legitimate answer.

## What exists to build on

Live and reusable: a header (name, race, date, weeks out); a **ladder** of milestones
with reached points filled and the next ringed; **areas of focus** as rating positions
opening onto the work that answers them; motion that settles content on arrival and
fills a bar toward its target.

Stored per session: distance, duration, status, **easy_minutes**, **continuous**,
**floats_easy**, **float_paces**, **rep_paces**, RPE logged, RPE band prescribed, and
Brice's own note. Per athlete: the claim, its state, and his sentence about it.

Not stored, worth asking for if needed: surface and conditions (decisive for Marcus),
and per-rep structured splits rather than a formatted string.

## Constraints

**Visual.** Field `#141718` · surface `#1D2123` · raised `#282D30` · edge `#3B4346` ·
text `#F1F2EF` · secondary `#A8B0B2` · muted `#7F898C`. **Lime `#D8FF68` is the
current action, spent once per composition** — never decoration, never two places at
once. Coral `#FF8A70` is attention. Green `#76D3A4` is established. High-contrast
sans; **serif only on the FORM wordmark**. One flat field: **no cards, no nested
fills, no panels**. Hierarchy from space, scale and weight; a rule only at a real
boundary.

**Motion is wanted here** — but it says the record advanced. It never celebrates, never
pulses, never rewards. It yields to `prefers-reduced-motion`.

**Voice — the hard one.** Brice is **presenting his athletes**, not reporting on them.
The claim is stated the way he would say it out loud — *"Our goal here is to see if
she can hold 6:25–6:30 for the whole half"* — never *"Can she hold 6:25–6:30?"*, which
reads as discussing her with a third party. First person plural throughout.

He writes like he texts. He does not say "advanced",
"stalled", "confounded", "consolidate", "held easy", "prescribed", "protocol" or
"stimulus". He says *"floats were trash"*, *"easily your best session to date"*,
*"6:19 is too fast, recovered a bit too much"*, *"we don't need to get faster, we need
to make this feel easy"*. **Write for a twelve-year-old.** Every coach term and every
science word is a defect, including in labels.

**Only Brice writes coaching.** No generated sentence, ever. The system can compute
facts; interpretation is his.

**Also binding:** silence beats filler · no definite article over an abstract noun
("The mark", "The read") · no header that explains its own section · nothing demands
anything on arrival · any fact that can be a shape is a shape.

## Already rejected — do not propose again

Cream/serif palettes · cards and nested panels · rules used as hierarchy · headline +
CTA on arrival · coloured dots or icons whose meaning must be learned · gauge tracks
for a three-state read · a bar chart of three sessions across seven days · connecting
lines drawn between two sections · tap-to-preview navigation on a progress strip ·
character-count truncation · rest-day filler · phase strips reading CONSOLIDATE →
EXTEND → RACE-SPECIFIC → TAPER · the words ADVANCED / STALLED / CONFOUNDED.

## The questions

1. **What is the one visual that answers "where are we and where are we going" at a
   glance?** It has to hold a 15-week runway, a race day, and a claim whose evidence is
   partial. Not a progress bar, not a percentage.
2. **How does a session render so the recoveries and the effort read louder than the
   mile splits** — visually, without a sentence?
3. **What does confidence look like** given the constraints above, and can a single
   figure be made honest at all?
4. **What does "what to work on" look like** when it is one thing, not a list?
5. **Marcus has no evidence.** His page should be uncomfortable in its emptiness
   without reading as failure or as a zero. What is the honest shape of nothing?
6. **Where does motion belong** so that it means something advanced rather than
   decorating a screen?

## What a good answer looks like

Specific: actual layout, wording, colour and behaviour — not a philosophy. Inside the
constraints rather than around them. Willing to say what to remove; most proposals
should subtract. Honest about trade-offs and about anything above you think is wrong,
argued rather than asserted. Plain English throughout, including in your own labels.
