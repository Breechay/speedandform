"""Acceptance for completed reported intake, not estimated physiology."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
r=Path(__file__).resolve().parents[1]
c=json.loads((r/'plans/adrian-nutrition-phase-01/review-context.json').read_text())
x=json.loads((r/'docs/studies/ADRIAN-NUTRITION-DAYLOG-20260923.json').read_text())
s=BeautifulSoup((r/'plans/adrian-nutrition-phase-01/index.html').read_text(),'html.parser')
assert c['nutrition_revision']=='1.5.6'
assert c['release_status']=='active_with_individual_timing_review'
assert s.html['data-nutrition-version']==c['nutrition_revision']
assert len(x['items'])==12
v=[row['calories_kcal_reported'] for row in x['items']]
assert sum(v)==x['total_kcal_reported']==x['sum_of_listed_kcal']==3271
assert sum(v[:6])==1300 and sum(v[:7])==2260 and sum(v[7:])==1011
assert x['items'][10]['estimate_status']=='explicit complete guess by athlete'
assert x['preference_followup']['chobani']['explicitly_liked'] is None
assert x['preference_followup']['chobani']['greek_yogurt_exclusion_reversed'] is False
assert x['unknowns']['daily_protein_g'] is None
assert x['unknowns']['energy_surplus_kcal'] is None
assert x['unknowns']['supplement_use_on_this_day'] is None
assert all(row['time_consumed'] is None for row in x['items'])
assert not x['meal_context']['self_prepared_first_batch_confirmed']
assert c['latest_intake_report']['daily_total_kcal_reported']==3271
assert c['previous_intake_reports'][-1]['daily_total_kcal'] is None
assert c['food_timing']['new_pre_run_snack_prescribed'] is False
assert c['training_app_updated'] is False
assert s.select_one('#plan-hold') is None
assert '3,271' in s.select_one('#intake-note-20260923').get_text()
assert 'not a daily target' in s.select_one('#intake-note-20260923').get_text()
assert s.select_one('#chobani-note-20260923')
assert s.select_one('#baseline-note-20260923')
assert 'Greek yogurt.' in s.select_one('#preferences').get_text()
assert 'Cottage cheese.' in s.select_one('#preferences').get_text()
print('12 items, 3271 reported kcal, subtotals, uncertainty, preferences and live timing boundary passed.')
