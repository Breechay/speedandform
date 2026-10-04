"""Render the study editorial share card with the same public typography."""
import pathlib,mimetypes
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2]
with sync_playwright() as p:
  b=p.chromium.launch()
  page=b.new_page(viewport={"width":1200,"height":630},device_scale_factor=1)
  def route(r):
    if not r.request.url.startswith("https://speedandform.com"): return r.continue_()
    f=root/urlsplit(r.request.url).path.lstrip("/")
    return r.fulfill(status=200,content_type=mimetypes.guess_type(str(f))[0] or "text/plain",body=f.read_bytes()) if f.is_file() else r.fulfill(status=404,body="")
  page.route("**/*",route)
  page.set_content("""<html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f3eee2;color:#191914;padding:46px 66px;font-family:Archivo,Arial,sans-serif}header{display:flex;align-items:center;justify-content:space-between;font:13px 'Space Mono',monospace;letter-spacing:2px}header img{width:58px;height:52px}h1{font-size:112px;line-height:.86;letter-spacing:-7px;font-weight:800;font-stretch:85%;margin:46px 0 26px}h1 span{display:block}p{font-size:24px;max-width:870px;line-height:1.35;margin:0}footer{margin-top:34px;padding-top:23px;border-top:1px solid #9e988b;display:flex;justify-content:space-between;font:14px 'Space Mono',monospace}b{color:#385366}em{color:#a33d2c;font-style:normal}</style></head><body><header><img src="https://speedandform.com/assets/brand/sf-seal.svg"><span>FORM LABS · A PAIRED COACHING STUDY</span></header><h1><span>Same pace.</span><span>Different problem.</span></h1><p>One runner races in November. The other has until May.<br>The target may look similar. The work should not.</p><footer><span><em>ELIJAH</em> · SAVANNAH · NOV 14</span><span><b>SIMON</b> · SAUMUR · MAY 16</span></footer></body></html>""",wait_until="networkidle")
  page.evaluate("document.fonts.ready")
  page.screenshot(path=str(root/'labs/same-pace-different-problem/og.png'))
  b.close()
