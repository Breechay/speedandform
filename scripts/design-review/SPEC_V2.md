# Design pass V2 — the binding spec

Loaded with **`?css=v2`**. One file, `assets/css/design-v2.css`, layered on top of
`labs.css`. No markup, data, routing or permission logic touched.

Compare: `#/a/jose/week/8` · `?css=v1#/a/jose/week/8` · `?css=v2#/a/jose/week/8`.

Every number below is measured off the render, not described. Where a figure and
this document disagree, the render is wrong.

---

## The three moves

**1 · A measure, not a width.** The ink already stopped around 1106px; V1 drew a
1440px row behind it, so the emptiness became a hole inside a drawn box.
Emptiness that is margin reads as composure. `--m:1180px`, centred, gutter
`clamp(18px,3.2vw,54px)`. Hero, summary and week share one left edge and one
right edge at every width.

**2 · Density follows eligibility, not importance.** A day carrying work that
bears on the mark gets a bay; a day that carries the athlete to it gets a line.
That is the system's own distinction setting the rhythm, so the week is not a
dashboard of importance-ranked cards — and easy running is supposed to be
unremarkable.

**3 · One accent, one job.** Lime comes off `today`. Production tints the current
day with `inset 2px 0 0 var(--lime)`, which spends the one word the palette can
say on the one fact the athlete already knows. Today is now the only *lit* row —
luminance, not accent. Lime appears where something can be established, and
nowhere else.

## Composition — desktop 1600 × 1000

| | |
| --- | --- |
| Measure | 1180px, x = 210 → 1390 |
| Hero | y 0 → 304. Padding 96 / 0 / 38. Columns `300px · minmax(0,1fr) · auto`, gap `0 clamp(36px,4vw,64px)` |
| Portrait plate | 62 × 78, radius 1px |
| `Week 8` | Newsreader 400, 44px, line-height .9, tracking −.026em |
| Date line | 9px, tracking .19em, `#4e5659` |
| The question | Newsreader 400, `clamp(27px,2.5vw,36px)`, line-height 1.14, max-width 23ch → 469px wide at 1600, y 98 → 180 |
| Ownership spine | y 208. `2` at 56px lime, tracking −.045em · labels 8.5px/.18em `#7d8587` · arrow `→` 21px `#4d5558`, margin `0 22px 4px` · `NEXT ASK` 8.5px · `5 mi` 26px, weight 400, `--secondary` |
| Week arrows | boxed hairline, radius 1px, 8 × 13, 10.5px, border `#232a2d`; fills `#ffffff08` on hover |
| Summary | y 304 → 419, height 115. Hairline `#ffffff12` top and bottom, no fills |
| — the four facts | `flex:1 1 0`, padding `20px 30px 19px`, divider `#ffffff0a`. Label 8.5px/.19em `#4e5659`; figure 21px weight 400 |
| — `CAN ESTABLISH` | `flex:0 0 auto`, min-width 190, right-aligned, x 1200 → 1390. Figure 27px lime |
| The week | y 453. Day column 96px right-aligned · spine 1px · body padding-left 30 |
| Easy row | 75px (padding 15/15, figure 15px, spine `#ffffff12`) |
| Eligible row | 128px (padding 26/30, figure 19px, spine `#ffffff30`; lime when it is a rung) |
| Rest row | 62px (padding 11/11, 11.5px, `#454d50`) |
| `MOVES → 8 MI` | 9.5px/.16em lime, hung at the measure's right edge — x 1303 → **1390**, the same right edge as `CAN ESTABLISH` above it. The claim and the work that delivers it share an axis. Below 1280 it returns to flow under the session |
| Today | `linear-gradient(90deg,#ffffff0e,#ffffff0b 34%,#ffffff04 68%,#ffffff00 96%)`, spine `#ffffff66`, `box-shadow:none`. The word `today` is 8px/.2em `#c9cfc4` under the date — not a chip |

## Composition — phone portrait 390 × 844

Hero 0 → 388. Summary 388 → 565. **First day at y 583**, four rows above the fold
(V1: the days began at 730 and one row was visible).

- Hero padding 56 / 0 / 20. Name 36px, question 25px / 19ch, `2` at 46px.
- The summary is a **stat line, not a panel**: label and figure share a baseline,
  two pairs to a row, `CAN ESTABLISH` on its own full-width line with the figure
  at the right. 177px total against 290px for stacked cells.
- An easy day is **one line** — `9 MI  Easy`, 68px per row. Receipts, rules and
  rungs wrap beneath at `flex:1 0 100%`.
- An eligible day keeps its bay: 168px, with a 2px left rule (lime for a rung)
  and 14px of indent, because at 390 there is no margin to hang a spine in.
- Today's fill bleeds to the screen edges (`margin:0 -16px`), so the lit row is
  the full width of the phone rather than a floating band.

## Composition — phone landscape 844 × 390

The chrome moves; the question does not. Nav and lens to the foot (bottom 10),
wordmark and stamp to 11px / 9.5px at top 12. Hero 36 / 0 / 14, three columns
`200px · 1fr · auto`, question 17px.

Hero 0 → 137 · summary 137 → 196 (59px, `em` suppressed) · **first day at 205**,
four days visible, and the question sits at y 38 with nothing over it.

## What this fixes from `FINDINGS_V1.md`

| V1 defect | V2 |
| --- | --- |
| `CAN ESTABLISH` scrolled off-screen between 761 and ~1020px | The summary wraps and never scrolls. Verified at 1600, 1280, 1024, 900, 800, 761, 390 and 844 × 390: no cell out of view at any of them |
| The question ran under the nav in landscape | The chrome moves to the foot instead. Question top 38, nothing overlapping |
| `body[data-view-as="athlete"]` never applied | Hooked to `#viewAs button[data-view-as="athlete"].on`, which `labs.js` does set. Measured: hero padding 96px coach, 84px athlete |
| `MOVES → 8 MI` had become a bordered pill | Plain lime, hung in the margin. No pills anywhere on the surface now, including the nav, the lens and the Photo Lab |
| Emptiness moved into the rows rather than leaving | The measure. Rows end where the ink ends |

Two collisions found on the way past and fixed here: between 761 and 1180 the
centred nav and the lens touch (four coach words plus two lens words are wider
than the gap), so the lens goes to the foot early; and below 860 the base
stylesheet turns the day header into a flex row, which broke the hanging day
name in the 761–860 band and in landscape.

## Verified

`?css=v2` at thirteen states — 1600, 1280, 1024, 900, 800, 761, 390 portrait,
844 × 390 landscape; weeks 2 (current, today, filed receipts), 8 (the rung), 14
(taper), 15 (race week); coach and athlete. In all thirteen:

- `scrollWidth === innerWidth` — no horizontal overflow anywhere
- no summary cell out of view, and `CAN ESTABLISH` present wherever the week has
  a rung
- the question overlaps no chrome element
- today is lit and not lime

Phone captures go through `frame.html`; `innerWidth 390, scrollWidth 390`
verified on every one.

## Out of scope, deliberately

**The Full Plan is untouched.** The matrix is the map and this pass is about the
surface you work from; a 15-week table is a different object and deserves its own
pass rather than an inherited one. The only V2 rule reaching it is the chrome.

**The session drawer** gets the vocabulary but not a redraw: hairline edges,
square buttons. Its content structure is already right.

## The one thing that needs markup

CSS cannot tell a long run from an easy day. José's 10-mile Sunday in week 2 is a
key session by the summary's own count, but it carries no component pointing at
the mark, so it gets a line where it deserves a bay.

The fix is one word in `prescribedCell` — a `key` class on any session whose
title is not easy/off/rest, alongside the existing `own` and `rung`. Then the
layout follows the coaching distinction rather than mark-eligibility, and
`.wday:has(.s.key)` replaces `.wday:has(.s.own)` as the rhythm's hook. It is a
one-line change and it is the difference between the week's shape being nearly
right and being right.

## Open, and honestly still open

**Five easy days still read as five near-identical rows.** They are one line each
now instead of two, which is most of the win available in CSS. The real answer is
probably that a run of easy days is one object — *35 easy miles across five days*
— with the days as its parts. That needs markup, and it needs a ruling from you
first about whether the athlete should be able to see each day's number without
counting.

**The measure at 1600 leaves 210px of margin each side.** That is the intended
answer to compromise #2, but it is an answer, not a proof. If you look at it and
want the instrument wider, the single lever is `--m` and nothing else moves.
