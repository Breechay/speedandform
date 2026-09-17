"""Staged email-flow review. Local PostgreSQL, provider stubs; no real email or live signup."""
from pathlib import Path
import os, json, re
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('NEWSLETTER_ARTIFACTS','/tmp/newsletter-receipt'));OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:4179';report={'checks':[],'realEmailDelivery':False,'production':False}
def check(name,value):
 assert value,name
 report['checks'].append(name)
proof="""window.turnstile={render:(el,c)=>{window.__turnstile=c;document.querySelector(el).textContent='Security check · test fixture';c.callback('fixture-proof');return 'fixture';},reset:()=>{window.__turnstile.callback('fresh-fixture-proof')}};"""
try:
 with sync_playwright() as pw:
  for engine in ['chromium','webkit']:
   browser=getattr(pw,engine).launch();ctx=browser.new_context(reduced_motion='reduce');page=ctx.new_page();errors=[];traffic=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   def route(r):
    if r.request.url.startswith('https://challenges.cloudflare.com/turnstile/v0/api.js'):r.fulfill(status=200,content_type='application/javascript',body=proof)
    elif r.request.url.startswith(BASE+'/'):traffic.append(r.request);r.continue_()
    else:r.abort()
   ctx.route('**/*',route)
   for w in [375,390,430,768,1024,1440]:
    ctx.request.post(BASE+'/__fixture/reset');page.set_viewport_size({'width':w,'height':950});page.goto(BASE+'/updates/');page.locator('#signup').wait_for(state='visible');page.wait_for_function('!!window.__turnstile')
    check(f'{engine} {w}: form available only after ready',page.locator('#unavailable').is_hidden())
    check(f'{engine} {w}: unselected consent',not page.locator('#consent').is_checked())
    check(f'{engine} {w}: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    check(f'{engine} {w}: readable email field',page.locator('#email').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)>=16'))
    if w in [390,1440]:page.screenshot(path=str(OUT/f'signup-{engine}-{w}.png'),full_page=True)
   page.set_viewport_size({'width':390,'height':950});page.goto(BASE+'/updates/');page.wait_for_function('!!window.__turnstile');page.locator('#submit').click()
   check(engine+': invalid email recovers focus',page.locator('#email').evaluate('e=>document.activeElement===e'))
   page.locator('#email').fill('reader+browser@resend.dev');page.locator('#submit').click();check(engine+': explicit consent required',page.locator('#consent').evaluate('e=>document.activeElement===e'))
   page.locator('#consent').check();page.locator('#submit').click();page.locator('#result').wait_for(state='visible');check(engine+': pending not subscribed',page.locator('#result-title').inner_text()=='Check your inbox.' and 'only subscribed after confirming' in page.locator('#result-copy').inner_text())
   messages=ctx.request.get(BASE+'/__fixture/mail').json();check(engine+': exactly one staged message',len(messages)==1)
   message=messages[0]['payload'];confirm=re.search(r'#confirm=([A-Za-z0-9_-]{43})',message['text']).group(1);unsubscribe=re.search(r'#unsubscribe=([A-Za-z0-9_-]{43})',message['text']).group(1)
   sent_before=len([r for r in traffic if r.method=='POST']);page.goto(BASE+'/updates/#confirm='+confirm)
   check(engine+': confirmation not automatic',len([r for r in traffic if r.method=='POST'])==sent_before and page.locator('#token-button').inner_text()=='Confirm my email')
   check(engine+': private token removed from address bar',page.url==BASE+'/updates/')
   check(engine+': no storage',page.evaluate('localStorage.length===0&&sessionStorage.length===0'))
   page.screenshot(path=str(OUT/f'confirm-{engine}-390.png'),full_page=True)
   page.locator('#token-button').click();page.locator('#result').wait_for(state='visible');check(engine+': confirmed state from server',page.locator('#result-title').inner_text()=='You’re on the list.')
   page.goto(BASE+'/updates/#unsubscribe='+unsubscribe);check(engine+': opt-out requires one explicit page action',page.locator('#token-button').inner_text()=='Unsubscribe');page.locator('#token-button').click();page.locator('#result').wait_for(state='visible');check(engine+': unsubscribed state',page.locator('#result-title').inner_text()=='You’re unsubscribed.')
   page.screenshot(path=str(OUT/f'unsubscribed-{engine}-390.png'),full_page=True)
   page.goto(BASE+'/updates/#confirm='+confirm);page.locator('#token-button').click();page.locator('#new-link').wait_for(state='visible');check(engine+': old confirmation cannot rejoin',page.locator('#result').is_hidden())
   page.goto(BASE+'/updates/#confirm=invalid');check(engine+': malformed token has recovery',page.locator('#token-button').is_hidden() and page.locator('#new-link').is_visible())
   page.route('**/api/status',lambda r:r.fulfill(status=200,content_type='application/json',body='{"ready":false}'));page.goto(BASE+'/updates/');check(engine+': disabled endpoint never presents signup',page.locator('#signup').is_hidden());page.locator('#retry-status').wait_for(state='visible');page.unroute('**/api/status');page.locator('#retry-status').click();page.locator('#signup').wait_for(state='visible')
   check(engine+': readiness retry recovers',page.locator('#unavailable').is_hidden())
   # A blocked CAPTCHA service must not produce a dead form with no recovery.
   page.route('**/turnstile/v0/api.js?render=explicit',lambda r:r.abort());page.goto(BASE+'/updates/');page.locator('#retry-status').wait_for(state='visible');check(engine+': security-load failure has visible retry',page.locator('#retry-status').is_visible());page.unroute('**/turnstile/v0/api.js?render=explicit');page.locator('#retry-status').click();page.wait_for_function('!!window.__turnstile')
   page.route('**/api/subscribe',lambda r:r.fulfill(status=503,content_type='application/json',body='{"code":"email_unavailable"}'));page.locator('#email').fill('retry@resend.dev');page.locator('#consent').check();page.locator('#submit').click();page.wait_for_function("document.querySelector('#form-status').textContent.includes('could not')");check(engine+': provider error retains field and never claims success',page.locator('#email').input_value()=='retry@resend.dev' and page.locator('#result').is_hidden());page.unroute('**/api/subscribe')
   page.goto(BASE+'/updates/');page.keyboard.press('Tab');check(engine+': first focus skip link',page.evaluate("document.activeElement.className==='nl-skip'"));page.keyboard.press('Enter');check(engine+': skip reaches main',page.evaluate("document.activeElement.id==='main'"))
   page.evaluate("document.querySelectorAll('h1,h2,p,a,label,button').forEach(e=>e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*2)+'px')")
   check(engine+': enlarged text reflows',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   check(engine+': no script errors',not errors)
   mail=ctx.new_page();mail.set_viewport_size({'width':390,'height':900});mail.set_content(message['html']);check(engine+': confirmation email fits phone',mail.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));mail.screenshot(path=str(OUT/f'email-{engine}-390.png'),full_page=True)
   nojs=browser.new_context(java_script_enabled=False);p=nojs.new_page();p.goto(BASE+'/updates/');check(engine+': no-JavaScript honest fallback',p.locator('#signup').is_hidden() and 'Nothing has been submitted' in p.locator('noscript').inner_text());nojs.close();browser.close()
 report['result']='PASS'
except Exception as e:report['result']='FAIL';report['error']=str(e);raise
finally:(OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n');print(report.get('result'),len(report['checks']),'staged browser checks')
