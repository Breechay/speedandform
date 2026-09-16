"""Offline Chromium regression checks for the opt-in cream reading surfaces.
No navigation, analytics, API writes or real submissions. CSS is inlined exactly
from disk. Search uses the checked-in index; remote data is an empty fixture.
This is responsive browser emulation, not physical iOS/Safari device testing.
"""
from pathlib import Path
import importlib.util, json, os, re, subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('migration',ROOT/'scripts/migrate-cream-reading.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
OUT=ROOT/'.cream-qa';OUT.mkdir(exist_ok=True)
CSS=(ROOT/'css/cream-reading.css').read_text()
REPORT=[]

def passed(name,detail=None):
 REPORT.append({'test':name,'pass':True,'detail':detail});print('PASS',name)

def normalize(html):
 html=re.sub(r'<style\b[^>]*>[\s\S]*?</style>','',html,flags=re.I)
 html=re.sub(r'<link\b[^>]*(?:fonts\.googleapis\.com|cream-reading\.css)[^>]*>','',html,flags=re.I)
 html=re.sub(r'\sdata-cream="[^"]+"','',html)
 html=re.sub(r'\bstyle\s*=\s*(["\'])[\s\S]*?\1','style=""',html)
 return re.sub(r'\s+',' ',html).strip()

# Compare only opted-in files, never regenerate pages outside this manifest.
BASE=os.environ.get('CREAM_BASE','HEAD')
for name in m.FILES:
 text=(ROOT/name).read_text()
 assert m.LINK in text and 'data-cream=' in text,name
 assert m.migrate(text,name)==text,'not idempotent: '+name
 old=subprocess.check_output(['git','show',f'{BASE}:{name}'],cwd=ROOT,text=True)
 assert normalize(m.fix_search_keywords(old) if name=='search.html' else old)==normalize(text),'content/script/URL changed: '+name
passed('82 pages: content/actions/metadata/URLs preserved; only documented search parsing changes; migration idempotent')
links=re.findall(r'href="(/[^"#?]+)',(ROOT/'library.html').read_text().split('<body>')[1])
for link in links:
 if link=='/':continue
 rel=link.strip('/')+'.html'
 assert rel in m.FILES, 'Library child missing from manifest: '+rel
passed('Every Library destination consumes the shared stylesheet')

GEOMETRY='''()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
 tiny:[...document.body.querySelectorAll('*')].filter(e=>{
 const s=getComputedStyle(e),r=e.getBoundingClientRect();
 return r.width&&r.height&&s.visibility!=='hidden'&&!e.closest('script,style,svg')&&
 [...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(s.fontSize)<12;
 }).map(e=>({text:e.textContent.trim().slice(0,50),size:getComputedStyle(e).fontSize}))})'''

CONTRAST='''()=>{
 const failures=[];const rgb=v=>(v.match(/[\\d.]+/g)||[]).map(Number);
 const mix=(a,b)=>{const t=a.length>3?a[3]:1;return a.slice(0,3).map((v,i)=>v*t+b[i]*(1-t));};
 const lum=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 function bg(e){if(!e)return [255,255,255];let c=rgb(getComputedStyle(e).backgroundColor);return c.length===3||c[3]===1?c:mix(c,bg(e.parentElement));}
 for(const e of document.body.querySelectorAll('*')){
 if(e.closest('script,style,svg,.drawer,.toast,.pin-overlay,.modal-overlay'))continue;
 const s=getComputedStyle(e),r=e.getBoundingClientRect();if(!r.width||!r.height||s.visibility==='hidden')continue;
 let opacity=1;for(let t=e;t;t=t.parentElement)opacity*=Number(getComputedStyle(t).opacity);if(opacity<.01)continue;
 if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
 let back=bg(e),col=rgb(s.color);col[3]=(col.length>3?col[3]:1)*opacity;
 let a=lum(mix(col,back)),b=lum(back),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 const large=parseFloat(s.fontSize)>=24||(parseInt(s.fontWeight)>=700&&parseFloat(s.fontSize)>=18.66);
 if(ratio<(large?3:4.5)-.01)failures.push({cls:e.className,text:e.textContent.trim().slice(0,70),ratio});
 }
 return failures;
}'''

def html_for_test(name):
 html=(ROOT/name).read_text().replace(m.LINK,'<style>'+CSS+'</style>')
 fixture=json.dumps(json.loads((ROOT/'search-index.json').read_text())).replace('</','<\\/')
 shim='<script>history.replaceState=()=>{};window.__writes=[];window.fetch=async(url,options={})=>{if(options.method&&!/^(GET|HEAD)$/i.test(options.method)){window.__writes.push(String(url));throw new Error("Writes blocked by QA");}return {ok:true,json:async()=>String(url)==="/search-index.json"?'+fixture+':[]};};</script>'
 return html.replace('<head>','<head>'+shim,1)

def load(b,name,w=390,h=844,context=None,**extra):
 pg=context.new_page() if context else b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce',**extra)
 pg.route('**/*',lambda route:route.abort())
 pg.set_content(html_for_test(name),wait_until='load')
 return pg

def geometry(pg,label):
 g=pg.evaluate(GEOMETRY)
 assert g['scroll']<=g['width'],f'{label}: horizontal overflow {g}'
 assert not g['tiny'],f'{label}: tiny HTML text {g["tiny"]}'
 return g

with sync_playwright() as p:
 opts={'args':['--no-sandbox']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 elif Path('/usr/bin/chromium').exists():opts['executable_path']='/usr/bin/chromium'
 b=p.chromium.launch(**opts)
 for width in [int(w) for w in os.environ.get("CREAM_WIDTHS","320,375,390,430,768,1024,1440").split(",")]:
  context=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce')
  for name in m.FILES:
   pg=load(b,name,width,context=context);geometry(pg,f'{name} {width}px')
   if width==390:
    issues=pg.evaluate(CONTRAST);assert not issues,f'{name}: contrast {issues}'
   if width in [390,1440] and name in ['library.html','easy-run.html','practice.html','split-calculator.html','running-form-errors.html','plans/index.html']:
    pg.screenshot(path=str(OUT/(name.replace('/','-').replace('.html','')+f'-{width}.png')),full_page=True)
   pg.close()
  context.close()
  passed(f'All 82 pages at {width}px: no document overflow or HTML text below 12px')
 passed('Visible static HTML text: 4.5:1 normal / 3:1 large contrast, including ancestor opacity')
 for width in [375,390,768,1440]:
  pg=load(b,'split-calculator.html',width)
  pg.locator('#inpTime').fill('25:00')
  assert pg.locator('#results').is_visible(),'calculator result hidden'
  assert pg.locator('#watchKm').inner_text()=='5:00'
  assert pg.locator('#watchMile').inner_text()=='8:03'
  assert pg.locator('#watch400').inner_text()=='2:00'
  geometry(pg,'5K results '+str(width))
  pg.locator('#customTab').click();pg.locator('#inpDist').fill('8');pg.locator('#inpTime').fill('40:00')
  assert pg.locator('#watchKm').inner_text()=='5:00';geometry(pg,'custom results '+str(width))
  pg.locator('#inpTime').fill('bad');assert not pg.locator('#results').is_visible()
  passed(f'Calculator {width}px: 5K, custom distance, invalid-input state')
  pg.close()
 pg=load(b,'search.html');pg.locator('.search-input').fill('threshold');pg.wait_for_timeout(400)
 assert pg.locator('.result-title').count()>0;geometry(pg,'search results')
 pg.locator('.search-input').fill('no-such-training-reference-xyz');pg.wait_for_timeout(400);geometry(pg,'empty search')
 passed('Search: checked-in index returns results; empty results fit');pg.close()
 for width in [375,768,1440]:
  pg=load(b,'plan.html',width);pg.locator('.workout').first.click()
  assert 'open' in pg.locator('#drawer').get_attribute('class')
  assert '3 × 10 min' in pg.locator('#d-title').inner_text();geometry(pg,'open plan drawer')
  pg.locator('.drawer-close').click();assert 'open' not in pg.locator('#drawer').get_attribute('class')
  assert not pg.evaluate('window.__writes');pg.close()
 passed('Plan: open/read/close existing workout drawer at three widths; no data writes')
 pg=load(b,'strength-routine.html');pg.locator('.exercise').first.click();pg.locator('.exercise').first.click()
 assert 'done' in pg.locator('.exercise').first.get_attribute('class')
 assert pg.locator('.exercise').first.evaluate('e=>getComputedStyle(e).opacity')=='1'
 pg.locator('.round-reset').click();assert pg.locator('.exercise.done').count()==0
 geometry(pg,'routine reset');passed('Routine: active/done/reset states preserved and completed text stays readable');pg.close()
 pg=load(b,'training-interruptions.html');pg.locator('.zone-btn[data-zone="knee"]').click()
 assert 'knee' in pg.locator('#d-title').inner_text().lower();geometry(pg,'body map selected')
 pg.locator('#clear-btn').click();geometry(pg,'body map cleared');passed('Body map: select and clear without layout overflow');pg.close()
 pg=load(b,'library.html');pg.keyboard.press('Tab');assert pg.evaluate('document.activeElement.className')=='nav-home'
 assert pg.evaluate('getComputedStyle(document.activeElement).outlineStyle')!='none'
 pg.keyboard.press('Tab');assert pg.evaluate('document.activeElement.className')=='lib-entry'
 passed('Keyboard: visible focus and whole-row Library links');pg.close()
 pg=load(b,'library.html',720,500,device_scale_factor=2);geometry(pg,'200% desktop zoom equivalent');passed('Library: 720 CSS-pixel / 2x-scale desktop zoom equivalent');pg.close()
 pg=load(b,'library.html');pg.evaluate('document.documentElement.style.fontSize="200%"');geometry(pg,'200% Library text')
 passed('Library: 200% text enlargement');pg.close()
 b.close()
(OUT/'report.json').write_text(json.dumps(REPORT,indent=2))
print('All',len(REPORT),'groups passed. No live API mutations or real submissions.')
