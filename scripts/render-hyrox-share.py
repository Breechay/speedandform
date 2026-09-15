"""Render the HYROX share card. Requires Pillow and fonttools[woff].
Run from repository root: python scripts/render-hyrox-share.py
"""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import sys
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path('.')
font=TTFont(root/'assets/labs/fonts/inter-latin.woff2');font.flavor=None
font=instantiateVariableFont(font,{'wght':850},inplace=False)
buf=BytesIO();font.save(buf); raw=buf.getvalue()
def face(size):return ImageFont.truetype(BytesIO(raw),size)
im=Image.new('RGB',(1200,630),'#06100e');d=ImageDraw.Draw(im)
d.text((76,55),'FORM.',font=face(38),fill='#f4f6f2')
d.text((72,155),'HYROX',font=face(150),fill='#c9ff36')
d.text((78,335),'Train with purpose.',font=face(43),fill='#f4f6f2')
d.text((78,390),'Race with a plan.',font=face(43),fill='#f4f6f2')
d.text((78,531),'TRAINING · PACING · RACE TOOLS',font=face(20),fill='#c2cbc6')
d.text((850,531),'speedandform.com',font=face(20),fill='#c2cbc6')
out=root/'og/hyrox-v1.png';out.parent.mkdir(exist_ok=True);im.save(out,optimize=True)
print(out)
