# Return 03 — the glass

## The move

The picture is not in the room. It is in the next room, and you are looking through something.

Two layers, both static, neither animated:

**`.glass`** (z-2) — a radial recession that darkens the corners and holds the centre open, plus a cool ivory-blue wash (`rgba(206,222,234,.055)` falling to `.022`) across the top two-thirds.

The wash is the part that matters. Glass never gives you true black. It lifts the shadows a few percent and cools them, which is exactly what the eye reads as *a pane between me and that*. It also flattens contrast slightly, which is what makes a 4 Mbps encode stop looking like a 4 Mbps encode — blocking is only visible against hard black.

**`.grain`** (z-3) — static SVG fractal noise, 180px tile, `.055` opacity, `.075` at 2x and above. No animation, no blend mode, one composited layer.

Grain is the honest fix for softness. Compression artifacts read as *cheap* because they are structured — blocks, banding, mosquito edges around limbs. Uniform grain over the top gives the eye a competing texture at a finer scale, and the structure disappears into it. This is what film does. It is why a 35mm print at half the resolution of a digital capture reads as more expensive, not less.

`.hatch` pulled back from `.32` to `.26` line alpha so it does not compete with the grain.

Both layers dim with the films when the intake opens, so the questions still happen in a darkened room.

## Why not more bitrate

The originals were not crisp either. Going back to 14 Mbps buys sharpness that was never in the source and costs the snap. The problem was never resolution — it was that the picture was presented as if it were in the room with the viewer, at which point every softness is a defect. Put it behind glass and the same softness is depth.

If it still reads thin on device, the next lever is a 1.5px blur on `.film video` — but that is a real per-frame cost on a phone and should only be spent if the glass alone does not do it.

## Also in this pass

`.thesis` is now `align-items: end`. All four arguments share a bottom edge, so `01 / 04`, `@form.practice` and Begin sit at fixed distances no matter which argument is showing. Previously the block reserved the height of the tallest argument and the shorter ones floated with a hole beneath them.

## Type assembly — the recommendation is don't

Type assembly was the brief's fallback: instead of the next headline cross-fading, it arrives in three to five horizontal bands that assemble into the line, on the same easing, then rest. Bands of *type*, never bands of picture — that was the whole point of not slicing the runners.

It was proposed as insurance in case the handoff still felt like a cut-to-black rather than a room change. The dissolve now does that work, and the glass reinforces it. Assembling type on top would be a second effect competing with the first, on the same 800ms.

The house rule is that a new idea requires a deletion. There is nothing here worth deleting to make room for it.

Keep it in the drawer. If a fifth argument ever earns its way onto 02, band-assembly on the claim is where it would go — one place, one gesture, not the handoff.
