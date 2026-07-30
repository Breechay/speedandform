# FORGE — Website ↔ App Continuity Brief
**Date:** 2026-07-30  
**For:** speedandform / forge-sculpt website Cursor  
**App tree (working):** `/Users/breechay/FORM-iOS-FORGE-OPTICS-WORKING`  
**App SHA (this land):** `f9bcee6f` · branch `forge/recover-cursor-product-plus-optics`  
**Site repo found:** **YES** — `/Users/breechay/Documents/speedandform` (also `/Users/breechay/speedandform`; forge landing at `Documents/speedandform/forge-sculpt`)

Drop this file into the website workspace and tell Cursor: **execute every locked decision below. Do not invent a fourth campaign. Do not keep four-phase / XX placeholders. Align names and tense with the app.**

---

## 0 · How to use this brief

1. Open the site repo at `/Users/breechay/Documents/speedandform` (prefer Documents; home copy is a sibling).
2. Primary FORGE landing: `forge-sculpt/index.html` (and related `train/`, assets).
3. Apply corrections in §5–§9. Prefer deletion over rewrite when audit overlay / obsolete mock language is the problem.
4. When done: curriculum line, tense pair, campaign names, bronze, price, and claim matrix must match this file.

---

## 1 · Voice sequence (locked)

FORGE speaks at **thresholds only**. Quiet during training.

```
WEBSITE   → makes the argument · ends on ENTER THE YEAR
REGISTER  → states the promise, takes the signature · THE YEAR IS WRITTEN
TODAY     → stops talking and gives the work
RECORD    → proves what happened
PAYWALL   → asks whether to continue · CONTINUE THE YEAR
```

**Rule:** Website and Register may argue and promise. Today / Focus / Record glass do not re-sell. Paywall confirms against the athlete’s own Week 1 evidence — it does not re-promise in the present tense.

---

## 2 · Tense law (locked)

| Surface | Line | Tense |
|---------|------|-------|
| **REGISTER** | `EVERY SET HAS A PLACE` | **Present** — promise |
| **PAYWALL** | `EVERY SET HAD A PLACE` | **Past** — proof against Week 1 Record |

Same words. Different truth. If both stay present, it is repetition. If paywall confirms past, it is an arc.

Website footer / bridge copy must not steal the paywall’s past tense before the athlete has evidence.

---

## 3 · Curriculum (locked) — NOT four campaigns / four phases as the year

**Canonical line (exact):**

> **THREE CAMPAIGNS · TWELVE PHASES · ONE 52-WEEK YEAR**

Structure (from app canon / registry):

| Campaign | Name | Phases | Training weeks |
|----------|------|--------|----------------|
| I | **The Frame** | P01–P04 | 1–15 |
| II | **The Depth** | P05–P08 | 16–32 |
| III | **The Base** | P09–P12 | 33–49 |
| — | **The Hold** | — | 50–52 (3-week hold) |

- **49 training weeks + 3-week Hold** = 52-week year, then return to The Frame.
- Do **not** say “four campaigns,” “four-phase curriculum” as the year story, or “Phase N of 4” as the global year claim.
- “Phase N of 4” is only true **inside one campaign** (each campaign has four phases). Prefer **Phase N of 12** or campaign-scoped labels that match the app.

---

## 4 · Phase names (exact — from app registry)

Strip `Breechay Sculpt · ` for short rail labels. Reveal endings close each campaign.

### Campaign I — The Frame (P01–P04)

| # | Registry name |
|---|----------------|
| P01 | Build the Upper Frame |
| P02 | Build the Glute Base |
| P03 | Raise the Glute Peak |
| P04 | **Reveal the First Shape** |

### Campaign II — The Depth (P05–P08)

| # | Registry name |
|---|----------------|
| P05 | Build the Width |
| P06 | Add Thickness |
| P07 | Finish the Rear View |
| P08 | **Reveal the Depth** |

### Campaign III — The Base (P09–P12)

| # | Registry name |
|---|----------------|
| P09 | Build the Lower Base |
| P10 | Glute Peak II |
| P11 | Complete the Silhouette |
| P12 | **Reveal the Complete Shape** |

Program IDs (flagship ladder): `forge_sculpt_phase1_v1` … `forge_sculpt_phase12_v1_fs`. Glass program name: **Breechay Sculpt**.

---

## 5 · Website corrections list (execute)

### 5.1 Audit overlay
- Remove or retire `data-audit` construction chrome (`EXISTS` / `POLISH` / `BUILD — …`) from public athlete-facing HTML once content is real.
- Do not ship red ✕ / audit badges as marketing design.

### 5.2 XX placeholders
- Kill `XX weeks · XX sessions · ~XX minutes`, `WEEKS XX–XX`, `Phases 1–X · XX weeks`, `"Quote pending"`, `PHOTO PENDING`.
- Replace with authored numbers only when true; otherwise omit the row.

### 5.3 Obsolete mockup → live glass language
- Device mock and lede must describe **Today / Focus / Record** as the athlete actually meets them — not a generic workout list UI.
- Prefer: open Today → execute → Record keeps the work. No “plan to choose / exercise to look up” library fantasy.

### 5.4 Marketplace / rewrite refusal
- Keep the refusal: **no workout marketplace** — the athlete may inspect day, week, and year; the assignment remains authored.
- Do **not** claim “you cannot browse” / “nothing to browse.” Inspection (Today, Week, Atlas, Record) is not a catalogue.
- Do not contradict that with “explore programs,” “browse movements,” shop CTAs, or rewrite-your-workout language.

### 5.5 Face-down language
- Retire “put the phone face down” as default gym copy unless it is earned and brief.
- Prefer execution language that matches Focus / Active Session: one screen, log the set, finish.

### 5.6 Bronze family
- Functional bronze: **`#AA8E58`** family (deep `#8A7244`, gilt `#C9B285` as companions).
- Do not invent a second gold system that fights the app.

### 5.7 Price
- Public page and StoreKit must match: **$199.99** annual (`forge_annual` / launch annual).
- Do not invent founding scarcity math on the public page unless the app is still showing it.

### 5.8 Phase name alignment
- Replace legacy site phase titles (**Specialize**, generic **Reveal**, etc.) with the registry names in §4.
- Campaign Reveal endings must be the three Reveal phase names above — not a single vague “Reveal” chapter for the whole year.

---

## 6 · Athlete Register (app — already landed; website must hand off cleanly)

**Composition (locked):**

```
FORGE                 ← canonical upper-left (one cut; not centred 17/26pt splash)
BREECHAY SCULPT
The year is written.

ATHLETE
YOUR NAME
────────────────
◉ ENTER FORGE

EVERY SET HAS A PLACE
```

**Behavior:**
- Blank OK · ENTER FORGE always enabled · no SKIP · no auto-keyboard on first frame
- Separate keys: `forge.athlete.name` + `forge.athlete.nameEntryCompleted`
- Typed name ≠ access-code label · receipt fallback **Athlete**
- Bronze registration sweep ~0.34s · handoff after full ~0.36s (do not cut early)
- Privacy (editor / honesty): **`Stored on this device. Shared only by you.`**  
  — **Not** “Never sent anywhere.”

Website CTA into the app should end on **ENTER THE YEAR** / open the year — then the Register takes the signature. Do not compress the landing argument into the Register.

---

## 7 · Paywall bridge copy + evidence rules

**Job:** Ask whether to continue the year after Week 1 has been lived — not to re-pitch the curriculum.

**Locked moves:**
- Past-tense confirmation: **`EVERY SET HAD A PLACE`** (when evidence exists).
- Evidence line only when earned — e.g. sealed Week 1 session count from the Record (`WEEK 1 · N SESSIONS RECORDED`). No fabricated receipts.
- Headline register may keep structural membership language (`Keep the work decided.` / continue the program) but must not steal Register present-tense promise.
- Trust: declining does not erase Week 1 — position held, week remains in the Record.
- CTA spirit: **CONTINUE THE YEAR** / continue the program — never “unlock the app” theater.

**Hard gate:** No evidence → do not invent past-tense proof. Silence or structural membership copy only.

---

## 8 · Claim matrix — website ↔ app

| Claim | Website | App |
|-------|---------|-----|
| Authorship of the year | Argue it; end **ENTER THE YEAR** | Register: **The year is written.** |
| Sets have a place | May foreshadow; do not past-tense without evidence | Register present → Paywall past |
| Curriculum size | THREE CAMPAIGNS · TWELVE PHASES · ONE 52-WEEK YEAR | Same · 49 training + Hold |
| Phase names | Registry names §4 | `ForgeProgramLibrary` ladder |
| Product surfaces | Today / Focus / Record glass | Today poster, Focus, Record |
| No workout marketplace | Refusal: inspect day/week/year; assignment stays authored | No shop / rewrite surface; inspection allowed |
| Local record | Device-owned; export/deletion under athlete control when true | Local store; name privacy line §6 — do not claim “everything” / progress photos unless shipping |
| Price | $199.99 / year (match StoreKit) | Membership annual list / StoreKit `forge_annual` |
| Speaks when | Landing thresholds only | Register + Paywall; quiet in training |

---

## 9 · Cursor execution checklist

- [x] Replace four-phase / XX / Specialize–generic Reveal copy with §3–§4
- [x] Render three campaigns (The Frame / The Depth / The Base) + Hold honesty
- [x] Align bronze to `#AA8E58` family
- [x] Retire face-down default; fix marketplace refusal (not false “no browse”)
- [x] Update device mock to Today/Focus/Record product glass
- [x] Strip public audit overlay badges
- [x] Set price $199 when marketing is ready to settle
- [x] CTA handoff: ENTER THE YEAR → app Register composition
- [x] Do **not** put `EVERY SET HAD A PLACE` on the website before evidence exists
- [x] Smoke: first viewport still one composition; no dashboard of claims
- [x] Session frequency from registry census (4–7 / week · 267 days · 49 weeks)
- [x] Soften Record claims (no “everything” / progress photos until shipping proves them)
- [ ] Author photography — blocked until a real Brice image is supplied
- [x] FORGE bronze scoped to landing; do not migrate Northstar / `train/` without separate ruling
- [x] Final truth close: illustrative allocation label; Focus plate without SWAP; `$199.99`; programming-decision claim; sample-data disclosure
- [ ] Fresh optics Today/Record screenshots (current JPGs still older chrome; Focus is HTML until capture lands)

**Executed:** 2026-07-30 · `forge-sculpt/index.html` · phone still locked for Forge launch.  
**Truth + glass pass:** 2026-07-30 evening.  
**Final asset + truth close:** 2026-07-30 · Structure/voice frozen.

---

## 10 · Pointers

| What | Path |
|------|------|
| Site (preferred) | `/Users/breechay/Documents/speedandform` |
| FORGE landing | `/Users/breechay/Documents/speedandform/forge-sculpt` |
| Coach/field app subtree | `/Users/breechay/Documents/speedandform/forge` |
| Working iOS app | `/Users/breechay/FORM-iOS-FORGE-OPTICS-WORKING` |
| Register source | `FORM/Forge/ForgeAthleteName.swift` |
| Phase registry | `FORM/Forge/ForgeProgramLibrary+ForgeSculpt*.swift` |
| Canon campaigns | `docs/FORGE_CANON.md` Book III (The Frame / The Depth / The Base / Hold) |

---

*Locked Chat + Claude decisions · 2026-07-30 · drop-in for website Cursor.*
