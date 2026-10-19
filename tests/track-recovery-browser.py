"""Recovered selection acceptance: full frames, order, viewer, downloads and mute."""
from pathlib import Path
import json, os, threading, functools, http.server, hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('RECOVERY_ARTIFACTS','/tmp/recovery-review'));OUT.mkdir(parents=True,exist_ok=True)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
a=next(a for a in json.loads((ROOT/'track/media-manifest.json').read_text())['albums'] if a['slug']=='track-selection')
assert a['date'] is None
assert [m['id'] for m in a['media']]==['frame-'+n for n in ['5728','8046','8045','8058','8044','5701','8057','8080']]
checks=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 ctx=b.new_context(reduced_motion='reduce',accept_downloads=True)
 ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin) else r.abort())
 page=ctx.new_page()
 for width in [390,768,1440]:
  page.set_viewport_size({'width':width,'height':960})
  for route,label in [('/track/','index'),('/track/track-selection/','album'),('/brand/','brand')]:
   page.goto(origin+route,wait_until='networkidle')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(route,width,'overflow')
   imgs=page.locator('main img') if label!='brand' else page.locator('#theater img')
   for im in imgs.all():
    im.scroll_into_view_if_needed()
    # Chromium may reject an explicit decode() during a lazy-load transition
    # despite nonzero dimensions. Demand real painted pixels, not just metadata.
    state=im.evaluate("""async (i) => {
      let decodeError = null;
      try { await i.decode(); } catch (e) { decodeError = String(e); }
      const c = document.createElement('canvas');
      c.width = 24; c.height = 24;
      const ctx = c.getContext('2d', {willReadFrequently:true});
      let painted = false, drawError = null;
      try {
        ctx.drawImage(i, 0, 0, c.width, c.height);
        const rgba = ctx.getImageData(0, 0, c.width, c.height).data;
        painted = rgba.some((v, n) => n % 4 === 3 && v > 0);
      } catch(e) { drawError = String(e); }
      return {src:i.currentSrc || i.src, complete:i.complete,
        naturalWidth:i.naturalWidth, naturalHeight:i.naturalHeight,
        painted, decodeError, drawError};
    }""")
    assert state['complete'] and state['naturalWidth']>0 and state['naturalHeight']>0 and state['painted'],(route,label,width,state)
   if label=='album':
    assert imgs.count()==8
    assert imgs.evaluate_all('(ims)=>ims.every(i=>i.complete&&i.naturalWidth>0&&Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)<.02)')
    assert 'Undated selection' in page.locator('main').inner_text()
   page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/f'{label}-{width}.png'),full_page=True)
   checks.append(f'{label} {width}: loaded, contained')
  page.goto(origin+'/track/track-selection/',wait_until='networkidle')
  page.locator('[data-frame]').first.click();page.locator('.viewer-stage img').evaluate('(i)=>i.decode()')
  assert page.locator('dialog').is_visible()
  page.get_by_role('button',name='Next photograph or film').click()
  assert page.locator('#viewer-counter').inner_text()=='2 / 8'
  page.keyboard.press('Escape');assert not page.locator('dialog').is_visible()
  checks.append(f'viewer {width}: open, next, close')
 with page.expect_download() as d:page.get_by_role('link',name='Download photos').click()
 path=OUT/'photos.zip';d.value.save_as(path)
 assert hashlib.sha256(path.read_bytes()).hexdigest()==a['photoArchive']['sha256'];path.unlink()
 checks.append('photo ZIP exact hash')
 page.goto(origin+'/track/',wait_until='networkidle')
 video=page.locator('#film-7x800 video')
 assert video.evaluate('(v)=>v.muted&&v.defaultMuted')
 video.evaluate('(v)=>{v.muted=false}')
 page.wait_for_function('document.querySelector("#film-7x800 video").muted')
 checks.append('draft film stays muted after attempted unmute')
 # Same guard handles the dynamic session player.
 page.evaluate('''()=>{const v=document.createElement('video');v.src='https://example.test/adrian-7x800-2026-10-14/film.mp4';document.body.append(v)}''')
 page.wait_for_function('document.querySelector("video:last-of-type").muted')
 checks.append('dynamic session player muted')
 b.close()
server.shutdown()
(OUT/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
print('PASS',len(checks),'recovery browser checks')
