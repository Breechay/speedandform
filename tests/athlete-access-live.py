"""Actual anonymous production pages and API. No account or API mocks."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
ORIGIN='https://speedandform.com'
OUT=Path(os.environ.get('ACCESS_ARTIFACTS','/tmp/athlete-access-live'));OUT.mkdir(parents=True,exist_ok=True)
engine=os.environ.get('BROWSER','chromium');report={'engine':engine,'checks':[],'errors':[],'mode':'actual anonymous production, no mocked API'}
def check(name,value):
 assert value,name
 report['checks'].append(name)
try:
 with sync_playwright() as p:
  browser=getattr(p,engine).launch()
  for width in [390,768,1440]:
   context=browser.new_context(viewport={'width':width,'height':960},reduced_motion='reduce')
   def guard(route):
    req=route.request;url=req.url
    if req.method=='GET' and url.startswith(ORIGIN+'/') and '/cdn-cgi/' not in url:return route.continue_()
    if req.method in ['POST','OPTIONS'] and url=='https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/public_plan_preview':return route.continue_()
    return route.abort()
   context.route('**/*',guard)
   page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   page.goto(ORIGIN+'/plans/race-pace-durability/');page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false'");page.evaluate('document.fonts.ready')
   check(f'{width}: actual public preview renders',page.locator('#curSheet').inner_text().strip()!='')
   check(f'{width}: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   check(f'{width}: public access remains restricted',page.get_attribute('html','data-rpd-entitled')=='false')
   page.screenshot(path=str(OUT/f'actual-preview-{width}.png'))
   if width==390:
    page.locator('#next').click();page.wait_for_url('**/support/');check('Actual next-week action respects public offer boundary','/support/' in page.url)
   page.goto(ORIGIN+'/');page.wait_for_function("document.documentElement.dataset.formAccount==='signed-out'")
   check(f'{width}: anonymous home retains Sign in',page.locator('a[data-form-account]').first.inner_text()=='Sign in →');context.close()
  check('No unexpected page errors',not report['errors']);browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['error']=str(e);raise
finally:
 (OUT/'live.json').write_text(json.dumps(report,indent=2)+'\n');print(report.get('result'),len(report['checks']),engine)
