"""Record a completed athlete-reported food day without changing prescriptions."""
from pathlib import Path
import copy, json, os, re, subprocess
from bs4 import BeautifulSoup

root = Path.cwd()
d = root / 'plans/adrian-nutrition-phase-01'
cp = d / 'review-context.json'
c = json.loads(cp.read_text())
if c['nutrition_revision'] == '1.5.6':
    print('Food-day revision already present; run acceptance checks.')
    raise SystemExit(0)
assert c['nutrition_revision'] == '1.5.5', 'Newer nutrition work requires reconciliation'
assert c['release_status'] == 'active_with_individual_timing_review'
old_c = copy.deepcopy(c)
p = d / 'index.html'
h = p.read_text()
old_s = BeautifulSoup(h, 'html.parser')
record_path = 'docs/studies/ADRIAN-NUTRITION-DAYLOG-20260923.json'
assert not (root / record_path).exists(), 'Do not replace an existing observation'
foods = [
    ('Peanut butter and jelly sandwich', 400),
    ('Chobani 20 g protein yogurt', 170),
    ('Coffee with creamer', 40),
    ('Cheddar balls', 130),
    ('Power Crunch bar', 210),
    ('Pretzels and peanut butter', 350),
    ('Rice, beans, rotisserie chicken and plantains', 960),
    ('Cinnamon Honey Stinger', 140),
    ('Banana', 105),
    ('Probiotic smoothie', 110),
    ('Spaghetti with meat sauce', 600),
    ('85% cocoa dark chocolate', 56),
]
items = []
for i, (food, calories) in enumerate(foods, 1):
    items.append({'sequence_in_message': i, 'food_as_reported': food,
        'calories_kcal_reported': calories, 'portion_weight_g': None,
        'time_consumed': None,
        'estimate_status': 'explicit complete guess by athlete' if i == 11 else 'athlete-reported value; not independently verified',
        'protein_g_reported': 20 if i == 2 else None})
assert sum(x[1] for x in foods) == 3271
assert sum(x[1] for x in foods[:6]) == 1300
assert sum(x[1] for x in foods[:7]) == 2260
x = {
    'schema_version': 1,
    'record_type': 'athlete_report_completed_food_day',
    'record_id': 'adrian-food-day-20260923',
    'recorded_on': '2026-09-23',
    'athlete': 'Adrian Gandara', 'study_id': 'FRM-001',
    'source': {'type': 'coach_supplied_message_screenshot', 'file': 'IMG_7969.jpeg',
        'reported_day': '2026-09-23',
        'date_basis': 'Continuation of the same-day 1300 and 2260 reports in the coach conversation; no absolute date is visible in this screenshot.',
        'completion_basis': 'Athlete lists 3271 and then says the end.',
        'original_published': False},
    'items': items,
    'total_kcal_reported': 3271,
    'sum_of_listed_kcal': 3271,
    'arithmetic_verified': True,
    'actual_intake_independently_measured': False,
    'completeness': 'athlete reports completed day; not a weighed or independently complete food record',
    'reconciliation': {
        'prior_record': 'docs/studies/ADRIAN-NUTRITION-LABELS-20260923.json',
        'first_six_items_kcal': 1300, 'through_lunch_kcal': 2260,
        'remaining_listed_items_kcal': 1011,
        'rule': 'Same reported day. The earlier totals are running subtotals, not additional intake. Preserve the prior record as it was known then.'},
    'meal_context': {
        'lunch': 'Earlier report identifies La Granja; completed list adds plantains to rice, beans and rotisserie chicken. The 960 kcal is the athlete estimate, not verified restaurant nutrition.',
        'earlier_lunch_feedback': 'Athlete previously said the large lunch was difficult to finish.',
        'dinner': 'Athlete reports his mother made spaghetti per the coach request; 600 kcal explicitly marked a complete guess.',
        'self_prepared_first_batch_confirmed': False,
        'family_participation': 'reported, not evidence that the exact authored recipe or portions were used'},
    'preference_followup': {
        'chobani': {'reported_eaten': True, 'reported_product_description': 'Chobani 20 g protein yogurt',
            'reported_kcal': 170, 'exact_product_format_and_flavor': None,
            'explicitly_liked': None, 'tolerance_or_safety_confirmed': False,
            'greek_yogurt_exclusion_reversed': False,
            'next_question': 'Which Chobani product and flavor was it, and did you like it?'},
        'other_new_foods': 'Pretzels with peanut butter, coffee with creamer, probiotic smoothie and 85% dark chocolate are intake reports, not blanket preference or health-benefit claims.'},
    'unknowns': {'daily_protein_g': None, 'daily_carbohydrate_g': None, 'daily_fat_g': None,
        'energy_expenditure_kcal': None, 'energy_surplus_kcal': None,
        'supplement_use_on_this_day': None, 'run_outcome': None,
        'symptom_or_tolerance_outcome': None, 'meal_to_run_intervals_minutes': None},
    'measurements': {'status': 'still_requested_not_supplied_in_this_message',
        'source': 'Coach reply in the screenshot; existing measurement set in authored program and study.',
        'baseline_set': ['morning weight trend', 'waist', 'chest', 'relaxed upper arm', 'mid-thigh', 'calf'],
        'values_inferred': False},
    'interpretation': 'Useful completed self-report and evidence of family participation. One day does not establish habitual intake, adequate intake, surplus, full plan adherence or muscle gain. Do not set 3271 as a daily target or reward force-finishing large meals.',
    'boundaries': {'keep_page_live': True, 'new_pre_run_food_prescribed': False,
        'meal_timing_inferred_from_list_order': False, 'new_calorie_target': False,
        'new_supplement_dose': False, 'training_assignment_changed': False,
        'full_plan_start_date_established_by_this_message': False,
        'clinical_history_published': False, 'screenshots_published': False}
}
(root / record_path).write_text(json.dumps(x, indent=2) + '\n')

c['nutrition_revision'] = '1.5.6'
c['shopping']['revision'] = '1.5.6'
c['previous_intake_reports'] = c.get('previous_intake_reports', []) + [copy.deepcopy(c['latest_intake_report'])]
c['latest_intake_report'] = {
    'source_record': record_path, 'source_file': 'IMG_7969.jpeg', 'reported_day': '2026-09-23',
    'completeness': x['completeness'], 'daily_total_kcal_reported': 3271,
    'sum_of_listed_kcal': 3271, 'calories_independently_verified': False,
    'before_lunch_reported_kcal': 1300, 'through_lunch_reported_kcal': 2260,
    'dinner_kcal_reported': 600, 'dinner_estimate_status': 'explicit guess',
    'surplus_kcal': None, 'daily_protein_g': None,
    'meal_timing_relative_to_exercise_confirmed': False,
    'full_plan_start_confirmed': False,
    'coaching_response': 'Food day received. Keep the existing plan and timing boundary; obtain baseline measurements, comfortable meal-size feedback and the exact Chobani product/preference.'}
c['latest_observation_record'] = record_path
c['food_preference_followup'] = x['preference_followup']
c['baseline_measurements_followup'] = x['measurements']
c['interpretation_boundary'] = 'Keep athlete reports, arithmetic checks, label observations, measured outcomes and decisions separate. The completed food log totals 3271 kcal from athlete estimates; dinner is explicitly a guess. Earlier 1300 and 2260 totals are included subtotals. This establishes neither a measured surplus nor a new target, full adherence or muscle gain. Supplement brands and labels are known in current_supplement_labels; actual doses, start dates and frequency remain unknown. Consumption is not preference confirmation or clinical clearance. Meal order does not establish timing relative to exercise. Private clinical history stays off public surfaces.'
cp.write_text(json.dumps(c, indent=2) + '\n')

h = h.replace('1.5.5', '1.5.6')
replacement = '<p id="intake-note-20260923"><strong>Your completed food log:</strong> 3,271 calories estimated. This completes your earlier 1,300 and 2,260 updates, not extra meals. Your La Granja lunch included plantains; your mom made spaghetti with meat sauce. You marked dinner\'s 600 calories as a guess. This is one logged day, not a daily target. Tell Brice which meals felt too large.</p>\n<p id="baseline-note-20260923"><strong>Still to send:</strong> your baseline measurements from <a href="/labs/adrian-runner-mass/">the study</a>. Food log received; body measurements remain open.</p>'
h, n = re.subn(r'<p id="intake-note-20260923">.*?</p>', lambda m: replacement, h, count=1, flags=re.S)
assert n == 1, 'Existing intake note changed'
pref = '<p id="chobani-note-20260923"><strong>Chobani in your log:</strong> which 20 g protein yogurt and flavor was it, and did you like it? Greek yogurt stays off the shopping list until you confirm that specific option.</p>'
needle = '<p>Something in a recipe not working for you? Tell Brice. He\'ll swap it for something you like.</p>'
assert h.count(needle) == 1
h = h.replace(needle, pref + needle)
needle = 'Still to observe: start date, full intake and usual portions, powder tolerance, weight trend, sleep and recovery response, the nugget label.'
assert h.count(needle) == 1
h = h.replace(needle, 'One completed estimated food day is received. Still to observe: actual start date, repeated intake and usual portions, supplement use, baseline measurements, weight trend, sleep and recovery response, the nugget label.')
scope_note = '<p id="foodday-source"><strong>Completed food day:</strong> <a href="/docs/studies/ADRIAN-NUTRITION-DAYLOG-20260923.json">Itemized report and arithmetic</a>. Reported intake is not measured intake, a new calorie target or food-timing clearance.</p>\n'
assert h.count('<ol id="sources">') == 1
h = h.replace('<ol id="sources">', scope_note + '<ol id="sources">')
p.write_text(h.rstrip() + '\n')

scope = root / 'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md'
t = scope.read_text().replace('Current revision: 1.5.5.', 'Current revision: 1.5.6.')
t += '\n## Completed food-day follow-up\n\n[Completed day record](ADRIAN-NUTRITION-DAYLOG-20260923.json): 3271 kcal reported and arithmetically reconciled with the earlier 1300 and 2260 subtotals. Dinner at 600 kcal is explicitly a guess. Keep earlier observations immutable. Chobani consumption does not reverse the Greek yogurt exclusion; exact product and liking remain to confirm. Mother-made dinner is family participation, not Adrian first-cook evidence. Measurements remain requested. No new calorie, protein, supplement or exercise-timing prescription. Run tests/adrian-nutrition-foodday.py alongside the existing checks.\n'
scope.write_text(t)
for name in ['adrian-nutrition-labels.py', 'adrian-nutrition-timing.py']:
    path = root / 'tests' / name
    text = path.read_text()
    assert '1.5.5' in text, 'Check current test version before updating'
    path.write_text(text.replace('1.5.5', '1.5.6'))

new_s = BeautifulSoup(h, 'html.parser')
for selector in ['#your-day', '#recipes', '#food-safety', '#sleep', '#kit', '#powder', '#fallback']:
    assert [str(e) for e in old_s.select(selector)] == [str(e) for e in new_s.select(selector)], selector
for key in ['food_timing', 'training_sources', 'nutrition_delivery', 'current_supplement_labels', 'intervention_started_at', 'release_status']:
    assert c[key] == old_c[key], key
run_url = 'https://github.com/Breechay/speedandform/actions/runs/' + os.environ.get('GITHUB_RUN_ID', 'not-recorded')
roadmap = root / 'docs/roadmap/FORM-ROADMAP.md'
t = roadmap.read_text()
first, remainder = t.split('\n', 1)
note = '\n## September 23 - Adrian completed food log, v1.5.6\n\n3271 kcal is the athlete-reported completed day, including a guessed 600 kcal dinner. The 1300 and 2260 reports reconcile as included subtotals. Record: [completed food day](../studies/ADRIAN-NUTRITION-DAYLOG-20260923.json). Specific Chobani preference and baseline measurements remain open. Family dinner participation recorded; no first-cook, surplus, adherence or training-outcome claim. Existing live companion, recipes, portions, product labels and no-pre-run-food boundary are preserved. No native assignment, message or calendar writes.\n\nAcceptance run: ' + run_url + '. Production verification follows promotion and is not established by this source note.\n'
roadmap.write_text(first + '\n' + note + remainder)
print('Completed food report recorded; prescriptions, timing and prior observations preserved.')
