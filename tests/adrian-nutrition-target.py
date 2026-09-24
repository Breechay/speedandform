from pathlib import Path
import json
from bs4 import BeautifulSoup
r=Path(__file__).resolve().parents[1]
c=json.loads((r/'plans/adrian-nutrition-phase-01/review-context.json').read_text())
d=json.loads((r/'docs/studies/ADRIAN-NUTRITION-DECISION-20260924.json').read_text())
x=json.loads((r/'docs/studies/ADRIAN-NUTRITION-DAYLOG-20260923.json').read_text())
s=BeautifulSoup((r/'plans/adrian-nutrition-phase-01/index.html').read_text(),'html.parser')
assert c['nutrition_revision']=='1.5.7'
assert c['working_energy_target']['kcal_per_day']==3000
assert c['working_energy_target']['precision']=='approximate'
assert c['working_energy_target']['do_not_force_exact_number'] is True
assert c['working_energy_target']['not_measured_maintenance_or_surplus'] is True
assert d['decision']['working_energy_target_kcal_per_day']==3000
assert d['evidence_context']['completed_day_reported_kcal']==3271
assert x['total_kcal_reported']==3271
assert s.select_one('#working-target-20260924')
txt=s.select_one('#working-target-20260924').get_text(' ',strip=True)
assert '3,000' in txt and 'Close is enough' in txt and '3,271' in txt
assert c['food_timing']['new_pre_run_snack_prescribed'] is False
assert c['food_timing']['before_exercise_minutes'] is None
assert c['food_timing']['after_exercise_minutes'] is None
assert c['training_app_updated'] is False
assert d['boundaries']['new_pre_run_food_prescription'] is False
assert d['boundaries']['new_supplement_dose'] is False
assert d['boundaries']['training_assignment_changed'] is False
print('Working ~3000 kcal target passed; 3271 remains observation; timing and training unchanged.')
