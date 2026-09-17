from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def insert_once(path, marker, addition):
    s = read(path)
    if addition.strip() in s:
        return
    if marker not in s:
        raise SystemExit(f"{path}: missing marker")
    write(path, s.replace(marker, marker + addition, 1))


# Homepage: hero -> doctrine. Simon remains valid evidence elsewhere,
# but no longer interrupts the homepage before FORM explains itself.
p = "index.html"
s = read(p)
s, n = re.subn(
    r'\n<section class="result" id="simon".*?</section>\n\n(?=<section class="practice" id="practice">)',
    "\n",
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("index: Simon result block not found exactly once")

new_practice = '''<section class="practice" id="practice">
  <div class="wrap practice-grid">
    <div class="practice-title">
      <div class="eyebrow">01 / The Practice</div>
      <h2>I develop<br>runners.</h2>
      <p>I look for ease.</p>
      <div class="arguments">
        <div class="argument"><b>01</b><div><strong>Running should click.</strong><p>Fluid. Connected. Nothing fighting the run.</p></div></div>
        <div class="argument"><b>02</b><div><strong>Change what matters most.</strong><p>Not five things at once.</p></div></div>
        <div class="argument"><b>03</b><div><strong>Repeat it until it belongs to you.</strong><p>Ten minutes counts.</p></div></div>
      </div>
      <p class="practice-manifesto">Reveal what wants to be set free.</p>
    </div>
    <figure class="practice-photo">
      <img src="/assets/home/practice/running-practice.webp" width="2048" height="1350" loading="lazy" decoding="async" alt="A runner training outdoors in Miami">
      <figcaption>FORM · In practice · Miami</figcaption>
    </figure>
  </div>
</section>'''
s, n = re.subn(r'<section class="practice" id="practice">.*?</section>', new_practice, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit("index: practice section not found exactly once")
write(p, s)

# Give the manifesto line enough visual weight without adding more copy.
p = "css/homepage.css"
s = read(p)
rule = ".practice-manifesto{font:400 30px/1.2 var(--serif)!important;letter-spacing:-.03em;color:var(--ink)!important;max-width:16ch!important;margin-top:34px!important}"
if rule not in s:
    anchor = ".practice-photo{width:100%}"
    if anchor not in s:
        raise SystemExit("homepage.css: practice anchor missing")
    s = s.replace(anchor, rule + "\n" + anchor, 1)
write(p, s)

# Release invariant: one hero film, no homepage Simon interstitial, manifesto first.
p = "tests/homepage-release.cjs"
s = read(p)
s = s.replace(
    "assert.match(html,/An inquiry only. No payment or booking yet./);\n",
    "assert.doesNotMatch(html,/An inquiry only\\. No payment or booking yet\\./);\n",
)
s = s.replace(
    "assert.match(html,/Moving time and average pace from Simon/);\n",
    'assert.doesNotMatch(html,/id="simon"/);\nassert.match(html,/I develop<br>runners\\./);\nassert.match(html,/Reveal what wants to be set free\\./);\n',
)
write(p, s)

# Paid continuation still changes only the film. The next section is doctrine.
p = "tests/meta-landing-browser.py"
s = read(p)
old = '''                # The paid treatment must not rewrite evidence below the fold.
                assert page.locator('#simon h2').inner_text() == '1:26.'
                assert page.locator('#simon .result-goal').inner_text() == 'The goal was sub-1:30.'
                assert page.locator('#simon .result-metrics').inner_text().replace('\\n', ' ').find('6:35') >= 0
'''
new = '''                # The paid treatment must not rewrite the coaching doctrine below the fold.
                assert page.locator('#simon').count() == 0
                assert page.locator('#practice h2').inner_text() == 'I develop\\nrunners.'
                assert page.locator('#practice .practice-manifesto').inner_text() == 'Reveal what wants to be set free.'
'''
if old not in s:
    raise SystemExit("meta landing: Simon assertion block missing")
s = s.replace(old, new, 1).replace("vetted proof and inquiry entry", "manifesto flow and inquiry entry")
write(p, s)

# Copy acceptance explicitly protects the source doctrine from generic drift.
p = "tests/coaching-copy.cjs"
s = read(p)
marker = 'assert.doesNotMatch(html, /Running coaching with Brice\\.<br>Miami \\+ Remote/);'
addition = '''
assert.doesNotMatch(html, /id="simon"/);
assert.match(html, /<h2>I develop<br>runners\.<\\/h2>/);
assert.match(html, /I look for ease\./);
assert.match(html, /Running should click\./);
assert.match(html, /Not five things at once\./);
assert.match(html, /Ten minutes counts\./);
assert.match(html, /Reveal what wants to be set free\./);'''
if addition.strip() not in s:
    if marker not in s:
        raise SystemExit("coaching-copy: doctrine marker missing")
    s = s.replace(marker, marker + addition, 1)
write(p, s)

# Canonical doc pointers and supersession notes.
manifesto_note = '''

> **September 17 doctrine overlay:** read [`docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`](../FORM_RUN_DEVELOPMENT_MANIFESTO.md). It is the newer authority for how Run Development is understood and described: ease, fluidity, selective high-impact change, layered cues, repeated exposure, internal state and athlete ownership. Product facts and evidence boundaries in this document remain valid; generic descriptions of coaching do not override the manifesto.
'''
insert_once(
    "docs/marketing/FORM_COACHING_OFFER_VISION_2026-09-16.md",
    "**Applies to:** speedandform.com, Run Development, FORM Analysis, Instagram/Meta acquisition, referrals, assessments, future app/Console connections",
    manifesto_note,
)

p = "docs/marketing/FORM_COACHING_OFFER_VISION_2026-09-16.md"
s = read(p)
old = '''### Creative A — Recognition / Run Development

**Spine:**

> Run better.  
> Get faster.  
> Run farther.
'''
new = '''### Creative A — Recognition / Run Development

**Spine:**

> Run Development  
> Run better.

Speed, distance and endurance can appear through the footage, athlete need and later proof. Do not stack every possible benefit into the opening line.
'''
if old in s:
    s = s.replace(old, new, 1)
write(p, s)

commercial_note = '''

> **September 17 coaching doctrine:** `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md` is now required reading for Run Development acquisition and homepage work. Keep the offer facts and measurement contracts here; use the manifesto for coaching philosophy, voice and page sequencing. The Miami campaign landing page was not static through the full test, so later analysis must identify the landing revision when comparing session quality.
'''
insert_once(
    "docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md",
    "**Owner:** Brice / Speed & Form  ",
    commercial_note,
)
p = "docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md"
s = read(p)
s = s.replace(
    "2. **Miami Run Development is the live coaching control.** Do not rewrite a campaign that is attracting traffic and has produced a genuine inquiry.",
    "2. **Miami Run Development is the live coaching control.** Keep campaign budget/audience changes evidence-led. September 17 intentionally compresses the landing experience after direct mobile review and weak post-click engagement; do not treat the landing page as unchanged across the entire test.",
)
s = s.replace(
    "- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`",
    "- `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`\n- `docs/marketing/ATHLETE_LANGUAGE_RULE.md`",
    1,
)
if "## September 17 landing doctrine pass" not in s:
    anchor = "# B. Miami Run Development — LIVE CONTROL\n"
    block = '''# B. Miami Run Development — LIVE CONTROL

## September 17 landing doctrine pass

Source work on `work/mobile-hero-cut-20260917` deliberately reduces explanation density. The intended sequence is **hero → I develop runners → coaching/practice → training → offer → inquiry**. Simon remains valid evidence elsewhere but is no longer forced into position two on the homepage. The hero uses `Run Development` / `Run better.` / fee / one action. This is a source-state note only until production deployment is separately verified.

'''
    if anchor not in s:
        raise SystemExit("commercial: Miami heading missing")
    s = s.replace(anchor, block, 1)
write(p, s)

roadmap_note = '''

**September 17 homepage doctrine source:** [`FORM Run Development Manifesto`](../FORM_RUN_DEVELOPMENT_MANIFESTO.md) is canonical for coaching philosophy and identity language. The active homepage refinement removes the forced Simon second-position proof block, goes hero → `I develop runners`, replaces generic practice copy with Brice's ease/layering/repetition language, and keeps Simon's evidence available elsewhere. Branch/source state is not a production claim; release receipt still owns deployment status.
'''
p = "docs/roadmap/FORM-ROADMAP.md"
s = read(p)
if roadmap_note.strip() not in s:
    marker = "Updated September 14, 2026. Owner: Brice. Maintainer: the agent completing relevant work."
    if marker not in s:
        raise SystemExit("roadmap marker missing")
    s = s.replace(marker, marker + roadmap_note, 1)
write(p, s)

for path in [
    "docs/ATHLETE_COACHING_SYSTEM.md",
    "docs/CURSOR_CONTEXT.md",
    "FORM_ACQUISITION_ROADMAP.md",
    "docs/marketing/FORM_REFERRAL_CREATIVE_BRIEF_2026-09-16.md",
]:
    s = read(path)
    note = "> **Run Development doctrine:** read `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md` before generating coaching philosophy, identity copy or athlete-development language.\n\n"
    if "FORM_RUN_DEVELOPMENT_MANIFESTO.md" not in s:
        lines = s.splitlines(True)
        lines.insert(1, "\n" + note)
        write(path, "".join(lines))

for path in [
    "docs/audits/HOME-SINGLE-RUNNER-20260916.md",
    "docs/audits/HOME-COACHING-FLOW-AUDIT.md",
]:
    s = read(path)
    note = "> **Superseded for current homepage sequence:** September 17 source doctrine is `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`. This audit remains a historical release receipt; its proof-first/Simon placement is not a current content requirement.\n\n"
    if "Superseded for current homepage sequence" not in s:
        lines = s.splitlines(True)
        lines.insert(1, "\n" + note)
        write(path, "".join(lines))

print("PASS: manifesto applied downstream")
