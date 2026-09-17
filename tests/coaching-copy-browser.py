"""Copy-only visual acceptance. All requests blocked; no real inquiry or tracking."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from homepage_render import html_for_test

ENGINE = os.environ.get('FORM_QA_BROWSER', 'chromium')
OUT = Path(os.environ.get('FORM_QA_ARTIFACTS', '.coaching-funnel-qa')) / ENGINE / 'copy'
OUT.mkdir(parents=True, exist_ok=True)
report = []
with sync_playwright() as p:
    browser = getattr(p, ENGINE).launch()
    try:
        for w, h in [(320,760),(375,667),(390,844),(430,932),(768,1024),(820,1180),(1024,768),(1440,1000)]:
            page = browser.new_page(viewport={'width':w,'height':h}, reduced_motion='reduce', is_mobile=w<600, has_touch=w<600)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('**/*', lambda route: route.abort())
            page.set_content(html_for_test(), wait_until='load')
            page.evaluate('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))')
            assert page.locator('body').get_attribute('data-coaching-copy') == '20260917-coaching-clarity'
            assert page.locator('.hero-benefit').inner_text() == 'Run better. Get faster. Run farther.'
            assert 'I watch you run, build your plan, and coach you through it.' in page.locator('.hero-sub').inner_text()
            assert 'Weekly track coaching in Miami, with adjustments as you develop.' in page.locator('.hero-sub').inner_text()
            assert page.locator('.hero-reassurance').inner_text() == 'Your first Miami track assessment is complimentary.\nStart with a conversation.'
            assert page.locator('.hero-actions .begin').get_attribute('href') == '#begin'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            bounds = page.evaluate('''() => {
              const box = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
              return {hero:box('.hero'),button:box('.hero-actions .begin'),note:box('.hero-reassurance')};
            }''')
            for key in ('button','note'):
                assert bounds[key]['x'] >= 0 and bounds[key]['right'] <= w + 1, bounds
                assert bounds[key]['bottom'] <= bounds['hero']['bottom'], bounds
            assert bounds['button']['height'] >= 44
            page.screenshot(path=str(OUT/f'hero-viewport-{w}.png'))
            page.locator('.hero').screenshot(path=str(OUT/f'hero-full-{w}.png'))
            page.locator('.hero-actions .begin').click()
            page.wait_for_timeout(300)
            assert page.locator('#inquiry-reassurance').is_visible()
            assert page.locator('#inquiry-reassurance').inner_text() == 'An inquiry only. No payment or booking yet.'
            assert page.locator('#p-ask .q.on[data-q="0"]').is_visible()
            assert page.evaluate('''() => !!(document.querySelector('#inquiry-reassurance').compareDocumentPosition(document.querySelector('.questionnaire')) & Node.DOCUMENT_POSITION_FOLLOWING)''')
            page.screenshot(path=str(OUT/f'intake-arrival-{w}.png'))
            assert 'Discuss remote coaching' in page.locator('[data-coaching="remote"]').inner_text()
            page.locator('[data-coaching="remote"]').click()
            assert page.locator('#coachingChoice').input_value() == 'remote'
            assert 'Discuss coaching' in page.locator('#coachingChoiceTrigger').inner_text()
            assert not errors, errors
            report.append({'width':w,'height':h,'pass':True,'bounds':bounds,'cta_in_initial_viewport':bounds['button']['bottom']<=h})
            print('PASS', ENGINE, w, 'copy, CTA, inquiry reassurance, remote selector and no overflow', flush=True)
            page.close()
    finally:
        browser.close()
        (OUT/'report.json').write_text(json.dumps(report,indent=2))
print('All',len(report),ENGINE,'copy-layout checks passed. Screenshots require visual review; no physical device claim.',flush=True)
