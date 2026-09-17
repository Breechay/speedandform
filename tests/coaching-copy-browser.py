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
            page.screenshot(path=str(OUT/f'hero-viewport-{w}.png'))
            assert page.locator('body').get_attribute('data-coaching-copy') == '20260917-method-1'
            assert page.locator('.hero-benefit').inner_text() == 'Run better.'
            assert page.locator('.hero-actions .begin').get_attribute('href') == '#begin'
            assert page.locator('.hero-benefit').is_visible()
            assert page.locator('.offer strong').is_visible()
            assert page.locator('.hero-kicker').count() == 0
            assert page.locator('.hero-reassurance').count() == 0
            assert page.locator('.offer small').count() == 0

            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            bounds = page.evaluate('''() => {
              const box = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
              return {hero:box('.hero'),button:box('.hero-actions .begin'),benefit:box('.hero-benefit'),fee:box('.offer strong')};
            }''')
            for key in ('button','benefit','fee'):
                assert bounds[key]['x'] >= 0 and bounds[key]['right'] <= w + 1, bounds
                assert bounds[key]['bottom'] <= bounds['hero']['bottom'], bounds
            assert bounds['button']['height'] >= 44
            page.locator('.hero').screenshot(path=str(OUT/f'hero-full-{w}.png'))
            page.locator('.hero-actions .begin').click()
            page.wait_for_timeout(300)
            assert page.locator('#inquiry-reassurance').count() == 0
            assert page.locator('#p-ask .q.on[data-q="0"]').is_visible()
            page.screenshot(path=str(OUT/f'intake-arrival-{w}.png'))
            assert 'Discuss remote coaching' in page.locator('[data-coaching="remote"]').inner_text()
            page.locator('[data-coaching="remote"]').click()
            assert page.locator('#coachingChoice').input_value() == 'remote'
            assert 'Discuss coaching' in page.locator('#coachingChoiceTrigger').inner_text()
            # html_for_test() inlines classic scripts with document.write. The
            # existing account-navigation ES module is therefore parsed as a
            # classic script in this offline harness only. Chromium and WebKit
            # use different wording for that same known parser mismatch.
            known_offline_module_errors = (
                'Cannot use import statement outside a module',
                "Unexpected token '{'. import call expects one or two arguments.",
            )
            unexpected_errors = [
                e for e in errors
                if not any(known in e for known in known_offline_module_errors)
            ]
            assert not unexpected_errors, unexpected_errors
            report.append({'width':w,'height':h,'pass':True,'bounds':bounds,'cta_in_initial_viewport':bounds['button']['bottom']<=h})
            print('PASS', ENGINE, w, 'sparse copy, CTA, remote selector and no overflow', flush=True)
            page.close()
    finally:
        browser.close()
        (OUT/'report.json').write_text(json.dumps(report,indent=2))
print('All',len(report),ENGINE,'copy-layout checks passed. Screenshots require visual review; no physical device claim.',flush=True)
