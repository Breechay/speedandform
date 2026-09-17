# Coaching funnel measurement: September 17, 2026

## Scope and decision

First pass only: instrument the existing homepage and verify the current inquiry journey. Keep the Miami campaign, audience, budget, price, visual design, footage, copy and five-question intake unchanged. No new offer, shortened questionnaire, or earlier complimentary-assessment copy in this release.

Low engagement is a diagnostic signal, not proof that the page is weak. Low frequency alone does not establish creative quality. Evaluate qualified coaching inquiries per campaign-tagged session; starts, step progression and successful completion explain the result. Stay within the existing campaign test budget. Do not extend spend automatically because tracking was improved.

## Tested implementation

- Source/test revision: `531707b9fa9a46a113cb9897937db64e802a0edd`.
- Measurement version: `20260917-measurement-1`.
- Measurement source blob: `18dd624b94bd2d00c4d3236c18087d6e8aaa797a`.
- Actions run: https://github.com/Breechay/speedandform/actions/runs/35209033656
- Both `verify (chromium)` and `verify (webkit)` completed successfully.
- Chromium receipt: artifact `10491636340`; WebKit receipt: artifact `10491117140`.
- New funnel acceptance: 15 checks per engine. Existing homepage regression: 17 checks in Chromium. Source contracts also passed.
- Full inquiry tested at 375, 390, 430, 768, 1024 and 1440 CSS pixels in both engines. Existing homepage checks also include 320 and 820 pixels, a zoom-equivalent layout, reduced motion, actual video playback, keyboard skip link and the no-JavaScript email route.
- Production is not established by a branch or test result. Record the actual production commit/deploy in the release PR after publishing. This document captures pre-release acceptance; the PR deployment receipt supersedes this checkpoint.

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

All automated browser transport was intercepted: no real analytics events or inquiry emails were sent by the acceptance suite. Positive, negative, HTTP failure, network failure, double-click, script re-execution, retry and broken-collector cases passed. Existing tests cover timeout recovery. GPC and DNT suppress initialization/events while normal inquiry delivery continues.

For manual UI inspection use `/?form_qa=1`. This explicit mode keeps a bounded local diagnostic log at `window.formCoachingQA.events`, loads no GA4/Meta collectors, blocks live FormSubmit requests and prevents recovery-email navigation. A Send attempt therefore deliberately shows the recovery state. It is not a way to test a real mailbox. Normal links must not include this QA flag. Never use the live paid-campaign tag for synthetic testing.

## One remaining-checks list

- [x] Existing accepted-lead callback inspected; no duplicate conversion source added.
- [x] Privacy-safe intermediate events and explicit isolated QA mode implemented.
- [x] Chromium/WebKit funnel acceptance and existing homepage regressions passed.
- [x] Actual 390px hero/review screenshots inspected; visible controls, no overflow in tested layouts. No reproduced UI failure warranted changing the design.
- [x] Connected GA4 read confirms existing speedandform.com events in property `371147428`, stream `5092063526`. This is not proof of receipt of the new events.
- [ ] Publish the verified source and record Netlify commit/deploy plus live-source verification on the release PR.
- [ ] GA4 Admin: confirm/register event-scoped `step_number`, `cta_location`, `funnel_version` and `form_id` custom dimensions without duplicating existing definitions. Windsor exposes GA4 reads but no GA4 admin writes. Registration was not performed here.
- [ ] Confirm new-event receipt in the authenticated GA4 property and Meta accepted Lead receipt; reconcile a genuine accepted inquiry with inbox delivery. No real test lead was generated. Do not treat missing settled reports as proof of failure.
- [ ] Physical iPhone Safari and Instagram in-app keyboard/browser-chrome check. Emulated touch/WebKit is not a physical-device test.
- [ ] Second pass: after the technical read, move the existing complimentary first Miami assessment and inquiry-only reassurance earlier as the isolated copy hypothesis. No free paid Analysis offer implied.

References: Google engagement definition https://support.google.com/analytics/answer/12195621 ; event-parameter reporting and custom dimensions https://developers.google.com/analytics/devguides/collection/ga4/event-parameters .
