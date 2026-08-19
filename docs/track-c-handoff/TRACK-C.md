# Track C — Today becomes the instrument

Implement in FORM-iOS. Today is the product. The plan lives in the placard, so Today can hold less.

Reference captures in `ref/`. Tokens in `TOKENS.md`. Voice in `TONE.md`. Ledger in `ROADMAP.md`.

Work C1 → C8. One pull request is fine if the commits are named. Do not start Track E.

---

## The screen, after this pass

```
FORM                          ← Fraunces lockup. Nothing under it.
         (week, blurred)      ← atmosphere. Not seven legible days.
            [  SUN  ]         ← Today. New York title, SF numbers, ochre day.
         FILE SESSION         ← boxed CTA, ink hairline on bone.
         session details      ← secondary. No box.
[W1]                          ← same tab. Opens the ivory placard.
```

The header `FORM / Tuesday / the eighteenth of august` is gone. The disc already says Tuesday.

---

## C1 · The wordmark

Adopt the site’s FORM lockup.

- Face: **Fraunces**, weight 380, 17px, letter-spacing `.22em`.
- On bone: ink `#0b0b0a`.
- Top of Today. Not a second lockup on the placard unless FORM is already the chrome of the whole app — then once, not twice.

Kill the SF / small-caps treatment currently sitting above Tuesday.

---

## C2 · The typography rule

Three jobs, three faces. See `TOKENS.md`.

- **New York** inside the sun for the session name. This is already the interior lock. Keep it. Brice pointed at the font *inside* the sun; that is New York, not Fraunces.
- **Fraunces** for authored words *outside* the sun: the FORM lockup, the placard title, the week’s session names in the list.
- **SF** for everything measured: paces, times, FILE SESSION, TUESDAY, THE PLAN, day abbreviations.

Claude’s ROADMAP line that “the serif inside the sun and the serif in the headline are the same family” is wrong against live CSS. Do not put Fraunces inside the disc.

Never set a pace in a serif. Ship a static Fraunces subset in-app for the lockup and the placard, not a variable font over the network.

Interior six-register lock still holds: kick → name → dose → condition → evidence (only if real) → ochre day. Geometry supports this. It does not replace it. The sun may say less when less is enough.

---

## C3 · Kill the header

Remove:

- Tuesday (large serif)
- the eighteenth of august

The day name already lives in the disc (`TUESDAY`, ochre, SF, tracked). The date is not needed to begin. If a date must exist, it lives in the placard’s race line, not above the sun.

---

## C4 · The week recedes

Match the site.

- Static blur `1.15px`. Do not animate the blur.
- Radial fade: opaque to 38%, .62 at 54%, gone by 76%.
- Phone: MON and SUN clip off. SAT and TUE sit further in the fade.
- The week does not light. Lighting TUE pulls the eye off the plate.
- Scale falloff from the top of the arc.
- Marks above days stay (same vocabulary as the app).

The week is where you are, not what you read. The disc names the day.

---

## C5 · FILE SESSION is a button

Adopt the site’s Begin on bone.

- Hairline box, transparent fill, ink type, `padding: 18px 30px`, 11px, tracking `.2em`, uppercase.
- Label: **FILE SESSION**. App voice. Not Begin.
- SESSION DETAILS stays below, unboxed, quieter. It is not a second primary.

A hairline-underlined word is not an affordance. This is the dominant action of Today. One.

On rest days, the CTA is not FILE SESSION. Keep the existing rest behaviour (nothing, or the lawful quiet already authored). Do not invent a new rest CTA.

---

## C6 · Ivory placard, not brown

The brown plan sheet comes off. The site’s ivory panel comes on.

Open from the W1 tab. The instrument **steps aside** (translate right, opacity ~.34). It is not covered, not replaced, not dimmed to black.

Closed, the placard is this — and only this:

```
THE PLAN
Half Marathon
West Palm Beach · Dec 13 · 1:15:00
MON Easy
TUE Intervals
WED Easy
THU Speed
FRI Easy
SAT Long run     ← ochre
SUN Rest         ← italic
Five days. Intervals Tuesday. Long Saturday. The rest stays easy.
```

Long is bronze `#9d7440`. Rest is italic. Every line is the app’s, none of it is authored for the web. Wire it to the live plan, not to the site’s fixture copy.

RECORD / THE PLAN as a dark reverse door — gone from this surface. If Record still needs a door, it is not a second brown sheet on Today.

Closes: tab, outside tap, or leaving. You never come back mid-gesture.

---

## C7 · Edit is inside the placard, concealed

The placard at rest is a plan. It is not a form.

One control: **Edit**. When chosen, the concealed controls appear in the same panel:

- Run days (2–6)
- Long run (Saturday / Sunday)
- Can’t run (the day chips)
- Race, date, current, goal — the fields currently on the brown “What are you training for?” sheet

They are not visible until Edit. They are not a separate screen.

**Editable ≠ unbounded.** FORM authors purpose and consequential structure. The athlete may negotiate dose where changing it does not falsify the purpose. Easy/support is broadly editable. A decisive race-pace piece is protected — changing it still records reality, but it may no longer resolve the planned read. Do not scold. Do not fake what happened.

Done / close Edit returns the placard to the rest state above.

Do not put Run days / Long run / Can’t run on Today.

---

## C8 · One language for the four movements

FORM currently draws Start / Settle / Hold / Finish twice: race rings, and the struck registration mark.

Keep the mark. Delete the rings.

One concept, one language. The rings read as a chart you have to parse. The mark already ships, is tested, and is the better object.

If you disagree, stop and say so before building a third language.

---

## Files to open in FORM-iOS

Start here (names from the continuity pass; match the live tree if they have moved):

- Today / dial: `FORMDialHomeComposer.swift`, `FORMMovementRoot.swift`, kit `TodayMovementSnapshot.swift`
- Wordmark / chrome: whatever currently draws `FORM` + the Tuesday header
- Tab: the existing W1 margin tab
- Plan sheet to replace: `FORMPlanEditChrome.swift`, `FORMWeekFieldCard.swift`, `FORMWeekStrip.swift`, placard view if separate
- Rings to remove: `FORMRaceRingView.swift` (and call sites)
- Marks to keep: `FORMMovementMark.swift`
- Interior lock: `docs/canon/glass/INTERIOR_TYPOGRAPHY_LOCK.md`

Do not mount unshipped kit twins (`FORMLogFaceView`, old onboarding flows). Live path only.

---

## Do not

- Port site philosophy copy onto Today
- Put Fraunces inside the disc
- Rebuild the brown placard in ivory as a dark reverse
- Cover the sun with the panel
- Show seven sharp days
- Leave FILE SESSION as an underlined word
- Put edit controls on Today
- Start the dragon, the cloud, or chapter-close wiring (Track E)
- Put the race line under the disc
- Add a legend for the marks
- Repeat the tab tell
- Invent a rest-day FILE SESSION
- Reopen Track D voice unless a new string fails the guard

---

## Done when

1. Today is understood in under a second: the disc is the day, FILE SESSION is the action.
2. No Tuesday / date header.
3. The week is atmosphere.
4. The ivory placard is the plan. Edit is inside it, concealed.
5. The brown sheet is gone.
6. The rings are gone. The mark remains.
7. A phone screenshot of Today next to `ref/01-today-closed.png` would be read as the same room, compressed for action.

Then stop. Update `ROADMAP.md` C1–C8 to `[x]` with the date.
