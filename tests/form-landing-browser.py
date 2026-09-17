"""FORM page browser acceptance. Blocks external traffic and all submissions."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
import os, json, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('FORM_LANDING_ARTIFACTS','/tmp/form-landing-review')); OUT.mkdir(parents=True,exist_ok=True)
report={'checks':[],'errors':[],'physicalDevice':False}
def check(name,ok):
    assert ok,name
    report['checks'].append(name)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
    def do_GET(self):
        r=unquote(urlsplit(self.path).path).lstrip('/')
        for f in [r or 'index.html',r+'.html',r.rstrip('/')+'/index.html']:
            if (ROOT/f).is_file():self.path='/'+f;return super().do_GET()
        self.send_error(404)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
    options={'headless':True}
    if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**options)
    ctx=browser.new_context(reduced_motion='reduce')
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') and r.request.method=='GET' else r.abort())
    page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
    for width in [375,390,430,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':960});res=page.goto(BASE+'/form/',wait_until='networkidle')
        check(f'HTTP 200 at {width}',res.status==200)
        check(f'No overflow at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check(f'One main heading at {width}',page.locator('h1').count()==1)
        check(f'Hero gives an answer at {width}',page.locator('.fl-lede').evaluate('(e)=>e.getBoundingClientRect().bottom<=innerHeight'))
        check(f'Primary app link visible in first screen at {width}',page.locator('.fl-hero .fl-button').evaluate('(e)=>e.getBoundingClientRect().bottom<=innerHeight'))
        check(f'Readable body at {width}',page.locator('.fl-intro').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=17'))
        check(f'Native field material at {width}',page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(7, 17, 15)')
        for img in page.locator('img').all():img.scroll_into_view_if_needed();img.evaluate('(i)=>i.decode()')
        check(f'Official screenshot loaded at {width}',page.locator('.fl-store-screen img').evaluate('(i)=>i.complete&&i.naturalWidth==600&&i.naturalHeight==1299'))
        check(f'Preview label visible at {width}',page.get_by_text('Design preview',exact=True).is_visible())
        check(f'All tabs present at {width}',page.get_by_role('tab').count()==5)
        for tab in page.get_by_role('tab').all():
            tab.click();check(f'{tab.inner_text()} panel contained at {width}',page.get_by_role('tabpanel').count()==1 and page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        page.get_by_role('tab',name='Easy',exact=True).click()
        for d in page.locator('details').all():d.locator('summary').click()
        check(f'Open answers contained at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        for d in page.locator('details').all():d.locator('summary').click()
        if width in [390,1440]:
            page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/f'form-{width}.png'),full_page=True)
            page.screenshot(path=str(OUT/f'hero-{width}.png'))
            page.locator('#demo').screenshot(path=str(OUT/f'sessions-{width}.png'))
    for width in [390,1440]:
        page.set_viewport_size({'width':width,'height':960});page.goto(BASE+'/form/');page.evaluate("document.body.style.zoom='2'")
        for d in page.locator('details').all():d.evaluate('(d)=>d.open=true')
        check(f'200 percent open answers at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/form/')
    page.keyboard.press('Tab');check('Skip link receives first focus',page.evaluate("document.activeElement.className==='fl-skip'"))
    page.keyboard.press('Enter');check('Skip enters main',page.evaluate("document.activeElement.id==='main'"))
    first=page.get_by_role('tab',name='Easy',exact=True);first.focus();page.keyboard.press('ArrowRight')
    check('Right arrow selects and focuses next tab',page.evaluate("document.activeElement.id==='tab-type-threshold'") and page.locator('#type-threshold').is_visible())
    page.keyboard.press('End');check('End selects last tab',page.evaluate("document.activeElement.id==='tab-type-long'"))
    page.keyboard.press('ArrowRight');check('Right arrow wraps',page.evaluate("document.activeElement.id==='tab-type-easy'"))
    page.keyboard.press('ArrowLeft');check('Left arrow wraps',page.evaluate("document.activeElement.id==='tab-type-long'"))
    page.keyboard.press('Home');check('Home returns to first tab',page.evaluate("document.activeElement.id==='tab-type-easy'"))
    page.keyboard.press('Tab');check('Tab enters active panel',page.evaluate("document.activeElement.id==='type-easy'"))
    check('Only active tab is in tab order',page.locator('[role=tab][tabindex="0"]').count()==1)
    page.goto(BASE+'/form/#type-speed');check('Direct explanation URL opens correct panel',page.locator('#type-speed').is_visible())
    page.evaluate("location.hash='type-long'");page.wait_for_function("!document.getElementById('type-long').hidden")
    check('Changed hash switches panels',page.locator('#type-long').is_visible())
    page.goto(BASE+'/form/');page.locator('.fl-preview-doors a').nth(1).click();check('Illustration door opens actual section',urlsplit(page.url).fragment=='session-details')
    page.locator('.fl-faq summary').nth(2).click();check('New design not sold as current screenshot','previews the new interface' in page.locator('.fl-faq details').nth(2).inner_text())
    check('Reduced motion honored',page.locator('.fl-preview').evaluate('(e)=>getComputedStyle(e).animationName')=='none' and page.locator('html').evaluate('(e)=>getComputedStyle(e).scrollBehavior')=='auto')
    # Test the existing provider-agnostic hook without opening Apple or sending an event.
    page.evaluate("document.addEventListener('click',e=>{if(e.target.closest('[data-sf-event]'))e.preventDefault()});window.sfEvents=[]")
    page.locator('.fl-hero [data-sf-event]').click();check('Store click retains existing event hook',len(page.evaluate('window.sfEvents'))==1)
    page.evaluate("window.sfTrack=(event,data)=>{window.seen=[event,data]}");page.locator('.fl-close [data-sf-event]').click();check('Optional existing tracker gets only click data',page.evaluate('window.seen[0]')=='final_appstore_click')
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    nojs.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') and r.request.method=='GET' else r.abort())
    np=nojs.new_page();np.goto(BASE+'/form/')
    check('Five explanations remain without JavaScript',np.locator('[data-session]:visible').count()==5)
    check('No empty tabs without JavaScript',not np.locator('#session-tabs').is_visible())
    np.locator('.fl-faq summary').first.click();check('Questions work without JavaScript',np.locator('details').first.evaluate('(d)=>d.open'))
    check('No-JS store link remains functional',np.locator('.fl-hero .fl-button').get_attribute('href').endswith('/id6761313085'))
    check('No-JS page has no overflow',np.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    check('No runtime errors',not report['errors']);nojs.close();ctx.close();browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['failure']=str(e);raise
finally:
 server.shutdown();(OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['checks']),'FORM landing browser checks.')
