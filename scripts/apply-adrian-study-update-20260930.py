"""File Adrian's approved September 30 study update without changing prescriptions.

The audio-message screenshot remains outside this public repository. Dates in this
record are filing dates unless explicitly supported by the athlete's message.
"""
from pathlib import Path
import copy
import hashlib
import json
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'labs/adrian-runner-mass/index.html'
SOURCE = ROOT / 'docs/studies/ADRIAN-ATHLETE-UPDATE-20260930.json'
VERSION = '2026.09.30.1'
RECORD_ID = 'adrian-athlete-update-20260930'
EXPECTED_BLOB = 'c69e265ecf86ecfd8197ceacf6354696ca990b20'

record = {
    'schema_version': 1,
    'record_type': 'athlete_report',
    'record_id': RECORD_ID,
    'study_id': 'FRM-001',
    'athlete': 'Adrian Gandara',
    'filed_on': '2026-09-30',
    'source': 'Athlete audio-message transcript supplied by Brice for the study update',
    'source_media_published': False,
    'message_timestamp_verified': False,
    'running': {
        'session_date': None,
        'completion_status': 'athlete_reported_completed',
        'repetitions': 12,
        'repetition_distance_m': 400,
        'prescription_source': 'Athlete account of his running coach\'s instruction; original prescription not supplied with this update',
        'prescribed_seconds_per_400_approx': 82,
        'prescribed_intensity_reported': '5K pace',
        'actual_rep_times_reported': 'mostly in the 70s',
        'last_rep_seconds_reported': 69,
        'average_rep_seconds': None,
        'individual_splits': None,
        'recovery_intervals': None,
        'total_session_distance': None,
        'effort_description': 'controlled',
        'numerical_rpe': None,
        'deviation': 'Athlete says he decided before starting that he wanted to run fast, rather than keep the prescribed pace',
        'next_day_response': None,
        'running_coach_owns_prescription': True,
        'race_equivalence_or_fitness_upgrade_claimed': False
    },
    'nutrition': {
        'period_description': 'roughly the last five days, relative to the message; exact dates not verified',
        'daily_intake_claim': 'Athlete reports going above his calorie target each day',
        'meal_frequency_reported': 'three to four times per day',
        'meal_pattern_reported': 'larger meals, not much snacking',
        'ease_quote': "It's actually gotten really easy.",
        'lowest_day_reported': {
            'date': None,
            'relative_day': 'yesterday in the message',
            'kcal_estimate_range': [3400, 3500]
        },
        'high_day_reported': {
            'date': None,
            'kcal_estimate': 5000,
            'qualification': 'nearly, possibly reached; athlete unsure'
        },
        'itemized_logs_for_this_report': None,
        'verified_multiday_average_kcal': None,
        'verified_daily_protein': None,
        'working_target_kcal_approx_unchanged': 3400,
        'new_target_created': False,
        'measured_surplus_or_hypertrophy_claimed': False
    },
    'body_monitoring': {
        'new_weight_lb': None,
        'athlete_report': 'Has not weighed recently; intends to remember a morning weigh-in',
        'morning_weigh_in_status': 'intended, not completed',
        'latest_previously_filed_weight': {'date': '2026-09-25', 'lb': 156.8, 'source': 'athlete report'},
        'weight_trend': None,
        'existing_frequency': '1-3 comparable morning weights per week'
    },
    'interpretation': {
        'supported': 'Eating above the working target feels easier to Adrian; he reports completing a faster-than-prescribed interval session',
        'not_established': ['weight gain', 'muscle gain', 'measured energy surplus', 'improved running fitness', 'a causal benefit of extra food or strength training'],
        'next_evidence': ['a comparable morning weight', 'dated itemized intake logs through the existing October 4 calibration window', 'actual 400 m splits, average and recovery intervals', 'next-day leg and training response']
    },
    'scope': {
        'public_study_update_requested_by': 'Brice',
        'run_prescription_changed': False,
        'strength_prescription_changed': False,
        'nutrition_target_or_timing_changed': False,
        'native_assignment_changed': False,
        'native_sync_claimed': False,
        'calendar_or_message_write': False
    }
}


def study_bounds(text):
    marker = text.index('const STUDY = ')
    start = text.index('{', marker)
    obj, length = json.JSONDecoder().raw_decode(text[start:])
    return start, start + length, obj


html = PAGE.read_text()
start, end, study = study_bounds(html)
assert study['id'] == 'FRM-001'
if study.get('version') == VERSION:
    assert json.loads(SOURCE.read_text()) == record
    assert study['currentRead']['date'] == '2026-09-30'
    print('PASS: September 30 update already applied; no changes.')
    raise SystemExit(0)

assert subprocess.check_output(['git', 'hash-object', str(PAGE)], cwd=ROOT, text=True).strip() == EXPECTED_BLOB, 'Study changed concurrently; review before applying'
assert study['currentRead']['date'] == '2026-09-27'
assert study['currentRead']['n'] == '06'
before = copy.deepcopy(study)
assert not any(x.get('id') == RECORD_ID for x in study['timeline'])
assert not SOURCE.exists(), 'Do not replace an existing source record'

study['version'] = VERSION
study['archive'].insert(0, copy.deepcopy(before['currentRead']))
study['currentRead'] = {
    'date': '2026-09-30',
    'n': '07',
    'body': 'Eating more is starting to feel easier. Adrian reports going above his working calorie target over roughly five days, with three to four larger meals and little snacking. He has not supplied a new weigh-in; 156.8 lb on September 25 remains the latest filed reading, not a trend.',
    'running': 'Adrian reports completing 12 × 400 m, mostly in the 70s and finishing in 69 seconds, instead of the roughly 82 seconds his running coach prescribed. He called it controlled and says he chose the faster pace before starting. Full splits, recoveries and the next-day response are still missing.',
    'next': 'Keep the existing target around 3,400 kcal/day and daily intake logging through October 4. File the planned morning weigh-in and the actual interval splits and recoveries. Read the weight pattern and training response before changing anything; this report does not establish muscle gain or a nutrition-driven performance improvement.'
}

run = {
    'id': 'adrian-12x400-report-20260930',
    'date': None,
    'recordedOn': '2026-09-30',
    'session': '12 × 400 m; faster than the reported ~82-second prescription',
    'dist': '4.8 km of repetitions',
    'pace': 'Mostly 70s; last 69 s',
    'time': 'Not filed',
    'src': 'Athlete report · filed Sep 30',
    'sourcePath': str(SOURCE.relative_to(ROOT)),
    'sessionDateVerified': False,
    'averageRepSeconds': None,
    'recoveries': None,
    'effort': 'Controlled, by athlete report',
    'note': 'Deliberately faster than prescribed; original prescription, full splits and next-day response not supplied.'
}
study['running'].insert(0, run)
study['runningNote'] = 'The entries include historical reference sessions, planned work and a new in-block athlete report. The 12 × 400 m report was filed September 30; its exact session date, full splits and recoveries are not yet verified. It is not a controlled before-and-after test or evidence that nutrition or strength work caused faster running.'

study['nutrition']['status'] = 'Nutrition 01 active · 3,400 target · intake feels easier'
study['nutrition']['why'] = 'The working target stays about 3,400 kcal/day. Adrian now reports that eating above it feels easier, but a new weight and the dated intake pattern are still needed before judging the response.'
study['nutrition']['bias'].extend([
    'September 30 update: Adrian reports going above his target over roughly five days, using three to four larger meals with little snacking.',
    'His lowest day was approximately 3,400–3,500 kcal; another was nearly, possibly 5,000 kcal. These are retrospective estimates, not new itemized daily logs.',
    'No new weigh-in is filed. Adrian intends a morning check; the latest filed reading remains 156.8 lb on September 25.'
])
study['nutrition']['notYet'].append('No verified multi-day intake average or new weight trend from the September 30 message.')
study['quotes'].append(record['nutrition']['ease_quote'])
study['timeline'].extend([
    {
        'id': RECORD_ID,
        'when': 'Sep 30, 2026 · filed',
        'kind': 'Nutrition · athlete report',
        'type': 'note',
        'title': 'Eating more feels easier',
        'body': 'Adrian reports eating above his calorie target over roughly five days, through three to four larger meals and little snacking. He estimates the lowest day at 3,400–3,500 kcal and another near, possibly at, 5,000 kcal. Exact dates and itemized logs are not supplied. No new weight is filed; a morning weigh-in is intended. The roughly 3,400 kcal working target and October 4 logging checkpoint are unchanged.'
    },
    {
        'id': 'adrian-12x400-report-20260930',
        'when': 'Sep 30, 2026 · filed',
        'kind': 'Running · athlete report',
        'type': 'note',
        'title': '12 × 400 m faster than prescribed',
        'body': 'Adrian reports completing 12 × 400 m, mostly in the 70s and closing in 69 seconds. He says his running coach prescribed approximately 82 seconds at 5K pace, but he had decided before starting to run faster. He described the effort as controlled. The exact session date, complete splits, average, recoveries and next-day response are not verified. This is a reported departure from the plan, not a new prescription or proof that extra food improved performance.'
    }
])
for item in study['queue']:
    if item == ['Body', 'Body mass — 3–4 morning readings, weekly mean']:
        item[1] = 'Body mass: 1–3 comparable morning readings per week; next weigh-in pending'
study['queue'].append(['Running', '12 × 400 m: full splits, average, recovery intervals and next-day leg response'])

allowed = {'version', 'archive', 'currentRead', 'running', 'runningNote', 'nutrition', 'quotes', 'timeline', 'queue'}
for key in before:
    if key not in allowed:
        assert study[key] == before[key], 'Protected field changed: ' + key
assert study['running'][1:] == before['running']
assert study['archive'][1:] == before['archive']
assert study['archive'][0] == before['currentRead']
assert study['timeline'][:len(before['timeline'])] == before['timeline']
assert study['quotes'][:-1] == before['quotes']
assert study['measurements'] == before['measurements']
assert study['baseline'] == before['baseline']
assert study['season'] == before['season']
assert study['strength'] == before['strength']
assert study['protocol'] == before['protocol']
html = html[:start] + json.dumps(study, ensure_ascii=False, indent=1) + html[end:]


def replace_once(old, new):
    global html
    assert html.count(old) == 1, 'Expected exactly one current-copy match: ' + old[:80]
    html = html.replace(old, new, 1)


replace_once('27 September 2026 / Nutrition calibration update', '30 September 2026 / Athlete update')
replace_once('Three intake days are now filed. The next question is what Adrian actually sustains across a full week.', 'Three dated intake logs are filed. Adrian now reports that eating above his working target feels easier; a new weight and the itemized week are still needed.')
block = '<div id="adrian-update-20260930"><h3>Eating more feels easier</h3><p>In the update filed September 30, Adrian reports eating above his calorie target for roughly five days. He is eating three to four larger meals, with little snacking. His lowest day was approximately 3,400–3,500 kcal; another was nearly, possibly 5,000 kcal. These are his estimates, not newly verified daily logs.</p><p>He has not supplied a new weigh-in and intends to check in the morning. The latest filed reading remains 156.8 lb on September 25. The working target stays about 3,400 kcal/day; the high day does not create a new target.</p><p>He also reports 12 × 400 m, mostly in the 70s and finishing in 69 seconds, instead of the roughly 82 seconds prescribed by his running coach. He called it controlled, but chose to go faster before starting. Full splits, recoveries and the next-day response are still needed. This is not proof that extra food caused faster running.</p></div>'
replace_once('<div id="intake-weekend-update">', block + '<div id="intake-weekend-update">')
html, count = re.subn(r'("dateModified"\s*:\s*")2026-09-27(")', r'\g<1>2026-09-30\2', html)
assert count == 1
assert study_bounds(html)[2] == study
assert html.count('id="adrian-update-20260930"') == 1
PAGE.write_text(html)
SOURCE.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')

roadmap = ROOT / 'docs/roadmap/FORM-ROADMAP.md'
text = roadmap.read_text()
heading = '## September 30 - Adrian intake and 400 m report'
assert heading not in text
run_id = os.environ.get('GITHUB_RUN_ID', 'local')
source_commit = os.environ.get('GITHUB_SHA', 'local')
note = f'''\n{heading}\n\nSource: [dated athlete-report record](../studies/ADRIAN-ATHLETE-UPDATE-20260930.json). The study now files easier self-reported intake across roughly five days, three to four larger meals, an estimated low day of 3,400–3,500 kcal and an uncertain high day near 5,000 kcal. No new weight is supplied. The existing ~3,400 kcal target and October 4 calibration endpoint are unchanged. A separate running entry files 12 × 400 m mostly in the 70s, last 69 seconds, against the athlete-reported ~82-second prescription. Exact session date, splits, average and recoveries remain unverified. The running coach still owns the run plan.\n\n- [x] Source, current read, timeline, running evidence, nutrition summary and collection queue updated together.\n- [x] September 27 current read archived; all earlier evidence and all training prescriptions preserved. The stale queue is aligned with the already-established 1–3 morning weights per week.\n- [ ] Acceptance checks must pass before the workflow commits the projections.\n- [ ] Production must be verified after promotion; the pull request carries the release receipt. A branch or a green test is not a live-site claim.\n- [ ] Collect a comparable morning weight, dated intake logs, actual splits/recoveries and the next-day response.\n\nAcceptance run: https://github.com/Breechay/speedandform/actions/runs/{run_id}. Tested source commit: {source_commit}. No FORM/Forge assignment, supplement/timing guidance, calorie target, calendar or message is changed.\n\n'''
text = text.replace('\n', '\n' + note, 1)
roadmap.write_text(text)
print('PASS: September 30 report filed; history, measurements, prescriptions and missing-value semantics preserved.')
