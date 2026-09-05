#!/usr/bin/env python3
"""Export a rendered surface as one standalone HTML file.

Not a mockup and not a re-render: Chrome loads the real review package, the real
labs.js builds the real DOM from production data, and this dumps what it built.
The stylesheet is inlined, the fonts and the portrait become data URIs, and the
scripts are dropped — so the result opens from the filesystem with no server and
can be edited in any editor.

What is deliberately lost: the session drawer, week navigation and the athlete
toggle, all of which are JavaScript. This is a surface to look at and rewrite,
not to operate. The live package is still the place to check behaviour.

    python3 scripts/export_plan_html.py                       # José's plan, coach
    python3 scripts/export_plan_html.py --who hope --as athlete
    python3 scripts/export_plan_html.py --route '#/a/jose/week/8' --name week-8
"""
import argparse, base64, io, os, re, shutil, subprocess, sys, time, mimetypes

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG = os.path.join(ROOT, 'form-labs-design-review')
OUT = os.path.join(ROOT, 'form-labs-plan-html')
STANDALONE = os.path.join(OUT, 'standalone')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

ap = argparse.ArgumentParser()
ap.add_argument('--who', default='jose')
ap.add_argument('--as', dest='lens', default='coach', choices=['coach', 'athlete'])
ap.add_argument('--route')
ap.add_argument('--name')
ap.add_argument('--base', default='http://localhost:4321/form-labs-design-review/')
ap.add_argument('--width', type=int, default=1600)
ap.add_argument('--inline', action='store_true',
                help='one self-contained file (fonts and CSS embedded) instead of '
                     'linking the shared, editable assets/labs.css')
args = ap.parse_args()

route = args.route or f'#/a/{args.who}/plan'
name = args.name or f"{route.strip('#/').replace('/', '-')}-{args.lens}"
url = f"{args.base}?as={args.lens}{route}"

# ── 1 · let the real renderer build the real DOM ───────────────────────────
# Chrome writes the DOM and then does not exit on this machine — the same
# behaviour that made the screenshot harness hang. So it is launched detached,
# its output watched until it stops growing, and then killed.
profile = f'/tmp/export-{name}'
dump = f'/tmp/export-{name}.html'
subprocess.run(['rm', '-rf', profile, dump], check=False)
with open(dump, 'w') as sink:
    proc = subprocess.Popen([
        CHROME, '--headless=new', '--disable-gpu', '--no-sandbox',
        f'--user-data-dir={profile}', f'--window-size={args.width},1200',
        '--virtual-time-budget=12000', '--dump-dom', url],
        stdout=sink, stderr=subprocess.DEVNULL)
    last, stable = -1, 0
    for _ in range(60):
        time.sleep(1)
        size = os.path.getsize(dump)
        if size > 0 and size == last:
            stable += 1
            if stable >= 2: break
        else:
            stable = 0
        last = size
        if proc.poll() is not None: break
    proc.kill(); proc.wait()
dom = io.open(dump, encoding='utf-8').read()
subprocess.run(['rm', '-rf', profile, dump], check=False)

if 'READING THE BENCH' in dom or '<main' not in dom:
    sys.exit(f'the surface did not render — is the dev server up at {args.base}?')

# ── 2 · the stylesheet ─────────────────────────────────────────────────────
# By default it stays a real file that all the exports share, because the point
# of this export is to be edited: one stylesheet, five surfaces, change it once.
# --inline embeds it for a single file that travels on its own.
css = io.open(os.path.join(PKG, 'assets/css/labs.css'), encoding='utf-8').read()

def data_uri(path, mime=None):
    with open(path, 'rb') as fh:
        return f"data:{mime or mimetypes.guess_type(path)[0]};base64,{base64.b64encode(fh.read()).decode()}"

if args.inline:
    for font in os.listdir(os.path.join(PKG, 'assets/fonts')):
        css = css.replace(f'../fonts/{font}',
                          data_uri(os.path.join(PKG, 'assets/fonts', font), 'font/woff2'))

# ── 3 · the portrait ───────────────────────────────────────────────────────
# Re-encoded to 480px wide. It is drawn at 62 × 78 and the source is 3 MB; the
# full file would be 4 MB of base64 for no visible difference, and a 15 MB HTML
# file is not a thing anyone edits.
def portrait_uri(rel):
    src = os.path.join(PKG, rel)
    if not os.path.exists(src): return None
    try:
        from PIL import Image
        img = Image.open(src).convert('RGB')
        if img.width > 480:
            img = img.resize((480, round(img.height * 480 / img.width)), Image.LANCZOS)
        buf = io.BytesIO(); img.save(buf, 'JPEG', quality=88)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        return data_uri(src)

for rel in re.findall(r'src="(assets/images/portraits/[^"]+)"', dom):
    uri = portrait_uri(rel)
    if uri: dom = dom.replace(f'src="{rel}"', f'src="{uri}"')

# ── 4 · strip what only a server and a script engine can honour ────────────
dom = re.sub(r'<script.*?</script>', '', dom, flags=re.S)
dom = re.sub(r'<link[^>]+rel="(?:stylesheet|preload)"[^>]*>', '', dom)
dom = re.sub(r'<!--.*?design-review package.*?-->', '', dom, flags=re.S)

banner = f"""<!--
  FORM LABS — {route}  ·  {args.lens} view  ·  exported {time.strftime('%d %B %Y')}
  Rendered by the real coach/labs/labs.js from production data, then frozen.
  {'Stylesheet inlined below; fonts are data URIs.' if args.inline
    else 'Stylesheet is assets/labs.css — shared by every export here, so edit it once.'}
  The portrait is a data URI. Opens from the filesystem; no server needed.
  Behaviour (drawer, week arrows, lens toggle) is gone with the JavaScript.
  Rebuild:  python3 scripts/export_plan_html.py --who {args.who} --as {args.lens} --route '{route}'
-->
"""
if args.inline:
    style = f'<style>\n{css}\n</style>'
else:
    os.makedirs(os.path.join(OUT, 'assets/fonts'), exist_ok=True)
    io.open(os.path.join(OUT, 'assets/labs.css'), 'w', encoding='utf-8').write(css)
    for font in os.listdir(os.path.join(PKG, 'assets/fonts')):
        shutil.copyfile(os.path.join(PKG, 'assets/fonts', font),
                        os.path.join(OUT, 'assets/fonts', font))
    style = '<link rel="stylesheet" href="assets/labs.css">'
if '</head>' in dom:
    dom = dom.replace('</head>', style + '\n</head>', 1)
else:
    dom = dom.replace('<body', style + '\n<body', 1)
dom = re.sub(r'(<!doctype html>\s*)', r'\1' + banner, dom, count=1, flags=re.I)

target = STANDALONE if args.inline else OUT
os.makedirs(target, exist_ok=True)
path = os.path.join(target, f'{name}.html')
io.open(path, 'w', encoding='utf-8').write(dom)
print(f'{os.path.relpath(path, ROOT)}  {len(dom)/1024:.0f} KB')
