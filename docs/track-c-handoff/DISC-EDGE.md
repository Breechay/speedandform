# The sun — match the site

The app sun is smaller, sharper, and tighter than the site. Pressure to Pace does not breathe. This is the same leftover as the hairline. Fix the sun. Do not rebuild Today. Do not start Track E from this note.

Look at live `https://speedandform.com/` plate 03 on a phone. Hold it next to Today. The site sun is larger. The title sits in air. There is no line around the circle.

## Size

The dial is the room. The disc is 60% of it.

```css
.dial{ --box: min(112vw, 60svh); top: calc(35svh + 14px); }
.disc{ width: 60%; height: 60%; }
```

On a 390pt phone that is a sun about **262pt** across. Grow Today’s disc to that. Do not keep a small plate and enlarge the type to fill it. The air is the point.

FILE SESSION stays below. The week stays around, receded. The sun may sit closer to FORM than it does now. That is how the site reads.

## Edge

`--disc: #F8F4EC` on `--bone: #F2EEE6`. Paper on paper. **No ring. No stroke. No shadow.**

Week and disc share one mask, on the dial:

```css
radial-gradient(circle at 50% 50%, #000 0 38%, rgba(0,0,0,.62) 54%, transparent 76%)
```

The rim dissolves. The type stays sharp. Do not `blur()` the disc.

## Type inside — this is why it is beautiful

The name is **New York**, weight **400**, not bold, not Fraunces.

```css
.session{ gap: 5px; padding: 0 7%; align-content: center; }
.kick{
  font: 510 10.5px/1 SF;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(11,11,10,.42);
  margin-bottom: 6px;
}
.kick em{ color: #9d7440; font-style: normal; } /* START */
.name{
  font-family: ui-serif, "New York", serif;
  font-size: clamp(21px, 5.5vw, 26.5px); /* ~21–22 on a phone */
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -.021em;
  color: #0b0b0a;
}
.line{
  font: 400 12px/1.55 SF; /* clamp 11.5–12.8 */
  color: rgba(11,11,10,.68);
}
.today{ /* TUESDAY — the site has this. Today should too. */
  font: 500 10.5px/1 SF;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #9d7440;
  margin-top: 8px;
}
```

Stack, in this order, with that air:

```
BUILDS  START     ← kick. ochre on the job word.
Pressure to Pace  ← New York 400. The one beautiful line.
30 min steady · … ← SF. Quiet. Line-height 1.55.
3 × 8 min · …
2 min float …
TUESDAY           ← ochre. The disc names the day.
```

Do not put the struck movement mark between the title and the paces. That is what crushed the air. The mark belongs to the week around the sun, or it sits so quiet it does not steal the title’s field. Pressure to Pace needs the space the site gives it.

Do not track the title out. Do not bold it. Do not set it in Fraunces. A larger sun with this type is the site. A small sun with a heavy title is a badge.

## The week rail — the arc and the air

The week is not a ring around a badge. It is an arc at a fixed distance from the sun. If the labels sit too close, the sun has no field. If they sit on a tight collar, it reads as a picker. Match the site’s geometry.

Disc radius is **30%** of the dial (the disc is 60% across). Labels sit at **r = 46** (percent of the dial, from centre). That 16 points of dial is the air. On a 390pt phone it is about **70pt** from the disc’s rim to the label. Do not pull the week in.

Seven seats, **30°** apart, starting at the left:

```
angle = 180 + i * 30     // degrees. i = 0 MON … 6 SUN
r = 46                   // % of the dial box
x = 50 + r * cos(angle)
y = 50 + r * sin(angle)
```

THU is the top of the arc (`i = 3`, 270°). Scale falls off from there: `1 − abs(i − 3) * 0.04`. The set reads as one.

Phone:

- MON and SUN are gone (`.day.edge { display: none }`).
- SAT and TUE sit further in the fade (`--k: .28`). The others rest at `.62`.
- Static blur `1.15px`. Do not animate it.
- The ring does not light. The disc already names the day.

Each seat is mark above, abbr, word — around the sun, not inside it.

```
WED Easy     THU Speed     FRI Easy
     TUE Intervals               SAT Long run
```

If the sun grows and the week stays on the old radius, the labels will sit on the disc. Move them out to r=46 of the new dial. The distance is the instrument.

## Done when

A phone shot of Today next to plate 03 reads as the same instrument: larger sun, no hairline, Pressure to Pace sitting in air, TUESDAY at the bottom, the week an arc at the site’s distance, rim gone into paper.

## Do not

- A ring, a glow, a drop shadow
- Blur the words inside the sun
- Fill a small disc by enlarging or bolding the title
- Put the barcode mark between the name and the paces
- A tight collar of days against the disc
- Light the selected day on the ring
- Rebuild Today
- Start the dragon from this note
