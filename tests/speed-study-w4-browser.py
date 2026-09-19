"""Browser proof of the static W4 update and existing note interactions."""
import functools,json,os,pathlib,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(os.environ.get('STUDY_ARTIFACTS','/tmp/speed-study-w4'))
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
checks=[]
try:
 with sync_playwright() as pw:
  engine=os.environ.get('BROWSER','chromium')
  browser=getattr(pw,engine).launch()
  for width,height in [(320,740),(390,844),(834,1112),(1440,1000)]:
   context=browser.new_context(viewport={'width':width,'height':height},timezone_id='America/New_York',reduced_motion='reduce',device_scale_factor=1)
   page=context.new_page();errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto(base+'/labs/speed-that-endures/',wait_until='networkidle')
   page.evaluate('document.fonts.ready')
   # Source-text assertions must not fail because existing CSS capitalizes a label.
   text_of=lambda selector:(page.locator(selector).text_content() or '').strip()
   page.screenshot(path=str(OUT/f'{engine}-{width}-arrival.png'))
   assert text_of('.status')=='In progress · updated Sep 17',repr(text_of('.status'))
   page.locator('.hero .plan-link[href="#w4-read"]').click()
   page.wait_for_timeout(300)
   assert page.locator('#w4-read').is_visible()
   text=text_of('#w4-read')
   for expected in ['33:40.8','34:17.9','6:44','6:52','6:48.9','6:54.1','3 × 10 min','2 min floats']:
    assert expected in text,expected
   assert page.locator('.w4-splits li').count()==5
   dimensions=page.evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})')
   if dimensions['scrollWidth']>dimensions['width']+1:
    offenders=page.evaluate("""() => [...document.querySelectorAll('body *')].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,cls:e.className,id:e.id,left:r.left,right:r.right,width:r.width,scroll:e.scrollWidth,text:(e.textContent||'').trim().slice(0,80)}}).filter(x=>x.right>innerWidth+1 || x.left<-1).sort((a,b)=>Math.max(b.right-innerWidth,-b.left)-Math.max(a.right-innerWidth,-a.left)).slice(0,20)""")
    print('OVERFLOW',width,json.dumps(offenders,ensure_ascii=False),flush=True)
    edge=page.evaluate("""() => [...document.querySelectorAll('body *')].map(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return {tag:e.tagName,cls:e.className,id:e.id,left:r.left,right:r.right,width:r.width,overflowX:cs.overflowX,pos:cs.position,text:(e.textContent||'').trim().slice(0,80)}}).filter(x=>x.right>innerWidth+1 && x.right<innerWidth+100 && x.left>-100).sort((a,b)=>a.right-b.right).slice(0,50)""")
    print('EDGE',width,json.dumps(edge,ensure_ascii=False),flush=True)
   assert dimensions['scrollWidth']<=dimensions['width']+1,f'page overflow {width}: {dimensions}'
   for box in page.locator('#w4-read .w4-athlete').all():
    assert box.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),f'athlete overflow {width}'
   page.locator('#w4-read').screenshot(path=str(OUT/f'{engine}-{width}-current-read.png'))
   page.locator('#w4-read a[href="#note-w4"]').click();page.wait_for_timeout(300)
   assert page.locator('#note-w4').get_attribute('aria-expanded')=='true'
   assert '33:40.8' in text_of('#j-out')
   assert '34:17.9' in text_of('#h-out')
   assert '6:54.1' in text_of('#h-outs')
   assert text_of('#h-effort')=='Not reported'
   assert not page.locator('#j-strava').is_visible()
   assert not page.locator('#h-strava').is_visible()
   assert page.locator('#inspect').evaluate('(e)=>e.scrollHeight<=e.clientHeight+2'),'clipped note'
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'open note overflow'
   page.locator('#inspect').screenshot(path=str(OUT/f'{engine}-{width}-note.png'))
   page.keyboard.press('Escape')
   assert page.locator('#note-w4').get_attribute('aria-expanded')=='false'
   page.locator('#note-w3').click();page.wait_for_timeout(300)
   assert '6:42' in text_of('#j-out')
   assert 'Band adjusted' in text_of('#h-read')
   page.locator('#i-close').click();page.locator('#note-w2').click();page.wait_for_timeout(300)
   assert page.locator('#j-strava').is_visible(),'historic source link preserved'
   page.goto(base+'/labs/speed-that-endures/#note-w4',wait_until='networkidle')
   assert page.locator('#note-w4').get_attribute('aria-expanded')=='true','direct deep link'
   assert '33:40.8' in text_of('#j-out')
   assert not errors,errors
   checks.append({'engine':engine,'viewport':[width,height],'status':'pass','measurements':True,'historical_notes':True,'deep_link':True,'no_overflow':True,'no_clipping':True})
   (OUT/'browser.json').write_text(json.dumps(checks,indent=2))
   print(json.dumps(checks[-1]),flush=True)
   context.close()
  browser.close()
finally:
 server.shutdown()
print(json.dumps(checks,indent=2))
