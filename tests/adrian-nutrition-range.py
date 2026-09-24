from pathlib import Path
import json
from bs4 import BeautifulSoup
r=Path(__file__).resolve().parents[1]
c=json.loads((r/'plans/adrian-nutrition-phase-01/review-context.json').read_text())
d=json.loads((r/'docs/studies/ADRIAN-NUTRITION-DECISION-20260924.json').read_text())
s=BeautifulSoup((r/'plans/adrian-nutrition-phase-01/index.html').read_text(),'html.parser')
assert c['nutrition_revision']=='1.5.8'
w=c['working_energy_target']
assert w['kcal_per_day']==3000
assert w['current_starting_target_kcal_per_day']==3000
assert w['development_range_kcal_per_day']==[3000,3400]
assert w['development_range_status']=='possible_phase_range_not_current_prescription'
assert w['upward_adjustment_step_kcal_per_day']==[150,250]
assert w['review_window_days']==[10,14]
assert d['decision']['possible_development_range_kcal_per_day']==[3000,3400]
assert d['decision']['current_target_remains_kcal_per_day']==3000
text=s.select_one('#development-range-20260924').get_text(' ',strip=True)
assert '3,000 to 3,400' in text
assert 'not a reason to jump to 3,400 now' in text
assert '150 to 250' in text
assert c['food_timing']['new_pre_run_snack_prescribed'] is False
assert c['food_timing']['before_exercise_minutes'] is None
assert c['food_timing']['after_exercise_minutes'] is None
assert c['training_app_updated'] is False
print('Development range visible; 3000 remains current target; timing/training unchanged.')
