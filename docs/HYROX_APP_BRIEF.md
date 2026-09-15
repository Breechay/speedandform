# FORM HYROX: from plan to practice to coaching record

September 14, 2026. Owner: Brice. Status: product brief and audit scope, not an implemented app feature. Adrian delivery remains the active release priority.

## What we are building

Brice can prepare a HYROX block, assign the right version to an athlete, and see what happened when they completed it. The athlete opens today's session, understands what to do, records only what matters, and knows the next step. A self-coached athlete can choose an available free example, adapt it explicitly, and keep the same useful record without a promised coach review.

The public guide teaches the reasoning. The app carries the instructions needed during training, with a short cue and a link to the relevant guide section. The Console prepares and reviews work. Forge supplies strength execution where it already does that well. These are connected views of the same work, not four independent plans.

## First useful journey

1. **Prepare.** Choose race date and division, available days/equipment, current running and strength work, and known limits. Missing benchmarks may stay empty. Brice can author running, strength and mixed work; authorship is per block, not inferred from sport.
2. **Assign.** Preview a week as the athlete will see it. Confirm start position and plan version. Preserve existing athlete identity and completed history. A free template is available content, not an automatic coached assignment.
3. **Train.** Today shows the session, load or distance, rest, one effort cue, and what to record. Expand technique or alternatives when needed. Keep the essential prescription available offline once downloaded.
4. **Record.** Mark completed, changed, shortened or skipped. For mixed work, show one station/run pair at a time; offer repeat-last values and a compact summary. Never make six pairs fit a four-number form by silently dropping evidence.
5. **Read.** Show recorded times and a plain explanation of what can be concluded. Missing distance or segment evidence remains unknown. A report such as “running felt normal after 200 m” is reported evidence, not measured pace recovery.
6. **Review.** The authorized coach sees the assigned version, actual work, changes and notes. Brice chooses the next change. Self-coached mode gives bounded interpretation without creating a hidden review queue.

## What the first release includes

- A versioned coach-authored or explicitly selected template block with running, strength and station/run sessions, using existing assignment and receipt infrastructure where possible.
- Session-level context for other training: day, type, approximate duration and reported effort; heavy/moderate/light can be a quick entry, never proof that recovery is adequate.
- Manual pair recording, units, source labels and corrections. Imported laps are an enhancement, not the only path.
- A record-derived chart for seven station-plus-following-run pairs in a full race. Run 1 and wall balls remain separate. Never add Run 8 again to wall balls and present eight comparable pairs.
- Links to the live guide and current season rules. Record the rule/guide version used when it changes an authored prescription.
- Explicit saved-on-device, queued, received and failed states; consent and permissions govern coach visibility.

Defer automatic progression, universal HYROX scores, a program generator and cross-provider import promises until their evidence and policy are accepted. Free beginner access is a supported product path; do not invent a paywall requirement to protect coaching revenue.

## Return to pace: a proposed condition

Author a target pace range, allowed return distance or time, and the minimum sustained segment required. A single moment inside range is not a successful return. The 400 m example is a configurable coaching target, not a physiological law.

Keep three outcomes distinct: met, not met, and cannot determine. A total 800 m lap cannot establish where within that lap pace returned. Measured classification requires sufficient subsegments/samples, known station exit, distance quality and timing boundaries. Manual entry can record a measured segment or an athlete's report; label which it is. Do not infer station work from a GPS pause alone.

Pair cost is a useful comparison, not a diagnosis. A long pair may reflect distance, station type, load, surface, transitions or earlier fatigue. Preserve later-block observations as well. Compare like conditions and avoid labeling the longest bar the athlete's weakness automatically.

## Data contract to audit before adding a table

| Object | Required meaning |
| --- | --- |
| Athlete/account | Stable identity; verified membership and coach authority; program access separate from authentication |
| Plan and assignment | Immutable version, author, intended athlete, start date/position, explicit status |
| Session and block | Stable IDs, ordered kind, prescription, units, recovery, alternatives and per-block author/source |
| Condition | Versioned target, applicability, evidence requirement and resolver; ownership independent of generator |
| Completion receipt | Original assigned version, actual timing/date precision, completion state, source and submission ID |
| Segment | Running/station/recovery/transition type, optional measured distance, time boundaries, provenance and linked block |
| External work | Reported date/type/duration/effort and unknown state; no hidden claim that a coarse label proves readiness |
| Interpretation | Derived from cited receipt revisions and rule version; correction invalidates/recomputes it |

These are semantic requirements, not approved new schema or enum names. Audit existing FORM and Forge models first. Preserve plan authorship, evidence authorship and importing actor separately.

## Read-only audit

Inspect actual shipping FORM, Forge candidate, backend and Console. Report commit plus file/line, observed behavior, smallest change, estimate range, risk and “forecloses” note for each item. Use missing/implemented-untested/tested/intentionally-manual, not a blanket pass. Estimates follow inspection; do not invent hours now.

| Question | Evidence needed |
| --- | --- |
| Can a receipt separate stations from running? | Segment boundary survives import, manual entry, filing and classifier |
| Are conditions independent and attributed? | Actual generator, persistence and resolver models; migration impact |
| What does HYROX entry select? | UI route through distance/program selection, not a string search alone |
| Does cutback cadence really equal zero? | Active generation policy and authored weeks; zero may be a sentinel, not proof of absent recovery |
| Can a six-pair session be named and logged? | Composer, start screen, manual form, voice/keyboard and saved receipt |
| Which scores/role lines apply? | Explicit applicability guards for HYROX and unsupported evidence; no accidental road-score inheritance |
| Can imported laps be labeled? | Current provider permissions, retained payload, units and round-trip; confirm current Strava contract |
| Can Brice assign both strength and running? | Existing authoring, approval, entitlement and versioned assignment path |
| Does outside work affect suggestions honestly? | Unknown vs reported state, conflict handling, coach override; no automatic advance from declaration alone |
| Do filing and corrections reach the Console? | Idempotent retry, account switch, exact assignment version, authorized visibility and revision history |
| Can a free/self-coached athlete use it? | Entry, ownership, support expectations and export; no inferred coach assignment |
| Is public/private separation real? | No automatic publication from records; explicit reviewed export only |

## Source checkpoint

FORM main `d95f46e8a97005c4a7d671a673cba9b766da31b9` contains `FORM/Today/HyroxRunningProgramContent.swift`: a fixed eight-week running program with existing station/run descriptions and an explicit running-only scope. This confirms prior content, not the proposed mixed-plan execution or a working return classifier. Preserve old assignments while adding new capability.

Forge PR18 head at audit start: `d7556e8dc8e23ef96da52d4ca1ea73420c35fed4`, targeting `forge/ship`, not FORM main. The owning `docs/FORGE_ADRIAN_CURRENT_STATE.md` records 56 tests and unsigned Release at `0e0abce4`; device delivery remains unaccepted. Authenticated receipt infrastructure exists, but that does not prove the HYROX semantic contract fits it.

The live guide at `/labs/hyrox/` has browser-local records and JSON export. Its current chart derives from existing run/station fields; it does not sync to an account. The public page is not a completed research study. Possible future client use does not establish enrollment, consent or a case result.

## Release acceptance and sequence

1. Finish FORGE-002 for Adrian without adding HYROX to that release gate.
2. Audit the questions above and prototype a synthetic six-pair session plus one strength session. Reuse shared identity/assignment/filing contracts.
3. Demonstrate coached and self-coached manual execution on a device: correct version, offline resume, partial completion, retry, correction, account switch, denied unrelated access and coach visibility only when authorized.
4. Pilot an explicitly assigned block after Brice confirms the athlete and prescription. Observe actual use; do not label a prospect as enrolled.
5. Add measured return classification and provider imports only after resolution, provenance and applicability tests pass.

Read `FORM_CONNECTED_SURFACES.md` before implementation. Keep the Bridge Season ledger authoritative for milestone state and the owning project records authoritative for technical evidence.
