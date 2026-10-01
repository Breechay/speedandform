# Outside-in public-page review · October 1, 2026

Owner requested visitor-first language, meaningful use of coaching evidence, practical nutrition support, and reminders when studies or race results change. The first reader/crop correction was published at 3:05 PM New York in deploy `6abeaeea5c0cd52cc92b34fc`; this is the subsequent, broader pass.

| Surface | Visitor situation | Change or audit decision |
| --- | --- | --- |
| Homepage / running | Wants longer, smoother running; uncertain about form or the next training step | Keep the strong opening and real portrait. Add felt difficulty before the selective coaching explanation. Running page explains help with pushing, backing off and useful movement changes. |
| Strength | Wants muscle, less body fat or confidence with weights; food habits and gym effort do not yet line up | Show coached training and practical food support together. Review current meals, shopping/prep, food notes and response. Correct the blanket nutrition exclusion. |
| Analysis | Has a specific form/training question, possibly with an existing coach | Start with that question; explain usable priorities. Keep scope, illustrative sample and medical limits clear. |
| Photography | Has real work but needs images that communicate it | Lead with where the pictures will help. Retain real practice portfolio and the bounded package. |
| AI | Notes and follow-ups scattered across apps | Name the concrete friction, then show one controlled process. Existing illustration remains an illustration, not working client proof. |
| Work hub | Needs to choose the right help | Use recognizable needs before service names. |
| Thursday / Run Miami | Wants company, belonging and a manageable way to join | Existing all-levels, no-arrival-pace and leave-when-needed language already helps. Keep published gathering authority; no invented schedule. |
| Plans / RPD | Wants a stronger finish and can follow training independently | Existing goal-first entry, honest mileage prerequisites and four-week preview already serve the decision. No protocol or paid access change. |

## Hope and José

Audience: half-marathon runners who can reach a target pace in shorter efforts but struggle to sustain it. The current completed distance ask is September 29, six continuous miles, not the scheduled October 20 eight-mile ask. Display the earlier April half-marathon results alongside the current shorter training segment, with distance/time/pace and an explicit distinction. Do not call prior results lifetime PRs, equal ability, or infer a new half-marathon finish time.

Baseline provenance: owner-confirmed net results in September 14 context, certificate URLs from the original shared brief. José 1:40:23, Hope 1:40:24, both rounded 7:39/mi. Certificate pages were unavailable to search retrieval during this audit. Month-only date avoids conflicting exact-day references. Source URLs are retained beside the results. The recorded September 29 work and coaching read remain in the existing public study. This pass changes no future athlete assignment.

`data/public-studies/speed-that-endures.json` is an approved public projection, not a private athlete feed. `scripts/public-study-preview.cjs` builds the homepage and running example from it. A changed study source hash stops the build until the newest completed ask, conclusion, end-of-study state and public race results are reviewed. The hash does not extract or approve a result automatically. Agent instructions and a daily conditional reminder reinforce that maintenance step. Reminder reviews public GitHub changes and notifies only for new/stale material; no automatic edits or deploys.

## Research and acceptance

Design basis: [NN/g recognition](https://www.nngroup.com/articles/recognition-and-recall/) and [information scent](https://www.nngroup.com/articles/information-scent/). Applied as recognizable goals, understandable evidence and descriptive next steps. These changes are design hypotheses; no measured conversion improvement is claimed.

Local acceptance: six commercial pages at six widths and 200% text, inquiry/focus/failure/retry/privacy behavior, homepage keyboard disclosure, nine-route Axe WCAG A/AA/2.1AA review with zero reported violations. Metadata, selective-method, protected reading, athlete study parity and current-preview contracts pass. Study/table renders inspected at 390px and 1440px. No live inquiry or athlete message sent. Physical-device review remains open.

## Independent review refinements

Three owner-requested reviewers assessed visitor copy, visual flow and search intent against `docs/marketing/OUTSIDE-IN-REVIEW-BRIEF-20261001.md`. Implemented: clarify running-only hero inquiry CTA and give strength a direct path; remove repeated strength setup; make video feedback sound like Brice’s actual observation/next-rep practice; simplify location logistics; use service-specific inquiry headings; remove the nonexistent 10K offer from Plans metadata and simplify shelf jargon; make Run Miami invitation direct; put strength recognition ahead of its photo on phones; compact the mobile study milestone so the comparison arrives sooner. Link Adrian’s existing public ongoing study as development evidence, with no claimed physique outcome. Keep the large desktop study circle and approved philosophy statements; those visual moments are deliberate, not every review suggestion merits a redesign.

Owner supplied Photoshop `Brice.png`, removing Cole and restoring the elbow. WebP assets are orientation/resize/encoding only. CSS cover uses the full portrait with minimal removal of empty right background and retains top-left-only radius. Reviewed at 390/1440; complete elbow remains visible. SF headers increased modestly to76×32desktop/62×28phone; footer174×64retained. Independent visual reviewer agreed on balance.

Fresh responsive/inquiry checks pass after refinements. Nine-route Axe review found a new low-contrast strength-inquiry link on the chalk background; corrected to ink and all nine routes then passed. Two optional legacy-wide tests (`share-metadata`, `discovery`) still expose existing unrelated snapshot/count discrepancies: untouched threshold-training source versus historical receipt, and88currententries versus87historicentries. They are not claimed passed; the release workflow does not run them. The updated Miami authored source has a new explicit receipt while historical receipts remain intact. Physical-device and representative finished Analysis/working AI sample acceptance remain open.

Latest owner steering: use “Run farther. Feel smoother. Get stronger.” across the homepage opening, with comfortable 5K, race-readiness and gym-confidence examples. Running and strength openings use the preferred three-part desire language. Plans shelf and Labs/study entry points now recognize the runner’s question before the method. Individual evidence tables, embedded athlete records, weekly prescriptions, race dates and medical records are untouched. The Last 10K stays prospective; Act I is ongoing, with six miles the current recorded continuous milestone. Narrative-only study changes were reviewed against the current public acquisition snapshot; its data and conclusion stay the same and its source hash is refreshed.

Production receipt will be appended after the final verified combined deployment.

Expanded Plans and Labs review also found existing low-contrast secondary labels. Adjusted muted/graphite text within each existing palette, including pending records, without changing study data or the distinction between pending and recorded work.

Final expanded automated review: all 16 routes report no Axe A/AA/2.1AA violations or horizontal overflow at 390px. Opening renders inspected at 390/1440. Corrected Simon table-cell roles in both the rendered and saved projection and Brice’s definition-list container; locked phases remain labeled and retain their existing conditional entry rules. Six-width and 200% commercial/inquiry regression checks pass.
