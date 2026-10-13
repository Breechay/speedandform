#!/usr/bin/env python3
"""Adrian · FRM-001 update, Oct 13 2026.

Current state (Week 05, weight holding near 160 lb, incline 50s), the current
weeks 05-16 plan from docs/studies/ADRIAN-PLAN-W05-16-20261013.json, and the
fuel-by-day rule from docs/studies/ADRIAN-NUTRITION-FUEL-BY-DAY-20261013.json.

Re-run after a fresh plan export: weeks 05-16 are rebuilt from the snapshot.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / 'labs/adrian-runner-mass/index.html'
PLAN = json.loads((ROOT / 'docs/studies/ADRIAN-PLAN-W05-16-20261013.json').read_text())
FUEL = json.loads((ROOT / 'docs/studies/ADRIAN-NUTRITION-FUEL-BY-DAY-20261013.json').read_text())

s = PAGE.read_text()


def swap(old, new, count=1):
    global s
    n = s.count(old)
    if n == 0 and new in s:
        return  # already applied
    assert n == count, (n, old[:90])
    s = s.replace(old, new)


swap('"dateModified":"2026-10-11"', '"dateModified":"2026-10-13"')

# ---------------------------------------------------------------- data
marker = 'const STUDY = '
i = s.index(marker) + len(marker)
S, end = json.JSONDecoder().raw_decode(s, i)

S['version'] = '2026.10.13.1'

base = {b['k']: b for b in S['baseline']}
base['Body mass']['note'] = 'Holding near 160 lb by Oct 13 (coach report); standardized weekly mean pending'
for k, v in [('Waist', '31 in'), ('Chest', '36 in'), ('Arm, relaxed', '11.5 in')]:
    if 'Oct 5' not in base[k]['note']:
        base[k]['note'] += f' · Oct 5: {v}'

S['dossier'][1]['lines'][2] = 'Dumbbells, a bench, a pull-up bar.'
S['dossier'][2]['more'] = ('Four channels, filed separately. Two tape sets and a run of weigh-ins are filed; '
                           'a body-mass trend and standardized comparison photos are still pending.')

t = S['targets']
for x in t:
    if x['name'] == 'Upper back':
        x['name'] = 'Back width'
        x['why'] = 'Lats and upper back. Width in a shirt, with no landing penalty.'
if not any(x['name'] == 'Side shoulders' for x in t):
    at = [x['name'] for x in t].index('Back width') + 1
    t.insert(at, {'name': 'Side shoulders', 'why': 'Lateral delts: shoulder width and roundness. Costs the run nothing.',
                  'progress': None, 'state': 'Target'})

# Weeks 05-16 from the plan snapshot. Week names stay; everything else is the stored plan.
by_n = {w['n']: w for w in S['season']}
for w in PLAN['weeks']:
    page_week = by_n[w['week']]
    page_week['start'], page_week['end'] = w['starts'], w['ends']
    page_week['intent'] = w['intent']
    page_week['prog'] = w['note']
    page_week['days'] = [{'d': x['day'], 't': x['title'], 'f': x['focus'], 'ex': x['exercises']} for x in w['sessions']]
S['seasonNote'] = ('Prescription authority: FORM Athlete System. Sixteen weeks, 58 published strength sessions. '
                   'Weeks 05–16 show the current version (revised Oct 1, Oct 6 and Oct 13): dumbbells, a bench and bodyweight, '
                   'exact sets and reps. Earlier weeks stay as published. This is the authored plan, not a record of what was completed.')

if not any(x['week'] == 'W05' for x in S['strength']):
    S['strength'].append({'week': 'W05', 'ex': 'Incline dumbbell bench press', 'load': '4 × 6 @ 50 lb dumbbells',
                          'delta': '+15 lb', 'note': 'Upper A · athlete report · 60 lb tried on the last set, not completed'})
S['strengthNote'] = ('Two sessions have numbers against them. The Week 05 incline jump is a reported load, '
                     'not evidence of hypertrophy and not evidence that the running absorbed it.')
S['strengthPending'] = ("His app holds the other sessions' loads. They reach the study once his account is connected and sharing is on.")
S['strengthRules'] = [
    'Same weight until every set is clean with 2 reps in reserve.',
    'Then add reps: 3 × 8 → 3 × 10 → 3 × 12. At 3 × 12, the next dumbbell and back to 3 × 8.',
    'On the gym’s heaviest dumbbells (60 lb), lower each rep over 3 seconds before adding reps.',
    'Rest 90 sec on smaller work. 2–3 min on presses, squats and RDLs.',
    'Record every weight and rep. That becomes the next week’s evidence.',
]
for q in ['Just did 50s for all 4 sets on incline!!!', 'I know for a fact that wouldn’t have moved a month ago']:
    if q not in S['quotes']:
        S['quotes'].append(q)

n = S['nutrition']
tiers = FUEL['tiers']
n['status'] = 'Fuel by the day · 3k / 4k / 5k'
n['why'] = ('Weight has held near 160 lb on the flat 3,400 kcal target, so intake now follows the training day: '
            'about 3,000 on rest and easy days, 4,000 on lifting and normal run days, 5,000 on the long run, workout days '
            'and any day with a hard run plus a lift. Protein 150–170 g a day; the rest goes to carbohydrate, especially around runs. '
            'The 7-day average of morning weights decides the next change.')
new_bias = [
    'Oct 13: intake follows the day — about 3,000 / 4,000 / 5,000 kcal. Close is enough.',
    'Protein 150–170 g a day covers the need; extra energy goes to carbohydrate around runs.',
    'Aim for about +0.5 lb a week on the 7-day average. Flat for 2 weeks: one 3,000 day becomes 4,000. '
    'Up more than 1 lb a week with the waist up: one 5,000 day becomes 4,000.',
    'Oct 12 athlete report: 3,820 kcal with over 215 g protein.',
]
if n['bias'][0] != new_bias[0]:
    n['bias'][0] = 'Sep 24–Oct 12: about 3,400 kcal/day was the working target.'
    n['bias'] = new_bias + n['bias']
n['notYet'] = ['No automatic sync between the apps and this study is claimed.' if 'synchronization' in x else x for x in n['notYet']]
n['note'] = ('<a href="/plans/adrian-nutrition-phase-01/">Fuel Your Work: Adrian’s nutrition page</a>. '
             '<a href="/docs/studies/ADRIAN-NUTRITION-FUEL-BY-DAY-20261013.json">Fuel-by-day record</a>. '
             'Athlete reports remain separate from measured outcomes.')

new_entries = [
    {'id': 'adrian-plan-revisions-20261006', 'when': 'Oct 6, 2026', 'kind': 'Intervention changed', 'type': 'change',
     'title': 'Width becomes the upper-body priority. Cables come out.',
     'body': 'Weeks 05–16 move toward lat width, side and rear shoulders, with traps kept modest. Cable and machine work is replaced '
             'with dumbbells, a bench and bodyweight. Set counts, race-week cuts and the weekly rhythm stay. Opened and completed sessions keep their original prescription.'},
    {'id': 'adrian-incline-50-20261012', 'when': 'Week 05 · Upper A', 'kind': 'Strength · athlete report', 'type': 'note',
     'title': '50 lb dumbbells for all four sets on the incline press.',
     'body': 'Prescribed 4 × 6; his last recorded load was 35 lb. He tried 60 lb on the final set and went back down. '
             'The gym’s heaviest dumbbells are 60 lb, so progress from here comes from reps and a slower lowering before load. '
             'He trained from the earlier cable version still on his phone. Exact date not supplied; this is a reported load, not a hypertrophy claim.'},
    {'id': 'adrian-fuel-by-day-20261013', 'when': 'Oct 13, 2026', 'kind': 'Body + nutrition · coach decision', 'type': 'change',
     'title': 'Weight holds near 160 lb. Food now follows the training day.',
     'body': 'On the flat 3,400 kcal target his weight has held near 160 lb, so the 163.2 lb reading was not a trend. '
             'Intake now follows the day: about 3,000 kcal on rest and easy days, 4,000 on lifting and normal run days, '
             '5,000 on the long run, workout days and any day with a hard run plus a lift. Protein 150–170 g; the rest goes to carbohydrate. '
             'On October 12 Adrian reported 3,820 kcal with over 215 g protein. The 7-day average of morning weights decides the next change.'},
    {'id': 'adrian-exact-targets-20261013', 'when': 'Oct 13, 2026', 'kind': 'Intervention changed', 'type': 'change',
     'title': 'Exact targets, chin-ups and pull-ups, and a yin yoga layer.',
     'body': '41 future sessions carry exact sets and reps instead of ranges. Chin-ups replace the extra row on Upper A and pull-ups replace '
             'the pullover on Upper B, starting at 2 × 4. An incline curl replaces the Upper A shrug and Upper B gets a third lateral-raise set in full weeks. '
             'Yin yoga, 2–3 times a week, is his recovery layer. Completed sessions keep their original prescription. '
             'His phone shows the revised plan once he updates the app and connects his account.'},
]
have = {x['id'] for x in S['timeline']}
S['timeline'] += [e for e in new_entries if e['id'] not in have]

if S['currentRead']['date'] != '2026-10-13':
    S['archive'].insert(0, S['currentRead'])
    S['currentRead'] = {
        'date': '2026-10-13', 'n': '13',
        'body': 'Weight is holding near 160 lb, so food now follows the training day: about 3,000, 4,000 or 5,000 kcal. '
                'The incline press moved from 35 to 50 lb dumbbells for 4 × 6. The plan now carries exact targets, chin-ups and pull-ups, and yin yoga.',
        'running': 'No new race or key-session result. The calf adjustment and yin yoga stay in force; key sessions are read against their prescribed pace.',
        'next': 'First standardized photo set and repeat tape this weekend: morning, before eating, same spot, right side for arm, thigh and calf. '
                'Keep 1–3 comparable morning weights a week.',
    }

p = S['protocol']
p['phase'] = 'Week 05 · active'
p['law'] = [
    'Exact sets and reps. Same weight until every set is clean with 2 reps in reserve; then 3 × 8 → 3 × 10 → 3 × 12; at 3 × 12, the next dumbbell and back to 3 × 8.'
    if x.startswith('Progress reps inside the range') else x for x in p['law']]
slow = 'On the gym’s heaviest dumbbells, slow the lowering to 3 seconds before adding reps.'
if slow not in p['law']:
    p['law'].insert(next(k for k, x in enumerate(p['law']) if x.startswith('If grip/equipment')) + 1, slow)
p['forge'] = ('The Speed & Form: Strength app carries the authored season. A new build lets Adrian connect his account so revisions reach his phone; '
              'until he updates, his phone holds the earlier version and changes are delivered directly. Completed history is never rewritten.')

Q = []
for kind, text in S['queue']:
    if text.startswith('163.2 lb morning report'):
        text = 'Holding near 160 lb (coach report, Oct 13): file 1–3 comparable morning readings a week and read the 7-day average'
    elif text == 'Standardized baseline set — front, side, back, lightly flexed':
        text = 'Standardized baseline set this weekend — front, side, back, lightly flexed'
    elif text == 'Week 01 and Week 02 load and reps, every set':
        text = 'Every session’s loads and reps: connect his account and turn on sharing so app logs reach the study'
    elif text.startswith('When hard-day calories are added'):
        text = 'Record each day’s type (3k / 4k / 5k) beside actual intake'
    Q.append([kind, text])
extra = ['Strength', 'Confirm a pull-up bar at his gym and his current chin-up count before the Oct 16 session']
if extra not in Q:
    Q.append(extra)
S['queue'] = Q

s = s[:i] + json.dumps(S, indent=1, ensure_ascii=False) + s[end:]

# ---------------------------------------------------------------- renderer
swap('<div><dt>Body</dt><dd class="no">Nothing filed</dd></div>', '<div><dt>Body</dt><dd class="yes">2 tape sets</dd></div>')
swap('<div><dt>Strength</dt><dd class="yes">1 session</dd></div>', '<div><dt>Strength</dt><dd class="yes">2 sessions</dd></div>')
swap('{k:"Sessions filed", v:1}', '{k:"Sessions filed", v:2}')
swap('''    {s:"on", t:`${S.weekendUpdate.weights[2].lb} lb morning report filed. Weekend scale swing preserved.`},
    {s:"on", t:`Recovery adherence is now tracked alongside body, strength, running and athlete experience.`},
    {s:"open", t:`Repeat tape measurements now. ~2:40 marathon remains a long-term horizon, not a current prescription.`}''',
     '''    {s:"on", t:`Holding near 160 lb. Food now follows the training day: 3k / 4k / 5k.`},
    {s:"on", t:`Incline press up from 35 to 50 lb dumbbells for 4 × 6.`},
    {s:"open", t:`First standardized photo set and repeat tape this weekend. ~2:40 marathon stays a long-term horizon.`}''')
swap('''    <p class="measure-meta">Filed ${fmtDate(w.filedOn)} · Athlete report</p>
    <h3>Latest reported weight</h3>
    <dl class="measure-values">
''', '''    <p class="measure-meta">Updated Oct 13, 2026 · Coach and athlete reports</p>
    <h3>Latest reported weight</h3>
    <dl class="measure-values">
      <div><dt>Oct 13 · holding, coach report</dt><dd>~160 <span>lb</span></dd></div>
''')
swap('<p>${w.read}</p><p>The October 5 repeat tape set is now filed below. Keep comparable morning weights and repeat the same tape method again before interpreting the scale change as tissue gain.</p>',
     '<p>${w.read}</p><p>Weight has since held near 160 lb, so the 163.2 lb reading was not a trend. Food now follows the training day; the 7-day average of morning weights decides the next change.</p>')

# ---------------------------------------------------------------- static update panel
start = s.index('<section id="intake-20260922" class="sec"><div class="shell">')
hist = s.index('<h3>Historical results: keep the sources separate</h3>', start)
identity_start = s.index('<p><strong>Identity:</strong>', start)
identity = s[identity_start:s.index('</p>', identity_start) + 4]
kcal = {x['id']: f"{x['kcal']:,}" for x in tiers}
panel = f'''<section id="intake-20260922" class="sec"><div class="shell"><p class="lbl">13 October 2026 / Fuel by the day</p><h2>Eat for the day you train.</h2><p class="intake-lead">Adrian’s weight has held near 160 lb on a flat 3,400 calorie target, so food now follows the training day. Close is enough; the pattern matters more than any one day.</p><div class="fuel-days" id="fuel-by-day"><div><p class="fuel-kcal">{kcal['base']}<span>kcal</span></p><h3>Rest and easy days</h3><p>A rest day, or an easy run with no lift.</p></div><div><p class="fuel-kcal">{kcal['train']}<span>kcal</span></p><h3>Lifting and normal run days</h3><p>A strength session, or a normal run.</p></div><div><p class="fuel-kcal">{kcal['hard']}<span>kcal</span></p><h3>Big days</h3><p>The long run, workout days, and any day with a hard run plus a lift.</p></div></div><div class="intake-cols"><div><h3>Protein and carbohydrate</h3><p>150–170 g of protein a day covers the need. Energy above that goes to carbohydrate, especially before and after runs. On October 12 Adrian reported 3,820 calories with over 215 g of protein; the extra protein can move to rice, pasta, bread and fruit.</p></div><div><h3>How it changes</h3><p>The 7-day average of morning weights decides, read beside the waist tape. Aim for about half a pound a week. Flat for two weeks: one 3,000 day becomes a 4,000 day. Rising more than a pound a week with the waist up: one 5,000 day becomes a 4,000 day.</p></div></div><p><a class="intake-link" href="/plans/adrian-nutrition-phase-01/">Fuel Your Work · Open Adrian’s nutrition page ↗</a></p>{identity}'''
s = s[:start] + panel + s[hist:]
swap('<p class="intake-small">Scope: nutrition companion and source filing only. No run or strength assignment, completed record or native app has been changed. Nutrition starts on the athlete’s actual start date, not automatically on publication.</p>',
     '<p class="intake-small">Record: <a href="/docs/studies/ADRIAN-NUTRITION-FUEL-BY-DAY-20261013.json">fuel by the day</a> · <a href="/docs/studies/ADRIAN-STUDY-UPDATE-20261013.json">Oct 13 update</a>. Intake figures are athlete reports, not measured intake.</p>')

css_anchor = '#intake-20260922 .intake-cols{display:grid;grid-template-columns:1fr 1fr;gap:32px}'
css = ('#intake-20260922 .fuel-days{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 24px;margin:26px 0 10px;border-top:1px solid var(--rule-hard)}'
       '#intake-20260922 .fuel-days>div{padding:18px 0 4px;border-bottom:1px solid var(--rule)}'
       '#intake-20260922 .fuel-days h3{margin:8px 0 6px}'
       '#intake-20260922 .fuel-days p{margin:0 0 12px}'
       '#intake-20260922 .fuel-kcal{font-size:clamp(44px,6vw,68px)!important;line-height:1!important;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;margin:0!important}'
       '#intake-20260922 .fuel-kcal span{font-size:14px;font-weight:600;letter-spacing:.08em;margin-left:8px;text-transform:uppercase}'
       '@media (max-width:760px){#intake-20260922 .fuel-days{grid-template-columns:1fr}}')
if '.fuel-days{' not in s:
    swap(css_anchor, css_anchor + css)

PAGE.write_text(s)
print('ok', PAGE.relative_to(ROOT))
