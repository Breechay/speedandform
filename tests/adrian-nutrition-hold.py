"""Acceptance for a withdrawn page: no food instructions, no new calendar events."""
import functools
import http.server
import json
import threading
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
R = Path(__file__).resolve().parents[1]
D = R/'plans/adrian-nutrition-phase-01'
s = BeautifulSoup((D/'index.html').read_text(), 'html.parser')
c = json.loads((D/'review-context.json').read_text())
assert c['release_status'] == 'paused_pending_clinician_review'
assert c['active_prescription'] is None
assert c['nutrition_delivery']['instructions'] == []
assert c['training_app_updated'] is False
assert c['calendar']['existing_imports_revoked'] is False
assert not (D/'adrian-prep-reminders.ics').exists()
assert not s.select('a[href$=".ics"], .recipe-card, .rail-day, .shop, script')
assert s.select_one('#plan-hold')
assert s.find('meta',attrs={'name':'robots'})['content'].startswith('noindex')
assert 'not an instruction to stop eating' in s.get_text()
assert 'this website update does not change the app' in s.get_text()
assert '\u2014' not in s.get_text()
ids = [x['id'] for x in s.select('[id]')]
assert len(ids) == len(set(ids))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1',0), functools.partial(Quiet,directory=str(R)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/plans/adrian-nutrition-phase-01/'
report={'status':'passed','widths':[],'active_food_instructions':0,'new_calendar_download':False,'private_medical_history_added':False}
try:
    with sync_playwright() as p:
        b=p.chromium.launch()
        for w in [375,390,430,768,1024,1440]:
            page=b.new_page(viewport={'width':w,'height':900},java_script_enabled=False)
            page.goto(url,wait_until='domcontentloaded')
            assert page.locator('h1').inner_text() == 'Fuel Your Work'
            assert page.locator('#plan-hold').is_visible()
            # JS-disabled state is the safety baseline; read geometry through Playwright.
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),w
            for fragment in ['your-day','recipes','powder','shopping','prep-cycle']:
                page.goto(url+'#'+fragment,wait_until='domcontentloaded')
                assert page.locator('#plan-hold').is_visible()
            report['widths'].append(w)
            page.close()
        b.close()
finally:
    server.shutdown()
print(json.dumps(report,indent=2))
