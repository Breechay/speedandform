# INTERIOR TYPOGRAPHY LOCK — the language inside the Sun (2026-08-07)

**Status: LOCKED protected asset.** Captured from a phone pass Brice loved, before the
old Studio (which produced these interior treatments) is retired. This is the *editorial
language of the Sun's center* — not the specific week programming in those screenshots,
which was fixture/Studio scenarios and is **not** authoritative.

Governed by the project operating principle (see [[RECONCILIATION]]): evidence outranks
doctrine. This lock exists because we have strong evidence — Brice's unprompted reaction —
that this interior hierarchy is right. Layer 2 **expands the Sun around this language; it
does not reinvent the center.**

---

## The locked interior hierarchy (six registers)

Read top → bottom, and the Sun is allowed to stop early when less is enough.

| # | Register | Renders from | Examples |
|---|----------|--------------|----------|
| 1 | small spaced uppercase **role / context** | `face.movementLabel` | `BUILDS SETTLE` · `BUILDS HOLD` · `BUILDS START` · `THE WEEK BREATHES` |
| 2 | large **serif declaration** | `face.title` | `Threshold 4×4` · `Easy 40` · `Long run 100 min` · `Strides 6×20s` · `Rest` |
| 3 | secondary **prescription** (quiet sans) | `face.doseLines[…]` | `4 × 4:00 at 4:35–4:45` · `75 min easy` |
| 4 | tertiary **condition / recovery** (reduced opacity) | `face.doseLines[…]` | `3:00 float` · `conversational` · `no faster` · `after an easy 40` |
| 5 | **evidence relationship** (serif, when it matters) | `slot: .band(…)` | `4:41 average · authored 4:35–4:45` |
| 6 | **ochre contextual line** (only when appropriate) | `face.stateLine` | `TODAY` · `TODAY · THE FIRST ONE` |

The beauty is the **alternation**: serif authority (1-large, 2) + quiet utilitarian
annotation (3, 4) + opacity + a single ochre human touch (6). Evidence (5) speaks in
serif only when FORM actually learned something.

## Two Layer-2 design laws (added by this lock)

1. **The interior typography is a protected asset.** Session anatomy is added *around and
   behind* it. Geometry must **support** this typography, never replace, compress,
   stylize, or mechanically normalize it. When radial anatomy arrives, this order —
   *what was asked → structure → supporting condition → what happened vs authorship →
   temporal context* — is preserved.
2. **The Sun may say less when less is enough.** Threshold can be information-rich; Rest
   can be almost nothing; both keep the same character. No rigid four-row template — the
   center accommodates different authored truths without changing the object.

---

## The six interior families ALREADY EXIST as fixtures

Survey of `FORMMovementLabFixtures.swift` at the committed green state — this language is
already in the tree; the lock's job is to make sure a future layer can't silently degrade
it. Locations are approximate (they shift as the file is re-cut); the **strings** below
are the authoritative record.

| Family | Exact interior strings (locked) | Currently lives at |
|--------|--------------------------------|--------------------|
| **Threshold + evidence** (strongest reference) | `BUILDS SETTLE` / **Threshold 4×4** / `4 × 4:00 at 4:35–4:45` / `3:00 float` / band `4:41 average · authored 4:35–4:45` / `TODAY` | band-rows scenario (~75–95) + standalone threshold fixture (~372) |
| **Easy conversational** | `BUILDS SETTLE` / **Easy 40** / `conversational` / `no faster` / `TODAY · THE FIRST ONE` | `weekZero` (~326–329) |
| **Easy ceiling** | `BUILDS SETTLE` / **Easy 40** / `Ceiling 7:30` / `TODAY` | band-rows scenario (~103–121) |
| **Strides after easy** | `BUILDS START` / **Strides 6×20s** / `after an easy 40` / `TODAY` | band-rows scenario (~163–165) |
| **Long with finish** | `BUILDS HOLD` / **Long run 100 min** / **`last 20 steady`** *(see correction)* / `TODAY` | band-rows scenario (~135–137) |
| **Rest contextual** | `THE WEEK BREATHES` / **Rest** / `between Tuesday's threshold` / `and Sunday's long run` / `TODAY` | standalone rest fixture (~234–236) |

## Vocabulary corrections carried by the lock

- **Long Run — the one live edit.** The existing fixture reads `dose: ["last 20 at hold"]`.
  `hold` here collides with the *Hold chapter* concept. Change to the authored job:
  **`last 20 steady`** (or `last 20 at HM effort` when that is what the session asks).
  The `last 20 at hold` composition is preserved for reference, but the locked vocabulary
  is `last 20 steady`.
- The `Long Run / 75 min easy / Finish with 15 min steady` treatment (from the copy cut)
  is the canonical long-run editorial density.

---

## Deferred code actions (do NOT touch the kit until after the L1.1 phone gate)

L1.1 is applied but **not yet gated on Brice's phone**. Nothing new goes onto the kit
until that gate is clean. When it is (or folded into the Layer 2 cut):

1. **Apply the Long Run vocabulary fix** `last 20 at hold` → `last 20 steady` in
   `FORMMovementLabFixtures.swift` (Lab source of truth → vendor byte-identical to FORM).
2. **Consolidate stable reference names** — give the six families durable `ref*` handles
   (`refThresholdEvidence`, `refEasyConversational`, `refEasyCeiling`, `refStridesAfterEasy`,
   `refLongWithFinish`, `refRestContextual`) so they can be called up six layers from now,
   independent of whichever Studio scenario currently hosts them.
3. **Add a regression test** — the actual mechanism that catches degradation. One
   assertion block per family against the locked strings, e.g.:

   ```swift
   func testInteriorLanguageReferencesHoldTheLockedHierarchy() {
       let t = FORMMovementLabFixtures.refThresholdEvidence
       XCTAssertEqual(t.face.movementLabel, "BUILDS SETTLE")
       XCTAssertEqual(t.face.title, "Threshold 4×4")
       XCTAssertEqual(t.face.doseLines, ["4 × 4:00 at 4:35–4:45", "3:00 float"])
       XCTAssertEqual(t.face.stateLine, "TODAY")
       if case .band(let line) = t.slot {
           XCTAssertEqual(line, "4:41 average · authored 4:35–4:45")
       } else { XCTFail("threshold reference must carry the evidence band") }
       // …one block per reference family; Long uses "last 20 steady".
   }
   ```

4. **Surface them in the rebuilt Studio** under a new **REFERENCE / INTERIOR LOCK** section
   of `todayBenchStates`, so the locked families can be judged cold on the phone.

> Schema notes for whoever applies this: `face.movementLabel` (uppercase role), `face.title`
> (serif declaration), `face.doseLines` (prescription + condition), `slot: .band(String)`
> (evidence line), `face.stateLine` (ochre context). `FORMMovement` cases are
> `start · settle · hold · finish` (Rest/Strides use `.start`/`.hold`/`.settle` as the
> existing fixtures do — there is no `.rest`/`.push` movement). `CeremonyEligibility` is
> `eligible · struckNoChange · alreadyPlayed · notApplicable` (no `.none`). Match the real
> enums at apply-time; the **strings** in registers 1–6 are what is locked.

---

## The tense system — LOCKED product asset

A second phone pass showed the interior language already **changes tense** to say where you
are in time. This is the stronger asset: *FORM changes tense before it changes layout.* The
same Sun tells you what is asked, what was asked, what happened, what didn't happen, and what
is intentionally not being asked — **without becoming five different screens**. No badges
("past", "missed", "viewing history", "off-season"). Grammar carries it.

| Tense / state | `movementLabel` (register 1) | `stateLine` (register 6) | Meaning |
|---|---|---|---|
| **Today / future** | `BUILDS SETTLE/HOLD/START` | `TODAY` (ochre) | what today is intended to develop — *describes what to do* |
| **Historical / consult** | `BUILT SETTLE` | `SUN 2 AUG` (date, not ochre) | work that happened — *describes the shape that was authored* |
| **Past unfiled** | `WAS TO BUILD SETTLE` | `WED 5 AUG` | authorship existed; the session may or may not have occurred — no guilt |
| **Absence** | `WAS TO BUILD HOLD` | `THE RING KEPT ITS PLACE`¹ (+ `not run`) | authored intention + continuity stated without blame |
| **Protected** | `THE WEEK BREATHES` | `TODAY` (title `Protected`) | lawful quiet — intentionally held |
| **AWAY** | `AWAY` | `TODAY` (title `Rest`) | suspended span, one lawful quiet |
| **Between races** | `BETWEEN RACES` | `FORM IS NOT READING THESE` (+ `no pace, no window` / `run only if you want to`) | off-cycle; FORM explicitly not judging |
| **Post-season** | *(title)* `the season is filed` | `NOTHING IS AUTHORED` | the campaign is closed |

**Tense law:** BUILDS = intended to develop · BUILT = happened · WAS TO BUILD = was authored,
regardless of occurrence · THE WEEK BREATHES / BETWEEN RACES / AWAY = kinds of lawful quiet.

**Corollary law:** *Future/Today describes what to do; History describes the shape that was
authored.* e.g. Today Long Run wants the specific dose (`70 min easy` / `Finish with 20 min
steady`); the **historical** summary may compress to `easy with a steady finish`.

¹ **Not locked literally:** `THE RING KEPT ITS PLACE` — now that the Sun (not a ring) is the
dominant object, the noun "ring" isn't guaranteed. Candidate: `THE WEEK KEPT ITS SHAPE`. The
**law** saved is: *absence states the authored intention and continuity without guilt.*

## The expanded reference gallery (a deliberate set, not 25 fixtures)

Enough to make degradation obvious. All already exist as fixtures; consolidate under stable
`ref*` names in Layer 2's Studio (after the L1.1 gate).

- **TODAY** — Threshold (authored + float) · Easy conversational · Easy ceiling · Strides after
  Easy · Long Run (explicit finish) · Rest contextual
- **TIME / MEMORY** — Consult (completed Threshold, actual/authored) · Past unfiled · Absence ·
  Protected · AWAY · Between races · Season filed
- **EVIDENCE** — Log Face / partial device evidence → see [LOG_FACE_LOCK.md](LOG_FACE_LOCK.md)

## What is NOT locked (voice and hierarchy only, not the old build)

- The **diamond** in these reference shots is obsolete (retired in L1.1). Preserve the interior
  composition, never the inspection glyph.
- `CALENDAR: INSIDE`, old ruler variants, old Studio chrome — none come along.
- `THE RING KEPT ITS PLACE` wording (see ¹). The **relationships** are locked; specific nouns
  and the very-bottom action wording may still be renamed.
