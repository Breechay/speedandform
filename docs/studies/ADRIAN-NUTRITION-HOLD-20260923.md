# Adrian nutrition: current release scope

Current revision: 1.5.8. Status: active_with_individual_timing_review.

The blanket v1.5.2 website hold is superseded by the owner-directed scoped correction. This file keeps its old path so agent links do not break. Its earlier hold and resume instructions are historical, not the current publishing rule.

Keep the companion, meal-prep recipes, shopping tools, preferences, sleep routine and check-ins available. Do not treat a reported history as a new event, an adverse outcome of this plan or proof of nonadherence. Do not invent a diagnosis or a trigger.

Food-around-exercise timing remains individual: no added pre-run snack, between-session food, assumed lifting exemption, fixed fasting duration or automatically immediate post-exercise meal. Clinician-confirmed guidance is still needed to resolve food suitability and timing before and after exercise. This publishing correction is not exercise clearance and does not say fasting guarantees protection. The coach can fit adequate intake around that guidance without replacing the whole companion with a shutdown page.

The review-context JSON owns this web companion's release and timing state. No FORM/Forge assignment, completed record, dose or calorie target changes in this correction. The web page is not proof of a native-app update. No calendar writes or messages are sent; previous phone imports are not altered by a web edit. The existing prep download remains available, without a new food-around-exercise prescription.

Private history, screenshots and clinical records stay outside this public repository, its commit messages and the public study. Preferences and prior product use are reports, not safety clearance.

Acceptance: run tests/adrian-nutrition-v15.py and tests/adrian-nutrition-timing.py. The historical hold test applies only to an explicitly held release. Preserve concurrent work and verify production before claiming the correction is live.

Acceptance run: https://github.com/Breechay/speedandform/actions/runs/35936585400

## Label and intake follow-up

[Photographed label record](ADRIAN-NUTRITION-LABELS-20260923.json) identifies the two owned products. Designs for Health Chocolate: 27 g powder, 110 kcal, 21 g protein. BulkSupplements creatine monohydrate: 5 g per labeled serving. Actual amounts, first use, frequency, lot verification and individual approval remain open. Do not interpret the manufacturer's complete-protein description as measured whey-equivalence, or call this product pure incomplete collagen. The 1,300 and 2,260 kcal figures are partial-day athlete reports; lunch was difficult to finish. Do not turn this into a new calorie target or forced feeding.

Run `python tests/adrian-nutrition-labels.py` in addition to existing timing/browser tests. Native assignments and clinical details remain unchanged.

## Completed food-day follow-up

[Completed day record](ADRIAN-NUTRITION-DAYLOG-20260923.json): 3271 kcal reported and arithmetically reconciled with the earlier 1300 and 2260 subtotals. Dinner at 600 kcal is explicitly a guess. Keep earlier observations immutable. Chobani consumption does not reverse the Greek yogurt exclusion; exact product and liking remain to confirm. Mother-made dinner is family participation, not Adrian first-cook evidence. Measurements remain requested. No new calorie, protein, supplement or exercise-timing prescription. Run tests/adrian-nutrition-foodday.py alongside the existing checks.

## Working intake target · 24 September

[Coach decision](ADRIAN-NUTRITION-DECISION-20260924.json): approximately 3,000 kcal/day for the current phase. The 3,271 kcal completed day remains an observation, not the target. Do not force an exact number or use the target to reintroduce pre-run food. Review weight trend, measurements, appetite, digestion and training response before changing it. No supplement dose, native assignment or exercise-timing rule changed.

## Development range · 24 September

Current target remains approximately 3,000 kcal/day. Athlete-facing possible phase range is approximately 3,000-3,400 kcal/day, reflecting the possibility that substantial running plus hypertrophy work requires more intake. The upper end is not automatically prescribed. Review 10-14 days of consistent intake, weekly-average weight, body measurements, appetite/meal comfort and training response; if response is too flat and tolerance is good, adjust gradually by roughly 150-250 kcal/day. Existing no-pre-run-food and exercise-timing boundaries remain unchanged.
