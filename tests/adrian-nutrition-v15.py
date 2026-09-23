import http.server, threading, json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent.parent; out=Path(sys.argv[2]) if len(sys.argv)>2 else Path('/tmp/adrian-nutrition-v15'); out.mkdir(exist_ok=True,parents=True)
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=str(root),**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/plans/adrian-nutrition-phase-01/'
res={}
with sync_playwright() as p:
    b=p.chromium.launch()
    for w in [375,390,430,768,1024,1440]:
        pg=b.new_page(viewport={'width':w,'height':900},reduced_motion='reduce'); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(url,wait_until='domcontentloaded'); pg.wait_for_timeout(200)
        assert pg.locator('h1').inner_text()=='Fuel Your Work'
        closed=pg.evaluate('document.documentElement.scrollHeight')
        assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {w}'
        pg.evaluate('document.querySelectorAll("details").forEach(d=>d.open=true)')
        opened=pg.evaluate('document.documentElement.scrollHeight')
        assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'open overflow {w}'
        if w in (390,1440):
            pg.evaluate('document.querySelectorAll("details").forEach(d=>d.open=false);scrollTo(0,0)')
            pg.screenshot(path=str(out/f'closed-{w}.png'),full_page=True)
            pg.evaluate('document.querySelectorAll("details").forEach(d=>d.open=true)')
            pg.screenshot(path=str(out/f'open-{w}.png'),full_page=True)
        assert not errs,errs
        res[w]={'closed_px':closed,'open_px':opened}
        pg.close()
    # tabs + keyboard
    pg=b.new_page(viewport={'width':390,'height':900}); pg.goto(url)
    pg.click('#tab-sat'); assert pg.locator('#day-sat').is_visible() and not pg.locator('#day-work').is_visible()
    pg.focus('#tab-sat'); pg.keyboard.press('ArrowRight'); assert pg.locator('#day-sun').is_visible()
    # hash links open disclosures
    for h in ['prep-cycle','kit','sources','powder','sleep','shopping','recipe-base']:
        pg.goto(url+'#'+h); pg.wait_for_timeout(100)
        assert pg.evaluate(f'''(()=>{{let e=document.getElementById("{h}");while(e){{if(e.tagName==="DETAILS"&&!e.open)return false;e=e.parentElement}}return true}})()'''),h
    # shopping ticks persist
    pg.goto(url+'#shopping'); pg.click('label:has(input[data-shop-key="bread"])'); pg.reload(); pg.goto(url+'#shopping')
    assert pg.locator('input[data-shop-key="bread"]').is_checked()
    assert '1 of 20' in pg.locator('#shop-status').inner_text()
    pg.click('#shop-clear'); assert not pg.locator('input[data-shop-key="bread"]').is_checked()
    # every in-page anchor resolves
    ids=pg.evaluate('[...document.querySelectorAll("a[href^=\'#\']")].map(a=>a.getAttribute("href").slice(1)).filter(i=>!document.getElementById(i))')
    assert not ids, ids
    txt=pg.evaluate('document.body.innerText')
    b.close()
srv.shutdown()
html=(root/'plans/adrian-nutrition-phase-01/index.html').read_text()
body_text=re.sub(r'<(style|script)[\s\S]*?</\1>','',html); body_text=re.sub(r'<[^>]+>',' ',body_text)
res['words']=len(body_text.split())
res['em_dash']=body_text.count('\u2014')
for must in ['160°F','165°F','within 2 hours','1 to 2 days','lot number','dark urine','Drink to thirst']:
    assert must in body_text, must
res['not_a_constructions']=len(re.findall(r"\bnot (a|an|the|evidence|claims?|permission|proof)\b",body_text,re.I))
print(json.dumps(res,indent=1))
