# Filed prescription version integrity · November 8, 2026

## Observed case

Sohel's November 5 speed session has immutable prescription history:
version 4 asked for four 200m repetitions, then version 5 was authored on
November 4 with ten 100m repetitions. The FORM result for November 5 names
version 4. This mismatch was verified from the owning Supabase rows, not from
the plan title alone. No evidence proves whether the athlete's device displayed
an older cached plan or whether he executed the later prescription.

## Correct boundary

- Keep `session_completions.planned_session_version_id` as historical evidence.
  Never silently change it when a coach edits a plan.
- In Coach Console and Athletes, use that pinned version to interpret a filing.
  The newest version is a *different* prescription and cannot supply the pace
  bands, recovery or repetition count for old evidence.
- If the pinned version differs, explain both doses in plain English and state
  whether the newer version existed before the recorded filing time. Where
  provenance is missing, show an unverified state, not a fabricated match.
- File submission is not blocked: an athlete may finish offline against an
  older plan and needs to preserve that reality. A native freshness check and
  explicit athlete acknowledgement should be designed in the owning iOS stream,
  with current device evidence and safe queue retry behavior.

## Verification and unresolved decision

Pure regression tests cover the Sohel-like four-200m to ten-100m transition,
legitimate revision after completion, missing version IDs, and both coach
readers. No session, completion, workout piece, attendance, or native release
was mutated. Ask which prescription Sohel actually saw and performed before
considering any correction; if a correction is needed, use the audited
correction workflow rather than rewriting the historical version in place.
