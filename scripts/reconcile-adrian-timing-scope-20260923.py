"""Scoped publishing correction. No private history, clinical diagnosis or new food trial."""
from pathlib import Path
import json, os, re

root = Path.cwd()
page = root / 'plans/adrian-nutrition-phase-01/index.html'
context = page.with_name('review-context.json')
c = json.loads(context.read_text())
if c.get('nutrition_revision') == '1.5.4':
    print('Scoped timing correction already applied.')
    raise SystemExit(0)
assert c.get('nutrition_revision') == '1.5.3', 'Review concurrent nutrition changes first.'
h = page.read_text()

def replace(old, new, count=1):
    global h
    assert h.count(old) == count, (old[:90], h.count(old))
    h = h.replace(old, new)

replace('<html lang="en">', '<html lang="en" data-nutrition-version="1.5.4" data-nutrition-status="active_with_individual_timing_review">')
h = h.replace('v1.5.3', 'v1.5.4').replace('Version 1.5.3', 'Version 1.5.4')
replace('<p class="lede">Pick the day. Tap a line for more.</p>', '<p class="lede">Pick the day. Tap a line for more.</p>\n<p class="small" id="food-timing"><strong>Food timing comes first.</strong> This page adds no pre-run snack. Use meals and snacks only within your clinician\'s food and exercise guidance. Brice will fit them around the agreed window before and after running or lifting.</p>')
replace('<b>Running today? Keep your no-food window</b><p>This page adds no pre-run snack. For an early run, eat breakfast afterward. For a later run, finish earlier meals soon enough to preserve the several-hour no-food gap you already use.</p>', '<b>No added pre-run snack</b><p>You already avoid eating before runs. This page will not insert a snack or set a different interval.</p>')
replace('<span class="t">By 8:00</span>', '<span class="t">Breakfast<small>agreed time</small></span>')
replace('If the run comes first, keep your established no-food window through the run. Do not insert food between the run and lift from this page. Eat breakfast after the combined session.', 'This page adds no snack between sessions. Arrange breakfast with Brice using your agreed food timing, rather than assuming it belongs immediately after exercise.')
replace('<strong>Running:</strong> keep your established several-hour no-food window. If the 3:30 box falls inside it, save the box for after the run; do not add a pre-run snack from this page. <strong>Lifting without a run:</strong> the 3:30 box can stay.', 'The food-timing rule above applies to runs and lifts. If 3:30 conflicts, keep the box refrigerated and have Brice move it. Do not use a last-minute sandwich as a workaround.')
replace('or after training', 'or agreed time')
replace('Keep your established pre-run no-food rule. This page does not add or change a pre-run food. You reported using a little Honey Stinger waffle before long runs; that is recorded as prior practice, not a new recommendation. Drink to thirst.', 'Use your agreed food-timing plan. This page adds no waffle, gel, powder or snack around the run. Drink to thirst.')
replace('<li class="k-food"><span class="t">After</span>', '<li class="k-food"><span class="t">Breakfast<small>agreed time</small></span>')
replace('Have milk and some of your breakfast bread at home first. Keep the rest for breakfast. Powder waits for the label check.', 'Tell Brice when the family meal will be. Keep breakfast planned without moving food into your exercise window. Powder still waits for review.')
replace('No run today? Banana with breakfast. Running today? Keep your established no-food window and eat after the run.', 'Use the same food-timing rule on weekends. This page adds no food before or between sessions.')
replace('<strong>Evening run:</strong> keep your established several-hour no-food window. If the 3:30 box lands inside it, save the box for after the run. Do not use the backup sandwich as a pre-run workaround. <strong>Lift without a run:</strong> the 3:30 box or backup can stay.', '<strong>Evening run or lift:</strong> use the <a href="#food-timing">food-timing rule</a>. Brice can move a meal that conflicts with training. Do not add a pre-session sandwich or assume a meal belongs immediately afterward.')
replace('Whole milk and fruit are fine.', 'Whole milk and fruit are accepted preferences, not confirmed safe exercise foods.')
replace('<h2 id="recipes-title">Three meals worth repeating.</h2>', '<h2 id="recipes-title">Three meals worth repeating.</h2>\n<p class="small">Meal-prep reference. Use ingredients and meal times that fit your clinician\'s guidance; these recipes do not identify a trigger or clear a food around exercise.</p>')
# Keep normal time labels as reference, without clock-driven food prompts while individual timing is unresolved.
h, removed = re.subn(r'<li class="k-food" data-at="[0-9:]+">', '<li class="k-food">', h)
assert removed >= 3, removed
assert 'plan-hold' not in h
page.write_text(h.rstrip() + '\n')

c['nutrition_revision'] = '1.5.4'
c['release_status'] = 'active_with_individual_timing_review'
c['updated_date'] = '2026-09-23'
c['release_scope'] = 'Owner-directed correction of an overbroad website hold. The companion remains available; this is not an incident report, outcome finding or medical clearance.'
c['food_timing'] = {
    'source': 'Athlete-reported existing practice supplied by the coach, not a clinician-verified interval.',
    'before_exercise_minutes': None,
    'after_exercise_minutes': None,
    'clinician_guidance_reviewed': False,
    'applies_to': ['running', 'lifting'],
    'new_pre_run_snack_prescribed': False,
    'new_between_session_food_prescribed': False,
    'automatic_immediate_post_exercise_meal': False,
    'new_food_or_supplement_trials_authorized': False,
    'clock_driven_food_prompts_enabled': False,
    'meal_reference_available': True,
    'next_action': 'Confirm individualized food and exercise guidance with the treating clinician; the coach then fits adequate meals around it. Do not infer a safe interval, trigger or exception.'
}
rule = c['confirmed_for_this_revision']['pre_run_food_rule']
rule['rule'] = 'Athlete reports avoiding food for several hours before running. This remains a report, not a verified safety interval or a new fasting prescription.'
rule['interval_confirmed'] = False
rule['lifting_exception_confirmed'] = False
c['confirmed_for_this_revision']['existing_long_run_gel_routine'] = 'Previously reported use remains historical context. Product suitability and timing are not medically cleared by this page.'
evening = c['confirmed_for_this_revision'].get('evening_fueling_report', {})
if evening:
    evening['interpretation'] = 'Athlete report of hunger, thirst and tiredness, with incomplete timing context. Not proof of nonadherence, a cause of fatigue or a measured calorie deficit.'
    evening['prior_response_status'] = 'The earlier food-before-training response is superseded by the individualized timing rule. Retain the earlier response only as a dated decision, not active advice.'
    evening['current_response'] = 'Fit adequate meals around clinician-confirmed food/exercise guidance; no automatic pre-session snack, lifting exemption or immediate post-exercise meal.'
n = c['nutrition_delivery']
n['workday_breakfast'] = 'Retain breakfast as a meal reference. Its timing follows individualized clinician guidance before and after exercise, not a fixed 8 a.m. deadline, between-session snack or immediate post-exercise instruction.'
n['evening_training'] = 'Runs and lifts use the same individual timing review. If the afternoon meal conflicts, keep it refrigerated and have the coach reschedule it within clinician guidance. No last-minute sandwich workaround or automatic meal immediately afterward.'
n['long_run_fuel'] = 'No new food, gel, waffle, powder or snack is prescribed around exercise. Prior Honey Stinger use is an athlete report only, not a confirmed safe exception.'
n['reference_scope'] = 'Recipes, portions, shopping and prep tools remain available as references. Foods and times must fit individualized clinical guidance; no food is diagnosed as a trigger or medically cleared by this page.'
c['shopping']['revision'] = '1.5.4'
c['interpretation_boundary'] = 'Keep athlete reports, observations, measured outcomes and decisions separate. Publication does not confirm adherence or causation. The food-timing constraint is reported practice, not clinical clearance. Brands, doses and start dates for reported supplements remain unknown; do not attribute weight or lean-mass changes to them. Private medical history is not published.'
c['training_app_updated'] = False
context.write_text(json.dumps(c, indent=2, ensure_ascii=False) + '\n')

agents = root / 'AGENTS.md'
a = agents.read_text()
old = '## Active Adrian nutrition delivery hold\nBefore editing or regenerating Adrian nutrition, read [the current release hold](docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md). Do not restore historical food or supplement instructions without the documented resume gate. Private clinical details must not be published.'
new = '## Adrian nutrition: current release and timing\nThe blanket v1.5.2 website hold is superseded. Read [current release scope](docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md) and the current review-context JSON. Keep the companion available; do not recreate the blanket shutdown from historical notes. Do not reinsert pre-run snacks, between-session food, a lifting exemption, a fixed fasting interval or immediate post-exercise meals without individualized clinical guidance. No reported history is automatically a new incident or a plan-caused outcome. Keep private medical details off public surfaces. Native assignments are unchanged.'
assert a.count(old) == 1
agents.write_text(a.replace(old, new).rstrip() + '\n')

run_id = os.environ.get('GITHUB_RUN_ID', '')
run_link = f'https://github.com/Breechay/speedandform/actions/runs/{run_id}' if run_id else 'See the scoped timing acceptance run.'
doc = root / 'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md'
doc.write_text('''# Adrian nutrition: current release scope

Current revision: 1.5.4. Status: active_with_individual_timing_review.

The blanket v1.5.2 website hold is superseded by the owner-directed scoped correction. This file keeps its old path so agent links do not break. Its earlier hold and resume instructions are historical, not the current publishing rule.

Keep the companion, meal-prep recipes, shopping tools, preferences, sleep routine and check-ins available. Do not treat a reported history as a new event, an adverse outcome of this plan or proof of nonadherence. Do not invent a diagnosis or a trigger.

Food-around-exercise timing remains individual: no added pre-run snack, between-session food, assumed lifting exemption, fixed fasting duration or automatically immediate post-exercise meal. Clinician-confirmed guidance is still needed to resolve food suitability and timing before and after exercise. This publishing correction is not exercise clearance and does not say fasting guarantees protection. The coach can fit adequate intake around that guidance without replacing the whole companion with a shutdown page.

The review-context JSON owns this web companion's release and timing state. No FORM/Forge assignment, completed record, dose or calorie target changes in this correction. The web page is not proof of a native-app update. No calendar writes or messages are sent; previous phone imports are not altered by a web edit. The existing prep download remains available, without a new food-around-exercise prescription.

Private history, screenshots and clinical records stay outside this public repository, its commit messages and the public study. Preferences and prior product use are reports, not safety clearance.

Acceptance: run tests/adrian-nutrition-v15.py and tests/adrian-nutrition-timing.py. The historical hold test applies only to an explicitly held release. Preserve concurrent work and verify production before claiming the correction is live.

Acceptance run: ''' + run_link + '\n')
roadmap = root / 'docs/roadmap/FORM-ROADMAP.md'
r = roadmap.read_text()
entry = '''## September 23 - Adrian nutrition: scoped timing correction, v1.5.4

The blanket v1.5.2 website hold is superseded. Keep the food companion available, preserving recipes, portions, preferences, shopping state and sleep tools. Remove only conflicting exercise-adjacent instructions; no new fasting interval, food trial, immediate post-exercise meal or lifting-only exemption. Clinical guidance resolves food/timing; the coach then fits adequate meals around it. No diagnosis, current incident or plan-caused outcome is inferred. Private details stay off the site and repository. FORM/Forge assignments and imported phone reminders are unchanged.

Current release rule: [Adrian nutrition scope](../studies/ADRIAN-NUTRITION-HOLD-20260923.md). Web release authority: `plans/adrian-nutrition-phase-01/review-context.json`.

Acceptance and validated output commit: ''' + run_link + '''. Six-width browser and targeted timing checks must pass before promotion. Production verification is separate and must follow promotion; this source note is not a live claim. Remaining input: individualized food/exercise timing guidance and coach placement of meals. Do not silently restore the old blanket hold.

'''
assert r.startswith('# FORM: current state and next actions\n')
r = r.replace('# FORM: current state and next actions\n', '# FORM: current state and next actions\n\n' + entry, 1)
r = r.replace('## September 23 - Adrian nutrition delivery hold', '## Historical - Adrian nutrition delivery hold (superseded by v1.5.4)')
roadmap.write_text(r.rstrip() + '\n')

(root / 'tests/adrian-nutrition-timing.py').write_text('''"""Current companion stays available; timing is not guessed. No private inputs."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
r = Path(__file__).resolve().parents[1]
h = (r/'plans/adrian-nutrition-phase-01/index.html').read_text()
s = BeautifulSoup(h, 'html.parser')
c = json.loads((r/'plans/adrian-nutrition-phase-01/review-context.json').read_text())
assert c['nutrition_revision'] == '1.5.4'
assert c['release_status'] == 'active_with_individual_timing_review'
assert s.html['data-nutrition-version'] == c['nutrition_revision']
assert s.select_one('#plan-hold') is None
assert s.select_one('#food-timing')
assert len(s.select('.recipe-card')) == 3
assert len(s.select('.shop input[data-shop-key]')) == 20
assert len(s.select('.rail-tabs [role="tab"]')) == 3
assert len(s.select('.reference > details')) == 10
assert not s.select('#day-work .k-food[data-at]')
assert c['food_timing']['before_exercise_minutes'] is None
assert c['food_timing']['after_exercise_minutes'] is None
assert c['food_timing']['clinician_guidance_reviewed'] is False
assert c['food_timing']['applies_to'] == ['running','lifting']
assert c['food_timing']['new_food_or_supplement_trials_authorized'] is False
assert c['intervention_started_at'] is None
assert c['training_sources']['nutrition_revision_changes_training'] is False
assert c['training_app_updated'] is False
text = s.get_text(' ', strip=True)
for phrase in ['20 to 30 minutes before your run', 'Lifting without a run:', 'Lift without a run:', 'Eat breakfast after the combined session.', 'save the box for after the run']:
    assert phrase not in text, phrase
for phrase in ['160°F', '165°F', 'within 2 hours', 'lot number', 'dark urine', 'Drink to thirst']:
    assert phrase in text, phrase
assert chr(8212) not in text
assert (r/'plans/adrian-nutrition-phase-01/adrian-prep-reminders.ics').exists()
assert '## Active Adrian nutrition delivery hold' not in (r/'AGENTS.md').read_text()
assert 'Current revision: 1.5.4.' in (r/'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md').read_text()
ids = [e['id'] for e in s.select('[id]')]
assert len(ids) == len(set(ids))
for a in s.select('a[href^="#"]'):
    assert a['href'][1:] in ids, a['href']
print(json.dumps({'timing_checks':'passed','recipe_cards':3,'shopping_keys':20,'blanket_hold':False,'clinical_interval_invented':False,'native_assignments_changed':False}, indent=2))
''')
# Extend, rather than replace or weaken, existing six-width tests.
test = root / 'tests/adrian-nutrition-v15.py'
t = test.read_text()
t += "\n# Verify the scoped food-timing contract for the current companion release.\nif json.loads((root/'plans/adrian-nutrition-phase-01/review-context.json').read_text()).get('release_status') == 'active_with_individual_timing_review':\n    import runpy\n    runpy.run_path(str(root/'tests/adrian-nutrition-timing.py'), run_name='__main__')\n"
test.write_text(t)
print('Scoped publishing correction applied. Recipes, amounts and private history unchanged.')
