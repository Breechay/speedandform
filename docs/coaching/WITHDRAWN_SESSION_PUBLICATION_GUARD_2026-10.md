# Withdrawn session publication guard

**October 27, 2026 · Coaching publication contract**

A cancelled prescription with `withdrawn_at` is a deliberate coach decision. Importing or republishing an older training template must not recreate that prescription for the same athlete, block, calendar date and role. When the reason identifies a rest day, the hold applies across roles, so relabeling support work as key/easy cannot bypass it.

## Enforcement

- The database guards new published rows and reopenings, including writes from legacy publishers and `author_session`. A UI-only warning is insufficient.
- Withdrawn prescriptions and their versions remain in the private record; there is no deletion and no conversion of cancellation to completed work.
- Administrative cutover entries whose withdrawal reason starts with `Superseded by ` are excluded, since their replacement prescriptions can already be published.
- An assigned coach may explicitly reinstate an individually withdrawn slot through `approve_withdrawn_session_republication(withdrawn_session_id, reason)`. The explanation must be at least fifteen characters. Approval is recorded privately and consumed once by the next matching publication. It is not a general permission for future imports.
- The Coach Labs Week can indicate `Coach hold` on affected days. The athlete view must continue to omit withdrawn work and private reasons.

## QA checklist

1. Confirm an existing withdrawn day is still cancelled and nearby valid days remain published.
2. Attempt to publish a same-date replacement under a different role where the reason states rest. Confirm the database rejects it with `Coach review required` and inserts nothing.
3. Confirm the guarded day is absent from the athlete prescription feed, but its full withdrawal reason remains in the coach record.
4. For a legitimate reinstatement, have the coach record a fresh reason, publish once, and confirm the approval receipt is consumed. Repeating publication must require another review.
5. Check active plans for multiple prescription versions or unit mismatches separately. Neither warrants changing training dose as a side effect of UI formatting.

The automated scheduled plan scan is advisory; it does not replace coach review of athlete goals, load, race proximity, recent evidence and recovery. Training changes and publication approvals remain coach-owned.
