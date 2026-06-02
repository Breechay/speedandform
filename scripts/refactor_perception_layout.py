#!/usr/bin/env python3
"""Apply layout architecture refactor to perception-manual.html."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "perception-manual.html"

NEW_CSS = r"""*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #F5F2EC;
  --ink: #1A1A18;
  --ink-mid: #4A4A48;
  --ink-muted: #6B6B68;
  --ink-faint: #B0AFA8;
  --rule: #D8D4CC;
  --sidebar-w: 236px;
  --content-max: 960px;
  --page-v: 96px;
  --page-h: clamp(28px, 5vw, 72px);
}

html {
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
  background: var(--cream);
}

body {
  font-family: 'EB Garamond', serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.8;
  background: var(--cream);
  color: var(--ink);
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}

/* ── LAYOUT SHELL ─────────────────── */
#shell {
  margin-left: var(--sidebar-w);
  min-height: 100vh;
}

/* ── PAGE WRAPPER ─────────────────── */
.page {
  border-bottom: 1px solid var(--rule);
  position: relative;
  page-break-after: always;
}
.page:last-child { border-bottom: none; }

.page-inner {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--page-v) var(--page-h);
}

/* ── SIDEBAR ─────────────────────── */
#sidebar {
  position: fixed;
  left: 0; top: 0;
  width: var(--sidebar-w);
  height: 100vh;
  background: var(--cream);
  border-right: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow-y: auto;
  overflow-x: hidden;
}

#sidebar .nav-brand {
  font-family: 'EB Garamond', serif;
  font-size: 20px;
  letter-spacing: -0.02em;
  padding: 32px 28px 24px;
  border-bottom: 1px solid var(--rule);
  flex-shrink: 0;
}

#sidebar nav {
  flex: 1;
  padding: 12px 0 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

#sidebar a {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 28px;
  font-size: 10px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ink-faint);
  text-decoration: none;
  border-left: 2px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s, border-color 0.15s;
  font-family: 'EB Garamond', serif;
}

#sidebar a .nav-num {
  opacity: 0.4;
  font-size: 9px;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

#sidebar a:hover { color: var(--ink-mid); }
#sidebar a.active { color: var(--ink); border-left-color: var(--ink); }

/* ── PROGRESS BAR ────────────────── */
#progress-bar {
  position: fixed;
  top: 0;
  left: var(--sidebar-w);
  right: 0;
  height: 1px;
  background: var(--ink);
  transform-origin: left;
  transform: scaleX(0);
  z-index: 100;
  transition: transform 0.08s linear;
  pointer-events: none;
}

/* ── SCROLL MARGIN ───────────────── */
.page[id] { scroll-margin-top: 40px; }

/* ── TYPOGRAPHY ──────────────────── */
.display {
  font-family: 'EB Garamond', serif;
  font-size: clamp(52px, 6vw, 80px);
  font-weight: 400;
  letter-spacing: -2px;
  line-height: 0.9;
}

.chapter-num {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 20px;
  font-family: 'EB Garamond', serif;
}

.chapter-title {
  font-family: 'EB Garamond', serif;
  font-size: 42px;
  font-weight: 400;
  line-height: 1.0;
  margin-bottom: 8px;
}

.chapter-sub {
  font-size: 11px;
  font-weight: 400;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
  margin-bottom: 52px;
  font-family: 'EB Garamond', serif;
}

.lead {
  font-family: 'EB Garamond', serif;
  font-size: 21px;
  line-height: 1.5;
  margin-bottom: 40px;
}

.pullquote {
  font-family: 'EB Garamond', serif;
  font-style: italic;
  font-size: 20px;
  line-height: 1.55;
  border-left: 1px solid var(--ink);
  padding-left: 24px;
  margin: 40px 0;
  max-width: 600px;
}

.label {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 12px;
  display: block;
  font-family: 'EB Garamond', serif;
}

p {
  margin-bottom: 1.1em;
  font-size: 15px;
  line-height: 1.9;
  font-family: 'EB Garamond', serif;
}

/* ── DIVIDERS ────────────────────── */
.rule { height: 1px; background: var(--rule); margin: 40px 0; }
.rule-ink { height: 1px; background: var(--ink); margin: 40px 0; }

/* ── GRID LAYOUTS ────────────────── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 52px;
}

@media (max-width: 700px) {
  .two-col { grid-template-columns: 1fr; gap: 36px; }
}

/* ── TABLES ──────────────────────── */
.spec-table { width: 100%; border-collapse: collapse; }
.spec-table td {
  padding: 10px 0;
  border-bottom: 1px solid var(--rule);
  font-size: 13px;
  vertical-align: top;
  line-height: 1.6;
  font-family: 'EB Garamond', serif;
}
.spec-table td:first-child {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ink-muted);
  width: 115px;
  padding-right: 22px;
  white-space: nowrap;
  font-family: 'EB Garamond', serif;
}
.spec-table tr:last-child td { border-bottom: none; }

/* ── IMAGE GRIDS ─────────────────── */
.ref-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin: 28px 0;
}
.ref-item img { width: 100%; display: block; }
.ref-label {
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-top: 8px;
  font-family: 'EB Garamond', serif;
}
.ref-desc {
  font-size: 11px;
  color: var(--ink-mid);
  margin-top: 3px;
  line-height: 1.55;
  font-family: 'EB Garamond', serif;
}
.caption {
  font-size: 10px;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
  margin-top: 8px;
  margin-bottom: 20px;
  font-family: 'EB Garamond', serif;
}

/* ── PRINCIPLES (ch-02) ──────────── */
.principle {
  padding-bottom: 28px;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--rule);
}
.principle:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
.principle-num {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-bottom: 4px;
  font-family: 'EB Garamond', serif;
}
.principle-name {
  font-family: 'EB Garamond', serif;
  font-size: 26px;
  font-weight: 400;
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.toggle-icon {
  font-size: 14px;
  font-weight: 300;
  color: var(--ink-faint);
  flex-shrink: 0;
  margin-left: 12px;
  font-family: 'EB Garamond', serif;
}
.principle.collapsed .principle-body {
  overflow: hidden;
  max-height: 0;
  margin-bottom: 0 !important;
  transition: max-height 0.4s ease, margin-bottom 0.3s ease;
}
.principle.open .principle-body { max-height: 2000px; }

/* ── LIST ITEMS ──────────────────── */
.shot-item { margin-bottom: 20px; }
.shot-num { font-size: 9px; letter-spacing: 0.14em; color: var(--ink-faint); text-transform: uppercase; font-family: 'EB Garamond', serif; }
.shot-name { font-family: 'EB Garamond', serif; font-size: 18px; margin: 4px 0; }
.shot-desc { font-size: 12px; color: var(--ink-muted); line-height: 1.6; font-family: 'EB Garamond', serif; }

.select-item {
  font-size: 13px;
  padding: 10px 0;
  border-bottom: 1px solid var(--rule);
  display: flex;
  gap: 14px;
  align-items: baseline;
  font-family: 'EB Garamond', serif;
}
.select-dot {
  width: 3px; height: 3px; border-radius: 50%;
  background: var(--ink-faint); margin-top: 10px; flex-shrink: 0;
}
.delete-item {
  font-size: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-muted);
  display: flex;
  gap: 16px;
  font-family: 'EB Garamond', serif;
}
.delete-x { font-size: 9px; letter-spacing: 0.1em; color: var(--ink-faint); flex-shrink: 0; padding-top: 1px; font-family: 'EB Garamond', serif; }
.never-item {
  font-size: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-muted);
  display: flex;
  gap: 18px;
  font-family: 'EB Garamond', serif;
}
.never-dash { color: var(--ink-faint); flex-shrink: 0; }

/* ── CAMERA PROFILES ─────────────── */
.cam-profile { border-left: 1px solid var(--ink); padding-left: 20px; margin-bottom: 28px; }
.cam-profile-name { font-size: 9px; font-weight: 400; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 10px; font-family: 'EB Garamond', serif; }

/* ── LUT BLOCKS ──────────────────── */
.lut-block { border: 1px solid var(--rule); padding: 24px; margin-bottom: 18px; }
.lut-name { font-family: 'EB Garamond', serif; font-size: 20px; margin-bottom: 4px; }
.lut-file { font-family: 'EB Garamond', serif; font-size: 10px; color: var(--ink-muted); margin-bottom: 14px; letter-spacing: 0.06em; }

/* ── TOC ─────────────────────────── */
.toc-item {
  display: flex;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--rule);
  align-items: baseline;
}
.toc-num { font-size: 10px; color: var(--ink-faint); width: 28px; flex-shrink: 0; font-family: 'EB Garamond', serif; }
.toc-title { font-size: 14px; font-family: 'EB Garamond', serif; }

/* ── PALETTE SWATCHES ────────────── */
.palette-row { display: flex; gap: 0; margin-bottom: 28px; }
.swatch { height: 28px; flex: 1; position: relative; }
.swatch-label {
  position: absolute; bottom: -36px; left: 0;
  font-size: 8px; color: var(--ink-muted); white-space: nowrap; line-height: 1.3;
  font-family: 'EB Garamond', serif;
}

/* ── BRANCH BLOCKS ───────────────── */
.branch { border-top: 1px solid var(--ink); padding-top: 18px; margin-bottom: 28px; }
.branch-name { font-family: 'EB Garamond', serif; font-size: 22px; margin-bottom: 10px; }
.branch-items { font-size: 12px; color: var(--ink-muted); line-height: 2.1; columns: 2; font-family: 'EB Garamond', serif; }

/* ── PAGE FOOTER ─────────────────── */
.page-footer {
  margin-top: 64px;
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-faint);
  font-family: 'EB Garamond', serif;
}

/* ── REVEALS ─────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal.visible { opacity: 1; transform: translateY(0); }

/* ── CINEMA SIBLING BLOCK ─────────── */
.doctrine-link {
  border: 1px solid var(--rule);
  padding: 20px 24px;
  margin-top: 40px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: baseline;
}
.doctrine-link-title { font-family: 'EB Garamond', serif; font-size: 16px; margin-bottom: 4px; }
.doctrine-link-desc { font-size: 11px; color: var(--ink-muted); line-height: 1.6; font-family: 'EB Garamond', serif; }
.doctrine-link-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); white-space: nowrap; font-family: 'EB Garamond', serif; }

/* ── MOBILE ──────────────────────── */
@media (max-width: 900px) {
  #shell { margin-left: 0; }
  #sidebar { display: none; }
  #progress-bar { left: 0; }
  .page-inner { padding: 60px 24px; }
  .two-col { grid-template-columns: 1fr; gap: 32px; }
  .ref-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 480px) {
  .ref-grid { grid-template-columns: 1fr; }
  .chapter-title { font-size: 32px; }
}

@media print { .page { page-break-after: always; } }"""

NEW_NAV = """  <nav id="chapter-nav">
    <a href="#ch-00" data-chapter="ch-00"><span class="nav-num">00</span>Order</a>
    <a href="#ch-00b" data-chapter="ch-00b"><span class="nav-num">00b</span>Mythology</a>
    <a href="#ch-01" data-chapter="ch-01"><span class="nav-num">01</span>Foundation</a>
    <a href="#ch-02" data-chapter="ch-02"><span class="nav-num">02</span>Principles</a>
    <a href="#ch-03" data-chapter="ch-03"><span class="nav-num">03</span>Visual Ref</a>
    <a href="#ch-04" data-chapter="ch-04"><span class="nav-num">04</span>Selection</a>
    <a href="#ch-04b" data-chapter="ch-04b"><span class="nav-num">04b</span>Contexts</a>
    <a href="#ch-05" data-chapter="ch-05"><span class="nav-num">05</span>Capture</a>
    <a href="#ch-06" data-chapter="ch-06"><span class="nav-num">06</span>Profiles</a>
    <a href="#ch-07" data-chapter="ch-07"><span class="nav-num">07</span>Edit</a>
    <a href="#ch-08" data-chapter="ch-08"><span class="nav-num">08</span>Color</a>
    <a href="#ch-09" data-chapter="ch-09"><span class="nav-num">09</span>Delete</a>
    <a href="#ch-10" data-chapter="ch-10"><span class="nav-num">10</span>Palette</a>
    <a href="#ch-11" data-chapter="ch-11"><span class="nav-num">11</span>LUTs</a>
  </nav>"""

NEW_SCRIPT = """<script>
(function () {
  'use strict';

  // Reveal on scroll
  document.querySelectorAll('.page[id^="ch-"]').forEach(page => {
    const inner = page.querySelector('.page-inner');
    if (!inner) return;
    Array.from(inner.children).forEach(child => {
      if (child.classList.contains('page-footer')) return;
      if (child.classList.contains('doctrine-link')) return;
      const wrap = document.createElement('div');
      wrap.className = 'reveal';
      inner.insertBefore(wrap, child);
      wrap.appendChild(child);
    });
  });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(r => revealIO.observe(r));

  // Progress bar
  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    if (bar && max > 0) bar.style.transform = 'scaleX(' + (window.scrollY / max) + ')';
  }, { passive: true });

  // Active nav
  const navLinks = document.querySelectorAll('#chapter-nav a');
  const pageIds = ['ch-00','ch-00b','ch-01','ch-02','ch-03','ch-04','ch-04b','ch-05','ch-06','ch-07','ch-08','ch-09','ch-10','ch-11'];
  const pages = pageIds.map(id => document.getElementById(id)).filter(Boolean);

  const navIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('active', a.dataset.chapter === e.target.id));
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  pages.forEach(p => navIO.observe(p));

  // Collapsible principles (ch-02 only)
  document.querySelectorAll('#ch-02 .principle').forEach(principle => {
    const name = principle.querySelector('.principle-name');
    if (!name) return;
    principle.querySelectorAll('p').forEach(p => p.classList.add('principle-body'));
    principle.classList.add('collapsed');
    name.insertAdjacentHTML('beforeend', '<span class="toggle-icon">+</span>');
    name.addEventListener('click', () => {
      const open = !principle.classList.contains('open');
      principle.classList.toggle('open', open);
      principle.classList.toggle('collapsed', !open);
      const icon = name.querySelector('.toggle-icon');
      if (icon) icon.textContent = open ? '−' : '+';
    });
  });
})();

// LUT selector
let lutMode = 'field', lutSrc = 'hlg';
function updateLUT() {
  const map = {
    field: { hlg: 'FIELD_HLG.cube', rec: 'FIELD_Rec709.cube' },
    still: { hlg: 'STILL_HLG.cube', rec: 'STILL_Rec709.cube' }
  };
  const el = document.getElementById('lut-result');
  if (el) el.textContent = map[lutMode][lutSrc];
}
function selectLUT(v) {
  lutMode = v;
  ['field','still'].forEach(id => {
    const btn = document.getElementById('btn-' + id);
    if (btn) {
      btn.style.borderColor = id === v ? 'var(--ink)' : 'var(--rule)';
      btn.style.color = id === v ? 'var(--ink)' : 'var(--ink-muted)';
    }
  });
  updateLUT();
}
function selectSource(v) {
  lutSrc = v;
  ['hlg','rec'].forEach(id => {
    const btn = document.getElementById('btn-' + id);
    if (btn) {
      btn.style.borderColor = id === v ? 'var(--ink)' : 'var(--rule)';
      btn.style.color = id === v ? 'var(--ink)' : 'var(--ink-muted)';
    }
  });
  updateLUT();
}
</script>"""

STUDIO_BLOCK = """
  <div class="doctrine-link">
    <div>
      <div class="doctrine-link-title">Studio, not site</div>
      <div class="doctrine-link-desc">FORM is the front door. Studio is the back room. Training pages stay compressed and athlete-facing. The perception manual holds the authored worldview — how things are seen, selected, shot, edited, and remembered. It connects FORM, Hideout, cinema, and personal practice without turning them into a public biography.</div>
    </div>
    <div class="doctrine-link-label">Context</div>
  </div>
"""

CINEMA_BLOCK = """
  <div class="doctrine-link">
    <div>
      <div class="doctrine-link-title">Cinema Doctrine — When It Matters</div>
      <div class="doctrine-link-desc">A sibling document. Perception manual studies the frame — order, atmosphere, capture, color. Cinema doctrine studies people on screen — conduct, ensemble, inference, stillness, service ritual. They meet at director's notes: author the environment, earn the stillness, let ritual reveal character. Vitality under containment. The conversation is never about what it's about.</div>
    </div>
    <div class="doctrine-link-label">Sibling doc</div>
  </div>
"""


def replace_style(text: str) -> str:
    return re.sub(r"<style>.*?</style>", f"<style>\n{NEW_CSS}\n</style>", text, count=1, flags=re.DOTALL)


def replace_nav(text: str) -> str:
    return re.sub(r"<nav id=\"chapter-nav\">.*?</nav>", NEW_NAV, text, count=1, flags=re.DOTALL)


def wrap_chapter_pages(text: str) -> str:
    pattern = re.compile(
        r'(<div class="page" id="(ch-[^"]+)">\n)(.*?)(\n</div>\n\n(?:<!--|</div>))',
        re.DOTALL,
    )

    def repl(m: re.Match[str]) -> str:
        inner = m.group(3)
        if inner.strip().startswith('<div class="page-inner">'):
            return m.group(0)
        return f'{m.group(1)}  <div class="page-inner">\n{inner.rstrip()}\n  </div>{m.group(4)}'

    return pattern.sub(repl, text)


def add_shell(text: str) -> str:
    if 'id="shell"' not in text:
        text = text.replace(
            '</aside>\n\n<!-- ══════════════════════════════\n     COVER',
            '</aside>\n\n<div id="shell">\n\n<!-- ══════════════════════════════\n     COVER',
        )
        text = text.replace(
            '</div>\n\n\n<script>',
            '</div>\n\n</div>\n\n\n<script>',
            1,
        )
    return text


def insert_doctrine_blocks(text: str) -> str:
    if 'Studio, not site' not in text:
        text = re.sub(
            r'(<div class="page" id="ch-00b">.*?)(  <div class="page-footer"><span>Form</span><span>00b)',
            lambda m: m.group(1) + STUDIO_BLOCK + '\n' + m.group(2),
            text,
            count=1,
            flags=re.DOTALL,
        )
    if 'Cinema Doctrine — When It Matters' not in text:
        text = re.sub(
            r'(<div class="page" id="ch-07">.*?)(  <div class="page-footer"><span>Form</span><span>07)',
            lambda m: m.group(1) + CINEMA_BLOCK + '\n' + m.group(2),
            text,
            count=1,
            flags=re.DOTALL,
        )
    return text


def replace_script(text: str) -> str:
    return re.sub(r"<script>.*?</script>", NEW_SCRIPT, text, count=1, flags=re.DOTALL)


def main() -> None:
    text = HTML.read_text(encoding="utf-8")
    text = replace_style(text)
    text = replace_nav(text)
    text = wrap_chapter_pages(text)
    text = add_shell(text)
    text = insert_doctrine_blocks(text)
    text = replace_script(text)
    HTML.write_text(text, encoding="utf-8")
    print(f"Updated {HTML}")


if __name__ == "__main__":
    main()
