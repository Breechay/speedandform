# Oct 6 observation-system consolidation receipt

Date: 2026-10-06  
Branch: `work/rpd-observation-system-audit-20261006`  
PR: #238

## Current ruling

- Reusable RPD continuous ownership asks: **5 → 6 → 8**.
- Late access is a separate durability question: **4 late → 6 late**, conditional on absorption/recovery.
- Twelve continuous race-pace miles are not a reusable-plan qualification rung.
- Thursday / secondary quality is support, not debt. Demanding support is performed only when the primary session was controlled and recovery is normal.
- Common observation grammar does not imply common athlete prescriptions.
- Every active coached athlete gets a lightweight study record by default; larger public studies remain selective.

## Drift classification and disposition

### CURRENT SOURCE — corrected

- `docs/RACE_PACE_DURABILITY_CANONICAL_v1.md`: removed the surviving four-ask / W12 ownership language, separated fresh ownership from late access, reconciled W8/W9/W11/W12, and made Thursday explicitly conditional support.
- `docs/RACE_PACE_DURABILITY_ASK_SEMANTICS.md`: removed the surviving four-ask table and retired W12 ownership semantics.
- `plans/race-pace-durability/notation.js`: removed the stale comment describing W12 as an ownership ask.
- `docs/studies/SIMON-STUDY-003.md`: removed the old 10–12 / final-12 long-range requirement.
- Tinius Durable Frame source files: Week 1 load calibration is open from athlete-reported working loads; the equipment gate no longer blocks authoring; full Thursday lower-body work is earned rather than automatically stacked.

### MARKETING / PUBLIC — corrected

- RPD offer truth, distribution roadmap, Meta brief, Unbounce exploration and ad-launch kit now reflect 5 → 6 → 8 plus separate late access.
- English and Spanish RPD offer surfaces expose modest late access rather than a twelve-mile rung.
- Labs index / Simon presentation now describes Thursday as smaller conditional support rather than an automatic second development day.
- Speed That Endures public data/page changes remain athlete-evidence specific.

### TEST / FIXTURE — corrected

- `tests/rpd-story-share-browser.py` now expects the current Spanish late-access language instead of the retired four-easy + twelve-race-pace copy.

### HISTORICAL / ARCHIVE — intentionally preserved

Older September audits, proposal/design documents, approved design snapshots, prior study revisions and prior Supabase migrations may still contain 5 → 6 → 8 → 12 or other earlier structures. They are evidence of what was proposed or authored at that time and are not rewritten as if history never happened. Examples include:

- `docs/audits/2026-09-12-ecosystem-audit.md`
- `docs/RACE_PACE_DURABILITY_W3_W13.md`
- `docs/PUBLIC_PLAN_WIRING_AUDIT.md`
- prior RPD migration versions in `supabase/migrations/`
- historical Ghost/design artifacts

Current-source files above and the live published plan outrank those historical artifacts.

### SEPARATE PROGRAM / NOT RPD DRIFT

Raise the Ceiling, historical threshold programs, Simon-specific ceiling language and other athlete/program-specific records are not rewritten merely because RPD changed. They remain subject to their own authority and athlete evidence.

## Supabase reconciliation

The following migrations were already applied in FORM Athlete System but were missing from the repository; their exact recorded statements were backfilled into source control:

- `20261006183012_rpd_v9_observation_architecture_20261006.sql`
- `20261006183047_jose_observation_program_revision_20261006.sql`
- `20261006185004_teach_week_priority_and_earned_support_20261006.sql`
- `20261006185053_oct6_screenshot_intake_observations_20261006.sql`

A new migration was then applied and recorded:

- `20261006191934_rpd_v10_consolidate_primary_question_and_support_20261006.sql`

RPD v10:
- keeps W8 Saturday easy so the next specific question remains the 8-mile ownership ask;
- keeps W9 Saturday easy after the 8-mile ask;
- starts reusable late access at W11 with final 4 at race pace;
- extends to final 6 at W12 when recovered;
- changes demanding reusable-plan Thursdays from `key` to conditional `support`;
- does not migrate existing athlete assignments automatically.

## Athlete authority read-back

Post-change database read-back confirmed:

- **Hope:** Oct 8 remains `Recovery hold - await coach review`.
- **José:** Oct 8 40 min easy; Oct 13 5 mi continuous; Oct 15 20 min controlled threshold if recovered; Oct 17 13 easy; Oct 20 8 mi continuous.
- **Simon:** R4 / `Ceiling × Durability · Block 01` remains active; Oct 8 and Oct 15 ceiling work is explicitly conditional on Tuesday absorption.
- **Elijah:** short-runway block remains active; Thursday remains cheap support; Oct 13 remains 2 × 3 mi HM durability.
- **Anthony:** athlete-specific RPD assignment remains intact; Thursday support is visibly conditional; Oct 20 remains 8 continuous.
- **Tinius:** active metric restart remains authoritative; Oct 20 remains **8 km continuous at race pace**. Archived older metric block remains history, not current authority.

No physical-device verification is claimed by this receipt.

## Repo reconciliation

While this audit was running, `main` advanced with unrelated house/SEO work. The only overlapping files were `AGENTS.md` and `the-method.html`. Both were reconciled by taking current `main` content and reapplying only the observation-system additions. PR #238 is mergeable after that reconciliation.

## Acceptance

GitHub Actions on PR #238 are the final source-level gate. Merge only after the current head passes the relevant RPD story/share, coached-athlete source-truth, coaching-funnel and cross-surface checks.
