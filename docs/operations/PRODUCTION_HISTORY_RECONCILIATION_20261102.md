# Production history reconciliation · November 2, 2026

The public FORM Running page update (PR #437) passed its release checks and merged into `main` at `1f55475a18cc6ad4eeddfb765a4f3b06496ed5b5`. Its production publication was blocked because the `main` branch had been recreated as a snapshot on `84670505`, without ancestry shared with the `production` branch.

The production branch at `cda7bde24686d76ceb1a687249e0449e15a0ac43` already included the guarded Coach Console release from PR #438 and the approved athlete portrait assets. An exact-tree comparison showed that `main` retained those features; differences were confined to public Athletic Life and Running app page edits.

This merge reconciles the two branch histories by taking the existing `main` source tree and both commits as parents. It does not reset or overwrite production, adjust athlete assignments, alter the Coach Console, publish app build 44.5, or touch private data. The `Publish Speed & Form` workflow remains the only method to advance the `production` ref once its normal fast-forward gate can pass.

Release evidence should separately record GitHub checks, workflow execution, Netlify deployment and live `/form/` readback. At this document's authoring, those latter receipts were pending.
