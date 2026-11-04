# Coach decision → prescription version linkage

**Prepared, not applied.** The private athlete decision and version tables already exist, but there is no durable direct link between them. The application must never guess one from matching dates or workout names.

## Required relationship

Generate a Supabase migration using the supported CLI workflow (CLI unavailable when this handoff was prepared). Introduce a small, append-only `decision_version_links` table with:

- Immutable UUID link ID, decision ID referencing `decisions`, version ID referencing `planned_session_versions`, role constrained to `before` or `after`, reason (required), authenticated coach author and creation timestamp.
- Unique decision/version/role combination for idempotent retries; composite athlete checks enforced at the database layer, not only by UI code.
- The linked version is immutable: never rewrite an older prescribed version when publishing a new one. Link the new version as `after`; link the superseded version as `before` when known.
- `SELECT` and `INSERT` only under existing active-coach membership and coach-console owner conditions. No authenticated `UPDATE`, `DELETE` or anonymous access. Any privileged backend writes must enforce matching athlete IDs too.

An authenticated writer must verify the selected decision, planned session and version IDs, exact athlete identity, version persistence, authorization and source reason; insert idempotently and read back. Invalid or missing links are **unknown**, not confirmation a decision did not change a plan. Use `private/decision-version-link.mjs` for contract-side checks, plus database constraints and RLS.

## Read projection and UI

Expose a bounded, coach-authorized link read with source IDs and version numbers. Display each decision's explicit `before` and `after` titles, version numbers, reason and publication receipt. If no links exist or a source is unavailable, say so. `decision_completions` remains **input evidence** and later filings remain chronology until a coach explicitly authors a sourced outcome interpretation. Do not equate publishing a version with iOS Week/feed/native proof.

The next implementation must test: correct link and idempotent retry; mismatched athlete denied; wrong-session version denied; anonymous and unlinked coach denied; immutable row; missing source UI; and signed-in coach readback after publication. Run Supabase security advisors before applying to production.

No retroactive automatic backfill, workout progression, glute-day changes, scheduled reviews, or external communication is authorized by this linkage.
