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

Pending final preview inspection and release. Do not treat PR existence as production publication.
