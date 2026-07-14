# Speed & Form — site deploy notes

## What this is
One flattened, repo-ready site root. Every referenced asset resolves inside this
folder. Serve over HTTP (Netlify does); do not judge via file://.

## Structure & routes (as delivered — no /forge migration required)
    index.html                        → /            (the house)
    form/index.html                   → /form/       (LIVE · real App Store CTA)
    form/support|privacy|terms/       → FORM legal   (noindex until published policy is ported)
    forge-sculpt/index.html           → /forge-sculpt/ (pre-launch CTA + email capture)
    forge-sculpt/support|privacy|terms/ → FORGE legal (noindex until placeholders resolved)
    assets/form | forge | site/       → images, anatomy renders, shared fonts
    EXPERIENCE-PASS-BACKLOG.md        → deferred polish work (do not execute yet)

The public FORGE page stays at /forge-sculpt/ — its existing URL, in its own
dedicated folder, so there is NO conflict with anything else in the repo and no
coach-app migration is required. Moving to /forge later is an optional, separate
task (rename folder + add one redirect).

## Integration — MERGE, do not replace
The included `_redirects`, `netlify.toml`, and `sitemap.xml` are minimal snippets
covering ONLY the new pages. If the repo already has any of these files, MERGE the
lines in; do not overwrite (you could lose existing coach routes, headers, or
build config). Same for `index.html`: it replaces the homepage, so first port any
existing integrations you still need (newsletter, analytics, Library/Field nav).
A unified diff against the live repo couldn't be produced from this environment —
have Cursor do the merge, or share the current `_redirects` / `netlify.toml` /
`index.html` and the diff can be produced next round.

## Production preflight (gates before removing any noindex / going live)
- [ ] FORGE legal placeholders resolved (3× [PUBLICATION DATE], delete-data path ×2, MetricKit, notifications)
- [ ] FORM published Privacy + Terms ported verbatim into form/privacy/ and form/terms/
- [ ] Website email disclosure live at /forge-sculpt/privacy/#website-form (it is — keep it if the form ships; remove the form if not)
- [ ] Netlify Forms enabled on the deploy (or remove the notify form)
- [ ] FORGE App Store link inserted at the 3 marked spots when the listing is approved
- [ ] _redirects / netlify.toml / sitemap.xml merged with existing repo versions
- [ ] Old root forge-sculpt.html / form.html deleted (redirect covers old flat URL)
- [ ] Site icons: this package includes placeholder favicon.ico + apple-touch-icon.png
      (the house seam mark). If the repo already has brand icons, KEEP THOSE instead.
- [ ] Confirm existing routes /library and /the-field still resolve after the homepage
      merge — the new pages link to them but they live in the current repo, not here.
