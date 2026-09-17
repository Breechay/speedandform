# Coaching funnel measurement and message match: September 17, 2026

## Current decision

Brice approved the bounded ad-to-homepage clarification after pointing out that homepage copy had already changed during the live campaign. Earlier campaign results cover multiple homepage versions. Do not treat them as a verdict on the latest page or as a controlled A/B comparison.

The approved copy phase keeps the ad, audience, budget, price, footage, typography, cream sections, Simon evidence, coaching scope, remote pathway, five-question intake and measurement behavior unchanged. Hold this pairing steady after its verified publication, inside the original campaign budget. Judge qualified coaching inquiries per campaign-tagged session, with starts and completions explaining the outcome. Do not extend spend automatically because tracking or copy improved.

### Approved copy phase: PR #130

Release receipt and actual deployment timestamp: https://github.com/Breechay/speedandform/pull/130 . The PR receipt owns final test/visual acceptance and production status; a branch or an in-progress test is not a live release.

Only runtime file: `index.html`.

- Keep `Run Development` and `Run better. Get faster. Run farther.`.
- Supporting paragraph: `I watch you run, build your plan, and coach you through it. Weekly track coaching in Miami, with adjustments as you develop.`
- Beside/below `Work with Brice`: `Your first Miami track assessment is complimentary.` followed by `Start with a conversation.`
- At intake start, and retained at review: `An inquiry only. No payment or booking yet.`
- Copy marker: `data-coaching-copy="20260917-coaching-clarity"`. This is a markup revision, not a new GA4 custom parameter.
- Small-phone acceptance exposed an existing rule hiding hero-action spans below 360px. A local display/line-height override keeps the approved reassurance visible without changing the site's stylesheets or design system.

Baseline: `780f409ed521f3c6290c19e0d80279331bf4eecc`.
Homepage source blob: `84a82b0631debcfff9ed6bf7581b8425665792a5`.
Source/test revision: `5f53cceba29135fc9116aebc4cad406bc69edb1d`.
Acceptance run: https://github.com/Breechay/speedandform/actions/runs/35220043540 .
The release-scoped source test verifies the entire baseline HTML plus only these four replacements, allowing a final newline difference. Existing CSS and JavaScript must match byte-for-byte. Copy checks cover 320, 375, 390, 430, 768, 820, 1024 and 1440 CSS pixels in Chromium and WebKit; the existing funnel and homepage tests run too. All acceptance-test transport is intercepted. The release receipt must report actual results and inspected screenshots, not simply repeat this test plan.

### Observation boundary

Use the production `published_at` timestamp in PR #130, converted to the analytics property's timezone where needed, as the new copy-phase boundary. Do not assume the Git commit time equals publication. If only daily reports are available, treat the deployment day as mixed and use the next complete day as the clean day-level window. Do not invent which version any earlier visitor saw. The measurement version remains `20260917-measurement-1`; it does not distinguish these two copy phases by itself.

## First-pass measurement history: PR #128

The first pass instrumented the existing homepage and verified the inquiry journey without changing copy or design. Low engagement is a diagnostic signal, not proof that the page is weak; low frequency alone does not establish creative quality.

- Source/test revision: `531707b9fa9a46a113cb9897937db64e802a0edd`.
- Measurement version: `20260917-measurement-1`.
- Measurement source blob: `18dd624b94bd2d00c4d3236c18087d6e8aaa797a`.
- Actions run: https://github.com/Breechay/speedandform/actions/runs/35209033656 . Both Chromium and WebKit completed successfully.
- Chromium artifact `10491636340`; WebKit artifact `10491117140`.
- First-pass funnel acceptance: 15 checks per engine. Existing homepage regression: 17 checks in Chromium. Source contracts passed.
- Published main `a8a778a0ce30d8eca12f7ac43efcd84583164bec`; Netlify production deploy `6aabbdbcc8877200087c538a`; publication `2026-09-17T10:15:38.899Z`.
- Production source verified. Receipt: https://github.com/Breechay/speedandform/pull/128 . This is not proof of analytics-provider ingestion.

## Measurement contract

GA4 retains its existing single automatic page view and `generate_lead`. Meta retains its existing single PageView and accepted Lead. Preserve GA4 `G-HKG3MXM668`, Meta `147659485878240`, the opaque FormSubmit endpoint and athlete Reply-To.

| Event | Definition |
| --- | --- |
| `coaching_cta_click` | First click per fixed CTA placement on this page load. |
| `coaching_intake_view` | An active inquiry question enters the visible viewport; not an offscreen page-load impression. |
| `coaching_intake_start` | First goal answer. Opening the questionnaire alone is not a start. |
| `coaching_step_view` | First visible visit to question 1 through 5. |
| `coaching_step_complete` | Actual forward transition to the next question, or from question 5 to review. |
| `coaching_review_view` | Review becomes visible. |
| `coaching_submit_attempt` | Enabled Send clicked; retries are separate attempts. |
| `coaching_submit_error` | A submission attempt exposes the existing recovery message. |
| `coaching_email_fallback` | Recovery email link clicked; its private URL is never included. |
| `generate_lead` | Existing callback after HTTP success AND relay success:true. Once per page load, including repeated callback execution. |

Parameters are restricted to fixed form ID/version, step number, fixed CTA placement and method. No field values, selected training answers, names, email addresses, free text or mailto bodies enter these custom events. This is not a claim that the entire GA4 property's enhanced-measurement settings have been audited. Do not mark intermediate events as key events merely to raise engagement rate.

Views/completions are deduplicated per page load, not per person across reloads. For conversion rates use campaign-scoped sessions/users, not raw event counts summed across unrelated sessions. Back/edit visits must not create duplicate completions. An accepted relay response is not proof of inbox delivery or a qualified prospect.

## Safe tests

All automated browser transport is intercepted: no real analytics events or inquiry emails are sent by the acceptance suite. The existing checks cover positive, negative, HTTP failure, network failure, double-click, script re-execution, retry, timeout and broken-collector cases. GPC and DNT suppress initialization/events while normal inquiry delivery continues.

For manual UI inspection use `/?form_qa=1`. This explicit mode keeps a bounded local diagnostic log at `window.formCoachingQA.events`, loads no GA4/Meta collectors, blocks live FormSubmit requests and prevents recovery-email navigation. A Send attempt therefore deliberately shows the recovery state. It is not a way to test a real mailbox. Normal links must not include this QA flag. Never use the live paid-campaign tag for synthetic testing.

## One remaining-checks list

- [x] Existing accepted-lead callback inspected; no duplicate conversion source added.
- [x] Privacy-safe intermediate events and explicit isolated QA mode implemented.
- [x] First-pass Chromium/WebKit funnel acceptance and existing homepage regressions passed.
- [x] First-pass 390px hero/review screenshots inspected; no reproduced navigation failure warranted a redesign.
- [x] First-pass measurement published and production source verified in PR #128.
- [x] Connected GA4 read confirms existing speedandform.com events in property `371147428`, stream `5092063526`. This is not proof of receipt of the new events.
- [x] Second-pass approved coaching paragraph and earlier assessment/inquiry reassurance implemented; no paid Analysis offer implied.
- [ ] Close copy-phase browser and visual acceptance, then publish verified source. Record actual results, commit, deploy, public-page verification and observation boundary in PR #130; its release receipt supersedes these pre-release boxes without requiring another documentation-only production deploy.
- [ ] GA4 Admin: confirm/register event-scoped `step_number`, `cta_location`, `funnel_version` and `form_id` custom dimensions without duplicating existing definitions. Windsor exposes GA4 reads but no GA4 admin writes. Registration was not performed here.
- [ ] Confirm new-event receipt in the authenticated GA4 property and Meta accepted Lead receipt; reconcile a genuine accepted inquiry with inbox delivery. No real test lead was generated. Do not treat missing settled reports as proof of failure.
- [ ] Physical iPhone Safari and Instagram in-app keyboard/browser-chrome check. Emulated touch/WebKit is not a physical-device test.
- [ ] Read settled post-copy-phase performance separately from earlier mixed-homepage traffic. Do not claim that copy alone caused a change in this sequential observation.

References: Google engagement definition https://support.google.com/analytics/answer/12195621 ; event-parameter reporting and custom dimensions https://developers.google.com/analytics/devguides/collection/ga4/event-parameters .
