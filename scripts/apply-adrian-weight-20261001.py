"""Append the owner-supplied weight report; preserve dates, history and prescriptions."""
from pathlib import Path
import copy
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'labs/adrian-runner-mass/index.html'
SOURCE_PATH = 'docs/studies/ADRIAN-WEIGHT-UPDATE-20261001.json'
SOURCE = ROOT / SOURCE_PATH
VERSION = '2026.10.01.1'
RECORD_ID = 'adrian-weight-update-20261001'
EXPECTED_BLOB = 'd396c6e06e555429853a518cd16fc4e331d3e413'
record = {
    'schema_version': 1,
    'record_type': 'athlete_weight_report_and_coach_followup',
    'record_id': RECORD_ID,
    'study_id': 'FRM-001',
    'athlete': 'Adrian Gandara',
    'filed_on': '2026-10-01',
    'source': {
        'type': 'owner_supplied_message_screenshot',
        'screenshot_published': False,
        'athlete_quote': '160LBS STARTING WEIGHT',
        'displayed_message_time': 'Today 8:21 AM',
        'report_date_context': 'Filed October 1 in America/New_York; Today is relative to the supplied screenshot, not an independently verified measurement date.'
    },
    'weight': {
        'value_lb': 160,
        'precision': 'whole pounds as reported',
        'status': 'athlete report',
        'measurement_date': None,
        'measurement_time': None,
        'conditions': None,
        'standardized': False,
        'athlete_label': 'starting weight',
        'label_meaning_confirmed': False,
        'replaces_earlier_baseline': False,
        'pre_intervention_baseline': False
    },
    'comparison': {
        'previous_source': 'docs/studies/ADRIAN-INTAKE-UPDATE-20260925.json',
        'previous_report_date': '2026-09-25',
        'previous_value_lb': 156.8,
        'difference_between_reported_values_lb': 3.2,
        'comparable_conditions_confirmed': False,
        'weight_gain_rate': None,
        'muscle_gain': None,
        'note': 'A difference between two reported values, not a confirmed rate of weight gain or a body-composition result.'
    },
    'coach_followup': {
        'quote': 'Let’s grab some tape measurements again this week too',
        'action': 'Repeat tape measurements this week',
        'status': 'requested, not completed',
        'new_circumference_values': None,
        'reference_source': 'docs/studies/ADRIAN-MEASUREMENTS-20260924.json',
        'existing_method': 'Compare waist, chest, relaxed arm, relaxed thigh and calf with the same tape locations and conditions; confirm the previously undocumented side and landmarks.'
    },
    'monitoring_unchanged': {
        'working_target_kcal_approx': 3400,
        'daily_intake_logging_through': '2026-10-04',
        'comparable_morning_weights_per_week': [1, 3]
    },
    'scope': {
        'public_study_projection_only': True,
        'historical_records_preserved': True,
        'training_or_nutrition_prescription_changed': False,
        'native_assignment_or_sync_changed': False,
        'private_console_updated': False,
        'calendar_or_message_sent': False
    }
}

def parse_study(text):
    start = text.index('{', text.index('const STUDY = '))
    obj, length = json.JSONDecoder().raw_decode(text[start:])
    return start, start + length, obj

raw = PAGE.read_bytes()
html = raw.decode('utf-8')
start, end, study = parse_study(html)
assert study['id'] == 'FRM-001'
if study['version'] == VERSION:
    assert json.loads(SOURCE.read_text()) == record
    assert study['currentRead']['n'] == '08'
    assert study['bodyMassReport']['valueLb'] == 160
    assert html.count('id="body-mass-report"') == 1
    print('PASS: October 1 weight report already applied; unchanged.')
    raise SystemExit(0)
assert hashlib.sha1(f'blob {len(raw)}\0'.encode() + raw).hexdigest() == EXPECTED_BLOB, 'Study changed concurrently; reconcile before applying.'
assert not SOURCE.exists(), 'Do not overwrite a filed report.'
assert study['version'] == '2026.09.30.1'
assert study['currentRead']['date'] == '2026-09-30'
assert 'bodyMassReport' not in study
before = copy.deepcopy(study)
study['version'] = VERSION
study['bodyMassReport'] = {
    'recordId': RECORD_ID, 'sourcePath': SOURCE_PATH, 'filedOn': '2026-10-01',
    'valueLb': 160, 'athleteQuote': '160LBS STARTING WEIGHT',
    'measurementDate': None, 'standardized': False, 'baselineReplacement': False,
    'previousValueLb': 156.8, 'previousDate': '2026-09-25', 'differenceLb': 3.2,
    'note': 'Adrian calls this “starting weight.” It is kept as a new report, not a replacement for the earlier baseline. The measurement date and conditions still need confirmation.',
    'comparison': 'The reported number is 3.2 lb above the September 25 reading. That difference alone does not establish a weight trend or muscle gain.',
    'next': 'Brice asked for repeat tape measurements this week. No new circumference values have been supplied.'
}
study['archive'].insert(0, copy.deepcopy(before['currentRead']))
study['currentRead'] = {
    'date': '2026-10-01', 'n': '08',
    'body': 'Adrian reports 160 lb, calling it “starting weight.” The earlier 156 lb report and 156.8 lb September 25 reading are preserved. This is a new weight report, not a replacement baseline or evidence of muscle gained.',
    'running': before['currentRead']['running'],
    'next': 'Repeat tape measurements this week, as Brice requested. Compare with the September 24 checkpoint using the same method. Confirm when and how the 160 lb reading was taken. Keep the existing ~3,400 kcal target and intake logging through October 4; running splits, recoveries and next-day response are still needed.'
}
study['nutrition']['why'] = 'The working target stays about 3,400 kcal/day. Adrian reports that eating more feels easier and has now supplied a 160 lb weight report. Comparable weights, repeat tape measurements and training response are still needed to judge progress.'
old_bias = 'No new weigh-in is filed. Adrian intends a morning check; the latest filed reading remains 156.8 lb on September 25.'
assert study['nutrition']['bias'].count(old_bias) == 1
study['nutrition']['bias'][study['nutrition']['bias'].index(old_bias)] = 'October 1 filing: Adrian reports 160 lb, described as “starting weight.” The 156.8 lb September 25 reading remains in the record. Measurement conditions and a comparable trend are not confirmed.'
study['timeline'].append({
    'id': RECORD_ID, 'when': 'Oct 1, 2026 · filed', 'kind': 'Body · athlete report', 'type': 'note',
    'title': '160 lb reported. Tape measurements requested.',
    'body': 'Adrian writes “160LBS STARTING WEIGHT.” This is filed as a new athlete report without overwriting the earlier 156 lb report or the September 25 reading of 156.8 lb. Measurement date, conditions and the meaning of “starting weight” remain to confirm. Brice asks for repeat tape measurements this week; none have been supplied. No muscle-gain claim or training/nutrition change follows from this report.'
})
for item in study['queue']:
    if item == ['Body', 'Body mass: 1–3 comparable morning readings per week; next weigh-in pending']:
        item[1] = '160 lb report filed: confirm measurement date/conditions and “starting weight” label; continue 1–3 comparable morning readings per week'
    elif item == ['Body', 'Repeat circumferences with the same method; keep arm and thigh relaxed']:
        item[1] = 'Repeat tape measurements this week, as requested by Brice; compare with Sep 24 and keep arm and thigh relaxed. Values pending.'
allowed = {'version', 'bodyMassReport', 'archive', 'currentRead', 'nutrition', 'timeline', 'queue'}
for key in before:
    if key not in allowed:
        assert study[key] == before[key], f'Protected study field changed: {key}'
assert study['archive'][1:] == before['archive']
assert study['archive'][0] == before['currentRead']
assert study['timeline'][:-1] == before['timeline']
assert study['baseline'] == before['baseline']
assert study['measurements'] == before['measurements']
assert round(study['bodyMassReport']['valueLb'] - study['bodyMassReport']['previousValueLb'], 1) == 3.2
html = html[:start] + json.dumps(study, ensure_ascii=False, indent=1) + html[end:]

def once(old, new):
    global html
    assert html.count(old) == 1, 'Expected one renderer match: ' + old[:90]
    html = html.replace(old, new, 1)

once('"dateModified":"2026-09-30"', '"dateModified":"2026-10-01"')
once('30 September 2026 / Athlete update', '1 October 2026 / Weight update')
once('Three dated intake logs are filed. Adrian now reports that eating above his working target feels easier; a new weight and the itemized week are still needed.', 'Adrian now reports 160 lb. Repeat tape measurements are requested this week; the earlier readings and food logs remain in the record.')
once('156.8 lb is the latest athlete-reported morning reading (September 25), not a trend. The September 24 circumference checkpoint is filed, and the working nutrition target is about 3,400 kcal/day.', '160 lb is the latest weight report, filed October 1 and described by Adrian as “starting weight.” The earlier 156.8 lb September 25 reading and September 24 tape measurements remain in the record. The working nutrition target stays about 3,400 kcal/day.')
# Keep the dated September 30 update verbatim, but make its historical status clear.
once('<div id="adrian-update-20260930"><h3>Eating more feels easier</h3>', '<div id="adrian-update-20260930"><h3>September 30 report: eating more feels easier</h3>')
once('function deep(){', '''function bodyMassReportPanel(){
  const m = S.bodyMassReport;
  return `<article class="measure-checkpoint" id="body-mass-report">
    <p class="measure-meta">Filed ${fmtDate(m.filedOn)} · Athlete report</p>
    <h3>Latest reported weight</h3>
    <dl class="measure-values"><div><dt>Reported weight</dt><dd>${m.valueLb} <span>lb</span></dd></div>
      <div><dt>Previous report · Sep 25</dt><dd>${m.previousValueLb} <span>lb</span></dd></div></dl>
    <p>${m.note}</p><p>${m.comparison}</p><p>${m.next}</p>
  </article>`;
}
function deep(){''')
once('const bodyPanel = `\n    ${measurementPanel()}', 'const bodyPanel = `\n    ${bodyMassReportPanel()}\n    ${measurementPanel()}')
once('''  const reads = [
    {s:"on",   t:`Week 01 established a tolerable lower-body dose.`},
    {s:"open", t:`Week 02 redirects toward chest, arms, back and medial thigh.`},
    {s:"open", t:`${S.measurements.length ? "First circumference checkpoint filed on " + fmtDate(S.measurements[0].date) + "." : "Body measurements are pending."}`}
''', '''  const reads = [
    {s:"on", t:`${S.bodyMassReport.valueLb} lb reported. Earlier weights are preserved.`},
    {s:"open", t:`Eating more feels easier, by Adrian's report.`},
    {s:"open", t:`Repeat tape measurements requested this week. Results pending.`}
''')
assert parse_study(html)[2] == study
PAGE.write_text(html)
SOURCE.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
roadmap = ROOT / 'docs/roadmap/FORM-ROADMAP.md'
text = roadmap.read_text()
heading = '## October 1 - Adrian 160 lb report and tape follow-up'
assert heading not in text
note = f'''\n{heading}\n\nSource: [October 1 weight report](../studies/ADRIAN-WEIGHT-UPDATE-20261001.json). Adrian writes “160LBS STARTING WEIGHT.” File as a new report, not a correction to the original 156 lb report or September 25 156.8 lb reading. Measurement date/conditions and the meaning of the label are unconfirmed. The reported-value difference is 3.2 lb; no gain rate or muscle gain is established. Brice has requested repeat tape measurements this week; values remain pending.\n\n- [x] Dated source, body-evidence panel, current read 08, opening summary, nutrition summary, timeline and collection queue updated together. Reading 07 and all prior evidence are preserved.\n- [ ] Browser acceptance and production verification: record actual results in the release receipt; source edits alone are not live.\n- [ ] Confirm the weight capture context; collect repeat waist, chest, relaxed arm/thigh and calf measurements against the unchanged September 24 checkpoint.\n\nPublic-study projection only. No calorie/timing, running/strength prescription, native assignment, private console, calendar or message write. Existing ~3,400 kcal target, October 4 logging endpoint and 1–3 comparable morning weights per week remain. Source script: `scripts/apply-adrian-weight-20261001.py`.\n\n'''
roadmap.write_text(text.replace('\n', '\n' + note, 1))
print('PASS: 160 lb report appended; earlier weights, tape values, readings and prescriptions unchanged.')
