"""Pass 2 acceptance: real page code with synthetic plan/account data. No writes."""
from pathlib import Path
from urllib.parse import urlsplit,unquote,parse_qs
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[1];BASE='https://rpd-pass2.test';ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('RPD_PASS2_ARTIFACTS','/tmp/rpd-pass2'));OUT.mkdir(parents=True,exist_ok=True)
report={'engine':ENGINE,'auth':'synthetic fixtures; no real account','checks':[],'errors':[]}
def check(name,value):
 assert value,name
 report['checks'].append(name)
def session(user):return {'user':{'id':user},'access_token':'synthetic-'+user}
def fixture(full):
 return {'plan':{'slug':'race-pace-durability','name':'Race Pace Durability','discipline':'half_marathon','race_pace_low_seconds':420,'race_pace_high_seconds':435},
 'running':{'starts_on':'2026-08-24','race_on':'2026-12-05'},'version':{'number':5,'cut_at':'2026-09-15'},
 'weeks':[{'week_number':w,'total_distance':(45+w if full or w<=4 else None),'sessions':([
 {'day':d,'label':f'SYNTHETIC W{w} {d}','title':'Synthetic test only','distance':3,'components':[]}
 for d in ['MON','TUE','WED','THU','FRI','SAT']] if full or w<=4 else [])} for w in range(1,16)]}
SDK='''export const supabase={auth:{
 getSession:async()=>({data:{session:JSON.parse(localStorage.getItem('form-private-auth')||'null')},error:null}),
 getUser:async()=>({data:{user:JSON.parse(localStorage.getItem('form-private-auth')||'null')?.user},error:null}),
 onAuthStateChange:callback=>({data:{subscription:{unsubscribe(){}}}})
},rpc:async()=>({data:0,error:null})};'''
try:
 with sync_playwright() as pw:
  browser=getattr(pw,ENGINE).launch(headless=True)
  def make(role='guest',width=390):
   ctx=browser.new_context(viewport={'width':width,'height':1100},reduced_motion='reduce')
   ctx.add_init_script("const D=Date;globalThis.Date=class extends D {constructor(...a){super(...(a.length?a:['2026-09-17T12:00:00-04:00']));}};")
   if role!='guest':ctx.add_init_script('localStorage.setItem("form-private-auth",'+json.dumps(json.dumps(session(role)))+');')
   ctx.add_init_script("Object.defineProperty(navigator,'share',{configurable:true,value:async d=>{window.__shared=d}})")
   seen=[]
   def route(r):
    url=r.request.url;path=urlsplit(url).path
    if path=='/private/supabase-client.js':return r.fulfill(status=200,content_type='text/javascript',body=SDK)
    if 'pbgsjjegycacodiltbhn.supabase.co' in url:
     body=r.request.post_data_json or {};seen.append((path,body))
     if path.endswith('rpd_account_access'):
      user=r.request.headers.get('authorization','').removeprefix('Bearer synthetic-')
      mode={'coach':'coach','jose':'assigned','buyer':'purchased'}.get(user,'preview');full=mode!='preview'
      workspace='coach' if user=='coach' else ('athlete' if user=='jose' else 'account')
      return r.fulfill(status=200,content_type='application/json',body=json.dumps({'schema':1,'user_id':user,'mode':mode,'entitled':full,'workspace':workspace,'plan':fixture(full) if full and body.get('p_include_plan') else None}))
     if path.endswith('public_plan_preview'):return r.fulfill(status=200,content_type='application/json',body=json.dumps(fixture(False)))
     raise AssertionError('Unexpected API '+path)
    if url.startswith(BASE+'/') and r.request.method=='GET':
     requested=unquote(path).lstrip('/')
     for name in [requested or 'index.html',requested+'.html',requested.rstrip('/')+'/index.html']:
      file=(ROOT/name).resolve()
      if file.is_relative_to(ROOT) and file.is_file():return r.fulfill(path=str(file))
     return r.fulfill(status=404,body='Not found')
    return r.abort()
   ctx.route('**/*',route);page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   return ctx,page,seen

  # Offer pages: new story, readable layout, no runtime replacement.
  for url,label,phrases in [
   ('/plans/race-pace-durability/support/','English',['Build the ability to carry your race pace for 13.1 miles.','The structure behind the sessions.','12 after 4 easy']),
   ('/es/plans/race-pace-durability/','Spanish',['Desarrolla la capacidad de sostener tu ritmo de carrera durante 13.1 millas.','La estructura detrás de las sesiones.','12 después de 4 fáciles'])]:
   for width in [390,1440]:
    ctx,page,_=make('guest',width);page.goto(BASE+url);page.evaluate('document.fonts.ready')
    body=page.locator('body').inner_text()
    for phrase in phrases:check(f'{label} {width}: {phrase}',phrase in body)
    check(f'{label} {width}: retired theory copy absent','coaching theory' not in body.lower() and 'teoría del entrenamiento' not in body.lower())
    check(f'{label} {width}: no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    check(f'{label} {width}: one purchase price','$79' in body)
    if width==390:page.screenshot(path=str(OUT/f'{label.lower()}-offer-390.png'),full_page=True)
    ctx.close()

  # A guest can receive a Week 5 link, but only sees the locked placeholder.
  ctx,page,seen=make('guest');page.goto(BASE+'/plans/race-pace-durability/?week=5');page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false'");page.wait_for_function("document.getElementById('range').textContent.includes('05')")
  check('Guest shared Week 5 opens Week 5 view','05 / 15' in page.locator('#range').inner_text())
  check('Guest Week 5 remains locked','Full plan · $79' in page.locator('#curSheet').inner_text())
  check('Guest Week 5 contains no authored prescription','SYNTHETIC W5' not in page.locator('#curSheet').inner_text())
  check('Week query did not change entitlement API shape',all(set(body)<={'p_include_plan'} for path,body in seen if path.endswith('rpd_account_access')))
  page.screenshot(path=str(OUT/'guest-week5-390.png'));ctx.close()

  # An entitled coach can deep-link to Week 5 and share that exact week safely.
  ctx,page,seen=make('coach');page.goto(BASE+'/plans/race-pace-durability/?week=5&purchase_session=cs_should_not_share&state=race');page.wait_for_function("document.documentElement.dataset.rpdEntitled==='true'");page.wait_for_function("document.getElementById('range').textContent.includes('05')")
  check('Coach Week 5 authored content visible','SYNTHETIC W5' in page.locator('#curSheet').inner_text())
  check('Coach remains on published product calendar','THIS WEEK' not in page.locator('#folio').inner_text() or 'Week 4' in page.locator('#folio').inner_text())
  page.locator('#shareMobile').click();page.wait_for_function('window.__shared && window.__shared.url')
  shared=page.evaluate('window.__shared')
  query=parse_qs(urlsplit(shared['url']).query)
  check('Shared title names Week 5',shared['title']=='Race Pace Durability · Week 5')
  check('Shared URL names Week 5',query.get('week')==['5'])
  check('Shared URL strips purchase session','purchase_session' not in query)
  check('Shared URL strips review state','state' not in query)
  check('Shared URL carries no user identity',all(k not in query for k in ['user','athlete','token','role','entitled']))
  page.screenshot(path=str(OUT/'coach-week5-share-390.png'));ctx.close()

  # A normal guest still hits the purchase route when paging beyond the free preview.
  ctx,page,_=make('guest');page.goto(BASE+'/plans/race-pace-durability/');page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false'");page.locator('#next').click();page.wait_for_url('**/support/');check('Ordinary preview navigation still routes to offer','/support/' in page.url);ctx.close()

  check('No uncaught JavaScript errors',not report['errors'])
  browser.close();report['result']='PASS'
except Exception as error:
 report['result']='FAIL';report['failure']=str(error);raise
finally:
 (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n');print(report.get('result'),len(report['checks']),ENGINE)
