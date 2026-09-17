"""Read-only checks on production. Only same-origin GET requests are allowed."""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('TRAINING_GUIDE_LIVE_ARTIFACTS','/tmp/training-guides-live'));OUT.mkdir(parents=True,exist_ok=True)
ORIGIN='https://speedandform.com'
report={'sourceCommit':os.environ.get('GITHUB_SHA'),'checks':[],'errors':[]}
def check(name,value):
 assert value,name
 report['checks'].append(name)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch();ctx=browser.new_context(reduced_motion='reduce')
  ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') and r.request.method=='GET' else r.abort())
  page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  for width in [390,1440]:
   page.set_viewport_size({'width':width,'height':960})
   for route in ['training-week','strength','recovery','fueling']:
    res=page.goto(ORIGIN+'/'+route,wait_until='networkidle')
    check(f'{route}: live 200 at {width}',res.status==200)
    check(f'{route}: exact release marker at {width}',page.locator('html').get_attribute('data-guide')=='20260917-p4b')
    check(f'{route}: no overflow at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    page.screenshot(path=str(OUT/f'{route}-{width}.png'),full_page=True)
    page.locator('.guide-ref:visible').first.click();page.wait_for_function("document.querySelector('#sources details').open")
    check(f'{route}: source opens at {width}',page.locator('#sources details').evaluate('(d)=>d.open'))
  page.set_viewport_size({'width':390,'height':960});page.goto(ORIGIN+'/fueling')
  page.locator('#fuel-form button').click();check('Live fueling arithmetic','75 g total · 50 g per hour'==page.locator('#fuel-result strong').inner_text())
  page.locator('#fuel-calculator').screenshot(path=str(OUT/'fuel-calculator-390.png'))
  page.locator('#fuel-minutes').fill('0');page.locator('#fuel-form button').click();check('Live invalid input rejected',page.locator('#fuel-minutes').get_attribute('aria-invalid')=='true')
  page.locator('#fuel-minutes').fill('120');page.locator('#fuel-form button').click();check('Live recovery from invalid input','75 g total · 37.5 g per hour'==page.locator('#fuel-result strong').inner_text())
  page.goto(ORIGIN+'/library');check('Library routes to the new guides',all(page.locator('.discovery-link[href="/'+r+'"]').count()==1 for r in ['training-week','strength','recovery','fueling']))
  check('No runtime errors',not report['errors']);browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['error']=str(e);raise
finally:
 (OUT/'live-browser.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['checks']),'live training-guide checks.')
