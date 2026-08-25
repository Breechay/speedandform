# Handoff · 2026-08-29 (console rebuild in progress)

Read this, then `docs/COACH_CONSOLE_BRIEF.md`. Brice is also pasting a detailed
composition spec into your first message. **That spec is the authority for the
layout.** This document is the authority for what is already true in the repo.

## Where things actually stand

`main` is pushed and deployed **except the last commit**, which is committed
locally and deliberately not deployed. Do not deploy until Brice approves a
screenshot.

```
439898b  Make the ladder reachable again      committed, NOT deployed
3f1fb67  Darker field, white wordmark          deployed
724e93e  Read-only ladders, one lime           deployed
```

All five checkers pass on HEAD.

## The mistake to not repeat

The console was rebuilt component by component instead of replacing the page
composition. Every screenshot looked closer and none of them looked right, and
the last one opened to four giant ladder rows with the actual work below the
fold. **Replace the composition first, then fill it.** Brice has said this
plainly and it is the single most important instruction here.

Also: do not deploy while iterating on the visual. Take a local screenshot,
show it, wait.

## What is real and working, do not rebuild

- **Filing** goes through `file_session`, an enforced server-authoritative
  transaction. Coach insert and update policies are dropped; there is no way
  around it. It validates membership, status, that a linked session belongs to
  the same athlete, future dates, and piece kinds as a set before any write.
- **Correction** goes through `correct_session`, requires a reason, and stamps
  that reason onto every revision the change produced. Completions and pieces are
  both snapshotted into `completion_revisions` before being changed.
- **Judgments** (`mark_judgments`): moves it / does not answer it / works against
  it, append-only, may rest on several completions.
- **Confidence** (`mark_confidence_reads`): append-only, coach-only, score plus a
  required reason and required next-evidence. `mark_standing_confidence` is the
  newest unsuperseded read. The write path is `setConfidence` and the editor
  dialog exists. **The three empty states are not built and not tested.**
- **Proof coverage** is `proofCoverage(mark)` in `private/data.js`: highest
  checkpoint in reached or repeated over the mark target. Derived, never stored.
- **Checkpoints** move only through `moveCheckpoint`, and `scripts/check-contracts.mjs`
  follows the call graph to prove nothing else reaches it.

## Two things that are wrong right now

**Marcus reads about 61 per cent coverage and it is not trustworthy.** Clicking a
rung used to cycle its state, so exploring the interface advanced authored
decisions silently. Cycling is gone, replaced by an explicit chooser. **Do not
repair his states with a migration.** The last commit makes the ladder reachable
from the current-rung line so Brice can set them by hand. That is the only
honest repair.

**Confidence and coverage may be conflated on screen.** Trace every rendered
percentage to its source before trusting it. The athlete tab must show
`latestAuthoredConfidence?.score ?? '—'` and nothing else. Coverage is a separate
instrument and must never appear as confidence. Until Brice repairs the
checkpoint states, prefer wording like `established checkpoint` over `proven`,
because some of that state came from accidental clicks.

## Traps that have already cost time

- **Run all five checkers before every commit.** `node scripts/check-syntax.mjs`,
  `check-modules`, `check-dom`, `check-copy`, `check-contracts`. Plain
  `node --check` does **not** catch module syntax errors; a stray brace once hung
  the whole console on its spinner.
- **Pushing to `main` costs a paid Netlify build.** Batch.
- **`style-src` is `'self'`.** No web fonts. The condensed look uses a local
  stack.
- **Week 1 in the database is Aug 23 to 29**, Sunday anchored. Illustrative specs
  show Monday anchored dates. The database is authority; do not migrate dates to
  match a mockup.
- **Never delete and recreate `mark_checkpoints` rows.** A migration did once and
  irreversibly erased every `current` state; the table has no audit trigger.
- **Hope\u2019s 25 Aug recoveries are 10:01 \u00b7 12:12 \u00b7 12:12** against her own 8:48
  easy. She rested instead of floating. Every outside agent so far has repeated an
  inverted version saying "3:00 hard" or "recoveries too short". That is wrong.

## Standing laws

No generated coaching, ever. No em dashes in rendered copy. Plain spoken English,
no coach vocabulary. The proof ladder (`1 2 5 6 8 10 13.1`, one rung per
capability) and the block (`2 5 6 6 8 8 10 6 4`, what the plan asks in order) are
different shapes. Nothing advances a ladder automatically. The website is Brice\u2019s
instrument, not an athlete product.
