"""Add Brice's working ~3,000 kcal/day target without changing exercise timing."""
from pathlib import Path
import json, re, os
from bs4 import BeautifulSoup

root=Path.cwd()
d=root/'plans/adrian-nutrition-phase-01'
cp=d/'review-context.json'
c=json.loads(cp.read_text())
if c.get('nutrition_revision')=='1.5.7':
    print('Working target already applied.')
    raise SystemExit(0)
assert c['nutrition_revision']=='1.5.6'
assert c['release_status']=='active_with_individual_timing_review'
old_food_timing=json.dumps(c['food_timing'],sort_keys=True)
old_training=json.dumps(c['training_sources'],sort_keys=True)
old_supp=json.dumps(c['current_supplement_labels'],sort_keys=True)

decision_path=root/'docs/studies/ADRIAN-NUTRITION-DECISION-20260924.json'
assert not decision_path.exists()
decision={
  "schema_version":1,
  "record_type":"coach_nutrition_decision",
  "decision_id":"adrian-working-energy-target-20260924",
  "recorded_on":"2026-09-24",
  "athlete":"Adrian Gandara",
  "study_id":"FRM-001",
  "decision":{
    "working_energy_target_kcal_per_day":3000,
    "precision":"approximate",
    "phase":"current nutrition / runner-mass development phase",
    "owner":"Brice / coach",
    "instruction":"Aim around 3,000 kcal per day. Close is enough; do not force a meal solely to hit an exact number.",
    "exercise_timing_boundary":"This target does not add food before runs, between sessions, or automatically immediately after exercise. Existing individualized food/exercise timing guidance remains unchanged.",
    "review_inputs":["weekly morning-weight trend","baseline and repeat body measurements","appetite and meal comfort","digestion","running and lifting response"],
    "automatic_adjustment":False
  },
  "evidence_context":{
    "completed_day_record":"docs/studies/ADRIAN-NUTRITION-DAYLOG-20260923.json",
    "completed_day_reported_kcal":3271,
    "relationship":"The 3,271 kcal day is an observation, not the target. The ~3,000 kcal target is a subsequent coach decision.",
    "measured_maintenance_kcal":None,
    "measured_surplus_kcal":None
  },
  "boundaries":{
    "new_pre_run_food_prescription":False,
    "new_supplement_dose":False,
    "training_assignment_changed":False,
    "medical_clearance_claimed":False,
    "target_is_measured_energy_requirement":False
  }
}
decision_path.write_text(json.dumps(decision,indent=2)+"\n")

c['nutrition_revision']='1.5.7'
c['shopping']['revision']='1.5.7'
c['working_energy_target']={
  "source_record":"docs/studies/ADRIAN-NUTRITION-DECISION-20260924.json",
  "kcal_per_day":3000,
  "precision":"approximate",
  "owner":"coach decision",
  "status":"active_working_target",
  "not_measured_maintenance_or_surplus":True,
  "do_not_force_exact_number":True,
  "review_before_change":["weekly morning-weight trend","body measurements","appetite and meal comfort","digestion","running and lifting response"],
  "food_timing_rule_unchanged":True
}
c['latest_coach_decision_record']="docs/studies/ADRIAN-NUTRITION-DECISION-20260924.json"
c['latest_intake_report']['coaching_response']="Food day received. Working target for this phase is about 3,000 kcal/day, not 3,271. Close is enough; do not force an exact number. Preserve the existing food/exercise timing boundary and review measurements, appetite and training response before changing the target."
c['interpretation_boundary'] += " The active working energy target is approximately 3,000 kcal/day by coach decision, not a measured maintenance requirement or inferred surplus. The 3,271 kcal completed day remains an observation, not the target."
assert json.dumps(c['food_timing'],sort_keys=True)==old_food_timing
assert json.dumps(c['training_sources'],sort_keys=True)==old_training
assert json.dumps(c['current_supplement_labels'],sort_keys=True)==old_supp
cp.write_text(json.dumps(c,indent=2)+"\n")

p=d/'index.html'
h=p.read_text()
assert 'data-nutrition-version="1.5.6"' in h
h=h.replace('data-nutrition-version="1.5.6"','data-nutrition-version="1.5.7"',1)
h=h.replace('23 September 2026 · v1.5.6','24 September 2026 · v1.5.7',1)
h=h.replace('<strong>Version 1.5.6</strong>, 23 September 2026.','<strong>Version 1.5.7</strong>, 24 September 2026.',1)
h=h.replace('Adrian only · Nutrition 01 · v1.5.6','Adrian only · Nutrition 01 · v1.5.7',1)
needle='<p id="intake-note-20260923"><strong>Your completed food log:</strong> 3,271 calories estimated. This completes your earlier 1,300 and 2,260 updates, not extra meals. Your La Granja lunch included plantains; your mom made spaghetti with meat sauce. You marked dinner\'s 600 calories as a guess. This is one logged day, not a daily target. Tell Brice which meals felt too large.</p>'
assert h.count(needle)==1
addition=needle+'\n<p id="working-target-20260924"><strong>Working target for this phase: about 3,000 calories a day.</strong> Close is enough. Do not force a meal just to hit an exact number. Your 3,271-calorie log is one day of evidence, not the target. Food timing around training stays under the existing timing rule above.</p>'
h=h.replace(needle,addition)
scope='<p id="energy-target-source"><strong>24 September:</strong> working intake target set to about 3,000 calories/day for this phase. It is a coaching target to review against weight trend, measurements, appetite and training response, not a measured maintenance or surplus value. <a href="/docs/studies/ADRIAN-NUTRITION-DECISION-20260924.json">Decision record</a>.</p>\n'
assert h.count('<ol id="sources">')==1
h=h.replace('<ol id="sources">',scope+'<ol id="sources">')
p.write_text(h.rstrip()+"\n")

scope_path=root/'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md'
t=scope_path.read_text().replace('Current revision: 1.5.6.','Current revision: 1.5.7.')
t += '\n## Working intake target · 24 September\n\n[Coach decision](ADRIAN-NUTRITION-DECISION-20260924.json): approximately 3,000 kcal/day for the current phase. The 3,271 kcal completed day remains an observation, not the target. Do not force an exact number or use the target to reintroduce pre-run food. Review weight trend, measurements, appetite, digestion and training response before changing it. No supplement dose, native assignment or exercise-timing rule changed.\n'
scope_path.write_text(t)

road=root/'docs/roadmap/FORM-ROADMAP.md'
rt=road.read_text()
first,rest=rt.split('\n',1)
note='\n## September 24 - Adrian working intake target, v1.5.7\n\nCoach decision: aim around **3,000 kcal/day** in the current runner-mass nutrition phase. This is intentionally approximate; 3,271 from the completed log is evidence, not the target, and Adrian is not asked to force-feed to an exact number. Review weight trend, measurements, appetite, digestion and training response before adjustment. Existing no-pre-run-food / individualized timing boundary remains unchanged. Decision: [energy target record](../studies/ADRIAN-NUTRITION-DECISION-20260924.json).\n\nAcceptance run: https://github.com/Breechay/speedandform/actions/runs/'+os.environ.get('GITHUB_RUN_ID','not-recorded')+'. Production verification follows promotion.\n'
road.write_text(first+'\n'+note+rest)

for name in ['adrian-nutrition-foodday.py','adrian-nutrition-labels.py','adrian-nutrition-timing.py']:
    q=root/'tests'/name
    txt=q.read_text()
    assert '1.5.6' in txt
    q.write_text(txt.replace('1.5.6','1.5.7'))

print('Applied ~3000 kcal/day working target; exercise timing and supplement boundaries unchanged.')
