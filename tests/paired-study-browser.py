"""Browser contract: generated site served through a local route, no private API.
Uses actual Chromium layout; this is not a physical iOS test.
Run with FORM_BROWSER_NETWORK=1 in CI to load the public font stylesheet.
"""
import json, os, pathlib, mimetypes
from urllib.parse import urlsplit,unquote
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(os.environ.get('FORM_SCREENSHOTS','/mnt/data/paired-qa'));OUT.mkdir(parents=True,exist_ok=True)
PLANS=json.loads((ROOT/'labs/same-pace-different-problem/plans.json').read_text())
errors=[];checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
with sync_playwright() as p:
 opts={'headless':True}
 if pathlib.Path('/usr/bin/chromium').exists():opts['executable_path']='/usr/bin/chromium'
 browser=p.chromium.launch(**opts)
 def page_for(target,width=1440,js=True,state='published'):
  page=browser.new_page(viewport={'width':width,'height':1000},java_script_enabled=js,reduced_motion='reduce')
  page.on('pageerror',lambda e:errors.append(str(e)))
  def route(r):
   url=r.request.url
   if 'supabase.co' in url:
    if state=='offline':return r.abort()
    d=json.loads(json.dumps(PLANS))
    if state!='published':d['athletes']['simon']={'state':state}
    return r.fulfill(status=200,content_type='application/json',body=json.dumps(d))
   if not url.startswith('https://speedandform.com'):
    return r.continue_() if os.environ.get('FORM_BROWSER_NETWORK') else r.abort()
   file=ROOT/unquote(urlsplit(url).path).lstrip('/')
   if file.is_dir():file=file/'index.html'
   if file.is_file():return r.fulfill(status=200,content_type=mimetypes.guess_type(str(file))[0] or 'text/plain',body=file.read_bytes())
   return r.fulfill(status=404,body='not found')
  page.route('**/*',route)
  file=ROOT/target.lstrip('/')
  if file.is_dir():file=file/'index.html'
  page.set_content('<base href="https://speedandform.com'+target+'">'+file.read_text(),wait_until='networkidle')
  page.wait_for_timeout(150)
  return page
 target='/labs/same-pace-different-problem/'
 for width in [375,390,430,768,1024,1440]:
  page=page_for(target,width)
  check(f'paired {width} no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  check(f'paired {width} both live plans',page.locator('.cs-plan[data-state="live"]').count()==2)
  if width in [390,1440]:page.screenshot(path=str(OUT/f'paired-{width}.png'),full_page=True)
  page.close()
 page=page_for(target,390)
 page.locator('[data-cs-unit="km"]').click()
 check('unit toggle applies to both plan anatomies','3:49–3:52/km' in page.locator('[data-plan-athlete="simon"]').inner_text())
 page.locator('[data-cs-filter="elijah"]').click()
 check('Elijah filter excludes Simon-only observation',page.locator('[data-cs-journal] [data-entry-id="simon-2026-10-01"]').count()==0)
 page.locator('[data-cs-filter="simon"]').click()
 check('Simon filter includes linked decision',page.locator('[data-cs-journal] [data-entry-id="simon-make-thursday-support"]').count()==1)
 page.locator('[data-cs-kind="decision"]').click()
 check('decision filter excludes observations',page.locator('[data-cs-journal] [data-entry-id="simon-2026-10-01"]').count()==0)
 page.close()
 for target,name in [('/labs/the-two-curves/','simon'),('/plans/elijah-savannah-half/','elijah'),('/labs/same-pace-different-problem/entries/simon-make-thursday-support/','entry')]:
  page=page_for(target,390)
  check(f'{name} no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  check(f'{name} shared record present',page.locator('[data-entry-id]').count()>0)
  if name=='simon':
   page.locator('[data-lang="fr"]').first.click();page.wait_for_timeout(300)
   check('Simon French controls retained',page.locator('.cs-state').inner_text().startswith('Plan publié'))
   page.locator('[data-lang="en"]').first.click();page.wait_for_timeout(300)
  page.screenshot(path=str(OUT/f'{name}-390.png'),full_page=True);page.close()
 for state in ['review_required','unavailable','offline']:
  page=page_for('/labs/same-pace-different-problem/',state=state)
  if state=='review_required':check('drift clearly labels old copy',page.locator('[data-plan-athlete="simon"]').get_attribute('data-state')=='review_required')
  elif state=='unavailable':check('revoked/unavailable plan is not redisplayed',page.locator('[data-plan-athlete="simon"]').count()==0)
  else:check('offline copy never calls itself current',page.locator('.cs-plan[data-state="live"]').count()==0)
  page.close()
 page=page_for('/labs/same-pace-different-problem/',js=False)
 check('no JS preserves full plan text','3 × 2 mi · HM calibration' in page.content())
 check('no JS preserves entry relationships','Based on:' in page.content());page.close()
 page=page_for('/labs/same-pace-different-problem/',768)
 page.add_style_tag(content='body{font-size:200%!important} p{font-size:2em!important}')
 check('enlarged text no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 page.close();check('no runtime script errors',not errors)
 browser.close()
(OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'status':'passed'},indent=2))
print(f'{len(checks)}/{len(checks)} browser checks passed.')
