from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
import json, os
ROOT=Path(__file__).resolve().parents[1]
BASE='https://athlete-workspace.test'
ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('ATHLETE_WORKSPACE_ARTIFACTS','/tmp/athlete-workspace-browser'))
OUT.mkdir(parents=True,exist_ok=True)
report={'engine':ENGINE,'checks':[],'errors':[]}
def check(name,value):
    assert value,name
    report['checks'].append(name)
HARNESS='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/private/graphite.css"><link rel="stylesheet" href="/athlete/workspace.css"></head><body><main id="app"></main><script type="module">
import {renderAthleteWorkspace} from '/athlete/workspace.js';
const p=new URLSearchParams(location.search),kind=p.get('kind')||'running',view=p.get('view')||'today';
const week={id:'w1',week_number:1,starts_on:'2026-09-14',ends_on:'2026-09-20',intent:'Build the week without forcing it.'};
const record={athlete:{id:'a1',display_name:kind==='strength'?'Adrian':'José',account_label:kind==='strength'?'Remote strength':'Run Development',delivery:kind==='strength'?'forge':'form_app',home_surface:kind,program_name:kind==='strength'?'Breechay Sculpt':'Race Pace Durability'},block:kind==='strength'?null:{id:'b1',current_week:1,total_weeks:15,goal_statement:'Half marathon · Dec 5'},weeks:kind==='strength'?[]:[week],currentWeek:kind==='strength'?null:week,sessionsByWeek:kind==='strength'?{}:{w1:[{id:'s1',day_label:'Mon',currentVersion:{title:'General aerobic',prescribed_distance:6,distance_unit:'mi',intent:'Easy and conversational.'}},{id:'s2',day_label:'Tue',currentVersion:{title:'Race pace',prescribed_distance:9,distance_unit:'mi',intent:'5 mi continuous at your race-pace band.'}}]},completions:kind==='strength'?[]:[{id:'c1',planned_session_id:'s1',status:'completed',actual_distance:6,distance_unit:'mi',filed_at:'2026-09-14T12:00:00Z',athlete_note:'Smooth.'}],directions:[],reads:kind==='strength'?[]:[{published_at:'2026-09-15T12:00:00Z',athlete_text:'The work is landing.'}],decisions:[]};
document.getElementById('app').innerHTML=renderAthleteWorkspace(record,{view,email:(kind==='strength'?'adrian':'jose')+'@example.com'});document.documentElement.dataset.ready='true';
</script></body></html>'''
try:
  with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(headless=True)
    for width in [390,768,1440]:
      for kind in ['running','strength']:
        for view in ['today','plan','history','account']:
          ctx=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
          page=ctx.new_page(); page.on('pageerror',lambda e:report['errors'].append(str(e)))
          def route(r):
            path=urlsplit(r.request.url).path
            if path=='/__workspace': return r.fulfill(status=200,content_type='text/html',body=HARNESS)
            if r.request.url.startswith(BASE+'/'):
              file=(ROOT/path.lstrip('/')).resolve()
              if file.is_relative_to(ROOT) and file.is_file(): return r.fulfill(path=str(file))
              return r.fulfill(status=404,body='Not found')
            return r.abort()
          ctx.route('**/*',route)
          page.goto(f'{BASE}/__workspace?kind={kind}&view={view}');page.wait_for_function("document.documentElement.dataset.ready==='true'")
          check(f'{kind} {view} {width}: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
          check(f'{kind} {view} {width}: four destinations',page.locator('[data-athlete-view]').count()==4)
          check(f'{kind} {view} {width}: no filing control','File this session' not in page.locator('body').inner_text())
          if kind=='strength':
            check(f'strength {view} {width}: no run identity','Run development' not in page.locator('body').inner_text())
          if width in [390,1440] and view in ['today','plan']:
            page.screenshot(path=str(OUT/f'{ENGINE}-{kind}-{view}-{width}.png'),full_page=True)
          ctx.close()
    check('No uncaught JavaScript errors',not report['errors'])
    browser.close(); report['result']='PASS'
except Exception as e:
  report['result']='FAIL';report['failure']=str(e);raise
finally:
  (OUT/f'{ENGINE}.json').write_text(json.dumps(report,indent=2)+'\n')
  print(report.get('result'),len(report['checks']),ENGINE)
