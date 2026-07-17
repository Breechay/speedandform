# FORGE — Design & Voice Northstar

**Document role:** The canonical, agent-readable design system for FORGE — what the athlete **sees and feels**. It governs representation and taste, never database authority or product behavior (those live elsewhere; see §0). This is the reference the Cursor gates point to.
**Northstar (evidence, not law):** `forge-sculpt/index.html` (marketing) · `forge-sculpt/train/index.html` (portal) · https://speedandform.com/forge-sculpt/train/
**Native evidence:** `FORM-iOS/FORM/Forge/ForgeCanon.swift` and approved production components. Fixture/slice views are references, never automatic production authority.
**Status:** **RATIFIED · July 16, 2026.** Amend here by explicit ruling before implementation—never by promoting whatever is currently live.

> **Luxury discipline, not luxury decoration. The page is square. Numbers are mono. Gold is earned. Copy is provable.**

---

## 0. Authority — this document is not self-ratifying, and neither is live code

The single most important rule: **live implementation is *evidence*, not constitutional law.** If Cursor makes a mediocre choice, ships it, and a later agent reads it back as canon, mediocrity self-ratifies. That loop is forbidden. When implementation and canon disagree, **flag the drift** — do not silently rewrite canon around whatever happens to be live.

### Precedence (highest wins)

```
1. Ratified product & behavioral contracts   (what the product does / promises)
2. Ratified FORGE Design Northstar (this doc)  (what it looks and feels like)
3. Canonical tokens & shared components        (the literal values / component APIs)
4. Surface-specific approved contracts         (e.g. Focus logging, account receipt)
5. Current implementation                      (evidence of intent — never self-ratifying)
```

### Authority map — which document wins for what

| Domain | Winning authority |
|---|---|
| **Product behavior** (what the product does, cross-device promises, continuity) | `FORM-iOS/docs/FORGE_ACCOUNT_CONTINUITY_MASTER.md` + `FORM-iOS/docs/FORGE_START_HERE.md` |
| **Design judgment** (look, feel, voice, surface classes, taste) | **This doc — `FORGE_DESIGN_NORTHSTAR.md`** |
| **Implementation tokens & shared components** | Web: `forge-sculpt/train/index.html` `:root` token layer. Native: adopted roles in `FORM-iOS/FORM/Forge/ForgeCanon.swift` plus approved production components |
| **Account architecture** (schema, RLS, identity keys, who reads/writes) | `FORM-iOS/docs/FORGE_ACCOUNT_CONTINUITY_MASTER.md` §§16–18 |
| **Enforcement** (preventing bypass of any of the above) | The `.mdc` gates — web (`forge-design-northstar.mdc`) + native companion |

This doc governs design judgment and token semantics. Literal web token values live in the portal's `:root`; literal native values live in the adopted native token layer. The values below are an auditable snapshot, not an independent implementation source. This doc **defers** on product behavior and account authority.

---

## 1. Surface classes — name the class before you touch a pixel

The landing page, the program map, the active session, the account receipt, and settings do **not** share one visual job. Applying conversion-page intensity to an account receipt is a defect. Every FORGE surface is one of five classes, and the class sets the rules for CTA, gold, anatomy, motion, and ceremony.

| Class | Where | Character |
|---|---|---|
| **Conversion** | Landing, App Store handoff, public sample | Emotional composition allowed · stronger anatomy · filled primary CTA allowed · promise **plus real proof** · never fake functionality |
| **Orientation** | Program, phase, week | Position first · anatomy may explain emphasis · moderate ceremony · one obvious continuation route |
| **Execution** | Session, Focus | Prescription dominates · eight-second glance · minimal navigation · no decorative competition · operational motion only |
| **Receipt** | Session close, week close, account, sync status | Confirmed facts · no celebration theater · no inferred status · quieter visual weight · action subordinate to evidence |
| **Settings** | Identity, privacy, deletion, support | Smallest footprint · no cross-selling · no progress dashboard · no decorative anatomy unless it has an explanatory job |

### Per-surface CTA & gold

| Surface | Primary CTA | Gold |
|---|---|---|
| **Conversion / marketing** | Filled bone allowed | Promise, state, structure |
| **Orientation** | Filled bone allowed sparingly | Current phase, coordinates, active structure |
| **Execution — Session** | Filled action only for the dominant training action | Key state and execution |
| **Execution — Focus** | Minimal operational controls | Checked state and position |
| **Receipt / account** | Usually outline / text; filled only for a true dominant action | Confirmed position or critical state only |
| **Settings** | Outline / text | Only where it marks a real fact |
| **Apple authentication** | Official Apple control | Not FORGE-styled |

**The governing law:** *Filled primary actions exist in the FORGE system, but only one may dominate a surface, and receipt/account/settings surfaces default quieter unless the action is genuinely primary.* This is how the web northstar overrides the old "zero filled buttons" rule **without** making every quiet account screen look like a conversion panel.

---

## 2. Literals live only in the token layer

"Never hardcode" as an absolute is impractical — token definitions and this doc contain literals by necessity. The real rule:

- **Canonical token definitions** (`:root`, ForgeCanon): literal values allowed — this is where they belong.
- **Component & page implementation:** repeated semantic color/type/radius/motion/touch values consume tokens or approved component APIs.
- **Responsive composition:** local layout values are allowed when they do not create a competing semantic design role.
- **True semantic exceptions:** a one-off design role requires a canon update or explicit, documented justification.

If you need a value that isn't in the token layer, it doesn't exist yet — ratify it, don't scatter it.

---

## 3. Color tokens (dual theme)

The portal (`train/index.html`) is the canonical themed system. Dark is default; light is a full native inversion via `[data-theme="light"]`. The marketing page uses the same palette family under legacy names (`--ink`/`--black`/`--bone`/`--gold`); prefer the portal names.

### Dark (default)

| Token | Value | Use |
|---|---|---|
| `--bg` `#090908` · `--bg-2` `#0E0E0C` | | Page grounds (warm near-black) |
| `--surface` `#10100E` · `--surface-2` `#151512` · `--surface-3` `#1A1916` | | Panels / raised / highest |
| `--text` `#F0ECE3` · `--text-2` `.72` · `--text-3` `.48` · `--text-4` `.29` | | Type ramp (bone alphas) |
| `--line` `.13` · `--line-2` `.07` · `--line-strong` `rgba(201,167,104,.38)` | | Hairlines / faint / gold-active |
| `--accent` `#C9A768` · `--accent-2` `#B08D4F` · `--accent-dim` `rgba(176,141,79,.34)` · `--accent-soft` `rgba(201,167,104,.105)` | | Gold — the one accent |
| `--btn-fill` `#EEE8DC` · `--btn-text` `#0A0A09` | | Primary button (bone / ink) |
| `--nav-bg` `rgba(9,9,8,.84)` | | Nav / sticky (blur backdrop) |

### Light (`[data-theme="light"]`)

| Token | Value |
|---|---|
| `--bg` `#F2EEE6` · `--bg-2` `#EDE7DD` · `--surface` `#F9F6F0` · `--surface-2` `#F3EEE5` · `--surface-3` `#EAE2D6` |
| `--text` `#19150F` (+ `.72/.50/.32` alphas) · `--line` `rgba(62,48,31,.15)` (+ `.08`) · `--line-strong` `rgba(140,96,41,.34)` |
| `--accent` / `--accent-2` `#8C6029` · `--accent-dim` `rgba(140,96,41,.25)` · `--accent-soft` `.075` |
| `--btn-fill` `#1B1711` · `--btn-text` `#F8F4EC` (button inverts: ink fill, bone text) |

**Layout snapshot:** `--pad: clamp(20px,5vw,48px)` · `--maxw: 840px` for training routes · `--homew: 1180px` for the portal entrance.

---

## 4. Type — three faces, three jobs

Loaded: `Jost:wght@300;400;500;600` · `JetBrains+Mono:wght@400;500` · `Instrument+Serif:ital@0;1`.

```
Jost             = explanation        — body, movement names, sentences that sound spoken
JetBrains Mono   = coordinates / data / facts
Instrument Serif = signature, one phrase, ceremony only   (italic)
```

| Face | Var | Where |
|---|---|---|
| **Jost** | `--sans` (300 body) | Body, movement names, ledes. The name is *explanation, not ceremony.* Passes the aloud test. |
| **JetBrains Mono** | `--mono` (400/500) | Eyebrows, labels, values, stats, coordinates, tags, stamps. Uppercase, `.10–.22em`. Exempt from the aloud test. |
| **Instrument Serif** | `--serif` (italic) | One signature phrase; approved ceremonial numerals (e.g. giant phase `01`). Never body, never a paragraph. |

### The numbers law (narrowed — this is the corrected version)

> **Operational numbers, coordinates, values, metrics, dates in receipts, input values, and standalone counts are mono.** Numbers embedded naturally inside spoken explanatory Jost sentences **inherit Jost** (e.g. "Train 6 days each week"). Ceremonial phase numerals may use Instrument Serif **when explicitly approved.**

So `SET 3 OF 5`, `48h`, `Week 4`, `225 lb`, `Ended 12 June 2026` → mono. "Six weeks, then it closes." inside a sentence → Jost. A hero phase `I` in a ceremonial card → approved serif. Do **not** blanket-reject every serif/Jost digit.

---

## 5. Geometry — the page is square

| Radius | Value | Use |
|---|---|---|
| `control` | **2px** | "2pt is the ceiling for anything operational." |
| buttons / inputs | **0** | Portal `.btn` and inputs are fully square |
| `surface` | **14px** | Raised device chrome / the "plate" only — not a pill |
| pill | **999px** | Small mono chips only: `.tag`, `.modebar`, `.sharebtn`, dots |

| Touch | Value | Why |
|---|---|---|
| `logSet` | **64px** | The set-log action — ~7,500 presses/program |
| minimum | **48px** | Steppers / controls |
| floor | **≥44px** | Anything tappable |

---

## 6. Buttons, gold — governed by surface class (§1), not globally

### Buttons

- **`.btn` (primary):** `--btn-fill` bone, `--btn-text` ink, mono 10px `.17em` uppercase, `padding:15px 22px`, `radius:0`, `width:100%`; hover `translateY(-1px) brightness(.96)`. Filled — correct on Conversion/Orientation, and for the *one* dominant action on a surface. On Receipt/Settings, default to `.btn-ghost` / text unless the action is genuinely primary.
- **`.btn-ghost` (secondary):** transparent, `--text-2`, `border:--line`; hover `--line-strong`. The default on quiet surfaces.
- **`.mini`** / **`.mini.done-state`**: compact / quiet-complete.
- **Only one filled primary may dominate a surface.** Competing filled CTAs → reject.

### Sign in with Apple — official control only

> Use Apple's official Sign in with Apple control or the platform-provided implementation. **Do not redraw, substitute, approximate, or restyle the Apple logo.** Web: Apple's Sign in with Apple JS button / official control. Native: `ASAuthorizationAppleIDButton`.

Custom SVG approximations of the Apple mark are prohibited in shipped code. (Prototypes may fake it; production may not.)

### Gold (`--accent`) — earned, rationed, surface-scoped

Gold marks **state and structure**, never paint. Its budget per surface is in §1's table. Hard stops (retained): gold as confetti, double-anchor zones, unearned emphasis, glow/bloom on operational CTAs, gloss/gradient "fake premium." If gold isn't marking a real fact or structure, remove it.

---

## 7. Theme worlds — dark and light are both native (corrected)

Dark and light are **native worlds**, not "dark = anatomy, light = none."

> **Light mode uses only light-native anatomy: ink, graphite, sepia, or restrained bronze studies composed for cream. Never filter a dark-native asset into light mode. A surface may remain typographic when no correct light-native asset exists.**

Evidence in the live portal: the hero swaps `ASSET.hero` (`anatomy-reveal.webp`, dark) ↔ `ASSET.heroLight` (`hero-light.webp`, authored for cream), and phase cards use `.dark-only` anatomy vs a `.light-only` serif numeral. That is the pattern: each world gets its **own** authored treatment; where a light-native asset doesn't exist yet, light falls back to typographic — a fallback, not a law. Never run a dark asset through a filter to fake light.

---

## 8. Motion

Functional only. Transitions `.2–.25s`; hover lifts `translateY(-1px/-2px)`; staggered reveals `.08/.16s`. **≤220ms on operational (Execution) paths.** No bounce, dopamine, or cinema on high-frequency actions.

---

## 9. Component grammar — mirror the app

The web and native products share judgment, not an assumption that fixture code is production canon.

- **Logging field** follows the approved operational grammar: mono label, mono value, mono unit, immediate touch target, sourced truth.
- **The plate** = device chrome (`surface`, `--line`, `radius:14`, soft shadow). Chrome, not a pill.
- **Portal Session / Focus** follow the ratified temporary portal contract. Native mode behavior remains governed by `FORM-iOS/docs/FORGE_LOGGING_MODE_REGISTRY.md`, `FORM-iOS/docs/FORGE_LOGGING_MODE_AUDIT.md`, and Active Session doctrine; fixture views do not ratify production behavior.
- **Session mode (web)** = editorial training sheet: computed facts, key-lift from `isPrimeMover`, cues/subs one tap away.
- **Panels** (`.resume-rail`, `.program-panel`, `.account-panel`, `.launch-panel`): `surface`, `--line`, subtle shadow/glow.

---

## 10. Voice

- **Three registers** (§4): Jost sentences sound spoken; mono is signage/coordinates/facts (short, accurate); Instrument Serif is one signature phrase.
- **Chrome = facts, not lessons.** No periodization jargon or coaching essays on chrome. One fact, one place.
- **Claims must be provable.** *"You open it. You execute." is true only because the machine runs.* No hype, begging, flattery, over-explaining, or "luxury" words without evidence.
- **No signal → empty string.** No counterfeit care.
- **Honest persistence.** Say what is actually true about where data lives; never imply sync that hasn't happened (see §11).

---

## 11. Account & continuity — representation only (corrected)

> **Account truth and authorization come from the ratified continuity architecture. This design gate governs representation, never database authority.**

This doc does **not** define tables, RLS, or identity keys. It defers to
`FORM-iOS/docs/FORGE_ACCOUNT_CONTINUITY_MASTER.md`; the portal handoff records
implementation status only. What the **design** layer governs on account/receipt surfaces:

- **Which facts may render** — only confirmed truth; nothing inferred.
- **How certainty is communicated** — *server-confirmed or silent.* `Last synced: Just now` is a claim; render it only from a real round-trip this session, else `Not confirmed`, or omit. Never infer sync or import completeness.
- **How access loss appears** — entitlement can lapse; the record remains. Losing access must never read as losing the work.
- **How pending / synced / offline states differ** — distinct, honest, never a spinner-as-gate; local writes are safe when the server is unreachable.
- **How identity is described** — Apple is a *method*; the account is one identity; a relay address is *contact*, not the key; the athlete is never asked to authorize a merge. (Described in athlete terms; the actual keying is the schema ruling's job.)
- **No premium framing** — absence of entitlement is a fact (`Not on this account`), not an offer. No Upgrade / Unlock / lock glyph / blurred preview.

---

## 12. Ceremony tiers & taste filter

Name the tier (it composes with the surface class in §1):

| Tier | Frequency | Rule |
|---|---|---|
| **Operational** | 300+/yr | Square; no cinema/glow/nested forms/keyboard-first; one dominant read; ≥44/48 touch; motion ≤220ms |
| **Ritual** | ~12–52/yr | Voice OK; no splash |
| **Ceremonial** | 1–12/yr | Weight + ritual; Instrument Serif signature lives here |

**Reference standard** (a taste *prompt*, never a substitute for the athlete's job or an existing component contract): **Ritz / Porsche / Yacht / Watch** — which principle governs?

Quick filter — any *no* → refine: 1. Prepared room or feature collection? 2. Serious buyer respected? 3. Good on the 100th open? 4. Gold earned? 5. Copy necessary **and provable**? 6. Anything cheap, loud, or needy? 7. Both themes native and correct?

---

*Live source is evidence, not law (§0). If this doc and the shipped page disagree, flag the drift and adjudicate—do not auto-promote the live code. Native behavior follows tracked FORM-iOS product and execution contracts; adopted `ForgeCanon` roles implement those contracts but do not outrank them.*
