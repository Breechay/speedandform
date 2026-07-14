# Speed & Form — One-page house handoff

## Locked architecture
The homepage is now the primary marketing surface for both products. FORM and FORGE are not mutually exclusive identities. The visitor chooses where to begin, not what kind of athlete they are forever.

## Page sequence
1. The thinking is done — FORM Week proof in the first fold.
2. Founder truth — scattered advice without context was the problem.
3. The practice — real Miami coaching image.
4. The method — the right work, in the right order.
5. Start where you need structure — early FORM/FORGE entry.
6. FORM chapter — direct App Store conversion and optional proof expansion.
7. Build both bridge — running and strength as one developing athlete.
8. FORGE chapter — inline launch conversion and optional proof expansion.
9. Library — running, strength, and cross-discipline education.
10. Final choice — where the visitor wants more direction now.

## Product doctrine
- The problem is not low motivation or too little information.
- The problem is advice applied without context, hierarchy, sequencing, or appropriate emphasis.
- Deep thinking stays backstage. The athlete sees a clear next action.
- Every public claim should be visible in the screenshots or provable in the expanded product flow.

## Important implementation notes
- `/form` and `/forge` navigation now point to `#form` and `#forge` on the homepage.
- Keep separate support, privacy, and terms routes for each app.
- FORM uses its live App Store URL.
- FORGE uses an inline Netlify launch form until the App Store URL is confirmed. Replace `#forge-download` CTAs with the real URL after approval.
- Product depth uses native `<details>` elements, so all core conversion content works without JavaScript.
- The sticky chapter rail is enhancement only. Without JavaScript it still functions as anchor navigation.
- Do not turn the bridge into “hybrid athlete” trend marketing. The message is simply that people can begin on one side and develop the other.
