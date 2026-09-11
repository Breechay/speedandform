from pathlib import Path
import re

p = Path('labs/speed-that-endures/index.html')
s = p.read_text()

def one(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 match, found {n}')
    s = s.replace(old, new, 1)

one('<meta content="2026-09-07" itemprop="dateModified"/>',
    '<meta content="2026-09-11" itemprop="dateModified"/>', 'itemprop date')
one('<div class="progression-note">CONTINUOUS MILES AT THE SAME TARGET BAND</div>',
    '<div class="progression-note">CONTINUOUS MILES AT EACH ATHLETE’S TARGET BAND</div>', 'progression note')
one('<h4>Ceiling and complementary work</h4>\n<p>Run faster than race pace in controlled doses so race pace never becomes your ceiling.</p>',
    '<h4>Ceiling progression</h4>\n<p>Progress threshold time and continuity so race pace keeps sitting below the athlete’s sustainable ceiling. Faster work supports the spine; it does not replace it.</p>', 'Thursday lane')
one('<div><span>WHAT WE ARE TESTING</span><p>Whether longer exposure at the same velocity changes the cost for each athlete, and whether the evidence eventually requires different next steps.</p></div>',
    '<div><span>WHAT WE ARE TESTING</span><p>Whether longer exposure at each athlete’s assigned race pace changes the cost, and whether the evidence eventually requires different next steps.</p></div>', 'testing copy')
one('<div class="ask">Same velocity. Progressively longer continuous exposure.</div>',
    '<div class="ask">Each athlete keeps their assigned pace. The continuous exposure gets longer.</div>', 'season ask')

pattern = re.compile(r'<div class="live" style="margin-top:104px">.*?</div>\n<div class="grammar">', re.S)
replacement = '''<div class="live" style="margin-top:104px">
<div class="d">Sep 08 / 09 · W3 · paired filed</div>
<div>
<div class="k">Eight broken race-pace miles held by both athletes.</div>
<p>José ran 6:42 · 6:43 · 6:43 · 6:43. Hope ran 6:50 · 6:50 · 6:53 · 6:50. Their paired 2 × 10 threshold work landed at 6:15 · 6:14 for José and 6:22 · 6:24 for Hope.</p>
</div>
<div class="st">Filed</div>
</div>
<div class="synth">
<div>
<div class="k">What W3 established</div>
<b>Same method. Two repeatable race paces.</b>
<p>José keeps 6:30–6:45. Hope moves to 6:45–7:00. The useful result is not one shared number; it is that each athlete now has a repeatable band to carry into the continuous asks.</p>
</div>
<div>
<div class="k">What threshold added</div>
<b>There is measurable room above race pace.</b>
<p>José's threshold work sat around 6:15. Hope's sat around 6:23. In both athletes, race pace is roughly half a minute per mile below that ceiling. That is an observation, not a formula.</p>
</div>
<div>
<div class="k">What changes next</div>
<b>Remove the reset. Do not make the pace faster.</b>
<p>W4 asks for five continuous miles at each athlete's own band. The Thursday lane now progresses threshold deliberately so the ceiling can keep moving while race pace stays stable.</p>
</div>
</div>
<div class="grammar">'''
s, n = pattern.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit(f'lab-note summary: expected 1 block, found {n}')

one('<span class="st">José filed · Hope pending</span>', '<span class="st">Filed</span>', 'W3 note status')
one('<div class="memory-step filed"><span>SEP 08 / 09 · W3</span><b>4 × 2</b><small>JOSÉ FILED</small></div>',
    '<div class="memory-step filed"><span>SEP 08 / 09 · W3</span><b>4 × 2</b><small>FILED</small></div>', 'memory W3')
one('<header><b>HOPE</b><span>1 FILED READ</span></header>\n      <div class="memory-facts"><span><small>OUTPUT</small>2/3 reps in band</span><span><small>EFFORT</small>High</span><span><small>LIMITER</small>Not isolated</span><span><small>RESERVE</small>Not reported</span></div>',
    '<header><b>HOPE</b><span>2 FILED READS</span></header>\n      <div class="memory-facts"><span><small>OUTPUT</small>4/4 × 2 mi around 6:50</span><span><small>EFFORT</small>Not reported</span><span><small>LIMITER</small>Not isolated</span><span><small>RESERVE</small>Not reported</span></div>', 'Hope memory')
one('They help explain what identical pace can cost two different runners.',
    'They help explain what race-pace work can cost two different runners.', 'memory carry')
one('<span class="q">Can 6:30–6:45/mi remain economical for 13.1 miles under race conditions?</span>',
    '<span class="q">Can each athlete’s race pace remain economical for 13.1 miles under race conditions?</span>', 'Orlando note question')
one('<p class="test-thesis">Can 6:30–6:45/mi stay economical for 13.1 miles, <span>and what does producing that pace cost each athlete?</span></p>',
    '<p class="test-thesis">Can each athlete’s race pace stay economical for 13.1 miles, <span>and what does producing it cost them late?</span></p>', 'Orlando thesis')
one('<div class="traj-item"><span>02 · provisional</span><b>Embedded access</b><p>Re-enter 6:30–6:45/mi after substantial prior mileage.</p></div>',
    '<div class="traj-item"><span>02 · provisional</span><b>Embedded access</b><p>Re-enter assigned race pace after substantial prior mileage.</p></div>', 'Donna embedded access')

checks = [
    'CONTINUOUS MILES AT EACH ATHLETE’S TARGET BAND',
    'Sep 08 / 09 · W3 · paired filed',
    'Same method. Two repeatable race paces.',
    'HOPE</b><span>2 FILED READS',
    'Can each athlete’s race pace stay economical for 13.1 miles',
    'Re-enter assigned race pace after substantial prior mileage.',
]
for text in checks:
    if text not in s:
        raise SystemExit(f'missing proof string: {text}')

p.write_text(s)
