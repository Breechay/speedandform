# VOICE LAW — the private coaching surfaces

Binding on speedandform.com's athlete record, Coach Desk, share card and every
future FORM coaching surface. Written after shipping four screens' worth of
breaches.

---

## 1. Silence beats filler

If there is no earned, plainspoken sentence to write, **write nothing**. An empty
region is correct. A reassuring line is not.

Removed under this law:

- "The mark is evidence, not a countdown."
- "All four. Repeating a distance is a decision, not a miss."
- "Write once. Publish clearly."
- "A prescription for the strength coach to implement — not a second program."

Each was the interface talking about itself.

## 2. Never write in the coach's voice

**Only Brice writes coaching.** Not the seed, not a fixture, not a placeholder,
not a helpful default.

Four objects — one Direction, one Read, two Decisions — were seeded as `published`
under his name. Natalie would have read invented coaching as her coach's. They were
retracted in `20260825120000_retract_unauthored_coaching.sql`.

A record whose contents might be fabricated is worth nothing. It cannot be
"placeholder content we'll replace later": the moment it renders, it is a claim
about what a coach said.

Empty states say the thing is absent. They never fill the gap with prose.

## 3. Do not narrate the structure

A section header names the section. It does not describe what the section is for.

- `The read` — yes. `The read · What stays. What develops.` — no.
- `The record` — yes. `The record · Where this started.` — no.

If a heading needs a subtitle explaining it, the heading is wrong.

## 3b. No definite article over an abstract noun

**Banned outright:** "The mark", "The read", "The record", "The work".

Each names a *concept* where the thing itself is already on screen. The reader
decodes a label to reach content that was speaking for itself. It is the same
failure as `Object` as a field name, and the same failure as "Coach margin" —
naming the system's idea of a thing instead of the thing.

Say what it is, or say nothing:

| Banned | Now |
|---|---|
| The mark | *(nothing — "Longest continuous distance" names itself)* |
| The read | Movement |
| The record | History |
| Coach margin | *(nothing — the buttons say what they do)* |

A section label earns its place only when the content is ambiguous without it.
Most are not.

## 3c. Acts are verbs, not object names

A button says what pressing it does, in the coach's language, never the name of
a row that gets written.

| Banned | Now |
|---|---|
| Write the Read | Respond |
| Write the Direction | Set the plan |
| Write the Decision | Decide |
| Direction · before the run | Before the run |

## 3d. Nothing demands anything on arrival

A standing call to action that fires every time a surface opens is nagging, not
coaching. Brice opens an athlete to *see how her week is going* — not to be
handed a task.

Attention annotates the thing it concerns. It never becomes the headline.

## 3e. No em dashes

Not in any rendered copy. Full stops and commas instead. En dashes are fine for
number ranges (`6:25–6:30`, `7–8`).

An em dash is a writer's mark, and these surfaces are supposed to sound like Brice
wrote them. He texts in full stops.

## 4. No copy that must be decoded

Plain, direct, and useful. If a sentence needs a beat of translation before the
athlete knows what to do, it fails — however good it sounds.

Field labels name the thing in the athlete's or coach's language, never the data
model. `Object` was a breach; the column is `objectType`, but the coach is choosing
*what they are writing*.

## 5. Data speaks as data

Numbers, dates and measurements are presented as values with labels, not strung
into sentences. Week 0 is a list of what was measured, not a paragraph written
about her.

## 6. State plainly, and only once

`Needs you`, `Waiting for run`, `Nothing waiting`. If a pill already says it, the
heading does not repeat it, and no sentence softens it.

---

## The test

Before shipping a sentence on any coaching surface:

1. Did Brice write it, or is it about the interface? If neither — cut it.
2. Would it survive Brice reading it back as his own words? If not — cut it.
3. Does removing it lose information? If not — cut it.

Most sentences do not survive. That is the correct rate.


## 7. Halo messages are Brice's words, not assistant output

This rule is binding on every Halo message, coach note, cohort campaign and backend
publisher, regardless of whether a model drafted the text.

- **Drafting is not publication.** A request to prepare messages does not approve
  any specific wording. Show the exact body for each named recipient in the
  conversation. Wait for Brice's explicit approval of that exact batch before
  inserting or unarchiving messages or scheduling notifications. Never infer
  approval from an earlier request to automate Halo.
- **No invented headline.** Do not create a poetic, motivational, or editorial
  title such as "Find the line", "Build the engine", "Quiet speed", "Two strong
  tens", or "Stay with the rhythm". Halo is a message from a coach, not a
  campaign. The athlete-facing design should omit the headline entirely. If a
  required database field temporarily needs a title, use only a literal
  session/date descriptor internally and do not surface it as a slogan.
- **No filler body.** Name the current, published session and correct pace in
  the athlete's unit; add at most one specific, useful reminder. Do not turn
  unsupported guesses into first-person coaching. If the Week already says
  everything and Brice has nothing else to add, send nothing.
- **Check before asking to send.** Verify recipient identity/entitlement,
  published session version, repetitions, duration/distance, recoveries, pace
  range and units against Week, Filing and Speed. Record any mismatch as a
  blocker; never smooth it over with copy.
- **Check after sending.** Read back the exact message and recipients from the
  authoritative live source. Never claim delivery from a local draft or a
  successful write alone. If Brice retracts a batch, archive its exact keys
  and verify zero active rows; do not automatically substitute new copy.

The November 8, 2026 cohort and Saturday notes were retracted after unapproved
model-written headlines were published under Brice's identity. Do not repeat
that workflow. All replacement copy must be presented to Brice first.


### Halo line-edit gate: delete the extra sentence

Brice's November 8 review established a narrower rule than "short and plain":
**each additional sentence must contain information he specifically wants the
athlete to act on.** A correct sentence can still be unnecessary.

Before seeking approval, remove:
- Generic closers about being rested, feeling ready, finding a rhythm, or not
  treating a workout as a race. These are not athlete-specific coaching.
- A reminder about another session merely to show the writer looked at the
  schedule. Mention another day only when Brice identifies a real conflict.
- Another athlete's name or a training partner unless coordination itself
  changes the instruction.
- Explanations of a known problem after the action is already clear. Prefer
  "Start early. Bring water." over a paragraph about previous heat complaints.
- A note that only duplicates the Week. If nothing else needs saying, **send
  no Halo message**, even if the athlete is in the entitled cohort.

When Brice has named a real recurring behavior, keep the direct instruction.
"Stop skipping your long runs" is useful; a vague reminder to save something
for Saturday is not a substitute. Do not invent such behavior for other
athletes.

Pace units follow the **athlete's preference**, independently of repetition
distance. For example, a workout written as 1 km repeats can still show its
pace in min/mi. Convert verified pace targets accurately; never quietly
change the prescription. Do not add a decorative opening or sign-off.
