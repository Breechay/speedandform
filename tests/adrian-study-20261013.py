"""FRM-001 Oct 13 update: current plan, fuel by the day, current state. Browser check at six widths."""
from pathlib import Path
import http.server, threading, json
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
out = Path('/tmp/adrian-study-20261013'); out.mkdir(parents=True, exist_ok=True)
plan = json.loads((root / 'docs/studies/ADRIAN-PLAN-W05-16-20261013.json').read_text())
fuel = json.loads((root / 'docs/studies/ADRIAN-NUTRITION-FUEL-BY-DAY-20261013.json').read_text())


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(root), **k)
    def log_message(self, *a): pass


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/labs/adrian-runner-mass/'
report = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for w in [375, 390, 430, 768, 1024, 1440]:
        page = browser.new_page(viewport={'width': w, 'height': 900}, reduced_motion='reduce')
        errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(url, wait_until='networkidle')
        page.wait_for_selector('#evidence', timeout=20000)
        S = page.evaluate('STUDY')
        assert S['version'] == '2026.10.13.1'
        assert S['currentRead']['date'] == '2026-10-13'
        assert S['protocol']['phase'] == 'Week 05 · active'
        # weeks 05-16 mirror the stored plan exactly
        for wk in plan['weeks']:
            sw = next(x for x in S['season'] if x['n'] == wk['week'])
            assert [d['t'] for d in sw['days']] == [x['title'] for x in wk['sessions']], wk['week']
            assert [d['ex'] for d in sw['days']] == [x['exercises'] for x in wk['sessions']], wk['week']
            assert 'Cable' not in json.dumps(sw), wk['week']
        # fuel by the day: three tiers from the record, rendered
        tiers = page.locator('#fuel-by-day .fuel-kcal')
        assert tiers.count() == 3
        for el, t in zip(tiers.all(), fuel['tiers']):
            assert f"{t['kcal']:,}" in el.inner_text()
        assert '150–170 g' in page.locator('#intake-20260922').inner_text()
        assert page.locator('#intake-20260922 tbody tr').count() == 6
        assert page.locator('a[href="/plans/adrian-nutrition-phase-01/"]').count() >= 2
        board = page.locator('.railboard').inner_text().lower()
        assert 'nothing filed' not in board and '2 tape sets' in board
        assert '163.2 lb morning report' not in page.locator('#wall').inner_text().lower()
        assert 'forge' not in page.locator('#protocol').inner_text().lower()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'overflow at {w}'
        if w in (390, 1440):
            page.locator('#intake-20260922').screenshot(path=str(out / f'fuel-{w}.png'))
            page.screenshot(path=str(out / f'top-{w}.png'))
        assert not errors, errors
        report.append({'width': w, 'status': 'pass'})
        page.close()
    page = browser.new_page(viewport={'width': 390, 'height': 900})
    page.goto(url, wait_until='networkidle'); page.wait_for_selector('#evidence')
    page.add_style_tag(content='#intake-20260922 p,#intake-20260922 h3{font-size:34px!important}')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), '200% text overflow'
    report.append({'width': 390, 'mode': 'enlarged text', 'status': 'pass'})
    browser.close()
server.shutdown()
print(json.dumps(report, indent=1))
