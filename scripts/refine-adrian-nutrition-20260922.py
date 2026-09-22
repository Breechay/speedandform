"""Scoped copy/weekend follow-up. No training or completed evidence changes."""
from pathlib import Path
import copy
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'plans/adrian-nutrition-phase-01/index.html'
STUDY = ROOT / 'labs/adrian-runner-mass/index.html'
SOURCE = ROOT / 'docs/studies/ADRIAN-NUTRITION-INTAKE-20260922.json'
VERSION = '2026.09.22.2'


def replace_once(text, old, new):
    assert text.count(old) == 1, f'Expected one unchanged copy target: {old[:85]}'
    return text.replace(old, new, 1)


def study_object(html):
    start = html.index('const STUDY = ') + len('const STUDY = ')
    obj, length = json.JSONDecoder().raw_decode(html[start:])
    return obj, start, start + length


def main():
    html = PLAN.read_text()
    study_html = STUDY.read_text()
    study, start, end = study_object(study_html)
    data = json.loads(SOURCE.read_text())
    if study['version'] == VERSION:
        assert 'id="weekends"' in html and '<nav class="nav"' not in html
        assert 'Take photos of 2 normal work lunches.' in html
        print('Adrian copy/weekend refinement is already applied.')
        return
    assert study['version'] == '2026.09.22.1', 'Study changed; reconcile before applying.'
    assert data['version'] == '1.0', 'Intake version changed; reconcile before applying.'
    old_study = copy.deepcopy(study)
    old_data = copy.deepcopy(data)
    html, n = re.subn(r'<nav class="nav" aria-label="Page sections">.*?</nav>', '', html)
    assert n == 1, 'Top navigation row changed.'
    replacements = [
        ('22 September 2026 · v1.0', '22 September 2026 · v1.1'),
        ('<h2>One routine to repeat.</h2>', '<h2>Your workday routine.</h2>'),
        ('On a day without a run, eat the banana with breakfast. Tell Brice when food before a run bothers your stomach; do not force it.', 'On a day without a run, eat the banana with breakfast.'),
        ('Eat after your morning session, before work. When the morning runs tight, bring the breakfast with you and eat when you arrive. Do not wait until lunch.', 'Eat after your morning session, before work. On a tight morning, take breakfast to work.'),
        ('Send Brice photos of 2 normal work lunches. We will check the portions without asking you to replace a meal that is already provided.', 'Take photos of 2 normal work lunches.'),
        ('<p class="small">Keep dinner. When this box repeatedly leaves you too full for dinner, tell Brice so we can reduce the box rather than quietly losing another meal.</p>', ''),
        ('Those rice-and-bean portions are a guide for that dinner, not extras to stack onto a full pasta dinner. Keep the family menu. Send 2 dinner photos so we can fit the portions to what is actually served.', 'Use the rice and beans with a meat dinner, not on top of a full pasta dinner. Take photos of 2 normal family dinners.'),
        ('You finish with 7 meals and 1 frozen backup. Carry chilled meals in an insulated bag with ice packs, then use your work fridge.', 'That covers 5 workday afternoon meals, 2 weekend dinners and 1 frozen backup. Carry chilled meals in an insulated bag with ice packs, then use your work fridge.'),
        ('Tell Brice about allergies, medicines or any stomach reaction before continuing a new powder.', 'Check allergies and medication compatibility before starting a new supplement.'),
        ('<summary>Your shopping list · 7 days + 1 spare meal</summary>', '<summary>Your shopping list · one week</summary>'),
        ('<strong>Breakfast:</strong> 14 bread slices (about 560 g total), 14 tablespoons / 224 g peanut butter, 7 bananas, 7 navel oranges, 1 gallon whole milk (you will use 84 fl oz / about 2.5 L), and 7 labeled servings of the chocolate whey.', '<strong>Workday breakfast:</strong> 10 bread slices (about 400 g total) and 10 tablespoons / 160 g peanut butter. Keep extra bread and peanut butter for a weekend breakfast at home.<br><strong>Daily fruit and shake:</strong> 7 bananas, 7 navel oranges, 1 gallon whole milk (you will use 84 fl oz / about 2.5 L), and 7 labeled servings of the chocolate whey.'),
        ('<strong>Equipment:</strong> 4 reusable shallow containers, labels, shaker, food thermometer, insulated lunch bag and ice packs. Reuse the containers for the second batch. Keep one extra freezer-safe container for the spare.', '<strong>Equipment:</strong> 5 freezer-safe shallow containers, labels, shaker, food thermometer, insulated lunch bag and ice packs. Reuse 4 containers for each batch; the fifth holds your spare.'),
        ('<li>Chili; meat and cheese; pizza.</li>', '<li>Chili; meat and cheese; pizza; chicken nuggets.</li>'),
        ('Chili, meatballs, tuna and pizza stay on your list for future variety. We are not asking you to choose a different menu every day. Tell Brice what to add or remove. Your messages update this list; opening the page does not save changes.', 'For later variety: chili, meatballs, tuna and pizza. Your weekend meals also include burgers, Cuban food, eggs, bacon and pancakes.'),
        ('Evening session:</strong> the larger pasta portion may need to move earlier. Keep the same food for the day, but ask Brice to place it around your actual start time. Do not force a full meal immediately before running.', 'Evening session:</strong> move the pasta meal earlier when needed. Avoid a full meal immediately before running.'),
        ('After 7 days, send Brice a short note: breakfasts eaten, afternoon meals eaten, usual bedtime, appetite, digestion, soreness and how your runs felt. Send 2 lunch photos and 2 dinner photos during that week.', 'After 7 days: review meals, appetite, digestion, sleep, soreness and run quality.'),
        ('Tell Brice before progressing a lift when soreness limits normal movement.', 'Do not increase lifting while soreness limits normal movement.'),
        ('<strong>Version:</strong> 1.0, prepared 22 September 2026. This is your web nutrition companion, not a generic runner template. Tell Brice the day you start so your first review can use a real start date.', '<strong>Version:</strong> 1.1, updated 22 September 2026. This is your nutrition plan. Record your start date.'),
        ('Adrian only · Nutrition 01 · v1.0', 'Adrian only · Nutrition 01 · v1.1'),
    ]
    for old, new in replacements:
        html = replace_once(html, old, new)
    weekend = '''<section class="block" id="weekends"><p class="label">Saturday and Sunday</p><h2>Keep the meals out.</h2><p><strong>Breakfast and lunch with your parents count as your meals.</strong> Keep your eggs and pancakes, burger or Cuban meal. Do not add the weekday breakfast or lunch on top.</p><p>When breakfast is out, have your orange and milk-and-whey shake in the afternoon. Keep the banana before your run. When breakfast is at home, follow the workday breakfast.</p><p><strong>Your weekend pasta boxes are dinner at home, not an extra 3:30 meal.</strong> On a nugget night, freeze the unused pasta box and add rice and green beans to the nuggets. Follow the package cooking instructions.</p><p class="small">Take a photo of the nugget package and nutrition label. The serving will be based on that label, not a fixed nugget count.</p></section>\n'''
    html = replace_once(html, '<div class="check"><strong>This week:</strong>', weekend + '<div class="check"><strong>This week:</strong>')
    html = replace_once(html, 'prepare breakfast, eat the afternoon box, and move your phone away before bed. Repeat these before adding more rules.', 'prepare your workday breakfast and afternoon meal. Keep your weekend meals. Put your phone away before bed.')
    html = replace_once(html, '<p><strong>Rest day:</strong> keep breakfast, lunch, your afternoon meal and dinner. Eat the banana with breakfast. Do not remove meals automatically because you did not run.</p>', '<p><strong>Rest day:</strong> keep meals in place. Use the workday routine on a workday and the weekend routine on Saturday and Sunday. Eat the banana with breakfast.</p>')
    html = replace_once(html, '<h3>Also confirmed</h3><p>Whole milk and fruit are fine.', '<h3>Your weekends</h3><p>You usually eat out with your parents once or twice a day, mainly breakfast and lunch. Flanigan’s, burger places and Cuban restaurants are part of your normal routine. You also use the air fryer for chicken nuggets at home.</p><h3>Also confirmed</h3><p>Whole milk and fruit are fine.')
    html = replace_once(html, 'powder taste and tolerance; normal lunch and dinner portions; actual intake and weight trend.', 'powder taste and tolerance; normal lunch and dinner portions; the nugget brand and nutrition label; actual intake and weight trend.')
    assert not re.search(r'\b(?:tell|send|ask) Brice\b', html, re.I)
    assert html.count('Take photos of 2 normal work lunches.') == 1
    assert html.count('Take photos of 2 normal family dinners.') == 1
    assert '<nav class="nav"' not in html
    assert 'id="preferences"' in html and 'id="sources"' in html
    assert 'https://www.thorne.com/products/dp/whey-protein-isolate-chocolate' in html
    assert 'id="weekends"' in html
    weekend_input = {
        'source': 'Adrian message screenshot reattached by coach on 2026-09-22; 6196ba8d-fb59-4704-a422-6fec024d892d.png',
        'status': 'athlete report, not an intervention outcome',
        'restaurant_meals_per_weekend_day_reported': '1–2, mainly breakfast and lunch, with parents',
        'restaurants_or_meals': ['Flanigan’s', 'burgers', 'Cuban restaurants', 'eggs', 'bacon', 'pancakes'],
        'home_meal': 'Air-fried chicken nuggets',
        'nugget_count_reported': 15,
        'nugget_count_prescribed': None,
        'nugget_brand_label': None,
        'explicit_like': 'loves chicken nuggets',
    }
    data['version'] = '1.1'
    data['sources'] = data['sources'].replace('The final image-only messages rendered as placeholders and were not used.', 'The weekend eating screenshot was reattached and read for v1.1; other previously excluded image-only messages are not incorporated by this amendment.')
    data['weekend_intake'] = weekend_input
    data['preferences']['likes'].append('chicken nuggets')
    data['preferences']['weekend_meals_reported'] = weekend_input['restaurants_or_meals']
    data['nutrition_decision']['weekend'] = 'Restaurant breakfast/lunch replace those weekday meals. When breakfast is out, move orange and the same milk-and-whey shake to afternoon. Weekend pasta boxes are home dinners, not automatic additional afternoon meals. Freeze the unused pasta box on a nugget night; add rice and green beans and use package instructions. Nugget portion awaits the label.'
    data['nutrition_decision']['copy_rule'] = 'No top navigation row. Concise second-person actions; no routine tell/send/ask Brice commentary. Retain essential safety and evidence notes.'
    data['remaining'].append('nugget brand and nutrition label before prescribing portion')
    data.setdefault('amendments', []).append({'version':'1.1','date':'2026-09-22','change':'Weekend intake added, top navigation removed, coaching side commentary shortened. Weekday quantities, supplement, food exclusions and training prescriptions unchanged.'})
    assert data['historical_results'] == old_data['historical_results']
    assert data['quarantined_result'] == old_data['quarantined_result']
    assert data['intervention_started_at'] is None
    study['version'] = VERSION
    study['intake20260922'] = data
    study['adherence'].append('Weekend intake follow-up: meals out with parents once or twice daily, mainly breakfast/lunch; home air-fryer nuggets also reported. The 15-nugget report is not a prescription.')
    study['timeline'].append({'id':'nutrition-weekend-followup','when':'Sep 22','kind':'Intake follow-up','type':'note','title':'Weekends keep their own rhythm','body':'Weekend meals out with parents remain in place. Nutrition 01 v1.1 moves the prepared weekend boxes to dinner and records chicken nuggets as a liked food. Brand, label and portion remain open. No nutrition response or training change is claimed.'})
    weekend_note = '''<div id="weekend-intake-20260922"><h3>Weekend intake follow-up</h3><p>Adrian reports eating out with his parents once or twice per weekend day, mainly breakfast and lunch. Flanigan’s, burgers, Cuban meals, eggs, bacon and pancakes are part of that routine. He also reports air-frying chicken nuggets at home and explicitly likes them.</p><p>Nutrition 01 v1.1 keeps those meals, rather than stacking the workday menu on top. The weekend pasta boxes become dinner at home. His reported 15 nuggets is recorded as a habit, not a prescribed serving; brand, package label and portion remain open.</p></div>'''
    study_html = study_html[:start] + json.dumps(study, ensure_ascii=False, indent=1) + study_html[end:]
    study_html = replace_once(study_html, '<h3>Historical results: keep the sources separate</h3>', weekend_note + '<h3>Historical results: keep the sources separate</h3>')
    protected = [k for k in old_study if k not in ['version','intake20260922','adherence','timeline']]
    for key in protected:
        assert study.get(key) == old_study[key], f'Protected study field changed: {key}'
    assert study['timeline'][:-1] == old_study['timeline']
    assert study['adherence'][:-1] == old_study['adherence']
    PLAN.write_text(html)
    STUDY.write_text(study_html)
    SOURCE.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    roadmap = ROOT / 'docs/roadmap/FORM-ROADMAP.md'
    if roadmap.exists():
        text = roadmap.read_text()
        heading = '## September 22 - Adrian nutrition: concise copy and weekend intake'
        assert heading not in text
        note = '\n'+heading+'\n\nNutrition 01 v1.1 removes the top link row and routine tell/send/ask-Brice commentary. Photo instructions are direct. Reattached weekend intake is recorded in the source JSON and study; restaurant meals replace the corresponding workday meals, and weekend prep becomes home dinner. Chicken nuggets are a confirmed like; the reported count is not prescribed. No training, race evidence or measurement result changed.\n\nSource and browser acceptance are performed before release. The production receipt and physical-device check remain separate from source status.\n\n'
        roadmap.write_text(text.replace('\n','\n'+note,1))
    test = ROOT / 'tests/adrian-nutrition-browser.py'
    if test.exists():
        text = test.read_text()
        text = replace_once(text, "        page.locator('a[href=\"#preferences\"]').click()", "        assert page.locator('nav[aria-label=\"Page sections\"]').count()==0\n        assert page.locator('#weekends').count()==1\n        page.locator('#preferences summary').click()")
        test.write_text(text)
    print('Applied Adrian v1.1: short copy, no top navigation, weekend record; training and prior evidence preserved.')


if __name__ == '__main__':
    main()
