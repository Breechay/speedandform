#!/usr/bin/env python3
"""Apply interactive upgrades to perception-manual.html."""

from pathlib import Path
import re

REPO = Path(__file__).resolve().parents[1]
HTML = REPO / "perception-manual.html"

NAV = [
    ("ch-01", "01", "Foundation"),
    ("ch-02", "02", "Principles"),
    ("ch-03", "03", "Visual Ref"),
    ("ch-04", "04", "Selection"),
    ("ch-05", "05", "Capture"),
    ("ch-06", "06", "Profiles"),
    ("ch-07", "07", "Edit"),
    ("ch-08", "08", "Color"),
    ("ch-09", "09", "Delete"),
    ("ch-10", "10", "Palette"),
    ("ch-11", "11", "LUTs"),
]

EXTRA_CSS = """
html { scroll-behavior: smooth; }
body { margin-left: 200px; }
.page { scroll-margin-top: 40px; }
#sidebar {
  position: fixed; left: 0; top: 0; width: 200px; height: 100vh;
  background: var(--cream); border-right: 1px solid var(--rule);
  padding: 32px 0 24px; z-index: 50; overflow-y: auto;
  display: flex; flex-direction: column;
}
#sidebar .nav-brand {
  font-family: 'EB Garamond', serif; font-size: 18px; letter-spacing: -0.02em;
  padding: 0 24px 24px; border-bottom: 1px solid var(--rule); margin-bottom: 16px;
}
#sidebar nav { flex: 1; }
#sidebar a {
  display: block; padding: 10px 24px;
  font-family: 'EB Garamond', serif; font-size: 12px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink-faint); text-decoration: none;
  border-left: 2px solid transparent; transition: color 0.2s, border-color 0.2s;
}
#sidebar a.active { color: var(--ink); border-left-color: var(--ink); }
#progress-bar {
  position: fixed; top: 0; left: 200px; right: 0; height: 2px;
  background: var(--ink); transform-origin: left; transform: scaleX(0);
  z-index: 100; transition: transform 0.1s linear; pointer-events: none;
}
.reveal {
  opacity: 0; transform: translateY(18px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible { opacity: 1; transform: translateY(0); }
.principle-name { cursor: pointer; display: flex; justify-content: space-between; align-items: baseline; }
.principle.collapsed .principle-body { overflow: hidden; max-height: 0; margin-bottom: 0 !important; transition: max-height 0.4s ease, margin-bottom 0.3s ease; }
.principle.open .principle-body { max-height: 2000px; }
.toggle-icon { font-family: Inter, sans-serif; font-size: 14px; font-weight: 300; color: var(--ink-faint); flex-shrink: 0; margin-left: 12px; }
@media (max-width: 900px) {
  body { margin-left: 0; }
  #sidebar { display: none; }
  #progress-bar { left: 0; }
}
"""

SIDEBAR = (
    '<div id="progress-bar"></div>\n'
    '<aside id="sidebar">\n'
    '  <div class="nav-brand">FORM</div>\n'
    '  <nav id="chapter-nav">\n'
    + "\n".join(
        f'    <a href="#{cid}" data-chapter="{cid}"><span style="opacity:0.5;margin-right:8px;">{num}</span>{label}</a>'
        for cid, num, label in NAV
    )
    + "\n  </nav>\n</aside>\n"
)

CH03_HERO = re.compile(
    r"\n  <!-- Simon full width at top — the primary reference -->\n"
    r"  <div style=\"margin-bottom:8px;\">\n"
    r"    <img src=\"/assets/perception-manual/05\.jpg\"[^>]*>\n"
    r"  </div>\n"
    r"  <div style=\"display:flex; justify-content:space-between; align-items:baseline; margin-bottom:36px;\">\n"
    r"    <div class=\"caption\" style=\"margin-bottom:0;\">Miami after rain — the canonical FORM FIELD frame\.[^<]*</div>\n"
    r"    <div style=\"font-size:9px;[^\"]*\">The grade test: remove it\. The frame survives\.</div>\n"
    r"  </div>\n",
    re.DOTALL,
)

BRANCHES = """
  <div class="rule"></div>

  <span class="label">FORM Branches</span>
  <div style="margin-top:16px;">
    <div class="branch">
      <div class="branch-name">FORM FIELD</div>
      <div class="branch-items">
        Outdoor / athletic<br>
        Rain, ocean, track, skin in motion<br>
        FIELD_HLG · FIELD_Rec709<br>
        Airy exposure · navy shadows · open highlights
      </div>
    </div>
    <div class="branch">
      <div class="branch-name">FORM STILL</div>
      <div class="branch-items">
        Interior / editorial / cultivated<br>
        Stone, glass, warm light, ceremony<br>
        STILL_HLG · STILL_Rec709<br>
        Lifted shadows · matte skin · rolled highlights
      </div>
    </div>
    <div class="branch" style="border-color: var(--ink-muted);">
      <div class="branch-name">FORM MOMENT</div>
      <div style="font-size:11px; color:var(--ink-muted); margin-bottom:12px; font-style:italic;">Under development. The editorial branch.</div>
      <div class="branch-items">
        Sunday albums<br>
        Hideout<br>
        Portraits<br>
        Hero frames<br>
        Instagram selects<br>
        Slightly richer reds<br>
        Deeper blacks<br>
        Warmer skin<br>
        Subdued greens<br>
        Subtle grain<br>
        Gentle vignette<br>
        Emotional emphasis
      </div>
      <p style="font-size:11px; color:var(--ink-muted); margin-top:14px;">The Simon frame is still FIELD. MOMENT amplifies what FIELD discovers.</p>
    </div>
  </div>
"""

LUT = """
  <div id="lut-helper" style="margin:28px 0; border:1px solid var(--rule); padding:22px;">
    <div class="label" style="margin-bottom:14px;">LUT Selector</div>
    <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
      <button type="button" onclick="selectLUT('field')" id="btn-field" style="padding:8px 16px; border:1px solid var(--ink); background:transparent; font-family:'Inter',sans-serif; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer;">Field / Outdoor</button>
      <button type="button" onclick="selectLUT('still')" id="btn-still" style="padding:8px 16px; border:1px solid var(--rule); background:transparent; font-family:'Inter',sans-serif; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; color:var(--ink-muted);">Interior / Still</button>
    </div>
    <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
      <button type="button" onclick="selectSource('hlg')" id="btn-hlg" style="padding:6px 14px; border:1px solid var(--ink); background:transparent; font-family:'Inter',sans-serif; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer;">HLG3 Source</button>
      <button type="button" onclick="selectSource('rec')" id="btn-rec" style="padding:6px 14px; border:1px solid var(--rule); background:transparent; font-family:'Inter',sans-serif; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; color:var(--ink-muted);">Rec.709 Source</button>
    </div>
    <div id="lut-result" style="font-family:'Inter',monospace; font-size:13px; padding:14px 18px; background:var(--ink); color:white; letter-spacing:0.06em;">FIELD_HLG.cube</div>
    <div style="font-size:10px; color:var(--ink-muted); margin-top:8px;">Apply at 20–40% strength. Adjust white balance after.</div>
  </div>
"""

SCRIPT = """
<script>
(function () {
  document.querySelectorAll('.page[id^="ch-"]').forEach(page => {
    Array.from(page.children).forEach(child => {
      if (child.classList.contains('page-footer')) return;
      const wrap = document.createElement('div');
      wrap.className = 'reveal';
      page.insertBefore(wrap, child);
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
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(r => revealIO.observe(r));

  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  }, { passive: true });

  const navLinks = document.querySelectorAll('#chapter-nav a');
  const pages = ['ch-01','ch-02','ch-03','ch-04','ch-05','ch-06','ch-07','ch-08','ch-09','ch-10','ch-11']
    .map(id => document.getElementById(id)).filter(Boolean);
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('active', a.dataset.chapter === e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
  pages.forEach(p => navIO.observe(p));

  document.querySelectorAll('.principle').forEach(principle => {
    const name = principle.querySelector('.principle-name');
    if (!name) return;
    principle.querySelectorAll('p').forEach(p => p.classList.add('principle-body'));
    principle.classList.add('collapsed');
    name.insertAdjacentHTML('beforeend', '<span class="toggle-icon">+</span>');
    name.addEventListener('click', () => {
      const open = !principle.classList.contains('open');
      principle.classList.toggle('open', open);
      principle.classList.toggle('collapsed', !open);
      name.querySelector('.toggle-icon').textContent = open ? '−' : '+';
    });
  });
})();

let lutMode = 'field', lutSrc = 'hlg';
function updateLUT() {
  const map = {
    field: { hlg: 'FIELD_HLG.cube', rec: 'FIELD_Rec709.cube' },
    still: { hlg: 'STILL_HLG.cube', rec: 'STILL_Rec709.cube' }
  };
  document.getElementById('lut-result').textContent = map[lutMode][lutSrc];
}
function selectLUT(v) {
  lutMode = v;
  ['field', 'still'].forEach(id => {
    const btn = document.getElementById('btn-' + id);
    btn.style.borderColor = id === v ? 'var(--ink)' : 'var(--rule)';
    btn.style.color = id === v ? 'var(--ink)' : 'var(--ink-muted)';
  });
  updateLUT();
}
function selectSource(v) {
  lutSrc = v;
  ['hlg', 'rec'].forEach(id => {
    const btn = document.getElementById('btn-' + id);
    btn.style.borderColor = id === v ? 'var(--ink)' : 'var(--rule)';
    btn.style.color = id === v ? 'var(--ink)' : 'var(--ink-muted)';
  });
  updateLUT();
}
</script>
"""


def main() -> None:
    html = HTML.read_text(encoding="utf-8")

    html = html.replace(
        ".display {\n  font-family: 'EB Garamond', serif;\n  font-size: 80px;",
        ".display {\n  font-family: 'EB Garamond', serif;\n  font-size: clamp(48px, 7vw, 80px);",
    )
    html = html.replace(
        "@media print { .page { page-break-after: always; } }",
        EXTRA_CSS + "\n@media print { .page { page-break-after: always; } }",
    )

    if 'id="progress-bar"' not in html:
        html = html.replace("<body>\n", "<body>\n" + SIDEBAR)

    page_ids = ["cover"] + [n[0] for n in NAV]
    for pid in page_ids:
        html, n = re.subn(
            r'<div class="page"(?!\s+id=)',
            f'<div class="page" id="{pid}"',
            html,
            count=1,
        )
        if n != 1:
            raise SystemExit(f"Failed to assign id={pid}")

    html = CH03_HERO.sub("\n", html)

    if "FORM MOMENT" not in html:
        html = html.replace(
            '  <span class="label">Never</span>\n  <div style="margin-top:10px;">\n    <div class="never-item"><span class="never-dash">—</span><span>Teal-orange split tone',
            BRANCHES + '\n  <span class="label">Never</span>\n  <div style="margin-top:10px;">\n    <div class="never-item"><span class="never-dash">—</span><span>Teal-orange split tone',
            1,
        )

    if "lut-helper" not in html:
        html = html.replace(
            '  <p style="font-size:11px; color:var(--ink-muted); margin-bottom:24px;">Apply at 20–40% strength. Adjust white balance after LUT.</p>\n\n  <div class="rule"></div>\n\n  <span class="label">Lightroom Presets',
            '  <p style="font-size:11px; color:var(--ink-muted); margin-bottom:24px;">Apply at 20–40% strength. Adjust white balance after LUT.</p>\n' + LUT + '\n  <div class="rule"></div>\n\n  <span class="label">Lightroom Presets',
            1,
        )

    if "lut-helper" not in html and "<script>" not in html:
        pass

    if "<script>" not in html:
        html = html.replace("</body>", SCRIPT + "\n</body>")

    HTML.write_text(html, encoding="utf-8")
    print(f"OK → {HTML} ({HTML.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
