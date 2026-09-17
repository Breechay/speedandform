"""Production page code with synthetic auth/data. No live account or API writes."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[1];BASE='https://form-access.test';ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('ACCESS_ARTIFACTS','/tmp/athlete-access'));OUT.mkdir(parents=True,exist_ok=True)
report={'engine':ENGINE,'auth':'synthetic fixtures; not real sign-in','checks':[],'errors':[]}
def check(name,value):
 assert value,name
 report['checks'].append(name)
def session(user):return {'user':{'id':user},'access_token':'synthetic-'+user}
SDK='''export const supabase={auth:{
 getSession:async()=>({data:{session:JSON.parse(localStorage.getItem('form-private-auth')||'null')},error:null}),
 getUser:async()=>({data:{user:JSON.parse(localStorage.getItem('form-private-auth')||'null')?.user},error:null}),
 onAuthStateChange:callback=>{window.__authEvent=callback;return {data:{subscription:{unsubscribe(){}}}}}
},rpc:async()=>({data:0,error:null})};'''
def fixture(full):
 return {'plan':{'slug':'race-pace-durability','name':'Race Pace Durability','discipline':'half_marathon','race_pace_low_seconds':420,'race_pace_high_seconds':435},
 'running':{'starts_on':'2026-08-24','race_on':'2026-12-05'},'version':{'number':1,'cut_at':'2026-09-01'},
 'weeks':[{'week_number':w,'total_distance':30 if full or w<=4 else None,'sessions':([
 {'day':d,'label':f'SYNTHETIC W{w} {d}','title':'Synthetic test only','distance':3,'components':[]}
 for d in ['MON','TUE','WED','THU','FRI','SAT']] if full or w<=4 else [])} for w in range(1,16)]}
try:
 with sync_playwright() as pw:
  browser=getattr(pw,ENGINE).launch(headless=True)
  def make(role='guest',width=390,failure=None,legacy=False):
   ctx=browser.new_context(viewport={'width':width,'height':960},reduced_motion='reduce')
   ctx.add_init_script("const D=Date;globalThis.Date=class extends D {constructor(...a){super(...(a.length?a:['2026-09-17T12:00:00-04:00']));}};")
   seed="if(!sessionStorage.getItem('seed')){sessionStorage.setItem('seed','1');"
   if role!='guest':seed+='localStorage.setItem("form-private-auth",'+json.dumps(json.dumps(session(role)))+');'
   if legacy:seed+='localStorage.setItem("rpd_purchase_session","cs_syntheticguest");'
   ctx.add_init_script(seed+'}');seen=[]
   def route(r):
    url=r.request.url;path=urlsplit(url).path
    if path=='/private/supabase-client.js':return r.fulfill(status=200,content_type='text/javascript',body=SDK)
    if 'pbgsjjegycacodiltbhn.supabase.co' in url:
     body=r.request.post_data_json or {};seen.append((path,body))
     if failure=='network' and path.endswith('rpd_account_access'):return r.fulfill(status=503,content_type='application/json',body='{}')
     if path.endswith('rpd_account_access'):
      user=r.request.headers.get('authorization','').removeprefix('Bearer synthetic-')
      mode={'coach':'coach','jose':'assigned','hope':'assigned','buyer':'purchased'}.get(user,'preview');full=mode!='preview'
      workspace='coach' if user=='coach' else ('athlete' if user in ['jose','hope','lisa'] else 'account')
      data={'schema':1,'user_id':user,'mode':mode,'entitled':full,'workspace':workspace,'plan':fixture(full) if full and body.get('p_include_plan') else None}
      if failure=='partial' and data['plan']:data['plan']['weeks'][4]['sessions']=[]
      if failure=='contradictory':data['entitled']=not full
      return r.fulfill(status=200,content_type='application/json',body=json.dumps(data))
     if path.endswith('public_plan_preview'):return r.fulfill(status=200,content_type='application/json',body=json.dumps(fixture(False)))
     if path.endswith('rpd-entitlement'):
      if failure=='guest-purchase':return r.fulfill(status=503,content_type='application/json',body='{}')
      return r.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'status':'paid','plan':fixture(True)}))
     raise AssertionError('Unexpected API request '+path)
    if url.startswith(BASE+'/') and r.request.method=='GET':
     requested=unquote(path).lstrip('/')
     for name in [requested or 'index.html',requested+'.html',requested.rstrip('/')+'/index.html']:
      file=(ROOT/name).resolve()
      if file.is_relative_to(ROOT) and file.is_file():return r.fulfill(path=str(file))
     return r.fulfill(status=404,body='Not found')
    return r.abort()
   ctx.route('**/*',route);page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   return ctx,page,seen
  def open_plan(page):
   page.goto(BASE+'/plans/race-pace-durability/');page.wait_for_function("document.documentElement.dataset.rpdEntitled!==undefined");page.evaluate('document.fonts.ready')
  def recovered(page):page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false' && document.getElementById('curSheet') && !document.getElementById('rpdRetry')")
  for role in ['guest','coach','jose','hope','buyer','stranger','lisa']:
   ctx,page,seen=make(role);open_plan(page);full=role in ['coach','jose','hope','buyer']
   check(role+': correct access',page.get_attribute('html','data-rpd-entitled')==str(full).lower())
   check(role+': current week remains 4','04 / 15' in page.locator('#range').inner_text())
   if full:
    page.locator('#next').click();page.wait_for_function("document.getElementById('range').textContent.includes('05')")
    check(role+': week 5 authored content','SYNTHETIC W5' in page.locator('#curSheet').inner_text())
    check(role+': no purchase pitch in viewer','$79' not in page.locator('body').inner_text())
    check(role+': correct account action',page.locator('#pdfMobile').inner_text()==('Console →' if role=='coach' else ('My training →' if role in ['hope','jose'] else 'My plan →')))
    page.screenshot(path=str(OUT/(role+'-week5-390.png')))
    if role=='coach':
     page.evaluate("document.dispatchEvent(new CustomEvent('form:access-unavailable'))");page.locator('#plan').focus();page.keyboard.press('ArrowRight');page.set_viewport_size({'width':430,'height':960})
     check('Unavailable state cannot resurrect protected content','SYNTHETIC W5' not in page.locator('body').inner_text());check('Unavailable recovery offered',page.locator('#rpdRetry').is_visible())
   else:
    check(role+': locked future contains no prescription','SYNTHETIC W5' not in page.locator('#track').inner_text());page.locator('#next').click();page.wait_for_url('**/support/');check(role+': next routes to public offer','/support/' in page.url)
   check(role+': no client athlete or role override',all(set(body)<={'p_include_plan'} for path,body in seen if path.endswith('rpd_account_access')))
   check(role+': one account decision',sum(path.endswith('rpd_account_access') for path,_ in seen)==(0 if role=='guest' else 1));ctx.close()
  for role in ['coach','jose','guest']:
   for width in [375,390,430,768,1024,1440]:
    ctx,page,seen=make(role,width);open_plan(page)
    check(f'{role} {width}: page text still wraps',page.evaluate("getComputedStyle(document.documentElement).whiteSpace!=='nowrap'"))
    overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    if overflow:
     report['overflow']=page.evaluate("Array.from(document.querySelectorAll('body *')).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,ws:getComputedStyle(e).whiteSpace})).filter(x=>x.right>innerWidth+1).slice(-25)");page.screenshot(path=str(OUT/f'overflow-{role}-{width}.png'),full_page=True)
    check(f'{role} {width}: no horizontal overflow',not overflow)
    page.evaluate("window.__mutations=0;new MutationObserver(r=>window.__mutations+=r.length).observe(document.getElementById('track'),{childList:true,subtree:true})")
    page.wait_for_timeout(160);check(f'{role} {width}: stable rendering',page.evaluate('__mutations')<10)
    if role=='coach' and width in [390,1440]:page.screenshot(path=str(OUT/f'coach-{width}.png'),full_page=True)
    page.goto(BASE+'/');page.wait_for_function("document.documentElement.dataset.formAccount!==undefined")
    check(f'{role} home {width}: correct label',page.locator('a[data-form-account]').first.inner_text()=={'coach':'Console →','jose':'My training →','guest':'Sign in →'}[role])
    check(f'{role} home {width}: no header overflow',page.locator('.header').evaluate('e=>e.scrollWidth<=innerWidth+1'))
    if role!='guest' and width==390:page.screenshot(path=str(OUT/f'{role}-home-390.png'))
    ctx.close()
  for failure in ['network','partial','contradictory']:
   ctx,page,seen=make('coach',failure=failure);page.goto(BASE+'/plans/race-pace-durability/');page.locator('#rpdRetry').wait_for()
   check(failure+': no repurchase on failed verification',not page.locator('#pdfMobile').is_visible());check(failure+': no leaked prescription','SYNTHETIC W5' not in page.locator('body').inner_text());page.screenshot(path=str(OUT/f'{failure}-390.png'));ctx.close()
  ctx,page,seen=make('stranger',legacy=True);open_plan(page);check('Signed-in stranger does not inherit guest purchase',not any(path.endswith('rpd-entitlement') for path,_ in seen));ctx.close()
  for fail in [None,'guest-purchase']:
   ctx,page,seen=make('guest',legacy=True,failure=fail);page.goto(BASE+'/plans/race-pace-durability/')
   if fail:page.locator('#rpdRetry').wait_for();check('Failed guest purchase does not silently become preview',not any(path.endswith('public_plan_preview') for path,_ in seen))
   else:page.wait_for_function("document.documentElement.dataset.rpdEntitled==='true'");check('Verified guest purchase retained',True)
   ctx.close()
  ctx,page,seen=make('coach',legacy=True);open_plan(page);page.locator('#next').click();page.evaluate("localStorage.removeItem('form-private-auth');window.__authEvent('SIGNED_OUT',null)");recovered(page)
  check('Sign-out removes previous purchase hint',page.evaluate("localStorage.getItem('rpd_purchase_session')===null"));check('Sign-out removes protected prescription','SYNTHETIC W5' not in page.locator('body').inner_text());ctx.close()
  ctx,page,seen=make('coach');open_plan(page);other=ctx.new_page();other.goto(BASE+'/');other.evaluate('(s)=>localStorage.setItem("form-private-auth",JSON.stringify(s))',session('stranger'));recovered(page)
  check('Cross-tab account switch rechecks permissions','SYNTHETIC W5' not in page.locator('body').inner_text());ctx.close()
  check('No uncaught JavaScript errors',not report['errors']);browser.close()
 report['result']='PASS'
except Exception as error:
 report['result']='FAIL';report['failure']=str(error);raise
finally:
 (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n');print(report.get('result'),len(report['checks']),ENGINE)
