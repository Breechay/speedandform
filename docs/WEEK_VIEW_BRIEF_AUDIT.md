# Week View — current against the mockup

Before implementing. The mockup is the visual and interaction reference; every
value rendered comes from Labs data.

## KEEP

- **Back to Full Plan, and ← → week steps.** Already built and already the right
  device. The matrix is the map; there is no reason for a sidebar.
- **The day rows and the cell grammar.** One renderer across all three scales, so
  a workout cannot mean different things at different magnifications.
- **Fills over borders.** The mockup is card-heavy in places; Labs is not.
- **Lime restraint.** Current day and ownership-moving work only.

## CHANGE

- **The hero.** Currently just `Week 2 · Aug 31–Sep 6 · 13 weeks out`. It needs
  what the mockup gets right: the question in direct address, `2 MI YOU OWN`, and
  the next checkpoint. Those exist and are on the Plan strip; the week is where
  an athlete actually reads them.
- **The summary.** Add the long day, which the model already knows.
- **The day row markup.** Becomes a semantic `<article>` with date, session and
  evidence as named parts, so the same object can change scale without changing
  meaning.
- **Room.** Days get more horizontal space; anatomy stops wrapping.

## ADD

- **A context rail**, on wide screens only, folding underneath below ~1200px.
  The training always gets first claim on width.
- **Athlete identity**, quiet, so it is never ambiguous whose plan is open.
- **Responsive behaviour** across desktop, laptop, tablet, phone portrait and
  phone landscape — landscape treated as a real mode rather than a squeeze.

## DO NOT COPY

- **The left week list.** 180px of permanent chrome duplicating the Full Plan,
  which is a better navigator than a list of fifteen identical links.
- **`THIS WEEK'S INTENT` with content.** `training_weeks.intent` is null on all
  thirty of José's and Hope's weeks. The panel renders only when one exists.
- **`Progress toward goal · 15%` with a bar.** Two of 13.1 is arithmetically
  true and reads as a completion metric, which ownership is not: five miles is
  not "38% of the answer". The ladder already shows position honestly.
- **`Weekly notes`.** `coach_private_notes` exists and is unwired; an empty box
  inviting input that goes nowhere is worse than no box.
- **Serif in session content.** Rejected already — it hurts scanning.
- **Every value in the mockup.** The weekly intent prose, the key-session
  descriptions and the percentages are invented. None of them ship.
