from pathlib import Path


def read(path): return Path(path).read_text()
def write(path, text): Path(path).write_text(text)
def replace(path, old, new, count=1):
    s = read(path)
    if old not in s:
        raise SystemExit(f'{path}: missing expected fragment: {old[:100]}')
    write(path, s.replace(old, new, count))

# Share/search copy follows the sparse public message while keeping useful SEO nouns.
p='index.html'; s=read(p)
repls=[
('Run better, get faster, and run farther with Brice. Individual running plans, track coaching in Miami, and remote feedback. Start with eight weeks.', 'Run Development with Brice. Individual running coaching in Miami and remote. Eight weeks to begin.'),
('<meta property="og:title" content="Run better. Get faster. Run farther. | FORM">','<meta property="og:title" content="Run better. | FORM">'),
('<meta property="og:description" content="Individual running coaching with Brice. A plan built around your fitness, your goal, and your week. Miami + remote. Eight weeks to begin.">','<meta property="og:description" content="Run Development with Brice. Individual running coaching in Miami + remote. Eight weeks to begin.">'),
('<meta name="twitter:title" content="Run better. Get faster. Run farther. | FORM">','<meta name="twitter:title" content="Run better. | FORM">'),
('<meta name="twitter:description" content="Individual running coaching with Brice. A plan built around your fitness, your goal, and your week. Miami + remote. Eight weeks to begin.">','<meta name="twitter:description" content="Run Development with Brice. Individual running coaching in Miami + remote. Eight weeks to begin.">'),
('"description": "Individual running plans, weekly track coaching in Miami, and remote coaching with video feedback and adjustments."','"description": "Run Development: individual running coaching built through observation, practice, repeated exposure and the athlete’s response."'),
]
for old,new in repls:
    if old not in s: raise SystemExit('index metadata fragment missing: '+old[:90])
    s=s.replace(old,new)
write(p,s)

replace('tests/homepage-metadata.cjs', "assert.equal(meta('og:title'), 'Run better. Get faster. Run farther. | FORM');", "assert.equal(meta('og:title'), 'Run better. | FORM');")

# Active acquisition roadmap: retire the old stacked slogan as doctrine.
p='FORM_ACQUISITION_ROADMAP.md'; s=read(p)
s=s.replace(
'1. **Run Development** — `Develop your running.` The athlete wants FORM to own an 8-week development process: assessment, plan, coaching, feedback and adjustment. Current public price: **$1,200 / 8 weeks**.',
'1. **Run Development** — `Develop your running.` FORM looks for ease, chooses the change that matters most, layers the work, and uses repeated exposure until better movement and habits belong to the athlete. Current public price: **$1,200 / 8 weeks**.'
)
s=s.replace(
'1. **Recognition / Run Development:** `Run better. Get faster. Run farther.` Real coaching/running footage; ongoing development is the destination.',
'1. **Recognition / Run Development:** `Run Development` / `Run better.` Real coaching/running footage. Speed, distance and endurance can appear through the athlete need, footage and later proof rather than being stacked into the opening line.'
)
s=s.replace(
'Generic language is acceptable when it is true and instantly understood. A line such as `Running coaching in Miami`, `Can you keep the pace?`, or `Run faster` can be better than an original line that needs decoding.',
'Generic language is acceptable for utility when it is true and instantly understood. Identity language must come from the actual practice in `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`; do not let plain utility copy become a generic definition of FORM.'
)
s=s.replace(
'**Operating principle:** Acquire enough excellent athletes to make the system legible. Give each athlete the depth of intervention their actual problem requires. **Not everything needs fixing; intervene where something is costing the runner enough to matter.** Do not acquire so many that the practice becomes worse.',
'**Operating principle:** Acquire enough excellent athletes to make the system legible without making the practice worse. **Reveal what wants to be set free:** notice what is fighting the runner, change what matters most, repeat the better pattern, and let the athlete own it.'
)
write(p,s)

# Offer vision: keep product architecture, replace generic identity framing with the real practice.
p='docs/marketing/FORM_COACHING_OFFER_VISION_2026-09-16.md'; s=read(p)
old='''## What coaching is

> **Coaching is an external pair of eyes that knows what to look for and how to build a game plan. The quality comes down to how individualized that approach is.**

This is the simple public explanation. The deeper operating model has four parts.
'''
new='''## What coaching is

> **Look for ease. Change what matters most. Repeat it until it belongs to the runner.**

Run Development is not defined by the number of workouts delivered. Brice watches for fluidity, rhythm and what is fighting the movement, chooses the highest-value change rather than correcting everything, layers cues, and uses repeated exposure until the athlete owns more of the running. The deeper operating model below explains how that judgment becomes a plan.
'''
if old not in s: raise SystemExit('offer vision coaching intro missing')
s=s.replace(old,new,1)
old='''The relationship can include:
- initial observation/assessment;
- individual running plan;
- mostly easy running used to practice cues and build consistency;
- appropriate threshold/speed work;
- endurance/long-run development;
- ongoing feedback and adjustment;
- race or capability goals where relevant.

The point is not to hand over workouts. The point is to make the athlete a better runner.
'''
new='''The relationship can include:
- observation for ease, fluidity, rhythm and the highest-value limiter;
- layered form cues and strength work when they materially change the runner;
- frequent low-dose running, including ten-minute runs when that is the useful exposure;
- appropriate threshold, speed and endurance work as the athlete is ready to express more;
- athlete report, internal state and training response alongside the numbers;
- race or capability goals where relevant.

The point is not to hand over workouts. The point is to develop the runner until more of the running belongs to them.
'''
if old not in s: raise SystemExit('offer vision Run Development list missing')
s=s.replace(old,new,1)
s=s.replace(
'This realization is ecosystem-level: **FORM is an external pair of eyes plus an individualized game plan. It uses data and feel together, intervenes selectively, and offers different legitimate depths of help. The product boundary follows the athlete\'s job, not the number of sessions.**',
'This realization is ecosystem-level: **FORM develops the runner. Look for ease, identify what is fighting the movement, change what matters most, repeat the better pattern, and let the athlete own it. Different products can offer different depths of that judgment without reducing coaching to session count.**'
)
write(p,s)

# Referral brief: preserve mechanisms, update Run Development creative to the new doctrine.
p='docs/marketing/FORM_REFERRAL_CREATIVE_BRIEF_2026-09-16.md'; s=read(p)
s=s.replace(
'Assessment → individual running plan → mostly easy practice/consistency → appropriate speed/threshold work → endurance → feedback → adjustment.',
'Look for ease → choose what matters most → layer the cue → repeat until it belongs → progress the work.'
)
old='''**Spine:**

# Run better.
# Get faster.
# Run farther.

Footage does the explaining.

**Run better:** full-body mechanics, Brice observing, authentic coaching interaction.  
**Get faster:** track rep, acceleration, timing, controlled hard running.  
**Run farther:** wider sustained running, continuation, composure.

Working rhythm for a 12–18s master:
- 0:00–0:04 Run better.
- 0:04–0:08 Get faster.
- 0:08–0:12 Run farther.
- 0:12–0:15/18 close.
'''
new='''**Spine:**

# Run Development
# Run better.

Footage does the explaining. Show the practice rather than naming every possible benefit: Brice observing, a cue or adjustment, the athlete moving with more connection, then the work continuing. Speed and distance can appear as evidence inside the film instead of additional headline claims.

Working rhythm for a 12–18s master:
- 0:00–0:04 recognition / running;
- 0:04–0:09 observation or one useful cue;
- 0:09–0:13 practice / continuation;
- 0:13–0:15/18 Run Development close.
'''
if old not in s: raise SystemExit('referral creative old spine missing')
s=s.replace(old,new,1)
s=s.replace('2. Is `Run better. Get faster. Run farther.` understood quickly?', '2. Does `Run Development` / `Run better.` create enough recognition without over-explaining the benefit?')
s=s.replace('- `Run better. Get faster. Run farther.`;', '- exact `Run Development` / `Run better.` opening treatment and which later proof should carry speed/distance;')
write(p,s)

# Historical measurement brief remains a receipt, not a current copy mandate.
p='docs/roadmap/COACHING-FUNNEL-MEASUREMENT-20260917.md'; s=read(p)
note='> **Historical copy-phase receipt:** this document records the earlier September 17 measurement/message-match phase. It does **not** define the current homepage copy. Current Run Development doctrine and sequencing live in `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md` and `docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md`. Preserve the measurement contract below; treat the old hero/supporting/reassurance copy as superseded.\n\n'
if 'Historical copy-phase receipt' not in s:
    lines=s.splitlines(True); lines.insert(1,'\n'+note); s=''.join(lines)
write(p,s)

# Connected surfaces should not turn the doctrine into a score or rigid model.
p='docs/FORM_CONNECTED_SURFACES.md'; s=read(p)
line='- **Shared coaching doctrine.** When a surface interprets running, follow `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`: look for ease, intervene selectively, layer changes, use repeated exposure and preserve athlete ownership. Do not turn the doctrine into a universal movement score or fixed visual ideal.\n'
if 'Shared coaching doctrine.' not in s:
    marker='- **Clear ownership.** Preserve coach, athlete, FORM and imported authorship per block and per observation. The Console can author/review; apps execute; the website teaches and presents explicitly approved material. These roles may evolve through a documented contract.\n'
    if marker not in s: raise SystemExit('connected surfaces marker missing')
    s=s.replace(marker, marker+line,1)
write(p,s)

print('PASS: final doctrine drift cleanup applied')
