# Race Pace Durability — static pass 2

Working copy of `design/reference/`. **Three approved changes, nothing else.**
No data wiring, no responsive work, no new pages, no production change.

Screenshots: `screenshots/` at 1600, 1280, 390 portrait, 844 landscape.

---

## What I changed

**1 · The title sits in from the edge, and stays there.** Pass 1 collapsed the
removed tile's 230px reservation entirely and put the title hard left. Wrong
call: the indent was not the tile's space, it was the composition — the title
reads better almost off-centre. Restored as `clamp(0px, 14.4vw, 230px)`, which
holds it at **16.5–17.1% of the viewport from 1280 to 1600**, against the
reference's 17.4%. It cannot re-create the old overflow, because the columns now
divide what is left instead of demanding a minimum.

**2 · The top-right overflow.** Measured at 1600: the page was **24px wider than
the viewport**, and the last metric — `12 MI · LONGEST CONTINUOUS AT RACE PACE` —
ran off the right edge.

Cause: `.hero` used `minmax(570px,1.03fr) minmax(760px,1.47fr)`. Those floors add
to 1330px, plus a 30px gap and the 230px reservation and the shell's own padding,
which is more than 1600 leaves. `minmax()` floors do not shrink, so the grid grew
past its container instead of dividing it.

Fixed by taking the floors to `minmax(0, …)` and keeping the **1.03 / 1.47 ratio
exactly**, so the proportion is still the reference's — the columns simply divide
the space they are given rather than demanding a minimum. `.hero-stats` and
`.metric` got `min-width:0` for the same reason, and the metric's side padding
went 22/24 → 18/20 so five metrics breathe in the narrower strip.

Now zero overflow at 1280, 1440, 1600 and 2000.

**2b · `/MI` was touching its own divider.** Five equal columns gave
`6:30–6:45 /MI` — much the longest string in the strip — the same width as `3`,
so it ran to the edge of its cell and the rule landed on the unit. The strip is
now `1fr 1fr 1fr 1.34fr 1.02fr`: the race-pace metric takes the extra, nothing
else changes, and no typeface got smaller. **21px of clearance at every width.**

**2c · `Weekly miles (approx)` moved under TOTAL.** It was pinned bottom-right,
directly beneath W15's `28`, where it read as a footnote to the last week rather
than a caption for the row. Now bottom-left inside the TOTAL label's own column:
label to the top of the cell, caption beneath it, 8.5px and dimmed so it stays a
caption. It ends exactly at the label column's edge and never crosses into W1.

**3 · Variation 1 — refined borders.** The grid is complete and every line is
still there; only its contrast drops. Outer `#223034` → `#162023`; cell rules
`#1c272a` / `#1b2528` → `#121a1d` / `#131b1e`. The `TOTAL` row keeps the original
`#223034` on its top edge, because that one line is a section break rather than a
cell division and losing it merges the totals into Sunday.

---

## Region-by-region against `reference.png`

| | |
| --- | --- |
| **1 · Global frame** | **Matches.** Same field, gradient, shell padding, footer rule. |
| **2 · Navigation** | **Matches** in layout and type. `Share Plan` and `Download PDF` use text glyphs (`⇧`, `▣`) where the reference has drawn icons. Inherited from the prototype, not introduced here. |
| **3 · Hero** | **Differs, approved.** No image tile. The title's indent is kept and now scales — x=264 at 1600 against x=267 in the reference. |
| **4 · Metrics** | **Matches.** Strip x 807→1566 against roughly 790→1500 in the reference. Same five metrics, order, dividers and lime, with the race-pace column widened so its unit clears the rule. |
| **5 · Plan heading / week control** | **Matches.** `THE 15-WEEK PLAN`, `Week 3 · Sep 7 – Sep 13`, `THIS WEEK` pill, both circles. |
| **6 · Matrix** | **Matches**, quieter borders. Two intentional differences: the caption moved from under W15 to under TOTAL, and the reference image's empty 16th column past W15 does not exist in the real table, which fills to the edge. |
| **7 · Methodology** | **Matches.** All three sections, same order, same copy. Dimension icons are glyphs (`▥`, `◎`) where the reference has drawn icons. |
| **8 · Footer** | **Matches.** |

---

## Reported, not fixed

**Below 1180px the page crops rather than responds.** `body{min-width:1180px}`
and there is no responsive CSS in the prototype at all — only a print block. So:

| | |
| --- | --- |
| 1600 · 1440 · 1280 | no overflow, page complete |
| 1180 | 4px overflow — the `min-width` floor against the shell's own padding |
| 1024 | 160px cropped, 1 metric off-screen |
| 844 landscape | 340px cropped, 3 metrics off-screen |
| 390 portrait | 794px cropped, 5 metrics off-screen, matrix shows W1–W4 |

The 390 and 844 screenshots are of that, and they are honest: this is what the
approved prototype does at those sizes. Responsive was explicitly out of scope
for this pass, so nothing was invented to hide it.

**Two icon sets are text glyphs.** `⇧ ▣` in the header and `▥ ◎` in TWO
DIMENSIONS. The reference has properly drawn marks. Replacing them means drawing
SVGs, which is new artwork rather than reproduction, so it waits for your word.

**The schedule is the prototype's illustrative data, untouched.** It is not
José's or Hope's authored plan and must not become it. Wiring is a separate pass
whose acceptance test is that the wired page looks indistinguishable from this.
