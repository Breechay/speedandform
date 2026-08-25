# BRIEF — Natalie's athlete page

A self-contained prompt for outside design input. Everything needed is below;
assume no other context. **Read the constraints before proposing anything** —
they were paid for in about thirty rounds of review, and proposals that violate
them get discarded unread.

---

## The situation

Brice coaches runners. speedandform.com carries a private coaching product.
**Natalie is his one paying client** — she bought eight weeks, which he told her
is a *training block*. This is Block 1.

- **Her goal, her words:** finish the Miami Half Marathon. Not a time. Finish.
- **Race:** January 31, 2027. Currently ~23 weeks out.
- **Block:** 8 weeks, three runs a week, ending well before the race — so it is
  base, not build.
- **Her body:** left knee noticeable on stairs. She was running three weeks
  before the block, longest run 3 miles.
- **She has a separate strength coach.** Brice owns how she moves; the other
  coach builds the tissue.
- **Her mark:** longest continuous run, 3 → 13.1 miles.
  Ladder: 3 · 5 · 6 · 8 · 10 · 12 · 13.1.
- **Her week:** Tuesday long, Thursday support + stairs, Sunday track. Volume
  climbs inside Tuesday only; frequency stays at three.

She signs in with a magic link Brice sends her. She reads the page on a phone.
She files her own sessions on it: completed / partial / changed / skipped,
distance, time, how it felt, knee during, knee after, normal by next day,
optional note.

## What the page is for

**Governing idea: the page is not a portal, it is a screenshot she is proud to
send.** It travels because of how it treats her. She should open it and know,
within seconds and without reading an essay:

1. What am I doing this week
2. What is this building toward
3. What is coming next
4. What is Brice watching in how I move

Brice sees the same page in the middle of his coach desk, so anything proposed
must work for both readers.

## What exists today (live)

One column, in this order:

1. **Header** — her name; "Finish the Miami Half Marathon"; the date; weeks out.
2. **The week** — "Block 1 · Run Development", "Week 1" with quiet ‹ › arrows and
   "of 8"; a shape line: `3 runs · 10 mi · 4 longest`; one short intent sentence
   from Brice; then one **cube per session**. A cube holds day, distance, session
   name, and the instructions for those miles. Brice writes instructions into a
   cube; she taps a cube to file it. Days with no session are not shown.
3. **The mark** — big current figure, then a milestone ladder with reached
   points filled and the next one ringed.
4. **History** — a column of dated events.
5. **Support** — collapsed. It is a prescription for her strength coach.
6. **Account** — passwordless, so there is no password; email change and sign out.

## Binding constraints

### Visual — "Graphite"

- Field `#141718` · surface `#1D2123` · raised `#282D30` · edge `#3B4346`
- Text `#F1F2EF` · secondary `#A8B0B2` · muted `#7F898C`
- **Lime `#D8FF68` means the current action or acknowledgement required.** Never
  decoration. Coral `#FF8A70` is attention. Green `#76D3A4` is established.
- **High-contrast sans (Inter). Serif appears only on the FORM wordmark.**
- **Explicitly rejected: cream/ivory palettes, Fraunces, JetBrains Mono, mono
  labels, archival rulers, oversized serif prose.** An earlier proposal to move
  to that system was discarded. Do not re-propose it.
- One flat field. **No cards, no boxes inside boxes, no panels with fills.**
  Hierarchy comes from space, scale and weight. A rule is drawn only at a real
  boundary — rules used *as* hierarchy are as lazy as boxes.
- Motion says the record advanced. It never decorates.

### Voice

- **Silence beats filler.** If there is no earned, plainspoken sentence, write
  nothing. An empty region is correct.
- **Only Brice writes coaching.** No seed, placeholder or default ever writes in
  his voice. Fabricated coaching content was shipped once and retracted.
- **No definite article over an abstract noun.** "The mark", "The read", "The
  record", "The work" are all banned — they name a concept while the thing is
  already on screen.
- No header that explains its own section. No copy that must be decoded.
- Acts are verbs, never object names. "Respond", not "Write the Read".
- **Nothing demands anything on arrival.** A standing call-to-action that fires
  every time a surface opens is nagging.
- No robot speak, no corporate register, nothing impersonal.

### Structural

- Graspable in seconds. **Any fact that can be a shape must be a shape** — a
  number, a bar, a ladder, a position — not a paragraph describing the same fact.
- One phone screen should hold most of it. Endless scroll is failure.
- **No scores, streaks, badges, leaderboards, or a universal athlete number.**
- Nothing that belongs to someone else sits in her way.

## Already rejected — do not propose again

Cream/serif palette · cards and nested panels · rules used as hierarchy ·
headline + CTA on arrival · "The mark / The read / The record" · explanatory
subtitles under headings · a bar chart of three sessions across seven days ·
empty day cells for days with no session · coloured dots whose meaning must be
learned · week-number slabs that look like buttons · progress framed as "3.0 of
10.0 mi filed" as the opening line.

## What we actually want ideas on

1. **Movement — the open problem.** Brice grades four cues on how she runs:
   *heel light · chest proud · wrist to hip · single leg*, each in one of three
   states: **holds · holds until tired · not yet**. "Holds until tired" is the
   valuable one — it explains why the support work exists without a paragraph.
   There is a rule: single leg reading *not yet* means the next distance holds
   instead of climbing. Two attempts at displaying this have been rejected as
   boring and unclear, and it is currently removed from the page. **What is the
   right way to show a four-cue, three-state evaluation that a runner
   understands instantly and a coach can update weekly?**
2. **What would make her want to open it, and want to send it to someone?**
3. **The instruction layer.** Each session cube holds how to run those miles.
   What belongs there, and how much, before it becomes an essay?
4. **The relationship between the week and the mark.** Right now they are
   stacked. Is there a form where the week visibly feeds the ladder?
5. **The eight weeks.** Only the current week is shown, with arrows. Should the
   block be visible as a whole, and if so, how — without becoming a calendar?
6. **Between sessions.** She trains three days a week. The page says nothing on
   the other four. Is that correct restraint, or a missed opportunity?

## What a good answer looks like

- Specific. Describe the actual layout, wording and behaviour, not a philosophy.
- Working inside the constraints above, not around them.
- Willing to say what to remove. Most proposals should subtract.
- Honest about trade-offs, and about anything you think is wrong above — argued,
  not asserted.
