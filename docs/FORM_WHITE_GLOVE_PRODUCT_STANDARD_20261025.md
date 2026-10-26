# FORM · White-glove athlete experience and authoring contract
October 25, 2026

## Three distinct jobs
- **Week:** execute the actual prescription. A beautiful, quiet calendar; ordered work, pace and recovery are immediately visible.
- **Plan:** understand the shape of the season, key workouts, long-run progression and the destination.
- **My FORM:** feel personally known. The portrait is the emotional cover. The direction is a succinct coach-authored objective, current emphasis and next meaningful milestone. The details hold records, appearance and administration away from the hero.

“My FORM” is the current design direction, not a completed rename or production feature. Its second fold should transition naturally out of the artwork. Do not create a separate generic dashboard.

## Athlete-facing coaching rule

See [the October 26 self-audit contract](FORM_ATHLETE_COPY_SELF_AUDIT_20261026.md). An author drafts, audits, rewrites failing text, and runs the audit again before saving.
Write to the athlete, in plain language. One useful sentence beats a paragraph of commentary. Use imagery only when it makes the workout easier to understand.

- Show the workout once: a complete title and precisely typed work/recovery. Do not repeat structured numbers in prose.
- Easy + Strides means an easy run followed by strides. Do not label its full easy portion a warm-up.
- A genuine interval session may have a real warm-up, reps, recoveries and cool-down.
- Do not use long em dashes; en dashes remain correct for ranges.
- No “not a sprint,” “no sprinting,” “run by your own rhythm,” reports, motivational filler, internal cohort commentary, legal explanations, or unsupported recovery contingencies.
- Do not invent rest times. “Full recovery between sets” is appropriate only when the coach prescribed that.
- No guessed race date, goal, PR, pace unit, milestone or coach focus.
- Omit a coach's note when none has been freshly authored. A stale personal note is worse than silence.
- Never strip unique instructions merely to meet a visual target. If necessary, put the full ordered sequence in the workout detail.

## Enforcement added
`private/session-editorial-standard.mjs` is a shared, deterministic validator. The private Coach Console calls it before creating a session. On revision it checks changed title, intent and details only, so known legacy copy does not block a valid dosage update. Errors remain visible in the form and the save is halted.

Run the editorial and import regression tests with:
```sh
node --test private/session-editorial-standard.test.mjs private/session-copy-quality.test.mjs private/plan-import-standard.test.mjs
```

New or changed single-paragraph execution text over 190 characters is rejected, as are unnecessary explanations and short fractional mile/km notation. Structured exercise details remain intact. Coach Console and Plan Exchange use `selfAuditSessionCopy`. The author must rewrite text until the gate passes; the validator never rewrites doses.

The validator checks wording, not coaching safety. It neither changes doses nor silently rewrites a prescription. Current gaps:
- Direct SQL/RPC authoring, migration scripts, and other remote tools bypass this web-form validator. A server-side publication gate with authorized coach testing is the eventual single point of enforcement.
- Exact dose/narrative duplication, freshness of My FORM focus notes, and agreement between units/structured components require server data and should be reviewed in a second, data-aware gate.
- Historical sessions require an editorial audit and versioned coach corrections; a display normalization is not canonical cleanup.

## Experience acceptance before wider release
Inspect José, Tinius, Hope, Anthony, Simon (km), a strength plan, a newcomer and an athlete without a race. Verify small screen, larger text, dark/light themes, filing, date jump and week scroll. Confirm each athlete's current plan, target, units and authored focus come from their own record.

A quality check is complete only when the actual signed-in athlete view renders the published plan. Do not certify a generic fixture as personal.
