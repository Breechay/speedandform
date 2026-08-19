# Surface and weather

The site pass is closed. Live on `/`. App weather waits.

For Claude, Codex, and anyone touching the instrument plate or, later, the Field.

The app is an instrument. It was built to look complete while bare. That is still the law.

Brice is a colorful person. The technical system underneath is quiet on purpose. Personality does not enter as chrome, chapters, or a redesigned Today. It enters as **weather around the instrument**.

## The two rooms

**Site = understanding.** Plate 03 on `speedandform.com/` is where the world is allowed to show: bone paper, the dial as a sun, a cropped dragon as atmosphere.

**App = action.** Today stays one dominant read. The dragon, if it ships there, lives in unused field — not over the work. Same animal, same orange and teal. Not a poster laid on top of the session.

If a pass makes the Field look like an art book, a museum catalog, or a wallpaper, it is wrong. Those references (Vietnamese weapon catalogs, illustrated pages, patterned paper) are about *ingenuity and surface* — illustration that is the room, not decoration stuck on an app shell. Steal the confidence. Do not steal the layout.

## The sun

The disc is the sun. It is Today. It names the day. It does not need a second sun, a sky gradient, or a weather widget beside it.

On the site the week around it is atmosphere, at rest. On the app the dial is the instrument the athlete already knows.

## The dragon

Not a character. Not a third object to compose against. Weather.

- Own `<img>` layer. Never `background-image`.
- Saturated. No wash, blur, grain, tint, or blend on the art.
- Cropped by the viewport. You never see the whole contour. It enters from outside and leaves again.
- The crop must read as **deliberate** before it is understood. Enough curve and scale to be a form entering the frame. A shard in the corner looks accidental.
- Bottom-right. Orange and teal must **consume that corner** — no cream pocket, or it reads as a stamp on the page.
- Mid-right of a phone stays almost empty. Fins do not climb the edge into the middle of the screen.
- Does not cover the disc. Does not compete with Begin.
- Arrives with the room (`--paper-enter` on the site). Not a flying entrance.
- Site crop now: `min(86vw, 560px)`, right −30% / bottom −16%, image offset 4/6%, opacity 92% so it sits under the paper rather than on it. Desktop `clamp(420px, 44vw, 660px)`.
- `weatherDrift`: 54s, ease-in-out, alternating, 8px across and 10px up with a 0.6° turn, pivoting from the lower right. Slow enough that you never catch it moving, only notice that it has. That's the difference between weather and animation.

On the app, later: the same crop, primarily in the unused lower field. It may shift slightly with the day. Slightly. A few percent, not a parade. Rest days can be quieter. Interval days do not need a performance.

## Clouds

Not in this site pass. When they come, they are a picture. Not a forecast.

- Two or three, as their own layers, independent of the tail.
- Subtle. Taste, not sky replacement.
- None in the bottom-right corner. That corner belongs to the tail.
- Do not bake them into the dragon PNG.
- **Do not attach clouds to weather data.** The moment atmosphere needs a data source to justify itself, it becomes a feature, and you will end up designing an API instead of a picture.

## Weather data

Do not. Sun, field, weather works because nothing labels it.

## Site lock (now)

Live on `/` (`rd40`) and `/mockupc` (`snap40`). Spec: `INSTRUMENT-PLATE.md`.

- Art: `/media/dragon-tail.webp` (not the PNG; do not preload it against the films)
- Markup: `.dragon-tail > img` inside `.plate-instrument`
- Warm on plate 02 so 03 does not pop
- W1 tab / placard is on the plate. The instrument steps aside. The tab tells once.

## App lock (not this work)

Do not start the Field illustration until that is the task.

When it is: one crop, unused field, behind chrome if needed, never over Today’s dominant action. The app stays complete while bare. Weather is the only addition that survives the 100m lock — and only if it reduces nothing, covers nothing, and can be ignored.

## Do not

- A dragon head, eyes, claws, or a full beast
- Recolor, desaturate, or drop opacity until it is a stain
- Pattern fills, chapter marks, or catalog chrome from the art-book references
- A second horizontal axis of art across 01 and 02
- Social, engagement, or “something to look at” as a product
- Treating the site plate as a mock of the iOS screen, or the iOS screen as a poster
