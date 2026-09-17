"""Sculpt demo and preview identities. GET-only; all other traffic is blocked."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit,unquote
import os,json,threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];LIVE=os.environ.get('SCULPT_LIVE')=='1'
OUT=Path(os.environ.get('SCULPT_ARTIFACTS','/tmp/sculpt-review'));OUT.mkdir(parents=True,exist_ok=True)
report={'checks':[],'errors':[],'physicalDevice':False,'live':LIVE,'commit':os.environ.get('GITHUB_SHA')}
def check(name,ok):
 assert ok,name
 report['checks'].append(name)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
 def do_GET(self):
  r=unquote(urlsplit(self.path).path).lstrip('/')
  for f in [r or 'index.html',r+'.html',r.rstrip('/')+'/index.html']:
   if (ROOT/f).is_file():self.path='/'+f;return super().do_GET()
  self.send_error(404)
server=None
if LIVE:BASE='https://speedandform.com'
else:
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  opts={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  b=p.chromium.launch(**opts);ctx=b.new_context(reduced_motion='reduce');ctx.route('**/*',lambda r:r.continue_() if r.request.method=='GET' and r.request.url.startswith(BASE+'/') else r.abort());page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  widths=[390,1440] if LIVE else [375,390,430,768,1024,1440]
  for w in widths:
   page.set_viewport_size({'width':w,'height':960});r=page.goto(BASE+'/forge-sculpt/',wait_until='networkidle');page.evaluate('document.fonts.ready');page.evaluate('scrollTo(0,0)')
   check(f'200 at {w}',r.status==200);check(f'Release marker at {w}',page.locator('body').get_attribute('data-sculpt-landing')=='20260917-p5b');check(f'No overflow at {w}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));check(f'One main heading at {w}',page.locator('h1').count()==1)
   check(f'App action in first viewport at {w}',page.locator('.bs-hero .bs-button').evaluate('(e)=>e.getBoundingClientRect().bottom<=innerHeight'))
   check(f'Correct app destination at {w}',page.locator('.bs-hero .bs-button').get_attribute('href')=='https://apps.apple.com/us/app/breechay/id6790569283')
   check(f'Adrian identity at {w}',page.locator('.bs-athlete').inner_text()=='ADRIAN.');check(f'Illustration labeled at {w}','sample training' in page.locator('.bs-preview figcaption').inner_text())
   for i in page.locator('img').all():i.scroll_into_view_if_needed();i.evaluate('(i)=>i.decode()')
   check(f'Actual store image loaded at {w}',page.locator('.bs-store img').evaluate('(i)=>i.naturalWidth===600&&i.naturalHeight===1299'))
   check(f'Anatomy loaded at {w}',page.locator('.bs-anatomy').evaluate('(i)=>i.naturalWidth===670'))
   for d in page.locator('.bs-campaigns details').all():d.evaluate('(d)=>d.open=true')
   check(f'Twelve phases readable at {w}',page.locator('.bs-campaigns li:visible').count()==12)
   for d in page.locator('.bs-faq details').all():d.locator('summary').click()
   check(f'Expanded sections contained at {w}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   page.get_by_role('button',name='Increase weight by 5 pounds').click();page.get_by_role('button',name='Increase repetitions by 1').click();page.get_by_role('button',name='Complete sample set').click()
   check(f'Sample record matches entry at {w}',page.locator('.bs-receipt-value').inner_text()=='30 lb × 16 reps')
   check(f'Receipt receives focus at {w}',page.evaluate("document.activeElement.classList.contains('bs-receipt')"));check(f'Input not active after receipt at {w}',not page.locator('.bs-demo-interactive').is_visible())
   page.get_by_role('button',name='Try another set').click();check(f'Reset restores example at {w}',page.locator('#sculpt-weight').input_value()=='25' and not page.locator('.bs-receipt').is_visible())
   for d in page.locator('details').all():d.evaluate('(d)=>d.open=false')
   page.locator('.bs-campaigns details').first.evaluate('(d)=>d.open=true');page.evaluate('scrollTo(0,0)')
   if w in [390,1440]:
    page.screenshot(path=str(OUT/f'hero-{w}.png'));page.screenshot(path=str(OUT/f'sculpt-{w}.png'),full_page=True);page.locator('.bs-preview').screenshot(path=str(OUT/f'adrian-{w}.png'));page.locator('.bs-demo').screenshot(path=str(OUT/f'demo-{w}.png'))
   page.goto(BASE+'/form/',wait_until='networkidle');check(f'José FORM identity at {w}',page.locator('.fl-athlete').inner_text()=='JOSÉ.')
   if w in [390,1440]:page.locator('.fl-preview').screenshot(path=str(OUT/f'jose-{w}.png'))
  page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/forge-sculpt/');page.keyboard.press('Tab');check('Skip link first',page.evaluate("document.activeElement.className==='bs-skip'"));page.keyboard.press('Enter');check('Skip reaches main',page.evaluate("document.activeElement.id==='main'"))
  page.locator('#sculpt-weight').fill('-5');page.get_by_role('button',name='Complete sample set').click();check('Negative weight rejected',page.locator('#sculpt-weight').get_attribute('aria-invalid')=='true' and not page.locator('.bs-receipt').is_visible());check('Error focus goes to weight',page.evaluate("document.activeElement.id==='sculpt-weight'"))
  page.locator('#sculpt-weight').fill('12.5');page.locator('#sculpt-reps').fill('1.5');page.get_by_role('button',name='Complete sample set').click();check('Fractional repetitions rejected',page.locator('#sculpt-reps').get_attribute('aria-invalid')=='true');page.locator('#sculpt-reps').fill('12');page.get_by_role('button',name='Complete sample set').click();check('Corrected values record exactly',page.locator('.bs-receipt-value').inner_text()=='12.5 lb × 12 reps');page.get_by_role('button',name='Try another set').click()
  page.locator('#sculpt-weight').fill('');page.get_by_role('button',name='Complete sample set').click();check('Blank weight rejected',page.locator('#sculpt-weight').get_attribute('aria-invalid')=='true');page.locator('#sculpt-weight').fill('500');check('Maximum increase disabled',page.get_by_role('button',name='Increase weight by 5 pounds').is_disabled());page.locator('#sculpt-weight').fill('0');check('Minimum decrease disabled',page.get_by_role('button',name='Decrease weight by 5 pounds').is_disabled());page.locator('#sculpt-reps').fill('100');check('Maximum reps disabled',page.get_by_role('button',name='Increase repetitions by 1').is_disabled());page.locator('#sculpt-reps').fill('1');check('Minimum reps disabled',page.get_by_role('button',name='Decrease repetitions by 1').is_disabled())
  page.get_by_role('button',name='Complete sample set').focus();page.keyboard.press('Enter');check('Keyboard completes sample',page.locator('.bs-receipt').is_visible());page.reload();check('Reload discards demonstration',not page.locator('.bs-receipt').is_visible() and page.locator('#sculpt-weight').input_value()=='25')
  page.locator('.bs-poster-foot a').click();check('Preview action goes to sample',urlsplit(page.url).fragment=='demo');check('No launch signup form',page.locator('form').count()==0)
  check('Reduced motion honored',page.locator('html').evaluate('(e)=>getComputedStyle(e).scrollBehavior')=='auto');check('Readable body type',page.locator('.bs-intro').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=17'))
  if not LIVE:
   for w in [390,1440]:
    page.set_viewport_size({'width':w,'height':960});page.goto(BASE+'/forge-sculpt/');page.evaluate("document.body.style.zoom='2';document.querySelectorAll('details').forEach(d=>d.open=true)");check(f'200 percent content reflows at {w}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));page.get_by_role('button',name='Complete sample set').click();check(f'200 percent record reflows at {w}',page.locator('.bs-receipt').is_visible() and page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   nj=b.new_context(java_script_enabled=False,viewport={'width':390,'height':844});nj.route('**/*',lambda r:r.continue_() if r.request.method=='GET' and r.request.url.startswith(BASE+'/') else r.abort());np=nj.new_page();np.goto(BASE+'/forge-sculpt/');check('No-JS sample explanation present',np.locator('.bs-demo-fallback').is_visible());check('No-JS inert controls absent',not np.locator('.bs-demo-interactive').is_visible());np.locator('.bs-campaigns summary').nth(1).click();check('No-JS curriculum expands',np.locator('.bs-campaigns details').nth(1).evaluate('(d)=>d.open'));np.locator('.bs-faq summary').first.click();check('No-JS answers work',np.locator('.bs-faq details').first.evaluate('(d)=>d.open'));check('No-JS layout contained',np.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));nj.close()
  check('No runtime errors',not report['errors']);b.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['error']=str(e);raise
finally:
 if server:server.shutdown()
 (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['checks']),'Sculpt and identity browser checks; live:',LIVE)
