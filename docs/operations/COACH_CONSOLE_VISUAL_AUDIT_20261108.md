# Coach Console · second visual and functional audit · November 8, 2026

## Observed live before this pass

The earlier week/notes correction from PR #550 was confirmed on the exact
Netlify production commit `fa221642` (deploy `6af0d0127c1b58dc0ef31dd5`,
published November 8 at 2:40 PM Miami time). Authenticated Chrome checks were
made at a 1,279px desktop viewport. Do not confuse these observations with
acceptance of the changes in this follow-up.

- **Athletes:** Thursday's six work parts now fit into a bounded day tile. The
  seven days are still seven separate pale columns inside a large white card,
  above two more white cards. The functional-strength section has substantial
  empty height before its first useful sentence. A 40-person rail includes
  several identical first names, making athlete selection ambiguous.
- **Programming:** The selected athlete's name still occupies an oversized,
  all-capital hero. Several roster entries have identical first names. When two
  results share a date but only one planned session is indexed, the week row can
  print a dangling `Double ·` label. Prescriptions themselves read correctly.
- **Group sessions:** A long session setup/cues sentence appears in a one-line
  input and is clipped. The existing save/preview guards must be preserved.
- **Runs:** Each coach-confirmed name repeats three equal-strength pill actions
  (rename, link, withdraw); dangerous and mundane actions compete visually.
- **Today:** A roughly 90px heading repeats the selected Today tab and delays
  the actual operating items. Older, still-open October source items appear in
  November; this is an operating-source question, not authority to close them.

## Scoped follow-up

- In the coach-only rail, picker and identity heading, disambiguate repeated
  first names using the existing canonical display name; fall back to the
  readable slug when needed. Keep navigation order, permissions and IDs intact.
- Replace the unqualified duplicate-filing marker with the actual count of
  results filed, and an ordinal only when there are multiple planned sessions.
- Give Programming a measured, sentence-case identity line so the week and
  selected session rise in the viewport. Reduce Today's duplicate headline
  to a restrained size while preserving its accessible `h1` landmark.
- Convert Group session intent and setup/cues to multi-line, vertically
  resizable textareas without changing their names, limits, data or publisher.
- Use paper and rule-based sections in Athletes: remove white card backgrounds,
  shadows and nested day-card frames, reduce empty instrument height, and keep
  session color rules and keyboard focus.
- In Runs, keep per-person controls available under a native Manage disclosure,
  preventing a field of repeated Withdraw buttons while retaining their
  existing server-owned correction flow.

## Boundaries and acceptance

The second pass makes **no record, attendance, training, permission or
publication changes**. It is only UI source and regression tests. No individual
training or source data was refreshed. Some old operating items may need a
separate owner decision, not aesthetic hiding or automatic completion.

Acceptance still requires the final merged commit, scheduled production
release receipt, authenticated desktop/narrow/zoom readback, keyboard operation
of Manage and week controls, and confirmation that every affected form shows
the full value. Chrome's current extension surface did not honor a temporary
mobile viewport override; static breakpoint checks are not mobile-device
acceptance. Keep the Netlify release batched; do not start a build per edit.
