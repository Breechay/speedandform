from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
import json, os

ROOT=Path(__file__).resolve().parents[1]
BASE='https://review-chain.test'
ENGINE=os.environ.get('BROWSER','chromium')
OUT=Path(os.environ.get('REVIEW_CHAIN_ARTIFACTS','/tmp/review-chain'))
OUT.mkdir(parents=True,exist_ok=True)
report={'engine':ENGINE,'checks':[]}
def check(name,value):
    assert value,name
    report['checks'].append(name)

HARNESS='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/private/graphite.css"><link rel="stylesheet" href="/athlete/workspace.css"></head><body><section id="coach"></section><section id="athlete"></section><script type="module">
import {renderCoachReviewChain} from '/coach/review-chain-view.js';
import {renderAthleteWorkspace} from '/athlete/workspace.js';
const p=new URLSearchParams(location.search),state=p.get('state')||'chain';
const completion={id:'c1',planned_session_id:'s1',filed_at:'2026-09-17T12:00:00Z',status:'completed',actual_distance:5,distance_unit:'mi',athlete_note:'Felt controlled'};
const week={id:'w4',week_number:4,starts_on:'2026-09-14',ends_on:'2026-09-20',intent:'Hold the week together.'};
const sessions=[
{id:'s1',week_id:'w4',day_label:'TUE',scheduled_on:'2026-09-15',state:'published',currentVersion:{title:'5 mi continuous at race pace',prescribed_distance:9,distance_unit:'mi',intent:'Hold the band.'}},
{id:'s2',week_id:'w4',day_label:'SAT',scheduled_on:'2026-09-19',state:'published',currentVersion:{title:'Long run',prescribed_distance:12,distance_unit:'mi',intent:'Easy throughout.'}}
];
const read={id:'r1',athlete_text:'Internal review wording.',delivered_wording:'You held the pace without spending the last mile.',question_answered:'Can five miles stay controlled?',delivery_state:'delivered_externally',completionIds:['c1'],published_at:'2026-09-17T13:00:00Z'};
const direction={id:'d1',planned_session_id:'s2',based_on_read_id:'r1',athlete_text:'Internal next wording.',delivered_wording:'Keep Saturday easy. No proving.',delivery_state:'delivered_externally',published_at:'2026-09-17T13:01:00Z'};
const record={athlete:{id:'a',slug:'hope',display_name:'Hope',first_name:'Hope',program_name:'FORM',delivery:'app',account_label:'Founding Member',home_surface:'form'},block:{total_weeks:15,goal_statement:'Run under 1:30 at Orlando'},weeks:[week],currentWeek:week,sessions,sessionsByWeek:{w4:sessions},completions:[completion],reads:state==='open'?[]:[read],directions:state==='chain'?[direction]:[],decisions:[]};
document.getElementById('coach').innerHTML=renderCoachReviewChain(record,'c1');
document.getElementById('athlete').innerHTML=renderAthleteWorkspace(record,{view:'today'});
document.documentElement.dataset.ready='true';
</script></body></html>'''

try:
  with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(headless=True)
    for width in [390,1440]:
      for state in ['open','review','chain']:
        ctx=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
        page=ctx.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        def route(r):
          path=urlsplit(r.request.url).path
          if path=='/__review': return r.fulfill(status=200,headers={'Content-Type':'text/html; charset=utf-8'},body=HARNESS)
          if r.request.url.startswith(BASE+'/'):
            file=(ROOT/path.lstrip('/')).resolve()
            if file.is_relative_to(ROOT) and file.is_file(): return r.fulfill(path=str(file))
            return r.fulfill(status=404,body='Not found')
          return r.abort()
        ctx.route('**/*',route)
        page.goto(f'{BASE}/__review?state={state}'); page.wait_for_function("document.documentElement.dataset.ready==='true'")
        body=page.locator('body').inner_text()
        check(f'{state} {width}: no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        if state=='open':
          check(f'open {width}: action','REVIEW + SET NEXT' in body)
          check(f'open {width}: no fake review','Published review' not in body)
        elif state=='review':
          check(f'review {width}: review shown','You held the pace without spending the last mile.' in body)
          check(f'review {width}: next absent','SET NEXT INSTRUCTION' in body)
        else:
          check(f'chain {width}: review shown','You held the pace without spending the last mile.' in body)
          check(f'chain {width}: next shown','Keep Saturday easy. No proving.' in body)
          check(f'chain {width}: internal wording hidden','Internal review wording.' not in body and 'Internal next wording.' not in body)
        if width==390: page.screenshot(path=str(OUT/f'{ENGINE}-{state}-390.png'),full_page=True)
        check(f'{state} {width}: no JS errors',not errors)
        ctx.close()
    browser.close(); report['result']='PASS'
except Exception as e:
  report['result']='FAIL';report['failure']=str(e);raise
finally:
  (OUT/f'{ENGINE}.json').write_text(json.dumps(report,indent=2)+'\n');print(report.get('result'),len(report['checks']),ENGINE)
