"""Capture the product share card from HTML and existing approved anatomy. Not athlete imagery."""
from pathlib import Path
import base64,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
def data(f,mime):return 'data:'+mime+';base64,'+base64.b64encode((ROOT/f).read_bytes()).decode()
font=data('assets/forge/fonts/jost-latin-500-normal.woff2','font/woff2')
anatomy=data('assets/forge/hero-light.webp','image/webp')
h='''<!doctype html><html lang="en"><meta charset="utf-8"><style>
@font-face{font-family:Sculpt;src:url(FONT);font-weight:500}*{box-sizing:border-box}body{margin:0;background:#090908;color:#f0ece3;width:1200px;height:630px;display:grid;grid-template-columns:750px 450px;font:500 20px Sculpt,Arial,sans-serif}.copy{padding:56px 60px;display:flex;flex-direction:column}.mark{font-size:22px;letter-spacing:.14em}.mark span{font-size:13px;letter-spacing:.1em;color:#b7b1a5;margin-left:15px}h1{font-weight:500;font-size:95px;letter-spacing:-.04em;line-height:1.06;margin:74px 0 28px}h1 em{font-family:Georgia,serif;font-weight:400}p{margin:0;color:#b7b1a5;font-size:25px}footer{margin-top:auto;font-size:15px;color:#b7b1a5;letter-spacing:.05em}.anatomy{margin:32px 32px 32px 0;background:#efebe2;display:flex;align-items:center;justify-content:center;position:relative}.anatomy img{width:100%;height:100%;object-fit:contain;padding:30px}.anatomy:before{content:"01";position:absolute;top:35px;left:22px;font:280px Georgia,serif;color:#e1dbce;z-index:0}.anatomy img{z-index:1}
</style><body><div class="copy"><div class="mark">BREECHAY<span>SCULPT</span></div><h1>Train with<br><em>intention.</em></h1><p>Twelve phases. One designed year.</p><footer>BY BRICE IKOUEBE · SPEED &amp; FORM</footer></div><div class="anatomy"><img src="ANATOMY" alt="Anatomy illustration"></div></body></html>'''.replace('FONT',font).replace('ANATOMY',anatomy)
with sync_playwright() as p:
 opts={'headless':True}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);page=b.new_page(viewport={'width':1200,'height':630},device_scale_factor=1)
 page.route('**/*',lambda r:r.abort());page.set_content(h,wait_until='load');page.evaluate('document.fonts.ready');page.locator('img').evaluate('(i)=>i.decode()')
 out=ROOT/'assets/forge/og-sculpt-20260917.jpg';page.screenshot(path=str(out),type='jpeg',quality=86)
 b.close();print(out.relative_to(ROOT))
