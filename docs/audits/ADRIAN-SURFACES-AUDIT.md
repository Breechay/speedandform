# Adrian evidence surfaces — audit

SITE-001. Read-only verification, September 15, 2026, against `main` and against production by fetch. No page was changed by this audit.

## Headline

**The three surfaces this milestone names do not exist.** SITE-001's definition of done says to "verify existing" them. All three return 404 in production and none is present in the repository.

| surface named in SITE-001 | production | in repo |
|---|---|---|
| `/plans/adrian-runner-mass-phase-01/` | **404** | no |
| `/plans/adrian-nutrition-phase-01/` | **404** | no |
| `/labs/adrian-runner-mass/` | **404** | no |
| `/plans/adrian-hypertrophy-week-01/` | **200** | yes |

One Adrian surface exists, under a different name from the one the ledger uses.

## What is actually live

`/plans/adrian-hypertrophy-week-01/` returns 200. Title: *Adrian — 4-Day Hypertrophy Week 01*. About 15 KB, static, no scripts.

It carries the **prescription**: four sessions (Day 01 Upper A, Day 02, Day 03, Day 04), exercises, sets and rep ranges, 8–12 main reps, 1–2 reps in reserve, rest guidance, and the note that Thursday is the main lower day. It contains **no athlete evidence** — no loads lifted, no measurements, no results, no bodyweight. It is the work Brice wrote, not data about Adrian.

`FORM_REMOTE_STRENGTH_ADRIAN_PILOT.md` calls this page the "Public delivery artifact" and "the standalone public plan", so it is public by intent, not by accident. It ships with two share cards (`adrian-hypertrophy-week-01-share.jpg`, `-v2.jpg`) and `<meta name="robots" content="index,follow">`, which is consistent with something meant to be shared. It is **not** in `sitemap.xml` and nothing else on the site links to it. Unlisted but indexable and shareable is a coherent setting for a delivery artifact you hand someone, so **no change is recommended here**.

## The gap that matters

SITE-001's definition of done requires that the **athlete can use the current plan/nutrition path even if the app is delayed**. Today he cannot, for two reasons.

**The web plan is one week; the app program is three.** FORGE-002 delivers `adrian_runner_mass_phase1_v1` with three app weeks. The live page covers Week 01 only. Its single reference to a second week is the closing instruction: *"Record every weight and rep. That becomes Week 02."* Week 02 is a promise, not a page. If app delivery slips past Adrian finishing Week 01, the web fallback runs out.

**There is no nutrition path at all.** `/plans/adrian-nutrition-phase-01/` is a 404 and the live plan page contains no nutrition content (the word matches in the page source are inside "repeat", "Seated" and "feature"). ADRIAN-001, *Baseline and site-first nutrition are used*, has no site to be first on.

## Consent

**No consent record exists in the repository.** A case-insensitive search for "consent" across all Markdown on `main` returns nothing.

This does not currently block anything, because the clause it governs concerns the public **study**, and the study does not exist. It becomes live the moment `/labs/adrian-runner-mass/` is built. The existing plan page does not depend on it: it publishes a prescription rather than evidence, under a first name, and Brice's own pilot document designates it public.

Recorded so that the study is not built later on the assumption that consent was already handled.

## Naming divergence

Three names for one block of work, which is what produced the 404s above.

| where | name |
|---|---|
| Forge program id | `adrian_runner_mass_phase1_v1` |
| ledger and this milestone | Adrian runner mass phase 01 |
| live site | Adrian — 4-Day Hypertrophy Week 01 |

The same class of problem as Death versus The Long One. One name should win before another surface is built against the wrong one.

## Live versus draft

| item | state |
|---|---|
| `/plans/adrian-hypertrophy-week-01/` Week 01 | **LIVE**, indexable, unlisted, share cards present |
| Week 02 and Week 03 on the web | **does not exist**, referenced only as a future consequence of logging Week 01 |
| Nutrition surface | **does not exist** |
| Public study `/labs/adrian-runner-mass/` | **does not exist** |
| Consent record | **does not exist** |
| Calibration artifact | not located in this pass; `FORM_REMOTE_STRENGTH_ADRIAN_PILOT.md` is the only Adrian document in the repo root |

## What SITE-001 should do next

Not what its next action currently says. "Compare the three prepared surfaces with the accepted protocol and consent record" assumes three surfaces and a consent record, and none of the four exists.

The real decision is whether the web fallback needs to reach three weeks. That is a delivery question for Brice, and it is coupled to FORGE-002: if device acceptance closes soon the app carries weeks 2 and 3 and the web plan never needs them; if it slips, one week of fallback is not enough. Nutrition is a separate ask and is currently unstarted rather than incomplete.

Nothing in this audit was changed. No page was edited, no consent was inferred, and no delivery wording was approved.
