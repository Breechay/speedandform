"""One-use, branch-only refinement. Removed before release."""
from pathlib import Path
import json,re
r=Path.cwd()
p=r/'track/albums.json';a=json.loads(p.read_text());album=a['albums'][0];album.pop('downloadNote',None)
film=next(m for m in album['media'] if m['type']=='video');film.pop('posterSource',None);film['posterTime']=6.3;film['alt']='Two runners moving along the road, filmed from the side.'
p.write_text(json.dumps(a,indent=2,ensure_ascii=False)+'\n')
p=r/'scripts/build-track-gallery.cjs';s=p.read_text().replace("VERSION='20260917-p3'","VERSION='20260917-p3b'")
s=s.replace("${m.type==='video'?'<p class=\"track-video-note\">Silent film. Play to watch.</p>':''}",'').replace('<span class="track-meta">No signup needed.</span>','').replace('${esc(a.note)} ${esc(a.downloadNote)}','${esc(a.note)}');p.write_text(s)
p=r/'js/track-gallery.js';s=p.read_text().replace("item.alt+(item.type==='video'?' Silent film.':'')",'item.alt');p.write_text(s)
p=r/'css/track-gallery.css';s=p.read_text();s=re.sub(r'\.track-frame\[data-media="video"\] \.track-video-note\{[^}]+\}','',s);s=re.sub(r'\.track-video-note\{[^}]+\}','',s)
s=s.replace('grid-template-columns:1fr 2fr;gap:24px}.track-frame[data-media="video"]','grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:40px}.track-frame[data-media="video"]')
s+='\n/* A film poster keeps its complete frame. No cropped heads or feet. */\n.track-frame[data-media="video"] .track-frame-link img{height:auto;max-height:none;object-fit:contain}\n';p.write_text(s)
p=r/'scripts/prepare-track-media.py';s=p.read_text().replace('import hashlib, json, subprocess, zipfile, io, re, shutil','import hashlib, json, subprocess, zipfile, io, re, shutil, math').replace('Requires Pillow and ffprobe.','Requires Pillow, ffmpeg and ffprobe.')
insert='''
def video_probe(src):
    return json.loads(subprocess.check_output([
        'ffprobe','-v','error','-show_entries',
        'format=duration:stream=codec_type,width,height','-of','json',str(src)
    ],text=True))

def poster_image(src,item,probe):
    """Choose an exact film time OR a checksum-verified custom image, never a silent fallback."""
    timestamp=item.get('posterTime');custom=item.get('posterSource')
    if (timestamp is not None)==bool(custom):
        raise ValueError('Choose exactly one of posterTime or posterSource')
    if custom:
        file=source_file(custom)
        if digest(file.read_bytes())!=item.get('posterSha256'):
            raise ValueError('Custom poster needs its reviewed posterSha256')
        return ImageOps.exif_transpose(Image.open(file)).convert('RGB')
    duration=float(probe['format']['duration'])
    if type(timestamp) not in (int,float) or not math.isfinite(timestamp) or not 0<=timestamp<duration:
        raise ValueError('posterTime must be a finite second within this film')
    data=subprocess.check_output([
        'ffmpeg','-v','error','-ss',format(timestamp,'.6f'),'-i',str(src),
        '-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'
    ])
    return Image.open(io.BytesIO(data)).convert('RGB')
'''
s=s.replace('\ndef build():',insert+'\ndef build():')
s=s.replace("['slug','title','kind','date','description','note','downloadNote','cover']","['slug','title','kind','date','description','note','cover']")
s=s.replace("src=source_file(m['source']); poster=source_file(m['posterSource']) if m['type']=='video' else src\n            image=Image.open(poster);image=ImageOps.exif_transpose(image).convert('RGB')","src=source_file(m['source'])\n            probe=video_probe(src) if m['type']=='video' else None\n            image=poster_image(src,m,probe) if probe else ImageOps.exif_transpose(Image.open(src)).convert('RGB')")
s=s.replace("                probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',str(src)],text=True))\n","                item['posterSelection']={k:m[k] for k in ('posterTime','posterSource','posterSha256') if k in m}\n")
p.write_text(s)
p=r/'tests/discovery-browser.py';s=p.read_text().replace('checks=[]','catalog_urls=json.loads(subprocess.check_output([\'node\',\'-e\',\'console.log(JSON.stringify(require("./scripts/discovery-catalog.cjs").entries.map(e=>e.url)))\'],cwd=ROOT,text=True))\nchecks=[]')
s=s.replace("p.locator('.discovery-link').count()==46","sorted(p.locator('.discovery-link').evaluate_all('(links)=>links.map(a=>a.getAttribute(\"href\"))'))==sorted(catalog_urls)");p.write_text(s)
p=r/'tests/track-gallery.cjs';s=p.read_text().replace("assert.ok(h.includes('Silent film'));","assert.deepEqual(item.posterSelection,Object.fromEntries(['posterTime','posterSource','posterSha256'].filter(k=>k in selected).map(k=>[k,selected[k]])));")
s=s.replace("assert.equal((h.match(/<h1\\b/g)||[]).length,1);","assert.ok(!/No signup needed|Downloads are web editions|Silent film\\. Play to watch|undefined/.test(h),'Removed UI copy stays removed');\n assert.equal((h.match(/<h1\\b/g)||[]).length,1);");p.write_text(s)
p=r/'tests/track-gallery-browser.py';s=p.read_text()
s=s.replace('if width in [390,1440]:page.screenshot',"check(f'{name}: no unnecessary instructions at {width}',not any(t in page.locator('body').inner_text() for t in ['No signup needed.','Downloads are web editions','Silent film. Play to watch.']))\n            if width in [390,1440]:page.screenshot")
s=s.replace("if width in [390,1440]:\n            page.locator('[data-frame]')","if width in [390,1440]:\n            film=page.locator('[data-media=video]')\n            film.scroll_into_view_if_needed();film.locator('img').evaluate('(i)=>i.decode()')\n            check(f'Film poster preserves full frame at {width}',film.locator('img').evaluate('(i)=>Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)<0.01'))\n            film.screenshot(path=str(OUT/f'film-{width}.png'))\n            page.locator('[data-frame]')")
s=s.replace("check('Film has controls and does not autoplay',","check('Player uses selected thumbnail',page.locator('video').get_attribute('poster')==next(x['preview']['url'] for x in album['media'] if x['type']=='video'))\n    check('Film has controls and does not autoplay',");p.write_text(s)
