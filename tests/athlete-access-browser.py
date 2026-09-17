"""Pass 1: real page code with isolated synthetic auth/data responses.
No live account, email, checkout, workout, or analytics writes are made.
Database authorization is tested independently by the SQL acceptance script.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
import json, os, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('ACCESS_ARTIFACTS','/tmp/athlete-access')); OUT.mkdir(parents=True,exist_ok=True)
ENGINE=os.environ.get('BROWSER','chromium')
report={'engine':ENGINE,'auth':'synthetic fixtures; not real sign-in','checks':[],'errors':[]}
def check(name,value):
    assert value,name
    report['checks'].append(name)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*a):pass
    def do_GET(self):
        route=unquote(urlsplit(self.path).path).lstrip('/')
        for file in [route or 'index.html',route+'.html',route.rstrip('/')+'/index.html']:
            if (ROOT/file).is_file():self.path='/'+file;return super().do_GET()
        self.send_error(404)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
SDK='''export const supabase = {
 auth: {
  getSession: async()=>({data:{session:JSON.parse(localStorage.getItem('form-private-auth')||'null')},error:null}),
  getUser: async()=>window.__invalidUser ? ({data:{user:null},error:{message:'invalid'}}) : ({data:{user:JSON.parse(localStorage.getItem('form-private-auth')||'null')?.user},error:null}),
  onAuthStateChange: callback=>{window.__authEvent=callback;return {data:{subscription:{unsubscribe(){}}}}}
 },
 rpc: async name=>({data:0,error:null})
};'''
def fixture(full):
    return {'plan':{'slug':'race-pace-durability','name':'Race Pace Durability','discipline':'half_marathon','race_pace_low_seconds':420,'race_pace_high_seconds':435},
      'running':{'starts_on':'2026-08-24','race_on':'2026-12-05'},'version':{'number':1,'cut_at':'2026-09-01'},
      'weeks':[{'week_number':w,'total_distance':30 if full or w<=4 else None,'sessions':([
       {'day':d,'label':f'SYNTHETIC W{w} {d}','title':'Synthetic test only','distance':3,'components':[]}
       for d in ['MON','TUE','WED','THU','FRI','SAT']] if full or w<=4 else [])} for w in range(1,16)]}
def session(user):return {'user':{'id':user},'access_token':'synthetic-'+user}
FIX_DATE="""const D=Date;globalThis.Date=class extends D { constructor(...a){ super(...(a.length?a:['2026-09-17T12:00:00-04:00'])); }};"""
try:
 with sync_playwright() as pw:
    opts={'headless':True}
    if ENGINE=='chromium' and os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=getattr(pw,ENGINE).launch(**opts)
    def context_for(role='guest',width=390,failure=None,legacy=False):
        ctx=browser.new_context(viewport={'width':width,'height':960},reduced_motion='reduce')
        ctx.add_init_script(FIX_DATE)
        # Seed once per context, not again after sign-out/reload.
        seed=f"if(!sessionStorage.getItem('seed')){{sessionStorage.setItem('seed','1');{('localStorage.setItem(\"form-private-auth\",'+json.dumps(json.dumps(session(role)))+');') if role!='guest' else ''}{'localStorage.setItem(\"rpd_purchase_session\",\"cs_syntheticguest\");' if legacy else ''}}}"
        ctx.add_init_script(seed)
        seen=[]
        def route(r):
            url=r.request.url; path=urlsplit(url).path
            if path=='/private/supabase-client.js':return r.fulfill(status=200,content_type='text/javascript',body=SDK)
            if 'pbgsjjegycacodiltbhn.supabase.co' in url:
                body=r.request.post_data_json or {};seen.append((path,body))
                if failure=='network' and path.endswith('rpd_account_access'):return r.fulfill(status=503,content_type='application/json',body='{}')
                if path.endswith('rpd_account_access'):
                    user=r.request.headers.get('authorization','').removeprefix('Bearer synthetic-')
                    mode={'coach':'coach','jose':'assigned','hope':'assigned','buyer':'purchased'}.get(user,'preview')
                    workspace='coach' if user=='coach' else ('athlete' if user in ['jose','hope','lisa'] else 'account')
                    full=mode!='preview'
                    data={'schema':1,'user_id':user,'mode':mode,'entitled':full,'workspace':workspace,'plan':fixture(full) if full and body.get('p_include_plan') else None}
                    if failure=='partial' and data['plan']:data['plan']['weeks'][4]['sessions']=[]
                    if failure=='contradictory':data['entitled']=not full
                    return r.fulfill(status=200,content_type='application/json',body=json.dumps(data))
                if path.endswith('public_plan_preview'):return r.fulfill(status=200,content_type='application/json',body=json.dumps(fixture(False)))
                if path.endswith('rpd-entitlement'):
                    data={'ok':True,'status':'paid','plan':fixture(True)}
                    if failure=='guest-purchase':return r.fulfill(status=503,content_type='application/json',body='{}')
                    return r.fulfill(status=200,content_type='application/json',body=json.dumps(data))
                raise AssertionError('Unexpected API request '+path)
            if url.startswith(BASE) and r.request.method=='GET':return r.continue_()
            return r.abort()
        ctx.route('**/*',route)
        page=ctx.new_page();page.on('pageerror',lambda error:report['errors'].append(str(error)))
        return ctx,page,seen
    for role in ['guest','coach','jose','hope','buyer','stranger','lisa']:
      ctx,page,seen=context_for(role)
      page.goto(BASE+'/plans/race-pace-durability/?state=auto')
      page.wait_for_function("document.documentElement.dataset.rpdEntitled!==undefined")
      full=role in ['coach','jose','hope','buyer']
      check(role+': correct access',page.get_attribute('html','data-rpd-entitled')==str(full).lower())
      check(role+': current week remains 4','04 / 15' in page.locator('#range').inner_text())
      if full:
        page.locator('#next').click();page.wait_for_function("document.getElementById('range').textContent.includes('05')")
        check(role+': week 5 authored content','SYNTHETIC W5' in page.locator('#curSheet').inner_text())
        check(role+': no purchase pitch in viewer','$79' not in page.locator('body').inner_text())
        check(role+': correct account action',page.locator('#pdfMobile').inner_text()==('Console →' if role=='coach' else ('My training →' if role in ['hope','jose'] else 'My plan →')))
        page.screenshot(path=str(OUT/(role+'-week5-390.png')))
        if role=='coach':
          page.evaluate("document.dispatchEvent(new CustomEvent('form:access-unavailable'))")
          page.locator('#plan').focus();page.keyboard.press('ArrowRight');page.set_viewport_size({'width':430,'height':960})
          check('Unavailable state cannot resurrect protected content','SYNTHETIC W5' not in page.locator('body').inner_text())
          check('Unavailable recovery offered',page.locator('#rpdRetry').is_visible())
      else:
        check(role+': locked future contains no prescription','SYNTHETIC W5' not in page.locator('#track').inner_text())
        page.locator('#next').click();page.wait_for_url('**/support/')
        check(role+': next routes to public offer','/support/' in page.url)
      check(role+': no client athlete or role override',all(set(body)<= {'p_include_plan'} for path,body in seen if path.endswith('rpd_account_access')))
      check(role+': one account decision',sum(path.endswith('rpd_account_access') for path,_ in seen)==(0 if role=='guest' else 1))
      ctx.close()
    for role in ['coach','jose','guest']:
      for width in [375,390,430,768,1024,1440]:
        ctx,page,seen=context_for(role,width)
        page.goto(BASE+'/plans/race-pace-durability/?state=auto');page.wait_for_function("document.documentElement.dataset.rpdEntitled!==undefined")
        check(f'{role} {width}: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        # A locked-table observer must converge instead of rewriting its own headings every frame.
        page.evaluate("window.__mutations=0;new MutationObserver(r=>window.__mutations+=r.length).observe(document.getElementById('track'),{childList:true,subtree:true})")
        page.wait_for_timeout(160)
        check(f'{role} {width}: stable rendering',page.evaluate('__mutations')<10)
        if role=='coach' and width in [390,1440]:page.screenshot(path=str(OUT/f'coach-{width}.png'),full_page=True)
        page.goto(BASE+'/');page.wait_for_function("document.documentElement.dataset.formAccount!==undefined")
        check(f'{role} home {width}: correct label',page.locator('[data-form-account]').first.inner_text()=={'coach':'Console →','jose':'My training →','guest':'Sign in →'}[role])
        check(f'{role} home {width}: no header overflow',page.locator('.header').evaluate('e=>e.scrollWidth<=innerWidth+1'))
        ctx.close()
    for failure in ['network','partial','contradictory']:
      ctx,page,seen=context_for('coach',failure=failure)
      page.goto(BASE+'/plans/race-pace-durability/?state=auto');page.locator('#rpdRetry').wait_for()
      check(failure+': no repurchase on failed verification',not page.locator('#pdfMobile').is_visible())
      check(failure+': no leaked prescription','SYNTHETIC W5' not in page.locator('body').inner_text())
      page.screenshot(path=str(OUT/f'{failure}-390.png'));ctx.close()
    ctx,page,seen=context_for('stranger',legacy=True)
    page.goto(BASE+'/plans/race-pace-durability/?state=auto');page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false'")
    check('Signed-in stranger does not inherit guest purchase',not any(path.endswith('rpd-entitlement') for path,_ in seen))
    ctx.close()
    for fail in [None,'guest-purchase']:
      ctx,page,seen=context_for('guest',legacy=True,failure=fail)
      page.goto(BASE+'/plans/race-pace-durability/?state=auto')
      if fail:page.locator('#rpdRetry').wait_for();check('Failed guest purchase does not silently become preview',not any(path.endswith('public_plan_preview') for path,_ in seen))
      else:page.wait_for_function("document.documentElement.dataset.rpdEntitled==='true'");check('Verified guest purchase retained',True)
      ctx.close()
    ctx,page,seen=context_for('coach',legacy=True)
    page.goto(BASE+'/plans/race-pace-durability/?state=auto');page.wait_for_function("document.documentElement.dataset.rpdEntitled==='true'")
    page.locator('#next').click()
    page.evaluate("localStorage.removeItem('form-private-auth');window.__authEvent('SIGNED_OUT',null)")
    page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false'")
    check('Sign-out removes previous purchase hint',page.evaluate("localStorage.getItem('rpd_purchase_session')===null"))
    check('Sign-out removes protected prescription','SYNTHETIC W5' not in page.locator('body').inner_text())
    ctx.close()
    ctx,page,seen=context_for('coach')
    page.goto(BASE+'/plans/race-pace-durability/?state=auto');page.wait_for_function("document.documentElement.dataset.rpdEntitled==='true'")
    other=ctx.new_page();other.goto(BASE+'/')
    other.evaluate('(s)=>localStorage.setItem("form-private-auth",JSON.stringify(s))',session('stranger'))
    page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false'")
    check('Cross-tab account switch rechecks permissions','SYNTHETIC W5' not in page.locator('body').inner_text())
    ctx.close()
    check('No uncaught JavaScript errors',not report['errors'])
    browser.close()
 report['result']='PASS'
except Exception as error:
 report['result']='FAIL';report['failure']=str(error);raise
finally:
 (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n');server.shutdown()
 print(report.get('result'),len(report['checks']),ENGINE)
