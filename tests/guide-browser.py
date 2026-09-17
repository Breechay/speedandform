"""Read-only foundation guide acceptance. No external requests or real submissions."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit,unquote
import os,json,threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('GUIDE_ARTIFACTS','/tmp/guide-review'));OUT.mkdir(parents=True,exist_ok=True)
REPORT={'checks':[],'errors':[],'physicalDevice':False}
def check(name,value):
 assert value,name
 REPORT['checks'].append(name)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
 def log_message(self,*a):pass
 def do_GET(self):
  r=unquote(urlsplit(self.path).path).lstrip('/')
  for f in [r or 'index.html',r+'.html',r.rstrip('/')+'/index.html']:
   if (ROOT/f).is_file():self.path='/'+f;return super().do_GET()
  self.send_error(404)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
ROUTES=['easy-run','threshold-training','long-run-pace','running-form-errors']
try:
 with sync_playwright() as p:
  options={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**options);ctx=browser.new_context(reduced_motion='reduce');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') else r.abort());page=ctx.new_page();page.on('pageerror',lambda e:REPORT['errors'].append(str(e)))
  for width in [375,390,430,768,1024,1440]:
   page.set_viewport_size({'width':width,'height':960})
   for route in ROUTES:
    page.goto(BASE+'/'+route,wait_until='networkidle')
    check(f'{route}: no overflow at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    check(f'{route}: correct cream at {width}',page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(236, 230, 218)')
    check(f'{route}: readable body at {width}',page.locator('.guide-body p').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=17'))
    check(f'{route}: useful first-screen answer at {width}',page.locator('.guide-answer').evaluate('(e)=>e.getBoundingClientRect().bottom<960'))
    check(f'{route}: single main heading at {width}',page.locator('h1').count()==1)
    for d in page.locator('details').all():d.evaluate('(d)=>d.open=true')
    check(f'{route}: disclosures contained at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    for d in page.locator('details').all():d.evaluate('(d)=>d.open=false')
    if width in [390,1440]:page.screenshot(path=str(OUT/f'{route}-{width}.png'),full_page=True)
  for route in ROUTES:
   page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/'+route);page.keyboard.press('Tab');check(route+': skip link first',page.evaluate("document.activeElement.className==='guide-skip'"));page.keyboard.press('Enter');check(route+': skip reaches main',page.evaluate("document.activeElement.id==='main'"))
   page.locator('.guide-ref:visible').first.click();page.wait_for_function("document.querySelector('#sources details').open");check(route+': citation opens source disclosure',page.locator('#sources details').evaluate('(e)=>e.open'));check(route+': source fragment reached',urlsplit(page.url).fragment.startswith('source-'))
   for width in [390,1440]:
    page.set_viewport_size({'width':width,'height':960});page.goto(BASE+'/'+route);page.evaluate("document.body.style.zoom='2'");check(f'{route}: 200 percent at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/running-form-errors#hip-collapse');page.wait_for_function("document.querySelector('#hip-collapse').open");check('Old form fragment opens the right disclosure',page.locator('#hip-collapse').evaluate('(d)=>d.open'))
  page.locator('#overstriding summary').click();page.locator('#overstriding .guide-ref').click();page.wait_for_function("document.querySelector('#sources details').open");check('A citation inside an opened observation reaches its source',urlsplit(page.url).fragment=='source-1')
  # Real browser Web Audio startup, input validation and cleanup. No microphone or device access.
  page.locator('#cadence-practice summary').click();page.locator('#metro-start').click();check('Blank cadence is rejected',page.locator('#metro-bpm').get_attribute('aria-invalid')=='true')
  page.locator('#metro-bpm').fill('99');page.locator('#metro-start').click();check('Out-of-range cadence is rejected',page.locator('#metro-status').inner_text().startswith('Enter a whole'))
  page.locator('#metro-bpm').fill('164');page.locator('#metro-start').click();page.wait_for_function("document.querySelector('#metro-status').textContent==='Playing at 164 steps per minute.'");check('Real Web Audio starts only on user action',page.locator('#metro-start').is_disabled() and page.locator('#metro-stop').is_enabled())
  page.locator('#metro-stop').click();check('Stop restores controls',page.locator('#metro-start').is_enabled() and page.locator('#metro-stop').is_disabled())
  page.locator('#metro-start').click();page.wait_for_function("document.querySelector('#metro-status').textContent.startsWith('Playing')");page.locator('#cadence-practice summary').click();page.wait_for_function("document.querySelector('#metro-stop').disabled");check('Closing practice stops audio',page.locator('#metro-status').text_content()=='Stopped.')
  page.locator('#cadence-practice summary').click();page.locator('#metro-start').click();page.wait_for_function("document.querySelector('#metro-status').textContent.startsWith('Playing')");page.locator('#metro-bpm').fill('172');check('Changing cadence stops the previous rhythm',page.locator('#metro-stop').is_disabled())
  page.locator('#metro-start').click();page.wait_for_function("document.querySelector('#metro-status').textContent.startsWith('Playing')");page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))");check('Hidden tab stops practice',page.locator('#metro-stop').is_disabled())
  page.goto(BASE+'/running-form-errors');page.evaluate("Object.defineProperty(window,'AudioContext',{value:undefined});Object.defineProperty(window,'webkitAudioContext',{value:undefined})");page.locator('#cadence-practice summary').click();page.locator('#metro-bpm').fill('164');page.locator('#metro-start').click();check('Unsupported audio has honest recovery',page.locator('#metro-status').inner_text().startswith('Audio could not start') and page.locator('#metro-start').is_enabled())
  # The real timer path is advanced without waiting a minute during every release.
  page.goto(BASE+'/running-form-errors');page.clock.install();page.locator('#cadence-practice summary').click();page.locator('#metro-bpm').fill('164');page.locator('#metro-start').click();page.wait_for_function("document.querySelector('#metro-status').textContent.startsWith('Playing')");page.clock.fast_forward(61000);check('Audio stops at the practice time limit',page.locator('#metro-status').inner_text()=='Practice complete.')
  nojs=browser.new_context(java_script_enabled=False);np=nojs.new_page();nojs.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') else r.abort())
  for route in ROUTES:
   np.goto(BASE+'/'+route);check(route+': complete guidance without JS',np.locator('.guide-answer').is_visible() and np.locator('.guide-section').count()>=4);np.locator('details summary').first.click();check(route+': native disclosure works without JS',np.locator('details').first.evaluate('(e)=>e.open'))
  check('No runtime errors',not REPORT['errors']);nojs.close();ctx.close();browser.close()
 REPORT['result']='PASS'
except Exception as e:
 REPORT['result']='FAIL';REPORT['failure']=str(e);raise
finally:
 server.shutdown();(OUT/'browser.json').write_text(json.dumps(REPORT,indent=2)+'\n')
print('PASS:',len(REPORT['checks']),'foundation guide browser checks.')
