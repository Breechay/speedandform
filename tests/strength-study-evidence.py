"""Public study states use synthetic browser fixtures; no athlete receipts are inserted."""
import http.server,threading,json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(root),**k)
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/labs/adrian-runner-mass/'
base={'schema_version':1,'status':'published','study':'adrian-runner-mass','athlete':'Adrian','source':'strength_app','checked_at':'2026-10-13T10:30:00Z','total_sessions':0,'sessions':[],'offset':0,'page_size':50}
session={'id':'synthetic-only','source':'strength_app','session_name':'Upper A <img src=x onerror=alert(1)>','week':6,'prescription_version':3,'completed_at':'2026-10-19T14:00:00Z','received_at':'2026-10-19T14:01:00Z','sets':[{'movement_id':'incline','movement_name':'Incline Dumbbell Bench Press','set_index':0,'weight':50,'weight_unit':None,'reps':8,'seconds':None},{'movement_id':'chin','movement_name':'Chin-Up','set_index':0,'weight':None,'weight_unit':None,'reps':4,'seconds':None}]}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for width in [375,390,430,768,1024,1440]:
  page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
  state={'body':base,'status':200};errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/functions/v1/public-strength-study?*',lambda route:route.fulfill(status=state['status'],content_type='application/json',body=json.dumps(state['body'])))
  page.goto(url,wait_until='domcontentloaded')
  page.get_by_role('tab',name='Strength',exact=True).click()
  panel=page.locator('[data-strength-study]')
  panel.get_by_text('No app sessions received yet.',exact=False).wait_for()
  assert page.locator('[data-strength-session-count]').inner_text()=='0'
  assert 'Gandara' not in page.content()
  assert '4 sets @ 50 lb dumbbells; completed reps not reported' in page.locator('#evidence').inner_text()
  state['body']={**base,'total_sessions':1,'sessions':[session]}
  panel.get_by_role('button',name='Refresh',exact=True).click()
  panel.locator('summary').wait_for();panel.locator('summary').click()
  assert panel.locator('img').count()==0
  assert '(unit not recorded)' in panel.inner_text()
  assert 'Load not recorded · 4 reps' in panel.inner_text()
  assert 'Plan version 3' in panel.inner_text()
  assert page.locator('[data-strength-session-count]').inner_text()=='1'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.evaluate("[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,90),width:e.getBoundingClientRect().width})).slice(-20)")
  if width in (390,1440):panel.screenshot(path=f'/tmp/strength-evidence-{width}.png')
  with page.expect_download() as d:panel.get_by_role('button',name='Download JSON').click()
  assert json.loads(Path(d.value.path()).read_text())['sessions'][0]['id']=='synthetic-only'
  state['status']=503
  panel.get_by_role('button',name='Refresh',exact=True).click()
  panel.get_by_text('App records could not be checked. Try Refresh.').wait_for()
  assert page.locator('[data-strength-session-count]').inner_text()=='Unavailable'
  assert panel.locator('details').count()==0
  state['status']=404;state['body']={'status':'not_published'}
  panel.get_by_role('button',name='Refresh',exact=True).click()
  panel.get_by_text('App records are not published for this study.').wait_for()
  assert panel.get_by_role('button',name='Download JSON').is_hidden()
  assert not errors,errors
  page.close()
 browser.close()
server.shutdown()
print('PASS: 6 widths; empty, populated, error, revoked, escaped text, unknown units, JSON download, live count.')
