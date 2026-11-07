# FORM · Editorial compensation after November 7 bulk-write incident

Owner: FORM coaching operations · 2026-11-07

## What happened
On November 7, an administrative SQL session directly inserted **322 editorial-only versions** for 322 upcoming published sessions across 28 athletes. It also copied **607 typed workout components** and zero linked exercises. The previous versions were retained. Although the latest copy no longer contained the disallowed word, this publication did **not** use the required signed-in coach pathway and substituted some phrases mechanically.

The rollback attempt was aborted by `planned_session_versions_immutable`, which calls `forge_private.guard_immutable_history()`. The database correctly refused deletion with “Published history is append-only.” The attempted transaction did not change the records. We must not disable that guard.

Verified at the November 7 incident readback: the 322 versions were still latest, with intact immediate predecessors and no references from session completions, athlete placements, Forge events/receipts, Miami publication receipts, or Speed vault links. Both Donna blocks remained scheduled (José 45, Hope 44 published sessions) and both Orlando blocks remained active through December 5.

## Corrective design
This branch introduces two **new** signed-in coaching RPCs and one isolated Coach Console review page:

- `coach_legacy_editorial_queue(p_limit, p_offset)`: returns eligible future, published active/scheduled sessions whose latest version has the exact incident change reason, plus original and current copy for comparison. Both active coaching administrator and athlete-scoped coach membership are required.
- `coach_publish_legacy_editorial_corrections(p_items)`: accepts 1–10 reviewed items with session ID, **exact expected version ID**, full proposed title/intent/details, written rationale, and explicit approval. Refuses stale/withdrawn/past/filed/unauthorized sessions, locks the session row, requires at least one actual wording change, and validates language.
- `/coach/editorial/`: proposes context-specific edits from the *original* authoring, preserves current text when ambiguity needs a human decision, exposes before/current comparisons, requires per-item approval and rationale, and reads back returned version IDs before reporting server success.

Publication **appends** a new coach-attributed session version; it does not delete any historical version. It copies previous distance, duration, pace, RPE, shape, private coach note, vault identity, all structured running components and any linked exercises. Dates, scheduled sessions and athlete filings do not change.

## Release sequence — do not skip
1. Confirm production scope and current scheduled plans have not changed since the baseline.
2. Run `node --test tests/coach-legacy-editorial-compensation.test.mjs`, JS syntax checks, and database migration syntax/authorization probes. Use a nonproduction DB for positive authenticated tests when available; a production `BEGIN … ROLLBACK` compilation only confirms syntax and rejected unauthenticated calls, **not** successful coach writes.
3. Review pending copy examples for running, threshold, technical swimming, long runs, and weekly practice. The proposal helper does not mechanically substitute unknown phrases.
4. Apply the migration before deploying the browser page. Deny `anon` and `PUBLIC` access. Do not add a service-role bypass or fake `auth.uid()`.
5. Authenticate normally in Chrome Coach Console. Preview and publish **small batches**, inspect the returned IDs and canonical readback, stop on a mismatch.
6. Confirm per-athlete Week preview, title, full execution details, notification side effects and any changed reader projections. Physical device acceptance remains a separate receipt.
7. Repeat the future active/scheduled query. Do not close #521 until all 322 contextual corrections have authenticated receipts and editorial quality acceptance.

## Failure states
- A stale version means someone else revised the session: never resend blindly.
- A filed or closed session is outside this tool: investigate separately.
- A bulk or unauthorized SQL correction is not a legitimate publish even if the text displays correctly.
- The existing `coach_publish_editorial_copy` bulk function may fill blank intentions but must not be used to replace already-authored copy.

## Live status
The source changes here are a **candidate**, not a claim of production release or remediation completion. The append-only incident versions remain until correctly superseded by new coach-authenticated versions.
