"""Finish the September 30 evidence display without changing athlete data."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
page = root / 'labs/adrian-runner-mass/index.html'
html = page.read_text()
marker = '/* ADRIAN SEPTEMBER 30 RUNNING REPORT DISPLAY */'
if marker in html:
    assert 'class="sess sess--reports"' in html
    assert 'Running session records ${pill("report")}' in html
    print('PASS: report display already finalized')
    raise SystemExit(0)
assert '"version": "2026.09.30.1"' in html


def once(old, new):
    global html
    assert html.count(old) == 1, old[:100]
    html = html.replace(old, new, 1)


once('Pre-intervention sessions ${pill("report")}', 'Running session records ${pill("report")}')
once('''<ul class="sess">${S.running.map(x=>`<li><span class="wk">${dmy(x.date)||"No date"}</span>
      <span>${x.session}${x.quote?`<br><span class="delta" style="color:var(--graphite)">“${x.quote}”</span>`:""}</span>
      <span class="load">${x.dist} · ${x.pace}<span class="delta" style="color:var(--graphite);margin-left:8px">${x.time}</span></span></li>`).join("")}</ul>''', '''<ul class="sess sess--reports">${S.running.map(x=>`<li><span class="wk">${x.date?dmy(x.date):x.recordedOn?`Filed<br>${dmy(x.recordedOn)}`:"No date"}</span>
      <span>${x.session}${x.quote?`<br><span class="delta" style="color:var(--graphite)">“${x.quote}”</span>`:""}${x.note?`<span class="session-report-note">${x.note}</span>`:""}</span>
      <span class="load">${x.dist} · ${x.pace}<span class="delta" style="color:var(--graphite);margin-left:8px">${x.time}</span></span></li>`).join("")}</ul>''')
# Reconcile this stale renderer with the already-recorded 1–3/week decision.
once('Three to four morning readings a week under similar conditions. The weekly average is the number, never a single morning.', 'One to three morning readings a week under similar conditions. Read the pattern across comparable mornings; one reading is not a trend.')
css = '''
/* ADRIAN SEPTEMBER 30 RUNNING REPORT DISPLAY */
.sess--reports li{grid-template-columns:78px minmax(0,1fr) minmax(0,1fr);align-items:start}
.sess--reports li>span{min-width:0}
.sess--reports .wk{line-height:1.6}
.sess--reports .load{white-space:normal;overflow-wrap:anywhere;text-align:left;line-height:1.7}
.sess--reports .load .delta{display:block;margin-left:0!important;white-space:normal}
.session-report-note{display:block;margin-top:8px;color:var(--graphite);font-size:13px;line-height:1.65}
@media(max-width:640px){
  .sess--reports li{grid-template-columns:46px minmax(0,1fr);column-gap:12px;row-gap:10px}
  .sess--reports .load{grid-column:2;font-size:13px}
}
'''
assert '</style>' in html
html = html.replace('</style>', css + '</style>', 1)
page.write_text(html)
roadmap = root / 'docs/roadmap/FORM-ROADMAP.md'
text = roadmap.read_text()
old = 'The stale queue is aligned with the already-established 1–3 morning weights per week.'
new = 'The stale queue and body-evidence copy are aligned with the already-established 1–3 morning weights per week. The running list now distinguishes filing dates from session dates, uses a neutral session-record heading and wraps its split information on phones.'
assert text.count(old) == 1
roadmap.write_text(text.replace(old, new, 1))
print('PASS: running-report display finalized; study data and prescriptions unchanged')
