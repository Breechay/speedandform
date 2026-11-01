# The Two Curves: edit entry point

Read `../../docs/studies/SIMON-STUDY-003.md` before editing this directory or Simon's plan. Revision R4 is the approved current decision. Read the plain-language summary first, then the technical protocol.

- The assigned FORM plan and its explicitly approved publication own the prescription. Do not restore a handwritten `B1` array.
- `published-plan.json` is a generated build/CI baseline ONLY. It is never a display fallback and is never served (`_redirects` 404s it); `published-plan.js` is no longer generated or loaded. Plan content (grid, doses, pace cards, summary, dates) appears **only** from a live response verified as `published` in the page view; revoked (`unavailable`), awaiting-update (`review_required`) and unverifiable states show no plan. See `docs/studies/STUDY_PLAN_WITHDRAWAL_20261101.md`. Refresh the baseline through `node scripts/studies/build-simon-r2.cjs --refresh-only`, not by changing numbers here.
- `evidence.json` contains approved historical excerpts. Keep sources, uncertainties and derived values separate. New private filings need coach review before publication.
- March 25: 32 broken minutes, 20-minute longest piece, activity-level Strong/Moderate/3 out of 10. March 11: partial recording, reason unknown. Neither establishes a lab threshold.
- Gate 01: 5K Oct 29, then a separate standardized 6 km continuous observation only after normal recovery and explicit coach approval. Do not extend the same observation to 8 km because it feels good. No automatic Week 6.
- Keep both languages and both unit systems correct. Preserve existing image bytes, .98 scale, bottom anchor, and the visible EDITORIAL content when scripts or the live feed fail. The plan itself is the exception (Nov 1 2026): it is not shown without a verified live publication.
- A stronger hold can count with an unchanged 5K. Never add a fixed HR cap, an invented drift boundary or more quality because a chart suggests it.

Run the contract and browser tests before publishing. An HTML comment is public, not a place for private athlete data or credentials.
