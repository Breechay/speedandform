# Adrian · The Developed Runner 2026 — Forge handoff

**Canonical 2026 source:** `/plans/adrian-developed-runner-2026/program.json`  
**Season id:** `adrian_developed_runner_2026`  
**Legacy Forge program id:** `adrian_runner_mass_phase1_v1`  
**Season:** 2026-09-14 → 2026-12-31

## One-source law

Do not independently author a second Adrian progression in Forge, the athlete website, Console, or the study.

The canonical JSON above owns:
- phase and week names;
- week dates;
- exercise identity;
- sets / rep ranges;
- race-week reductions;
- progression rules;
- running-coordination rules;
- measurement protocol;
- race anchors.

The athlete fallback, standalone week pages and FORM Labs study all read this file directly.

The old `/plans/adrian-runner-mass-phase-01/program.json` is now a **historical Phase 01 snapshot**. It preserves the opening artifact but no longer owns Week 02+.

## Native continuity

Historical Forge receipts may already reference `adrian_runner_mass_phase1_v1`. Do not rewrite those receipts or fabricate replacements.

Until a deliberate native migration changes program identity, the legacy id remains the receipt-continuity bridge. The app may project the canonical 2026 source into its own bundled model, but the content must be mechanically derived from the canonical source rather than re-authored by hand.

A native build that contains only the old three-week menu is stale after this change. In that case the website remains the readable authority until Forge is regenerated and accepted.

## Chronology

Week 01 remains the original baseline.

- Week 02 — **Redirect**: cable access and athlete evidence redirect volume toward chest depth, upper-arm girth, medial thigh, hamstrings and calf / soleus.
- Week 03 — **Confirm**: repeat the redirected architecture inside the higher run week; lower-body volume does not increase automatically.
- Weeks 04–07 — **Density + Force**.
- Weeks 08–10 — **10K Integration**, including a reduced November 15 race week.
- Weeks 11–13 — **Race Strength**, including a reduced December 6 half-marathon week.
- Weeks 14–16 — **Close the Year**, ending December 31 with measurements and low fatigue.

January starts from a fresh coaching decision rather than silently extending the 2026 block.

## Running authority

Adrian's running plan remains owned by his running coach.

FORM strength does not invent, move or replace run sessions. When the two systems conflict:
1. protect the key run;
2. remove unnecessary lower-body fatigue;
3. hold or reduce lower-body progression;
4. keep upper-body development where recovery allows.

Commitment is evidence that Adrian will execute the plan. It is not permission to increase punishment.

## Receipt / position law

- actual loads and reps are athlete-recorded evidence;
- missing loads stay missing;
- opening a future week on the web does not move Forge;
- web-delivered sessions are not backfilled as Forge receipts;
- an old receipt keeps its original program/week/day coordinates;
- current position must come from explicit coaching / app state, never from guessing from a page view.

## Study publication gate

The study lives at `/labs/adrian-runner-mass/`.

It is intentionally unlisted and `noindex` until explicit athlete case-study consent exists. Training delivery does not depend on public publication.

## Installed-device acceptance

Before Brice tells Adrian that Forge is again the authoritative recording surface for this season:

1. regenerate / import the canonical 2026 prescription into the native program model;
2. prove the installed build contains the actual current week and all future authored weeks needed for the handoff;
3. preserve Adrian's existing identity and history;
4. verify explicit current week/day placement;
5. start and close a real test session;
6. prove one coach-visible receipt with matching program/week/day and no duplicate on retry;
7. relaunch and prove access / position persist;
8. verify old web work was not fabricated as native history.

Installed-device acceptance is required. Source parity alone is not athlete acceptance.
