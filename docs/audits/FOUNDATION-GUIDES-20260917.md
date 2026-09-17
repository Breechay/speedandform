# Foundation guides: Pass 4A

Owner: Brice. Scope: the first four explanatory Library guides. The single release register remains `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`.

## Release receipt

**LIVE September 17, 2026 at 04:27:38.402 UTC.** PR #125 merged as `ce36b2e609f6b4f57f6962aa3928f339df6ef085`. Netlify production deploy `6aab6c2e902549000956329d` is ready on the existing site `f3914a6a-a9ce-465e-8212-f5f42597c469`; its record names that exact release commit. The existing main-branch publish performed the deployment. No additional manual production deployment was triggered.

Read-only branch CI `35181822997` passed on `2b60817c3eb797f35df29809e8715584f0df7897`. Merged-main CI `35181987634` passed **ten source/regression suites, 188 guide browser checks, 110 gallery checks, 61 discovery checks and 17 homepage/intake/media checks**, then verified the actual published site.

Production verification began at `2026-09-17T04:29:19.535Z`. All four revised guides and three exact public assets (guide CSS, guide JS, unchanged cream CSS) passed by `04:29:21.613Z`. The existing discovery checks passed all **72 canonical pages, six public resources and six route cases** by `04:29:27.433Z`; the sharing recheck passed **19 pages and ten distinct image URLs** by `04:29:35.644Z`; gallery checks passed **two pages and twenty resources**, including the photo ZIP and film, by `04:29:48.276Z`. No readiness retries were needed.

The actual live Chromium guide test then passed **37 checks**: all four guides at 390 and 1440 pixels, HTTP responses, contained layouts, readable body type, citation links revealing their sources, the retained form bookmark, no prescribed metronome default, actual audio startup/Stop controls and no runtime errors. These are browser viewport checks, not physical-device claims.

Artifact `10481110342`, `foundation-guide-receipt`, from main run `35181987634` contains the exact source commit, editorial manifest, test output, browser reports, screenshots and four production reports. Retention is fourteen days; this document preserves the permanent receipt. The final workflow has read-only permissions, no transfer fragments, no source-writing bootstrap and no deployment step. The review archive contains no source archive or font files.

## The four routes

- `/easy-run`: conversational effort, repeatable training, a 30-minute example, and adjustments for heat, fatigue and pain.
- `/threshold-training`: controlled sustained work, what threshold does and does not mean, an explicit 3 x 6-minute example with its full 47-minute session arithmetic, progression and race-pace distinctions.
- `/long-run-pace`: purpose and duration before pace, easy versus a deliberately steadier finish, a 60-minute example and preparation. No universal duration threshold or fixed seconds-per-mile prescription.
- `/running-form-errors`: the original URL, now titled Running Form: What to Change, What to Leave Alone. Start with the runner's experience, observe in context, test one cue, and compare. Seven observations are disclosures, not diagnoses.

`/threshold` and `/long-run` are existing execution/recording tools, not the explanatory pages selected in this batch. Their source, scripts and records are unchanged. No duplicate route or redirect is introduced.

## Editorial decisions

Each page gives an immediate answer, short in-page navigation, practical examples, related reading and a contextual route to the existing coaching intake. Native disclosures keep depth available without requiring JavaScript. Step sequences and effort comparisons use semantic HTML/CSS, not pictures of text. Visual proportions are not presented as measured athlete data. The cadence arithmetic example is explicitly not a universal prescription.

The form page retains every earlier fragment identifier and a functional metronome. A reader chooses a rhythm; there is no default 175 or 180-step target. The practice runs for at most one minute and stops on demand, on a tempo edit, when its disclosure closes, when the tab is hidden, or on departure. Audio starts only after a deliberate action. No microphone, upload, account or analytics API is used. A browser that cannot start sound produces an honest error rather than a false Playing status.

Original copy conflated movements with diagnoses and used unsupported universal targets. The revised pages do not infer weak muscles or injury causes from a video, force a forefoot landing, treat every arm or trunk difference as an error, prescribe one ideal cadence, describe lactate as waste, or make long-run pace a fixed offset from threshold for everyone. Coaching examples are separated from research findings and individualized assessment.

## Evidence review

Claim-linked references appear in each guide, with short limitations in Sources & context. Source review used the following published material, not secondary coaching summaries:

- Persinger et al., 2004, talk-test consistency (PMID 15354048), alongside Rotstein et al., 2004, speech/intensity variability (PMID 15221401). Comfortable speech is useful, not an exact laboratory threshold.
- Esteve-Lanao et al., 2007, a small randomized training-distribution study in subelite runners (PMID 17685689). It supports substantial low-intensity work, not a universal weekly ratio.
- Faude, Kindermann and Meyer, 2009, distinct lactate-threshold concepts (PMID 19453206); Emhoff et al., 2013, human lactate-oxidation research (PMID 23788576).
- Racinais et al., 2015, training and competition in heat (PMID 26069301).
- Unhjem, 2024, prolonged running and running economy (PMID 38671555). Supports attention to accumulated demand, not the invented claim that every run becomes a long run at minute 50.
- Thomas, Erdman and Burke, 2016, Nutrition and Athletic Performance (PMID 26920240). The guide gives preparation principles, not a universal intake prescription.
- Heiderscheit et al., 2011, step-rate manipulation and joint mechanics (PMID 20581720); Snyder and Farley, 2011, energetic stride frequency (PMID 21613526); Zhang et al., 2025, habitual foot-strike loading comparisons (PMID 39701021). Biomechanical change is not proof of injury prevention, and shifting load is not removing it.
- NHS, Knee pain and other running injuries, for general stop/assessment advice.

No new athlete result, testimonial, diagnosis, medical credential or app capability is asserted. Article schema identifies the visible author and actual revision date; original publication dates are not invented. Old FAQ schema was removed rather than preserving outdated answers in metadata.

## Boundaries and maintenance

Four guide HTML sources and four Library labels plus their matching ItemList are the only intended existing HTML changes. `GUIDES-MANIFEST-20260917.json` records exact before/after hashes against main `adaaa8c48f01303710aa6a53ee9258ecc48b72a8`. **172 other HTML files remain byte-identical.** Original Pass 1, Pass 2 and Pass 3 release receipts retain their evidence. Prior regression suites accept only the five exact later HTML snapshots, and the new suite checks each against its original baseline and verifies every other HTML file is unchanged.

The scoped guide stylesheet inherits the existing cream material, ink and typography. The shared cream CSS/build, discovery CSS/search code, gallery, homepage media/layout/measurement, Labs, native app pages, paid-plan source, intake, private delivery and operational tools remain unchanged. Canonical URLs and the approved social images are preserved. The catalog count and sitemap addresses do not change.

Content is authored in `scripts/guide-content.cjs`; `scripts/build-guides.cjs` generates only the four guides. Review catalog wording and run the discovery generator when those labels change. Update the new editorial manifest deliberately after a reviewed change; do not overwrite historical receipts or weaken preservation tests. The Netlify build does not acquire a new content-generation dependency.

## Acceptance details and remaining scope

The six-width review covers 375, 390, 430, 768, 1024 and 1440 pixels. It tests all opened disclosures, first-screen answers, keyboard skip links, visible and disclosed source references, 200% zoom, old bookmarks, real Web Audio startup and cleanup, input/error states, the practice time limit and no-JavaScript reading. Existing gallery and homepage tests intercept external requests and submissions.

The initial review exposed narrow-column overflow at 200% zoom; the examples now reflow and text wraps without clipping. Two test-harness assumptions were corrected without weakening checks: source links inside closed disclosures are first exposed through their controls; stopped status inside a closed disclosure is read from DOM text rather than rendered innerText, which is empty while hidden. The initial missing attribute-decoder export was replaced by the module's exported attribute parser. Final branch and merged-main runs passed afterward.

**No real inquiry, email, payment, signup or external message was sent.** Physical iPhone/iPad, Safari, screen-reader output and third-party preview caches remain unverified. No ranking, indexing, conversion or numerical design-score gain is claimed.

This closes the first four-guide batch, not the entire Library. Further educational batches, the two app landing pages and contact/newsletter work remain queued in the single release register. Do not restart the whole-site audit before the next bounded batch.
