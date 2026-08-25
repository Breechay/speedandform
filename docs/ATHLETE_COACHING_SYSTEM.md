# THE ATHLETE COACHING SYSTEM — standing rules

Binding on Natalie's record, the Coach Desk, the share card, and every coaching
surface that follows. Written from corrections Brice made in review, so they do
not have to be made again.

Companion: `VOICE_LAW.md` governs sentences. This governs structure and behaviour.
`docs/design/GRAPHITE_ATHLETE_SYSTEM_REFERENCE.html` governs material.

---

## 1. Her page is a screenshot, not a portal

The athlete page travels because of how it treats her. It is **one column that
crops cleanly at three points**, and each crop stands alone as an image she would
send to someone.

1. **This week** — day, session, one line of intent. Nothing else.
2. **The work** — the grade, then the support block, cue attached to each movement.
3. **The mark** — one bar, one label.

Anything that does not survive being screenshotted does not belong on the page.

## 2. Graspable in seconds, or cut

Every surface is read standing up, on a phone, between other things. If a section
needs sustained reading to yield its point, it has failed. Prefer a number, a
state, or a three-word line over any sentence. Prefer a bar over a paragraph
about progress.

**No essays that say nothing.** This is the most common failure and the one that
gets caught last.

## 2b. Show it, do not describe it

Everything that can be a shape is a shape. A number, a bar, a ladder, a position
on a track — never a paragraph describing the same fact.

- Her week is a **row per session**: planned length in grey, filed length in lime
  on top of it. Over, under and missing are read at a glance, with no sentence.
- The mark is a **ladder**, not a bar. A bar states a ratio; the ladder shows the
  distances she will actually run and which one is next.
- Movement is a **position on a three-step track**, read before the words are.
- History is a **column of dates**, scanned downward, not a stack of paragraphs.

If a fact is being explained in a sentence, ask what shape it is first.

## 2c. The desk shows the week, not a task

Opening an athlete shows **her week**. Attention appears as a flag on the day it
concerns, and pressing it opens the write dialog already pointed at that session.

The first desk led with a headline and a lime button every single time. That is
a to-do list wearing a coach's clothes. He looks, and then he acts if he decides
to — the order matters.

The roster is **collapsed by default**. Four names do not need a third of the
screen once he is inside one athlete; expanding is the deliberate act.

## 2d. The desk is a board; her page is a column

Two jobs, one language. Graphite allows the layout to adapt and the language not to.

**His desk is a two-column board that fits one screen.** Her plan on the left —
the ladder, then the week. What he is judging on the right — movement, history,
his private margin. He should never scroll to see how an athlete is doing.

**Her page is a single column** because it travels as a screenshot on a phone.

The desk composes the *same parts* her page is built from. It never renders her
page whole inside itself: doing that duplicated the week, once as his grid and
again inside her embedded record, which is what made the desk endless.

**The week has seven days, always.** Every day holds a slot, so an empty day
reads as a decision rather than an absence, and the room is already there when
other sessions are added. Weeks are navigable across the whole block; unauthored
weeks show as unauthored rather than being hidden.

Anything belonging to someone else — the support prescription is the strength
coach's — is off his desk entirely and collapsed on hers.

## 3. The grade is a state, not a score

Four cues, three states: **holds · holds until tired · not yet.**

`holds until tired` carries the product. It tells the athlete why the support
block exists without anyone writing a paragraph about it. Never collapse it into
a percentage, a streak, a badge, or a trend line.

Never a universal athlete score. Never leaderboards.

## 4. The grade is the gate

Single-leg control reading `not yet` on a Sunday means the next distance **holds**
instead of climbing. This is stated in the schema
(`movement_reads.state`) and enforced in the record, not left to prose.

That one rule is what turns the grade from decoration into the thing protecting
the block.

## 5. One bar, one label, never two

The mark is a single figure against a single target — for Natalie, longest run
against 13.1. Any second number (cumulative miles, weekly volume) is quieter and
subordinate, or absent. Two competing bars means neither is read.

The slot is per-athlete: weeks held at threshold, race miles banked, outdoor
closes. The shape does not change; the subject does.

## 6. Only Brice writes coaching

No seed, fixture, placeholder or default ever writes a Direction, Read, Decision,
cue, question, or intent. Coaching content is authored or it is absent.

Four objects once shipped as `published` under his name that he never wrote.
Retracted in `20260825140000`. This must not recur. An empty coaching surface is
honest; a populated fake one destroys the only thing the record is for.

## 7. The desk shows one athlete at a time

Opening an athlete shows **her page as she sees it**, with what needs Brice above
it and his private margin below. One composition, not two documents side by side.

## 8. Attention is derived, never stored

`public.coach_attention` computes what needs the coach from the record itself on
every read. A stored queue is always one event away from lying — it did lie, and
reported "Nothing needed" for an athlete with an unanswered filed run.

Health outranks work: a recovery that did not settle sorts above everything.

## 9. The act follows the situation

Filed work asks for a Read. A session with no Direction asks for a Direction. A
week left open asks for a Decision. The desk offers **that one act**, already
pointed at the right session.

Never a standing row of buttons naming objects in the system. Naming objects makes
the coach translate their situation into the data model.

## 10. Material

One flat field — the same background the header uses. No cards, no nested fills,
no boxes inside boxes.

Hierarchy comes from **space, scale and weight**. A rule is drawn only at a genuine
boundary. Rules used as a substitute for hierarchy are the same laziness as boxes.

Type is sized for a working surface. The desk headline sits near 27px, not 52.

## 11. Motion

Motion says the record advanced. Crops settle on arrival; the bar fills toward the
mark. Nothing moves again unless something actually changed. All of it yields to
`prefers-reduced-motion`.

## 12. Never make her decipher anything

No robot speak. No corporate register. No field label that exposes a column name.
No state that must be cross-referenced to be understood. She should never wonder
what a word means, and never feel she is being addressed by a system.

---

## 12b. No em dashes

Not in any copy that renders. Not in coaching content, labels, empty states, or
placeholders. A full stop or a comma does the job, and the sentence is shorter for it.

- "Recoveries were too slow, that's rest not a float." Not "too slow — that's rest".
- "Up only. Ride back down." Not "Up only — ride back down."

En dashes stay for number ranges: `6:25–6:30`, `10–15 minutes`, `7–8`.

The reason is register. An em dash is a writer's mark. Brice texts in full stops,
and the surfaces should sound like he wrote them.

## 13. Banned vocabulary

"The mark", "the read", "the record", "the work", "coach margin", "object",
"write the Read". See `VOICE_LAW.md` §3b–3c. The pattern is a definite article
over an abstract noun, or a button named after a database row.

Before adding any label, ask whether the content already says it. It usually does.

---

## Review test

1. Does every crop survive as a standalone screenshot?
2. Can the point be taken in under three seconds?
3. Did Brice write every coaching sentence on the surface?
4. Is there a second number competing with the mark?
5. Does the desk offer one act, or a menu of objects?
6. Is any hierarchy being carried by a rule that space could carry?
7. Is any fact written as a sentence that could be a shape?
8. Does any rendered string contain an em dash?
9. Does anything demand an action simply because a surface opened?
