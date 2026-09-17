"""Published guide smoke tests: public GETs and local controls only."""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('GUIDE_LIVE_ARTIFACTS','/tmp/guides-live'));OUT.mkdir(parents=True,exist_ok=True)
BASE='https://speedandform.com'
report={'sourceCommit':os.environ.get('GITHUB_SHA'),'checks':[],'errors':[],'physicalDevice':False}
def check(name,ok):
 assert ok,name
 report['checks'].append(name)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch();ctx=browser.new_context(reduced_motion='reduce');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') and r.request.method=='GET' else r.abort());page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  for width in [390,1440]:
   page.set_viewport_size({'width':width,'height':960})
   for route in ['easy-run','threshold-training','long-run-pace','running-form-errors']:
    response=page.goto(BASE+'/'+route,wait_until='networkidle');check(f'{route}: live response at {width}',response.status==200)
    check(f'{route}: no horizontal overflow at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    check(f'{route}: readable live body at {width}',page.locator('.guide-body p').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=17'))
    page.screenshot(path=str(OUT/f'{route}-{width}.png'),full_page=True)
    page.locator('.guide-ref:visible').first.click();page.wait_for_function("document.querySelector('#sources details').open");check(f'{route}: citation reveals sources at {width}',page.locator('#sources details').evaluate('(d)=>d.open'))
  page.goto(BASE+'/running-form-errors#hip-collapse');page.wait_for_function("document.querySelector('#hip-collapse').open");check('Published old fragment reaches open disclosure',page.locator('#hip-collapse').evaluate('(d)=>d.open'))
  page.locator('#cadence-practice summary').click();page.locator('#metro-start').click();check('Published metronome has no prescribed default',page.locator('#metro-bpm').get_attribute('aria-invalid')=='true')
  page.locator('#metro-bpm').fill('164');page.locator('#metro-start').click();page.wait_for_function("document.querySelector('#metro-status').textContent==='Playing at 164 steps per minute.'");check('Published audio starts on action',page.locator('#metro-stop').is_enabled())
  page.locator('#metro-stop').click();check('Published audio stops on action',page.locator('#metro-stop').is_disabled())
  check('No live JavaScript errors',not report['errors']);ctx.close();browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['failure']=str(e);raise
finally:
 (OUT/'live-browser.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['checks']),'actual live guide browser checks.')
