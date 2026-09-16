#!/usr/bin/env python3
"""Render the homepage share card from the existing film; no synthetic imagery.
Requires ffmpeg, Pillow and fonts-croscore (Tinos, Arimo, Cousine).
Run from the repository root: python scripts/render_homepage_share.py
"""
from pathlib import Path
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'og/homepage-run-development-20260916.jpg'
STAMP = '6.300'
W, H = 1200, 630
FONTS = Path('/usr/share/fonts/truetype/croscore')


def font(name, size):
    path = FONTS / name
    if not path.is_file():
        raise SystemExit('Install fonts-croscore before rendering this card.')
    return ImageFont.truetype(str(path), size)


def tracked(draw, xy, text, face, fill, tracking=0):
    x, y = xy
    for c in text:
        draw.text((x, y), c, font=face, fill=fill, anchor='la')
        x += draw.textlength(c, font=face) + tracking
    return x


def render():
    source = ROOT / 'media/run-development.mp4'
    if not source.is_file():
        raise SystemExit(f'Missing original film: {source}')
    with tempfile.TemporaryDirectory() as directory:
        frame = Path(directory) / 'frame.png'
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error',
                        '-ss', STAMP, '-i', str(source), '-frames:v', '1',
                        '-y', str(frame)], check=True)
        image = Image.open(frame).convert('RGB')
    if image.size != (1080, 1920):
        raise SystemExit('Film dimensions changed; review the crop before rendering.')
    # The vertical film is not stretched or cropped into a headless wide banner.
    image = image.crop((0, 230, 1080, 1690))
    photo_width = round(1080 * H / 1460)
    image = image.resize((photo_width, H), Image.Resampling.LANCZOS)
    image = ImageOps.grayscale(image).convert('RGB')
    image = ImageEnhance.Contrast(image).enhance(1.12)
    image = ImageEnhance.Brightness(image).enhance(0.88)
    background = (6, 8, 7)
    card = Image.new('RGB', (W, H), background)
    # Fade only the left edge into the page's dark field, retaining the runners.
    alpha = Image.new('L', image.size)
    values = []
    for y in range(H):
        for x in range(photo_width):
            left = min(1.0, max(0.0, x / 175))
            floor = 1.0 - 0.20 * max(0.0, (y - 510) / 120)
            values.append(round(255 * left * floor))
    alpha.putdata(values)
    card.paste(image, (W-photo_width, 0), alpha)
    d = ImageDraw.Draw(card)
    white = (242, 238, 229)
    muted = (182, 186, 180)
    end = tracked(d, (64, 41), 'FORM', font('Arimo-Bold.ttf', 44), white, -2)
    d.text((end+1, 41), '.', font=font('Arimo-Bold.ttf', 44), fill=(201,255,54), anchor='la')
    tracked(d, (68, 174), 'RUNNING COACHING', font('Cousine-Regular.ttf', 19), muted, 1.5)
    tracked(d, (60, 201), 'Run', font('Tinos-Regular.ttf', 140), white, -4.5)
    tracked(d, (60, 323), 'Development', font('Tinos-Regular.ttf', 125), white, -5.0)
    d.text((68, 534), 'With Brice  ·  Miami + Remote', font=font('Arimo-Regular.ttf', 25), fill=white, anchor='la')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    card.save(OUTPUT, 'JPEG', quality=91, optimize=True, progressive=False, subsampling=0)
    assert Image.open(OUTPUT).size == (W, H)
    assert OUTPUT.stat().st_size < 300_000
    print(f'{OUTPUT.relative_to(ROOT)}: {W}×{H}, {OUTPUT.stat().st_size:,} bytes, film {STAMP}s')

if __name__ == '__main__':
    render()
