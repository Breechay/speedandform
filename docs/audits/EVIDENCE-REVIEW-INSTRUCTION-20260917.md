# Evidence → coach review → next instruction — September 17, 2026

Scope: keep the existing Coach Console shell and make one explicit athlete-facing coaching chain from filed evidence to Brice's published read to the next published instruction.

## What changed

The filed workout remains the evidence object. Its splits, filing source, prescription version and correction history are not edited by publishing coaching.

The existing Console inspector now adds a compact athlete-facing coaching block beneath the evidence:

- **Unreviewed evidence** → `REVIEW + SET NEXT`.
- **Published review without a linked next instruction** → the review remains visible and the Console offers `SET NEXT INSTRUCTION`.
- **Published chain** → the review and next instruction are shown together beside the evidence that caused them.

This does not replace `SAY WHAT THIS DID`. That existing action remains the claim/judgment instrument. The new chain is athlete-facing coaching.

## Atomic publication

Migration `20260918002500_evidence_review_instruction_chain.sql` is additive:

- adds nullable `directions.based_on_read_id → reads.id`;
- adds `publish_review_and_direction(...)`;
- requires coach membership;
- requires every reviewed completion to belong to the athlete;
- requires the next instruction to target a live, non-withdrawn session for the same athlete;
- writes the review, evidence links and next instruction in one database transaction;
- can attach a next instruction to an already-published review without duplicating that review;
- preserves exact external wording when coaching was sent outside FORM.

If the direction insert fails, the new review and its evidence links fail with it. The chain is never half-published by this RPC.

## Athlete surface

The read-only athlete workspace now resolves athlete-visible wording through one rule:

- normal published coaching shows `athlete_text`;
- `delivered_externally` coaching shows the exact `delivered_wording` instead.

Today shows the latest published coach review and its linked next instruction. History keeps `Coach review` and `Next instruction` as separate received events. Session cards use the published instruction for that session while the underlying prescription remains unchanged.

Raw coach-private analysis, private notes, mark judgments and draft objects are not rendered by this athlete path.

## Existing data

The live project currently has no published athlete-facing reads or directions for the active roster, so this pass does not reinterpret or rewrite existing coaching history.

## Acceptance

- Node source/model tests cover unreviewed → reviewed → chained states, external exact wording, athlete Today rendering, migration ownership guards and Console wiring.
- The migration was executed inside a rollback-only transaction against the live schema to validate SQL syntax.
- A second rollback-only acceptance used Hope's existing canonical completion and a live future session under the existing coach identity. It proved:
  - the read linked to the exact completion;
  - the direction linked to the new read and exact live session;
  - the original completion remained present;
  - every synthetic row and schema change rolled back.
- Chromium and WebKit acceptance cover open/reviewed/chained states at phone and desktop widths.
- Production schema migration is intentionally **not applied** while the owner continues to hold production publication.
