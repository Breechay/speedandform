# Study plans: withdrawal-safe display and withdrawal checklist (Nov 1, 2026)

Applies to Simon's and Elijah's study plans (explicit consent confirmed by Brice, Nov 1, 2026; see the FORM-iOS review `docs/next/FORM_ANON_DEFINER_FUNCTION_REVIEW_20261101.md`). **Source-only change. Nothing was deployed, deleted or changed in production.**

## The rule
A study plan is displayed **only** from a response verified, in the current page view, as `state: "published"` from `paired_study_plans` / `study_003_plan`. A committed copy is never a fallback.

| Live result | Page shows |
|---|---|
| `published` (valid) | the plan, from that response |
| `unavailable` (revoked or no approved publication) | "This plan is not currently published." No plan content |
| `review_required` (update awaiting a matching publication) | "This plan is being updated and is not shown until the new publication is approved." No plan content |
| anything unverifiable: network failure, timeout, HTTP error, malformed or unknown response, an `unavailable` entry that still carries a payload | "The plan's publication status could not be verified, so it is not shown. Try again." No plan content |
| before the first check finishes, or without JavaScript | "Checking the publication status…" / "Turn on JavaScript to see it." No plan content |
Simon's and Elijah's currently approved plans render exactly as before whenever the live response is `published`. The editorial studies, journals and evidence are unchanged and stay readable in every state.

## What the audit found (before this change)
1. `labs/shared/connected-study.js` rendered `window.FORMStudyPlans` (`plans.js/json`) whenever the live read failed or returned `review_required`. For the pages' race date, version and the Simon status line it also fell back to the snapshot.
2. **The Elijah snapshot is the Savannah plan (`elijah-nov11-half`), whose publication was revoked on Oct 18, 2026.** The live Elijah plan is `elijah-palm-beaches-half-2026` (published Oct 23). So the fallback was already able to show a withdrawn plan.
3. `labs/the-two-curves/index.html` treated `unavailable` (explicit revocation) as `review_required` and kept showing the snapshot ("the previous copy remains visible"), and rendered the snapshot on any network error.
4. The committed HTML itself carried baked plan content: the full Simon grid, doses and pace cards (Two Curves) and the full "Saved approved copy" blocks for both athletes on `labs/same-pace-different-problem/` and `plans/elijah-savannah-half/` (Simon's baked copy was version 4; the race date shown was Elijah's revoked Nov 14).
5. The snapshot files were publicly fetchable at their own URLs.

## What changed
- `labs/shared/publication-gate.js` (new): the one rule above; fails closed.
- `labs/shared/connected-study.js`: never reads a snapshot; per-athlete gate; race date, version and status text only from a verified published response.
- `labs/the-two-curves/plan-projection.js`: `readState()` keeps `unavailable`/`review_required` apart from failures. `index.html` and the generator (`scripts/studies/build-simon-r2.cjs`): no baked grid or plan-derived copy; run-time rendering only from a verified publication; `published-plan.js` is no longer generated or loaded.
- `scripts/studies/neutralize-baked-study-plans.cjs`: blanks baked `[data-cs-plan]`, race and version in committed pages (idempotent, `--check`).
- 21 study pages: `plans.js` tag replaced by the gate script.
- `_redirects`: the four snapshot files are force-404 (kept in the repository, never served).
- Tests: `tests/study-withdrawal-fallback-browser.cjs` (23 real-browser cases: both pages, 10 live states, mid-session withdrawal), `tests/study-snapshots-not-served.cjs`, plus updated `tests/simon-study-browser.cjs` and `tests/simon-study-r2.cjs`. CI runs them (`.github/workflows/simon-study-r2.yml`).
- Verified locally (Chromium, Node 22): all of the above pass; mutating the gate so `unavailable` passes through is caught. WebKit not run.

## Residuals that remain in the committed files (not displayed, but present in source)
- The four snapshot files themselves (`published-plan.json|js`, `plans.json|js`): kept for builds/CI, not served.
- `SUMMARY_TRANSLATION` in `labs/the-two-curves/index.html` holds the plan summary's EN/FR text so a verified summary can be translated; it is shown only when it matches a verified live summary.
- `data-study-revision` (a version label), the editorial records in `bundle.json|js` and `evidence.json` (separately approved), and the dates written into the editorial copy.
- **Git history** of this public repository contains every earlier committed snapshot and baked page.
- **`plans/elijah-nov-11/` (resolved in this PR, pending deploy):** Elijah's earlier, revoked prescription (publication `elijah-nov11-half`, revoked 2026-10-18). Source (`index.html`, `program.json`) stays in git; `_redirects` force-404s every route to it. Guard: `tests/revoked-plan-routes-not-served.cjs`; post-deploy check: `scripts/verify-withdrawn-routes.cjs`. The *other* `plans/*` pages are classified in `docs/studies/PLANS_STATIC_PAGES_AUDIT_20261101.md`. A noindex tag is not access control.
- `plans/elijah-savannah-half/` is titled for the Savannah half but now fills with whichever Elijah plan is live (Palm Beaches); a content decision for Brice.

## Withdrawal checklist (if either athlete's consent is withdrawn, or a publication must come down)
Do these in order. Nothing here is automated or has been run.
1. **Database first (immediate for live reads):** set `revoked_at` on the live `plan_publications` row for that athlete (`simon-ceiling-durability-01`, `elijah-palm-beaches-half-2026`). Confirm `select public.paired_study_plans()` shows `unavailable` for that athlete and `study_003_plan()` (Simon) returns `unavailable`; confirm `public_plan_preview` returns null for the slug (it will once the allowlist ships). Published result rows (`plan_result_publications`) need `revoked_at` too.
2. **Website source:** replace or remove that athlete's entries in `labs/the-two-curves/published-plan.json` / `labs/same-pace-different-problem/plans.json` (and the `.js` twins); review `bundle.json|js` and `evidence.json` for plan-derived facts of that athlete; remove or revise the athlete's study entries and pages that quote the plan; update the CI contract (`simon-study-r2.yml` "Public access contract" compares the live revision with the committed one and will fail by design).
3. **Build and publish deliberately:** this site does not auto-publish. Commit, run the tests, then publish a new production deploy only with Brice's explicit instruction (Deployment Discipline).
4. **Netlify:** after the new production deploy, confirm the athlete's pages and `/labs/the-two-curves/published-plan.json`, `/labs/same-pace-different-problem/plans.json` return 404 or no plan content; **find and delete older production and deploy-preview deploys** that still contain the files (each deploy keeps its own permanent URL); check branch deploys.
5. **Git history:** decide explicitly whether to rewrite history of this public repository and what to do about forks/mirrors. Deleting a file does not remove it from history.
6. **GitHub Actions:** delete or expire runs and artifacts whose logs or `/tmp/simon-study-qa/*.json` summaries contain plan content.
7. **Third parties:** request removal/re-crawl from search engines; check web archives, social-card caches and the OG images (`og.jpg`, `og.png`) for embedded plan content; check `search-index.json` entries for the athlete's pages.
8. **Other surfaces:** the iOS app does not call the study functions. The Console and edge functions were searched statically only.
9. **Verify and record:** fetch each of the above from outside (logged out, fresh browser), record dates and who did what, and note it where the consent record lives.
