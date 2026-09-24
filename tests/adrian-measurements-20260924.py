"""Browser acceptance for the owner-approved September 24 evidence update."""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/tmp/adrian-measurements-20260924')
OUT.mkdir(parents=True, exist_ok=True)
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_address[1]}/labs/adrian-runner-mass/'
source = json.loads((ROOT / 'docs/studies/ADRIAN-MEASUREMENTS-20260924.json').read_text())
(OUT / 'study.html').write_bytes((ROOT / 'labs/adrian-runner-mass/index.html').read_bytes())
report = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width in [375, 390, 430, 768, 1024, 1440]:
            page = browser.new_page(viewport={'width': width, 'height': 960}, reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(url, wait_until='networkidle')
            page.wait_for_selector('#measurements-20260924 .measure-values')
            record = page.evaluate('STUDY.measurements[0]')
            assert record['date'] == '2026-09-24'
            assert record['unit'] == 'in'
            assert record['preInterventionBaseline'] is False
            assert record['standardized'] is False
            assert record['change'] is None
            assert record['mass'] is None
            panel = page.locator('#measurements-20260924')
            text = panel.inner_text()
            panel.screenshot(path=str(OUT / f'measurements-{width}.png'))
            for m in source['measurements']:
                assert record[m['key']] == m['value'], m
                assert m['label'] in text, m
                assert f"{m['value']} in" in text, (m, text)
            assert 'Sep 24, 2026' in text
            assert 'Athlete self-measurement' in text
            assert 'not a pre-intervention baseline' in text.lower()
            assert panel.locator('.measure-values > div').count() == 5
            assert 'First circumference checkpoint filed' in page.locator('.readbox').inner_text()
            assert 'Five are empty' not in page.locator('#athlete').inner_text()
            assert 'No body evidence filed' not in page.locator('#evidence').inner_text()
            assert 'mid-thigh' not in panel.locator('.measure-values').inner_text().lower()
            assert 'body mass' in page.locator('#athlete').inner_text().lower()
            assert page.evaluate('STUDY.baseline.find(x=>x.k==="Body mass").v') is None
            assert page.evaluate('STUDY.baseline.find(x=>x.k==="Reported body mass").v') == '156 lb'
            assert page.evaluate('STUDY.currentRead.date') == '2026-09-24'
            assert 'sep 24' in page.locator('#circumferences-20260924').inner_text().lower()
            assert 'No body mass, no circumferences' in page.locator('#baseline-missing').inner_text()
            page.locator('#read details.archive').evaluate('(e)=>e.open=true')
            archive_text = page.locator('#read details.archive').inner_text()
            assert 'undefined' not in archive_text
            assert 'A 156 lb working value' in archive_text
            assert panel.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'), 'Checkpoint overflow'
            assert panel.locator('.measure-values').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'), 'Table overflow'
            for item in panel.locator('.measure-values > div').all():
                assert item.locator('dt').bounding_box()['x'] + item.locator('dt').bounding_box()['width'] <= item.locator('dd').bounding_box()['x'] + 1
            if width in [390, 1440]:
                page.locator('#athlete').screenshot(path=str(OUT / f'athlete-{width}.png'))
                page.locator('#read').screenshot(path=str(OUT / f'read-{width}.png'))
            assert not errors, errors
            report.append({'width':width,'status':'pass','javascript_errors':errors})
            page.close()
        page = browser.new_page(viewport={'width':390,'height':960}, reduced_motion='reduce')
        page.goto(url, wait_until='networkidle')
        page.wait_for_selector('#measurements-20260924')
        page.add_style_tag(content='.measure-checkpoint p{font-size:32px!important}.measure-values dt{font-size:34px!important}.measure-values dd{font-size:40px!important}')
        panel = page.locator('#measurements-20260924')
        assert panel.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
        panel.screenshot(path=str(OUT / 'measurements-390-enlarged.png'))
        report.append({'width':390,'mode':'enlarged text','status':'pass'})
        browser.close()
finally:
    server.shutdown()
(OUT / 'acceptance.json').write_text(json.dumps({'record':source['record_id'],'tested_source':os.environ.get('GITHUB_SHA'),'checks':report,'physical_device':'not tested'}, indent=2)+'\n')
print(json.dumps(report, indent=2))
