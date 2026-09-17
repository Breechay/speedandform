"""Public notes and a local-only email draft. Every test avoids real email and analytics.
CONTACT_NOTES_LIVE=1 checks the actual public site; otherwise a local route fixture.
BROWSER=webkit exercises WebKit, not physical Safari. No browser-policy overrides.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote, parse_qs
import os, json, re, threading, xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
LIVE=os.environ.get('CONTACT_NOTES_LIVE')=='1';ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('CONTACT_NOTES_ARTIFACTS','/tmp/contact-notes-review'));OUT.mkdir(parents=True,exist_ok=True)
report={'live':LIVE,'engine':ENGINE,'physicalDevice':False,'commit':os.environ.get('GITHUB_SHA'),'checks':[],'errors':[]}
def check(label,ok):
    assert ok,label
    report['checks'].append(label)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(R),**kw)
    def log_message(self,*a):pass
    def do_GET(self):
        route=unquote(urlsplit(self.path).path).lstrip('/')
        for f in [route or 'index.html',route+'.html',route.rstrip('/')+'/index.html']:
            if (R/f).is_file():self.path='/'+f;return super().do_GET()
        self.send_error(404)
server=None
if LIVE:BASE='https://speedandform.com'
else:
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
# Always resolve from the repository, not the process working directory.
paths=['/field-notes','/ask/']+['/'+p.relative_to(R).as_posix()[:-10] for p in sorted((R/'field-notes').glob('*/index.html'))]
widths=[390,1440] if LIVE else [375,390,430,768,1024,1440]
# Diagnosis 35232904590 identified automatic Cloudflare script injection on
# public reading pages. The script stays BLOCKED, never downloaded or executed.
# Unknown destinations, data submissions and any injection on Ask still fail.
def known_blocked_host_script(row):
    return (LIVE and row['method']=='GET' and row['resourceType']=='script'
        and re.fullmatch(r'https://static\.cloudflareinsights\.com/beacon\.min\.js(?:/v[0-9a-f]+)?',row['url']) is not None
        and row['frame'].startswith(BASE+'/')
        and urlsplit(row['frame']).path.rstrip('/')!='/ask')
try:
    with sync_playwright() as pw:
        opts={'headless':True}
        if ENGINE=='chromium' and os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
        browser=getattr(pw,ENGINE).launch(**opts)
        ctx=browser.new_context(reduced_motion='reduce');traffic=[];blocked=[]
        def guard(route):
            req=route.request;allowed=req.method=='GET' and req.url.startswith(BASE+'/')
            traffic.append((req.method,req.url,allowed))
            if allowed:route.continue_()
            else:
                blocked.append({'method':req.method,'url':req.url,'frame':req.frame.url,'resourceType':req.resource_type})
                route.abort()
        ctx.route('**/*',guard);page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
        for w in widths:
            page.set_viewport_size({'width':w,'height':900})
            for i,path in enumerate(paths):
                response=page.goto(BASE+path,wait_until='networkidle')
                check(f'{path} {w}: public page response',response.status==200)
                check(f'{path} {w}: revision, single heading and main',page.locator('html[data-contact-notes="20260917-p6a"]').count()==1 and page.locator('h1').count()==1 and page.locator('main').count()==1)
                check(f'{path} {w}: contained layout',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
                check(f'{path} {w}: no cropped text',page.evaluate("[...document.querySelectorAll('h1,h2,h3,p,textarea')].every(e=>e.clientWidth===0||e.scrollWidth<=e.clientWidth+2)"))
                check(f'{path} {w}: readable paragraphs',page.locator('.cn-dek').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)>=18'))
                if i==0:
                    check(f'{w}: real album image loaded',page.locator('.cn-album img').evaluate('e=>e.complete&&e.naturalWidth>0'))
                    check(f'{w}: four distinct authored notes',page.locator('a[href^="/field-notes/"]:not([href$="feed.xml"])').evaluate_all('es=>new Set(es.map(e=>e.pathname)).size')==4)
                if i==1:check(f'{w}: composer usable',page.locator('#question-composer').is_visible() and page.locator('#question').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)>=16'))
                if w in [390,1440] and (i<3):page.screenshot(path=str(OUT/f'{["notes","ask","article"][i]}-{w}.png'),full_page=True)
        # The actual feed parses and every entry is a real public destination.
        res=ctx.request.get(BASE+'/field-notes/feed.xml');xml=ET.fromstring(res.text());items=xml.findall('channel/item')
        check('RSS 2.0 XML, channel and five stable entries',res.status==200 and xml.attrib['version']=='2.0' and len(items)==5)
        check('RSS has unique canonical GUIDs and no invented dates',len({i.findtext('guid') for i in items})==5 and all(i.findtext('link')==i.findtext('guid') and i.find('pubDate') is None for i in items))
        for item in items:check('Feed destination '+item.findtext('link'),ctx.request.get(BASE+urlsplit(item.findtext('link')).path).status==200)
        # Public context only, encoded message stays local, open email is not Send.
        page.goto(BASE+'/ask/?about=easy-run');page.locator('#question-context').wait_for(state='visible')
        page.locator('#question').fill('Bonjour José\nIs this easy enough?')
        href=page.locator('#question-email').get_attribute('href');query=parse_qs(urlsplit(href).query)
        check('UTF-8 body and public article context',urlsplit(href).path=='brice@speedandform.com' and 'Bonjour José\r\nIs this easy enough?' in query['body'][0] and 'https://speedandform.com/easy-run' in query['body'][0])
        check('No message in URL or persistent storage',page.url.endswith('about=easy-run') and page.evaluate('localStorage.length===0&&sessionStorage.length===0'))
        page.evaluate("document.querySelector('#question-email').addEventListener('click',e=>e.preventDefault())")
        page.locator('#question-email').click();check('Opening email never claims sent',page.locator('#question-status').inner_text().endswith('Nothing has been sent by this page.'))
        page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async x=>{window.__copied=x}}})")
        page.locator('#question-copy').click();page.wait_for_function("document.querySelector('#question-status').textContent==='Copied.'")
        check('Copy keeps complete text',page.evaluate('window.__copied')==query['body'][0])
        page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied')}}})")
        page.locator('#question-copy').click();page.locator('.cn-manual-copy').wait_for()
        check('Denied clipboard gets selected manual fallback',page.locator('.cn-manual-copy').input_value()==query['body'][0].replace('\r\n','\n') and page.locator('.cn-manual-copy').evaluate('e=>document.activeElement===e&&e.selectionEnd===e.value.length'))
        page.locator('#question').fill('A revised question');check('Editing clears stale copied draft',page.locator('.cn-manual-copy').count()==0)
        page.locator('#question').fill('é'*1000);check('Long draft is not truncated into a mailto',not 'body=' in page.locator('#question-email').get_attribute('href') and 'copy the text' in page.locator('#question-status').inner_text())
        page.locator('#question-copy').click();page.locator('.cn-manual-copy').wait_for();check('Long copy fallback preserves all 1000 characters',page.locator('.cn-manual-copy').input_value().endswith('é'*1000))
        page.reload();check('Reload does not restore a private draft',page.locator('#question').input_value()=='')
        page.goto(BASE+'/ask/?about=%3Cscript%3E');check('Invalid context ignored, no reflected markup',page.locator('#question-context').is_hidden() and page.locator('#question-email').get_attribute('href').startswith('mailto:brice@speedandform.com?subject=A%20question'))
        page.goto(BASE+'/ask/?about=unknown-note');page.wait_for_timeout(100);check('Unknown context ignored',page.locator('#question-context').is_hidden())
        page.route('**/js/question-contexts.json',lambda r:r.abort());page.goto(BASE+'/ask/?about=easy-run');page.locator('#question').fill('Still usable');check('Context network failure keeps email usable','Still%20usable' in page.locator('#question-email').get_attribute('href'));page.unroute('**/js/question-contexts.json')
        page.goto(BASE+'/ask/');page.locator('#question-copy').click();check('Empty copy offers recovery and focus',page.locator('#question').evaluate('e=>document.activeElement===e') and 'Write a question' in page.locator('#question-status').inner_text())
        page.locator('summary').click();check('Privacy disclosure is readable and explicit',page.locator('.cn-privacy p').is_visible() and 'not submitted' in page.locator('.cn-privacy p').inner_text())
        # Share only a canonical page address, not an arrival query or a private draft.
        page.goto(BASE+paths[2]+'?campaign=test')
        page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:async x=>{window.__shared=x}})")
        page.locator('[data-share]').click();check('Sharing strips arrival query',page.evaluate('window.__shared.url')=='https://speedandform.com'+paths[2])
        page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError')}})")
        page.locator('[data-share]').click();check('Cancelled sharing does not say copied',page.locator('.cn-sharing .cn-status').inner_text()=='')
        page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async x=>{window.__copied=x}}})")
        page.locator('[data-share]').click();page.wait_for_function("document.querySelector('.cn-sharing .cn-status').textContent==='Copied.'")
        check('Share fallback copies only canonical address',page.evaluate('window.__copied')=='https://speedandform.com'+paths[2])
        page.goto(BASE+'/field-notes');page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async x=>{window.__copied=x}}})");page.locator('[data-copy]').click();page.wait_for_function("window.__copied")
        check('Copy feed address works',page.evaluate('window.__copied')=='https://speedandform.com/field-notes/feed.xml')
        page.goto(BASE+'/ask/');page.keyboard.press('Tab');check('Keyboard starts with skip link',page.evaluate("document.activeElement.className==='cn-skip'"));page.keyboard.press('Enter');check('Skip reaches main',page.evaluate("document.activeElement.id==='main'"))
        for path in paths[:3]:
            page.set_viewport_size({'width':390,'height':900});page.goto(BASE+path);page.evaluate("""() => {const sizes=[...document.querySelectorAll('p,li,a,button,label,summary,textarea,h1,h2,h3')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]); for(const [e,size] of sizes)e.style.setProperty('font-size',`${size*2}px`,'important')}""")
            check(path+': enlarged text stays within the page',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            if not LIVE:page.screenshot(path=str(OUT/f'large-text-{paths.index(path)}.png'),full_page=True)
        check('Reduced motion respected',page.evaluate("getComputedStyle(document.documentElement).scrollBehavior==='auto'"))
        nj=browser.new_context(java_script_enabled=False);nj.route('**/*',guard);p2=nj.new_page()
        for path in paths:
            p2.goto(BASE+path);check(path+': no-JavaScript reading and real destinations',p2.locator('h1').is_visible() and p2.locator('a[href="mailto:brice@speedandform.com"]').count()==(1 if path=='/ask/' else 0))
        report['blockedRequests']=blocked
        check('No scripts throw',not report['errors'])
        check('No submission requests attempted',all(method=='GET' for method,url,allowed in traffic))
        check('Only same-site GET requests permitted',all(not allowed or (method=='GET' and url.startswith(BASE+'/')) for method,url,allowed in traffic))
        check('Blocked requests are only known hosting scripts outside Ask',all(known_blocked_host_script(row) for row in blocked))
        check('Ask never requests a hosting analytics script',all(urlsplit(row['frame']).path.rstrip('/')!='/ask' for row in blocked))
        nj.close();ctx.close();browser.close()
    report['result']='PASS'
except Exception as e:
    report['result']='FAIL';report['failure']=repr(e);report['blockedRequests']=locals().get('blocked',[]);raise
finally:
    (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n')
    if server:server.shutdown()
    print(f"{report.get('result')}: {len(report['checks'])} {ENGINE} {'live' if LIVE else 'served'} Notes/Ask checks; no email sent.")
