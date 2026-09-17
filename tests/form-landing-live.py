"""Public FORM page smoke checks. No POST, tracking, store opening or submissions."""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('FORM_LANDING_LIVE_ARTIFACTS','/tmp/form-landing-live'));OUT.mkdir(parents=True,exist_ok=True)
ORIGIN='https://speedandform.com';report={'checks':[],'errors':[],'sourceCommit':os.environ.get('GITHUB_SHA'),'physicalDevice':False}
def check(name,ok):
    assert ok,name
    report['checks'].append(name)
try:
 with sync_playwright() as p:
    browser=p.chromium.launch();ctx=browser.new_context(reduced_motion='reduce')
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') and r.request.method=='GET' else r.abort())
    page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
    for width in [390,1440]:
        page.set_viewport_size({'width':width,'height':960});r=page.goto(ORIGIN+'/form/',wait_until='networkidle')
        check(f'Live 200 at {width}',r.status==200)
        check(f'Live version at {width}',page.locator('body').get_attribute('data-form-landing')=='20260917-p5a')
        check(f'Live layout contained at {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check(f'Current app destination at {width}',page.locator('.fl-hero .fl-button').get_attribute('href')=='https://apps.apple.com/us/app/form-running-plans/id6761313085')
        check(f'Preview clearly identified at {width}',page.get_by_text('Design preview',exact=True).is_visible())
        for image in page.locator('img').all():image.scroll_into_view_if_needed();image.evaluate('(i)=>i.decode()')
        check(f'Official screenshot loaded at {width}',page.locator('.fl-store-screen img').evaluate('(i)=>i.naturalWidth===600&&i.naturalHeight===1299'))
        for name in ['Threshold','Interval','Speed','Long Run','Easy']:
            page.get_by_role('tab',name=name,exact=True).click();check(f'{name} panel works at {width}',page.get_by_role('tabpanel').count()==1 and page.get_by_role('tabpanel').get_attribute('data-session')==name)
        page.locator('.fl-faq summary').nth(2).click();check(f'Live appearance distinction at {width}','previews the new interface' in page.locator('.fl-faq details').nth(2).inner_text());page.locator('.fl-faq summary').nth(2).click()
        page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/f'form-{width}.png'),full_page=True);page.screenshot(path=str(OUT/f'hero-{width}.png'))
        page.locator('#demo').screenshot(path=str(OUT/f'sessions-{width}.png'))
    page.goto(ORIGIN+'/form/#type-speed');check('Live direct explanation link works',page.locator('#type-speed').is_visible())
    page.get_by_role('tab',name='Speed',exact=True).focus();page.keyboard.press('ArrowRight');check('Live keyboard navigation',page.locator('#type-long').is_visible())
    page.locator('.fl-faq summary').first.click();check('Independent and coached access distinguished','does not start a personal coaching relationship' in page.locator('.fl-faq details').first.inner_text())
    check('Existing support and coaching paths kept',page.locator('a[href="/form/support/"]').count()>0 and page.locator('a[href="/#begin"]').count()>0)
    check('No runtime errors',not report['errors']);browser.close()
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['error']=str(e);raise
finally:
 (OUT/'live-browser.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['checks']),'live FORM page browser checks.')
