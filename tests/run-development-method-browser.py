"""Responsive acceptance for the public Run Development method page."""
import json
import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
ENGINE=os.environ.get('FORM_QA_BROWSER','chromium')
OUT=Path(os.environ.get('FORM_QA_ARTIFACTS','.coaching-funnel-qa'))/ENGINE/'method'
OUT.mkdir(parents=True,exist_ok=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
report=[]
try:
    with sync_playwright() as p:
        browser=getattr(p,ENGINE).launch()
        try:
            for w,h in [(320,760),(390,844),(768,1024),(1440,1000)]:
                page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce',is_mobile=w<600,has_touch=w<600)
                errors=[]
                page.on('pageerror',lambda e: errors.append(str(e)))
                page.route('**/*',lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
                page.goto(base+'the-method.html',wait_until='domcontentloaded')
                assert page.locator('h1').inner_text()=='Develop the runner.'
                assert page.locator('.method-wind-line').inner_text()=='Like a kite upon the wind.'
                assert page.locator('.method-close p').inner_text()=='Reveal what wants to be set free.'
                assert page.locator('.method-step').count()==7
                assert page.locator('.method-close a').get_attribute('href')=='/#begin'
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                for sel in ['.method-hero','.method-step','.method-wind','.method-principle-grid','.method-close']:
                    box=page.locator(sel).first.bounding_box()
                    assert box and box['x']>=-1 and box['x']+box['width']<=w+1,(w,sel,box)
                assert not errors,errors
                page.screenshot(path=str(OUT/f'method-{w}.png'),full_page=True)
                report.append({'width':w,'height':h,'pass':True})
                print('PASS',ENGINE,w,'method page, no overflow',flush=True)
                page.close()
        finally:
            browser.close()
finally:
    server.shutdown();server.server_close()
    (OUT/'report.json').write_text(json.dumps(report,indent=2))
print('All',len(report),ENGINE,'method-page checks passed. Screenshots are browser viewports, not physical-device tests.',flush=True)
