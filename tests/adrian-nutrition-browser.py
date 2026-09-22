from pathlib import Path
import http.server, threading, json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
out=Path('/tmp/adrian-nutrition');out.mkdir(parents=True,exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
checks=[]
with sync_playwright() as p:
    browser=p.chromium.launch()
    for w in [375,390,430,768,1024,1440]:
        page=browser.new_page(viewport={'width':w,'height':900},reduced_motion='reduce')
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base+'/plans/adrian-nutrition-phase-01/',wait_until='domcontentloaded')
        assert page.locator('h1').inner_text()=='Fuel Your Work'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow at {w}'
        page.locator('a[href="#preferences"]').click()
        assert page.locator('#preferences').evaluate('(el)=>el.open')
        page.evaluate('document.querySelectorAll("details").forEach(el=>el.open=true)')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'open disclosure overflow {w}'
        if w in [390,1440]:page.screenshot(path=str(out/f'nutrition-{w}-open.png'),full_page=True)
        page.evaluate('document.querySelectorAll("details").forEach(el=>el.open=false);window.scrollTo(0,0)')
        if w in [390,1440]:page.screenshot(path=str(out/f'nutrition-{w}.png'),full_page=True)
        assert not errors,errors
        checks.append({'width':w,'overflow':False,'disclosures':'pass','page_errors':errors})
        page.close()
    page=browser.new_page(viewport={'width':390,'height':900})
    page.goto(base+'/plans/adrian-nutrition-phase-01/',wait_until='domcontentloaded')
    page.evaluate('document.body.style.fontSize="34px";document.querySelectorAll("details").forEach(e=>e.open=true)')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'200% body text overflow'
    page.close()
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/labs/adrian-runner-mass/',wait_until='domcontentloaded')
    page.wait_for_selector('#evidence',timeout=20000)
    assert page.locator('#intake-20260922').count()==1
    assert page.locator('#intake-20260922 tbody tr').count()==6
    assert page.locator('a[href="/plans/adrian-nutrition-phase-01/"]').count()>=2
    assert not errors,errors
    page.locator('#intake-20260922').screenshot(path=str(out/'study-intake.png'))
    page.screenshot(path=str(out/'study-top.png'))
    checks.append({'study_js_render':'pass','new_result_rows':6,'page_errors':errors})
    browser.close()
(out/'checks.json').write_text(json.dumps(checks,indent=2))
server.shutdown()
print(json.dumps(checks,indent=2))
