# Site Rebuild — Integration Report (branch: site-rebuild)

## Merged against the real repo (not blind replacement)
- **_redirects**: four rules retargeted — /app, /privacy, /terms, /support now 301 to
  /form/ and the /form/* legal routes. Everything else untouched (coach /forge/* SPA
  rules, Library, Field, Ghost, athletes, WP-spam blocks all preserved).
  Added: /forge-sculpt.html → /forge-sculpt/ 301.
- **netlify.toml**: UNTOUCHED — existing headers already cover /assets/* immutable +
  no-cache pages; the /forge/* SPA rewrite stays.
- **sitemap.xml**: two URLs added (/form/, /forge-sculpt/); the existing 65 preserved.
- **Icons**: repo's real favicon.ico / apple-touch-icon.png kept; placeholder seam
  icons NOT imported.
- **robots.txt**: untouched. NOTE: it disallows /assets/ — consider allowing og
  images if link previews matter.

## Legal gate: CLOSED for FORM
form/privacy/, form/terms/, form/support/ are byte-for-byte copies of the published
privacy.html / terms.html / support.html. Old URLs 301 to them. The originals remain
in the repo (dormant; direct .html hits still work). FORGE legal routes still carry
their 7 placeholders and stay noindex.

## Intentionally removed (old homepage → new house)
- FORM "SportsOrganization" JSON-LD → replaced with a Speed & Form Organization block.
- 12KB inline phase-countdown script (RACE_DATE / Key Biscayne taper logic) —
  homepage-specific to the old FORM page; not ported. If wanted, it belongs on a
  FORM subpage, not the house.
- Old FORM-only homepage content → superseded by the house (FORM door → /form/).
- app.html superseded via /app 301 (file kept, dormant).

## /forge conflict: resolved by architecture
Coach React SPA owns /forge/* (source: forge/, build: forge-app/). Public product
page lives at /forge-sculpt/. No migration, no collision.

## What still needs a human/Netlify dashboard
- Enable Netlify Forms for the FORGE notify form (or remove the form).
- FORGE App Store link at launch (3 marked spots in forge-sculpt/index.html).
- FORGE legal placeholders (see docs/site/README-DEPLOY.md preflight).
