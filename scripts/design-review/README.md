# FORM Labs — design-review package

A frozen, self-contained copy of the current coach surface, for design work that
happens outside the repo. Open it, inspect it, rewrite its CSS, argue with it.
Nothing here can reach production.

**Start with `BRIEF.md`** — what this product is, where it is going, and the six
things that are genuinely hard. Then `COMPROMISES.md` (what was seen and left
alone), `FINDINGS_V1.md` (the first design pass, audited), `SPEC_V2.md` (the
second pass, with the measurements that bind it) and `KINGS.md` (what this
surface takes from the instruments that solved these elements first).

**This is the real renderer.** `assets/js/labs.js` is `coach/labs/labs.js` copied
without modification, and it reaches its data through an import map that swaps
`/private/data.js` and `/private/auth.js` for read-only stubs. The stylesheet is
`coach/labs/labs.css` with one mechanical change — absolute font paths became
relative so the package runs from any directory. No page was redrawn by hand.

Verified at build time: the package's markup for the Plan and for weeks 2, 8 and
14 is **byte-identical** to the signed-in surface.

## Running it

ES modules and `fetch` need an origin, so `file://` will not work.

```bash
cd form-labs-design-review && python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Rebuilding it

```bash
python3 scripts/build_design_review.py
```

Re-run after any change to `coach/labs/*`, or after `scripts/dump_plan.sh`. The
build refuses to finish if the record generator stops agreeing with the captured
record, or if the data stub is missing an export the renderer imports. It leaves
`screenshots/` alone; everything else is regenerated.

Source for the parts that are not copied from the product lives in
`scripts/design-review/` — the two stubs, the `?as=` bootstrap, this README, the
compromises list, and the screenshot script.

## Routes

One `index.html`, hash-routed — the same routing the product uses. Duplicating
pages would have meant a second renderer, and a second renderer drifts.

| Route | What it is |
| --- | --- |
| `#/bench` | The bench. Five athletes, portrait-first. Coach only. |
| `#/a/jose/brief` | The brief — one athlete, one dominant thought. Coach only. |
| `#/a/jose/plan` | **Full Plan.** The 15-week matrix, the hero, the volume horizon. |
| `#/a/jose/week/2` | **Week View**, a past week: filed evidence, historical easy-run receipts. |
| `#/a/jose/week/8` | **Week View**, a future week with a rung Saturday (the lime case). |
| `#/a/jose/week/14` | **Week View**, the taper. |
| `#/a/jose/week/15` | **Week View**, race week. |
| `#/a/hope/plan` | The same architecture, a second athlete. |
| `#/a/natalie/plan` | Sunday work — the weekly skeleton is per athlete, not a FORM law. |

**Session detail** is a drawer over the Week View, not a route. Open it by
clicking any prescribed session cell; `Escape` or `×` closes it. It is the third
level of `PLAN → WEEK → SESSION`.

### Athlete view

Athlete view is a *lens*, not a route: in the product an athlete's identity
decides it. The toggle at the top right is a coach's preview instrument, and a
signed-in athlete never receives it.

For linkable, screenshot-able review states the package adds a query parameter
that presses that toggle for you — `assets/js/review.js`, review-package only:

| Route | |
| --- | --- |
| `?as=athlete#/a/jose/plan` | Athlete — Full Plan |
| `?as=athlete#/a/jose/week/8` | Athlete — Week |
| `?as=coach#/a/jose/week/8` | Coach, explicitly (the default) |

### Design variants

`?css=<name>` layers `assets/css/design-<name>.css` **on top of** the shipped
stylesheet. Layering rather than replacing is deliberate: a variant that forks
`labs.css` stops being comparable the moment production moves, and the point of
this package is that both are the same renderer.

| | |
| --- | --- |
| `#/a/jose/week/8` | The shipped surface |
| `?css=v1#/a/jose/week/8` | Design pass V1 — see `FINDINGS_V1.md` |
| `?css=v2#/a/jose/week/8` | Design pass V2 — see `SPEC_V2.md`. Supersedes V1; V1 stays for A/B |
| `?css=v2&as=athlete#/a/jose/week/8` | V2, athlete lens |

To start your own: `cp assets/css/design-v2.css assets/css/design-v3.css`, then
`?css=v3`. Combine freely with `?as=`.

`screenshots/shipped/` and `screenshots/v1/` are the same nine captures of each,
so any two can be diffed directly. `screenshots/v2/` carries those nine plus
three states V1 never showed: the current week at desktop and phone (today, and
filed receipts), and the session drawer.

Athlete view collapses navigation to `Plan`, and `#/bench`, `#/a/:slug/brief` and
the athlete record all redirect to that athlete's plan.

## Viewports to inspect

| | Size | Watch for |
| --- | --- | --- |
| Desktop | 1600 × 1000 | How much emptiness is intentional; whether the right rail earns its column. |
| Laptop | 1280 × 800 | The point where the rail and the day grid start competing. |
| Tablet landscape | 1024 × 768 | Still the desktop layout; the last width before the nav moves. |
| Phone portrait | 390 × 844 | Day-row density; the hero's proportions; whether the summary tiles survive. |
| Phone landscape | 844 × 390 | Almost no vertical room — the hero and the tiles both want it. |

The layout breakpoint is **760px**: below it the nav and the `viewAs` control move
to the bottom of the screen and the right rail is dropped.

**Capturing a phone width.** Chrome headless clamps its layout viewport to a
500px minimum: `--window-size=390` reports `innerWidth=500` and then crops the
image to 390, which silently turns every phone screenshot into a cropped tablet.
`scripts/design-review/shots.sh` renders anything under 500px inside
`frame.html`, an exactly-sized iframe, and crops the frame back out. If you
capture phone widths any other way, verify `innerWidth` before believing the
picture.

## What is real and what is not

**Real:** every athlete, block, week, session, prescription component, pace band,
mark, checkpoint, filed completion and split, rebuilt from a production dump in
the exact shape the signed-in surface receives. Nothing was invented, rounded or
prettied. José's Tuesday in week 2 is the Tuesday he ran.

**Not present:** standing observations, coach reads, directions, decisions,
private notes, coach tasks and evidence files are empty — the plan dump does not
carry them. The visible consequence is that the Week View's *What helps* rail
never appears. See `COMPROMISES.md`.

**Not possible:** filing, revising, recording an observation and saving a portrait
all throw. They fail loudly on purpose. A Revise button that appears to work and
changes nothing is how a design review ends up reviewing a lie.

## The law this package is built on

One canonical `PLAN → WEEK → SESSION` renderer. `viewAs` controls capabilities and
peripheral coaching information; it must never fork prescription rendering.

Athlete view is **prescription read-only** — not read-only. The athlete cannot
author or alter the work. Athlete-owned reporting (RPE, a note, an answer to the
week's question, evidence) is a write this mode is expected to grow into, and
nothing in the current structure prevents it.
