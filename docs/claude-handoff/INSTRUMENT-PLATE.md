# 03 THE INSTRUMENT — `/mockupc` only

Not on production `/`. Question is 04. Nothing after the ask.

## Sequence

```
01  THE WORK        colour film
02  THE PRACTICE    grey film
03  THE INSTRUMENT  bone paper. The dial is the room.
04  THE START       dark question on film B
BEGIN               persists. Still opens at question one.
```

01 + first thesis + Begin is still complete.

## Why light

The material change earns the plate. Same argument that earned the old still — a different room — without type on a photograph. 01 colour, 02 grey, 03 bone, 04 dark.

On bone, Begin is ink on cream. Ivory on bone disappears. `.quiet` must not win over `.light`.

## Layout lock

The instrument owns the top. The copy owns the bottom third. They never share pixels.

Depth is by focus, not by blurring the page. The instrument dissolves into the paper at its own edges. The disc is the only sharp thing. The copy sits on clean paper in front of it.

- Dial box: `min(112vw, 60svh)`, centre `35svh`. Passes behind the FORM wordmark.
- Radial mask: opaque to 38%, .62 at 54%, gone by 76%. The week doesn't end at a hard edge.
- Disc `62%`. Labels at r=46, inside the mask fade. MON and SUN clip.
- Week labels: static `blur(1.15px)` at .62. The day in play gets brighter, never sharper. Opacity 1.2s; the blur value never animates.
- Cycle: 7s hold, 1.4s dissolve, nothing travels. No 6px rise.
- Parallax capped at 8px.
- Headline only. The paragraph was the instrument's job written out in words.

On a 375×667 phone the disc and the eyebrow land within ~20px. If it reads tight, `35svh` → `33svh`. The air belongs between the instrument and the copy, not inside either one.

## Depths

No spinning bezel. No collar. Depth by focus: a radial mask on the dial, a static blur on the week. The disc is sharp. The copy is on clean paper.

If the disc eats the eyebrow on 375×667, the lever is `35svh` → `33svh`, not the type.

The name is New York (`ui-serif` on iPhone). The kick is SF (`--sans`). Not Fraunces, not mono. Paper is the app cream `#F2EEE6`.

## Marks — same vocabulary as the app

The mark is the session's character, not decoration. Someone who scrolls past this plate and later opens the app already knows a dash means rest.

If a session type is added, it gets a mark in both places or in neither. Bolt is in the app's vocabulary for threshold; it is not on this plate because no cycling session uses it.

| Type | Mark | SVG |
|---|---|---|
| Easy | one dot | `dot` |
| Intervals | three tight dots | `reps` |
| Speed | three spaced dots | `speed` |
| Long run | arc | `arc` |
| Rest | dash | `rest` |
| Threshold | bolt | not on this plate |

Day type: system sans. Abbr 11.5px / 500 / `.15em` / ink at .6. Session word 12.5px / 400 / ink at .38. Active day darkens; it does not change weight.

Scale falls off from the top of the arc: `1 − 0.04` per step out. Preview days read at the same weight as TUE; the lit day is only a shade darker.

The first session lights the ring as the labels are written. Do not hardcode TUE and correct it after.

## Bind

The core cycles four sessions (4.2s hold, 700ms dissolve). One session per race job. Each one brings its own day forward on the ring.

| Job | Session | Day | Kick |
|---|---|---|---|
| start | Pressure to Pace | Tuesday · Intervals | builds start |
| settle | Clean Rhythm | Tuesday · Intervals | builds settle |
| hold | Long aerobic support | Saturday · Long run | builds hold |
| finish | Race rehearsal | Tuesday · Intervals | builds finish |

The name is authored (serif). The numbers are measured (`--sans`, system stack, SF on iPhone). No webfont.

Copy on the plate (site voice):

- *Every session is built for something.*
- *Open it and the day is decided. The work, the paces, and the part of the race it is building.*
- `FORM · iOS` (label, not App Store CTA)

## Do not

- Phone chrome or a screenshot
- Tilt, perspective, 3D, drop shadow
- A fifth plate after the question
- Copy this to production `/` until the room inhabits the films
- Invent a mark that the app does not use, or leave a type unmarked in one place
