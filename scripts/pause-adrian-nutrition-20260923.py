"""Withdraw a nutrition delivery surface. Never publish the private reason."""
import json
from pathlib import Path
from bs4 import BeautifulSoup

root = Path.cwd()
d = root / 'plans/adrian-nutrition-phase-01'
hp = d / 'index.html'
cp = d / 'review-context.json'
status = 'paused_pending_clinician_review'
context = json.loads(cp.read_text())
if context.get('release_status') == status:
    print('Hold already applied; no changes.')
    raise SystemExit(0)
assert context.get('nutrition_revision') == '1.5.1', 'Review a newer nutrition revision before applying this hold.'
s = BeautifulSoup(hp.read_text(), 'html.parser')
assert s.select_one('#powder') and s.select_one('#your-day'), 'Expected nutrition surface missing.'
# Preserve useful historical fragment URLs, but not their old instructions.
anchors = sorted({a['href'][1:] for a in s.select('a[href^="#"]') if a['href'][1:]} | {'your-day', 'recipes', 'start', 'review', 'preferences', 'scope', 'supplement-note-20260923'})
for tag in s.head.select('meta[property^="og:image"],meta[name^="twitter:image"],script[type="application/ld+json"]'):
    tag.decompose()
for name in ['description', 'twitter:description']:
    tag = s.head.find('meta', attrs={'name': name})
    if tag:
        tag['content'] = 'This nutrition page is paused. Check with Brice before using earlier instructions.'
for prop in ['og:description']:
    tag = s.head.find('meta', attrs={'property': prop})
    if tag:
        tag['content'] = 'This nutrition page is paused. Check with Brice before using earlier instructions.'
for name in ['twitter:title']:
    tag = s.head.find('meta', attrs={'name': name})
    if tag:
        tag['content'] = 'Fuel Your Work · Plan paused · FORM'
for prop in ['og:title']:
    tag = s.head.find('meta', attrs={'property': prop})
    if tag:
        tag['content'] = 'Fuel Your Work · Plan paused · FORM'
tag = s.head.find('meta', attrs={'name': 'twitter:card'})
if tag:
    tag['content'] = 'summary'
s.title.string = 'Fuel Your Work · Plan paused · FORM'
s.html['data-nutrition-status'] = status
s.html['data-nutrition-version'] = '1.5.2'
s.body.clear()
body = '''<main class="page">
<header class="masthead"><a class="brand" href="/" aria-label="FORM">FORM<i aria-hidden="true"></i></a><div class="stamp">Adrian · Nutrition 01<br>23 September 2026 · v1.5.2</div></header>
<div class="hero"><p class="label">Plan paused</p><h1>Fuel Your Work</h1><p class="intro">Check in before your next session.</p></div>
<section class="panel" id="plan-hold" aria-labelledby="hold-title"><h2 id="hold-title">Your earlier instructions are on hold.</h2><p>The meal timings, recipes, snacks and supplement instructions on this page are paused pending clinician review. Do not follow the previous version around training.</p><p><strong>Before your next run or lift:</strong> contact Brice to confirm your treating clinician's exercise, food and emergency instructions.</p><p>Do not test a food, supplement or fasting interval as a workaround.</p><p class="pills"><a class="pill" href="sms:?&amp;body=Can%20we%20confirm%20the%20paused%20plan%20before%20my%20next%20session%3F">Text Brice</a></p></section>
<section class="block"><h2>Keep care and food connected.</h2><p>This pause is not an instruction to stop eating. Ask your clinician how to keep eating adequately while the plan is reviewed.</p><p>Brice will revise the routine around your clinician's guidance.</p></section>
<section class="block"><h2>Check your saved instructions.</h2><p>Already imported the meal-prep reminders? Turn those reminders off for now. Updating this page cannot remove events already saved on your phone.</p><p>Your training app may still show earlier assignments. Confirm with Brice and your running coach before following them; this website update does not change the app.</p></section>
<footer class="footer"><span>FORM / Nutrition companion</span><span>Paused · v1.5.2</span></footer>
</main>'''
new = BeautifulSoup(body, 'html.parser')
for name in anchors:
    if name != 'plan-hold':
        a = new.new_tag('span', id=name)
        a['aria-hidden'] = 'true'
        new.select_one('#plan-hold').insert(0, a)
s.body.append(new.main)
hp.write_text(str(s) + '\n')

# The current machine-readable surface must not continue serving active doses or timings.
# Earlier observations and authored content remain immutable in Git history.
old_ref = '61b6f8d36f0f8f883c62a38179e3a59ec1adfa31'
minimal = {
    'schema_version': 1,
    'nutrition_revision': '1.5.2',
    'updated_date': '2026-09-23',
    'athlete': context['athlete'],
    'study_id': context['study_id'],
    'nutrition_url': context['nutrition_url'],
    'study_url': context['study_url'],
    'release_status': status,
    'active_prescription': None,
    'intervention_started_at': context.get('intervention_started_at'),
    'nutrition_delivery': {'status': status, 'instructions': [], 'new_food_or_supplement_trials_authorized': False, 'fasting_workaround_authorized': False},
    'shopping': {'status': 'paused', 'new_purchases_prescribed': False, 'browser_storage_untouched': True},
    'training_sources': context['training_sources'],
    'training_app_updated': False,
    'prior_assignments_are_clearance': False,
    'calendar': {'new_downloads_enabled': False, 'existing_imports_revoked': False, 'athlete_action': 'Turn off previously imported meal-prep reminders.'},
    'resume_requirements': ['Individualized treating-clinician guidance reviewed with the coach.', 'Food, supplement and exercise instructions reconciled with that guidance.', 'Explicit coach-authorized replacement release; no automatic restoration from older archives.'],
    'historical_reference': {'ref': old_ref, 'path': 'plans/adrian-nutrition-phase-01/review-context.json', 'role': 'Historical evidence only, not current instructions or exercise clearance.'},
    'privacy_boundary': 'The reason for the hold and any personal medical details belong in private care records. Do not add screenshots, diagnosis claims, emergency-visit history or clinical documents to this public repository or web page.',
    'evidence_boundary': 'This is a withdrawal of web nutrition instructions, not a diagnosis, new food restriction, medical clearance, completed-session update or rewrite of a training prescription.'
}
cp.write_text(json.dumps(minimal, indent=2, ensure_ascii=False) + '\n')
(d / 'adrian-prep-reminders.ics').unlink(missing_ok=True)

# A discoverable release guard keeps future agents from restoring the old food instructions.
doc = root / 'docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md'
doc.write_text('''# Adrian nutrition delivery hold · 23 September 2026

Status: paused_pending_clinician_review. Revision: 1.5.2.

The athlete-facing nutrition HTML and current review-context JSON withdraw earlier prescriptions. The old reminder download is removed. Prior content remains in version history, not an active recommendation.

Do not restore this page from an earlier ZIP, generator, deployment or snapshot merely to pass legacy active-plan tests. Run tests/adrian-nutrition-hold.py for the paused state. The existing v1.5 entry point routes to that test while the hold is active.

Resume only after individualized treating-clinician guidance is reviewed, the relevant food/supplement/exercise instructions are reconciled, and Brice explicitly authorizes a replacement release. Do not invent a substitute menu, supplement dose, safe interval or food/exercise experiment.

This commit does not change canonical FORM/Forge assignments, contact the athlete, notify another coach, or revoke imported phone reminders. Brice must communicate the hold directly. Prior assignment visibility is not exercise clearance.

Privacy: the underlying medical details, screenshots and clinical documents must remain outside this public repository and public study. A noindex tag or collapsed section is not privacy protection.

Release: verify the held page and review JSON on the production URL after promotion. Preserve concurrent site work. Do not claim deployment before verification.
''')
agent = root / 'AGENTS.md'
a = agent.read_text()
a += '\n## Active Adrian nutrition delivery hold\nBefore editing or regenerating Adrian nutrition, read [the current release hold](docs/studies/ADRIAN-NUTRITION-HOLD-20260923.md). Do not restore historical food or supplement instructions without the documented resume gate. Private clinical details must not be published.\n'
agent.write_text(a)
road = root / 'docs/roadmap/FORM-ROADMAP.md'
r = road.read_text()
r += '\n\n### 23 September 2026 · Adrian nutrition delivery hold\n- Nutrition companion v1.5.2: previous instructions withdrawn pending clinician review. See [release hold](../studies/ADRIAN-NUTRITION-HOLD-20260923.md). No private medical details published. Training app and imported reminders are not changed by this release.\n- Gate: explicit coach-authorized replacement after individualized guidance. Use `python tests/adrian-nutrition-hold.py`; verify production before calling this live.\n'
road.write_text(r)
legacy = root / 'tests/adrian-nutrition-v15.py'
t = legacy.read_text()
prefix = '''# A held page must pass withdrawal checks, not be restored for active-plan tests.
import json as _hold_json, runpy as _hold_runpy
from pathlib import Path as _HoldPath
_hold_root = _HoldPath(__file__).resolve().parents[1]
if _hold_json.loads((_hold_root/'plans/adrian-nutrition-phase-01/review-context.json').read_text()).get('release_status') == 'paused_pending_clinician_review':
    _hold_runpy.run_path(str(_hold_root/'tests/adrian-nutrition-hold.py'), run_name='__main__')
    raise SystemExit(0)

'''
legacy.write_text(prefix + t)
print('Nutrition delivery withdrawn. No private reason published. Native assignments and phone reminders not modified.')
