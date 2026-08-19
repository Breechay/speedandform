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

The scrim is a fade, not a collision cover.

- Dial box: `min(92vw, 54svh)`, centre `29svh`
- On a 390pt phone the disc bottoms around 290–330px, above the eyebrow
- If 375×667 is tight, the lever is `29svh` → `27svh`. Do not touch type.
- Copy: h2 cap 38px, body 16px, plate `padding-bottom: 150px` (do not let the 760px media query push this back to 176px)

## Depths

No spinning bezel. No collar. The week labels sit around the session disc. The disc is paper on paper, a shade lighter — no ring, no shadow.

Scale the whole instrument `1.02` and sit it `5pt` below `29svh`. If 375×667 gets tight, the lever is still `29svh` → `27svh`, not the type.

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

Scale falls off from the top of the arc: `1 − 0.07` per step out. THU reads largest, MON and SUN smallest.

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
