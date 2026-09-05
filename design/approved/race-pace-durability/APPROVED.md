# Race Pace Durability — approved desktop composition

**Approved 5 September 2026, after static pass 4. Frozen.**

`index.html` + `styles.css` are the approved artifact. `approved-1600.png` is what
they render at 1600×1024 and is the **acceptance baseline**: when the page is
wired to real data, its capture goes beside this one and any visible difference
is a defect to be reported, not a variation to be justified.

Brice, on approving:

> This is the one. I'd lock the desktop composition here. So I would stop
> touching desktop aesthetics. No more spacing nudges, border experiments,
> labels, explanatory tooltips, or "improvements."

## What is settled

- The title's off-centre editorial position — `clamp(0px, 14.4vw, 230px)`
- Five metrics as one strip; the two fixed-string columns are `auto` so no unit
  can be clipped in any font
- Matrix at Variation 1 border weight; complete grid, quiet lines
- The current week is obvious without shouting; lime stays reserved
- No weekly-mile caption, no tooltip, no hover affordance
- No white seam on overscroll

## What is deliberately NOT settled

- **Responsive.** Below 1180px the page crops rather than responds. Its own pass,
  after wiring — mixing the two would solve neither.
- **The webfont.** Nothing is fetched; the page asks for Inter and takes whatever
  the machine has, so typography differs from the reference on any machine
  without it. An addition, not a reproduction, so it waits.
- **Icons.** `⇧ ▣ ▥ ◎` are text glyphs standing in for drawn marks.
- **The schedule.** Illustrative values from the prototype. They are not José's
  or Hope's authored plan and must not become it by being left in place.
