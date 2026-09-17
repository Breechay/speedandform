"""Public guide browser acceptance. All external traffic blocked; nothing is submitted."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
import os, json, threading
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TRAINING_GUIDE_ARTIFACTS', '/tmp/training-guides-review')); OUT.mkdir(parents=True, exist_ok=True)
report = {'checks': [], 'errors': [], 'physicalDevice': False}
def check(name, ok):
    assert ok, name
    report['checks'].append(name)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *args): pass
    def do_GET(self):
        r=unquote(urlsplit(self.path).path).lstrip('/')
        for f in [r or 'index.html', r+'.html', r.rstrip('/')+'/index.html']:
            if (ROOT/f).is_file(): self.path='/'+f; return super().do_GET()
        self.send_error(404)
server=ThreadingHTTPServer(('127.0.0.1', 0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
ROUTES=['training-week','strength','recovery','fueling']
try:
    with sync_playwright() as p:
        options={'headless':True}
        if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
        browser=p.chromium.launch(**options)
        ctx=browser.new_context(reduced_motion='reduce')
        ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') else r.abort())
        page=ctx.new_page(); page.on('pageerror',lambda e:report['errors'].append(str(e)))
        for width in [375,390,430,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':960})
            for route in ROUTES:
                response=page.goto(BASE+'/'+route,wait_until='networkidle')
                check(f'{route}: HTTP 200 at {width}',response.status==200)
                check(f'{route}: contained at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
                check(f'{route}: single heading at {width}',page.locator('h1').count()==1)
                check(f'{route}: answer within first screen at {width}',page.locator('.guide-answer').evaluate('(e)=>e.getBoundingClientRect().bottom<960'))
                check(f'{route}: readable body at {width}',page.locator('.guide-body p').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=17'))
                check(f'{route}: established cream at {width}',page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(236, 230, 218)')
                for d in page.locator('details').all():d.evaluate('(d)=>d.open=true')
                check(f'{route}: open disclosures contained at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
                for d in page.locator('details').all():d.evaluate('(d)=>d.open=false')
                if width in [390,1440]:page.screenshot(path=str(OUT/f'{route}-{width}.png'),full_page=True)
        for route in ROUTES:
            page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/'+route)
            page.keyboard.press('Tab');check(route+': skip first',page.evaluate("document.activeElement.className==='guide-skip'"))
            page.keyboard.press('Enter');check(route+': skip reaches main',page.evaluate("document.activeElement.id==='main'"))
            page.locator('.guide-ref:visible').first.click();page.wait_for_function("document.querySelector('#sources details').open")
            check(route+': source link opens context',urlsplit(page.url).fragment.startswith('source-'))
            check(route+': related coaching path',page.locator('.guide-help a').get_attribute('href')=='/#begin')
            for width in [390,1440]:
                page.set_viewport_size({'width':width,'height':960});page.goto(BASE+'/'+route);page.evaluate("document.body.style.zoom='2'")
                for d in page.locator('details').all():d.evaluate('(d)=>d.open=true')
                check(f'{route}: 200 percent and open disclosures at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/fueling')
        check('Calculator is progressively enabled',page.locator('#fuel-calculator').is_visible())
        page.locator('#fuel-form button').click();check('Worked example computes 75g and 50g/h',page.locator('#fuel-result strong').inner_text()=='75 g total · 50 g per hour')
        page.locator('#fuel-minutes').fill('120');check('Edited amounts remove stale result',page.locator('#fuel-result strong').count()==0)
        page.locator('#fuel-form button').click();check('Changed duration computes 37.5g/h',page.locator('#fuel-result strong').inner_text()=='75 g total · 37.5 g per hour')
        for field,value in [('minutes',''),('minutes','361'),('portion','-1'),('count','41'),('drink','1001')]:
            page.goto(BASE+'/fueling');page.locator('#fuel-'+field).fill(value);page.locator('#fuel-form button').click()
            check('Reject '+field+' '+repr(value),page.locator('#fuel-error').is_visible() and page.locator('#fuel-'+field).get_attribute('aria-invalid')=='true')
            check('Error focuses '+field+' '+repr(value),page.evaluate('document.activeElement.id')=='fuel-'+field)
        page.goto(BASE+'/fueling');page.locator('#fuel-count').fill('1.5');page.locator('#fuel-form button').click();check('Fractional portions compute',page.locator('#fuel-result strong').inner_text()=='62.5 g total · 41.7 g per hour')
        page.locator('#fuel-count').fill('0');page.locator('#fuel-drink').fill('0');page.locator('#fuel-form button').click();check('Zero is not interpreted as a missing value','0 g total' in page.locator('#fuel-result').inner_text())
        page.locator('#fuel-count').fill('10');page.locator('#fuel-form button').click();check('High arithmetic does not become a prescription','does not establish' in page.locator('#fuel-result').inner_text())
        page.set_viewport_size({'width':390,'height':960});page.goto(BASE+'/fueling');page.locator('#fuel-form button').click();page.locator('#fuel-calculator').screenshot(path=str(OUT/'fuel-calculator-390.png'))
        nojs=browser.new_context(java_script_enabled=False)
        nojs.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') else r.abort())
        np=nojs.new_page()
        for route in ROUTES:
            np.goto(BASE+'/'+route)
            check(route+': complete reading without JS',np.locator('.guide-answer').is_visible() and np.locator('.guide-section').count()>=5)
            np.locator('details summary').first.click();check(route+': native disclosure without JS',np.locator('details').first.evaluate('(d)=>d.open'))
        check('No-JS calculator is hidden, formula remains',not np.locator('#fuel-calculator').is_visible() and '75 ÷ 1.5 = 50' in np.locator('noscript').inner_text())
        check('No runtime errors',not report['errors'])
        nojs.close();ctx.close();browser.close()
    report['result']='PASS'
except Exception as e:
    report['result']='FAIL';report['failure']=str(e);raise
finally:
    server.shutdown();(OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['checks']),'training-guide browser checks.')
