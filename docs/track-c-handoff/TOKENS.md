# Tokens — from live `home.css` (`rd44`)

Do not invent tokens. These are in the file.

## Colour

| Token | Hex / value | Use |
|---|---|---|
| `--ink` | `#0b0b0a` | Type, tab, CTA stroke on bone |
| `--bone` | `#F2EEE6` | Today paper |
| `--ivory` | `#f6f2e8` | Placard panel |
| `--disc` | `#F8F4EC` | Sun. Paper on paper, a shade lighter. No ring, no shadow. |
| `--paper` | `#eee8db` | Site films paper (not Today) |
| ochre | `#9d7440` | Kick emphasis (`settle` / `hold`), day name in the disc, Long in the week list. One ochre job per composition. |
| rest | `rgba(11,11,10,.38)` italic | Rest in the week list |
| week abbr | `rgba(11,11,10,.4)` | MON TUE… in the placard |
| CTA on bone | ink, `border-color: rgba(11,11,10,.35)`, fill transparent | FILE SESSION |

## Type — three faces, not two

This is the call Claude got slightly wrong. Read it twice.

**Inside the sun, the session name is not Fraunces.** Live CSS:

```css
.name{
  font-family: ui-serif, 'New York', 'Iowan Old Style', Palatino, Georgia, serif;
  font-size: clamp(21px, 5.5vw, 26.5px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -.021em;
  color: var(--ink);
}
```

On iPhone that is **New York**. The interior typography lock already uses this. Keep it. Brice said he likes the font inside the sun — that is this face.

| Layer | Face | Where |
|---|---|---|
| Authored name inside the disc | **New York** (`ui-serif`) | Session title: *Pressure to Pace*, *Clean Rhythm* |
| Authored name outside the disc | **Fraunces** | Site headline, site FORM lockup, placard title *Half Marathon*, week session words in the placard |
| Measured | **SF** (`-apple-system` / SF Pro) | Paces, splits, durations, kick, day name TUESDAY, FILE SESSION, week abbreviations |
| Tab | **SF Mono / JetBrains Mono** on the site; SF on the app is fine if the app tab already is | `W1` |

Never set a pace in a serif.

### FORM lockup (C1) — this is Fraunces

```css
.id{
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 380;
  font-size: 17px;
  letter-spacing: .22em;
  line-height: 1;
}
.inst.light .bar .id{ color: var(--ink); }
```

Letterspaced serif caps. Not SF. Not the current app lockup.

### Kick and day inside the disc

```css
.kick{
  font-family: var(--sans); /* SF */
  font-size: 10.5px;
  font-weight: 510;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(11,11,10,.42);
}
.kick em{ color: #9d7440; font-style: normal; }
.today{ /* TUESDAY */
  font-family: var(--sans);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #9d7440;
}
.line{
  font-size: clamp(11.5px, 3.2vw, 12.8px);
  font-family: var(--sans);
  color: rgba(11,11,10,.68);
  line-height: 1.55;
}
```

## Disc and week (C4)

```css
.dial{
  --box: min(112vw, 60svh);
  top: calc(35svh + 14px);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0 38%, rgba(0,0,0,.62) 54%, rgba(0,0,0,0) 76%);
}
.disc{ width: 60%; height: 60%; background: var(--disc); /* no ring, no shadow */ }
.day{ filter: blur(1.15px); /* static. do not animate the blur */ }
```

Phone: MON and SUN are gone (`.day.edge{display:none}`). SAT and TUE rest further in the fade (`--k: .28`). The disc already names the day. Do not light TUE on the ring.

## Tab and placard (C6)

```css
.week-tab{
  width: 30px; height: 106px;
  left: 0; top: 34svh;
  background: var(--ink); color: var(--bone);
  font-size: 11px; letter-spacing: .2em;
}
.placard{
  width: min(78vw, 330px);
  background: var(--ivory);
  border-right: 1px solid rgba(11,11,10,.10);
}
.placard-open .dial{
  transform: /* existing */ translateX(min(39vw, 165px));
  opacity: .34;
}
```

The instrument steps aside. It is not covered.

### Placard type

| Class | Face | Size |
|---|---|---|
| `.pl-eyebrow` THE PLAN | mono / SF caps | 10px, tracking `.24em`, ink .42 |
| `.pl-title` Half Marathon | Fraunces | 26px / 400 |
| `.pl-race` | SF | 12.5px, ink .5 |
| day abbr | mono / SF | 9.5px, tracking `.16em` |
| session word | Fraunces | 17px / 400 |
| `.long` | same, `#9d7440` | |
| `.rest` | italic, ink .38 | |
| `.pl-line` | Fraunces 300 | 15px, ink .6 |

## FILE SESSION (C5)

Site Begin on bone:

```css
.cta{
  display: inline-flex; align-items: center; gap: 16px;
  border: 1px solid …;
  padding: 18px 30px;
  font-size: 11px;
  letter-spacing: .2em;
  text-transform: uppercase;
}
.inst.light .persistent-begin{
  color: var(--ink);
  border-color: rgba(11,11,10,.35);
  background: transparent;
}
```

A hairline-underlined word is not this. SESSION DETAILS stays unboxed, quieter, below.

## Motion

`--ease: cubic-bezier(.22, .61, .36, 1)`  
Placard: `.62s` transform, `.4s` opacity.  
Tab tell (already in the app’s spirit): 6px, once, never again. Do not add a second tell.

## Marks (already in both places)

| Type | Mark |
|---|---|
| Easy | one dot |
| Intervals | three tight dots |
| Speed | three spaced dots |
| Long run | arc |
| Rest | dash |
| Threshold | bolt — in the app, not on the site plate |
