"""Thumbnail choices, without modifying albums or publishing."""
import importlib.util,json,math
from pathlib import Path
spec=importlib.util.spec_from_file_location('prepare_track',Path(__file__).resolve().parents[1]/'scripts/prepare-track-media.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
a=json.loads(p.MANIFEST.read_text())['albums'][0]
m=next(x for x in a['media'] if x['type']=='video');src=p.source_file(m['source']);probe=p.video_probe(src)
for bad in [-1,math.nan,math.inf,True,float(probe['format']['duration'])+1,'6.3']:
    try:p.poster_image(src,{'posterTime':bad},probe)
    except ValueError:pass
    else:raise AssertionError(f'Invalid time accepted: {bad}')
for bad in [{},{'posterTime':6.3,'posterSource':'media/run-development.jpg'},{'posterSource':'media/run-development.jpg','posterSha256':'wrong'}]:
    try:p.poster_image(src,bad,probe)
    except ValueError:pass
    else:raise AssertionError('Ambiguous or unverified poster accepted')
im=p.poster_image(src,m,probe)
assert im.size==(1080,1920)
custom={'posterSource':'media/run-development.jpg','posterSha256':p.digest((p.ROOT/'media/run-development.jpg').read_bytes())}
assert p.poster_image(src,custom,probe).width>0
print('PASS: chosen film frame, 9 invalid/missing/ambiguous selections, and checksum-verified custom thumbnail.')
