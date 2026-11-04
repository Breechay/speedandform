# FORM Method Bible and Coach Console · production release receipt

November 4, 2026 · 12:00 p.m. Eastern · public site and private coach UI

## Actual release state

- Owner authorization: Brice explicitly directed completion of the release
  without a personal design review, while preserving agent/data permissions.
- Source: [PR #462](https://github.com/Breechay/speedandform/pull/462),
  merged to `main` at `dfb2c2a3062546d83a76cfe21f826179cb26cca8`.
- Production: [PR #463](https://github.com/Breechay/speedandform/pull/463),
  merged to `production` at `0aea89345dee8823bc959defb6551776bf0eaa40`.
  A targeted release branch was made from the actual production head;
  divergent `main` history was **not** mass-merged into the live site.
- Netlify: ready production deploy `6aeb6489a87159adadeeb7c0`, published
  `2026-11-04T17:00:14.102Z`, with `commit_ref=0aea89345dee8823bc959defb6551776bf0eaa40`
  and no deployment error. Primary domain: `https://speedandform.com`.

## Verified live surfaces

- `https://speedandform.com/method-bible/`: Browser loaded the actual page,
  canonical title, 17 chapters, 17 anchor links, TOC, author, train-to-win
  distinction and authored learning/stimulus/recovery-cost doctrine.
  Viewport screenshot showed the expected ink/bone hero and readable type.
- `https://speedandform.com/llms.txt`: Browser loaded the agent discovery
  text and the link to the public Method Bible and Markdown source.
- `https://speedandform.com/coach/ops/`: Public sign-in gate loaded, with
  the five-area coach navigation. No owner data was accessed.
- `/coach/labs/` redirected to `/coach/console/` in the unauthenticated
  browser, as expected from the pre-existing access boundary. The Programming
  entry showed five-area navigation and loading. This is **not** signed-in
  dossier verification.
- Direct browser navigation to `method-bible/method.md` returned
  `ERR_BLOCKED_BY_CLIENT` in the automation browser; this route remains
  **browser-unverified**, despite being a committed static source linked from
  the live discovery file. Do not turn that tool block into a claim of HTTP 404.

## Tests and limits

- Focused local source tests: 21/21 passed.
- Full production-branch CI: 14 successful workflows, one failed
  coaching-funnel workflow. Its failure came from the pre-existing
  `tests/public-study-preview.cjs` expectation of an October 27 source date
  while the committed source returned October 20. Neither the study source
  nor its test was changed by this release. Do not rewrite athlete evidence
  to satisfy that unrelated expectation.
- Public menu, evidence-review, Console delivery, editorial, discovery,
  house integrity, operating-console and Method contracts passed in CI.
- A signed-in coach athlete workspace, filing, Week/feed readback, athlete
  consent toggle and physical native-app installation were not tested here.
- No athlete prescriptions, Supabase migrations, financial records,
  permissions, scheduled jobs or running autonomous agents were changed.

## Next owned work

1. Implement a single authenticated coach source/receipt projection with
   actual source freshness and individual access controls.
2. Implement the event-driven Filing & Feed Reconciler with idempotent
   ownership, effective sharing preferences, baseline attribution and
   real Week/feed readback. This remains a future build, **not live**.
3. Visually inspect the signed-in legacy Labs Full Plan/Week/Brief and
   production athlete context before claiming a complete light-system QA.
4. Reconcile the unrelated public-study-date CI failure against its owning
   study evidence, without retroactive data fabrication.

This receipt supersedes the pre-release status statement in the original
Console redesign brief. Successful production publication and authenticated
athlete functionality are distinct release facts.
