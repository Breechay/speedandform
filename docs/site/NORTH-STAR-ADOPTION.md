# FORGE PAGE — NORTH STAR ADOPTION BRIEF

**Status: NOT STARTED. One attempt was made 2026-07-15 and reverted before push.**
Read `HANDOFF.md` first — especially the DO-NOT-REGRESS LIST. This brief assumes it.

---

## The goal

Bring `/forge-sculpt/` to the north star's composition **without losing the live
machinery.** The design is canon (signed). The machinery is what makes the design's
claims true.

The two are not in conflict. They have to be built together, and that is the whole
difficulty: the north star has a **picture** where the live page has a **machine**.

---

## What went wrong the first time — read this before touching the file

An agent copied the north star over `forge-sculpt/index.html`, grafted back the
form / analytics / legal / CTA, verified **those four**, and reported success.

It deleted the `FORGE_SESSION` demo.

It had personally produced the table, hours earlier, showing the north star carried
`FORGE_SESSION: 0`, `data-demo: 0`, `data-region: 0` against the live page's 14 / 2 / 1.
Then it built its verification list out of the work it had done instead of the list of
things that had to survive.

> **The check must be written before the change, from the do-not-regress list.**
> A checklist derived from your own diff always passes.

---

## The actual problem: a picture where a machine goes

The north star `#today` section:

```html
<div class="device" data-audit="POLISH">
  <div class="d-row"><span class="nm">Hip Thrust</span><span class="st">4 × 8 · 140 KG</span></div>
  ...
```

That is a **static mock**. It sits under the headline *"You open it. You execute."*

HANDOFF, voice guide: **"Claims must be demo-provable. The demo above each claim must
literally do it."** The live page earns that line with a real state machine —
set → rest → set → Record, four steppers. The north star illustrates it.

**Do not substitute a screenshot or a static mock for the demo.** The whole page is an
argument that FORGE has already made the decisions; a fake screen inside that argument
is the one thing that would prove it hasn't.

---

## The three blocks to port

Source of truth: `git show HEAD:forge-sculpt/index.html` (line numbers as of `main` @ 2026-07-15).

| Block | Lines | Size | Notes |
|---|---|---|---|
| Demo CSS | ~200–236 | 37 | `/* ---- FORGE demo region ---- */` |
| Demo HTML | ~518–543 | 26 | `<section class="band demo" id="demo" data-demo="forge-session" data-state="set" data-region="shoulders">` |
| Demo JS | ~760–839 | 80 | `var FORGE_SESSION={...}` state machine, ends `})();` |

**Grafting is ~140 lines. That is not the work.** The work is that
`.band.demo` / `#forgePlate` and the north star's `.device` / `.d-row` are different
design languages. The demo must be **re-skinned into the north star's system** while
keeping:

- the `FORGE_SESSION` fixture object (data-driven — HANDOFF: swap fixtures, never
  hardcode states into markup)
- `data-demo` / `data-region` (JS selects on them)
- `demo_started` / `demo_completed` (stable event names)
- the static markup inside the section — it is the **no-JS fallback**, keep it in sync

This needs visual iteration at 1440 and 390. It cannot be done blind.

---

## Corrections required during adoption

| Issue | North star has | Must become | Authority |
|---|---|---|---|
| Units | `4 × 8 · 140 KG` | pounds (140 kg ≈ 310 lb; use a realistic increment) | FORGE_START_HERE §2 — pounds signed 2026-07-15 |
| Athletes | 4 placeholder cards, `PHOTO PENDING`, `"Quote pending"`, `Phases 1–X · XX weeks` | **omit the section** until real | §6 — real, permissioned, real durations |
| Pricing | `$99/year`, `$19.99/month`, `data-audit="BUILD — PRICING NOT APPROVED"` | **no price stated** — "shown in FORGE before you subscribe" | §5 — unapproved; 15-week math is dead |
| CTA | `<a href="#" data-audit="BUILD — CTA STATE PENDING APPROVAL">Download FORGE</a>` | `Coming to the App Store` ×3 | FORGE is pre-launch |
| Full-year claim | "The curriculum runs the better part of a year" | **cut** | Only Phases 1–4 ship (~15 weeks). Restore when 5–12 + Hold + re-entry ship. |
| Title/meta | "four-phase physique curriculum" | keep for now | §5: *"Phase N of 4" stays true* until Campaign II ships |

---

## Verification table — fill this in BEFORE pushing

Write the result column from a real check. Not from memory, not from the diff.

| Feature | Preserved at | Verified how | Result |
|---|---|---|---|
| `FORGE_SESSION` fixture | | `grep -c FORGE_SESSION` → expect 14 | |
| Demo initializes | | click through set→rest→set→Record in browser | |
| Demo is production code, not a mock | | steppers change values; `window.sfEvents` fills | |
| `data-demo` | | `grep -c` → expect 2 | |
| `data-region` | | `grep -c` → expect 1 | |
| `demo_started` / `demo_completed` fire | | interact, read `window.sfEvents` | |
| Event names unchanged | | diff names against `HEAD` | |
| Email submit fires **once** | | submit, check no duplicate listeners | |
| Netlify form name | | `name="forge-prelaunch"` + hidden `form-name` | |
| Privacy disclosure adjacent | | link to `/forge-sculpt/privacy/#website-form` present | |
| Legal routes resolve | | load privacy, terms, support — 200 each | |
| Every internal anchor resolves | | no `href="#x"` without matching `id` | |
| No dead `#proof` / `#pricing` links | | grep nav + footer | |
| 1440 — no h-overflow | | browser | |
| 390 — no h-overflow, form usable, demo usable | | browser | |
| Zero console errors | | devtools | |
| Zero missing assets | | network tab, no 404s | |
| Keyboard reaches all controls, focus visible | | tab through | |
| Reduced-motion intact | | `prefers-reduced-motion` | |
| No-JS shows complete content | | disable JS | |

---

## Sequence

1. Branch. Do not work on `main`.
2. Write the verification table's expected values **first**, from `HEAD`.
3. Port the north star composition around the live demo section.
4. Re-skin the demo into the north star's design language.
5. Apply the corrections table.
6. Fill the verification table from real checks.
7. Netlify Deploy Preview.
8. Brice reviews at 1440 and 390.
9. Brice merges and pushes. **The agent does not run git.** (HANDOFF: read-only git.)
