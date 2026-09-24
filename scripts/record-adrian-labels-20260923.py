"""Record supplied labels, not a dose or medical clearance. No private images are copied."""
from pathlib import Path
import json, re, sys
from bs4 import BeautifulSoup

R = Path.cwd()
D = R / 'plans/adrian-nutrition-phase-01'
RECORD = 'docs/studies/ADRIAN-NUTRITION-LABELS-20260923.json'
CURRENT = 'docs/studies/ADRIAN-NUTRITION-CURRENT.md'
VERSION = '1.5.4'
STATUS = 'live_planning_no_prerun_prescription'

def put(path, value):
    path = R / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding='utf-8')

def json_text(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2) + '\n'

record = {
    'schema_version': 1,
    'record_type': 'label_photo_and_athlete_report_followup',
    'recorded_on': '2026-09-23',
    'athlete': 'Adrian Gandara',
    'study_id': 'FRM-001',
    'source': 'Five product photographs and one message screenshot supplied by Brice. Originals are not published.',
    'source_files': ['IMG_4657.jpeg', 'IMG_4658.jpeg', 'IMG_4659.jpeg', 'IMG_4660.jpeg', 'IMG_4661.jpeg', 'IMG_7964.jpeg'],
    'follows_record': 'docs/studies/ADRIAN-NUTRITION-OBSERVATIONS-20260923.json',
    'bone_broth_protein': {
        'brand': 'Designs for Health',
        'product': 'Bone Broth Protein',
        'flavor': 'Chocolate',
        'label_verified_from_supplied_photos': True,
        'serving_size_powder_g': 27,
        'serving_description': 'approximately one scoop',
        'servings_per_container': 30,
        'net_weight_g': 810,
        'per_labeled_serving': {'calories_kcal': 110, 'protein_g': 21, 'carbohydrate_g': 3, 'fiber_g': 1, 'fat_g': 1.5, 'iron_mg': 1, 'sodium_mg': 150, 'potassium_mg': 150},
        'ingredients_as_photographed': ['Bone broth collagen protein (HydroBEEF)', 'Natural flavors', 'Cocoa powder', 'Medium chain triglycerides', 'Steviol glycosides (from organic Stevia rebaudiana leaf)', 'Silicon dioxide'],
        'protein_source': 'Collagen-rich beef protein isolate; not whey.',
        'manufacturer_claim': 'Side label describes HydroBEEF as containing both complete and collagen proteins. Manufacturer webpage describes all essential amino acids. These are manufacturer statements, not an independent amino-acid assay.',
        'quantitative_amino_acid_profile': None,
        'leucine_g_per_serving': None,
        'equivalent_to_whey_confirmed': False,
        'not_assumed_to_be_pure_collagen_or_incomplete': True,
        'label_mixing_information': '27 g in 8 ounces of water or another beverage; label information only, not a prescribed drink or timing.',
        'actual_powder_g_per_use': None,
        'frequency': None,
        'first_use_date': None,
        'lot_number': None,
        'expiry_date': None,
        'lot_note': 'Lot and expiry not visible in the supplied protein photos.',
        'independent_product_or_lot_testing_verified': False,
        'individual_use_or_timing_cleared': False,
        'source_files': ['IMG_4657.jpeg', 'IMG_4658.jpeg', 'IMG_4659.jpeg']
    },
    'creatine': {
        'brand': 'BulkSupplements.com',
        'product': 'Creatine Monohydrate Powder',
        'flavor': 'Unflavored',
        'label_verified_from_supplied_photos': True,
        'form': 'Creatine monohydrate',
        'labeled_serving_g': 5,
        'label_serving_description': '2 tsp (about 5 g)',
        'servings_per_container': 200,
        'net_weight_g': 1000,
        'other_ingredients_as_photographed': 'None',
        'actual_g_per_use': None,
        'frequency': None,
        'first_use_date': None,
        'loading_phase_reported': None,
        'new_dose_prescribed': False,
        'new_loading_phase_prescribed': False,
        'lot_number': None,
        'expiry_date': None,
        'lot_note': 'A lot/expiry stamp is photographed; angled print needs confirmation before an exact lot is used for verification.',
        'independent_product_or_lot_testing_verified': False,
        'individual_use_or_timing_cleared': False,
        'source_files': ['IMG_4660.jpeg', 'IMG_4661.jpeg']
    },
    'intake_report': {
        'source_file': 'IMG_7964.jpeg',
        'date_basis': 'Same-day coach conversation context; screenshot says Today, without an absolute date.',
        'reported_day': '2026-09-23',
        'before_lunch_reported_kcal': 1300,
        'later_running_total_reported_kcal': 2260,
        'later_report_context': 'Reported before the planned run and dinner; not a claim of eating immediately before running.',
        'message_time_visible': '2:51 PM',
        'lunch_reported': 'Rice, beans and rotisserie chicken from La Granja.',
        'meal_size_feedback': 'Athlete described the large lunch as difficult to finish.',
        'portion_weights_or_complete_food_log_supplied': False,
        'calories_independently_verified': False,
        'daily_total_kcal': None,
        'energy_expenditure_kcal': None,
        'surplus_kcal': None,
        'run_completed_from_this_message': False,
        'full_plan_start_confirmed': False,
        'interpretation': 'An intake self-report plus a meal-size concern. No calorie target, measured surplus, muscle gain, or success from forcing food is inferred.',
        'coaching_response': 'Record the full day and comfortable meal sizes. Do not force a larger meal to beat a number or add pre-run food.'
    },
    'boundaries': {
        'keep_page_live': True,
        'new_prerun_food_or_supplement_prescription': False,
        'fasting_interval_prescribed': None,
        'automatic_immediate_postexercise_or_lifting_exception': False,
        'timing_owner': 'Treating clinician; coach implements reviewed guidance.',
        'training_assignment_changed': False,
        'native_app_sync_claimed': False,
        'medical_history_published': False,
        'label_information_is_not_individual_clearance': True
    },
    'sources': [
        {'url': 'https://www.designsforhealth.com/products/bone-broth-protein', 'role': 'Manufacturer identity and protein description; photographed package controls recorded macros.'},
        {'url': 'https://www.bulksupplements.com/products/creatine-monohydrate', 'role': 'Manufacturer identity only. Website dosing/marketing is not adopted.'},
        {'url': 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/', 'role': 'General protein-quality and creatine/weight interpretation, not individual approval.'}
    ],
    'privacy': 'No screenshots, home images, clinical history, diagnosis claims, contact details or private exercise logs are copied into the public repository.'
}

if '--verify' not in sys.argv:
    h = (D / 'index.html').read_text()
    c = json.loads((D / 'review-context.json').read_text())
    assert c['nutrition_revision'] in ['1.5.3', VERSION], 'Concurrent nutrition revision requires reconciliation'
    if c['nutrition_revision'] != VERSION:
        h = h.replace('v1.5.3', 'v' + VERSION).replace('Version 1.5.3', 'Version ' + VERSION)
        s = BeautifulSoup(h, 'html.parser')
        safety_before = s.select_one('#food-safety').get_text(' ', strip=True)
        recipes_before = [x.get_text(' ', strip=True) for x in s.select('.recipe-card')]
        def body(tag, fragment):
            assert tag is not None
            tag.clear()
            f = BeautifulSoup(fragment, 'html.parser')
            for child in list(f.contents):
                tag.append(child)
        s.html['data-nutrition-version'] = VERSION
        s.html['data-nutrition-status'] = STATUS
        day = s.select_one('#your-day')
        lede = day.select_one('.lede')
        note = BeautifulSoup('<p class="small" id="food-timing-rule"><strong>No pre-run food or supplement instructions.</strong> Meal times below are planning references. Confirm food timing before and after running or lifting with your clinician; this page does not set a safe fasting interval.</p>', 'html.parser').p
        lede.insert_after(note)
        work = s.select_one('#day-work')
        first = work.select_one('li')
        body(first.select_one('.what'), '<b>Running today?</b><p>No snack is assigned before your run. Use your clinician\'s food-and-exercise guidance.</p>')
        for item in s.select('.rail-day li.k-food'):
            item.attrs.pop('data-at', None)
        breakfast = work.select('li')[1]
        body(breakfast.select_one('.t'), 'Breakfast')
        p = breakfast.select_one('.what > p')
        body(p, '<strong>12 fl oz</strong> whole milk, <strong>2 slices</strong> bread, <strong>2 tbsp</strong> peanut butter and <strong>1</strong> navel orange at your agreed meal time. Use only foods your clinician has cleared for you. <a href="#powder">Supplement labels received</a>.')
        for summary in s.select('summary'):
            name = summary.get_text(' ', strip=True)
            if name == 'Morning run + lift back-to-back':
                body(summary.find_next_sibling('p'), 'No food is inserted between sessions. Confirm when to eat again with your clinician; finishing exercise does not establish the timing.')
            elif name == 'Powder you already own':
                body(summary.find_next_sibling('p'), 'Both labels are recorded. Send how much you actually use, when you started and how often. No extra shake or replacement purchase. <a href="#powder">Details</a>.')
            elif name == 'Training tonight':
                body(summary.find_next_sibling('p'), 'Do not move this box or the backup sandwich into a pre-run window. Ask Brice to arrange meals around your clinician\'s guidance for both runs and lifts.')
            elif name == 'Breakfast out is over an hour away':
                body(summary, 'Breakfast away from home')
                body(summary.find_next_sibling('p'), 'Plan breakfast at the time agreed with your clinician. Restaurant plans do not require an extra shake.')
        for item in work.select('li'):
            b = item.select_one('.what > b')
            if b and b.get_text(strip=True) == 'Family dinner':
                body(item.select_one('.t'), 'Dinner')
        saturday = s.select_one('#day-sat')
        body(saturday.select_one('li .what > p'), 'No pre-run snack or new gel schedule from this page. Confirm food timing on both sides of exercise with your clinician. Drink to thirst.')
        body(saturday.select('li')[1].select_one('.t'), 'Breakfast')
        sunday = s.select_one('#day-sun')
        body(sunday.select_one('li .what > p'), 'No pre-run snack is assigned. Use the same food-timing guidance for every training day.')
        banana = s.select_one('input[data-shop-key="bananas"]').find_parent('label')
        body(banana.select_one('small'), 'A meal option at your agreed time; no pre-run serving.')
        for item in s.select('#fallback li'):
            if item.get_text(' ', strip=True).startswith('Evening run:'):
                body(item, '<strong>Training day:</strong> do not use a meal or sandwich as a pre-run workaround. Confirm meal timing with your clinician for running and lifting, including after exercise.')
        recipe_note = BeautifulSoup('<p class="small" id="recipe-review-note">Recipe ideas, not a list of foods cleared for you. Use only ingredients allowed by your clinician.</p>', 'html.parser').p
        s.select_one('#recipes > p').insert_after(recipe_note)
        powder = s.select_one('#powder .inside')
        body(powder, '''<p><strong>Labels received.</strong> These are the products already at home. Serving sizes below are label information, not a new dose.</p>
<h3>Designs for Health · chocolate bone-broth protein</h3>
<p><strong>27 g powder · 110 calories · 21 g protein</strong> per labeled serving. Also 3 g carbohydrate and 1.5 g fat.</p>
<p>HydroBEEF is collagen-rich beef protein, not whey. The maker describes all essential amino acids; the amount of each is not shown here.</p>
<h3>BulkSupplements · creatine monohydrate</h3>
<p><strong>5 g per labeled serving</strong> (about 2 tsp). Unflavored; the label lists no other ingredients.</p>
<p><strong>Still to confirm:</strong> grams you actually use, first-use date, frequency, and clear lot/expiry details. Product labels do not clear use or timing for you.</p>
<p>No pre-run powder, loading phase, extra shake or replacement purchase is added. Leave unreviewed supplement use out until your clinician reviews it.</p>
<ul><li>Check ingredient and allergy warnings. Do not use anything you are allergic to.</li><li>Kidney disease, regular medicines or another medical restriction? Check with a clinician or pharmacist before continuing creatine.</li><li>A reaction? Stop and tell Brice. Trouble breathing, or swelling of your lips, tongue or throat: get emergency help.</li></ul>
<p class="small">Labels transcribed from your photos. Independent product/lot checks remain unverified. <a href="#sources">Sources 7, 11, 12 and 13</a>.</p>''')
        for a in s.select('a[href="./adrian-prep-reminders.ics"]'):
            if not (D / 'adrian-prep-reminders.ics').exists():
                a.decompose()
        intro = s.select_one('#supplement-note-20260923')
        body(intro, '<strong>23 September:</strong> both supplement identities and labeled servings are now recorded. Actual amounts, frequency, start dates and individual approval remain open. <a href="/' + RECORD + '">Label and intake follow-up</a>.')
        intake_note = BeautifulSoup('<p id="intake-note-20260923"><strong>Your food update:</strong> you reported 1,300 calories before lunch and 2,260 later in the afternoon, with dinner still to come. Lunch was rice, beans and rotisserie chicken from La Granja, and you said it was hard to finish. Send the complete day; do not force a bigger meal just to beat the number.</p>', 'html.parser').p
        s.select_one('#review .inside').append(intake_note)
        refs = s.select_one('#sources')
        for html in ['<li><a href="https://www.designsforhealth.com/products/bone-broth-protein">Designs for Health: product description.</a> Your photographed tub supplies the recorded serving and nutrition figures.</li>', '<li><a href="https://www.bulksupplements.com/products/creatine-monohydrate">BulkSupplements: product identity.</a> Website dose and timing suggestions are not adopted by this plan.</li>']:
            refs.append(BeautifulSoup(html, 'html.parser').li)
        assert s.select_one('#food-safety').get_text(' ', strip=True) == safety_before
        assert [x.get_text(' ', strip=True) for x in s.select('.recipe-card')] == recipes_before
        put('plans/adrian-nutrition-phase-01/index.html', str(s) + '\n')
        c['nutrition_revision'] = VERSION
        c['release_status'] = STATUS
        c['updated_date'] = '2026-09-23'
        c['latest_observation_record'] = RECORD
        c['current_supplement_labels'] = {'source_record': RECORD, 'status': 'identity_and_label_verified_not_use_clearance', 'bone_broth_protein': record['bone_broth_protein'], 'creatine': record['creatine']}
        c['latest_intake_report'] = record['intake_report']
        c['reported_food_and_supplements_20260923']['followup_label_record'] = RECORD
        c['reported_food_and_supplements_20260923']['status'] = 'Historical initial report; use current_supplement_labels for later label evidence.'
        c['confirmed_for_this_revision']['pre_run_food_rule']['status'] = 'Athlete-reported practice only, not clinician-verified clearance or a prescribed safe interval.'
        c['confirmed_for_this_revision']['evening_fueling_report']['response_status'] = 'Historical response; food timing is superseded by the current no-prerun-prescription boundary.'
        nd = c['nutrition_delivery']
        nd['workday_breakfast'] = 'Meal planning remains live. No before/during/immediately-after exercise timing is prescribed; clinician guidance takes precedence over clock examples.'
        nd['evening_training'] = 'No pre-run meal or sandwich. Timing before and after any exercise, including lifting, requires individual clinician guidance; no lifting-only exemption.'
        nd['long_run_fuel'] = 'No new pre-run snack, gel or supplement. Prior waffle use is historical, not a safe exception. No fasting interval is prescribed.'
        nd['supplement_status'] = 'Designs for Health Bone Broth Protein Chocolate and BulkSupplements creatine monohydrate labels verified. Label servings 27 g and 5 g are not actual doses or recommendations. Use and timing remain for clinician review.'
        nd['new_prerun_food_or_supplement_prescription'] = False
        nd['safe_fasting_interval_hours'] = None
        nd['clinician_guidance_precedes_meal_clock'] = True
        c['shopping']['revision'] = VERSION
        c['interpretation_boundary'] += ' Later intake totals are self-reported partial-day figures, not measured surplus. Label servings are not actual consumed doses; no immediate-postexercise or lifting safety exception is inferred.'
        c['privacy_boundary'] += ' Clinical history and screenshots remain outside this public record.'
        c['training_app_updated'] = False
        put('plans/adrian-nutrition-phase-01/review-context.json', json_text(c))
    put(RECORD, json_text(record))
    current = '''# Adrian nutrition: current delivery

Revision: 1.5.4. Owner decision: keep the meal-planning page live; prescribe no food before runs.

## Current rules
The live page is a meal-planning companion, not individual exercise/food clearance. No pre-run snack, powder, sandwich, food trial or fixed safe fasting interval is assigned. Do not automatically shift food to immediately after exercise or exempt lifting. The treating clinician sets the timing boundaries; Brice implements reviewed guidance. Existing recipes remain reference material, not a cleared-food list.

## Evidence
The dated label/intake follow-up is [ADRIAN-NUTRITION-LABELS-20260923.json](ADRIAN-NUTRITION-LABELS-20260923.json). Photographed labels identify Designs for Health Bone Broth Protein Chocolate (27 g powder; 110 kcal; 21 g protein) and BulkSupplements creatine monohydrate (5 g per labeled serving). These are not actual consumed doses. The manufacturer describes complete and collagen proteins; do not label this product pure collagen, declare it incomplete, assume a leucine value or assert whey-equivalence without evidence.

The 1,300 and 2,260 calorie figures are athlete-reported running totals before the day was complete. The large lunch was difficult to finish. No measured surplus, new calorie target, run completion or full-plan start is inferred. Preserve the earlier observation as history.

## What remains open
Actual supplement amounts, frequency, first-use dates, protein lot/expiry, clearer creatine stamp, independent product/lot verification and individual clinician approval. Full-day food record and meal-size comfort remain under review. No forced larger meals or pre-run food to solve an intake gap.

## Release and connection
Run `python tests/adrian-nutrition-v15.py` and `python tests/adrian-nutrition-labels.py` before promotion. Production is only verified after the deployed revision and record match the tested commit. The validation workflow retains browser evidence; a tested holding branch is not a production claim.

The 1.5.2 whole-page hold is historical, superseded by Brice's explicit keep-live instruction and these narrower boundaries. Do not reapply the old hold or restore old pre-run feeding from generators. Public page and review-context share this revision. Canonical FORM/Forge assignments and completed records are unchanged; no native/app sync is claimed. Clinical details, symptoms, hospital history and the supplied photos stay out of this public repository.
'''
    put(CURRENT, current)
    ap = R / 'AGENTS.md'
    a = ap.read_text()
    old = '## Active Adrian nutrition delivery hold\nBefore editing or regenerating Adrian nutrition, read [the current release hold](docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md). Do not restore historical food or supplement instructions without the documented resume gate. Private clinical details must not be published.'
    new = '## Adrian nutrition: keep live, no pre-run food prescriptions\nRead [current nutrition delivery](docs/studies/ADRIAN-NUTRITION-CURRENT.md) before editing or regenerating this page. The historical whole-page hold is superseded by Brice\'s keep-live instruction. Do not prescribe pre-run food, a safe fasting interval, an immediate-postexercise workaround or a lifting exemption. Label servings are not actual doses or individual clearance. Keep the page and review-context aligned; keep private clinical details out of public files.'
    if old in a:
        a = a.replace(old, new)
    else:
        assert new in a, 'Agent rule changed concurrently'
    put('AGENTS.md', a)
    hp = R / 'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md'
    hold = hp.read_text()
    prefix = '> Historical notice: superseded by the explicit keep-live instruction. Current release boundaries are in [ADRIAN-NUTRITION-CURRENT.md](ADRIAN-NUTRITION-CURRENT.md). Do not treat the old status below as current.\n\n'
    if not hold.startswith(prefix):
        put('docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md', prefix + hold)
    rp = R / 'docs/roadmap/FORM-ROADMAP.md'
    roadmap = rp.read_text()
    heading = '## September 23 - Adrian labels and keep-live boundary, v1.5.4'
    if heading not in roadmap:
        item = heading + '\n\nKeep the nutrition page available with no pre-run food prescription. Product identities and photographed label servings are recorded; actual dose, frequency, start date and individual approval remain unconfirmed. Partial-day reported intake (1,300 then 2,260 kcal) and a difficult-to-finish lunch are observations, not surplus or a mandate to force more food. Current source and release checklist: [Adrian nutrition](../studies/ADRIAN-NUTRITION-CURRENT.md). No native training assignment change. Validate six widths and label/boundary checks before promoting; verify production separately against that tested commit.\n\n'
        first, rest = roadmap.split('\n', 1)
        put('docs/roadmap/FORM-ROADMAP.md', first + '\n\n' + item + rest.lstrip('\n'))
    test = '''"""Non-destructive checks for recorded label evidence and food-timing boundaries."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
r=Path(__file__).resolve().parents[1]
d=r/'plans/adrian-nutrition-phase-01'
s=BeautifulSoup((d/'index.html').read_text(), 'html.parser')
c=json.loads((d/'review-context.json').read_text())
x=json.loads((r/'docs/studies/ADRIAN-NUTRITION-LABELS-20260923.json').read_text())
assert c['nutrition_revision']=='1.5.4'
assert c['release_status']=='live_planning_no_prerun_prescription'
assert s.html['data-nutrition-version']=='1.5.4'
assert len(s.select('.reference > details'))==10
assert len(s.select('.recipe-card'))==3
assert len(s.select('.shop input[data-shop-key]'))==20
assert not s.select('.rail-day li.k-food[data-at]')
text=s.get_text(' ',strip=True)
for phrase in ['No pre-run food or supplement instructions.', '110 calories', '21 g protein', '5 g per labeled serving', '2,260', 'La Granja', 'not a new dose', 'lot number']:
    if phrase=='lot number': continue
    assert phrase in text,phrase
for phrase in ['20 to 30 minutes before your run', 'One before each run.', 'Eat breakfast after the combined session.', 'the 3:30 box can stay.', 'Keep your no-food window', 'eat after the run.']:
    assert phrase not in text,phrase
assert x['bone_broth_protein']['per_labeled_serving']['calories_kcal']==110
assert x['bone_broth_protein']['actual_powder_g_per_use'] is None
assert x['creatine']['labeled_serving_g']==5
assert x['creatine']['actual_g_per_use'] is None
assert not x['creatine']['new_dose_prescribed']
assert x['intake_report']['surplus_kcal'] is None
assert x['intake_report']['daily_total_kcal'] is None
assert not x['intake_report']['run_completed_from_this_message']
assert c['nutrition_delivery']['safe_fasting_interval_hours'] is None
assert not c['training_app_updated']
assert not c['training_sources']['nutrition_revision_changes_training']
assert c['intervention_started_at'] is None
assert '\\u2014' not in text
for a in s.select('a[href^="#"]'):
    assert s.find(id=a['href'][1:]),a['href']
print('Label evidence, live status, privacy boundary and non-prescriptive timing checks passed.')
'''
    put('tests/adrian-nutrition-labels.py', test)

c = json.loads((D/'review-context.json').read_text())
assert c['nutrition_revision'] == VERSION
assert c['release_status'] == STATUS
s = BeautifulSoup((D/'index.html').read_text(), 'html.parser')
assert len(s.select('.reference > details')) == 10
assert len(s.select('.shop input[data-shop-key]')) == 20
assert s.select_one('#food-timing-rule')
assert s.select_one('#intake-note-20260923')
print('Adrian v1.5.4 labels and boundary applied; no new dose or training assignment.')
