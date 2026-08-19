# Cloud — parked

Do not restore unless Brice asks. The dragon stays. The cloud does not.

Two directions were tried on the instrument plate (03, bottom-right over the dragon). Neither is live. Assets, mocks, and screenshots are in this folder so the next pass starts here instead of from memory.

---

## What we were after

Something that reads as **weather** — Japanese / Asian ink or watercolor, a cloud sitting in the air over the dragon — not a CSS smudge, not a forecast widget, not a second sun.

Phone is the test. The dragon lives in the bottom-right corner. The cloud has to feel like atmosphere in that corner, not a crop of a bigger picture.

---

## Direction A — wash (rd44)

**What it was.** A watercolor ribbon painted as three PNGs (`cloud-ribbon`, `cloud-bridge`, `cloud-bank`), stacked over the dragon. Warm taupe (`#c4b8a8` / `#d4c8b4`). CSS `filter: blur(5px)` and `mix-blend-mode: multiply` at ~0.22 opacity. Drifted slowly.

**Why it failed.** Brice: dirt smudge. Too brown. Too feathery. The blur + multiply on bone paper made a gray-brown haze, not a cloud. The right edge still felt cut off.

**Do not repeat.** No blur. No `multiply`. No warm taupe. No three-layer stack trying to fake a brush.

**Files.** `A-wash/` (ribbon, bridge, bank — png + webp). `mocks/A-wash-source-*.webp` (original gens). `screens/plate-A-wash.png` (Track C capture with the wash on the plate).

Live commit: `131ee92` (merged, then superseded).

---

## Direction B — kumo (rd45–rd46)

**What it was.** Cool gray Japanese ink silhouette. No blur. No multiply. One `<img>`, `mix-blend-mode: darken`. This is the **right medium**.

Two cuts:

1. **Full with tail (rd45).** Long serpentine form, snail-shell spiral on the left, tail running off the right. Brice: the tail is a snail. Too much creature, not enough cloud.
2. **Mass only (rd46).** Tail cropped off. Just the body over the dragon. Better — but **cut off on the right**. The mass still felt like a piece of a bigger picture glued to the corner, not a cloud in the air.

**Why it is parked.** Right direction (ink, cool gray, no blur). Wrong crop. The silhouette needs to read as a complete form *inside* the corner, or dissolve so the cut isn’t a cut. We didn’t get there.

**Do not repeat without asking.** Do not restore the snail tail. Do not put the mass back as-is (it is cut off). Do not add blur or multiply on top of the ink.

**Files.** `B-kumo/cloud-full-with-tail.webp` (rd45) and `cloud-mass.webp` (rd46 crop), plus pngs. `mocks/B-kumo-source-*.webp`. `screens/plate-B-kumo-cut-off.png` (live phone capture of the mass — the cutoff is visible on the right). `screens/plate-parked.png` is the plate after the cloud was removed.

Live commits: `bb4fdb3` (full), then `f1c17c4` (mass). Removed in the commit that added this folder.

---

## When you come back

Start from Direction B’s *medium* (cool ink, darken, no blur) and Direction A’s *lesson* (warm + blur = dirt).

The unsolved problem is **crop and completeness**: the cloud has to belong to the corner without looking truncated, and without growing a tail that reads as an animal.

Do not put anything back on `/` until Brice asks. Dragon + atmosphere mask stay.

---

## Layout of this folder

```
cloud-parked/
  README.md          this brief
  A-wash/            ribbon, bridge, bank (png + webp)
  B-kumo/            full-with-tail + mass (webp)
  mocks/             original gens, compressed
  screens/           plate captures (wash, kumo cutoff, placard, parked)
```
