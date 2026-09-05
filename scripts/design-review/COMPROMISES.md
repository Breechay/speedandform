# Known visual compromises

> **Mostly closed.** Design pass V2 shipped on 5 September and items 1–7 below
> are either solved or superseded — the measure replaced the drawn row, density
> now follows the authored session role, lime came off `today`, and consecutive
> easy days compose into a recovery block. `SPEC_V2.md` is the current
> description of the surface; this file is kept as the record of what the
> problems were. Items 8–11 stand.

Things I saw, understood, and deliberately did not solve — because Brice's
instruction was to freeze functionality and stop refining Week View, and because
several of them are design questions rather than defects. Listed so the design
pass starts from what is known rather than rediscovering it.

## Structural, and probably the real subjects of the design pass

1. **The right rail may not deserve a column.** On desktop it carries one thing —
   *Key sessions*, usually a single Saturday — beside a day grid that already
   names that Saturday. It is a whole column of screen for a repetition. It
   disappears below 900px and nothing is missed, which is the tell.

2. **Desktop emptiness is unresolved, not intentional.** At 1600 the week grid
   stops around 60% of the width and the rest is ground. Some of that restraint
   is right; the current amount is where the layout landed, not where it was
   aimed. Nobody has decided which.

3. **The hero's proportions are laptop-first.** `Week 8` in Newsreader over the
   authored question is the strongest thing on the page at every size, including
   phone landscape, where it and the ownership figure consume the whole 390px of
   height before a single day appears.

4. **`2 MI YOU OWN` and `NEXT ASK` do not share a baseline or a scale.** The lime
   numeral is display-sized, its two label lines are stacked small caps, and
   `NEXT ASK / 5 mi` sits beside it in a different rhythm. They read as two
   controls that happened to be adjacent rather than one statement about
   ownership. This is the single most-noted item.

5. **The summary tiles are a uniform five-cell grid for values of very different
   weight.** `TOTAL`, `EASY`, `KEY SESSIONS`, `LONGEST DAY`, `CAN ESTABLISH` get
   identical treatment; only the lime on `CAN ESTABLISH` distinguishes them. On
   phone the fifth tile leaves a visible hole in the grid.

6. **Day-row density is even where the week is not.** A 9-mile easy Monday and a
   Saturday carrying an anatomy line, a band and a `MOVES → 8 MI` rung occupy
   rows of near-identical presence. The week's shape is in the content and not in
   the layout.

7. **Today is marked but not felt.** `.wday.now` gets a `today` chip and a border
   tint. It survives, but it does not read as the day you are standing in.

## Consequences of the package, not of the design

8. **The *What helps* rail never appears.** It needs standing observations, which
   the plan dump does not carry, so the array is empty for every athlete. Present
   in coach view signed in; absent here. Nothing to fix in the CSS — it is data.

9. **Marcus and Natalie have no portrait**, so their bench plates fall back to
   initials. That is production truth, not a package artefact.

10. **Simon's plan is one session.** Real. His eight-week cycle is unauthored, and
    the surface correctly shows almost nothing rather than inventing filler.

11. **Week 2's easy days are filed receipts, not prescriptions.** They render as
    allocations and open no session drawer, because they predate authored easy
    days. Ruled: do not solve. Weeks 3 onward carry the correct authored model.

## Fixed on the way past, because I had caused them

12. The `viewAs` control used a 900px breakpoint while the nav uses 760px. Between
    those widths the two controls sat on different edges, and below 760 they
    landed on top of each other. Breakpoints matched, and `viewAs` now sits a row
    above the nav once both are at the bottom.

13. The Plan view's `← José` back-button pointed at the Brief, a surface the
    athlete does not have. Hidden in athlete view rather than left as a control
    that bounces.

## Not compromises — settled, do not reopen

No sidebar duplication. No fabricated week intent. No percent-progress bar. No
empty weekly-note box. No serif in session content. Lime means *this can
establish something*, and nothing else.
