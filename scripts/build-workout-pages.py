#!/usr/bin/env python3
"""FORM Open Speed: one static page and one preview image per workout.

The page body still reads the live library (workout/template.html); this only gives each address its own title,
description and share image, so a shared link previews the actual session. Re-run when the open library changes:
  python3 scripts/build-workout-pages.py
Snapshot: data/open-speed-library.json (structure, purpose; never target times)."""
import json, html, os, re
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = json.load(open(os.path.join(ROOT, 'data/open-speed-library.json')))
TEMPLATE = open(os.path.join(ROOT, 'workout/template.html')).read()
PHOTO = {'Speed': 'bw-high-knees', 'Endurance': 'night-pair-track', 'Threshold': 'bw-track-talk'}
FONT = '/usr/share/fonts/opentype/inter/Inter-{}.otf'
INK, BONE, CUE = (11, 11, 11), (244, 242, 236), (185, 185, 179)

def name(t):
    small = {'and', 'of', 'the', 'a', 'to', 'in', 'by'}
    out = []
    for i, w in enumerate(t.lower().split(' ')):
        out.append(w.upper() if re.search(r'\d', w) else (w if i and w in small else w[:1].upper() + w[1:]))
    return ' '.join(out)

def one(b):
    return str(b['distance_meters']) if b.get('distance_meters') else f"{b['duration_seconds'] // 60} min"

def work(b):
    unit = f"{b['distance_meters']} m" if b.get('distance_meters') else f"{b['duration_seconds'] // 60} min"
    return (f"{b['reps']} × " if b['reps'] > 1 else '') + unit

def structure(s):
    bl = s['blocks']
    if len(bl) == 1: return work(bl[0])
    if all(b['reps'] == 1 for b in bl): return ' · '.join(one(b) for b in bl) + (' m' if bl[0].get('distance_meters') else '')
    return ' · '.join((f"{b['reps']} × {one(b)}" if b['reps'] > 1 else one(b)) for b in bl)

def card(s, out):
    W, H = 1200, 630
    photo = Image.open(os.path.join(ROOT, f"media/library/{PHOTO.get(s['group'], PHOTO['Speed'])}-1200.webp")).convert('L')
    photo = ImageOps.fit(photo, (W, H), centering=(0.7, 0.18)).convert('RGB')
    canvas = photo.copy()
    shade = Image.new('L', (W, H))
    d = ImageDraw.Draw(shade)
    for x in range(W):  # dark on the left where the words sit, the photograph on the right
        d.line([(x, 0), (x, H)], fill=int(max(0, min(235, 235 - max(0, x - 300) * 0.45))))
    canvas = Image.composite(Image.new('RGB', (W, H), INK), canvas, shade)
    draw = ImageDraw.Draw(canvas)
    title_font = ImageFont.truetype(FONT.format('Black'), 96)
    title = name(s['title'])
    while draw.textlength(title, font=title_font) > 720 and title_font.size > 60:
        title_font = ImageFont.truetype(FONT.format('Black'), title_font.size - 4)
    draw.text((72, 210), title, font=title_font, fill=BONE)
    draw.text((74, 210 + title_font.size + 22), structure(s), font=ImageFont.truetype(FONT.format('SemiBold'), 40), fill=BONE)
    draw.text((74, 72), 'FORM · ' + s['group'].upper(), font=ImageFont.truetype(FONT.format('SemiBold'), 24), fill=CUE)
    emblem = Image.open(os.path.join(ROOT, 'assets/brand/kit/emblem/sf-emblem-bone.png')).convert('RGBA')
    emblem.thumbnail((120, 120))
    canvas.paste(emblem, (W - emblem.width - 64, H - emblem.height - 56), emblem)
    canvas.save(out, quality=86)

for s in LIB:
    title = f"{name(s['title'])} · {structure(s)}"
    desc = s.get('purpose') or 'A FORM session from our Thursday track in Miami.'
    image = f"https://speedandform.com/og/workout-{s['id']}.jpg"
    card(s, os.path.join(ROOT, f"og/workout-{s['id']}.jpg"))
    page = TEMPLATE
    swaps = [
        (r'<title>.*?</title>', f'<title>{html.escape(title)} | FORM Speed</title>'),
        (r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{html.escape(desc)}">'),
        (r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="https://speedandform.com/workout/{s["id"]}">'),
        (r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{html.escape(title)}">'),
        (r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{html.escape(desc)}">'),
        (r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{image}">'),
        # Safari's app banner: Open hands FORM this exact workout.
        (r'<meta name="apple-itunes-app" content="[^"]*">',
         f'<meta name="apple-itunes-app" content="app-id=6761313085, app-argument=https://speedandform.com/workout/{s["id"]}">'),
    ]
    for pattern, value in swaps:
        page, n = re.subn(pattern, lambda m: value, page, count=1)
        assert n == 1, pattern
    os.makedirs(os.path.join(ROOT, f"workout/{s['id']}"), exist_ok=True)
    open(os.path.join(ROOT, f"workout/{s['id']}/index.html"), 'w').write(page)
print(f"{len(LIB)} workout pages and preview images")
