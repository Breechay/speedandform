# FORM HYROX workbench

Status: working local prototype, not deployed. Route: /labs/hyrox-workbench/.

Run from the static site or use the self-contained offline HTML export. Save keeps records in this browser; Export/Import transfers JSON. No Console integration or cloud account sync. Do not place athlete exports in this public repository.

## Verification and roadmap — 2026-09-14

- Calculation checks pass: duration parsing, unknown versus zero, complete totals, distance-gated pace/retention, inconsistent timing. Run `node labs/hyrox-workbench/workbench.test.cjs`.
- Browser visual/interaction acceptance remains open: cloud browser security rejected the local file URL. No workaround attempted.
- Next: check desktop/mobile entry, save/reload, export/import and print with a disposable record; then approve a batched site deployment. Existing homepage fixes must be retained in that deployment.
- Later: authenticated Console persistence, longitudinal comparisons and structured experiment history. These are not implemented.
- The paired-trial calculator supports coaching experiments, not causal diagnosis. No fixed threshold conversion, elite retention bands, or promised savings.
- Rules link points to HYROX; current exact loads were not independently verified and are not embedded.

No live athlete result is seeded. An unconfirmed result transcribed from supplied screenshots is delivered separately for private import.
