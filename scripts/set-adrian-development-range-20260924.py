"""Add an athlete-facing development range while keeping ~3,000 as the current target."""
from pathlib import Path
import json, os

root=Path.cwd()
d=root/'plans/adrian-nutrition-phase-01'
cp=d/'review-context.json'
c=json.loads(cp.read_text())
if c.get('nutrition_revision')=='1.5.8':
    print('Development range already applied.')
    raise SystemExit(0)
assert c['nutrition_revision']=='1.5.7'
assert c['working_energy_target']['kcal_per_day']==3000
old_food=json.dumps(c['food_timing'],sort_keys=True)
old_training=json.dumps(c['training_sources'],sort_keys=True)
old_supp=json.dumps(c['current_supplement_labels'],sort_keys=True)

c['nutrition_revision']='1.5.8'
c['shopping']['revision']='1.5.8'
c['working_energy_target']['development_range_kcal_per_day']=[3000,3400]
c['working_energy_target']['development_range_status']='possible_phase_range_not_current_prescription'
c['working_energy_target']['current_starting_target_kcal_per_day']=3000
c['working_energy_target']['upward_adjustment_step_kcal_per_day']=[150,250]
c['working_energy_target']['review_window_days']=[10,14]
c['working_energy_target']['move_up_only_if']=[
  'intake is reasonably consistent near the current target',
  'weekly-average weight and desired body measurements are not moving enough',
  'appetite and meal comfort can support more intake',
  'running and lifting response remain acceptable'
]
c['working_energy_target']['range_explanation']='Start near 3,000 kcal/day. The likely development range may extend toward 3,400 kcal/day if measured response shows Adrian needs more energy for running plus hypertrophy. Do not jump to the top automatically.'
c['latest_intake_report']['coaching_response']='Food day received. Start near 3,000 kcal/day. The possible development range is about 3,000-3,400 kcal/day, but 3,400 is not the current target. Review 10-14 days of weight trend, measurements, appetite and training response before moving upward, usually by about 150-250 kcal/day.'
c['interpretation_boundary'] += ' The athlete-facing development range is approximately 3,000-3,400 kcal/day as a possible phase range, not a directive to eat 3,400 now. Current target remains ~3,000 and upward changes require response data.'
assert json.dumps(c['food_timing'],sort_keys=True)==old_food
assert json.dumps(c['training_sources'],sort_keys=True)==old_training
assert json.dumps(c['current_supplement_labels'],sort_keys=True)==old_supp
cp.write_text(json.dumps(c,indent=2)+"\n")

decision=root/'docs/studies/ADRIAN-NUTRITION-DECISION-20260924.json'
x=json.loads(decision.read_text())
x['decision']['possible_development_range_kcal_per_day']=[3000,3400]
x['decision']['current_target_remains_kcal_per_day']=3000
x['decision']['range_status']='possible phase range, not current upper prescription'
x['decision']['review_window_days']=[10,14]
x['decision']['typical_upward_step_kcal_per_day']=[150,250]
x['decision']['range_instruction']='Start around 3,000. If response is too flat after a consistent 10-14 day read and meal comfort/training remain good, increase gradually rather than jumping straight to 3,400.'
x['evidence_context']['range_rationale']='Higher intake may be needed because the phase combines substantial running with hypertrophy goals, but Adrian-specific need is determined from response rather than assumed from activity alone.'
decision.write_text(json.dumps(x,indent=2)+"\n")

p=d/'index.html'
h=p.read_text()
assert 'data-nutrition-version="1.5.7"' in h
h=h.replace('data-nutrition-version="1.5.7"','data-nutrition-version="1.5.8"',1)
h=h.replace('24 September 2026 · v1.5.7','24 September 2026 · v1.5.8',1)
h=h.replace('<strong>Version 1.5.7</strong>, 24 September 2026.','<strong>Version 1.5.8</strong>, 24 September 2026.',1)
h=h.replace('Adrian only · Nutrition 01 · v1.5.7','Adrian only · Nutrition 01 · v1.5.8',1)
old='<p id="working-target-20260924"><strong>Working target for this phase: about 3,000 calories a day.</strong> Close is enough. Do not force a meal just to hit an exact number. Your 3,271-calorie log is one day of evidence, not the target. Food timing around training stays under the existing timing rule above.</p>'
assert h.count(old)==1
new='<p id="working-target-20260924"><strong>Start here: about 3,000 calories a day.</strong> Close is enough. Do not force a meal just to hit an exact number. Your 3,271-calorie log is one day of evidence, not the target. Food timing around training stays under the existing timing rule above.</p>\n<p id="development-range-20260924"><strong>Where this phase may go: about 3,000 to 3,400 calories a day.</strong> That is the development range we may use, not a reason to jump to 3,400 now. We start near 3,000, watch your weight trend, measurements, appetite, running and lifting for about two weeks, then add roughly 150 to 250 calories if you need more.</p>'
h=h.replace(old,new)
p.write_text(h.rstrip()+"\n")

scope=root/'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md'
t=scope.read_text().replace('Current revision: 1.5.7.','Current revision: 1.5.8.')
t += '\n## Development range · 24 September\n\nCurrent target remains approximately 3,000 kcal/day. Athlete-facing possible phase range is approximately 3,000-3,400 kcal/day, reflecting the possibility that substantial running plus hypertrophy work requires more intake. The upper end is not automatically prescribed. Review 10-14 days of consistent intake, weekly-average weight, body measurements, appetite/meal comfort and training response; if response is too flat and tolerance is good, adjust gradually by roughly 150-250 kcal/day. Existing no-pre-run-food and exercise-timing boundaries remain unchanged.\n'
scope.write_text(t)

road=root/'docs/roadmap/FORM-ROADMAP.md'
rt=road.read_text(); first,rest=rt.split('\n',1)
note='\n## September 24 - Adrian nutrition development range, v1.5.8\n\nAthlete-facing framing now shows the arc: **start ~3,000 kcal/day; possible development range ~3,000-3,400 kcal/day**. The upper end is not the current prescription. Review 10-14 days of weight trend, measurements, appetite/meal comfort and running/lifting response before increasing; typical step 150-250 kcal/day. This is meant to normalize that more intake may be required for a high-activity runner trying to add mass without turning 3,400 into a mandatory number. Pre-run food boundary, supplements and training assignments are unchanged.\n\nAcceptance run: https://github.com/Breechay/speedandform/actions/runs/'+os.environ.get('GITHUB_RUN_ID','not-recorded')+'. Production verification follows promotion.\n'
road.write_text(first+'\n'+note+rest)

for name in ['adrian-nutrition-target.py','adrian-nutrition-foodday.py','adrian-nutrition-labels.py','adrian-nutrition-timing.py']:
    q=root/'tests'/name
    txt=q.read_text()
    assert '1.5.7' in txt
    q.write_text(txt.replace('1.5.7','1.5.8'))

print('Added possible 3000-3400 development range; current target remains ~3000.')
