"""Append shared pacing notes to the existing four training sheets.
Run from repo root with Python (reportlab, pypdf) and Node installed.
Re-running replaces the appendix; it never accumulates duplicate pages.
"""
import io, json, subprocess
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen.canvas import Canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.colors import HexColor
from xml.sax.saxutils import escape

root = Path(__file__).resolve().parents[1]
path = root / 'plans/race-pace-durability/race-pace-durability.pdf'
source = subprocess.check_output(['node', '--input-type=module', '-e',
    "import {executionGuide,executionExamples,executionVersion} from './plans/race-pace-durability/execution.js'; console.log(JSON.stringify({executionGuide,executionExamples,executionVersion}));"], cwd=root)
data = json.loads(source)
original = PdfReader(path)
assert len(original.pages) in (4, 5), 'Unexpected edition; inspect before replacing appendix'
assert all(tuple(p.mediabox)[2:] == (792,612) for p in original.pages[:4])
pdfmetrics.registerFont(TTFont('PacingSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
stream = io.BytesIO()
c = Canvas(stream, pagesize=(792,612))
c.setFillColor(HexColor('#071012')); c.rect(0,0,792,612,fill=1,stroke=0)
def line(text,x,y,size=10,color='#f3f5f1'):
    c.setFillColor(HexColor(color)); c.setFont('PacingSans',size); c.drawString(x,y,text)
line('FORM  /  LABS',32,578,10,'#c9ff36')
line('Practise the race.',32,530,32)
line('START  /  SETTLE  /  HOLD  /  FINISH',32,500,11,'#c9ff36')
style=ParagraphStyle('body',fontName='PacingSans',fontSize=10.5,leading=15,textColor=HexColor('#c7cfcb'))
def paragraph(text,x,y,width):
    p=Paragraph(escape(text),style); _,h=p.wrap(width,500);p.drawOn(c,x,y-h);return y-h-16
left=468
for text in data['executionGuide']: left=paragraph(text,32,left,326)
right=468
for row in data['executionExamples']:
    line(row['label'],400,right,10,'#c9ff36');right=paragraph(row['cue'],400,right-10,358)-4
assert min(left,right)>55, 'Appendix overflow'
c.setStrokeColor(HexColor('#293639')); c.line(32,43,760,43)
line('Pacing notes '+data['executionVersion']+'  /  Follow your assigned band. Training volume and targets are unchanged.',32,28,8,'#aeb7b8')
c.showPage();c.save();stream.seek(0)
writer=PdfWriter()
for page in original.pages[:4]:writer.add_page(page)
writer.add_page(PdfReader(stream).pages[0])
writer.add_metadata({'/Title':'Race Pace Durability — plan and pacing guide','/Subject':'Pacing notes '+data['executionVersion']})
out=io.BytesIO();writer.write(out)
check=PdfReader(io.BytesIO(out.getvalue()))
assert all(check.pages[i].extract_text()==original.pages[i].extract_text() for i in range(4))
path.write_bytes(out.getvalue())
print('5 pages; original four training sheets preserved; pacing appendix added.')
