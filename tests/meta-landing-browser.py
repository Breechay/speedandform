"""Browser acceptance for the paid-social continuation state.

Serves the real site locally so URLSearchParams, dynamic CSS loading and the
homepage script order behave like production. External collectors are blocked.
"""
import json
import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ENGINE = os.environ.get('FORM_QA_BROWSER', 'chromium')
OUT = Path(os.environ.get('FORM_QA_ARTIFACTS', '.coaching-funnel-qa')) / ENGINE / 'meta-landing'
OUT.mkdir(parents=True, exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

handler = partial(QuietHandler, directory=str(ROOT))
server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f'http://127.0.0.1:{server.server_port}/'
report = []

try:
    with sync_playwright() as p:
        browser = getattr(p, ENGINE).launch()
        try:
            for w, h in [(320, 760), (390, 844), (1440, 1000)]:
                page = browser.new_page(viewport={'width': w, 'height': h}, reduced_motion='reduce', is_mobile=w < 600, has_touch=w < 600)
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))

                def route_request(route):
                    url = route.request.url
                    if url.startswith(base):
                        # Account navigation is outside this public landing test.
                        if '/private/account-navigation.js' in url:
                            route.abort()
                        else:
                            route.continue_()
                    else:
                        route.abort()

                page.route('**/*', route_request)
                paid_url = base + '?utm_source=meta&utm_medium=paid_social&utm_campaign=form_miami_run_test01&utm_content=run_development_video01'
                page.goto(paid_url, wait_until='domcontentloaded')
                page.wait_for_selector('html.meta-paid')
                page.wait_for_function("""() => [...document.styleSheets].some(s => (s.href || '').includes('/css/meta-landing.css'))""")

                assert page.locator('.hero').get_attribute('data-landing-variant') == 'meta-paid-v1'
                # .eyebrow intentionally renders uppercase; textContent verifies the authored copy.
                assert page.locator('.hero-kicker').text_content() == 'Run Development · Brice · Miami'
                assert page.locator('.hero h1').inner_text() == 'Run better.\nGet faster.\nRun farther.'
                assert page.locator('.hero-sub > p').inner_text() == 'Individual running coaching built around how you run now and where you want to go.'
                assert page.locator('.offer strong').inner_text() == '8 weeks · $1,200'
                assert page.locator('.hero-actions .begin').inner_text() == 'Tell me about your running →'
                reassurance = page.locator('.hero-reassurance').inner_text()
                assert 'First Miami track assessment complimentary.' in reassurance
                assert 'An inquiry only. No payment or booking yet.' in reassurance
                assert page.locator('.hero-reassurance').is_visible()

                media = page.evaluate("""() => {
                  const v = document.querySelector('#filmA');
                  const img = document.querySelector('.hero > img');
                  return {
                    film: (v && (v.getAttribute('data-src') || v.getAttribute('src'))) || '',
                    poster: (img && img.getAttribute('src')) || ''
                  };
                }""")
                assert '/media/practice.mp4' in media['film'], media
                assert '/media/practice.jpg' in media['poster'], media

                # The paid treatment must not rewrite evidence below the fold.
                assert page.locator('#simon h2').inner_text() == '1:26.'
                assert page.locator('#simon .result-goal').inner_text() == 'The goal was sub-1:30.'
                assert page.locator('#simon .result-metrics').inner_text().replace('\n', ' ').find('6:35') >= 0

                bounds = page.evaluate("""() => {
                  const box = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
                  return {hero:box('.hero'), button:box('.hero-actions .begin'), note:box('.hero-reassurance')};
                }""")
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                for key in ('button', 'note'):
                    assert bounds[key]['x'] >= 0 and bounds[key]['right'] <= w + 1, bounds
                    assert bounds[key]['bottom'] <= bounds['hero']['bottom'] + 1, bounds
                assert bounds['button']['height'] >= 44
                page.screenshot(path=str(OUT / f'paid-{w}.png'), full_page=False)

                page.locator('.hero-actions .begin').click()
                page.wait_for_timeout(150)
                assert page.locator('#p-ask .q.on[data-q="0"]').is_visible()
                unexpected = [e for e in errors if 'Failed to fetch dynamically imported module' not in e]
                assert not unexpected, unexpected
                report.append({'width': w, 'height': h, 'pass': True, 'bounds': bounds, 'media': media})
                print('PASS', ENGINE, w, 'paid hero, continuation media, vetted proof and inquiry entry', flush=True)
                page.close()

            # Direct/organic traffic must retain the existing homepage state.
            page = browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce', is_mobile=True, has_touch=True)
            page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(base) and '/private/account-navigation.js' not in route.request.url else route.abort())
            page.goto(base, wait_until='domcontentloaded')
            assert not page.locator('html').evaluate("el => el.classList.contains('meta-paid')")
            assert page.locator('.hero h1').inner_text() == 'Run\nDevelopment'
            source = page.locator('#filmA').get_attribute('data-src') or page.locator('#filmA').get_attribute('src') or ''
            assert '/media/run-development.mp4' in source, source
            assert page.locator('.hero-actions .begin').inner_text() == 'Work with Brice →'
            print('PASS', ENGINE, 'direct traffic retains default homepage', flush=True)
            page.close()
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
    (OUT / 'report.json').write_text(json.dumps(report, indent=2))

print('All paid-social landing checks passed in', ENGINE, flush=True)
