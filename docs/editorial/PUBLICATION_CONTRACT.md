# FORM · Publication contract
**Active authority · October 19, 2026**  
**Applies to:** public website, Labs and studies, articles, plan pages, training-app copy, galleries, photography/film captions, social/advertising, share/SEO metadata, public generated content, and agent-authored documents meant for publication.

## Present the evidence. Don't narrate the presentation.

Show the athlete, the work, the result, the question, or the action. Do not explain the editorial architecture, the user interface, or the emotional effect the design is supposed to have. A link is enough to show that something can be opened.

- **Say the useful thing once.** Remove explanations of explanations, generic sport-documentary slogans, filler, duplicate introductions and interface commentary such as "full details remain one click away," "session, experience, decision," "see what the camera caught," or "the work has faces."
- **Use direct labels.** "Reports & splits," "Training log," "Progress photos," "Source notes," "Strength season," and actual dates are enough. Don't advertise that sections are expandable, links are clickable, or charts are interactive.
- **Preserve legitimate clarity.** Keep meaningful instructions for an unfamiliar interaction, accessibility labels, legal/privacy disclosures, prices, scope, source attribution, evidence limitations, and medical or training cautions that change a decision. No automated ban on ordinary words like "see," "details," "below," or "if." A false claim is worse than a long sentence.
- **Lead with the subject.** A study opens with its central question, dated current evidence, method in plain language and what is being tested next; detailed records can follow in a named archive. A plan opens with its intended athlete, sessions, units, price and action. An event opens with verified date, time, location and attendance details.
- **Separate observed from prescribed.** Report completed work as completed, proposed work as proposed, self-reports as reports, and measured findings as measured. Historical athlete prescriptions stay in dated archives; they do not automatically become current assignments. Don't fabricate workouts, outcomes, photos, testimonials or readiness. Current athlete-facing sessions come from the FORM Athlete System, not an old study page. The coach owns recovery decisions; don't expose stale "if absorbed" or "if recovered" clauses as current sessions.
- **Dates have a job.** Update the visible current status only when new source evidence arrives. Keep last-confirmed results and review dates distinct. Don't suggest a new workout happened because a page was edited.
- **Write like the practice.** Plain, concise, first person when Brice is the speaker. Do not write corporate belief copy, pseudo-scientific noun piles, generic aspiration, or artificial emotional cues. Follow `docs/marketing/ATHLETE_LANGUAGE_RULE.md`.
- **Keep the theater.** This is not a minimalism rule. Preserve cinematic photography, editorial strips, real film, deep shadow and visual drama; improve readable contrast, consent, performance, mobile composition and reduced-motion behavior instead of deleting worthwhile decoration. Follow `docs/design/FORM_VISUAL_EXECUTION_STANDARD_2026-10.md`.

## Check before publishing

1. **Question:** What would a visitor know or do differently after reading each sentence? Delete lines that merely explain the page design, navigation, content grouping or feeling.
2. **Evidence:** Can every specific result, claim, athlete identity, training prescription, date and current-status statement be traced to its owning record? Is the source/current-versus-historical boundary explicit when needed?
3. **Hierarchy:** Are purpose and current status discoverable in the opening screens? Is there a single current-status view? Can one reach complete evidence without duplicate recaps?
4. **Utility:** Keep real affordance instructions only where the interface is not self-explanatory. Use specific links instead of "one click away" promises.
5. **Visual:** Review actual mobile and desktop renders, focus states, photographs and video frames. Don't turn a dramatic page into an unstyled document.
6. **Automation:** Run `node tests/editorial-contract.cjs` and `node scripts/check-editorial-contract.cjs`. These catch a small set of unequivocal regressions in public-facing HTML and SEO/share metadata. They are not a substitute for human editing.
7. **Release:** Verify source commit, CI, production deploy and the actual live page separately. Never claim that a GitHub commit alone is live.

## Where these rules live

- **Canonical editorial policy:** this document
- **Site/agent onboarding:** `AGENTS.md` and `.cursor/rules/form-speedandform-context.mdc`
- **Brand authority:** `docs/BRAND.md` and the public `/brand/` voice page
- **Training/athlete language:** `docs/marketing/ATHLETE_LANGUAGE_RULE.md`
- **Visual execution:** `docs/design/FORM_VISUAL_EXECUTION_STANDARD_2026-10.md`
- **Automatic copy gate:** `scripts/check-editorial-contract.cjs`, with test `tests/editorial-contract.cjs` and GitHub Actions

These are publishing standards, not sentences to paste into a study. Avoid surfacing governance language on athlete-facing pages.
