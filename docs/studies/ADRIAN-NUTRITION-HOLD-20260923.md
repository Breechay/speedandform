# Adrian nutrition: current release scope

Current revision: 1.5.5. Status: active_with_individual_timing_review.

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
