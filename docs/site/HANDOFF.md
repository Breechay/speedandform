# SPEED & FORM — SITE HANDOFF
*For Cursor, Chat, or anyone picking up the site work. Last updated after Pass 2 copy application.*

## What this site is
The public expression of two apps from one house. FORM (running, live on the App Store)
and FORGE / Breechay Sculpt (physique program for men, pre-launch). The site is a
conversion surface AND a strategic mirror — presenting the products cleanly forces
clarity about them. It is deliberately not a generic fitness landing page.

## The one-card voice guide (LOCKED — calibrated with Brice directly)
- **The promise:** All the thinking is done. Open the app, do the work, results follow.
- **The spine:** A few things, at the right emphasis. Never everything at the same volume.
  (Said out loud exactly twice: house philosophy section + FORGE recognition band,
  both under "Stop training everything at the same volume.")
- **The register:** Warm-direct. We smile, and we get to work. Encourage once per
  section; never coddle. Headlines short and concrete; one plain line of why beneath.
- **Buyer nouns** on the site: physique, plan, week, results. Doctrine nouns
  (silhouette, campaign, instrument-doctrine language) stay inside the apps/docs.
- **Poetry budget:** ONE earned line per room. FORGE's lives inside the demo Record
  payoff ("The work does not disappear when the session closes.") — it stays there
  because the visitor just proved it. Command-closes at the doors: FORM "Let's go."
  FORGE "Get to work."
- **Claims must be demo-provable.** "Two taps," "already there" — the demo above
  each claim must literally do it.
- Full section-by-section copy (incl. hero A/B variants): PASS2-COPY-DECK.md.
  Variant A is applied. Do not regress to the killed lines listed in the deck.

## Architecture (FROZEN — do not restructure)
    index.html                          /               the house
    form/index.html                     /form/          LIVE — real App Store CTA
    form/support|privacy|terms/         FORM legal (stubs; see gates)
    forge-sculpt/index.html             /forge-sculpt/  pre-launch CTA + email capture
    forge-sculpt/support|privacy|terms/ FORGE legal (verbatim-confirmed; placeholders)
    assets/form | forge | site/         images, anatomy renders, ONE shared fonts dir
    favicon.ico, apple-touch-icon.png   house seam mark (repo icons take precedence)
    _redirects, netlify.toml, sitemap.xml  MERGE-ONLY snippets — never overwrite

Route decision: FORGE stays at /forge-sculpt/ (its existing public URL, dedicated
folder, zero conflict with anything else in the repo). Moving to /forge later is an
optional rename + one redirect — never a prerequisite.

## Key mechanics someone might otherwise break
- **Reveals are transform-only.** Nothing is ever hidden behind opacity/JS. Full-page
  captures, no-JS, and reduced-motion must always show complete content. Do not
  reintroduce opacity-gated reveals.
- **Pinned loops are progressive enhancement.** The stacked scenes are the default
  DOM; desktop+JS+motion upgrades to the pinned crossfade. Both copies of scene text
  exist (stage + stack) — edit BOTH when changing loop copy.
- **Demos are data-driven.** FORM_WEEK and FORGE_SESSION objects in each page's
  bottom script. Swap fixtures freely; do not hardcode states into markup. The
  static markup inside each demo section is the no-JS fallback — keep it in sync.
- **Motion tokens** (:root --m-*) govern every transition. Tune numbers, don't fork.
- **Analytics:** sfTrack buffers to window.sfEvents and mirrors to dataLayer.
  Stable event names (see EXPERIENCE-PASS-BACKLOG.md). Wire a provider later;
  don't rename events.
- **Reserved hooks for the experience pass:** [data-demo][data-instrument] (FORM
  contour choreography), [data-demo][data-state][data-region] (FORGE anatomy
  response + strike), [data-seam] SVG on the house (terrain→fiber morph).
- **Legal grid:** .item is a 2-col grid; heading+body MUST stay wrapped in
  .item-copy or copy collapses to one word per line.

## Decision log (why things are the way they are)
1. FORM is live → real listing (id6761313085) on all FORM CTAs. FORGE pre-launch →
   "Coming to the App Store" ×3 with a marked comment where the real link goes.
2. FORGE legal is the confirmed verbatim policy with 7 placeholder tokens for
   Cursor. FORM legal was NOT authored from screenshots — the published policy must
   be ported verbatim (comments in form/privacy/ and form/terms/ mark the spot).
3. The FORGE website email form changed the privacy facts → disclosed at
   /forge-sculpt/privacy/#website-form (Netlify processor, single launch email,
   deletion, no lists). The app-vs-website distinction is explicit. If the form is
   removed, the disclosure can be too.
4. noindex lives ONLY on the six legal routes until gates clear. Marketing pages
   are indexable.
5. FORM canon: five instruments (Easy, Threshold, Interval, Speed, Long Run).
   Never enumerate a subset. Progress is not an instrument — in the demo it is a
   separate "See what changed" action outside the tablist.
6. Icons are placeholder house-seam marks; existing repo brand icons win.

## Production gates (before any launch claim)
See README-DEPLOY.md preflight. Summary: FORGE's 7 legal placeholders; FORM policy
port; Netlify Forms enabled (or remove the form); FORGE store link at launch;
config merges done in repo; /library + /the-field confirmed alive after merge.

## Status by pass
- **Structure: FROZEN.** Routes, chrome, demos, tokens, hooks, fallbacks.
- **Pass 2 (customer language): APPLIED** from PASS2-COPY-DECK.md (hero variant A).
  FAQ kept factual as-is; optional tone-pass remains.
- **Pass 1 (deepen demos): NEXT.** Contour choreography, anatomy response, Record
  resolve. Hooks are in place; fixtures replaceable.
- **Pass 3 (atmosphere/finish): DEFERRED.** See EXPERIENCE-PASS-BACKLOG.md.
  Chat's standing warning: the empty space in both rooms is load-bearing —
  fill it with behavior and language, not decoration.

## How to QA locally (the method used throughout)
    cd <site root> && python3 -m http.server 8000
Then verify: all 9 routes load with zero 4xx and zero console errors; no horizontal
overflow at 1440 and 390; demos operate end-to-end (FORM: 4 tabs + change action;
FORGE: set→rest→set→Record, all four steppers); JS disabled still shows complete
content incl. demo fallbacks; window.sfEvents fills as you interact.
