"""Pass 11 cross-surface geometry + failure-state acceptance. Synthetic data only."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
import json, os

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://cross-surface.test'
ENGINE = os.environ.get('BROWSER', 'chromium')
OUT = Path(os.environ.get('CROSS_SURFACE_ARTIFACTS', '/tmp/cross-surface'))
OUT.mkdir(parents=True, exist_ok=True)
report = {'engine': ENGINE, 'checks': [], 'errors': []}

def check(name, value):
    assert value, name
    report['checks'].append(name)

def min_box(page, selector, w=44, h=44):
    box = page.locator(selector).first.bounding_box()
    return bool(box and box['width'] >= w - .5 and box['height'] >= h - .5)

def fixture():
    return {
      'plan': {'slug':'race-pace-durability','name':'Race Pace Durability','discipline':'half_marathon',
               'race_pace_low_seconds':420,'race_pace_high_seconds':435},
      'running': {'starts_on':'2026-08-24','race_on':'2026-12-05'},
      'version': {'number':5,'cut_at':'2026-09-15'},
      'weeks': [
        {'week_number':w,'total_distance':45+w,'sessions':[
          {'day':d,'label':f'SYNTHETIC W{w} {d}','title':'Synthetic test only','distance':3,'components':[]}
          for d in ['MON','TUE','WED','THU','FRI','SAT']
        ] if w <= 4 else []}
        for w in range(1,16)
      ]
    }

SDK = """export const SUPABASE_URL='https://pbgsjjegycacodiltbhn.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY='synthetic';
export const callbackUrl=(returnTo='/athlete/')=>'https://cross-surface.test/auth/record-callback/?return_to='+encodeURIComponent(returnTo);
export const supabase={auth:{
 getSession:async()=>({data:{session:window.__restoreSession||null},error:null}),
 signInWithPassword:async()=>({error:null}),signInWithOtp:async()=>({error:null}),
 resetPasswordForEmail:async()=>({error:null}),signInWithOAuth:async()=>({data:{},error:null}),
 getUserIdentities:async()=>({data:{identities:[]},error:null}),linkIdentity:async()=>({error:null}),
 updateUser:async()=>({error:null}),signOut:async()=>({error:null}),
 onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
},rpc:async()=>({data:0,error:null})};"""

DOORWAY = """<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/private/graphite.css"></head><body class="auth-only"><main id="app"></main>
<script type="module">import {renderDoorway} from '/private/auth.js';
await renderDoorway(document.getElementById('app'),{destination:'/athlete/',label:'Athlete sign in'});
document.documentElement.dataset.ready='true';</script></body></html>"""

WORKSPACE = """<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/private/graphite.css"><link rel="stylesheet" href="/athlete/workspace.css"></head><body><main id="app"></main>
<script type="module">import {renderAthleteWorkspace} from '/athlete/workspace.js';
const view=new URLSearchParams(location.search).get('view')||'today';
const week={id:'w1',week_number:1,starts_on:'2026-09-14',ends_on:'2026-09-20',intent:'Keep it controlled.'};
const sessions=[
{id:'s1',week_id:'w1',day_label:'MON',state:'published',scheduled_on:'2026-09-14',currentVersion:{title:'Easy run',prescribed_distance:4,distance_unit:'mi',intent:'Easy and conversational.'}},
{id:'s2',week_id:'w1',day_label:'THU',state:'published',scheduled_on:'2026-09-17',currentVersion:{title:'Easy + strides',prescribed_distance:5,distance_unit:'mi',intent:'Relaxed with clean strides.'}}
];
const record={athlete:{id:'a',slug:'natalie',display_name:'Natalie',first_name:'Natalie',program_name:'Run Development',account_label:'Run Development',delivery:'app',home_surface:'website'},
block:{id:'b',total_weeks:8,goal_statement:'Build the half-marathon foundation.'},weeks:[week],currentWeek:week,sessions,sessionsByWeek:{w1:sessions},completions:[],directions:[],reads:[],decisions:[]};
document.getElementById('app').innerHTML=renderAthleteWorkspace(record,{view,email:'synthetic@example.com'});
document.documentElement.dataset.ready='true';</script></body></html>"""

try:
  with sync_playwright() as pw:
    browser = getattr(pw, ENGINE).launch(headless=True)

    def context(width=390, restore_session=False):
      ctx = browser.new_context(viewport={'width':width,'height':1000}, reduced_motion='reduce')
      if restore_session:
        ctx.add_init_script("window.__restoreSession={user:{id:'synthetic-buyer'},access_token:'synthetic-token'}")
      def route(r):
        url = r.request.url
        path = urlsplit(url).path
        if path == '/__doorway':
          return r.fulfill(status=200, content_type='text/html', body=DOORWAY)
        if path == '/__workspace':
          return r.fulfill(status=200, content_type='text/html', body=WORKSPACE)
        if path == '/private/supabase-client.js':
          return r.fulfill(status=200, content_type='text/javascript', body=SDK)
        if 'pbgsjjegycacodiltbhn.supabase.co' in url:
          if path.endswith('/auth/v1/settings'):
            return r.fulfill(status=200, content_type='application/json', body=json.dumps({'external':{}}))
          if path.endswith('/rest/v1/rpc/public_plan_preview'):
            return r.fulfill(status=200, content_type='application/json', body=json.dumps(fixture()))
          if path.endswith('/functions/v1/rpd-entitlement'):
            return r.fulfill(status=503, content_type='application/json', body='{}')
          raise AssertionError('Unexpected API '+path)
        if url.startswith(BASE + '/') and r.request.method == 'GET':
          requested = unquote(path).lstrip('/')
          for name in [requested or 'index.html', requested+'.html', requested.rstrip('/')+'/index.html']:
            file = (ROOT/name).resolve()
            if file.is_relative_to(ROOT) and file.is_file():
              return r.fulfill(path=str(file))
          return r.fulfill(status=404, body='Not found')
        return r.abort()
      ctx.route('**/*', route)
      page = ctx.new_page()
      local_errors = []
      page.on('pageerror', lambda e: local_errors.append(str(e)))
      return ctx, page, local_errors

    # Shared sign-in doorway: keyboard target is physically large enough.
    for width in [390, 1440]:
      ctx,page,errors = context(width)
      page.goto(BASE+'/__doorway')
      page.wait_for_function("document.documentElement.dataset.ready==='true'")
      check(f'doorway {width}: reset-password target >=44', min_box(page, '#forgotPassword'))
      check(f'doorway {width}: primary action >=44', min_box(page, '#passwordForm button[type=submit]'))
      check(f'doorway {width}: no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
      check(f'doorway {width}: no JS errors', not errors)
      if width == 390: page.screenshot(path=str(OUT/f'{ENGINE}-doorway-390.png'), full_page=True)
      ctx.close()

    # Athlete read-only workspace: tabs, plan arrows and text actions all carry 44pt targets.
    for width in [390, 1440]:
      for view in ['today','plan']:
        ctx,page,errors = context(width)
        page.goto(BASE+f'/__workspace?view={view}')
        page.wait_for_function("document.documentElement.dataset.ready==='true'")
        check(f'workspace {view} {width}: tabs >=44', min_box(page, '.athlete-tab'))
        if view == 'today':
          check(f'workspace today {width}: text action >=44', min_box(page, '.text-action'))
        else:
          check(f'workspace plan {width}: week arrow >=44', min_box(page, '.plan-week-nav button'))
        check(f'workspace {view} {width}: no overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check(f'workspace {view} {width}: no JS errors', not errors)
        if width == 390 and view == 'today': page.screenshot(path=str(OUT/f'{ENGINE}-workspace-390.png'), full_page=True)
        ctx.close()

    # RPD real page: both desktop and phone controls use real 44pt hit boxes.
    for width in [390, 1440]:
      ctx,page,errors = context(width)
      page.goto(BASE+'/plans/race-pace-durability/')
      page.wait_for_function("document.documentElement.dataset.rpdEntitled==='false'")
      if width == 390:
        check('RPD phone: share >=44', min_box(page, '#shareMobile'))
        check('RPD phone: week arrow >=44', min_box(page, '#next'))
        check('RPD phone: full-plan action >=44', min_box(page, '#pdfMobile'))
      else:
        check('RPD desktop: top nav >=44', min_box(page, '.topnav a'))
        check('RPD desktop: share >=44', min_box(page, '#share'))
        check('RPD desktop: week arrow >=44', min_box(page, '#next'))
      check(f'RPD {width}: no overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))

      # A verification outage is not rendered as lost access or a repurchase.
      page.evaluate("document.dispatchEvent(new CustomEvent('form:access-unavailable'))")
      page.locator('#rpdRetry').wait_for()
      recovery = page.locator('.rpd-access-message').inner_text()
      check(f'RPD {width}: outage says training unchanged', 'Your training has not changed.' in recovery)
      check(f'RPD {width}: outage offers retry', page.locator('#rpdRetry').is_visible())
      check(f'RPD {width}: protected viewer cleared', 'SYNTHETIC W5' not in page.locator('body').inner_text())
      check(f'RPD {width}: no JS errors', not errors)
      if width == 390: page.screenshot(path=str(OUT/f'{ENGINE}-rpd-unavailable-390.png'), full_page=True)
      ctx.close()

    # Purchase restore: backend outage is visible and explicitly non-transactional.
    ctx,page,errors = context(390, restore_session=True)
    page.goto(BASE+'/plans/race-pace-durability/access/')
    page.wait_for_function("document.getElementById('accessStatus').textContent.includes('Nothing was charged or changed')")
    text_value = page.locator('#accessStatus').inner_text()
    check('restore failure visible', 'Nothing was charged or changed' in text_value)
    check('restore input >=44', min_box(page, '#accessEmail'))
    check('restore button >=44', min_box(page, '#accessButton'))
    check('restore uses sign-in wording', 'secure sign-in link' not in page.locator('body').inner_text().lower())
    check('restore no overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    check('restore no JS errors', not errors)
    page.screenshot(path=str(OUT/f'{ENGINE}-restore-failure-390.png'), full_page=True)
    ctx.close()

    browser.close()
    report['result'] = 'PASS'
except Exception as error:
  report['result'] = 'FAIL'
  report['failure'] = str(error)
  raise
finally:
  (OUT/f'{ENGINE}.json').write_text(json.dumps(report, indent=2)+'\n')
  print(report.get('result'), len(report['checks']), ENGINE)
