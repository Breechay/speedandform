"""Browser checks against generated pages. Viewport emulation is not a physical-device test."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlsplit,unquote
import os, json, hashlib, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('TRACK_GALLERY_ARTIFACTS','/tmp/track-gallery-browser'));OUT.mkdir(parents=True,exist_ok=True)
report={'checks':[], 'errors':[]}
def check(label,value):
    assert value,label
    report['checks'].append(label)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
    def log_message(self,*a):pass
    def do_GET(self):
        p=unquote(urlsplit(self.path).path).lstrip('/')
        if '..' in Path(p).parts:self.send_error(400);return
        for c in [p or 'index.html',p+'.html',p.rstrip('/')+'/index.html']:
            if (ROOT/c).is_file():self.path='/'+c;return super().do_GET()
        return super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
album=json.loads((ROOT/'track/media-manifest.json').read_text())['albums'][0]
route='/track/'+album['slug']+'/'
try:
 with sync_playwright() as p:
    opts={'headless':True}
    if os.environ.get('CHROMIUM_EXECUTABLE'):opts['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
    browser=p.chromium.launch(**opts)
    ctx=browser.new_context(reduced_motion='reduce',accept_downloads=True,has_touch=True)
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(base) else r.abort())
    page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
    requests=[];page.on('request',lambda r:requests.append(r.url))
    for width in [375,390,430,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':960})
        for dest,name in [('/track/','index'),(route,'album')]:
            page.goto(base+dest,wait_until='networkidle')
            check(f'{name}: contained at {width}',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
            check(f'{name}: one main heading at {width}',page.locator('h1').count()==1)
            check(f'{name}: lead image loaded at {width}',page.locator('img').first.evaluate('(i)=>i.complete&&i.naturalWidth>0'))
            if width in [390,1440]:page.screenshot(path=str(OUT/f'{name}-{width}.png'),full_page=True)
        if width in [390,1440]:
            page.locator('[data-frame]').first.click()
            page.wait_for_function("document.querySelector('.viewer-stage img')?.naturalWidth>0")
            check(f'Viewer contained at {width}',page.locator('dialog').evaluate('(d)=>d.scrollWidth<=innerWidth+1'))
            check(f'Viewer close visible at {width}',page.locator('#viewer-close').is_visible())
            page.screenshot(path=str(OUT/f'viewer-{width}.png'))
            page.get_by_role('button',name='Close',exact=True).click();page.wait_for_function("!document.querySelector('dialog').open")
    page.set_viewport_size({'width':390,'height':844})
    requests.clear();page.goto(base+route,wait_until='networkidle')
    check('No film request until opened',not any('.mp4' in x for x in requests))
    page.keyboard.press('Tab');check('Skip link is first focus',page.evaluate("document.activeElement.className==='track-skip'"))
    page.keyboard.press('Enter');check('Skip reaches content',page.evaluate("document.activeElement.id==='main'"))
    page.locator('[data-frame]').first.click();page.wait_for_selector('dialog[open]')
    check('Focus enters dialog',page.evaluate("document.activeElement.id==='viewer-close'"))
    check('Previous disabled on first',page.locator('#viewer-prev').is_disabled())
    for i in range(15):
        page.keyboard.press('Tab')
        check(f'Focus remains within dialog ({i+1})',page.evaluate("document.querySelector('dialog').contains(document.activeElement)"))
    page.locator('#viewer-next').click();check('Next updates frame',page.locator('#viewer-counter').inner_text()=='2 / 5')
    check('Frame gets shareable URL',page.evaluate("location.hash==='#frame-side-by-side'"))
    page.keyboard.press('ArrowRight');check('Right arrow advances',page.locator('#viewer-counter').inner_text()=='3 / 5')
    page.keyboard.press('ArrowLeft');check('Left arrow returns',page.locator('#viewer-counter').inner_text()=='2 / 5')
    stage=page.locator('#viewer-stage')
    stage.dispatch_event('pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True,'clientX':300,'clientY':300})
    stage.dispatch_event('pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True,'clientX':100,'clientY':302})
    check('Touch swipe advances an image',page.locator('#viewer-counter').inner_text()=='3 / 5')
    page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('dialog').open")
    check('Focus returns to initiating image',page.evaluate("document.activeElement.dataset.frame==='beside-the-track'"))
    check('Closing restores body scrolling',page.evaluate("document.body.style.overflow===''"))
    page.goto(base+route+'#frame-on-the-road');page.wait_for_selector('dialog[open]')
    check('Direct shared frame opens',page.locator('#viewer-counter').inner_text()=='4 / 5')
    page.get_by_role('button',name='Close',exact=True).click();check('Direct-entry close stays in album',urlsplit(page.url).path==route)
    page.locator('[data-frame]').first.click();page.go_back();check('Browser Back closes viewer',not page.locator('dialog').is_visible())
    page.go_forward();check('Browser Forward reopens viewer',page.locator('dialog').is_visible())
    page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('dialog').open")
    video_id=next(x['id'] for x in album['media'] if x['type']=='video')
    page.locator('[data-frame="'+video_id+'"]').click();page.wait_for_selector('video')
    check('Film has controls and does not autoplay',page.locator('video').evaluate('(v)=>v.controls&&!v.autoplay&&v.paused'))
    check('No next after last item',page.locator('#viewer-next').is_disabled())
    page.locator('video').evaluate('(v)=>v.play()');page.wait_for_function("document.querySelector('video').currentTime>0")
    check('Actual film decodes and plays',page.locator('video').evaluate('(v)=>v.videoWidth>0&&!v.paused'))
    page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('dialog').open")
    check('Close removes and stops film',page.locator('video').count()==0)
    with page.expect_download() as dl:page.get_by_role('link',name='Download photos').click()
    download=dl.value;dest=OUT/'photos.zip';download.save_as(dest)
    check('ZIP download contains exact approved bytes',sha(dest)==album['photoArchive']['sha256'])
    with page.expect_download() as dl:page.locator('.track-frame figcaption a').first.click()
    dest=OUT/'photo.jpg';dl.value.save_as(dest)
    check('Photograph downloads real JPEG bytes',sha(dest)==album['media'][0]['download']['sha256'])
    with page.expect_download() as dl:page.get_by_role('link',name='Save film').click()
    dest=OUT/'film.mp4';dl.value.save_as(dest)
    check('Film downloads exact MP4',sha(dest)==album['media'][-1]['download']['sha256']);dest.unlink()
    # Test denied and available share APIs without sending any message or opening external apps.
    page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(t)=>{window.copied=t}}})")
    page.locator('#share-album').click();check('Copy success reflects actual resolved operation',page.locator('#track-status').inner_text()=='Link copied.')
    check('Copied URL is canonical and excludes tracking',page.evaluate('window.copied')=='https://speedandform.com'+route)
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}})")
    page.locator('#share-album').click();check('Denied clipboard shows manual copy',page.locator('#track-share-fallback').is_visible())
    page.locator('[data-frame]').first.click();page.locator('#viewer-share').click();check('Frame fallback retains frame URL',page.locator('#viewer-share-fallback-url').input_value().endswith('#frame-beside-the-track'))
    page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('dialog').open")
    full=base+album['media'][0]['full']['url'];page.route(full,lambda r:r.abort())
    page.locator('[data-frame]').first.click();page.wait_for_selector('#viewer-failure:not([hidden])')
    check('Failed image has retry and save path',page.locator('#viewer-retry').is_visible() and page.locator('#viewer-download').is_visible())
    page.unroute(full);page.locator('#viewer-retry').click();page.wait_for_function("document.querySelector('.viewer-stage img')?.naturalWidth>0")
    check('Image retry recovers in same place',page.locator('#viewer-failure').is_hidden() and page.locator('#viewer-counter').inner_text()=='1 / 5')
    page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('dialog').open")
    for width in [390,1440]:
        page.set_viewport_size({'width':width,'height':960});page.goto(base+route);page.evaluate("document.body.style.zoom='2'")
        check(f'Album 200 percent at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    nojs=browser.new_context(java_script_enabled=False);np=nojs.new_page();np.goto(base+route)
    check('No-JavaScript gallery retains all files',np.locator('[data-frame]').count()==5 and np.locator('main a[download]').count()==6)
    with np.expect_download() as dl:np.get_by_role('link',name='Download photos').click()
    check('No-JavaScript download is functional',dl.value.failure() is None)
    check('No runtime script errors',len(report['errors'])==0)
    nojs.close();ctx.close();browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['failure']=str(e);raise
finally:
 (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n');server.shutdown()
 print(f'{report["result"]}: {len(report["checks"])} gallery browser checks.')
