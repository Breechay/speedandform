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

**What FROZEN means, exactly.** Frozen = routes, functional machinery, data hooks,
fallbacks, analytics, and legal structure. **The internal visual composition of
`/forge-sculpt/` MAY change — but only through `NORTH-STAR-ADOPTION.md`, and only
while preserving those contracts.** Redesigning the page is permitted. Reopening
routes or deleting machinery is not.
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

## DO-NOT-REGRESS LIST — verify against THIS, never against your own diff

Every item below is live on a shipping page. If your change removes one, it is a
regression regardless of how good the change is.

| Feature | Lives at | Verify with | Why it can't go |
|---|---|---|---|
| `FORGE_SESSION` demo | `forge-sculpt/index.html` — CSS ~200–236, HTML ~518–543, JS ~760–839 | `grep -c FORGE_SESSION` → **14** | Claims must be demo-provable. "You open it. You execute." is only true if the demo does it. |
| `data-demo` / `data-region` | demo `<section>` + JS selectors | `grep -c` → **2** / **1** | JS selects on them. Removing them kills the demo silently. |
| `demo_started` / `demo_completed` | demo JS | `grep -c` → **1** / **1** | Stable event names. Never rename. |
| Netlify email capture | `#notify`, `name="forge-prelaunch"` | `grep -c data-netlify` → **1** | Pre-launch conversion. Its privacy disclosure exists *because* of it (decision log #3). |
| `sfTrack` + `data-sf-event*` | bottom script | `grep -c sfTrack` → **6** | Analytics. Wire a provider later; don't rename events. |
| Legal footer links | footer | `grep -c "forge-sculpt/privacy/"` etc. | Compliance. Not optional on a page with a form. |
| "Coming to the App Store" ×3 | hero, price, final | `grep -c` → **3** | FORGE is pre-launch. There is no store link yet. |

**The counts are a BASELINE, not an eternal invariant.** They are the current
production numbers. A legitimate refactor might take `FORGE_SESSION` from 14
occurrences to 12 while the demo works perfectly. **A changed count is not
automatically a regression — but it requires an explicit explanation and behavioural
verification before merge. An unexplained decrease fails the gate.**

The real invariants, which no refactor may break:

- the `FORGE_SESSION` fixture still exists and still drives the demo
- the demo initializes
- `data-demo` / `data-region` still resolve for the JS that selects on them
- state transitions work: set → rest → set → Record, all four steppers
- `demo_started` / `demo_completed` fire, once each, under the same names
- the no-JS static fallback remains and stays in sync with the fixtures

**How this list gets broken — 2026-07-15, verbatim, so it isn't repeated.**

An agent replaced this page with the north-star design. It grafted back the form,
analytics, legal links, and CTA — then verified those four and reported success.
It had **itself** produced the evidence, hours earlier, that `FORGE_SESSION` (14),
`data-demo` (2) and `data-region` (1) were live and had to survive. The demo was
deleted. The verification passed because it tested the work that was done rather
than the list of things that had to hold.

> **A checklist built from what you changed will always pass. Verify against the
> list above, before the diff, and paste the counts.**

Caught in review, before push. Nothing shipped.

## The north star is a DESIGN REFERENCE, not a deployable page

`forge.html` (in the FORM-iOS repo, `FORGE_START_HERE.md` §1) is the approved
visual and tonal reference. **It is not the live page and must never be copied
over `forge-sculpt/index.html`.** It contains zero of the do-not-regress items,
and it annotates itself:

    data-audit="BUILD — ATHLETES UNCONFIRMED / PERMISSION REQUIRED"
    data-audit="BUILD — PRICING NOT APPROVED"
    data-audit="BUILD — CTA STATE PENDING APPROVAL"
    data-audit="POLISH"        ← the #today "device" is a PICTURE, not the demo

Adopting its design means porting the composition **around** the live machinery,
not replacing the page with it. Known corrections needed before any adoption:

- `#today` device mock says **"140 KG"** — FORGE ships **pounds** (signed 2026-07-15).
- Athletes section is four placeholder cards. §6: real, permissioned, real durations.
- Price cards state $99/$19.99 — **unapproved**. The live page states no price by design.
- "The curriculum runs the better part of a year" — only Phases 1–4 ship (~15 weeks).
  Restore only when Phases 5–12 + Hold + re-entry ship.

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

## DEPLOY & ROLLBACK

Netlify serves the repo root on `main` and auto-deploys every push (~1 min to live).
**No build step. No staging. Pushing main IS deploying live.**

    # 1. QA locally first — always
    cd ~/Documents/speedandform && python3 -m http.server 8000
    #    → http://localhost:8000/forge-sculpt/  at 1440 and 390

    # 2. Verify the do-not-regress list ABOVE. Paste the counts.
    grep -c FORGE_SESSION forge-sculpt/index.html    # expect 14

    # 3. Inspect before staging
    git status
    git diff --check

    # 4. Stage, re-read, commit, push
    git add forge-sculpt/index.html docs/site/HANDOFF.md
    git diff --cached
    git commit -m "..."
    git push

    # ROLLBACK — if anything looks wrong live
    git revert HEAD && git push

Risky change? Use a branch + Netlify Deploy Preview instead of main.

### Agents: READ-ONLY GIT. No exceptions.

An agent may read the repo and edit files. It may **not** run `commit`, `add`,
`checkout`, `rm`, or any mutating git command. Brice runs those from Terminal.

This is not etiquette — the sandbox is subtly broken against these repos:

1. **Hooks silently don't run.** `.git/hooks/pre-commit` is a symlink to an absolute
   macOS path that doesn't resolve inside the agent sandbox. Git skips a broken hook
   symlink **without warning**. On 2026-07-15 an agent committed 30 files — four
   syntactically broken — straight past the guard built to stop exactly that. Neither
   party knew the check hadn't run.
2. **Locks get stranded.** Sandbox git can create `.git/index.lock` and `HEAD.lock`
   but cannot unlink them. It stranded locks on both repos three times in one session.
   Clearing one: verify no owner with `lsof .git/index.lock` and `ps aux | grep '[g]it'`
   — a `com.apple` read handle is just Spotlight — then `rm -f .git/index.lock`.

An agent's commit looks identical to a checked one and isn't.
