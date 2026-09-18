# FORM native assigned-plan acceptance — backend slice · September 17, 2026

Status: **SOURCE FIX PREPARED + ROLLBACK ACCEPTED; LIVE MIGRATION HELD**

This is the backend half of Athlete Ecosystem Pass 10. It does not create a new native plan client, athlete identity, assignment or filing path.

## Existing contract reconciled

The existing native RPD beta uses the FORM Athlete System:

- `athlete_plan_feed(athlete_id)` for the athlete's own authoritative active block;
- immutable `planned_session_versions.id` carried into the native draft;
- `record_session_from_form(..., p_planned_session_version_id)` for native filing;
- stable `evidence_id` for replay/idempotency;
- `source = 'form'` for canonical native receipts;
- coach-owned `correct_session(...)` for deliberate correction with a required reason.

The native client freezes the exact session/version when the athlete opens it. The backend accepts that frozen version even if a newer version has since been authored, provided the version belongs to the same athlete/session.

## Defect found in acceptance

The live receiver already returned the same completion ID for an exact retry, but it still issued an UPDATE whenever `athlete_note` or `symptoms` was non-null.

Because `session_completions` is audit-triggered, an exact network retry with identical wording manufactured a `completion_revisions` row even though nothing changed.

That is not idempotency.

## Source repair

Migration:

`20260918011500_form_native_exact_retry_noop.sql`

The existing receipt branch now updates only when one of the permitted late subjective fields is actually different:

- RPE;
- symptoms;
- athlete note.

Objective evidence, receipt identity and prescription identity remain untouched on the duplicate path.

This preserves the deliberate late-report behavior while making an exact retry a true no-op.

## Rollback-only live-schema acceptance

The migration was installed inside a transaction against the active FORM Athlete System, then fully rolled back.

A synthetic athlete/member/block/week/session was created only inside that transaction. The session had two authored immutable versions:

- v1 = the version treated as already opened on device;
- v2 = a newer version already visible from `athlete_plan_feed`.

Acceptance proved:

1. the authoritative feed returned the synthetic athlete and latest v2 with plan authority;
2. the athlete could still file v1, preserving the version actually opened;
3. the completion stored `source = form`, stable evidence ID, exact session ID and exact v1 ID;
4. measured split data persisted;
5. exact replay returned the same completion ID;
6. exact replay created no second completion and **zero audit revisions** under the repair;
7. `correct_session` then changed the current distance/RPE/split while preserving immutable receipt/session/version identity;
8. the old completion row was preserved in `completion_revisions` with the correction reason;
9. the old split was also preserved by the `session_pieces_audit` trigger with the same correction reason;
10. the corrected split became the current reading.

After rollback, the synthetic athlete, completion and revisions were verified absent.

## Production boundary

The migration is **not applied live in this pass** while production/schema publication remains held by Brice. The current production receiver therefore still has the harmless-but-false audit-revision behavior on an exact retry carrying a note.

Do not call the native delivery gate complete until this migration is deliberately applied and the installed-device journey is accepted.
