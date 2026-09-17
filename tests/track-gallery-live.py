"""Read-only live browser smoke checks. No forms, marketing, or external messages."""
from pathlib import Path
import os,json,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('GALLERY_LIVE_ARTIFACTS','/tmp/gallery-live'));OUT.mkdir(parents=True,exist_ok=True)
ORIGIN='https://speedandform.com'
a=json.loads((ROOT/'track/media-manifest.json').read_text())['albums'][0]
url=ORIGIN+'/track/'+a['slug']+'/'
report={'checks':[],'errors':[],'sourceCommit':os.environ.get('GITHUB_SHA')}
def check(name,ok):
    assert ok,name
    report['checks'].append(name)
try:
 with sync_playwright() as p:
    browser=p.chromium.launch()
    ctx=browser.new_context(accept_downloads=True,reduced_motion='reduce')
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') and r.request.method=='GET' else r.abort())
    page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
    for width in [390,1440]:
        page.set_viewport_size({'width':width,'height':960})
        page.goto(url,wait_until='networkidle')
        check(f'Live album contained at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check(f'Clean public copy at {width}',not any(t in page.locator('body').inner_text() for t in ['No signup needed','Downloads are web editions','Silent film. Play to watch']))
        page.screenshot(path=str(OUT/f'album-{width}.png'),full_page=True)
        film=page.locator('[data-media=video]');film.scroll_into_view_if_needed();film.locator('img').evaluate('(i)=>i.decode()')
        check(f'Complete live thumbnail at {width}',film.locator('img').evaluate('(i)=>Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)<.01'))
        film.screenshot(path=str(OUT/f'film-{width}.png'))
        page.locator('[data-frame]').first.click();page.locator('.viewer-stage img').evaluate('(i)=>i.decode()')
        check(f'Live viewer opens at {width}',page.locator('dialog').is_visible())
        page.screenshot(path=str(OUT/f'viewer-{width}.png'))
        page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('dialog').open")
    v=next(m for m in a['media'] if m['type']=='video')
    page.locator('[data-frame="'+v['id']+'"]').click();page.wait_for_selector('video')
    check('Live player uses chosen poster',page.locator('video').get_attribute('poster')==v['preview']['url'])
    check('Live film waits for play',page.locator('video').evaluate('(v)=>v.paused&&!v.autoplay'))
    page.locator('video').evaluate('(v)=>v.play()');page.wait_for_function('document.querySelector("video").currentTime>0')
    check('Live film decodes and plays',page.locator('video').evaluate('(v)=>v.videoWidth>0&&!v.paused'))
    page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('dialog').open")
    with page.expect_download() as d:page.get_by_role('link',name='Download photos').click()
    dest=OUT/'photos.zip';d.value.save_as(dest)
    check('Live photo ZIP downloads exact bytes',hashlib.sha256(dest.read_bytes()).hexdigest()==a['photoArchive']['sha256']);dest.unlink()
    check('No live runtime errors',not report['errors'])
    browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['error']=str(e);raise
finally:
 (OUT/'live-browser.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['checks']),'live gallery browser checks.')
