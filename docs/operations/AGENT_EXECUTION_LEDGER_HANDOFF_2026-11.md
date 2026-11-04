# Staff execution receipts — implementation handoff

**State:** Contract and tests prepared. No database ledger or agent listener is deployed by this document.

## Why this exists

The private Staff dashboard shows assigned tasks and source exceptions. `operating_changes` proves record mutations, but not the agent request, scope of authority, source verification, actual delivery or device result. Never label those existing changes as completed agent executions.

## Required owner

Create an **append-only, coach-scoped** table of agent execution receipts using the supported Supabase CLI migration workflow; the CLI was not available in this preparation environment. No backfill from `operating_changes`, chats, GitHub PR descriptions, tasks marked `done`, or unverified native states.

Suggested keys: immutable UUID receipt ID, `owner_id` derived from authenticated coach identity, bounded `run_id`, idempotency key unique per owner + action, lane, status, timestamps and the exact fields in `coach/agent-run-contract.json`. Validate payloads using `private/agent-execution-receipt.mjs` server-side or in the trusted agent writer before inserting; the database must independently enforce valid states and immutable rows. Never trust a client-supplied owner ID or mark delivery/native verification from source publication alone.

RLS: `SELECT` and `INSERT` only to an authorized active coaching administrator for their own `auth.uid()`. Revoke `UPDATE`, `DELETE`, `TRUNCATE` from application roles. Use `SECURITY INVOKER` for any read projection; ensure it is bounded by owner, time and row count. Private athlete IDs and evidence URLs must never appear in anonymous/public responses. The existing Supabase owner guard is required in addition to mere authentication.

## Integration order

1. Introduce migration and verify owner-only insert/read, cross-owner denial, anonymous denial, no update/delete, immutable identity and idempotent retry. Run Supabase advisors.
2. Introduce a signed-in agent writer that records authorization, before/after references and actual readback; blocked attempts are receipts too. Reject impossible state transitions; do not hide write failures.
3. Add a bounded authenticated `coach_agent_execution_read` to Staff. Display counts of verified / unverified / blocked **only if the source responds**. A failed read displays “Execution ledger unavailable,” not zero.
4. Present each row's lane, action, authority, source age, status, owning record references, verification time and uncertainty. Link to the owning source when safe.
5. Verify a real authorized execution end-to-end; deploy to source `main`, then production after tests. Preserve the existing Staff mock's design language without copying its fictional counts.

## Decision semantics

- `observed` / `drafted`: diagnostic or preparation, **not** completion.
- `saved`: canonical owning record has a verified readback.
- `published`: source publication confirmed; feed/native appearance separately unknown.
- `delivered`: exact destination evidence exists.
- `native_verified`: device/app evidence exists and is referenced.
- `blocked`: no unauthorized workaround; report the reason and next owner.

Keep athlete-reported feedback separate from coach interpretation. Approved glute-day placements remain unchanged until new athlete feedback or evidence justifies revision. No scheduled review gate or new automation is created by this work.
