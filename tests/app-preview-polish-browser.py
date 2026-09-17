"""Round FORM marks, sans-serif phase numeral, and an uncluttered Sculpt preview.
Browser viewports are not physical devices. Never sends forms, email or analytics.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
import json, os, threading
from io import BytesIO
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
LIVE=os.environ.get('APP_POLISH_LIVE')=='1'; ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('APP_POLISH_ARTIFACTS','/tmp/app-polish'));OUT.mkdir(parents=True,exist_ok=True)
report={'engine':ENGINE,'live':LIVE,'physicalDevice':False,'checks':[],'errors':[],'blocked':[]}
def check(name,ok):
 assert ok,name
 report['checks'].append(name)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
 def do_GET(self):
  route=unquote(urlsplit(self.path).path).lstrip('/')
  for f in [route or 'index.html',route+'.html',route.rstrip('/')+'/index.html']:
   if (ROOT/f).is_file():self.path='/'+f;return super().do_GET()
  self.send_error(404)
server=None
if LIVE:BASE='https://speedandform.com'
else:
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
def circles(page,label):
 dots=page.locator('.fl-mark span,.fl-athlete span')
 check(label+': three retained periods',dots.count()==3 and dots.evaluate_all("es=>es.every(e=>e.textContent==='.')"))
 for i,d in enumerate(dots.all()):
  c=d.evaluate("e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius,bg:s.backgroundColor,color:s.color}}")
  check(f'{label}: round dot {i}',abs(c['width']-c['height'])<.1 and c['width']>3 and c['radius']=='50%' and c['bg']!='rgba(0, 0, 0, 0)')
try:
 with sync_playwright() as pw:
  opts={'headless':True}
  if ENGINE=='chromium' and os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=getattr(pw,ENGINE).launch(**opts);ctx=browser.new_context(reduced_motion='reduce',device_scale_factor=2)
  def guard(r):
   if r.request.method=='GET' and r.request.url.startswith(BASE+'/'):r.continue_()
   else:report['blocked'].append({'method':r.request.method,'url':r.request.url});r.abort()
  ctx.route('**/*',guard);page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  for w in ([390,1440] if LIVE else [375,390,430,768,1024,1440]):
   page.set_viewport_size({'width':w,'height':960});r=page.goto(BASE+'/forge-sculpt/',wait_until='networkidle');page.evaluate('document.fonts.ready')
   check(f'Sculpt {w}: 200',r.status==200)
   check(f'Sculpt {w}: unwanted label removed',page.locator('.bs-poster-label').count()==0 and 'Sculpt · The Frame' not in page.locator('.bs-poster').inner_text())
   check(f'Sculpt {w}: Adrian retained',page.locator('.bs-athlete').inner_text()=='ADRIAN.')
   phase=page.locator('.bs-ghost')
   check(f'Sculpt {w}: phase 01 in sans serif',phase.inner_text()=='01' and phase.evaluate("e=>getComputedStyle(e).fontFamily.includes('Sculpt Sans')&&!getComputedStyle(e).fontFamily.includes('Georgia')"))
   check(f'Sculpt {w}: lining phase numbers',phase.evaluate("e=>getComputedStyle(e).fontVariantNumeric.includes('lining-nums')"))
   check(f'Sculpt {w}: no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   check(f'Sculpt {w}: anatomy loads',page.locator('.bs-anatomy').evaluate('e=>e.complete&&e.naturalWidth>0'))
   if w in [390,1440]:page.locator('.bs-preview').screenshot(path=str(OUT/f'adrian-{w}.png'));page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/f'sculpt-hero-{w}.png'))
   r=page.goto(BASE+'/form/',wait_until='networkidle');check(f'FORM {w}: 200',r.status==200)
   check(f'FORM {w}: José retained',page.locator('.fl-athlete').inner_text()=='JOSÉ.')
   check(f'FORM {w}: no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   circles(page,f'FORM {w}')
   mark=Image.open(BytesIO(page.locator('.fl-mark').first.screenshot())).convert('RGB')
   whites=[];limes=[]
   for y in range(mark.height):
    for x in range(mark.width):
     r,g,b=mark.getpixel((x,y))
     if min(r,g,b)>220:whites.append(y)
     if g>200 and r>130 and b<110:limes.append(y)
   check(f'FORM {w}: period sits on the lettering baseline',bool(whites and limes) and abs(max(whites)-max(limes))<=3)
   if w in [390,1440]:
    page.locator('.fl-header').screenshot(path=str(OUT/f'form-header-{w}.png'));page.locator('.fl-preview').screenshot(path=str(OUT/f'jose-{w}.png'));page.locator('.fl-footer').screenshot(path=str(OUT/f'form-footer-{w}.png'))
  page.set_viewport_size({'width':390,'height':960});page.goto(BASE+'/form/');page.add_style_tag(content='.fl-mark,.fl-athlete{font-family:Georgia,serif!important}')
  circles(page,'Fallback font');page.reload()
  page.add_style_tag(content='.fl-mark,.fl-athlete{font-size:60px!important}')
  circles(page,'Enlarged identity');check('Enlarged identity does not overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  page.reload();page.emulate_media(forced_colors='active');circles(page,'Forced colors')
  page.emulate_media(forced_colors='none')
  check('No JavaScript errors',not report['errors'])
  check('No submission attempted',all(x['method']=='GET' for x in report['blocked']))
  browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['failure']=str(e);raise
finally:
 (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n')
 if server:server.shutdown()
 print(report.get('result'),len(report['checks']),ENGINE,'live' if LIVE else 'served')
