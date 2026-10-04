# Connected study contract · Elijah + Simon
Owner: Brice. Effective: October 4, 2026. Public pages share approved records; private filings stay private.

## One record, several views
- Paired chapter: `/labs/same-pace-different-problem/`.
- Simon: `/labs/the-two-curves/` (original hero, image bytes, historical races, language and unit controls retained).
- Elijah: `/plans/elijah-savannah-half/`. The obsolete November 11 route points here; November 14 is the actual event date.
- Every observation, interpretation, decision and open question has a stable entry URL under the paired study. Backlinks are derived from dependencies rather than manually maintained.

## What is authoritative
**Dated training:** assigned template -> dated session versions -> app feed. `plan_assignments` alone is NOT the app prescription. Never silently mutate an already-performed session to match a new story.

**Public plan:** `paired_study_plans()` and `study_003_plan()` return only explicitly published plans. A shared validator compares the approved template against future dated app sessions and components, assignment, active block, calendar and key flags. A mismatch returns `review_required` with no unapproved payload. The saved public copy is labelled as unconfirmed, not current. An explicit unavailable/revoked response hides the saved plan in the connected UI. No arbitrary athlete slug can be queried anonymously.

**Observed evidence:** Simon's approved `labs/the-two-curves/evidence.json` remains the source. Elijah's selected approved excerpts live in `data/studies/elijah-evidence.json`. The builder selects only named dates and approved fields; it does not fetch private notes, memberships, contacts or completions for public display.

**Interpretations / decisions:** `data/studies/paired-study.json` is the approved public registry. Each record has an ID, revision, date, athlete scope, kind, dependencies and (where relevant) exact plan-version references. Its public wording is not an automatic rewrite of a private filing. New private evidence requires review and explicit public approval before entering this registry.

**Generated views:** `bundle.json/.js`, individual entry HTML, plan HTML and the embedded Simon record are outputs, never alternate authoring sources. `labs/shared/connected-study.js` renders every view. A change to a source observation invalidates the stored basis hash of dependent interpretations. They appear as needing review on every page until the coach reviews them. A plan revision makes its older decision historical; it does not rewrite that history.

## Plan publication workflow
1. Inspect latest assignment, current dated sessions, overrides and completed evidence.
2. Cut a new template version when changing the prescription. Do not fabricate completion, mark ownership, dates, or future test approval.
3. Review the exact public subset (including template descriptions). With the authenticated athlete coach, call:
   `publish_connected_study_plan(slug, expected_version, effective_on, race_on, race_name, race_place, reason)`.
4. This transaction appends new dated-session versions, preserves session IDs where possible, records calendar moves, updates the active block and matched public publication, and rolls back if parity fails. Future individual overrides or filings deliberately block automatic replacement and require review. Do not bypass those guards.
5. Update block-level descriptive pace labels only as a projection of the approved sessions; they are not independent training targets.
6. Run `node scripts/studies/build-paired-study.cjs --refresh`. Verify the real `coach_preview_plan_feed` and public wrappers, not just the template tables.
7. Build, test and deploy all connected surfaces together. The browsers fetch the guarded live plan on load and return-to-page; offline copies remain explicitly dated/unconfirmed.

The helper currently supports the two named athletes and blocks starting at plan Week 1. A new athlete, a different block offset, or an individually overridden schedule needs an explicit extension, not a guessed assignment.

## Observation / analysis workflow
1. Add or correct the approved source excerpt. Keep recorded, reported and derived values separate; do not infer missing recovery.
2. Add a registry record pointing to that source; analysis/decision records link to observation IDs instead of copying numbers.
3. `node scripts/studies/build-paired-study.cjs` regenerates all views and flags changed analysis bases. Review each affected interpretation and increment its revision for a material edit.
4. Only after coach review, `--approve` records the current dependency bases. It is a publication action, not a workaround for a failing test. Do not run it automatically in CI.
5. Run `node tests/paired-study-contract.cjs` and `python tests/paired-study-browser.py`.
6. Deploy. No isolated manual HTML edit is an observation update.

A withdrawal must remove public wording and update dependent records in the same release. Marking a record private in the public registry deliberately fails the build; do not leave private content in a public Git repository. Keep withdrawn record identifiers as non-sensitive tombstones when links need preservation.

## Continuation
The registry's paired phase is not closed by the calendar alone. File Elijah's actual Savannah race and subsequent recovery, link a closeout analysis, then change the chapter phase. Simon's observations keep the same IDs and individual page. His future specificity remains distance-based, informed by RPD; a twelve-mile rehearsal is conditional, not currently assigned and never a guarantee.

## Verification / boundaries
October 4 delivery repair: public Elijah V5 / Simon V4 match dated app feeds; Elijah race moved to November 14. Pre-Oct-5 session-version hash remained `b6d636464bf91d2e3e83879e57f70368`. Elijah V5 fixes accounting (37-mi peak), no automatic mark credit, and a within-three-mile rhythm component; it does not increase work. Reviewed legacy Simon R2 import markers were superseded while old versions remained intact.
The public mismatch test deliberately changed a template detail inside a rolled-back transaction: Simon returned `review_required`, Elijah stayed published, and no unapproved payload was exposed.
This verifies backend delivery, not a physical iPhone refresh. Native client rebuilds are not necessary merely to update these dated sessions; do not claim the user's installed screen was inspected.
