"""Non-destructive browser acceptance; no messages, calendars or athlete writes."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from PIL import Image
from icalendar import Calendar
import json
R=Path(__file__).resolve().parents[1];D=R/'plans/adrian-nutrition-phase-01';O=Path('/tmp/adrian-v15');O.mkdir(exist_ok=True)
s=BeautifulSoup((D/'index.html').read_text(),'html.parser');ids=[t['id'] for t in s.select('[id]')]
assert len(ids)==len(set(ids))
for a in s.select('a[href^="#"]'):assert a['href'][1:] in ids,a['href']
assert s.html['data-nutrition-version']=='1.5'
assert len(s.select('.shop input[data-shop-key]'))==20 and len(s.select('.recipe-card'))==3
assert '\u2014' not in s.get_text()
for phrase in ['160°F','165°F','2 hours','1–2 days','dark urine','marked weakness','label and lot']:assert phrase in s.get_text(),phrase
for a in s.select('.shop-kit-grid>a'):assert a.get('target')=='_blank' and 'noopener' in a.get('rel',[])
assert 'A-52119450' in s.select('.shop-kit-grid>a')[0]['href']
assert json.loads((D/'manifest.webmanifest').read_text())['display']=='standalone'
for size in [180,192,512]:assert Image.open(D/f'fuel-{size}.png').size==(size,size)
ctx=json.loads((D/'review-context.json').read_text());assert ctx['intervention_started_at'] is None
assert not ctx['training_sources']['nutrition_revision_changes_training']
assert not ctx['training_sources']['completed_records_read_in_this_revision']
events=Calendar.from_ical((D/'adrian-prep-reminders.ics').read_bytes()).walk('VEVENT')
assert len(events)==4 and len({str(e['UID']) for e in events})==4
assert sorted((e.decoded('DTSTART').hour,e.decoded('DTSTART').minute) for e in events)==[(5,35),(19,30),(19,30),(20,30)]
assert all(len(e.walk('VALARM'))==1 for e in events)
assert any('Only when Wednesday' in str(e['DESCRIPTION']) for e in events)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(R)));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/plans/adrian-nutrition-phase-01/'
report={'words':len(s.get_text(' ',strip=True).split()),'calendar_events':4,'layouts':[]}
with sync_playwright() as p:
 browser=p.chromium.launch();c=browser.new_context(viewport={'width':390,'height':844},timezone_id='America/New_York');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url,wait_until='domcontentloaded');page.wait_for_timeout(300)
 page.evaluate("localStorage.setItem('form.adrian.nutrition.1.4.shopping',JSON.stringify(['bread','beef']))")
 page.reload(wait_until='domcontentloaded');page.locator('#shopping>summary').click()
 assert page.locator('#shop-check-bread').is_checked() and page.locator('#shop-check-beef').is_checked()
 assert page.locator('#shop-progress').evaluate('(e)=>e.value')==2
 page.locator('#shop-check-jam').check();page.reload(wait_until='domcontentloaded');page.locator('#shopping>summary').click();assert page.locator('#shop-progress').evaluate('(e)=>e.value')==3
 page.locator('#shop-clear').click();page.reload(wait_until='domcontentloaded');page.locator('#shopping>summary').click();assert page.locator('.shop input:checked').count()==0 and page.locator('#shop-progress').evaluate('(e)=>e.value')==0
 # Tab into the first checkbox: focus-visible depends on genuine keyboard modality.
 page.locator('#shop-clear').focus();page.keyboard.press('Tab')
 assert page.locator('#shop-check-bread').evaluate("e=>e===document.activeElement && e.matches(':focus-visible')")
 assert page.locator('#shop-check-bread').evaluate("e=>getComputedStyle(e).outlineStyle!=='none' && parseFloat(getComputedStyle(e).outlineWidth)>=2")
 tile=page.locator('.shop-day').evaluate_all('(es)=>es.map(e=>({top:e.getBoundingClientRect().top,icon:e.querySelector("svg").getBoundingClientRect().top,name:e.querySelector("b").getBoundingClientRect().top}))')
 for key in ['top','icon','name']:assert max(t[key] for t in tile)-min(t[key] for t in tile)<2
 report['shopping_persistence_reset_focus_alignment']='passed'
 page.locator('#tab-work').click();page.locator('#tab-work').focus();page.keyboard.press('ArrowRight');assert page.locator('#tab-sat').get_attribute('aria-selected')=='true'
 page.keyboard.press('End');assert page.locator('#tab-sun').get_attribute('aria-selected')=='true'
 page.keyboard.press('Home');assert page.locator('#tab-work').get_attribute('aria-selected')=='true'
 page.evaluate("location.hash='long-run'");page.wait_for_timeout(150);assert page.locator('#day-sat').is_visible()
 page.evaluate("location.hash='carryover'");page.wait_for_timeout(150);assert page.locator('#prep-cycle').evaluate('(e)=>e.open')
 assert page.locator('.rail input[type=checkbox]').count()==0;report['tabs_and_anchors']='passed'
 page.locator('[data-note=start]').click();assert 'Started today' in page.locator('#note-copy').input_value();assert page.locator('#note-sms').get_attribute('href').startswith('sms:')
 page.locator('[data-note=day7]').click();assert 'Digestion:' in page.locator('#note-copy').input_value() and 'Runs felt:' in page.locator('#note-copy').input_value();page.evaluate("document.getElementById('text-draft').hidden=true")
 page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
 timer=page.locator('.cook-timer').first;timer.evaluate("e=>e.dataset.seconds='1'");timer.click();page.wait_for_timeout(2200);assert 'Done' in timer.inner_text();assert page.locator('.cook-timer.hot').count()==0
 report['message_drafts_and_timers']='passed'
 for img in page.locator('.recipe-card img').all():img.scroll_into_view_if_needed();page.wait_for_function('(e)=>e.complete&&e.naturalWidth>0',arg=img.element_handle(),timeout=30000)
 report['recipe_photos']='all three loaded'
 for day in ['work','sat','sun']:
  page.locator('#tab-'+day).click();page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=false)")
  closed=page.evaluate('document.documentElement.scrollHeight');assert closed<5000,(day,closed)
  page.screenshot(path=str(O/f'phone-{day}-closed.png'),full_page=True)
  page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
  opened=page.evaluate('document.documentElement.scrollHeight');assert opened<16000,(day,opened)
  report['layouts'].append({'width':390,'day':day,'closed_px':closed,'expanded_px':opened})
 page.locator('.shop').screenshot(path=str(O/'shopping-390.png'));page.locator('.cook').screenshot(path=str(O/'cooking-390.png'))
 for w in [320,390,768,1440]:page.set_viewport_size({'width':w,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),w
 page.screenshot(path=str(O/'desktop-expanded.png'),full_page=True)
 for date,tab in [('2026-09-26T12:00:00-04:00','sat'),('2026-09-27T12:00:00-04:00','sun')]:
  q=c.new_page();q.add_init_script("{const Original=Date;const now=new Original('"+date+"').valueOf();window.Date=class extends Original{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};}");q.goto(url,wait_until='domcontentloaded');assert q.locator('#tab-'+tab).get_attribute('aria-selected')=='true';q.close()
 report['weekend_auto_selection']='passed';report['js_errors']=errors;assert not errors,errors
 (O/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));browser.close()
server.shutdown()
