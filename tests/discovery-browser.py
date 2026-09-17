"""Public discovery acceptance. Local route emulation is not production Netlify proof."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit, unquote
import os, json, tempfile, shutil, subprocess, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('DISCOVERY_ARTIFACTS','/tmp/discovery-browser'));OUT.mkdir(parents=True,exist_ok=True)
catalog_urls=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./scripts/discovery-catalog.cjs").entries.map(e=>e.url)))'],cwd=ROOT,text=True))
checks=[]
def check(name,value):
    assert value,name
    checks.append(name)
with tempfile.TemporaryDirectory(prefix='form-discovery-') as tmp:
    site=Path(tmp)/'site';shutil.copytree(ROOT,site,ignore=shutil.ignore_patterns('.git','node_modules','__pycache__'))
    subprocess.run(['node','scripts/build-cream-reading.cjs'],cwd=site,check=True)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**k):super().__init__(*a,directory=str(site),**k)
        def log_message(self,*a):pass
        def do_GET(self):
            p=unquote(urlsplit(self.path).path).lstrip('/')
            if '..' in Path(p).parts:self.send_error(400);return
            for c in [p or 'index.html',p+'.html',p.rstrip('/')+'/index.html']:
                f=site/c
                if f.is_file():self.path='/'+c;return super().do_GET()
            b=(site/'404.html').read_bytes();self.send_response(404);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(b)
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}'
    with sync_playwright() as pw:
        kwargs={'headless':True}
        if os.environ.get('CHROMIUM_EXECUTABLE'):kwargs['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
        browser=pw.chromium.launch(**kwargs)
        context=browser.new_context(reduced_motion='reduce')
        context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(base) else r.abort())
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        for width in [375,390,430,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':960})
            for route in ['/library','/search?q=hyrox','/page-does-not-exist-pass2','/library/easy-days/','/thursday','/']:
                response=page.goto(base+route,wait_until='domcontentloaded');page.wait_for_timeout(110)
                if route.startswith('/search'):page.wait_for_function("document.querySelector('#discovery-status').textContent.includes('result')")
                check(f'{route} contained at {width}',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
                if route=='/library':
                    ys=page.locator('.discovery-nav a').evaluate_all('(links)=>links.map(a=>Math.round(a.getBoundingClientRect().top))')
                    check(f'Navigation stays on one row at {width}',len(set(ys))==1)
                    if width==390:check('First useful guide reaches the first mobile screen',page.locator('.discovery-link').first.bounding_box()['y']<960)
                if width in [390,1440]:
                    name={'/':'home','/library':'library','/search?q=hyrox':'search','/page-does-not-exist-pass2':'404','/library/easy-days/':'article','/thursday':'thursday'}[route]
                    page.screenshot(path=str(OUT/(name+f'-{width}.png')))
            if width==390:
                page.goto(base+'/library');page.locator('#training').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'library-reading-390.png'))
                page.locator('.discovery-archive summary').click();check('Archive opens on touch-sized view',page.locator('.discovery-archive').get_attribute('open') is not None)
        page.set_viewport_size({'width':1440,'height':1000})
        for route in ['/library','/search?q=half+marathon','/page-does-not-exist-pass2']:
            page.goto(base+route);page.evaluate("document.body.style.zoom='2'");check(route+' at 200 percent',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
        page.goto(base+'/library');page.keyboard.press('Tab');check('Keyboard skip link',page.evaluate("document.activeElement.className==='discovery-skip'"));page.keyboard.press('Enter');check('Skip reaches main',page.evaluate("location.hash==='#main'"))
        page.locator('#discovery-query').fill('threshold');page.get_by_role('button',name='Search',exact=True).click();page.wait_for_url('**/search?q=threshold');page.wait_for_function("document.querySelector('#discovery-status').textContent.includes('result')")
        check('Library form reaches query-aware results',page.locator('#discovery-output a[href="/threshold-training"]').count()>0)
        page.locator('#discovery-query').fill('threshhold');page.wait_for_timeout(200);check('Small typo finds threshold',page.locator('#discovery-output a[href="/threshold-training"]').count()>0)
        page.locator('#discovery-query').fill('zzxyqqz');page.wait_for_timeout(200);check('Empty state has useful fallback',page.get_by_text('Try the idea in a few words.').count()==1)
        page.locator('#discovery-query').fill('<img src=x onerror="window.discoveryXSS=1">');page.wait_for_timeout(200);check('Input never becomes markup',page.evaluate('!window.discoveryXSS && !document.querySelector("#discovery-output img")'))
        page.locator('#discovery-clear').click();check('Clear removes q and keeps focus',page.evaluate("!new URL(location).searchParams.has('q') && document.activeElement.id==='discovery-query'"))
        page.evaluate("history.pushState({},'', '/search?q=hyrox');dispatchEvent(new PopStateEvent('popstate'))");check('History state restores query',page.locator('#discovery-query').input_value()=='hyrox')
        check('History state restores results',page.locator('#discovery-output a[href="/labs/hyrox/"]').count()==1)
        page.route('**/search-index.json',lambda r:r.abort())
        page.goto(base+'/search?q=easy');page.wait_for_function("document.querySelector('#discovery-status').textContent.includes('unavailable')")
        check('Network failure is not false zero results',page.get_by_text('The Library is still open.').count()==1)
        page.unroute('**/search-index.json');page.get_by_role('button',name='Try again').click();page.wait_for_function("document.querySelector('#discovery-status').textContent.includes('result')")
        check('Retry succeeds',page.locator('#discovery-output a').count()>0)
        page.goto(base+'/page-does-not-exist-pass2');page.screenshot(path=str(OUT/'404-1440.png'))
        check('No errors on changed discovery pages',len(errors)==0)
        nojs=browser.new_context(java_script_enabled=False);p=nojs.new_page();p.goto(base+'/library');check('Library works without JS',sorted(p.locator('.discovery-link').evaluate_all('(links)=>links.map(a=>a.getAttribute("href"))'))==sorted(catalog_urls));p.goto(base+'/search');check('Search offers no-JS Library path',p.locator('noscript a').is_visible())
        browser.close()
    server.shutdown()
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'count':len(checks),'browser':'Chromium','viewports':[375,390,430,768,1024,1440],'physicalDevice':False},indent=2))
print(f'PASS: {len(checks)} browser checks; screenshots in {OUT}')
