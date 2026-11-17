#!/usr/bin/env python3
"""Builds the public Form cues pages from data/cues.json: /cues/ and /cues/<slug>/, plus share images in /og/.
Run from the repository root, then `node scripts/build-site-menu.cjs` so every page carries the shared drawer."""
import html, json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, 'data/cues.json')))
RUN_APP = 'https://apps.apple.com/us/app/form-running-plans/id6761313085'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg>'
RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>'
LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12H4m6-6-6 6 6 6"/></svg>'
PANEL = open(os.path.join(ROOT, 'scripts/site-menu-panel.html')).read().strip()
e = html.escape


def size(name, which):
    with Image.open(os.path.join(ROOT, f'assets/cues/{name}-{which}.webp')) as im:
        return im.size


def page(title, description, url, og, body):
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0B0B0B"><meta name="robots" content="index,follow">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="https://speedandform.com{url}"><link rel="icon" href="/favicon.ico"><link rel="icon" type="image/svg+xml" href="/assets/brand/kit/favicon/form-rounded.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" as="font" type="font/woff2" href="/assets/site/fonts/inter-tight-latin-variable.woff2" crossorigin>
<link rel="stylesheet" href="/css/sf-brand.css?v=20261019-blackbone"><link rel="stylesheet" href="/css/sf-menu.css?v=20261019-signed"><link rel="stylesheet" href="/css/cues.css?v=20261117">
<meta property="og:type" content="website"><meta property="og:site_name" content="Speed &amp; Form"><meta property="og:locale" content="en_US">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="https://speedandform.com{url}">
<meta property="og:image" content="https://speedandform.com/og/{og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(description)}"><meta name="twitter:image" content="https://speedandform.com/og/{og}">
</head><body class="sf-cues">
<div class="cues-top"><header class="cues-shell sf-menu-host"><a class="sf-brand" href="/" aria-label="Speed and Form home"></a><a class="sf-menu-toggle" href="#site-menu" aria-controls="site-menu" aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18"/></svg></a></header></div>
<main>
{body}
</main>
<footer class="cues-foot"><div class="cues-shell"><span>&copy; 2026 Speed &amp; Form</span><a href="/cues/">Form cues</a><a href="/coaching/miami/">Run Development</a><a href="https://www.instagram.com/form.practice/" target="_blank" rel="noopener noreferrer">@form.practice</a></div></footer>
<!-- Shared site menu -->
{PANEL}
<!-- /Shared site menu -->
<script defer src="/js/sf-menu.js?v=20261019-signed"></script>
</body></html>
'''


def app_block(lead):
    return (f'<div class="cue-app"><img src="/assets/brand/apps/icon-run-cream-1024.png" alt="" width="56" height="56" loading="lazy">'
            f'<a class="cue-app-get" href="{RUN_APP}" target="_blank" rel="noopener noreferrer">{e(lead)} {ARROW}</a></div>')


def build_index(cues):
    tiles = []
    for c in cues:
        w, h = size(c['image'], '600')
        tiles.append(f'''  <li><a href="/cues/{c['slug']}/"><div class="cues-figure"><img src="/assets/cues/{c['image']}-600.webp" srcset="/assets/cues/{c['image']}-600.webp 1x, /assets/cues/{c['image']}-900.webp 2x" width="{w}" height="{h}" alt="{e(c['alt'])}" loading="lazy" decoding="async"></div><strong>{e(c['name'])}</strong><span>{e(c['do'])}</span></a></li>''')
    body = f'''<section class="cues-shell cues-head"><h1>Form cues.</h1></section>
<ul class="cues-shell cues-grid">
{chr(10).join(tiles)}
</ul>
<nav class="cues-shell cues-rows" aria-label="Next">
  <a href="{RUN_APP}" target="_blank" rel="noopener noreferrer"><strong>Practice one this week</strong><span>Speed &amp; Form: Running · Free on iPhone</span>{ARROW}</a>
  <a href="/ghost/cues"><strong>How to test a cue</strong><span>Try it, compare, keep it only if it helps</span>{ARROW}</a>
  <a href="/pain-map"><strong>When something hurts</strong><span>Runner pain map</span>{ARROW}</a>
</nav>'''
    return page('Form cues | Speed & Form', 'One running cue at a time, drawn: what to do, a picture to remember it by, and why it helps. From Brice at Speed & Form.',
                '/cues/', 'cues-20261117.jpg', body)


def build_cue(i, cues):
    c = cues[i]
    prev_c, next_c = cues[i - 1], cues[(i + 1) % len(cues)]
    w, h = size(c['image'], '900')
    body = f'''<article class="cues-shell cue">
  <figure class="cue-figure"><img src="/assets/cues/{c['image']}-900.webp" width="{w}" height="{h}" alt="{e(c['alt'])}" fetchpriority="high" decoding="async"></figure>
  <div class="cue-copy">
    <h1>{e(c['name'])}</h1>
    <p class="cue-do">{e(c['do'])}</p>
    <p class="cue-think">{e(c['think'])}</p>
    <p class="cue-why">{e(c['why'])}</p>
    <p class="cue-practice">{e(DATA['practice'])}</p>
    {app_block('Practice it in the app')}
  </div>
</article>
<nav class="cues-shell cue-next" aria-label="More cues"><a href="/cues/{prev_c['slug']}/">{LEFT} {e(prev_c['name'])}</a><a href="/cues/">All cues</a><a href="/cues/{next_c['slug']}/">{e(next_c['name'])} {RIGHT}</a></nav>'''
    return page(f"{c['name']} · Form cues | Speed & Form", f"{c['do']} {c['think']}", f"/cues/{c['slug']}/", f"cues-{c['slug']}-20261117.jpg", body)


def og_image(path, name, images):
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), (244, 242, 236))
    d = ImageDraw.Draw(im)
    big = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf', 104)
    small = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Medium.otf', 26) if os.path.exists('/usr/share/fonts/opentype/inter/Inter-Medium.otf') else big
    x = W - 60
    for img in reversed(images):
        sk = Image.open(os.path.join(ROOT, f'assets/cues/{img}-900.webp')).convert('RGBA')
        sk = sk.resize((int(sk.width * 540 / sk.height), 540), Image.LANCZOS)
        x -= sk.width
        im.paste(sk, (x, 50), sk)
        x -= 10
    d.text((72, 210), name, font=big, fill=(11, 11, 11))
    d.text((76, 520), 'SPEED & FORM', font=small, fill=(87, 92, 88))
    im.save(path, 'JPEG', quality=88)


def main():
    cues = DATA['cues']
    os.makedirs(os.path.join(ROOT, 'cues'), exist_ok=True)
    open(os.path.join(ROOT, 'cues/index.html'), 'w').write(build_index(cues))
    for i, c in enumerate(cues):
        os.makedirs(os.path.join(ROOT, 'cues', c['slug']), exist_ok=True)
        open(os.path.join(ROOT, 'cues', c['slug'], 'index.html'), 'w').write(build_cue(i, cues))
        og_image(os.path.join(ROOT, f"og/cues-{c['slug']}-20261117.jpg"), c['name'], [c['image']])
    og_image(os.path.join(ROOT, 'og/cues-20261117.jpg'), 'Form cues.', ['quiet-shoulders', 'low-hands', 'four-lights'])
    print('built', len(cues), 'cues')


if __name__ == '__main__':
    main()
