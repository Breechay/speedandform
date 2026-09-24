"""Current companion stays available; timing is not guessed. No private inputs."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
r = Path(__file__).resolve().parents[1]
h = (r/'plans/adrian-nutrition-phase-01/index.html').read_text()
s = BeautifulSoup(h, 'html.parser')
c = json.loads((r/'plans/adrian-nutrition-phase-01/review-context.json').read_text())
assert c['nutrition_revision'] == '1.5.7'
assert c['release_status'] == 'active_with_individual_timing_review'
assert s.html['data-nutrition-version'] == c['nutrition_revision']
assert s.select_one('#plan-hold') is None
assert s.select_one('#food-timing')
assert len(s.select('.recipe-card')) == 3
assert len(s.select('.shop input[data-shop-key]')) == 20
assert len(s.select('.rail-tabs [role="tab"]')) == 3
assert len(s.select('.reference > details')) == 10
assert not s.select('#day-work .k-food[data-at]')
assert c['food_timing']['before_exercise_minutes'] is None
assert c['food_timing']['after_exercise_minutes'] is None
assert c['food_timing']['clinician_guidance_reviewed'] is False
assert c['food_timing']['applies_to'] == ['running','lifting']
assert c['food_timing']['new_food_or_supplement_trials_authorized'] is False
assert c['intervention_started_at'] is None
assert c['training_sources']['nutrition_revision_changes_training'] is False
assert c['training_app_updated'] is False
text = s.get_text(' ', strip=True)
for phrase in ['20 to 30 minutes before your run', 'Lifting without a run:', 'Lift without a run:', 'Eat breakfast after the combined session.', 'save the box for after the run']:
    assert phrase not in text, phrase
for phrase in ['160°F', '165°F', 'within 2 hours', 'lot number', 'dark urine', 'Drink to thirst']:
    assert phrase in text, phrase
assert chr(8212) not in text
assert (r/'plans/adrian-nutrition-phase-01/adrian-prep-reminders.ics').exists()
assert '## Active Adrian nutrition delivery hold' not in (r/'AGENTS.md').read_text()
assert 'Current revision: 1.5.7.' in (r/'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md').read_text()
ids = [e['id'] for e in s.select('[id]')]
assert len(ids) == len(set(ids))
for a in s.select('a[href^="#"]'):
    assert a['href'][1:] in ids, a['href']
print(json.dumps({'timing_checks':'passed','recipe_cards':3,'shopping_keys':20,'blanket_hold':False,'clinical_interval_invented':False,'native_assignments_changed':False}, indent=2))
