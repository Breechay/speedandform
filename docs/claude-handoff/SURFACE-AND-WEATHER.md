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
- Saturated. No wash, blur, grain, tint, or blend on the file. Atmosphere is a **mask on the container**, not a treatment of the art. The pigment stays. The form dissolves toward the room.
- Cropped by the viewport. You never see the whole contour. It enters from outside and leaves again.
- The crop must read as **deliberate** before it is understood. Enough curve and scale to be a form entering the frame. A shard in the corner looks accidental.
- Bottom-right. Orange and teal must **consume that corner** — no cream pocket, or it reads as a stamp on the page.
- Mid-right of a phone stays almost empty. Fins do not climb the edge into the middle of the screen.
- Does not cover the disc. Does not compete with Begin.
- Arrives with the room (`--paper-enter` on the site). Not a flying entrance.
- Site crop now: `min(86vw, 560px)`, right −14% / bottom −6%, image offset 2/2%, opacity 92%. Desktop `clamp(420px, 44vw, 660px)`, right −2% / bottom −4%.
- Atmosphere mask: radial, origin low-right of the box (`88% 108%`). Corner holds. The edge facing the sun and the copy falls away. The drift animation is on the image, the mask stays put — the form moves through the veil, not with it.
- `weatherDrift`: 54s, ease-in-out, alternating, −8px / −10px and −0.6°, origin 80% 80%. Slow enough that you never catch it moving, only notice that it has. Anything faster is animation, and animation is a performance.

On the app, later: the same crop, primarily in the unused lower field. It may shift slightly with the day. Slightly. A few percent, not a parade. Rest days can be quieter. Interval days do not need a performance.

## Clouds

A picture. Not a forecast. Independent of the tail.

- Own `<img>` layer (`.weather-cloud`). Never baked into the dragon file.
- **One** on the plate: the ribbon (`/media/cloud-ribbon.webp`). A cool gray kumo — Japanese ink silhouette, not a watercolor smear. Family also has `cloud-bridge` and `cloud-bank` — not on the page.
- Cool stone gray, not brown, not white. Authored edge. No page blur, no `multiply` — those turned the last pass into a dirt smudge.
- Displayed at ~.42 so the form reads and the paper still shows through.
- Sits slightly right, in the lower field. Its job is to mediate empty field and dragon — not to fill the center-left.
- Mass on the right (kisses the dragon’s visible edge). Taper to the left. One softer trailing lobe.
- Does not cover the disc. Does not compete with Begin. Does not occupy the extreme bottom-right corner — that still belongs to the tail.
- Arrives with the room. `cloudDrift` 80s, slower than the dragon, different path. Anything faster is animation.
- **Do not attach clouds to weather data.**

The family is three files so the app can later crop, shift, or quiet the same weather. Do not put all three on the site.

## Weather data

Do not. Sun, field, weather works because nothing labels it.

## Site lock (now)

Live on `/` (`rd45`) and `/mockupc` (`snap45`). Spec: `INSTRUMENT-PLATE.md`.

- Art: `/media/dragon-tail.webp` (not the PNG; do not preload it against the films)
- Markup: `.dragon-tail > img` and `.weather-cloud > img` inside `.plate-instrument`
- Warm on plate 02 so 03 does not pop
- W1 tab / placard is on the plate. The instrument steps aside. The tab tells once.

## Two amendments (Aug 19)

**Clouds are not weather data, and not a plan tier.** Do not make the artwork contingent on a forecast API or on what a free account gets. The moment atmosphere needs a data source to justify itself it stops being a picture and becomes a feature, and you will end up designing an integration instead of a sky. If real conditions ever influence it, beautiful — but it never has to earn its existence with a number.

**A crop has to read as a form entering the frame.** The tightest pass on the tail left a shard in the corner that read as something the viewport accidentally clipped, not as a shape arriving. The rule: enough curve and scale to be read as deliberate before it is understood — never a terminus, never anatomy. Roughly a quarter arch around the sun, held to the lower right, mid-right stays empty.

**Weather dissolves the way weather dissolves.** The mask sits on `.dragon-tail`, not on the file. Corner holds. The edge facing the room falls into paper. The image drifts through that veil. Do not blur, wash, or blend the art to get this — the falloff is the atmosphere.

**One cloud, as a picture.** Cool gray kumo. Authored edge. No blur, no multiply. Shifted right so it mediates dragon and empty field. Then stop.

**Weather moves the way weather moves.** `weatherDrift`: 54s, ease-in-out, alternating, −8px / −10px and −0.6°, origin 80% 80%. Slow enough that you never catch it moving, only notice that it has. Anything faster is animation, and animation is a performance.

## App lock (not this work)

Do not start the Field illustration until that is the task.

When it is: one crop, unused field, behind chrome if needed, never over Today’s dominant action. The app stays complete while bare. Weather is the only addition that survives the 100m lock — and only if it reduces nothing, covers nothing, and can be ignored.

## Do not

- A dragon head, eyes, claws, or a full beast
- Recolor, desaturate, or drop opacity until it is a stain
- Blur or blend the dragon file to fake atmosphere — the mask is the veil
- Blur or `multiply` the cloud — that is how it became a brown smudge
- Pattern fills, chapter marks, or catalog chrome from the art-book references
- A second horizontal axis of art across 01 and 02
- Social, engagement, or “something to look at” as a product
- Treating the site plate as a mock of the iOS screen, or the iOS screen as a poster
- Put `cloud-bridge` or `cloud-bank` on the plate. The ribbon is the one. Then stop.
