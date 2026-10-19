"""Current FORM homepage browser acceptance. Synthetic, no live submissions."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from homepage_render import html_for_test
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.homepage-qa'
OUT.mkdir(exist_ok=True)
checks=[]
def check(label, condition):
    assert condition, label
    checks.append(label)
def visit(browser, width, height=900, js=True):
    page=browser.new_page(viewport={'width':width,'height':height},
                          reduced_motion='reduce', java_script_enabled=js)
    page.route('**/*',lambda route:route.abort())
    page.set_content(html_for_test(include_video=False),wait_until='load')
    return page
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=__import__('os').environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for width in [320,375,390,430,768,1024,1440]:
        pg=visit(browser,width,900)
        errors=[]
        pg.on('pageerror', lambda e:errors.append(str(e)))
        check(f'No horizontal overflow at {width}',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check(f'Photographic entrance at {width}',pg.locator('.home-hero-slide.is-active').count()==1)
        check(f'No repeated navigation cards at {width}',pg.locator('.home-media-card').count()==0)
        check(f'Run Development action at {width}',pg.locator('a[href="/coaching/miami/"]').count()>0)
        check(f'Silent ambient film at {width}',pg.locator('.home-hero-video video[muted][playsinline]').count()==1)
        check(f'No playback sound control at {width}',pg.locator('.film-toggle, .home-hero-sound').count()==0)
        check(f'No page script errors at {width}',not errors)
        if width in (390,1440):
            pg.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
        pg.close()
    pg=visit(browser,390,844)
    check('Keyboard skip link exists',pg.locator('.skip-link[href="#main-content"]').count()==1)
    pg.keyboard.press('Tab')
    check('Skip link receives keyboard focus',pg.locator('.skip-link').evaluate('(el)=>el===document.activeElement'))
    pg.keyboard.press('Enter')
    check('Skip moves focus to main',pg.evaluate('document.activeElement.id')=='main-content')
    check('Accessible contact address in HTML',pg.locator('a[href="mailto:brice@speedandform.com"]').count()>0)
    check('Homepage links to the working inquiry',pg.locator('a[href="/coaching/apply/"]').count()>0)
    pg.close()
    pg=visit(browser,390,844,js=False)
    check('No-JavaScript coaching link visible',pg.locator('a[href="/coaching/apply/"]').is_visible())
    check('No homepage questionnaire',pg.locator('.questionnaire').count()==0)
    pg.close()
    browser.close()
(OUT/'browser-qa.json').write_text(json.dumps({
    'checks':checks,'count':len(checks),'browser':'Chromium',
    'viewports':[320,375,390,430,768,1024,1440],
    'physicalDevice':False,'syntheticSubmission':False
},indent=2))
print(f'PASS: {len(checks)} current homepage browser checks; no live submissions or external requests.')
