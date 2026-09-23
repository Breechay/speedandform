"""Read-only browser acceptance for Simon's approved study projection."""
import json, os, pathlib, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('SIMON_QA_ORIGIN', 'http://127.0.0.1:8765').rstrip('/')
OUT = pathlib.Path(os.environ.get('SIMON_QA_OUTPUT', '/tmp/simon-study-qa'))
OUT.mkdir(parents=True, exist_ok=True)
report = {'origin': BASE, 'cases': [], 'errors': [], 'scope': 'Browser emulation, not a physical iPhone or native app test'}

def record_page(page, name, width, lang, expected_source='live', screenshot=True):
    page.goto(BASE + '/labs/the-two-curves/?lang=' + lang + '&unit=km', wait_until='domcontentloaded', timeout=45000)
    page.wait_for_function("document.querySelector('#gridPlan .gp-row') !== null")
    if expected_source == 'live':
        page.wait_for_function("document.querySelector('#planSource').dataset.sourceState === 'live'", timeout=20000)
    else:
        page.wait_for_timeout(1200)
    page.wait_for_timeout(400)
    assert page.locator('#gridPlan .gp-row').count() == 5, name + ': all five weeks'
    assert page.locator('#gridPlan .gp-row').nth(4).locator('.gp-d').nth(1).evaluate("e=>e.classList.contains('easy')"), name + ': easy Gate Tuesday'
    assert page.locator('#gridPlan .gp-tot').all_text_contents() == ['63 kmweek', '67 kmweek', '70 kmweek', '62 kmweek', '52 kmweek'] if lang == 'en' else True
    assert page.locator('#history').is_visible(), name + ': historical evidence visible'
    assert page.locator('#gate').is_visible(), name + ': Gate window visible'
    assert page.locator('.fig img').evaluate('e=>e.complete && e.naturalWidth > 0'), name + ': runner decodes'
    assert page.locator('.mast__logo img').evaluate('e=>e.complete && e.naturalWidth > 0'), name + ': logo decodes'
    overflow = page.evaluate('Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth')
    assert overflow <= 2, name + ': horizontal overflow ' + str(overflow)
    if lang == 'fr':
        assert 'trente-deux' in page.locator('#history').inner_text()
        assert 'accord' in page.locator('#gate').inner_text()
    else:
        assert 'thirty-two' in page.locator('#history').inner_text()
        assert 'not an assigned sixth week' in page.locator('#gate').inner_text()
    if screenshot:
        page.screenshot(path=str(OUT / (name + '-full.png')), full_page=True)
        page.locator('#history').screenshot(path=str(OUT / (name + '-history.png')))
    report['cases'].append({'name': name, 'width': width, 'language': lang, 'source': page.locator('#planSource').get_attribute('data-source-state'), 'overflow_px': overflow})

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [375, 390, 430, 768, 1024, 1440]:
        page = browser.new_page(viewport={'width': width, 'height': 1000}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        record_page(page, 'chromium-en-' + str(width), width, 'en', screenshot=width in [390, 1440])
        assert not errors, errors
        page.close()
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    record_page(page, 'chromium-fr-390', 390, 'fr')
    page.locator('[data-unit="mi"]').click()
    page.wait_for_timeout(500)
    assert '6:05–6:13/mi' in page.locator('#gridPlan').inner_text()
    page.locator('[data-lang="en"]').click()
    page.wait_for_timeout(500)
    assert 'very easy jog' in page.locator('#gridPlan').inner_text()
    report['cases'].append({'name':'interactive-language-unit-switch','result':'passed'})
    page.close()
    offline = browser.new_page(viewport={'width':390,'height':844})
    offline.route('**/rest/v1/rpc/study_003_plan', lambda r: r.abort())
    record_page(offline, 'network-failure',390,'en','saved',False)
    assert offline.locator('#planSource').get_attribute('data-source-state') == 'saved'
    assert 'not verified' in offline.locator('#planSource').inner_text()
    offline.close()
    stale = browser.new_page(viewport={'width':390,'height':844})
    stale.route('**/rest/v1/rpc/study_003_plan', lambda r: r.fulfill(status=200,content_type='application/json',body='{"state":"review_required"}'))
    record_page(stale,'publication-drift',390,'en','review_required',False)
    assert stale.locator('#planSource').get_attribute('data-source-state') == 'review_required'
    stale.close()
    nojs = browser.new_page(viewport={'width':390,'height':844},java_script_enabled=False)
    nojs.goto(BASE+'/labs/the-two-curves/',wait_until='domcontentloaded')
    assert nojs.locator('#gridPlan .gp-row').count()==5
    assert nojs.locator('#history').is_visible() and nojs.locator('#gate').is_visible()
    assert 'thirty-two' in nojs.locator('#history').inner_text()
    nojs.screenshot(path=str(OUT/'no-javascript-full.png'),full_page=True)
    report['cases'].append({'name':'no-javascript','result':'full approved block and evidence readable'})
    nojs.close()
    page=browser.new_page(viewport={'width':768,'height':1024})
    page.goto(BASE+'/labs/the-two-curves/?lang=en&unit=km',wait_until='domcontentloaded')
    page.add_style_tag(content='body{zoom:2}')
    page.wait_for_timeout(600)
    # Record enlarged layout separately; it is not a native Dynamic Type claim.
    page.screenshot(path=str(OUT/'text-zoom-200.png'),full_page=True)
    report['cases'].append({'name':'200-percent-css-zoom','result':'screenshot recorded'})
    page.close();browser.close()
    browser=p.webkit.launch()
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,device_scale_factor=2)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    record_page(page,'webkit-phone-fr',390,'fr')
    assert not errors,errors
    browser.close()
report['result']='passed'
(OUT/'browser-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
