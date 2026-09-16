from pathlib import Path
from urllib.parse import urlsplit
import base64,mimetypes,re
ROOT=Path(__file__).resolve().parents[1]
def html_for_test(include_video=False):
    html=(ROOT/'index.html').read_text()
    html=re.sub(r'<link rel="stylesheet" href="(/[^\"]+)"[^>]*>',lambda m:'<style>'+ (ROOT/urlsplit(m[1]).path.lstrip('/')).read_text()+'</style>',html)
    html=re.sub(r'<script[^>]*src="(/[^\"]+)"[^>]*></script>',lambda m:'<script>'+ (ROOT/urlsplit(m[1]).path.lstrip('/')).read_text()+'</script>',html)
    def inline(m):
        prefix,path=m[1],m[2]; fp=ROOT/urlsplit(path).path.lstrip('/')
        if not fp.is_file():return m[0]
        if fp.suffix=='.mp4' and not include_video:return m[0]
        typ=mimetypes.guess_type(fp)[0] or 'application/octet-stream'
        return prefix+'data:'+typ+';base64,'+base64.b64encode(fp.read_bytes()).decode()+'"'
    html=re.sub(r'((?:data-src|src|poster)=")(/[^\"]+)"',inline,html)
    html=html.replace('loading="lazy"','loading="eager"')
    # No analytics or uncontrolled requests: about:blank is not a production host.
    return html
