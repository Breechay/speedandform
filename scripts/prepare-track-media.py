"""Prepare explicitly selected, owner-approved media. Never discover media by scanning folders.

Requires Pillow, ffmpeg and ffprobe. Outputs are versioned, metadata-free web editions;
existing media bytes are never changed. The build writes no remote data.
"""
from pathlib import Path
import hashlib, json, subprocess, zipfile, io, re, shutil, math
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'track/albums.json'
OUT = ROOT / 'media/track'

def source_file(value):
    if not isinstance(value, str) or not re.fullmatch(r'(?:assets|media)/[a-zA-Z0-9_./-]+', value):
        raise ValueError('Expected a reviewed local media path')
    p = (ROOT / value).resolve()
    if not p.is_relative_to(ROOT) or not p.is_file() or p.is_symlink():
        raise ValueError(f'Unsafe or absent source: {value}')
    return p

def digest(data): return hashlib.sha256(data).hexdigest()
def info(p):
    b=p.read_bytes()
    return {'url':'/'+str(p.relative_to(ROOT)), 'bytes':len(b), 'sha256':digest(b)}
def jpeg(im, size=None, quality=90):
    image=ImageOps.exif_transpose(im).convert('RGB')
    if size: image.thumbnail(size, Image.Resampling.LANCZOS)
    b=io.BytesIO();image.save(b,format='JPEG',quality=quality,optimize=True,progressive=True)
    return b.getvalue()
def write_image(p, im, size=None, quality=90):
    p.write_bytes(jpeg(im,size,quality)); result=info(p)
    with Image.open(p) as output:result.update({'width':output.width,'height':output.height})
    return result
def validate_album(a):
    assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',a['slug']), 'Invalid album slug'
    assert a.get('publicationBasis'), 'Publication authority is required'
    assert a.get('kind') in ['selection','session'], 'Selection or dated session required'
    if a['kind']=='session':
        from datetime import date
        assert a.get('date') and date.fromisoformat(a['date']).isoformat()==a['date'], 'A session needs its actual date'
    else: assert a.get('date') is None, 'Undated selections must not manufacture dates'
    assert 0 < len(a['media']) <= 500, 'Empty or excessive album'
    ids=[m['id'] for m in a['media']]
    assert len(ids)==len(set(ids)) and a['cover'] in ids
    for m in a['media']:
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',m['id'])
        assert m.get('alt') and m.get('title') and m.get('sourcePage')
        assert m['type'] in ['photo','video']
        p=source_file(m['source'])
        assert digest(p.read_bytes())==m.get('sourceSha256'), f'Source changed: {p}'

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

def build():
    config=json.loads(MANIFEST.read_text()); assert config['version']==1
    previous=json.loads((ROOT/'track/media-manifest.json').read_text()) if (ROOT/'track/media-manifest.json').exists() else {'albums':[]}
    published=[a for a in config['albums'] if a.get('published') is True]
    assert len({a['slug'] for a in config['albums']})==len(config['albums']), 'Duplicate album slug'
    result={'version':1, 'albums':[]}
    for a in published:
        validate_album(a)
        # A version changes with selected source, captions or removal; never overwrite an immutable URL.
        rev=digest(json.dumps(a,sort_keys=True,ensure_ascii=False).encode())[:12]
        folder=OUT/a['slug']/rev;folder.mkdir(parents=True,exist_ok=True)
        album={k:a[k] for k in ['slug','title','kind','date','description','note','cover']}
        album['revision']=rev;album['media']=[]
        photos=[]
        for i,m in enumerate(a['media'],1):
            src=source_file(m['source'])
            probe=video_probe(src) if m['type']=='video' else None
            image=poster_image(src,m,probe) if probe else ImageOps.exif_transpose(Image.open(src)).convert('RGB')
            item={k:m[k] for k in ['id','type','title','alt']};item['number']=i
            item['width'],item['height']=image.size
            item['thumb']=write_image(folder/(m['id']+'-640.jpg'),image,(640,640),84)
            item['preview']=write_image(folder/(m['id']+'-1440.jpg'),image,(1440,1440),90)
            if m['type']=='photo':
                exported=write_image(folder/(m['id']+'.jpg'),image,quality=94)
                item['full']=exported
                if m.get('downloadApproved') is True:
                    item['download']=exported;photos.append((f'FORM-{a["slug"]}-{i:02}.jpg',ROOT/exported['url'].lstrip('/')))
            else:
                item['posterSelection']={k:m[k] for k in ('posterTime','posterSource','posterSha256') if k in m}
                streams=probe['streams']; video=next(s for s in streams if s['codec_type']=='video')
                item['width'],item['height']=video['width'],video['height']
                item['duration']=round(float(probe['format']['duration']),3)
                silent=not any(s['codec_type']=='audio' for s in streams)
                assert silent==m.get('silent'), 'Audio disclosure must match the file'
                # Audio-bearing publication requires reviewed captions/descriptive alternative, not silent fixtures.
                if not silent: raise ValueError('Supply a reviewed captioned-video integration before publishing audio-bearing media')
                item['silent']=True;item['full']=info(src)
                if m.get('downloadApproved') is True:item['download']=item['full']
            if m['id']==a['cover']:
                cover=ImageOps.fit(image,(1200,630),Image.Resampling.LANCZOS,centering=(.5,.5))
                album['share']=write_image(folder/'share.jpg',cover,quality=91)
                album['share'].update({'width':1200,'height':630,'alt':m['alt']})
            album['media'].append(item)
        if photos:
            archive=folder/'photos.zip'
            with zipfile.ZipFile(archive,'w',zipfile.ZIP_STORED) as z:
                for filename,p in photos:
                    zi=zipfile.ZipInfo(filename,date_time=(2026,1,1,0,0,0));zi.external_attr=0o644<<16
                    z.writestr(zi,p.read_bytes())
            album['photoArchive']=info(archive)
        result['albums'].append(album)
    result['albums'].sort(key=lambda a:(a['date'] or '',a['slug']),reverse=True)
    active={(a['slug'],a['revision']) for a in result['albums']}
    # Remove stale generated editions and old ZIPs from the next deploy, not the originals.
    for old in previous['albums']:
        if (old['slug'],old['revision']) not in active:
            assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',old['slug'])
            assert re.fullmatch(r'[a-f0-9]{12}',old['revision'])
            stale=OUT/old['slug']/old['revision']
            if stale.exists():shutil.rmtree(stale)
    (ROOT/'track/media-manifest.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(f'Prepared {len(result["albums"])} published album(s). No source image or film was modified.')
if __name__=='__main__':build()
