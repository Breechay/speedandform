#!/usr/bin/env python3
"""Build the local design-review package.

The package is the REAL renderer, not a redraw of it: coach/labs/labs.js is
copied byte for byte and reaches its data through an import map that swaps
/private/data.js and /private/auth.js for read-only stubs. Nothing here draws a
session; if the export and production ever disagree about how a Tuesday looks,
the export is wrong and this script is the bug.

Records are rebuilt from docs/CURRENT_PLAN_DUMP.json in the exact shape
loadAthleteRecord() returns. The generator is checked by rebuilding José and
diffing him against harness/record.json, which was captured from a signed-in
coach session and is known to render correctly. If that diff is not clean the
other athletes are not trustworthy either, and the script says so and stops.
"""
import json, os, re, shutil, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, 'form-labs-design-review')
DUMP = os.path.join(ROOT, 'docs', 'CURRENT_PLAN_DUMP.json')

def load(p):
    with open(p) as f: return json.load(f)

dump = load(DUMP)
by = lambda rows, key, val: [r for r in rows if r.get(key) == val]

def record_for(athlete):
    aid = athlete['id']
    components = sorted(by(dump['components'], 'athlete_id', aid),
                        key=lambda c: (c.get('position') or 0))
    versions = sorted(by(dump['versions'], 'athlete_id', aid),
                      key=lambda v: -(v.get('version_number') or 0))
    versions = [dict(v, components=[c for c in components if c['version_id'] == v['id']])
                for v in versions]
    sessions = sorted(by(dump['sessions'], 'athlete_id', aid),
                      key=lambda s: (s.get('position') or 0))
    sessions = [dict(s,
                     versions=[v for v in versions if v['planned_session_id'] == s['id']],
                     currentVersion=next((v for v in versions
                                          if v['planned_session_id'] == s['id']), None))
                for s in sessions]

    checkpoints = sorted(by(dump['checkpoints'], 'athlete_id', aid),
                         key=lambda k: (k.get('position') or 0))
    marks = sorted(by(dump['marks'], 'athlete_id', aid),
                   key=lambda m: (not m.get('is_primary'),))
    marks = [dict(m, signals=[], gates=[],
                  checkpoints=[k for k in checkpoints if k['mark_id'] == m['id']],
                  evidence_surface_requirement=m.get('evidence_surface_requirement') or 'any')
             for m in marks]

    # Descending week_number, exactly as the query orders it — a few surfaces
    # take weeks[0] and mean "the last one authored".
    weeks = sorted(by(dump['weeks'], 'athlete_id', aid),
                   key=lambda w: -(w.get('week_number') or 0))
    today = datetime.date.today().isoformat()
    current = (next((w for w in weeks if w.get('starts_on') and w.get('ends_on')
                     and w['starts_on'] <= today <= w['ends_on']), None)
               or next((w for w in weeks if w.get('state') == 'in_progress'), None)
               or next((w for w in sorted(weeks, key=lambda w: w.get('week_number') or 0)
                        if w.get('state') != 'complete'), None)
               or (weeks[0] if weeks else None))
    nxt = None
    if current:
        later = sorted([w for w in weeks if (w.get('week_number') or 0) > (current.get('week_number') or 0)],
                       key=lambda w: w.get('week_number') or 0)
        nxt = later[0] if later else None

    completions = sorted(by(dump['completions'], 'athlete_id', aid),
                         key=lambda c: (c.get('filed_at') or ''), reverse=True)
    return {
        'athlete': athlete,
        'block': next(iter(by(dump['blocks'], 'athlete_id', aid)), None),
        'weeks': weeks,
        'currentWeek': current,
        'nextWeek': nxt,
        'currentSessions': [s for s in sessions if s.get('week_id') == current['id']] if current else sessions,
        'sessionsByWeek': {w['id']: [s for s in sessions if s.get('week_id') == w['id']] for w in weeks},
        'nextSessions': [s for s in sessions if s.get('week_id') == nxt['id']] if nxt else [],
        'sessions': sessions,
        'baselines': [], 'completions': completions,
        'directions': [], 'reads': [], 'decisions': [],
        'marks': marks,
        'paceBands': sorted(by(dump['pace_bands'], 'athlete_id', aid),
                            key=lambda p: (p.get('position') or 0)),
        'observations': [],
        'primaryMark': next((m for m in marks if m.get('is_primary')), marks[0] if marks else None),
        'movementReads': [], 'support': None, 'supportItems': [], 'verdicts': [],
        'confidenceReads': [], 'evidenceFiles': [], 'confidenceProposal': None,
        'pieces': sorted(by(dump['pieces'], 'athlete_id', aid), key=lambda p: (p.get('position') or 0)),
        'exceptions': by(dump['exceptions'], 'athlete_id', aid),
        'judgments': [], 'task': None, 'taskEvidence': [], 'taskActions': [],
        'privateNotes': [], 'admin': None,
    }

# ---- the generator's own check -------------------------------------------
known = load(os.path.join(ROOT, 'harness', 'record.json'))
jose = next(a for a in dump['athletes'] if a['slug'] == 'jose')
built = record_for(dict(jose, **{k: known['athlete'][k] for k in known['athlete']
                                 if k.startswith('portrait')}))

def shape(rec):
    """Compare what the surfaces read, not row-for-row equality: the dump and a
    live query differ in ordering of columns and in signed-URL fields, neither
    of which any renderer looks at."""
    return {
        'weeks': [w['week_number'] for w in rec['weeks']],
        'sessions': len(rec['sessions']),
        'sessionIds': sorted(s['id'] for s in rec['sessions']),
        'versions': sorted((s['id'], len(s['versions'])) for s in rec['sessions']),
        'components': sorted((s['id'], len((s['currentVersion'] or {}).get('components', [])))
                             for s in rec['sessions']),
        'completions': sorted(c['id'] for c in rec['completions']),
        'pieces': sorted(p['id'] for p in rec['pieces']),
        'paceBands': sorted(b['id'] for b in rec['paceBands']),
        'marks': sorted(m['id'] for m in rec['marks']),
        'checkpoints': sorted(k['id'] for m in rec['marks'] for k in m['checkpoints']),
        'block': (rec['block'] or {}).get('id'),
    }

a, b = shape(known), shape(built)
bad = [k for k in a if a[k] != b[k]]
if bad:
    print('GENERATOR DISAGREES WITH THE CAPTURED RECORD on: ' + ', '.join(bad), file=sys.stderr)
    for k in bad:
        print(f'  {k}\n    captured: {str(a[k])[:200]}\n    built:    {str(b[k])[:200]}', file=sys.stderr)
    sys.exit(1)
print('generator check: José rebuilt from the dump matches the captured record')

# ---- assemble -------------------------------------------------------------
# Everything but the screenshots, which are a review artefact rather than a
# build output and are expensive to recapture.
if os.path.isdir(OUT):
    for entry in os.listdir(OUT):
        if entry == 'screenshots': continue
        path = os.path.join(OUT, entry)
        shutil.rmtree(path) if os.path.isdir(path) else os.remove(path)
for d in ('assets/css', 'assets/js', 'assets/fonts', 'assets/images/portraits', 'data', 'screenshots'):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

# The renderer, untouched.
for src, dst in [('coach/labs/labs.js', 'assets/js/labs.js'),
                 ('private/record.js',  'assets/js/record.js'),
                 ('private/render.js',  'assets/js/render.js')]:
    shutil.copyfile(os.path.join(ROOT, src), os.path.join(OUT, dst))

# The stylesheet, with one mechanical change: absolute font paths become
# relative so the package runs from any directory.
css = open(os.path.join(ROOT, 'coach/labs/labs.css')).read()
css = css.replace('/assets/labs/fonts/', '../fonts/')
open(os.path.join(OUT, 'assets/css/labs.css'), 'w').write(css)
for f in os.listdir(os.path.join(ROOT, 'assets/labs/fonts')):
    shutil.copyfile(os.path.join(ROOT, 'assets/labs/fonts', f),
                    os.path.join(OUT, 'assets/fonts', f))
for f in os.listdir(os.path.join(ROOT, 'harness/portraits')):
    shutil.copyfile(os.path.join(ROOT, 'harness/portraits', f),
                    os.path.join(OUT, 'assets/images/portraits', f))

def relocate(obj):
    """Portrait URLs in the capture point at the harness mount."""
    if isinstance(obj, dict):
        return {k: ('assets/images/portraits/' + v.rsplit('/', 1)[-1]
                    if k == 'portraitUrl' and isinstance(v, str) and v else relocate(v))
                for k, v in obj.items()}
    if isinstance(obj, list): return [relocate(v) for v in obj]
    return obj

portrait_of = {a['slug']: {k: v for k, v in known['athlete'].items() if k.startswith('portrait')}
               for a in dump['athletes'] if a['slug'] == 'jose'}
bench = relocate(load(os.path.join(ROOT, 'harness/bench.json')))
crops = {e['slug']: {k: v for k, v in e.items() if k.startswith('portrait')} for e in bench}

records = {}
for athlete in sorted(dump['athletes'], key=lambda a: a['slug']):
    merged = dict(athlete, **crops.get(athlete['slug'], {}))
    records[athlete['slug']] = relocate(record_for(merged))

# The stubs, and the shell. Only paths change in the shell — the markup is the
# product's own, character for character, so a component cannot drift here.
for f in ('auth.js', 'data.js', 'review.js'):
    shutil.copyfile(os.path.join(ROOT, 'scripts/design-review', f),
                    os.path.join(OUT, 'assets/js', f))
for f in ('README.md', 'COMPROMISES.md'):
    shutil.copyfile(os.path.join(ROOT, 'scripts/design-review', f), os.path.join(OUT, f))

html = open(os.path.join(ROOT, 'coach/labs/index.html')).read()
html = html.replace('/assets/labs/fonts/', 'assets/fonts/')
html = html.replace('href="/coach/labs/labs.css?v=2"', 'href="assets/css/labs.css"')
entry = '  <script type="module" src="/coach/labs/labs.js?v=1"></script>\n'
assert entry in html, 'the shell no longer ends the way this script expects'
html = html.replace(entry, """  <script type="importmap">
{"imports":{
  "/private/data.js":   "./assets/js/data.js",
  "/private/auth.js":   "./assets/js/auth.js",
  "/private/record.js": "./assets/js/record.js",
  "/private/render.js": "./assets/js/render.js"
}}
  </script>
  <script type="module" src="assets/js/labs.js"></script>
  <script type="module" src="assets/js/review.js"></script>
""")
html = html.replace('<body>\n', """<body>
  <!-- FORM Labs \u2014 design-review package. Read-only. Not deployed, not linked.
       The renderer below is coach/labs/labs.js, copied without modification.
       See README.md for routes and viewports. -->
""")
open(os.path.join(OUT, 'index.html'), 'w').write(html)

# A stub that is missing one export boots the package to a spinner, and the
# screenshots are then of nothing. This has happened; hence the check.
labs = open(os.path.join(ROOT, 'coach/labs/labs.js')).read()
need = {}
for m in re.finditer(r"import\s*\{([^}]*)\}\s*from\s*'(/private/[a-z]+\.js)'", labs):
    need.setdefault(m.group(2), set()).update(x.strip() for x in m.group(1).split(','))
missing = []
for path, names in need.items():
    src = open(os.path.join(OUT, 'assets/js', os.path.basename(path))).read()
    for n in sorted(names):
        if not re.search(r'export\s+(async\s+)?(function|const|let|class)\s+' + re.escape(n) + r'\b', src):
            missing.append(f'{os.path.basename(path)} \u2192 {n}')
if missing:
    print('STUB INCOMPLETE: ' + ', '.join(missing), file=sys.stderr)
    sys.exit(1)
print('stub check: every import the renderer makes is exported ('
      + ', '.join(f'{os.path.basename(p)}:{len(n)}' for p, n in sorted(need.items())) + ')')

json.dump(bench, open(os.path.join(OUT, 'data/bench.json'), 'w'))
for slug, rec in records.items():
    json.dump(rec, open(os.path.join(OUT, f'data/record-{slug}.json'), 'w'))

print('athletes: ' + ', '.join(f"{s} ({len(r['sessions'])} sessions)" for s, r in records.items()))
print('wrote ' + OUT)
