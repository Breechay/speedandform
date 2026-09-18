from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
import json, os

ROOT=Path(__file__).resolve().parents[1]
BASE='https://console-delivery.test'
ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('CONSOLE_DELIVERY_ARTIFACTS','/tmp/console-delivery'))
OUT.mkdir(parents=True,exist_ok=True)
report={'engine':ENGINE,'checks':[],'errors':[]}
def check(name,value):
    assert value,name
    report['checks'].append(name)

HARNESS='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/private/graphite.css"><link rel="stylesheet" href="/athlete/workspace.css"></head><body><main id="app"></main><script type="module">
import {deliveryOverviewFor} from '/private/delivery-status.js';
import {renderDeliveryOverview,renderCoachAthletePreview} from '/coach/delivery-view.js';
const p=new URLSearchParams(location.search),kind=p.get('kind')||'jose';
const week={id:'w4',week_number:4,starts_on:'2026-09-14',ends_on:'2026-09-20',intent:'Hold the week together.'};
let athlete,record,opts;
if(kind==='adrian'){
 athlete={id:'a',slug:'adrian',display_name:'Adrian Gandara',program_name:'Runner Mass · Phase 1',delivery:'coach',account_label:'Adrian',home_surface:'form'};
 const fallback=await fetch('/plans/adrian-runner-mass-phase-01/program.json').then(r=>r.json()); fallback.overview_path='/plans/adrian-runner-mass-phase-01/';
 record={athlete,block:null,weeks:[],currentWeek:null,sessionsByWeek:{},completions:[],directions:[],reads:[],decisions:[],fallbackProgram:fallback};
 opts={};
}else{
 athlete={id:'j',slug:'jose',display_name:'José',program_name:'FORM',delivery:'app',account_label:'Founding Member',home_surface:'form'};
 record={athlete,block:{total_weeks:15,goal_statement:'Run under 1:30 at Orlando'},weeks:[week],currentWeek:week,sessionsByWeek:{w4:[{id:'s1',day_label:'THU',state:'published',currentVersion:{title:'Easy with strides',prescribed_distance:6,distance_unit:'mi',intent:'Keep it easy.'}}]},completions:[],directions:[],reads:[],decisions:[]};
 opts={athleteMemberships:[{role:'athlete',status:'active'}],assignments:[{assigned_at:'2026-09-05T18:00:00Z'}]};
}
record.deliveryOverview=deliveryOverviewFor(athlete,opts);
document.getElementById('app').innerHTML='<div class="coachConsole">'+renderDeliveryOverview(record.deliveryOverview)+renderCoachAthletePreview(record)+'</div>';
document.documentElement.dataset.ready='true';
</script></body></html>'''

try:
  with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(headless=True)
    for width in [390,768,1440]:
      for kind in ['jose','adrian']:
        ctx=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
        page=ctx.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        def route(r):
          path=urlsplit(r.request.url).path
          if path=='/__delivery': return r.fulfill(status=200,headers={'Content-Type':'text/html; charset=utf-8'},body=HARNESS)
          if r.request.url.startswith(BASE+'/'):
            file=(ROOT/path.lstrip('/')).resolve()
            if file.is_relative_to(ROOT) and file.is_file(): return r.fulfill(path=str(file))
            return r.fulfill(status=404,body='Not found')
          return r.abort()
        ctx.route('**/*',route)
        page.goto(f'{BASE}/__delivery?kind={kind}'); page.wait_for_function("document.documentElement.dataset.ready==='true'")
        body=page.locator('body').inner_text()
        check(f'{kind} {width}: no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check(f'{kind} {width}: four delivery facts',page.locator('.consoleDelivery > div').count()==4)
        check(f'{kind} {width}: preview truth','coach-owned read-only preview · not a sign-in' in body)
        check(f'{kind} {width}: inert preview',page.locator('.consoleAthletePreview__frame').get_attribute('inert') is not None)
        page.locator('.consoleAthletePreview > summary').click()
        check(f'{kind} {width}: preview opens',page.locator('.consoleAthletePreview__frame').is_visible())
        if kind=='jose':
          check(f'jose {width}: account linked','Account linked' in body)
          check(f'jose {width}: FORM target','FORM' in body)
          check(f'jose {width}: unproven receipt','Native receipt not yet proven' in body)
        else:
          check(f'adrian {width}: fallback','Web fallback' in body)
          check(f'adrian {width}: Forge target','Forge' in body)
          check(f'adrian {width}: no inferred week','does not infer your current Forge week' in page.locator('.consoleAthletePreview__frame').inner_text())
        if width in [390,1440]:
          page.screenshot(path=str(OUT/f'{ENGINE}-{kind}-{width}.png'),full_page=True)
        check(f'{kind} {width}: no JS errors',not errors)
        ctx.close()
    browser.close(); report['result']='PASS'
except Exception as e:
  report['result']='FAIL'; report['failure']=str(e); raise
finally:
  (OUT/f'{ENGINE}.json').write_text(json.dumps(report,indent=2)+'\n'); print(report.get('result'),len(report['checks']),ENGINE)
