# Disc edge — match the site

The app sun is a hard circle with a hairline. The site sun is not. This is a Track C leftover. Fix it. Do not reopen C1–C8. Do not start Track E from this note.

Look at live `https://speedandform.com/` plate 03 on a phone. The disc has no line. Paper sits on paper. The rim dissolves.

## What the site actually does

`--disc: #F8F4EC` on `--bone: #F2EEE6`. A shade lighter. **No ring. No stroke. No shadow.**

The week and the disc share one mask, on the dial, not on the type:

```css
.dial{
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0 38%, rgba(0,0,0,.62) 54%, rgba(0,0,0,0) 76%);
  mask-image: radial-gradient(circle at 50% 50%, #000 0 38%, rgba(0,0,0,.62) 54%, rgba(0,0,0,0) 76%);
}
.disc{
  width: 60%; height: 60%;
  border-radius: 50%;
  background: var(--disc); /* #F8F4EC */
  /* no border, no box-shadow, no filter */
}
```

The disc is 60% of the dial. That mask is already falling off as it reaches the disc’s rim, so the circle does not end. It becomes paper.

The **type stays sharp.** Pressure to Pace is not blurred. The week around it is (`blur(1.15px)`). Depth is by focus, not by blurring the page.

## What to do

1. Kill the hairline / stroke / shadow on the sun.
2. Fill `#F8F4EC`. Paper `#F2EEE6`.
3. Put the site’s radial mask on the instrument (week + disc together), or an equivalent fade on the disc fill so the rim dissolves. Opaque through the type. Gone by the edge.
4. Do not `blur()` the disc. That would blur the session.

Done when a phone shot of Today next to the site disc reads as the same sun: no line, rim gone into paper, type still sharp.

## Do not

- A ring, a glow, a drop shadow
- Blur the words inside the sun
- Rebuild Today
- Start the dragon from this note
