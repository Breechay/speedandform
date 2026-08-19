# Track C — hand this to Codex

**Repo:** `FORM-iOS`  
**Surface:** Today  
**Source of truth for look:** live `https://speedandform.com/` plate 03, cache `rd44`  
**This package:** written 19 Aug 2026 from the live site, not from memory.

Open `TRACK-C.md` and implement C1–C8 in order. Update `ROADMAP.md` in place as you go. Do not delete items.

Track D (voice) is already done on `cursor/the-plan-binding-93e5`. Do not reopen it. New strings must still pass the language guard.

Track E weather is a separate package: `docs/track-e-handoff/`. Do not start it from this zip.

## Why this exists

The site is ahead of the app. Brice’s call: **put the site’s experience on Today first**, so nothing is lost. The plan now lives in the ivory placard, which means Today can hold less. Today shows today.

## Files

| File | Use |
|---|---|
| `TRACK-C.md` | Build this. The spec. |
| `DISC-EDGE.md` | C leftover. Larger sun, no hairline, type breathes. Pressure to Pace as on the site. |
| `TOKENS.md` | Exact colours, type, sizes from live CSS. Do not invent tokens. |
| `TONE.md` | Site vs app. Compression. What copy may not enter Today. |
| `ROADMAP.md` | The ledger. Statuses in place. Track D marked done. |
| `ref/01-today-closed.png` | Phone capture of plate 03, instrument at rest. |
| `ref/02-placard-open.png` | Same, ivory placard open. This is the plan sheet. |
| `extracts/` | Live `home.css` instrument slice and the plate HTML. |
| `doctrine/` | Interior lock, editable≠unbounded, site specs, Claude’s continuity brief. |
| `FORM-TRACK-C.zip` | This folder, zipped. Give this to Codex. |

## What not to port

- The site headline *Every session is built for something.* That is site voice (understanding). Today is action.
- The dragon, the cloud, the films. Atmosphere is Track E, after Today is the instrument.
- The race line. Parked on the site. Do not build it in the app.
- A brown reverse of the placard. Ivory on bone.

## Gate

Brice authorized Track C now. Do not wait for “send the link to ten people.” Still commit and push the FORM-iOS tree (A1) before a TestFlight.
