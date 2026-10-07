"""Current lesson/routine/search acceptance, run by the PR workflow."""
import contextlib, functools, http.server, json, os, threading
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
artifacts=Path(os.environ.get('RUNNING_LIBRARY_ARTIFACTS','/tmp/running-library'))
artifacts.mkdir(parents=True,exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self,path):
        result=super().translate_path(path)
        if Path(result+'.html').is_file(): return result+'.html'
        return result
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
receipt=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch()
  page=browser.new_page()
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for width in [390,768,1440]:
   page.set_viewport_size({'width':width,'height':950})
   for route in ['/threshold-training','/anti-rotation','/strength-routine','/training-week','/strength','/search','/library']:
    page.goto(base+route);page.evaluate('document.fonts.ready')
    if route=='/search': page.wait_for_function("document.querySelector('#discovery-status').textContent.startsWith('Search 86')")
    metrics=page.evaluate('''() => ({overflow:document.documentElement.scrollWidth>innerWidth+1,weight:getComputedStyle(document.querySelector('h1')).fontWeight,background:getComputedStyle(document.body).backgroundColor})''')
    assert not metrics['overflow'],(width,route,metrics)
    assert metrics['weight']=='450',(width,route,metrics)
    assert metrics['background']=='rgb(232, 227, 217)',(width,route,metrics)
    page.screenshot(path=str(artifacts/f'{route[1:]}-{width}.png'),full_page=True)
    receipt.append({'width':width,'route':route,**metrics})
  page.set_viewport_size({'width':390,'height':844})
  page.goto(base+'/search?q=tight%20hips')
  page.wait_for_selector('#discovery-output a[href="/mobility"]')
  page.locator('[data-library-kind="Routine"]').click()
  assert 'kind=Routine' in page.url
  assert page.locator('#discovery-output a[href="/mobility"]').count()==1
  page.locator('#discovery-query').fill('what is threshold running')
  page.wait_for_function("document.querySelector('#discovery-status').textContent.includes('threshold running')")
  assert page.locator('#discovery-output a[href="/threshold-training"]').count()==0
  page.locator('[data-library-kind="Lesson"]').click()
  page.wait_for_selector('#discovery-output a[href="/threshold-training"]')
  page.go_back()
  page.wait_for_function("document.querySelector('[data-library-kind=Routine]').getAttribute('aria-current')==='true'")
  page.locator('#discovery-query').fill('<img src=x onerror=alert(1)>')
  page.wait_for_function("document.querySelector('#discovery-status').textContent.includes('<img')")
  assert page.locator('#discovery-output img').count()==0
  page.locator('#discovery-query').press('Escape')
  page.wait_for_function("document.querySelector('#discovery-query').value===''")
  assert 'q=' not in page.url
  page.goto(base+'/anti-rotation#exercise-2')
  page.wait_for_function("Math.abs(document.getElementById('exercise-2').getBoundingClientRect().top)<80")
  assert page.locator('[data-guide-print]').is_visible()
  assert page.locator('.routine-start-link').count()==1
  assert page.locator('.routine-overview .section-link').evaluate('el => getComputedStyle(el).color')=='rgb(22, 25, 22)'
  page.locator('#exercise-2 input').check()
  assert page.locator('#exercise-2 input').is_checked()
  initial=page.locator('details[open]').count()
  page.evaluate("dispatchEvent(new Event('beforeprint'))")
  assert page.locator('details:not([open])').count()==0
  page.emulate_media(media='print')
  assert page.locator('body').evaluate('el => getComputedStyle(el).backgroundColor')=='rgb(255, 255, 255)'
  assert not page.locator('.movement-media').first.is_visible()
  assert not page.locator('.routine-print').is_visible()
  page.screenshot(path=str(artifacts/'anti-rotation-print.png'),full_page=True)
  page.emulate_media(media='screen')
  page.evaluate("dispatchEvent(new Event('afterprint'))")
  assert page.locator('details[open]').count()==initial
  page.goto(base+'/running-form-errors')
  page.locator('#cadence-practice summary').click()
  page.locator('#metro-bpm').fill('99');page.locator('#metro-start').click()
  assert '100 to 220' in page.locator('#metro-status').inner_text()
  page.locator('#metro-bpm').fill('160');page.locator('#metro-start').click()
  page.wait_for_function("document.querySelector('#metro-status').textContent.includes('Playing')")
  page.locator('#metro-stop').click()
  assert page.locator('#metro-start').is_enabled()
  context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
  static=context.new_page();static.goto(base+'/search')
  assert static.locator('#discovery-toc .discovery-toc-link').count()==86
  static.goto(base+'/anti-rotation')
  assert static.locator('.movement-exercise').count()==4
  assert not errors,errors
  browser.close()
finally: server.shutdown()
(artifacts/'receipt.json').write_text(json.dumps(receipt,indent=2))
print('PASS: phone/tablet/desktop reflow and house type, search formats/history/escaping, direct moves, print state, no-JS index and metronome.')
