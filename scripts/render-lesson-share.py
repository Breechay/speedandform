"""Render the reviewed lesson cards with the committed house fonts and emblem."""
import argparse, io, json, subprocess, types
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.ttLib import woff2

# Node's built-in decoder keeps rendering possible when Python lacks Brotli.
if not woff2.haveBrotli:
    def decompress(data):
        code="process.stdout.write(require('node:zlib').brotliDecompressSync(require('node:fs').readFileSync(0)))"
        return subprocess.run(['node','-e',code],input=data,stdout=subprocess.PIPE,check=True).stdout
    woff2.brotli=types.SimpleNamespace(decompress=decompress)
    woff2.haveBrotli=True

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('files', nargs='+', help='Exact public-share manifest file keys')
args = parser.parse_args()
cards = json.loads((root / 'data/public-share.json').read_text())
font = TTFont(root / 'assets/site/fonts/inter-tight-latin-variable.woff2')
font = instantiateVariableFont(font, {'wght': 450}, inplace=True)
font.flavor = None
buf = io.BytesIO(); font.save(buf); sans = buf.getvalue()
mono = TTFont(root / 'assets/site/fonts/jetbrains-mono-latin-400-normal.woff2'); mono.flavor = None
buf = io.BytesIO(); mono.save(buf); mono = buf.getvalue()
emblem = Image.open(root / 'assets/brand/kit/emblem/sf-emblem-ink.png').convert('RGBA')
emblem.thumbnail((104,44), Image.Resampling.LANCZOS)

def face(data, size):
    return ImageFont.truetype(io.BytesIO(data), size)

def wrap(text, font, draw):
    lines=[]; line=''
    for word in text.split():
        trial=(line+' '+word).strip()
        if draw.textlength(trial, font=font)>1030 and line:
            lines.append(line); line=word
        else: line=trial
    if line: lines.append(line)
    return lines

for file in args.files:
    c = cards[file]
    assert not c['dark'], 'This renderer owns only the paper lesson cards'
    im=Image.new('RGB',(1200,630),'#e8e3d9'); draw=ImageDraw.Draw(im)
    im.paste(emblem,(64,56),emblem)
    label=face(mono,18)
    draw.text((1136,66), c['label'], fill='#161916', font=label, anchor='ra')
    size=76 if len(' '.join(c['headline']))>58 else 96
    for size in range(size,63,-2):
        body=face(sans,size)
        lines=[line for para in c['headline'] for line in wrap(para,body,draw)]
        height=len(lines)*int(size*1.08)
        if height<=330: break
    assert height<=330, file+' headline exceeds card measure'
    y=112+(360-height)/2
    for line in lines:
        draw.text((64,y),line,font=body,fill='#161916',anchor='lt')
        y+=int(size*1.08)
    draw.line((64,524,1136,524), fill='#bdb6a9', width=1)
    footer=face(sans,22)
    draw.text((64,550),'speedandform.com',fill='#161916',font=footer,anchor='lt')
    draw.text((1136,550),'Running, understood.',fill='#161916',font=footer,anchor='rt')
    destination=root / c['image'].lstrip('/')
    im.save(destination, quality=90)
    assert destination.stat().st_size<500000
print(f'Rendered {len(args.files)} paper lesson cards.')
