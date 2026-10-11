"""Browser acceptance; screenshots are evidence, not a physical-device claim."""
from pathlib import Path
import functools
import http.server
import json
import os
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/tmp/rebuilt-observations')
OUT.mkdir(exist_ok=True, parents=True)
server = None
base = os.environ.get('REBUILT_CHECK_URL')
if not base:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/labs/rebuilt-athlete/'
results = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in [(390,844), (375,812), (1440,1000)]:
        page = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        response = page.goto(base, wait_until='networkidle', timeout=60000)
        assert response and response.status == 200
        block = page.locator('#long-run-mechanics-study-20261009')
        assert block.count() == 1
        assert block.get_attribute('data-observations-version') == '20261010-observations-v1'
        block.scroll_into_view_if_needed()
        assert block.is_visible()
        assert block.locator('.rlo-story').count() == 3
        assert block.locator('.rlo-chart').count() == 5
        body = block.inner_text()
        for text in ['first four miles with Natalie','166 spm','159 spm','161 spm','268 ms','298 ms','264 ms','8.2 %','9.5 %','8.0 %']:
            assert text in body, text
        rect = block.bounding_box()
        assert rect and rect['width'] <= width + 2
        overflow = page.evaluate('document.documentElement.scrollWidth - innerWidth')
        assert overflow <= 2, f'Page overflow at {width}: {overflow}'
        # Table scroll stays inside its own keyboard-focusable region.
        for region in block.locator('.rlo-table-wrap').all():
            assert region.get_attribute('tabindex') == '0'
        block.screenshot(path=str(OUT/f'observations-{width}.png'))
        for summary in block.locator('summary').all():
            summary.click()
        assert block.locator('.rlo-laps').count() == 2
        assert all(el.is_visible() for el in block.locator('.rlo-laps').all())
        block.screenshot(path=str(OUT/f'observations-expanded-{width}.png'))
        # No new scripts were introduced; retain inherited runtime errors separately.
        results.append({'width':width,'height':height,'http_status':response.status,'visible':True,'page_horizontal_overflow_px':overflow,'story_count':3,'metric_plot_count':5,'lap_chart_count':2,'inherited_page_errors':errors})
        page.close()
    browser.close()
if server:
    server.shutdown()
(OUT/'browser-check.json').write_text(json.dumps({'url':base,'browser':'Chromium','checks':results},indent=2))
print(json.dumps(results,indent=2))
