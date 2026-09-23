# Adrian nutrition delivery hold · 23 September 2026

Status: paused_pending_clinician_review. Revision: 1.5.2.

The athlete-facing nutrition HTML and current review-context JSON withdraw earlier prescriptions. The old reminder download is removed. Prior content remains in version history, not an active recommendation.

Do not restore this page from an earlier ZIP, generator, deployment or snapshot merely to pass legacy active-plan tests. Run tests/adrian-nutrition-hold.py for the paused state. The existing v1.5 entry point routes to that test while the hold is active.

Resume only after individualized treating-clinician guidance is reviewed, the relevant food/supplement/exercise instructions are reconciled, and Brice explicitly authorizes a replacement release. Do not invent a substitute menu, supplement dose, safe interval or food/exercise experiment.

This commit does not change canonical FORM/Forge assignments, contact the athlete, notify another coach, or revoke imported phone reminders. Brice must communicate the hold directly. Prior assignment visibility is not exercise clearance.

Privacy: the underlying medical details, screenshots and clinical documents must remain outside this public repository and public study. A noindex tag or collapsed section is not privacy protection.

Release: verify the held page and review JSON on the production URL after promotion. Preserve concurrent site work. Do not claim deployment before verification.
