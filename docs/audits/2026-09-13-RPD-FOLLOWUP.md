# RPD release follow-up — September 13, 2026

## Site work
Pacing notes now share editorial revision `2026-09-13` in `plans/race-pace-durability/execution.js`. Web session cues, web guide, browser print and the downloadable PDF consume that module. The PDF has five landscape pages: its original four training sheets plus a pacing appendix. No training targets or volumes changed. The static web guide remains a no-JavaScript fallback.

Rebuild appendix: `python scripts/build-rpd-pacing-pdf.py` (Node, reportlab, pypdf and DejaVu Sans required). The script verifies the first four pages retain identical extracted text and replaces any prior appendix. When the canonical training plan changes, regenerate the training sheets first; this script deliberately does not refresh those sheets from the network.

Removed Ceiling's unsupported 36:20 / 43:15 projections. Its comparison inputs are pace, effort, control, reserve and limiter; they inform Output / Cost / Read / Next. Mechanical / metabolic / control remain conceptual cost lenses, not competing filing labels. Homepage metadata now describes coaching, plans and living studies; the hero is untouched.

Validation: six Ceiling navigation tests pass (390, 650, 720 and desktop cases). PDF appendix rendered and visually reviewed; embedded font corrected after first render. Original four pages preserve text. `git diff --check` passes.

**Phone visual verification remains open.** The available cloud browser has a fixed desktop viewport and no supported resize capability. Browser UI shortcuts did not change its viewport. Desktop production inspection is not an iPhone/Safari test. Next tester: inspect 375/390/430px and enlarged text, verify stacked cost lenses, all six Ceiling weeks, support actions and long labels. The responsive code fix is already live; do not close this gate without screenshots.

## App review: distinguish the client from the athlete journey
Reviewed FORM-iOS main `e40b173a62af7f3d0b1410220d1b62a8250d896c`, its four-file diff, new request/decoding tests, and GitHub Actions. This supersedes the earlier report's statement that no native client exists. No private athlete records or credentials were used for this review.

What is present: a dedicated FORM Athlete System API client, own-athlete membership resolution, authoritative plan decoding, exact session-version receipt in filings, structured pieces and explicit server errors. Keeping the Forge project separate is correct. The piece camelCase encoding matches the backend wire contract; do not change it to snake_case casually.

### Remaining release gates, in order
1. **No athlete-facing integration in this change.** The commit adds client types and contract tests, but no Today/session screen or production caller for the newly introduced API. Bind the assigned session/version to the actual detail and filing surface before advertising native plan delivery. Do not substitute a locally generated prescription.
2. **Identity lifecycle is still a caller responsibility.** The client receives an immutable access-token string; it has no sign-in handoff, refresh or expiry recovery. Prove it uses the FORM Athlete System identity, not a Forge token. Show understandable no-membership, ambiguous-membership, expired-session and unavailable-plan states.
3. **A version field is necessary but not an offline receipt system.** The caller still supplies both IDs and the evidence ID. Persist them with the displayed prescription and draft before sending; reuse that evidence ID after timeout/relaunch. Test server-accepted/response-lost replay, session revision while a draft is open, account switching and conflicting retry. Never silently file against the latest version if the athlete ran an earlier one.
4. **Current tests are contract tests, not end-to-end filing proof.** The new tests decode a fixture and inspect encoded requests. They do not exercise `fetchOwnPlan()` or `file()` over HTTP, token expiry, replay persistence, or native-to-console visibility. Add URLSession stub coverage for errors and membership states, then one authorized synthetic native → backend → console acceptance test and a physical-device pass. Preserve real athlete data.
5. **Useful reports must survive filing.** RPE, notes, symptoms, surface, conditions and pieces exist in the new client. Limiter, reserve, opening behaviour and pacing correction have no dedicated typed fields there. Decide the smallest compatible report contract with the existing backend before adding schema. Start with required effort + limiter + reserve for key sessions, optional entry/control cues; preserve “not reported” separately from “none.” Do not infer durability from average pace alone.
6. **Plan-guided is not autonomous coaching yet.** Show the authorized next assignment and unresolved states. Keep prescription changes coach-owned until bounded progression/hold/repeat rules are approved. Optional support payment must not change coaching mode or imply monitoring.

Evidence: [dedicated RPD contract run passed](https://github.com/Breechay/FORM-iOS/actions/runs/34717266766) on pre-merge head `7dc4cc6`. [Main FORM Signal run failed](https://github.com/Breechay/FORM-iOS/actions/runs/34720321248) on `e40b173`; this review has not attributed that failure. Do not label the full app green. The dedicated workflow currently runs on selected pull-request paths only, not pushes to main. Add caller/auth/storage paths as integration grows so relevant changes cannot skip it.

Two newer “Patch RPD Native Session” workflow attempts are also failed; these are not proof of shipped main behaviour. Concurrent open filing/plan PRs were not merged or modified by this site pass. Recheck main and active branches before implementing this list.

**Next app tranche:** gated assigned-session screen + correct auth lifecycle + persistent filing receipt; then demonstrate read → file → console once, including a retry. Surface refinement should follow that real journey. A general visual redesign would not close these gaps.
