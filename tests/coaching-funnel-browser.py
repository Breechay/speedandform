"""Exact repository homepage, intercepted transport. No real mail or analytics.
Run: FORM_QA_BROWSER=chromium python tests/coaching-funnel-browser.py
Playwright/WebKit emulation is not a physical iPhone/Instagram keyboard test.
"""
import json
import mimetypes
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ENGINE = os.environ.get('FORM_QA_BROWSER', 'chromium')
OUT = Path(os.environ.get('FORM_QA_ARTIFACTS', '.coaching-funnel-qa')) / ENGINE
OUT.mkdir(parents=True, exist_ok=True)
REPORT = []
GA = 'G-HKG3MXM668'
PIXEL = '147659485878240'
PRIVATE = ['qa+funnel@example.com', 'QA_PRIVATE_NAME', 'QA_PRIVATE_OBSTACLE']


def passed(name, detail=None):
    REPORT.append({'test': name, 'pass': True, 'detail': detail})
    print('PASS', name, detail or '', flush=True)


def open_page(browser, width=390, height=844, qa=False, privacy=None, broken=False):
    context = browser.new_context(viewport={'width': width, 'height': height},
        is_mobile=width < 600, has_touch=width < 600, reduced_motion='reduce',
        service_workers='block')
    page = context.new_page()
    page.set_default_timeout(8000)
    state = {'relay': [], 'third_party': [], 'errors': [], 'outcome': 'success'}
    page.on('pageerror', lambda error: state['errors'].append(str(error)))
    # Record API calls in memory; replace collectors before any site code executes.
    init = "window.__gaCalls=[];window.__metaCalls=[];"
    if broken:
        init += "window.gtag=function(){throw Error('collector blocked');};window.fbq=function(){throw Error('collector blocked');};"
    else:
        init += "window.gtag=function(){window.__gaCalls.push(Array.from(arguments));};window.fbq=function(){window.__metaCalls.push(Array.from(arguments));};"
    if privacy:
        value = 'true' if privacy == 'globalPrivacyControl' else "'1'"
        init += f"Object.defineProperty(navigator, '{privacy}', {{get:()=>{value}}});"
    context.add_init_script(init)

    def route(request_route):
        request = request_route.request
        url = urlsplit(request.url)
        if url.hostname == 'speedandform.com':
            path = (ROOT / unquote(url.path).lstrip('/')).resolve()
            if path == ROOT or path.is_dir():
                path = path / 'index.html'
            if path.is_relative_to(ROOT) and path.is_file():
                request_route.fulfill(path=str(path), content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream')
            else:
                request_route.fulfill(status=404, body='Not in checkout')
        elif url.hostname == 'formsubmit.co':
            if request.method == 'OPTIONS':
                request_route.fulfill(status=204, headers={'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'*'})
                return
            state['relay'].append({'url': request.url, 'body': request.post_data or ''})
            if state['outcome'] == 'network':
                request_route.abort()
            else:
                success = state['outcome'] in ('success', 'string')
                request_route.fulfill(status=500 if state['outcome'] == 'http' else 200,
                    content_type='application/json', headers={'Access-Control-Allow-Origin':'*'},
                    body=json.dumps({'success': 'true' if state['outcome'] == 'string' else success}))
        else:
            state['third_party'].append(request.url)
            request_route.fulfill(status=200, content_type='application/javascript', body='/* Intercepted. No live collector. */')
    # Every request is fulfilled/aborted. Never use route.continue_ or route.fetch.
    context.route('**/*', route)
    page.goto('https://speedandform.com/?utm_source=qa&utm_medium=internal&utm_campaign=coaching_funnel_qa' + ('&form_qa=1' if qa else ''), wait_until='load')
    page.wait_for_function('!!window.__formCoachingMeasurementLoaded')
    return context, page, state


def events(page, qa=False):
    if qa:
        return page.evaluate('window.formCoachingQA.events')
    return page.evaluate("window.__gaCalls.filter(x=>x[0]==='event').map(x=>({event:x[1],parameters:x[2]}))")


def count(page, name, qa=False):
    return sum(row['event'] == name for row in events(page, qa))


def no_private_data(page, qa=False):
    data = events(page, qa)
    encoded = json.dumps(data)
    assert all(value not in encoded for value in PRIVATE), encoded
    allowed = {'form_id', 'funnel_version', 'step_number', 'cta_location', 'method', 'send_to'}
    for row in data:
        assert set(row['parameters']).issubset(allowed), row
        if not qa:
            assert row['parameters']['send_to'] == GA, row


def next_question(page, number):
    page.locator('.q.on [data-next]').click()
    page.locator(f'.q.on[data-q="{number}"]').wait_for(state='visible')


def to_review(page, exercise_back=False):
    page.locator('.hero-actions a.begin').click()
    page.locator('[data-key="goal"] .opt').nth(1).click()
    page.locator('.q.on[data-q="1"]').wait_for(state='visible')
    assert page.locator('#runningNext').is_disabled()
    for key in ('days', 'vol'):
        page.locator(f'[data-key="{key}"] .opt').nth(2).click()
        assert page.locator('#runningNext').is_disabled()
    page.locator('[data-key="long"] .opt').nth(2).click()
    assert page.locator('#runningNext').is_enabled()
    next_question(page, 2)
    if exercise_back:
        page.locator('#back').click()
        page.locator('.q.on[data-q="1"]').wait_for(state='visible')
        assert page.locator('#runningNext').is_enabled()
        next_question(page, 2)
    next_question(page, 3)
    page.locator('#issue').fill(PRIVATE[2])
    next_question(page, 4)
    page.locator('#em').fill('not-an-email')
    page.locator('.q.on [data-next]').click()
    assert page.locator('#needMail').is_visible()
    assert page.locator('#p-read').is_hidden()
    page.locator('#em').fill(PRIVATE[0])
    page.locator('#nm').fill(PRIVATE[1])
    page.locator('[data-key="city"] .opt').first.click()
    page.locator('.q.on [data-next]').click()
    page.locator('#p-read.on').wait_for(state='visible')
    page.wait_for_timeout(100)  # Flush requestAnimationFrame, not network reporting.


with sync_playwright() as playwright:
    executable = os.environ.get('CHROMIUM_PATH') if ENGINE == 'chromium' else None
    browser = getattr(playwright, ENGINE).launch(**({'executable_path':executable} if executable else {}))
    try:
        for width, height in [(375,667),(390,844),(430,932),(768,1024),(1024,768),(1440,900)]:
            context, page, state = open_page(browser, width, height)
            assert count(page, 'coaching_intake_view') == 0, 'Offscreen intake counted as viewed'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
            to_review(page, exercise_back=True)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
            assert count(page, 'coaching_intake_start') == 1
            assert count(page, 'coaching_step_view') == 5, events(page)
            assert count(page, 'coaching_step_complete') == 5, events(page)
            assert count(page, 'coaching_review_view') == 1
            assert count(page, 'generate_lead') == 0
            assert count(page, 'coaching_submit_attempt') == 0
            no_private_data(page)
            assert not state['errors'], state['errors']
            page.screenshot(path=str(OUT / f'review-{width}.png'))
            passed(f'{width}px full intake, required choices, invalid email, back preservation, unique step funnel, no overflow')
            context.close()

        for outcome in ['success', 'string', 'rejected', 'http', 'network']:
            context, page, state = open_page(browser)
            state['outcome'] = outcome
            to_review(page)
            # Re-execution must not reconfigure GA/Meta or install another wrapper.
            before = page.evaluate('window.__gaCalls.filter(x=>x[0]==="config").length')
            page.add_script_tag(content=(ROOT/'js/coaching-measurement.js').read_text())
            assert page.evaluate('window.__gaCalls.filter(x=>x[0]==="config").length') == before == 1
            page.locator('#sendBtn').evaluate('(b)=>{b.click();b.click();}')
            accepted = outcome in ['success', 'string']
            page.locator('#p-done.on' if accepted else '#sendErr:not([hidden])').wait_for(state='visible')
            page.wait_for_timeout(100)
            assert len(state['relay']) == 1, state['relay']
            assert 'formsubmit.co/ajax/33a5c7969281803124c58268d7ae6188' in state['relay'][0]['url']
            assert '_replyto' in state['relay'][0]['body'] and PRIVATE[0] in state['relay'][0]['body']
            assert count(page, 'coaching_submit_attempt') == 1
            assert count(page, 'generate_lead') == int(accepted)
            assert count(page, 'coaching_submit_error') == int(not accepted)
            if accepted:
                page.evaluate('window.formTrackLead();window.formTrackLead();')
                assert count(page, 'generate_lead') == 1
                assert page.evaluate('window.__metaCalls.filter(x=>x[0]==="trackSingle" && x[1]==="147659485878240" && x[2]==="Lead").length') == 1
            else:
                assert page.locator('#sendBtn').is_enabled()
                assert PRIVATE[2] in unquote(page.locator('#sendErr a').get_attribute('href'))
                state['outcome'] = 'success'
                page.locator('#sendBtn').click()
                page.locator('#p-done.on').wait_for(state='visible')
                assert count(page, 'generate_lead') == 1
                assert count(page, 'coaching_submit_attempt') == 2
            no_private_data(page)
            assert not state['errors'], state['errors']
            passed('Relay ' + outcome + ': acceptance-only lead, retry, duplicate protection, unchanged Reply-To')
            context.close()

        for privacy in ['globalPrivacyControl', 'doNotTrack']:
            context, page, state = open_page(browser, privacy=privacy)
            to_review(page)
            page.locator('#sendBtn').click()
            page.locator('#p-done.on').wait_for(state='visible')
            assert len(state['relay']) == 1
            assert not events(page)
            assert not page.evaluate('window.__metaCalls')
            assert not state['third_party'], state['third_party']
            passed(privacy + ': inquiry delivery works, no analytics initialization or events')
            context.close()

        context, page, state = open_page(browser, qa=True)
        to_review(page)
        page.locator('#sendBtn').click()
        page.locator('#sendErr:not([hidden])').wait_for(state='visible')
        page.wait_for_timeout(100)
        assert not state['relay'] and not state['third_party']
        assert not page.evaluate('window.__gaCalls') and not page.evaluate('window.__metaCalls')
        assert count(page, 'coaching_intake_start', True) == 1
        assert count(page, 'coaching_submit_error', True) == 1
        assert count(page, 'generate_lead', True) == 0
        no_private_data(page, True)
        page.locator('#sendErr a').click()
        assert count(page, 'coaching_email_fallback', True) == 1
        passed('Explicit QA: local diagnostic log only; live relay, collectors and fallback navigation blocked')
        context.close()

        context, page, state = open_page(browser, broken=True)
        to_review(page)
        page.locator('#sendBtn').click()
        page.locator('#p-done.on').wait_for(state='visible')
        assert len(state['relay']) == 1 and not state['errors'], state
        passed('Throwing analytics/Meta cannot interrupt an accepted inquiry')
        context.close()
    finally:
        (OUT/'report.json').write_text(json.dumps(REPORT, indent=2))
        browser.close()
print(f'All {len(REPORT)} {ENGINE} checks passed. Every network request was intercepted.', flush=True)
