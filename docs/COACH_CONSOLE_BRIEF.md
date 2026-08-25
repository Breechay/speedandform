# The Coach Console

**Draft.** Not ratified. This supersedes `EVIDENCE_INFOGRAPHIC_BRIEF.md` for anything
about the desk. Where documents disagree, the order in `FORM_MASTER.md` governs,
and Brice's live coaching decisions outrank every document here.

---

## 1 · Product boundary

**The website is Brice's instrument. It is not an athlete product.**

Athletes train in FORM. Brice sends them what they need. Nothing in the coaching
model depends on an athlete opening a web page, filing there, or maintaining a
relationship with a website.

This is not a gate. Sign-in stays, records stay reachable, Natalie's page stays
intact and authenticated. What changes is that no design decision is made to
serve an athlete's engagement with the site.

**Natalie is not redesigned.** Her page keeps working. Brice or the agent files
her sessions. She can be sent a screenshot, an excerpt, or the page itself when
that is useful. Later it can become an optional sharing surface. Not now.

Consequence worth stating: the adherence problem is out of scope. Retention is
Brice's coaching, not a web surface.

---

## 2 · The squad strip

Four athletes, always visible, at the top. It answers orientation and nothing
else.

Hope, Jose and Marcus share one claim, so they share one geometry:

```
1 · 2 · 5 · 6 · 8 · 10 · 13.1
```

Aligned across the three, so the eye reads them together.

**This is the capability ladder, not the block.** One rung per distinct distance
the claim is testing. It answers how far has become believable.

**Marcus's evidence additionally requires OUTSIDE, and OUTSIDE is not a rung.**
It is a condition on whether a session counts, recorded as `surface` on the
completion. A treadmill six does not advance him. Putting it in the ladder would
make a condition look like a capability.

**Natalie is a separate row.** Her question is different: distance progression
and a movement gate. She appears in the strip with her own marks, visibly not on
the shared geometry. She does not disappear from the desk because she stopped
being a website user.

**The strip does not rank.** No "ahead", "behind", "on track", "stalled", or any
word that orders one athlete against another. Equal rungs make comparison
structurally possible; the interface shows evidence position and stops there.

Selecting an athlete opens their surface below. The strip stays.

---

## 3 · The ladder is authored, never derived

**A numeral shows what Brice decided, not the longest run in the data.**

- Muted numeral: proposed
- Lime numeral: current
- Established numeral: held

A session landing at six miles **must never** move a numeral by itself. The
highest distance actually held is a derived fact that may inform the decision. It
cannot be the authority.

### The ladder and the block are different shapes

| | |
|---|---|
| `1 · 2 · 5 · 6 · 8 · 10 · 13.1` | how far has become believable |
| `2 · 5 · 6 · 6 · 8 · 8 · 10 · 6 · 4` | what the block asks, in order |

**One rung per capability.** The block repeats six and eight on purpose, and the
second of each should feel easier. That repetition is real evidence and must be
visible, but it belongs to the exposures under the rung, never to the ladder.

Duplicating a rung breaks two things at once: a scheduled session starts looking
like a new level of proof, and the taper six and four at weeks 13 and 14 start
looking like the athlete moved backward. Neither is true.

---

## 4 · The selected athlete's surface

In order:

1. The claim, in Brice's words
2. Current rung and next proposed rung
3. What is coming
4. The latest key session: **recovery first, effort second, splits quiet**
5. Repeated exposures of the same distance, and what changed between them. Six at
   effort 8 and six at effort 7 is the whole argument for repeating a rung, and
   this is the only place it can be seen
6. Judgments over time
7. Brice's current sentence, when he has written one
8. File, correct, or change the upcoming work

Recovery is read against **that athlete's own easy pace**, never against another
athlete's. Jose's floats sit within 14s of his 8:16. Hope's run up to 204s slower
than her 8:48. Same rule, no comparison between them.

Coral means **attention**, and which kind is always said in words, never left to
the colour: `DOES NOT ANSWER` or `WORKS AGAINST IT`. Those are different
findings and only one of them can weaken the claim.

Coral never means the athlete ran badly. Hope's August 25 does not answer how far
she can hold race pace. Whether it was well run is Brice's judgment, not
something the system asserts.

---

## 5 · Filing and correction law

Frozen.

- Agent filing and manual filing use **the same server-authoritative transaction**.
  It validates coach membership, athlete identity, source, completion fields and
  ordered session pieces, then writes them atomically. **Neither path may write
  completions or pieces around it.** A shared browser function is not enough while
  an agent can still write SQL directly.
- Brice can always file **without a screenshot**.
- Brice can always **correct an agent-filed entry**.
- A correction preserves the previous completion **and every previous session
  piece**.
- The correction reason is retained.
- **Factual correction cannot alter a judgment.**
- **A judgment cannot rewrite factual data.**
- Screenshot interpretation is **never authoritative** until it is stored as
  structured data. The image is source; the row is the record.

Correctable factual fields: date, session, pieces and their order, rep paces,
recovery paces, RPE, surface, temperature, conditions, attached source.

---

## 6 · Judgment

Three directions, authored by Brice, resting on one session or several:

- **moves it**
- **does not answer it**
- **works against it**

With his reason, always. Append-only; amending writes a new judgment naming the
one it replaces.

**A session that does not answer the claim enters history and changes nothing.**
Only readable evidence against the claim can weaken it. An unreadable session is
not a failure and not an absence; it is a third state.

### A judgment never moves a rung

Writing **moves it** records what the evidence did to the claim. It does not
change a numeral. Moving the current rung is a separate explicit decision, even
when both are offered in one flow.

Without this stated, the interface eventually makes **moves it** auto-advance,
and the ladder quietly stops being authored.

**No confidence figure, and no replacement for one.** Not a count, not a density,
not "2 pieces of evidence", not an accumulation of marks. Those are all scores
wearing other clothes. The judgments are the record of belief moving.

---

## 7 · Screenshot provenance

Attached to the session. **Collapsed by default.**

Opened when the numbers look wrong, when correcting, or when the image holds
something the structured fields missed. The agent's job is to translate the
screenshot into structured data; making Brice re-read the source on every session
undoes that translation.

It never occupies half the desk.

---

## 8 · Visual law

- No confidence number, gauge, meter, or progress bar
- No calendar grid, phase strip, or forecast of future weeks
- No dots whose meaning must be learned
- No colour carrying a meaning by itself; coral is always accompanied by the word
- The block is never rendered as a second ladder. "What is coming" is the next few
  authored sessions and nothing more
- No cards for content grouping; real tables for comparative data
- Lime is spent once per composition
- No em dashes in rendered copy
- No coach vocabulary: protocol, stimulus, consolidate, prescribed, taper
- No generated coaching, ever; silence where Brice has not written
- No connecting lines between unrelated sections
- Motion only when the record changed, never on an ordinary reload

---

## 9 · Do not build

- A continuous Garmin-style trace drawn from parsed values
- A permanent two-athlete comparison console
- HR disagreement logic
- Uploading as the primary desk workflow
- Screenshot open beside every reading
- Any athlete-engagement surface
- A redesign of Natalie's page
- "One screen, three bands" as a hard law

---

## 10 · Checkpoint migrations

**Never delete and recreate checkpoint rows.** `20260829100000` did, and it
irreversibly erased every `current` and `retired` state: only `reached` and
`repeated` were captured before the delete, and `mark_checkpoints` has no audit
trigger to fall back on. Ids changed too.

Future corrections update or append in place, preserving ids and state.
