# Race Pace Durability — responsive composition and print edition

**Supplied 5 September 2026. These files are the baseline the live page was
rebuilt onto.** They supersede the desktop-only composition frozen in
`../race-pace-durability/`, which remains as the record of what was approved
first and is no longer the acceptance baseline.

Brice, handing these over:

> use the HTML as the approved composition baseline … the prototype's mobile
> week navigation is currently broken. Do not copy that bug.

## The files

| File | What it is |
| --- | --- |
| `responsive-motion-v8.html` | The approved screen composition and motion grammar. |
| `print-template.html` | The approved print grammar: landscape, cover + three spreads of five weeks. |
| `print-template-v2.pdf` | What that template renders to. |

## What these settle

- The composition is a title, a week window, and the work. Nothing between.
- **Permanently removed, not to be reintroduced:** the KPI/metric strip, the
  tagline, WHY THIS BLOCK EXISTS, THE PROGRESSION, PLAN INFORMATION, the
  narrative moment block, the 15-week rail, and any hover treatment on a cell.
- The prescription lives **inside the cell** — title, primary, detail, total.
  That is why the separate session inspector is gone: the cell is the inspector.
- Six weeks at ≥1280, three at ≥900, two at ≥600, one below. One step moves the
  whole week, not a column.
- Mobile is a single-week editorial sheet, with the week's identity said once in
  the folio beside the title.
- Print carries **no THIS WEEK mark**. A sheet on a wall in November must not
  still be pointing at September.

## What was NOT copied

The prototype's week navigation. It was declared broken on delivery and was
rebuilt from scratch in `design-review/public-plan/plan.js`. The rebuilt version
differs in three ways that matter:

1. The sheets are re-typeset and the track re-parked in the **same task**.
   Letting a frame paint between them showed the week after next for one frame.
2. The settle is driven by the element's own computed transition duration, so
   reduced motion, print, and a browser with transitions disabled all take the
   no-wait path instead of waiting on a `transitionend` that never comes.
3. A guard timer backs the transition event, so a dropped frame cannot strand
   the window one week behind its label.

## Live-data differences from the fixture

The fixture in `responsive-motion-v8.html` was typed by hand. The live plan
agrees with it on every weekly total and nearly every session. Two differences,
both of which are the DATA being right and the fixture being approximate:

- **W2 Thursday** is authored `Hills · 8 × 45 s @ RPE 8–9 · 2 min easy`.
  The fixture calls it `SPEED · 8 × 45 s @ 5K effort · 90 s recovery`.

  **Resolved: the canonical Plan wins.** It was authored deliberately in
  `20260905120000_race_pace_durability_is_a_plan.sql` as
  `Hills 8 × 45 s + strides`, carrying its own intent — *"Strength above the
  pace, bought cheaply."* The fixture was the hand-typed approximation. Brice:
  *"Do not modify canonical training just to match the old fixture."* The page
  shows HILLS.
- **The lime accent is wider here than in the fixture, deliberately.** The
  fixture accents the exact title `RACE PACE`. Brice: *"i think long runs with
  race pace should also have the lime treatment no?"* — so a day now earns the
  accent by CARRYING race-pace work, read from its components, not by being
  titled with it. That lights 20 sessions: all fifteen Tuesdays, the four
  Saturdays that finish at race pace, and the race. It leaves threshold, VO₂,
  hills, strides, easy days and plain long runs dark.

  This is what makes lime honest again. W12's ask — twelve continuous miles at
  race pace — is a Saturday long run, and under the fixture's rule it rendered
  grey while a three-mile Tuesday rendered lime.
