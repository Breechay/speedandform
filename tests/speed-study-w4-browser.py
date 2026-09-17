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
   assert page.locator('.status').inner_text()=='In progress · updated Sep 17'
   page.locator('.hero .plan-link[href="#w4-read"]').click()
   page.wait_for_timeout(150)
   assert page.locator('#w4-read').is_visible()
   text=page.locator('#w4-read').inner_text()
   for expected in ['33:40.8','34:17.9','6:44','6:52','6:48.9','6:54.1','3 × 10 min','2 min floats']:
    assert expected in text,expected
   assert page.locator('.w4-splits li').count()==5
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),f'page overflow {width}'
   for box in page.locator('#w4-read .w4-athlete').all():
    assert box.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),f'athlete overflow {width}'
   page.locator('#w4-read').screenshot(path=str(OUT/f'{engine}-{width}-current-read.png'))
   page.locator('#w4-read a[href="#note-w4"]').click();page.wait_for_timeout(150)
   assert page.locator('#note-w4').get_attribute('aria-expanded')=='true'
   assert '33:40.8' in page.locator('#j-out').inner_text()
   assert '34:17.9' in page.locator('#h-out').inner_text()
   assert '6:54.1' in page.locator('#h-outs').inner_text()
   assert page.locator('#h-effort').inner_text()=='Not reported'
   assert not page.locator('#j-strava').is_visible()
   assert not page.locator('#h-strava').is_visible()
   assert page.locator('#inspect').evaluate('(e)=>e.scrollHeight<=e.clientHeight+2'),'clipped note'
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'open note overflow'
   page.locator('#inspect').screenshot(path=str(OUT/f'{engine}-{width}-note.png'))
   page.keyboard.press('Escape')
   assert page.locator('#note-w4').get_attribute('aria-expanded')=='false'
   page.locator('#note-w3').click();page.wait_for_timeout(150)
   assert '6:42' in page.locator('#j-out').inner_text()
   assert 'Band adjusted' in page.locator('#h-read').inner_text()
   page.locator('#i-close').click();page.locator('#note-w2').click();page.wait_for_timeout(150)
   assert page.locator('#j-strava').is_visible(),'historic source link preserved'
   page.goto(base+'/labs/speed-that-endures/#note-w4',wait_until='networkidle')
   assert page.locator('#note-w4').get_attribute('aria-expanded')=='true','direct deep link'
   assert '33:40.8' in page.locator('#j-out').inner_text()
   assert not errors,errors
   checks.append({'engine':engine,'viewport':[width,height],'status':'pass','measurements':True,'historical_notes':True,'deep_link':True,'no_overflow':True,'no_clipping':True})
   context.close()
  browser.close()
finally:
 server.shutdown()
(OUT/'browser.json').write_text(json.dumps(checks,indent=2))
print(json.dumps(checks,indent=2))
