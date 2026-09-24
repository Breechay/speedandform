from pathlib import Path
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
