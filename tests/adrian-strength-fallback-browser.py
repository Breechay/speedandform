from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
import json, os

ROOT=Path(__file__).resolve().parents[1]
BASE='https://adrian-fallback.test'
ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('ADRIAN_FALLBACK_ARTIFACTS','/tmp/adrian-fallback'))
OUT.mkdir(parents=True,exist_ok=True)
report={'engine':ENGINE,'checks':[],'errors':[]}
def check(name,value):
    assert value,name
    report['checks'].append(name)

HARNESS='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/private/graphite.css"><link rel="stylesheet" href="/athlete/workspace.css"></head><body><main id="app"></main><script type="module">
import {renderAthleteWorkspace} from '/athlete/workspace.js';
const p=new URLSearchParams(location.search),view=p.get('view')||'today',week=Number(p.get('week')||1);
const fallback=await fetch('/plans/adrian-runner-mass-phase-01/program.json').then(r=>r.json()); fallback.overview_path='/plans/adrian-runner-mass-phase-01/';
const record={athlete:{id:'a',display_name:'Adrian Gandara',account_label:'Adrian',delivery:'coach',home_surface:'form',program_name:'Runner Mass · Phase 1'},block:null,weeks:[],currentWeek:null,sessionsByWeek:{},completions:[],directions:[],reads:[],decisions:[]};
document.getElementById('app').innerHTML=renderAthleteWorkspace(record,{view,email:'adrian@example.com',fallbackProgram:fallback,fallbackWeek:week});document.documentElement.dataset.ready='true';
</script></body></html>'''

try:
  with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(headless=True)
    for width in [390,1440]:
      for view in ['today','plan','history','account']:
        ctx=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
        page=ctx.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        def route(r):
          path=urlsplit(r.request.url).path
          if path=='/__fallback': return r.fulfill(status=200,headers={'Content-Type':'text/html; charset=utf-8'},body=HARNESS)
          if r.request.url.startswith(BASE+'/'):
            file=(ROOT/path.lstrip('/')).resolve()
            if file.is_relative_to(ROOT) and file.is_file(): return r.fulfill(path=str(file))
            return r.fulfill(status=404,body='Not found')
          return r.abort()
        ctx.route('**/*',route)
        page.goto(f'{BASE}/__fallback?view={view}&week=1'); page.wait_for_function("document.documentElement.dataset.ready==='true'")
        body=page.locator('body').inner_text()
        check(f'{view} {width}: no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check(f'{view} {width}: strength identity','Strength development' in body)
        check(f'{view} {width}: no positive sync status','\nSynced\n' not in '\n'+body+'\n' and '\nConnected\n' not in '\n'+body+'\n')
        check(f'{view} {width}: no filing','File this session' not in body)
        if view=='today':
          check(f'today {width}: fallback visible','Your three-week plan is here.' in body)
          check(f'today {width}: no current inference','does not infer your current Forge week' in body)
        if view=='plan':
          check(f'plan {width}: baseline','Week 01 · Baseline' in body)
          check(f'plan {width}: exercise detail','Incline Barbell Bench Press' in body)
          check(f'plan {width}: position warning','Position is not inferred from this page.' in body)
          check(f'plan {width}: all week navigation',page.locator('[data-fallback-week-step]').count()==2)
        if view=='history': check(f'history {width}: no fabricated receipt','No Forge history has reached this account yet.' in body)
        if view=='account': check(f'account {width}: web reference','Runner Mass · Phase 01 · 3 weeks' in body)
        if view in ['today','plan']: page.screenshot(path=str(OUT/f'{ENGINE}-{view}-{width}.png'),full_page=True)
        check(f'{view} {width}: no JS errors',not errors)
        ctx.close()

    ctx=browser.new_context(viewport={'width':390,'height':1000},reduced_motion='reduce'); page=ctx.new_page()
    def route3(r):
      path=urlsplit(r.request.url).path
      if path=='/__fallback': return r.fulfill(status=200,headers={'Content-Type':'text/html; charset=utf-8'},body=HARNESS)
      if r.request.url.startswith(BASE+'/'):
        file=(ROOT/path.lstrip('/')).resolve()
        if file.is_relative_to(ROOT) and file.is_file(): return r.fulfill(path=str(file))
        return r.fulfill(status=404,body='Not found')
      return r.abort()
    ctx.route('**/*',route3); page.goto(BASE+'/__fallback?view=plan&week=3'); page.wait_for_function("document.documentElement.dataset.ready==='true'")
    body=page.locator('body').inner_text(); check('Week 3 renders','Week 03 · Confirm' in body); check('Week 3 keeps exercise menu','Incline Barbell Bench Press' in body); check('Week 3 still no receipt','RECEIVED' not in body); ctx.close()
    browser.close();report['result']='PASS'
except Exception as e:
  report['result']='FAIL'; report['failure']=str(e); raise
finally:
  (OUT/f'{ENGINE}.json').write_text(json.dumps(report,indent=2)+'\n'); print(report.get('result'),len(report['checks']),ENGINE)
