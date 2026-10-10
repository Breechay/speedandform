"""Scoped, idempotent projection of Brice's approved long-run observations.

Only replaces the existing long-run section; all other HTML bytes are preserved.
The dated companion note retains the full evidence and interpretation history.
No training prescription, assignment, Calendar event or deployment is changed here.
"""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'labs/rebuilt-athlete/index.html'
NOTE = ROOT / 'labs/rebuilt-athlete/LONG-RUN-COMPARISON.md'
SID = 'long-run-mechanics-study-20261009'
VERSION = '20261010-observations-v1'
OUT = Path('/tmp/rebuilt-observations')
OUT.mkdir(parents=True, exist_ok=True)

RUNS = [
    {'date':'September 25', 'short':'Sep 25', 'distance':'8.01 mi', 'time':'1:09:08', 'pace':'8:38/mi', 'cadence':166, 'stride':1.12, 'contact':268, 'ratio':8.2, 'oscillation':9.1, 'hr':'167 / 181 bpm', 'power':'368 W', 'condition':'Negative', 'temperature':'82–88°F'},
    {'date':'October 4', 'short':'Oct 4', 'distance':'10.01 mi', 'time':'1:51:14.6', 'pace':'11:07/mi', 'cadence':159, 'stride':0.91, 'contact':298, 'ratio':9.5, 'oscillation':8.5, 'hr':'140 / 178 bpm', 'power':'287 W', 'condition':'Negative', 'temperature':'82–86°F'},
    {'date':'October 9', 'short':'Oct 9', 'distance':'10.0 mi', 'time':'1:22:57', 'pace':'8:18/mi', 'cadence':161, 'stride':1.18, 'contact':264, 'ratio':8.0, 'oscillation':9.4, 'hr':'159 / 188 bpm', 'power':'375 W', 'condition':'Positive', 'temperature':'82–88°F'},
]
METRICS = [('cadence','Cadence','spm',0), ('stride','Stride length','m',2), ('contact','Ground contact time','ms',0), ('ratio','Vertical ratio','%',1), ('oscillation','Vertical oscillation','cm',1)]

def val(n, precision):
    return f'{n:.{precision}f}'

def metric_chart(key, title, unit, precision):
    values = [r[key] for r in RUNS]
    low, high = min(values), max(values)
    span = high - low or 1
    low -= span * .65
    high += span * .65
    xs = [55, 160, 265]
    ys = [105 - (v-low)/(high-low)*68 for v in values]
    desc = '; '.join(f"{r['date']}: {val(r[key],precision)} {unit}" for r in RUNS)
    points = ''.join(f'<circle cx="{x}" cy="{y:.2f}" r="4" fill="currentColor"/><text x="{x}" y="{y-13:.2f}" text-anchor="middle">{val(v,precision)}</text><text x="{x}" y="135" text-anchor="middle">{r["short"]}</text>' for x,y,v,r in zip(xs,ys,values,RUNS))
    return f'<figure class="rlo-chart"><figcaption>{escape(title)} <span>({unit})</span></figcaption><svg viewBox="0 0 320 150" role="img" aria-labelledby="rlo-{key}-title rlo-{key}-desc"><title id="rlo-{key}-title">{escape(title)}: whole-run averages</title><desc id="rlo-{key}-desc">{desc}. Three separate outings, not a ranking or a matched-pace test.</desc><path d="M25 115H295" stroke="currentColor" opacity=".25"/>{points}</svg></figure>'

def lap_chart(label, lap_seconds, prefix):
    # Exact complete one-mile lap times. Exclude rounded 0.01-mile partials.
    low, high = 450, 810
    x = lambda i: 56 + i * (440/(len(lap_seconds)-1))
    y = lambda s: 36 + (s-low)/(high-low)*156
    grid = ''.join(f'<path d="M56 {y(s):.2f}H496" stroke="currentColor" opacity=".16"/><text x="46" y="{y(s)+4:.2f}" text-anchor="end">{s//60}:{s%60:02d}</text>' for s in [480,600,720,780])
    points = ' '.join(f'{x(i):.2f},{y(s):.2f}' for i,s in enumerate(lap_seconds))
    ticks = ''.join(f'<text x="{x(i):.2f}" y="217" text-anchor="middle">{i+1}</text>' for i in range(len(lap_seconds)))
    desc = '; '.join(f'mile {i+1}: {int(s)//60}:{s%60:04.1f}' for i,s in enumerate(lap_seconds))
    return f'<figure class="rlo-laps"><figcaption>{label} <span>· recorded one-mile laps</span></figcaption><svg viewBox="0 0 530 242" role="img" aria-labelledby="{prefix}-title {prefix}-desc"><title id="{prefix}-title">{label} pace by mile</title><desc id="{prefix}-desc">{desc}. Pace in minutes per mile; not a prescribed progression.</desc>{grid}<polyline points="{points}" fill="none" stroke="currentColor" stroke-width="2"/>{ticks}<text x="276" y="238" text-anchor="middle">Mile</text></svg></figure>'

rows = [('Distance','distance'), ('Recorded time','time'), ('Average pace','pace')]
body = ''.join('<tr><th scope="row">'+label+'</th>'+''.join('<td>'+escape(str(r[key]))+'</td>' for r in RUNS)+'</tr>' for label,key in rows)
for key,label,unit,precision in METRICS:
    body += '<tr><th scope="row">'+label+'</th>'+''.join('<td>'+val(r[key],precision)+' '+unit+'</td>' for r in RUNS)+'</tr>'
context = ''.join('<tr><th scope="row">'+label+'</th>'+''.join('<td>'+escape(r[key])+'</td>' for r in RUNS)+'</tr>' for label,key in [('Average / maximum heart rate','hr'),('Average power','power'),('Performance Condition','condition'),('Watch temperature','temperature')])
head = '<thead><tr><th scope="col">Measure</th>'+''.join('<th scope="col">'+r['short']+'</th>' for r in RUNS)+'</tr></thead>'
charts = ''.join(metric_chart(*m) for m in METRICS)
laps = lap_chart('September 25', [544.4,529.1,517.5,502.9,523.1,526.4,512.9,486.7], 'rlo-sep25') + lap_chart('October 4', [719.2,735.8,780.8,753.1,722.9,682.8,665,570,542.4,498.1], 'rlo-oct04')

fragment = '''<section class="sec sec--tint rlo" id="long-run-mechanics-study-20261009" data-observations-version="VERSION" aria-labelledby="rlo-title">
<style>
#long-run-mechanics-study-20261009 .rlo-intro{max-width:68ch;font-size:1.08rem;line-height:1.65}
#long-run-mechanics-study-20261009 .rlo-stories{display:grid;gap:1.75rem;margin:2rem 0 2.5rem}
#long-run-mechanics-study-20261009 .rlo-story{min-width:0}
#long-run-mechanics-study-20261009 .rlo-date{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin:0 0 .45rem}
#long-run-mechanics-study-20261009 h3{font-size:1.3rem;line-height:1.3;font-weight:450;margin:0 0 .75rem}
#long-run-mechanics-study-20261009 p{line-height:1.65}
#long-run-mechanics-study-20261009 .rlo-story p{margin:.65rem 0;max-width:68ch}
#long-run-mechanics-study-20261009 .rlo-stats{font-variant-numeric:tabular-nums;font-size:.9rem}
#long-run-mechanics-study-20261009 .rlo-table-wrap{max-width:100%;overflow-x:auto;margin:1.2rem 0 1rem;outline-offset:4px}
#long-run-mechanics-study-20261009 table{border-collapse:collapse;width:100%;font-size:.95rem;line-height:1.45;font-variant-numeric:tabular-nums}
#long-run-mechanics-study-20261009 caption{text-align:left;font-weight:450;margin-bottom:.8rem}
#long-run-mechanics-study-20261009 th,#long-run-mechanics-study-20261009 td{padding:.85rem .75rem;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);text-align:left;vertical-align:top}
#long-run-mechanics-study-20261009 thead th{font-weight:600;white-space:nowrap}
#long-run-mechanics-study-20261009 tbody th{font-weight:450;min-width:9rem}
#long-run-mechanics-study-20261009 td{white-space:nowrap}
#long-run-mechanics-study-20261009 .rlo-small{font-size:.88rem;line-height:1.6;max-width:80ch}
#long-run-mechanics-study-20261009 .rlo-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:1.5rem;margin:1.6rem 0 2rem}
#long-run-mechanics-study-20261009 figure{margin:0;min-width:0}
#long-run-mechanics-study-20261009 figcaption{font-size:1rem;font-weight:450;line-height:1.4}
#long-run-mechanics-study-20261009 figcaption span{font-weight:400;font-size:.88rem}
#long-run-mechanics-study-20261009 svg{display:block;width:100%;height:auto;overflow:visible}
#long-run-mechanics-study-20261009 svg text{fill:currentColor;font-family:inherit;font-size:13px;font-variant-numeric:tabular-nums}
#long-run-mechanics-study-20261009 .rlo-lap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;margin:1.5rem 0}
#long-run-mechanics-study-20261009 details{margin:1.5rem 0;padding:0;border:0}
#long-run-mechanics-study-20261009 summary{cursor:pointer;padding:.75rem 0;font-size:1rem;font-weight:500}
#long-run-mechanics-study-20261009 summary:focus-visible{outline:2px solid currentColor;outline-offset:4px}
#long-run-mechanics-study-20261009 .rlo-context{display:grid;gap:1.5rem;margin:2rem 0}
#long-run-mechanics-study-20261009 a{color:inherit;text-decoration:underline;text-underline-offset:.2em}
@media(min-width:900px){#long-run-mechanics-study-20261009 .rlo-stories{grid-template-columns:repeat(3,minmax(0,1fr));gap:2rem}#long-run-mechanics-study-20261009 .rlo-context{grid-template-columns:1fr 1fr}}
@media(max-width:480px){#long-run-mechanics-study-20261009 th,#long-run-mechanics-study-20261009 td{padding:.75rem .55rem}#long-run-mechanics-study-20261009 table{font-size:.86rem}#long-run-mechanics-study-20261009 .rlo-charts{grid-template-columns:1fr}}
</style>
<div class="shell">
<div class="sec__head"><span class="sec__n mono">LONG-RUN OBSERVATIONS · SEP–OCT 2026</span><h2 class="sec__t" id="rlo-title">Running without proving</h2><p class="sec__note">Three outings. Different intentions. Room to notice.</p></div>
<p class="prose rlo-intro">I’m not trying to beat the previous run. I’m noticing how I move, enjoying the company or the journey, and letting the outing unfold. The story comes before the numbers.</p>
<div class="rlo-stories">
<article class="rlo-story" aria-labelledby="rlo-sep25-story"><p class="rlo-date mono">September 25 · 2026</p><h3 id="rlo-sep25-story">Around the causeways</h3><p>An 8.01-mile outing between Miami and Miami Beach, starting at 8:13 AM. The notes describe controlled, fluid running and attention to posture. Its own route and rhythm belong to this day; the other runs’ stories do not fill in what was not recorded.</p><p class="rlo-stats">8.01 mi · 1:09:08 · 8:38/mi</p><p class="rlo-small">The final full mile was 8:06.7. That is a lap, not evidence that a fast finish was the plan.</p></article>
<article class="rlo-story" aria-labelledby="rlo-oct04-story"><p class="rlo-date mono">October 4 · 2026</p><h3 id="rlo-oct04-story">With Natalie, then a journey</h3><p>I ran the first four miles with Natalie. When she could not continue, I kept going on my own. At first I wanted to keep it controlled and keep my heart rate low. Later, I decided to just move.</p><p class="rlo-stats">10.01 mi · 1:51:14.6 · 11:07/mi</p><p class="rlo-small">A shared run became a solo exploration. The slower average was not a setback, and the later acceleration was not a required workout. The exact point at which the intention changed was not recorded.</p></article>
<article class="rlo-story" aria-labelledby="rlo-oct09-story"><p class="rlo-date mono">October 9 · 2026</p><h3 id="rlo-oct09-story">Finding a rhythm with Julius</h3><p>A new connection at Muscle Beach became a run together. The rhythm opened up naturally. We deliberately eased off, relaxed there, and later found the pace picking up again. I wasn’t defending a pace or trying to prove anything.</p><p class="rlo-stats">10.0 mi · 1:22:57 · 8:18/mi</p><p class="rlo-small">The run felt solid, not hard. By 5:49 PM after an approximately 6 AM start, I had no noticeable tibia or lower-leg symptoms. I ate well, took a long nap and left room to recover. The next-morning response was not yet recorded.</p></article>
</div>
<h3>What the watch recorded</h3>
<p class="prose">These are whole-run averages from three different outings, not a scorecard. October 4 is the long run immediately before October 9. September 25 stays as an earlier observation.</p>
<div class="rlo-table-wrap" role="region" aria-label="Three-run mechanics table; scroll horizontally on smaller screens" tabindex="0"><table><caption>Running distances in miles; pace in minutes per mile.</caption>HEAD<tbody>BODY</tbody></table></div>
<p class="rlo-small">Mechanics keep the watch’s units: steps per minute, meters, milliseconds, percent and centimeters. Recorded times come from the overview, lap table or chart as available; the complete source notes preserve the small differences between those displays.</p>
<div class="rlo-charts" aria-label="Whole-run mechanical observations">CHARTS</div>
<p class="rlo-small">Each point is one displayed whole-run average. The vertical scale differs by measure. These are not mile-by-mile traces, matched-pace measurements or targets to reproduce.</p>
<details><summary>See the recorded mile laps</summary><p class="rlo-small">Exact full-mile lap times are available for September 25 and October 4. Their charts share a pace scale. October 9’s supplied splits were in kilometers; converting their pace does not turn them into measured mile laps, so no mile-by-mile line is invented for that outing.</p><div class="rlo-lap-grid">LAPS</div></details>
<details><summary>Heart rate and other device context</summary><div class="rlo-table-wrap" role="region" aria-label="Device context table" tabindex="0"><table>HEAD<tbody>CONTEXT</tbody></table></div><p class="rlo-small">Heart-rate settings, sensor source, conditions and the purpose of the outing matter. Watch temperature is not a verified ambient-weather measurement. Performance Condition is a device estimate, not a verdict on recovery or a reason to add work.</p></details>
<div class="rlo-context">
<div><h3>What I’m noticing around the run</h3><p>The comfortable leg-lifting cue, the feeling of support after front squats, the barbell work and the wish to keep a muscular frame all belong in the notes. Once-weekly front squats remain an idea to fit into existing strength work, not an extra workout created by this page.</p><p>Keep space for company, sleep, naps, food, shoes, walking, strength work and occasional dated weight. Recovery and enjoyment belong beside the graphs.</p></div>
<div><h3>What remains open</h3><p>A longer stride or shorter ground contact time is not automatically better. Contact time does not measure impact force or left–right control. Vertical ratio can fall even when absolute vertical movement rises.</p><p>The same pace can feel different on another day. We can notice without requiring a progress story, assigning a cause to front squats, or turning the next outing into a test.</p></div>
</div>
<p class="prose"><strong>Current recovery decision, recorded October 9:</strong> no attempt to make up the proposed 31 miles. Leave room for food, rest, gentle movement, core and upper-body work. Easy stationary cycling stays optional. The next running week is a separate decision, not an outcome of these graphs.</p>
<p class="rlo-small"><a href="./LONG-RUN-COMPARISON.md">Read the full dated observations and source notes</a>. Source: Brice’s accounts and supplied Garmin screenshots. Observations do not change the training plan or Calendar.</p>
</div></section>'''
for token, value in [('VERSION',VERSION),('HEAD',head),('BODY',body),('CHARTS',charts),('LAPS',laps),('CONTEXT',context)]:
    fragment = fragment.replace(token,value)

raw = PAGE.read_bytes()
text = raw.decode('utf-8')
pattern = re.compile(r'<section\b[^>]*\bid="'+SID+r'"[^>]*>.*?</section>', re.S)
match = list(pattern.finditer(text))
assert len(match) == 1, f'Expected exactly one existing observation section, found {len(match)}'
old = match[0]
updated = text[:old.start()] + fragment + text[old.end():]
assert updated[:old.start()] == text[:old.start()]
assert updated[old.start()+len(fragment):] == text[old.end():]
assert 'Cadence, stride length, ground contact time, vertical ratio and oscillation not yet verified for this session.' not in fragment
assert updated.count('data-observations-version="'+VERSION+'"') == 1
for phrase in ['first four miles with Natalie', 'whole-run averages', '166 spm', '159 spm', '161 spm', '1.12 m', '0.91 m', '1.18 m', '268 ms', '298 ms', '264 ms']:
    assert phrase in fragment, phrase
for token in ['BODY','CHARTS','LAPS','CONTEXT']:
    assert token not in fragment
assert text.count('data:image/') == updated.count('data:image/'), 'Embedded images changed'
PAGE.write_bytes(updated.encode('utf-8'))

note = NOTE.read_text()
notice = ('Website integration completed in the source on October 10, 2026: `index.html#'+SID+'` now presents the three outing descriptions before the verified table and whole-run metric plots. The two exact full-mile lap charts are labeled separately. This source integration does not itself establish a production deploy, Calendar update or native-app synchronization.')
# Preserve evidence, but supersede earlier pending-render statements.
note = note.replace('The HTML page has not been revised by this note update.', notice)
heading = '\n## Rendering follow-through\n'
if heading in note:
    note = note.split(heading)[0] + '\n## Website projection\n\n' + notice + '\n\nThe projection preserves the existing section anchor and all unrelated HTML, embedded images and training panels. Regenerate only after reviewing newer observation decisions. No numerical mechanics-by-mile overlay has been invented.\n'
NOTE.write_text(note)
receipt = {'version':VERSION, 'html_sha256':hashlib.sha256(updated.encode()).hexdigest(), 'unchanged_prefix_sha256':hashlib.sha256(text[:old.start()].encode()).hexdigest(), 'unchanged_suffix_sha256':hashlib.sha256(text[old.end():].encode()).hexdigest(), 'embedded_image_count':text.count('data:image/'), 'source_only':True, 'training_calendar_unchanged':True}
(OUT/'source-check.json').write_text(json.dumps(receipt,indent=2))
(OUT/'section.html').write_text(fragment)
print(json.dumps(receipt,indent=2))
