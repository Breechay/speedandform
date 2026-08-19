# Track E — weather on Today

Implement in FORM-iOS. Today is already the instrument. This pass adds the dragon the way the site has it.

Look at live `https://speedandform.com/` plate 03 on a phone. Then look at `ref/01-plate-dragon.png`. Same animal. Same corner. Same dissolve.

Do not start E1–E5. Do not reopen Track C. Do not reopen Track D.

---

## What this is

Weather around the instrument. Not a character. Not a third object. Not a poster on the session.

On the site the dragon lives in the bottom-right of the bone room. On the app it lives in unused lower field — behind chrome if it must, never over the work.

Today still has one dominant read. FILE SESSION is still the action. If the dragon makes the athlete look twice, it is wrong.

---

## E-weather · The dragon

Same file as the site: `media/dragon-tail.webp` (PNG twin for the catalog). Do not redraw it. Do not desaturate it. Do not bake a fade into a new export.

### Placement (app)

- Unused lower-right field.
- Does not cover the disc.
- Does not cover FILE SESSION or SESSION DETAILS.
- Does not compete with the W1 tab.
- Mid-right of the phone stays almost empty. Fins do not climb into the middle of the screen.
- Orange and teal consume that corner. A cream pocket around the art reads as a stamp. Fill the corner.

### Treatment (from live `/`, `rd48`)

Copy this. Do not invent a nicer one.

- Own image layer. Never a background fill. Never composited into the paper texture.
- File stays saturated. **No blur, wash, grain, tint, or blend on the art.**
- Atmosphere is a **mask on the container**, not on the file. The pigment stays. The form dissolves toward the room.
- Mask: radial, origin low-right of the box (`88% 108%`). Corner holds. The edge facing the sun and the copy falls away.
- The drift is on the **image**. The mask stays put. The form moves through the veil, not with it.
- Crop must read as a form entering the frame — not a shard the phone clipped. Enough curve and scale. Never the whole contour. Never a head, eyes, claws, or a complete beast.
- Site crop to match: width `min(86vw, 560px)`, `right: -14%`, `bottom: -6%`, image offset `left: 2%` / `top: 2%`, opacity `.92`.
- Arrives with the room. Not a flying entrance. On the app: it is there. It does not perform.

Exact CSS: `extracts/dragon.css`.

### Motion

`weatherDrift`: **54s**, ease-in-out, alternating, **−8px / −10px** and **−0.6°**, origin **80% 80%**.

Slow enough that you never catch it moving, only notice that it has. Faster is a performance, and a performance is wrong.

ROADMAP E4’s grammar (30–90s, 2–6px) is the same idea. Do not add a second motion system. This is the motion.

Rest days may sit a few percent quieter. Interval days do not need a show. A few percent. Not a parade. If you cannot do quiet-by-day without building a weather engine, ship one crop and stop.

### Cloud

Do not. Parked on the site. Two passes failed (wash = dirt smudge; kumo = right medium, wrong crop). Do not restore. Do not invent a third.

### Weather data

Do not. No forecast API. No plan tier. No “cloudy because recovery.” The picture does not have to earn itself with a number.

---

## Done when

1. Phone screenshot of Today next to `ref/01-plate-dragon.png` reads as the same weather, compressed around the instrument.
2. FILE SESSION, the disc, and the tab are untouched.
3. No cloud.
4. No blur or blend on the file.
5. You cannot catch it moving.

Then stop. Mark E-weather `[x]` in `ROADMAP.md` with the date. Leave E1–E5 `[ ]`.

---

## Do not

- Rebuild Today
- Port site copy onto Today
- Cover the sun, FILE SESSION, or the tab
- Show the whole dragon, a head, eyes, claws, or a mascot
- Recolor, desaturate, or drop opacity until it is a stain
- Blur or blend the file to fake atmosphere — the mask is the veil
- Put a cloud back
- Attach the art to weather data or to a plan tier
- Reveal the dragon as a reward, a streak, or a compliance prize
- Start chapter-close, Week Print, or haptics
- Reopen Track D unless a new string fails the guard
