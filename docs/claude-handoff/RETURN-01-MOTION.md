# Return 01 — the 01→02 handoff

Scope: motion only. No copy written. No plate added. ASK-BRICE still unanswered.

## The governing change

One dissolve, one property.

Film B sits above Film A in the stack. So B fades in over A, and A never moves and never dims. Before, both films were being animated toward each other and crossed in the middle at full brightness — that middle is where the choppiness lived, and it is also why it read as an effect rather than a cut.

Now: `--film-b-opacity` 0 → 1. That is the whole handoff. Nothing else touches the picture.

## Diff

**home.css**
- `scroll-snap-type: y proximity` → `y mandatory` + `scroll-snap-stop: always`. The snap is now the browser's, on the compositor, at native frame rate.
- Removed `filter: saturate() brightness()` from `.film-b`. It was recomputing a full-screen filter every frame to arrive at 1.0.
- Removed `--film-a-opacity`, `--film-a-scale`, `--film-b-scale`, `--film-b-sat`, `--film-b-bright`, `--room-dark`, `--hatch-y`. All were being written per frame and all were constants.
- `.film-a` → `opacity: 1`. It is the floor.
- `.hatch` promoted to its own layer, opacity only.
- Ticks: the inactive numeral starts at .52 and settles to .34 once the page has moved (`.inst.moved`), over 1.1s. The hairline now scales in from the left instead of appearing — and it reserves its space on both numerals, so activating one no longer nudges the column.
- Added `--cross` easing token. Unused so far; there if the type assembly wants a different curve than `--ease`.

**home.js**
- Deleted the JS snap timer and `snapLock`. It was re-snapping 90ms after the browser had already snapped. Two snap systems arguing is what the stutter at rest was.
- `plateHeight()` no longer reads `clientHeight` in the scroll loop. Measured once, re-measured on resize.
- Every custom-property write goes through `put()`, which drops the write when the value has not changed. Text vars are written to their own element, not to `documentElement` — a write to `:root` invalidates style for the whole document.
- Retimed: 01 leaves faster than 02 arrives (`.46` vs `.38`+), so there is a beat of film alone in the middle. That beat is the cut.
- 01 now travels -22px instead of -16px. It leaves; it does not fade in place.

**media/**
- Both films re-encoded at 1080×1920, ~4 Mbps (were 14.2 and 12.2). Originals kept as `*.orig.mp4`.
- 50MB → 15MB. Two simultaneous 1080×1920 decodes at 14 Mbps is more than a phone will give you while it is also snap-scrolling; no amount of JS tuning gets past it.
- Visually identical at this size. Check on device before you delete the originals.

Cache keys bumped to `rd16` on css, js, and both films.

## Unchanged

Films whole. No slats. No parallax. No Ken Burns. Begin does not move. Both films still run underneath, so there is no hitch on the cross. Reduced motion: dissolve only, no travel.

## Next in the prototype order

The 02 text axis. It is blocked on ASK-BRICE, not on engineering. Do not scaffold it with latin — the shape is known (claim + proof, ceiling of four) and the wiring is twenty lines once the words exist.

Type assembly on the handoff is third and may not be needed. Look at the dissolve on the phone first. If the cut already reads as one instrument changing its mind, the slats are an accessory to remove.
