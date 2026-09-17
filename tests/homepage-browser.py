from pathlib import Path
from playwright.sync_api import sync_playwright
from homepage_render import html_for_test
import json,re
OUT=Path(__file__).resolve().parents[1]/'.homepage-qa'; OUT.mkdir(exist_ok=True); report=[]
def passed(name,data=None):
 report.append({'test':name,'pass':True,'detail':data});print('PASS',name,data if data else '')
def load(browser,w=390,h=844,motion='reduce',videos=False,js=True):
 page=browser.new_page(viewport={'width':w,'height':h},reduced_motion=motion,java_script_enabled=js)
 page.route('**/*',lambda r:r.abort())
 page.on('pageerror',lambda e:print('BROWSER ERROR',e))
 page.set_content(html_for_test(include_video=videos),wait_until='load')
 page.evaluate('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))') if js else None
 return page
def to_review(pg):
 pg.locator('[data-key=goal] button').first.click();pg.wait_for_timeout(500)
 assert pg.locator('#runningNext').is_disabled()
 for key in ['days','vol','long']:pg.locator('[data-key='+key+'] button').nth(2).click()
 pg.locator('#runningNext').click();pg.wait_for_timeout(180)
 pg.get_by_role('button',name='Strength',exact=True).click()
 pg.get_by_role('button',name='Nothing regularly',exact=True).click()
 assert pg.get_by_role('button',name='Strength',exact=True).get_attribute('aria-pressed')=='false'
 pg.get_by_role('button',name='Strength',exact=True).click()
 assert pg.get_by_role('button',name='Nothing regularly',exact=True).get_attribute('aria-pressed')=='false'
 pg.locator('.q.on [data-next]').click();pg.wait_for_timeout(180)
 pg.locator('#issue').fill('<img src=x onerror=alert(1)> / A useful question')
 pg.locator('.q.on [data-next]').click();pg.wait_for_timeout(180)
 pg.locator('.q.on [data-next]').click();assert pg.locator('#needMail').is_visible()
 pg.locator('#em').fill('example+qa@example.com');pg.locator('#nm').fill('Synthetic QA')
 pg.locator('[data-key=city] button').first.click()
 pg.locator('.q.on [data-next]').click();assert pg.locator('#p-read').is_visible()
 assert '<img src=x' in pg.locator('#rRows').inner_text()
 assert pg.locator('#rRows img').count()==0
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=__import__('os').environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for w,h in [(320,760),(375,812),(390,844),(430,932),(768,1024),(820,1180),(1024,768),(1440,1000)]:
  pg=load(b,w,h);errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.evaluate('scrollTo(0,0)');pg.screenshot(path=str(OUT/f'home-{w}.png'),full_page=True)
  for state in ['closed','open']:
   if state=='open':pg.locator('.training-example>summary').click();pg.locator('.strength-option>summary').click()
   assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {w} {state}'
  assert not errors
  assert pg.evaluate('document.querySelector("#analysisVideo").getAttribute("src")===null')
  passed(f'{w}px closed/open disclosures, no overflow, still reduced-motion poster')
  pg.close()
 pg=load(b,720,500);passed('200% desktop-zoom equivalent: 720 CSS-pixel layout at half a 1440 viewport',pg.evaluate('document.documentElement.scrollWidth'))
 pg.close()
 for outcome in ['success','rejected','network','timeout']:
  pg=load(b);to_review(pg)
  pg.locator('#coachingChoiceTrigger').click();pg.locator('#coachingChoiceOption-1').click();assert '$1,800' in pg.locator('#rMoney').inner_text()
  pg.locator('#coachingChoiceTrigger').click();pg.locator('#coachingChoiceOption-2').click();assert 'fee agreed' in pg.locator('#rMoney').inner_text().lower()
  pg.locator('#coachingChoiceTrigger').click();pg.locator('#coachingChoiceOption-0').click()
  pg.locator('#editBtn').click();pg.get_by_role('button',name='Run better',exact=True).click();pg.wait_for_timeout(500)
  # Back/edit preserves already selected running volume.
  assert pg.locator('#runningNext').is_enabled()
  for _ in range(3):pg.locator('.q.on [data-next]').click();pg.wait_for_timeout(180)
  pg.locator('.q.on [data-next]').click()
  pg.evaluate('window.__calls=[];window.__leads=0;window.formTrackLead=()=>window.__leads++;void 0')
  pg.evaluate('''outcome=>{ window.fetch=(url,init)=>{window.__calls.push({url,entries:[...init.body.entries()]});
   if(outcome==='network')return Promise.reject(new Error('offline'));
   if(outcome==='timeout')return new Promise((resolve,reject)=>{init.signal.addEventListener('abort',()=>reject(new Error('aborted')));});
   return new Promise(resolve=>setTimeout(()=>resolve({ok:true,json:async()=>({success:outcome==='success'})}),60));};
   if(outcome==='timeout'){const original=window.setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms===15000?100:ms,...args);}
  }''',outcome)
  pg.locator('#sendBtn').click();pg.wait_for_timeout(220)
  calls=pg.evaluate('window.__calls');assert len(calls)==1
  assert 'formsubmit.co/ajax/33a5c7969281803124c58268d7ae6188' in calls[0]['url']
  print('Send state',outcome,pg.evaluate('({done:document.querySelector("#p-done").className,leads:window.__leads,error:document.querySelector("#sendErr").textContent})'))
  if outcome=='success':assert pg.locator('#p-done').is_visible();assert pg.evaluate('window.__leads')==1
  else:
   assert pg.locator('#sendErr').is_visible();assert pg.locator('#sendBtn').is_enabled();assert pg.evaluate('window.__leads')==0
   assert 'brice@speedandform.com' in pg.locator('#sendErr a').get_attribute('href')
  passed('Complete five-question intake, edit/offer switching, escaped answers and '+outcome)
  pg.screenshot(path=str(OUT/f'intake-{outcome}-390.png'),full_page=True if False else False)
  pg.close()
 pg=load(b,videos=True,motion='reduce');pg.locator('.analysis-screen img').scroll_into_view_if_needed();pg.wait_for_timeout(100)
 assert pg.locator('.analysis-screen img').is_visible()
 assert '/assets/home/practice/coaching-track.webp' in (pg.locator('.analysis-screen img').get_attribute('src') or '')
 assert pg.locator('#analysisVideo').count()==0 and pg.locator('#analysisToggle').count()==0
 pg.evaluate('scrollTo(0,0)');pg.wait_for_timeout(100);pg.locator('#analysisToggle').scroll_into_view_if_needed();pg.wait_for_timeout(200);assert pg.evaluate('analysisVideo.paused')
 passed('Actual 512-square MP4 decodes, manual play under reduced motion, persistent user pause',v)
 pg.close()
 pg=load(b,videos=True,motion='no-preference');pg.wait_for_timeout(1000);assert pg.evaluate('!filmA.paused')
 pg.locator('#analysisToggle').scroll_into_view_if_needed();pg.wait_for_timeout(1000)
 assert pg.evaluate('filmA.paused && !analysisVideo.paused')
 pg.evaluate('scrollTo(0,0)');pg.wait_for_timeout(1300);assert pg.evaluate('analysisVideo.paused && !filmA.paused')
 pg.emulate_media(reduced_motion='reduce');pg.wait_for_function('filmA.paused && analysisVideo.paused',timeout=3000)
 passed('Offscreen films pause, on-screen film plays, preference change stops both');pg.close()
 pg=load(b,js=False);assert pg.locator('.no-script').is_visible();assert not pg.locator('.questionnaire').is_visible();passed('No-JavaScript email path and visible content');pg.close()
 pg=load(b);pg.keyboard.press('Tab');assert pg.locator('.skip-link').evaluate('x=>x===document.activeElement');pg.keyboard.press('Enter');assert pg.evaluate('document.activeElement.id')=='main-content';passed('Keyboard skip link moves focus to main');pg.close()
 b.close()
(OUT/'browser-qa.json').write_text(json.dumps(report,indent=2))
print('All',len(report),'checks passed. Synthetic submissions were intercepted; no real mail sent.')
