"""Browser acceptance for Adrian only. Never accesses athlete accounts or sends messages."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json, hashlib
root=Path(__file__).resolve().parents[1]
out=Path('/tmp/adrian-v14');out.mkdir(exist_ok=True)
html=(root/'plans/adrian-nutrition-phase-01/index.html').read_text()
soup=BeautifulSoup(html,'html.parser')
ids=[tag['id'] for tag in soup.select('[id]')]
assert len(ids)==len(set(ids)), 'Duplicate IDs'
assert len(soup.select('.recipe-card'))==3
assert len(soup.select('.shop input[data-shop-key]'))==20
assert len(soup.select('#base-method ol > li'))==4
for a in soup.select('a[href^="#"]'):
 assert a['href'][1:] in ids, a['href']
assert '30 minutes and 1 at 60' not in soup.get_text()
assert 'Keep your established long-run fuel.' in soup.get_text()
assert 'First Wednesday evening: make 2 portions.' in soup.get_text()
assert '22 slices' in soup.get_text()
manifest=json.loads((root/'plans/adrian-nutrition-phase-01/review-context.json').read_text())
assert manifest['intervention_started_at'] is None
assert manifest['training_sources']['nutrition_revision_changes_training'] is False
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/plans/adrian-nutrition-phase-01/'
report={'source_checks':'passed','layouts':[],'images':[]}
with sync_playwright() as p:
 browser=p.chromium.launch()
 context=browser.new_context(viewport={'width':390,'height':844})
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url,wait_until='domcontentloaded')
 page.locator('#shopping summary').click()
 page.locator('#shop-check-bread').check();page.locator('#shop-check-beef').check()
 page.reload(wait_until='domcontentloaded');page.locator('#shopping summary').click()
 assert page.locator('#shop-check-bread').is_checked()
 assert page.locator('#shop-check-beef').is_checked()
 page.locator('#shop-clear').click();page.reload(wait_until='domcontentloaded');page.locator('#shopping summary').click()
 assert page.locator('.shop input:checked').count()==0
 report['reload_persistence']='passed';report['clear_persistence']='passed'
 for width in (320,390,768,1440):
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),f'overflow at {width}'
  report['layouts'].append(width)
  if width in (390,1440):page.locator('.shop').screenshot(path=str(out/f'shopping-{width}.png'))
 # Visit every initially collapsed section; nested recipe and preparation sections included.
 page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
 assert page.locator('details:not([open])').count()==0
 report['all_details_opened']=page.locator('details').count()
 for image in page.locator('.recipe-card img').all():
  image.scroll_into_view_if_needed()
  try:page.wait_for_function('(img)=>img.complete && img.naturalWidth>0',arg=image.element_handle(),timeout=30000)
  except Exception:pass
  record=image.evaluate('(img)=>({url:img.currentSrc,loaded:img.complete&&img.naturalWidth>0,width:img.naturalWidth})')
  report['images'].append(record)
 page.locator('#recipes').screenshot(path=str(out/'recipes-desktop.png'))
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),'expanded phone overflow'
 page.screenshot(path=str(out/'phone-expanded.png'),full_page=True)
 page.evaluate("document.getElementById('powder').open=false;location.hash='powder'")
 page.wait_for_timeout(200);assert page.locator('#powder').evaluate('(e)=>e.open')
 assert not errors,errors
 report['javascript_errors']=errors
 browser.close()
server.shutdown()
(out/'report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
assert all(i['loaded'] for i in report['images']), 'A recipe image failed to load; do not publish until resolved.'
