# HOMEPAGE — DECISION RECORD

**Date:** 2026-07-15
**Status:** POSITIONING-V7 held. No V8. Do not write one.
**Read before:** any homepage work, any positioning proposal, any "north star" brief.

---

## Current production (2026-08-18)

`/` is the **Run Development instrument**: three full-viewport snap plates, then Begin, then the five-question intake, then send to Brice. This is a later product decision by Brice. It does not reopen POSITIONING-V7, and it is not a portrait brief.

- **01 THE WORK** — Run Development / With Brice / 8 weeks / $1,200. Colour film.
- **02 THE PRACTICE** — *I develop runners.* and three more arguments on a horizontal text axis (swipe the thesis, or tap `01 / 04`). Grey film.
- **03 THE NOTES** — one Observation. A still, not a film. Line + named athlete + door to `/notes`. Not a grid. **Blocked:** Line is a visible PENDING string and the frame is a placeholder until Brice writes one real observation about a named athlete (consent required). Do not invent athlete content to unblock it.
- **Begin** — same five questions. No cart. Persists across all three plates.

**01 + first thesis + Begin is still complete** without extra 02 swipes and without reaching 03. Both 02 and 03 are depth.

Kill test for 03: if the Line could have been said on 02, it is a restatement and the plate goes. 03 earns its place only by naming a person.

Notes are distribution, not a content library. Two registers, one sequence: Observation (name + bronze rule) and Reminder (no name). No labels, chips, or eyebrows. Maintenance workouts are not Notes. The approved Line / Reason / Close card is not being redesigned. Spec: `docs/claude-handoff/NOTES-REGISTERS.md`.

Composition, copy, and intake wording on 01 / 02 are locked. Tokens live in `home.css` (Fraunces, JetBrains Mono, ink `#0b0b0a`, ivory `#f6f2e8`, bronze `#C3AD96`) — not the July 2026 cream/plum table below, which belonged to the previous homepage.

The July 2026 do-not-regress counts in `HOMEPAGE-DO-NOT-REGRESS.md` apply to the archived page, not to this instrument. Do not restore the V7 marketing homepage onto `/`.

---

## Why this file exists

In July 2026 a very long homepage brief was written proposing that `/` become
*"a portrait of Brice made from the work"* — an authored world containing apps,
athletes, café, community, writing, photography, and "his way of seeing people."

Six independent AI reviews were run against it. **Every review that inspected the
live site rejected the brief.** Every review that did not inspect it approved the
brief and invented facts to support it.

Then the repo was opened, and it turned out **POSITIONING-V7 already contained the
answer.** The reviews had spent tens of thousands of words re-deriving a document
Brice wrote himself.

This file records that so it does not happen a third time.

---

## The ruling

**POSITIONING-V7 stands unchanged.** The current homepage implements it correctly.
The portrait brief is rejected.

The homepage needed **five fixes**, all verified against the repo on 2026-07-15:

| # | Bug | Evidence | Fix |
|---|---|---|---|
| 1 | `Start Week 1` on a product with no Week 1 | `grep -c "Start Week 1" index.html` → **1** | → `See the program` |
| 2 | Homepage never states FORGE is pre-launch | `grep -c "Coming to the App Store" index.html` → **0** (forge-sculpt says it **3×**) | Add status label |
| 3 | No `og:image` | `grep -c "og:image" index.html` → **0** | Point at `/og/default.jpg` today |
| 4 | No skip link | `grep -c "skip" index.html` → **0** (forge-sculpt has one) | Add |
| 5 | No responsive images | `grep -c "srcset" index.html` → **0**, with 17 `loading="lazy"` | Add `srcset` |

That is the whole homepage problem. Five items. Bug #2 is the real one: **the
FORGE page is honest and the homepage is not.** `/forge-sculpt/` protects
"Coming to the App Store" ×3 as a do-not-regress item. `/` says it zero times.
The dishonesty is one string on one page.

---

## Settled — do not reopen

| Decision | Ruling | Source |
|---|---|---|
| Hero line | **"The thinking is done. You just train."** Keep. | V7, and 6/6 reviews |
| Portrait / authored world | **Rejected.** The work introduces the man; not the reverse. | 4/4 grounded reviews |
| Brice on the page | Signature, not subject. Mid-page, first person, signed. | V7: *"No founder mythology"* |
| Hideout | One mention, `the café I co-own`, outbound link. No section, no route, no schema. Co-owned; not ours to annex. | All grounded reviews |
| `Now` section | **Never.** Maintenance obligation → visible stale receipt. | All reviews |
| `/brice` route | **Do not create.** | All reviews |
| Newsletter | **No.** FORGE waitlist only, on `/forge-sculpt/`, single-purpose. | Live `#notify` form |
| Congo / Paris biography | Off the homepage. Colour, not proof. | 3/4 grounded reviews |
| Athlete outcomes | Nothing without written consent. Name + outcome + Download button = commercial use. | — |
| Team Vinchay lineage | **Do not claim publicly.** Erik Taylor, Cole Monahan, Andrea et al. co-founded it. Same rule as Hideout, different asset. `PDFs → site → apps` is solely Brice's. Use that. | — |

---

## Brand architecture — the facts

```
Team Vinchay  →  Speed & Form  →  FORM        (the group renamed twice)
 (da Vinci /                       @form.practice
  Breechay)
```

- **FORM is the group AND the app.** Same name, deliberately. The app is named
  after the group. This is not a collision to fix — it is the site's best asset.
- **Speed & Form** is the house, and is the group's former name. The footer gloss
  (*"Form keeps the work precise. Speed keeps it alive"*) reads *Form* as a
  quality, not a discipline. That is what lets FORGE be a child rather than a guest.
- **Hideout** is co-owned, has its own brand, domain, app, and Instagram.
- **The narrowing:** each rename removed scope, and each time the thing got better.
  Brice ratified this 2026-07-15: *"I like narrow. I want to stay narrow."*
  **Any future brief proposing to widen the homepage back out is proposing
  Team Vinchay. That experiment ran for eight years and was renamed away from twice.**

---

## Corrections already made — do not repeat these

Recorded because each was made confidently by a capable reviewer.

1. **`og:site_name: FORM` is a bug. `"the FORM practice"` in prose is NOT.**
   FORM *is* the practice. A grep-and-replace was proposed and cancelled. The site
   name is Speed & Form; the group's name is FORM. Both are true.

2. **Do not rename the group.** A reviewer proposed renaming it to "The Field."
   The group already has a name. It is FORM.

3. **Cormorant Garamond IS the homepage face.** A reviewer wrote *"resist importing
   it — it's the app's face."* Wrong. `grep -c Cormorant index.html` → **4**.
   POSITIONING-V7: *"Cormorant remains the homepage hero signature."*

4. **The design tokens are in the repo. Do not invent them.**

   | Token | Real | Invented by reviewers |
   |---|---|---|
   | cream | `#efe9df` | `#F7F4EE`, `#F9F8F6` |
   | plum | `#72506f` | `#5A2D40` |
   | gold | `#c79a3e` | `#D4AF37` |
   | bone | `#eee8dc` | — |
   | ink | `#29251f` | `#1C1C1C` |
   | black | `#050608` | — |

5. **The site uses glass.** `grep -c glass index.html` → **9**. A reviewer's
   art direction banned it. Check before banning.

6. **`The next challenge` is a documented decision, not an oversight.**
   V7: *"The other product is not an upsell inserted into the current chapter. It is
   a future challenge available when it genuinely belongs."* A reviewer proposed
   cutting it as "needy cross-selling." Cutting it may still be right — but it is
   **overruling a signed decision**, and that requires saying so out loud.

7. **`og:image` is a missing TAG, not a missing asset.** `/og/default.jpg` exists
   and every other page references it. `/` does not. One line.

8. **Three reviewers invented athletes.** Fabricated names, fabricated race times
   ("Marcus V., 1:38:12"), fabricated shoulder-pain resolutions — inside a section
   captioned *"We do not publish generic, anonymous reviews."* One reviewer wrote
   **"Brice Vinchay"** into proposed hero copy, twice, having fused the org name
   into his surname. **His name is Brice Ikouebe.**

**The mechanism in all eight:** a plausible inference, run instead of a `grep`.
This repo is on disk. Check.

---

## The rule that governs all of it

From `NORTH-STAR-ADOPTION.md`, after an agent deleted the `FORGE_SESSION` demo on
2026-07-15 by pasting a design reference over a live page:

> **The check must be written before the change, from the do-not-regress list.
> A checklist derived from your own diff always passes.**

This applies to the homepage exactly as it applies to `/forge-sculpt/`.
`index.html` do-not-regress baseline: **`HOMEPAGE-DO-NOT-REGRESS.md`**.

---

## Open

1. **Athlete consent.** 13 pages live under `/athletes/`. Written consent status
   unknown for all. Required before any name appears on `/`.
2. **`/miami-running-training.html`** — deploy-id March 2026. Retire → 301 `/form`,
   or strip cycle content and keep for local discovery. Not yet adjudicated.
3. **Site sprawl.** ~100 HTML files at root. `form_console_v54b.html` and
   `v55b.html` are 527 KB each, both committed. The *story* narrowed for eight
   years; the *repo* never did. That is the next narrowing, and it is not a
   homepage task.
