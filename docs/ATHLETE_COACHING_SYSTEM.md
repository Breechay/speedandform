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

## Review test

1. Does every crop survive as a standalone screenshot?
2. Can the point be taken in under three seconds?
3. Did Brice write every coaching sentence on the surface?
4. Is there a second number competing with the mark?
5. Does the desk offer one act, or a menu of objects?
6. Is any hierarchy being carried by a rule that space could carry?
