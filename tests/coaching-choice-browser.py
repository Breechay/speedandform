"""Offline selector regression. Intercepts every request; never sends email."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
from homepage_render import html_for_test
OUT = Path(__file__).resolve().parents[1] / '.homepage-qa'
OUT.mkdir(exist_ok=True)
checks = []
def passed(name):
    checks.append(name)
    print('PASS', name, flush=True)

def page_for(browser, width=390, height=844, **kwargs):
    page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce', **kwargs)
    page.set_default_timeout(6000)
    page.route('**/*', lambda route: route.abort())
    page.set_content(html_for_test(), wait_until='load')
    return page

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    for width, height in [(320,568),(390,844),(430,932),(768,1024),(1024,768),(1440,1000)]:
        page = page_for(browser, width, height)
        trigger = page.locator('#coachingChoiceTrigger')
        assert page.locator('#coachingChoice').is_hidden()
        page.locator('#begin').scroll_into_view_if_needed()
        trigger.click()
        assert page.locator('#coachingChoiceList').is_visible()
        assert page.get_by_role('option').count() == 3
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        rect = page.locator('#coachingChoiceList').bounding_box()
        assert rect['x'] >= 0 and rect['x'] + rect['width'] <= width + 1
        assert rect['y'] >= -1 and rect['y'] + rect['height'] <= height + 1
        page.screenshot(path=str(OUT / f'coaching-choice-open-{width}.png'))
        page.locator('#coachingChoiceOption-1').click()
        assert page.locator('#coachingChoice').input_value() == 'both'
        assert 'Run + Strength' in trigger.inner_text() and '$1,800' in trigger.inner_text()
        assert trigger.get_attribute('aria-expanded') == 'false'
        assert trigger.evaluate('(e) => e === document.activeElement')
        passed(f'{width}px menu fits viewport and selection synchronizes')
        page.close()
    page = page_for(browser)
    trigger = page.locator('#coachingChoiceTrigger')
    trigger.focus()
    page.keyboard.press('ArrowDown')
    page.keyboard.press('ArrowDown')
    assert trigger.get_attribute('aria-activedescendant') == 'coachingChoiceOption-1'
    assert page.locator('#coachingChoice').input_value() == 'run'
    page.keyboard.press('Escape')
    assert page.locator('#coachingChoice').input_value() == 'run'
    page.keyboard.press('Enter'); page.keyboard.press('End'); page.keyboard.press('Enter')
    assert page.locator('#coachingChoice').input_value() == 'remote'
    page.keyboard.press('Space'); page.keyboard.press('Home'); page.keyboard.press('Tab')
    assert page.locator('#coachingChoice').input_value() == 'run'
    assert page.evaluate('document.activeElement.textContent') == 'Run better'
    trigger.focus(); page.keyboard.press('r'); page.keyboard.press('e'); page.keyboard.press('m')
    assert trigger.get_attribute('aria-activedescendant') == 'coachingChoiceOption-2'
    page.keyboard.press('Enter')
    assert page.locator('#coachingChoice').input_value() == 'remote'
    trigger.click(); page.locator('.intake-copy p').click()
    assert trigger.get_attribute('aria-expanded') == 'false'
    passed('Enter, Space, arrows, Home/End, Escape cancellation, Tab, type-ahead and outside dismissal')
    for value, name in [('remote','Remote running'),('run','Run Development'),('both','Run + Strength')]:
        if value == 'both': page.locator('.strength-option').evaluate('(e) => e.open = true')
        page.locator('[data-coaching="'+value+'"]').click()
        assert page.locator('#coachingChoice').input_value() == value
        assert name in trigger.inner_text()
    passed('All homepage coaching links synchronize the visible selector')
    page.locator('.q.on [data-key="goal"] button').first.click(); page.wait_for_timeout(400)
    for key in ['days','vol','long']: page.locator('[data-key="'+key+'"] button').first.click()
    page.locator('#runningNext').click(); page.wait_for_timeout(100)
    page.locator('.q.on [data-next]').click(); page.wait_for_timeout(100)
    page.locator('#issue').fill('Synthetic selector check')
    page.locator('.q.on [data-next]').click(); page.wait_for_timeout(100)
    page.locator('#em').fill('example+selector@example.com')
    page.locator('.q.on [data-next]').click()
    assert '$1,800' in page.locator('#rMoney').inner_text()
    for index, text in [(2,'fee agreed'),(0,'$1,200'),(1,'$1,800')]:
        trigger.click(); page.locator('#coachingChoiceOption-'+str(index)).click()
        assert text.lower() in page.locator('#rMoney').inner_text().lower()
    page.evaluate("""window.__mail=[]; window.fetch=async(url, init)=>{window.__mail=[...init.body.entries()]; return {ok:true,json:async()=>({success:true})};};void 0;""")
    page.locator('#sendBtn').click();page.wait_for_timeout(150)
    payload = dict(page.evaluate('window.__mail'))
    assert any('Run + Strength' in value for value in payload.values())
    assert any('$1,800' in value for value in payload.values())
    assert page.locator('#p-done').is_visible()
    passed('Review and synthetic submission preserve chosen service and price')
    page.close()
    page = page_for(browser, 390, 844, is_mobile=True, has_touch=True)
    page.locator('#coachingChoiceTrigger').tap()
    page.locator('#coachingChoiceOption-2').tap()
    assert page.locator('#coachingChoice').input_value() == 'remote'
    passed('Emulated touch can open and select remote coaching')
    page.close()
    page = page_for(browser, 720, 600)
    page.evaluate("document.documentElement.style.fontSize = '200%'")
    page.locator('#coachingChoiceTrigger').click()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    passed('720px responsive zoom equivalent has no horizontal overflow')
    page.close()
    # Block the enhancement, not the working inquiry, to prove the native fallback.
    page = browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
    page.route('**/*',lambda r:r.abort())
    html = html_for_test()
    script = (Path(__file__).resolve().parents[1] / 'js/coaching-choice.js').read_text()
    page.set_content(html.replace('<script>'+script+'</script>',''),wait_until='load')
    assert page.locator('#coachingChoice').is_visible()
    page.select_option('#coachingChoice','remote')
    assert page.locator('#coachingChoice').input_value() == 'remote'
    passed('Unavailable enhancement leaves the native select usable')
    page.close();browser.close()
(OUT / 'coaching-choice-qa.json').write_text(json.dumps(checks,indent=2))
print('All', len(checks), 'checks passed. No network calls were sent.')
