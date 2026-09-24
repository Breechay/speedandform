"""Add labels on top of the current timing correction; preserve its clinical boundary."""
import ast, json, os
from pathlib import Path
from bs4 import BeautifulSoup
R=Path.cwd(); D=R/'plans/adrian-nutrition-phase-01'
VERSION='1.5.5'; RECORD='docs/studies/ADRIAN-NUTRITION-LABELS-20260923.json'
tree=ast.parse(Path('/tmp/adrian-labels-source.py').read_text())
record=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='record' for t in n.targets))
powder_html=next(n.args[1].value for n in ast.walk(tree) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='body' and isinstance(n.args[0],ast.Name) and n.args[0].id=='powder')
powder_html=powder_html.replace('clear lot/expiry details','clear lot number and expiry details')
def put(p,v):
    p=R/p; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(v,encoding='utf-8')
def js(v): return json.dumps(v,ensure_ascii=False,indent=2)+'\n'
def body(tag,html):
    assert tag is not None
    tag.clear(); f=BeautifulSoup(html,'html.parser')
    for child in list(f.contents): tag.append(child)
c=json.loads((D/'review-context.json').read_text())
assert c['nutrition_revision'] in ['1.5.4',VERSION], 'Concurrent revision needs reconciliation'
assert c['release_status']=='active_with_individual_timing_review'
if c['nutrition_revision']=='1.5.4':
    h=(D/'index.html').read_text().replace('v1.5.4','v'+VERSION).replace('Version 1.5.4','Version '+VERSION)
    s=BeautifulSoup(h,'html.parser')
    timing_before=s.select_one('#food-timing').get_text(' ',strip=True)
    safety_before=s.select_one('#food-safety').get_text(' ',strip=True)
    recipes_before=[a.get_text(' ',strip=True) for a in s.select('.recipe-card')]
    s.html['data-nutrition-version']=VERSION
    body(s.select_one('#powder .inside'),powder_html)
    for summary in s.select('summary'):
        if summary.get_text(' ',strip=True)=='Powder you already own':
            body(summary.find_next_sibling('p'),'Both labels are recorded. Send how much you actually use, when you started and how often. No extra shake or replacement purchase. <a href="#powder">Details</a>.')
    label=s.select_one('input[data-shop-key="whey"]').find_parent('label')
    body(label.select_one('small'),'Labels received; individual use review pending. No new tub to buy.')
    note=s.select_one('#supplement-note-20260923')
    body(note,'<strong>23 September:</strong> both supplement identities and labeled servings are now recorded. Actual amounts, frequency, start dates and individual approval remain open. <a href="/'+RECORD+'">Label and intake follow-up</a>.')
    intake='<p id="intake-note-20260923"><strong>Your food update:</strong> you reported 1,300 calories before lunch and 2,260 later in the afternoon, with dinner still to come. Lunch was rice, beans and rotisserie chicken from La Granja, and you said it was hard to finish. Send the complete day; do not force a bigger meal just to beat the number.</p>'
    s.select_one('#review .inside').append(BeautifulSoup(intake,'html.parser').p)
    refs=s.select_one('#sources')
    for fragment in ['<li><a href="https://www.designsforhealth.com/products/bone-broth-protein">Designs for Health: product description.</a> The photographed tub supplies the recorded serving and nutrition figures.</li>','<li><a href="https://www.bulksupplements.com/products/creatine-monohydrate">BulkSupplements: product identity.</a> Website dose and timing suggestions are not adopted by this plan.</li>']:
        refs.append(BeautifulSoup(fragment,'html.parser').li)
    assert s.select_one('#food-timing').get_text(' ',strip=True)==timing_before
    assert s.select_one('#food-safety').get_text(' ',strip=True)==safety_before
    assert [a.get_text(' ',strip=True) for a in s.select('.recipe-card')]==recipes_before
    put('plans/adrian-nutrition-phase-01/index.html',str(s)+'\n')
    c['nutrition_revision']=VERSION
    c['updated_date']='2026-09-23'
    c['latest_observation_record']=RECORD
    c['current_supplement_labels']={'source_record':RECORD,'status':'identity_and_label_verified_not_use_clearance','bone_broth_protein':record['bone_broth_protein'],'creatine':record['creatine']}
    c['latest_intake_report']=record['intake_report']
    c['reported_food_and_supplements_20260923']['followup_label_record']=RECORD
    c['reported_food_and_supplements_20260923']['status']='Historical initial report; current_supplement_labels holds the later label evidence.'
    c['nutrition_delivery']['supplement_status']='Designs for Health Bone Broth Protein Chocolate and BulkSupplements creatine monohydrate labels verified. Label servings 27 g and 5 g are not actual doses or recommendations. Use and timing remain for individual clinician review.'
    c['shopping']['revision']=VERSION
    c['interpretation_boundary']+=' Later intake totals are self-reported partial-day figures, not measured surplus. Label servings are not actual consumed doses or individual clearance.'
    put('plans/adrian-nutrition-phase-01/review-context.json',js(c))
else:
    assert c.get('latest_observation_record')==RECORD
put(RECORD,js(record))
hp=R/'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md'
hold=hp.read_text().replace('Current revision: 1.5.4.','Current revision: '+VERSION+'.')
section='## Label and intake follow-up'
if section not in hold:
    hold+='\n'+section+'\n\n[Photographed label record](ADRIAN-NUTRITION-LABELS-20260923.json) identifies the two owned products. Designs for Health Chocolate: 27 g powder, 110 kcal, 21 g protein. BulkSupplements creatine monohydrate: 5 g per labeled serving. Actual amounts, first use, frequency, lot verification and individual approval remain open. Do not interpret the manufacturer\'s complete-protein description as measured whey-equivalence, or call this product pure incomplete collagen. The 1,300 and 2,260 kcal figures are partial-day athlete reports; lunch was difficult to finish. Do not turn this into a new calorie target or forced feeding.\n\nRun `python tests/adrian-nutrition-labels.py` in addition to existing timing/browser tests. Native assignments and clinical details remain unchanged.\n'
put('docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md',hold)
oldtest=R/'tests/adrian-nutrition-timing.py'
put('tests/adrian-nutrition-timing.py',oldtest.read_text().replace("== '1.5.4'","== '"+VERSION+"'").replace('Current revision: 1.5.4.','Current revision: '+VERSION+'.'))
rp=R/'docs/roadmap/FORM-ROADMAP.md'; roadmap=rp.read_text()
heading='## September 23 - Adrian supplement labels and intake, v1.5.5'
if heading not in roadmap:
    run='https://github.com/Breechay/speedandform/actions/runs/'+os.environ.get('GITHUB_RUN_ID','')
    item=heading+'\n\nBoth product labels are recorded; actual dose, frequency and first-use dates remain unknown. Reported intake was 1,300 kcal before lunch and 2,260 later in the afternoon, with a large lunch difficult to finish. These are not measured surplus or a calorie target. Preserve the concurrently released individual-timing rules and keep the page available with no pre-run feeding. Source: [label/intake record](../studies/ADRIAN-NUTRITION-LABELS-20260923.json).\n\nAcceptance run: '+run+'. Label, timing and six-width browser checks gate promotion. Production must be verified separately against the tested commit. Remaining input: actual supplement use and lot verification, complete food-day record and clinician guidance. No training assignment or native sync claim.\n\n'
    first,rest=roadmap.split('\n',1);put('docs/roadmap/FORM-ROADMAP.md',first+'\n\n'+item+rest.lstrip('\n'))
test='''from pathlib import Path
import json
from bs4 import BeautifulSoup
r=Path(__file__).resolve().parents[1];d=r/'plans/adrian-nutrition-phase-01'
s=BeautifulSoup((d/'index.html').read_text(),'html.parser');c=json.loads((d/'review-context.json').read_text())
x=json.loads((r/'docs/studies/ADRIAN-NUTRITION-LABELS-20260923.json').read_text())
assert c['nutrition_revision']=='1.5.5'
assert c['release_status']=='active_with_individual_timing_review'
assert s.select_one('#food-timing') and not s.select_one('#plan-hold')
assert len(s.select('.reference > details'))==10
assert len(s.select('.recipe-card'))==3
assert len(s.select('.shop input[data-shop-key]'))==20
text=s.get_text(' ',strip=True)
for phrase in ['110 calories','21 g protein','5 g per labeled serving','not a new dose','lot number','2,260','La Granja']:
    assert phrase in text,phrase
assert x['bone_broth_protein']['per_labeled_serving']['calories_kcal']==110
assert x['bone_broth_protein']['actual_powder_g_per_use'] is None
assert x['creatine']['labeled_serving_g']==5
assert x['creatine']['actual_g_per_use'] is None
assert not x['creatine']['new_dose_prescribed']
assert x['intake_report']['daily_total_kcal'] is None
assert x['intake_report']['surplus_kcal'] is None
assert not x['intake_report']['run_completed_from_this_message']
assert c['food_timing']['before_exercise_minutes'] is None
assert c['food_timing']['after_exercise_minutes'] is None
assert c['food_timing']['clinician_guidance_reviewed'] is False
assert c['intervention_started_at'] is None
assert not c['training_app_updated']
assert chr(8212) not in text
assert s.select_one('#powder .inside').get_text().count('Designs for Health')==1
print('Label identities, serving-vs-dose boundary, intake evidence and unchanged timing status passed.')
'''
put('tests/adrian-nutrition-labels.py',test)
print('v1.5.5 labels recorded on the existing scoped timing release.')
