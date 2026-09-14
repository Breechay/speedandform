# Homepage coaching flow and visual review

September 14, 2026. PR112. Scope: root homepage; other public routes and auth behavior unchanged.

## Observed defects and changes

- Intake inferred the $1,800 offer from strength/HYROX plus running frequency. Replaced with explicit Run / Run + Strength selection, visible prices, and matching review/submission values.
- Faint 9–10px labels and small text actions weakened the inquiry path. Added readable labels, clear action buttons, a contained questionnaire, aligned goal grid and compact days row.
- User-entered issue/video text entered the review as HTML. Escape it before rendering.
- Question transitions could leave the next heading above the viewport. Focus the heading and bring the new question into view. Video attachment is now a keyboard-operable button; email and note have accessible labels.
- App showcase occupied a long stretch before pricing. Preserve the illustration behind a native, keyboard-operable disclosure.
- Footer was a faint brand caption plus small navigation. Rebuilt as a dark ending with larger FORM mark, two useful navigation groups, comfortable targets and a single lower divider. Tablet columns stack before link text becomes cramped.
- Mobile film frames could weaken copy contrast. Add a bottom scrim while preserving existing footage, pause control and reduced-motion handling.

## Evidence and claims

Simon screenshot supports an activity moving time of 1:26:15, 6:35/mi, and his three-month testimonial. Publish the rounded 1:26 with the source label, both pace units and original activity link. No verified previous chip result, eight-week outcome guarantee, direct economy measurement or HYROX result is claimed.

## Verification

JavaScript syntax and git whitespace checks pass. A jsdom exercise with all outgoing requests mocked verifies: HYROX does not upgrade the offer; explicit offer changes update the fee; arbitrary user text remains literal; campaign tags reach relay/storage payloads and email fallback; failed sends retain a retry. No inquiry was sent.

A Netlify branch preview contains only the homepage, its four public media assets, preview configuration and a responsive review wrapper. Site navigation in that preview points to the existing public site. Full repository upload was rejected by automatic review; the narrow preview succeeded. It is not a production replacement.

Browser review: phone-sized hero, Simon block, intake goal/history/contact/review, and footer; tablet footer revealed cramped columns and was corrected. Final branch preview 6aa8213fc9c8d3ae5b35d57f: browser DOM measurements showed scrollWidth equal clientWidth at 375, 390, 430, 768, 1024 and 1440px. Inspected phone intake and result, tablet footer, and earlier desktop full-page composition. The training disclosure opens. These are browser viewport checks, not physical-device tests. Final copy also explicitly includes a first 5K. Physical iPhone/iPad, 200% browser zoom, and actual inbox delivery remain unverified.

Netlify reports Forms disabled. The inherited email relay and user email fallback remain in place; do not treat a successful response as independently verified inbox receipt. No analytics pixel or new tracking service was added. UTM tags describe a tagged inquiry and do not prove multi-touch attribution or classify untagged visitors as referrals.

## Release follow-up

PR112 merged as `5210f38deef20affa483ef1487428ef5ebb42708`; tested implementation head `be970e033f092441f61b6cfc3839a69745f4d906`. Branch preview `6aa8213fc9c8d3ae5b35d57f` is ready; public route: https://codex-home-review--zingy-speculoos-16852a.netlify.app/ . Source adds a final first-5K wording clarification beyond that preview. 1024px intake and 768px corrected footer visually inspected. Six-width overflow check passes; mocked send/fallback tests pass. No live inquiry submitted.

A separate manual production-build request was rejected by automatic approval review; it was not retried. A subsequent site-state read showed that the prior GitHub merge had already triggered the normal production deployment. Netlify confirms production `6aa8222b75fb510008166dfb`, commit `5210f38deef20affa483ef1487428ef5ebb42708`, published September 14 at 16:35:05 UTC. Live browser verification confirms the new coaching selector and updated homepage content. No additional manual deployment is needed.

The automatic publication behavior differs from the older comments in netlify.toml. Treat the actual Netlify state as authoritative. This release-state documentation is committed with [skip netlify] to avoid an unnecessary production rebuild.

Subjective design assessment after the refinement passes: homepage about 9/10, intake 9/10, footer 9/10 on inspected layouts. This is not a measured conversion score or a physical-device acceptance claim. Remaining validation is explicitly listed above.


## September 14: offer scope refinement

Brice confirmed the complimentary initial Miami assessment and weekly track coaching, and authorized the proposed four coached gym sessions across eight weeks in Run + Strength. Extra gym sessions are arranged separately. Run remains $1,200; Run + Strength remains $1,800.

Practice copy now describes observation, cues, easy running, recovery, and one adjustment at a time. No measured economy gains or guaranteed eight-week outcomes added. Training example stays collapsed; its four outbound links were removed and Open FORM moved to the footer. Intake questions remain; video guidance is more welcoming.

Remote has a separate explicit inquiry selection. It carries Remote running and fee agreed before starting through review, email relay, storage attempt and mailto fallback, without mislabeling the inquiry as a Miami package. Scope and fee are discussed personally before commitment. No third price card.

Validation: mocked full intake checks passed for Run, Run + Strength and remote, campaign tags, escaped user input, failed delivery and fallback. All requests mocked; no email sent. CSS unchanged. Prior six-width checks belong to the preceding release; Production verified: main c4e42c8996735791bc82ae08ce4f2d0c3a457043, Netlify 6aa82f7f8dad3c0008bdc571, published September 14 at 17:31:56 UTC. Live desktop at 1348px has equal client/scroll width; offer copy, remote link selection, disclosure opening/closing and intake presentation verified. Updated phone/tablet-width and 200% checks remain open; no claim of refreshed six-width acceptance.


## September 14: editorial finishing pass

Live main 750249a948bc1a75881e91e2db39ba8a31f886c8; Netlify 6aa8313541dec30008756784, published 17:39:15 UTC. Includes preceding footer commit 947b825a1cef8663345126bcd30c83344a7c3963.

Footer: 5:3:4 proportional desktop composition, smaller mark, adjacent arrows, separate Open FORM line, less vertical space. At 1348px desktop footer height decreased from 433.5 to 380 CSS pixels. Simon: exact shorter quote, 20px supporting typography, padding 76 to 56px desktop and 54 to 40px mobile. Offer descriptions shortened while preserving weekly track coaching and four gym sessions. Coaching paragraph shortened; practice layout retained. Intake has eight equal goal cells, with Stop getting hurt removed and Not sure yet no longer spanning both columns. Run/Run + Strength selector labels match offer names; separate remote option remains.

Validation: production commit verified; actual desktop offer/intake/footer screenshots inspected, live eight-choice DOM and quote verified, desktop document/client widths equal at 1348px. Mocked complete intake regression passed including offer selection, attribution, escaping and failure fallback. No real inquiry sent. Browser zoom shortcuts did not change the viewport, so do not count them as zoom or phone tests. Refreshed phone/tablet and 200% visual checks remain open.


## September 14: hero micro-refinement

Restore From in the hero fee label; package descriptions and remote inquiry continue to distinguish delivery. Navigation opacity .76 to .84. CTA border opacity .45 to .36, vertical padding 12 to 10px, minimum touch height retained at 44px. Desktop subject-side scrim opacity .70 to .68 while preserving left/headline and top/bottom overlays. This is a CSS overlay adjustment, not a regrade of the video or a measured midtone increase. Headline, film asset, crop and mobile scrim unchanged.

Source diff is limited to four lines; whitespace check passed. Production verified for main 71e37450f3499bdb9ee648186f5c0f885fc3b889, Netlify 6aa831c7a738ed0008d82e6d. Live desktop hero screenshot inspected; From label, .84 navigation opacity and 44px CTA height verified. Client/scroll widths both 1348px. Mobile and full-film crop review remain open.
