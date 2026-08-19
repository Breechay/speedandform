# 03 THE INSTRUMENT — live on `/`

Four plates. The race line, the W1 tab, and the tell are on `/` and `/mockupc` in this tree. Merge so live `/` matches. Question is 04. Nothing after the ask.

The governing move on the placard: **the instrument steps aside rather than being covered.**

## Sequence

```
01  THE WORK        colour film
02  THE PRACTICE    grey film
03  THE INSTRUMENT  bone paper. The dial is the room.
04  THE START       dark question on film B
BEGIN               persists. Still opens at question one.
```

01 + first thesis + Begin is still complete.

Cache: `/` `rd41`. `/mockupc` `snap41`.

## Why light

The material change earns the plate. Same argument that earned the old still — a different room — without type on a photograph. 01 colour, 02 grey, 03 bone, 04 dark.

On bone, Begin is ink on cream. Ivory on bone disappears. `.quiet` must not win over `.light`.

## Layout lock

The instrument owns the top. The copy owns the bottom third. They never share pixels.

Depth is by focus, not by blurring the page. The instrument dissolves into the paper at its own edges. The disc is the only sharp thing. The copy sits on clean paper in front of it.

- Dial box: `min(112vw, 60svh)`, centre `calc(35svh + 14px)` so WED clears FORM.
- Radial mask: opaque to 38%, .62 at 54%, gone by 76%. The week doesn't end at a hard edge.
- Disc `60%`. Labels at r=46, inside the mask fade. Type inside the disc sits a little smaller so the plate has air.
- Phone: MON and SUN are gone. SAT and TUE rest further in the fade (`--k: .28`).
- Week labels: static `blur(1.15px)`. Resting ink via registered `--k`. The ring does not light. The disc already names the day (TUESDAY / SATURDAY). Lighting TUE pulled the eye off the plate. Do not animate the blur.
- Rail on bone: 30% ink, 66% when on. 16% is invisible, not missing.
- Cycle: 7s hold. Outgoing session 0.5s. Incoming starts at 0.45s and takes 0.95s. Same 1.4s total; never both legible. The session does not travel. The race line's light does.
- Parallax capped at 8px.
- Headline only. The paragraph was the instrument's job written out in words.
- Atmosphere: cropped dragon as weather in the bottom-right. `min(86vw, 560px)` at right −30% / bottom −16%, image offset 4/6%, opacity `.92`. Desktop `clamp(420px, 44vw, 660px)`. See `SURFACE-AND-WEATHER.md`.

On a 375×667 phone the disc and the eyebrow land close. The air belongs between the instrument and FORM, then between the instrument and the copy. Dial centre is `35svh + 14px`.

## Entrance — scroll, not a timeline

Nothing on the plate is on a clock. The room answers the gesture.

- Disc scales `.945 → 1` from `--paper-enter` (scroll position).
- Week fills around the arc as you pull the room up: top of the arc first, then outward. Each label carries `--d` for its place in that order.
- Scroll back and it reverses.
- The week stays at rest. The disc names the day.

## The race line

One hairline under the disc, disc-width, four segments in race proportion — `9 / 20 / 54 / 17`. Start is short. Hold is most of the race. No labels.

The segment belonging to the session on the disc lights (ink .55, 2px) and the light travels as the cycle turns. Four sessions read as four parts of one race.

It rides `--cy` and the disc's entrance scale (`.945 → 1`), or it detaches from the disc while the room arrives. Width tracks the disc: both are `60%`. Sits at `top: calc(50% + 33%)`.

Brice sketched this as four labelled underlines — Start, Settle, Hold, Finish. Right instinct, wrong form. Four words under the disc is a legend explaining the plate, and it eats the air the plate just won. The disc already says the word; the line says where the word lives.

## The week tab and the placard

The tab is the app's own `W1` margin tab and the only thing on the plate that asks to be touched. 30 × 106, ink on bone, vertical mono, left edge at `34svh`.

One tap slides in a `min(78vw, 330px)` ivory panel:

```
THE PLAN
Half Marathon
West Palm Beach · Dec 13 · 1:15:00
MON Easy / TUE Intervals / WED Easy / THU Speed / FRI Easy / SAT Long run / SUN Rest
Five days. Intervals Tuesday. Long Saturday. The rest stays easy.
```

Long is bronze. Rest is italic. Every line is the app's, none of it is authored for the web.

**The instrument steps aside rather than being covered.** Dial and race line translate right and drop to .34; the copy drops to .22. You can see the instrument the whole time — the week took the room, it did not replace it.

Closes on the tab, an outside tap, Escape, or leaving the room. You never come back to a page mid-gesture.

Nothing about the week exists until it is asked for. Today is on the disc; the week is behind the tab.

### The tell

The tab leans out 6px and comes back. Once, 1.4s after the room settles, then never again for the session. Suppressed if the placard is already open, if the tab has been tapped, or under reduced motion.

One tell, once. A tab that pulses is a page asking to be used; a tab that moves a single time is an object telling you it is a handle.

## Depths

No spinning bezel. No collar. Depth by focus: a radial mask on the dial, a static blur on the week. The disc is sharp. The copy is on clean paper.

If the disc eats the eyebrow on 375×667, the lever is the `35svh + 14px` offset, not the type.

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

Scale falls off from the top of the arc: `1 − 0.04` per step out. The week stays at rest. The disc names the day.

## Bind

The core cycles four sessions (7s hold, staggered 1.4s dissolve). One session per race job. The disc names the day. The ring stays at rest.

| Job | Session | Day | Kick |
|---|---|---|---|
| start | Pressure to Pace | Tuesday · Intervals | builds start |
| settle | Clean Rhythm | Tuesday · Intervals | builds settle |
| hold | Long aerobic support | Saturday · Long run | builds hold |
| finish | Race rehearsal | Tuesday · Intervals | builds finish |

The name is authored (serif). The numbers are measured (`--sans`, system stack, SF on iPhone). No webfont.

Copy on the plate (site voice):

- *Every session is built for something.*
- `FORM · iOS` — App Store, `https://apps.apple.com/us/app/form-running-plans/id6761313085`

## Do not

- Phone chrome or a screenshot
- Tilt, perspective, 3D, drop shadow
- A fifth plate after the question
- A canned entrance animation while you wait
- Equal 1.4s fades on both sessions (prints two workouts at once)
- Invent a mark that the app does not use, or leave a type unmarked in one place
- Repeat the tell, or add a second one
- Cover the instrument with the placard instead of moving it
- Label the race line, or number its segments
- Bake the tail into a CSS background, desaturate it, or cover the disc
