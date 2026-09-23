"""Apply only the Sep 23 athlete-reported food/supplement notes; preserve the page design."""
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path.cwd()
PAGE = ROOT / 'plans/adrian-nutrition-phase-01/index.html'
CONTEXT = PAGE.with_name('review-context.json')
RECORD = ROOT / 'docs/studies/ADRIAN-NUTRITION-OBSERVATIONS-20260923.json'
MARKER = 'supplement-note-20260923'
NIH = 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/'
USADA = 'https://www.usada.org/substances/supplement-connect/'

def blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def replace_once(text, old, new):
    assert text.count(old) == 1, 'Expected exactly one match: ' + old[:100]
    return text.replace(old, new, 1)

def verify():
    from bs4 import BeautifulSoup
    text = PAGE.read_text()
    soup = BeautifulSoup(text, 'html.parser')
    ctx = json.loads(CONTEXT.read_text())
    record = json.loads(RECORD.read_text())
    assert soup.select_one('#' + MARKER)
    assert soup.select_one('#powder > summary').get_text() == 'Your protein powder + creatine'
    assert '210 calories' in soup.select_one('#preferences').get_text()
    assert '13 g protein' in soup.select_one('#preferences').get_text()
    assert 'LesserEvil Space Balls' in soup.select_one('#preferences').get_text()
    assert 'bone-broth' in soup.select_one('#powder').get_text()
    assert '1 scoop' not in soup.select_one('#day-work').get_text()
    assert '7 scoops' not in soup.select_one('#shopping').get_text()
    assert 'Check yours' in soup.select_one('#shopping').get_text()
    assert len(soup.select('.shop input[data-shop-key]')) == 20
    assert len(soup.select('.reference > details')) == 10
    assert len(soup.select('.recipe-card')) == 3
    assert soup.select_one('meta[name=robots]')['content'] == 'noindex,follow'
    ids = [e['id'] for e in soup.select('[id]')]
    assert len(ids) == len(set(ids))
    assert all(a['href'][1:] in ids for a in soup.select('a[href^="#"]'))
    assert '\u2014' not in soup.get_text()
    assert ctx['intervention_started_at'] is None
    assert ctx['training_sources']['nutrition_revision_changes_training'] is False
    assert ctx['confirmed_for_this_revision']['evening_fueling_report']['reported_event_date'] == '2026-09-22'
    assert ctx['nutrition_revision'] == '1.5.1'
    assert record['creatine']['grams_per_use'] is None
    assert record['creatine']['first_use_date'] is None
    assert record['creatine']['form'] is None
    assert record['bone_broth_protein']['brand'] is None
    assert record['power_crunch']['calories']['verification'] == 'athlete report; back nutrition label not supplied'
    assert record['full_plan_start_confirmed'] is False
    assert 'form.adrian.nutrition.1.4.shopping' in PAGE.with_name('shopping.js').read_text()
    for term in ['Greek yogurt', 'Cottage cheese', 'Brussels sprouts', 'Mushrooms']:
        assert term in soup.select_one('#preferences').get_text()
    assert len(soup.select('#sources > li')) == 11
    assert 'Supplements%20used' in text
    print(json.dumps({'notes_verification': 'passed', 'files': [str(p.relative_to(ROOT)) for p in [PAGE, CONTEXT, RECORD]], 'supplement_doses_prescribed': False, 'full_plan_start_confirmed': False, 'reference_sections': 10, 'shopping_keys_preserved': 20}, indent=2))

if '--verify' in sys.argv or MARKER in PAGE.read_text():
    verify()
    raise SystemExit(0)

assert blob_sha(PAGE.read_bytes()) == '18c942fc2897794df4df85dd517964560240da70', 'Nutrition page changed; reconcile before applying'
assert blob_sha(CONTEXT.read_bytes()) == '3109650f6316f41495aba1e9dcea3fb511cb41c8', 'Nutrition context changed; reconcile before applying'
original = text = PAGE.read_text()
ctx = json.loads(CONTEXT.read_text())

text = replace_once(text, '22 September 2026 · v1.5</div>', '23 September 2026 · v1.5.1</div>')
text = replace_once(text, 'Adrian only · Nutrition 01 · v1.5</span>', 'Adrian only · Nutrition 01 · v1.5.1</span>')
text = replace_once(text, '<strong>Version 1.5</strong>, 22 September 2026.', '<strong>Version 1.5.1</strong>, 23 September 2026.')
text = replace_once(text,
    '<strong>1 scoop</strong> Thorne chocolate whey + <strong>12 fl oz</strong> whole milk.',
    '<strong>12 fl oz</strong> whole milk. Powder waits for the <a href="#powder">label check</a>.')
text = replace_once(text, 'and drink your shake.</p>', 'and drink your milk.</p>')
text = replace_once(text, '<summary>Before your first shake</summary><p>Send Brice a photo of the label and lot number. <a href="#powder">Powder details</a>.</p>',
    '<summary>Powder you already own</summary><p>Send the labels for your bone-broth protein and creatine, plus how much you used. Keep breakfast; no second powder or extra shake. <a href="#powder">Details</a>.</p>')
text = replace_once(text, '<span>At home</span>Shake, bread, peanut butter, orange', '<span>At home</span>Milk, bread, peanut butter, orange. <a href="#powder">Powder check</a>.')
text = replace_once(text, 'Have your shake at home first. It counts as breakfast. No second shake later.', 'Have milk and some of your breakfast bread at home first. Keep the rest for breakfast. Powder waits for the label check.')
text = replace_once(text, '<span class="n">Thorne chocolate whey</span><small>One tub lasts weeks. Photo the label and lot first.</small></span><span class="q">7 scoops</span>',
    '<span class="n">Protein powder</span><small>Check what you own with Brice before buying another tub.</small></span><span class="q">Check yours</span>')
old_powder = re.search(r'<details id="powder">[\s\S]*?</details>', text).group()
new_powder = '''<details id="powder"><summary>Your protein powder + creatine</summary><div class="inside">
<p><strong>Already at home:</strong> you reported chocolate bone-broth protein and creatine together in a post-workout shake.</p>
<p><strong>Send Brice:</strong> both tubs' fronts, ingredients, nutrition or supplement facts, serving directions and lot number. Add how much of each you used, when you started and how often.</p>
<p><strong>Until checked:</strong> keep your milk and full breakfast. Leave unreviewed powders out; do not buy Thorne or add a second shake just for this page.</p>
<p>Bone-broth powder is not automatically a serving-for-serving replacement for whey. Brice will check the protein source and serving first. No new creatine dose or loading plan is being added.</p>
<ul>
<li>Check all ingredient and allergy warnings. Do not use a product containing an ingredient you are allergic to.</li>
<li>Kidney disease, regular medicines or another medical restriction? Check with a clinician or pharmacist before continuing creatine.</li>
<li>A reaction? Stop and tell Brice. Trouble breathing, or swelling of your lips, tongue or throat: get emergency help.</li>
</ul><p class="small"><a href="#sources">Sources 7 and 11</a>. Product and independent-testing checks are still pending.</p></div></details>'''
text = replace_once(text, old_powder, new_powder)
text = replace_once(text, '<li><strong>Rest day:</strong> keep every meal.</li>', '<li><strong>Rest day:</strong> keep every meal.</li>\n<li><strong>Snacks you enjoy:</strong> Space Balls and Power Crunch can sit alongside your meals. Keep the 3:30 box or sandwich; a snack does not require another shake.</li>')
text = replace_once(text, '<span>How runs felt</span><span>First-cook photo</span>', '<span>How runs felt</span><span>Supplements: product, amount, time</span><span>First-cook photo</span>')
text = replace_once(text, 'How%20runs%20felt%3A%20">', 'How%20runs%20felt%3A%20%0ASupplements%20used%20%28product%2C%20amount%2C%20time%29%3A%20">')
text = replace_once(text, '<p><strong>Protein:</strong> about 130 to 145 g a day from food and the shake.', '<p class="small">Creatine can change scale weight through water retention. Tell Brice when you started or changed it so your weight trend is read in context. <a href="#sources">Source 11</a>.</p>\n<p><strong>Protein:</strong> about 130 to 145 g a day from your total food and any reviewed powder.')
text = replace_once(text, '<li>Cheese, cream cheese and sour cream.</li>', '<li>Cheese, cream cheese and sour cream.</li><li>LesserEvil Space Balls, Real Organic Cheddar.</li>')
text = replace_once(text, '<p>Something in a recipe not working for you? Tell Brice.', '<p><strong>Also at home:</strong> Power Crunch Triple Chocolate wafers are popular in your house. The wrapper shows 13 g protein; you reported 210 calories. Send the back label to confirm the serving.</p><p>Something in a recipe not working for you? Tell Brice.')
text = replace_once(text, 'This page adds no training and no supplements beyond one whey shake.', 'This update records supplements Adrian already used; it adds no training or new supplement dose.')
text = replace_once(text, '<ol id="sources">', '<p id="' + MARKER + '"><strong>23 September:</strong> snacks and post-workout bone-broth protein + creatine are athlete reports. Brands, doses, frequency and first-use date remain unverified. Record creatine exposure when interpreting weight or lean-mass changes. This does not confirm the full food plan has started. <a href="/docs/studies/ADRIAN-NUTRITION-OBSERVATIONS-20260923.json">Dated observation record</a>.</p>\n<ol id="sources">')
text = replace_once(text, 'Thorne: exact chocolate whey</a>', 'Thorne: original whey option, not confirmed use</a>')
text = replace_once(text, "This page's food-safety limits apply.</li>\n</ol>", "This page's food-safety limits apply.</li>\n<li><a href=\"" + NIH + "\">NIH Office of Dietary Supplements: creatine, protein quality and water-related weight changes.</a> General evidence, not verification of Adrian's products or response.</li>\n</ol>")

# Source-level invariants: retain all unrelated clinical/safety and design work.
for pattern in [r'<style>[\s\S]*?</style>', r'<script[\s\S]*?</script>', r'<article class="recipe-card"[\s\S]*?</article>', r'<details id="food-safety">[\s\S]*?</details>', r'<details id="prep-cycle">[\s\S]*?</details>', r'<details id="kit">[\s\S]*?</details>']:
    assert re.findall(pattern, original) == re.findall(pattern, text), 'Unexpected unrelated change: ' + pattern
for phrase in ['A microwave is not cold storage.', 'Morning run + lift back-to-back', 'Training tonight', 'Home from work: start training within 30 minutes.', 'Too full to stir when reheating? Split it into two.']:
    assert phrase in text

record = {
    'schema_version': 1,
    'record_type': 'dated_athlete_report',
    'recorded_on': '2026-09-23',
    'athlete': 'Adrian Gandara',
    'study_id': 'FRM-001',
    'source': 'Two athlete-message screenshots supplied by Brice on 2026-09-23. Screenshots are not republished.',
    'source_evidence': [
        {'file': 'IMG_7904.jpeg', 'observed': 'Preference for LesserEvil Space Balls Real Organic Cheddar; reports chocolate bone-broth protein and creatine at home, used together in a shake after working out.'},
        {'file': 'IMG_7905.jpeg', 'observed': 'Power Crunch Triple Chocolate wrapper shows 13 g protein. Athlete says the bars are extremely popular at home, reports 210 calories and describes a light wafer.'}
    ],
    'space_balls': {'product': 'LesserEvil Space Balls, Real Organic Cheddar', 'preference': 'explicitly liked', 'portion_consumed': None, 'frequency': None, 'nutrition_verified': False},
    'power_crunch': {'product': 'Power Crunch Triple Chocolate', 'availability': 'athlete reports popular in household', 'protein_g': {'value': 13, 'verification': 'visible front wrapper'}, 'calories': {'value': 210, 'verification': 'athlete report; back nutrition label not supplied'}, 'portion_consumed': None, 'frequency': None},
    'bone_broth_protein': {'description': 'chocolate bone-broth protein powder', 'owned_reported': True, 'use_reported': True, 'timing': 'after a workout, in the same shake as creatine', 'brand': None, 'protein_source_and_amino_acid_profile': None, 'grams_per_use': None, 'protein_g_per_serving': None, 'first_use_date': None, 'frequency': None, 'lot_and_independent_testing': None, 'equivalent_to_whey_confirmed': False},
    'creatine': {'owned_reported': True, 'use_reported': True, 'timing': 'after a workout, in the same shake as chocolate bone-broth protein', 'brand': None, 'form': None, 'grams_per_use': None, 'first_use_date': None, 'frequency': None, 'loading_phase_reported': None, 'lot_and_independent_testing': None, 'response_or_tolerance_confirmed': False, 'new_dose_prescribed': False},
    'reported_workout_date': None,
    'full_plan_start_confirmed': False,
    'coaching_response': ['Record food preferences and supplement exposure without inferring daily adherence or a start date.', 'Ask for both products, ingredient/facts panels, serving directions, lot numbers, actual amount, frequency and first use.', 'Keep meals; pause the automatic Thorne purchase and unreviewed powder instruction. Do not add another shake for snacks.', 'No new creatine dose, loading phase, training change or performance claim.'],
    'interpretation': 'Creatine may alter scale weight through water retention. Exposure timing must be considered alongside food, training and sleep; no observed weight or muscle gain is attributed to creatine or to the food plan by this record.',
    'supporting_sources': [{'url': NIH, 'purpose': 'General protein-quality and creatine/weight interpretation; not an analysis of the unknown products.'}, {'url': USADA, 'purpose': 'Product and independent-testing review; certification lowers but does not eliminate risk.'}],
    'privacy': 'No screenshots, profile photos, phone numbers, email addresses or private workout records are published.'
}
ctx['nutrition_revision'] = '1.5.1'
ctx['updated_date'] = '2026-09-23'
ctx['latest_observation_record'] = str(RECORD.relative_to(ROOT))
ctx['reported_food_and_supplements_20260923'] = {k: record[k] for k in ['space_balls', 'power_crunch', 'bone_broth_protein', 'creatine', 'reported_workout_date', 'full_plan_start_confirmed']}
ctx['nutrition_delivery']['workday_breakfast'] = 'By 8 a.m. regardless of later training: 12 fl oz whole milk, two bread slices with 32 g peanut butter and one navel orange. Powder is pending review of the products already owned; no automatic Thorne purchase or second shake. For back-to-back morning run/lift, eat one of the two bread slices between them and finish breakfast afterward.'
ctx['nutrition_delivery']['supplement_status'] = 'Bone-broth protein and creatine use reported, products/doses unverified. Leave unreviewed powders out pending label review. No new creatine prescription.'
ctx['shopping']['revision'] = '1.5.1'
ctx['shopping']['powder_purchase'] = 'Check existing products before buying; existing whey checkbox key retained, no auto-check or adherence inference.'
ctx['interpretation_boundary'] += ' Creatine exposure is now reported; start date and dose are unknown. Account for possible water-related weight changes without attributing measured outcomes to this supplement.'
PAGE.write_text(text)
CONTEXT.write_text(json.dumps(ctx, indent=2, ensure_ascii=False) + '\n')
RECORD.parent.mkdir(parents=True, exist_ok=True)
RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n')
verify()
